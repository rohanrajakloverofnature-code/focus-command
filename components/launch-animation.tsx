import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";

import { getEmotionalPatternForecast, getWellbeingInsight, useFocusCommand } from "@/lib/focus-command";
import { LAUNCH_QUOTE_HISTORY_KEY, nextLaunchQuoteHistory, parseLaunchQuoteHistory, selectLaunchQuote, type LaunchQuote } from "@/lib/launch-quotes";
import { getLaunchFireSoundStopDelay, getLaunchFireStageHeight, getLaunchQuoteHoldDuration, getLaunchQuoteVisibleDelay, getLaunchSequenceDuration } from "@/lib/launch-sequence";
import { claimLaunchSequence, setLaunchSequenceActive } from "@/lib/launch-session";

const launchFireAudio = require("../assets/sounds/launch-fire-crackle.mp3");
const launchQuoteTransitionAudio = require("../assets/sounds/launch-quote-transition.m4a");
// The original approved cinematic fire footage, converted frame-for-frame to animated
// transparent WebP. Android decodes this as a real animated image, unlike the former
// single-frame PNG fallback, while the Home screen remains visible behind the fire.
const cinematicFireAlphaPlate = require("../assets/images/launch-fire-alpha.webp");
// Native players can take a few frames to become audible even when preloaded. Revealing
// the alpha fire fractionally after playback begins keeps the first visible flame and
// first audible crackle perceptually aligned on physical Android devices.
const NATIVE_FIRE_AUDIO_VISUAL_LEAD_MS = 96;
type LaunchAudioPlayer = ReturnType<typeof createAudioPlayer>;

export function LaunchAnimation({ onFinished }: { onFinished?: () => void }) {
  const { state, ready } = useFocusCommand();
  const { width, height } = useWindowDimensions();
  const [quote, setQuote] = useState<LaunchQuote | null>(null);
  const [visible, setVisible] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const fireAudioPlayerRef = useRef<LaunchAudioPlayer | null>(null);
  const quoteAudioPlayerRef = useRef<LaunchAudioPlayer | null>(null);
  const audioRunRef = useRef(0);
  const hasFinishedRef = useRef(false);
  const hasSessionClaimRef = useRef(false);
  const hasStartedSelectionRef = useRef(false);

  const backdrop = useSharedValue(0);
  const fireOpacity = useSharedValue(0);
  const quoteOpacity = useSharedValue(0);
  const quoteScale = useSharedValue(0.95);
  const glazeOpacity = useSharedValue(0);
  const glazeProgress = useSharedValue(-1);
  const reduceMotion = state.profile.reduceMotion;
  const highContrast = state.profile.highContrast;
  const forecast = useMemo(() => getEmotionalPatternForecast(state), [state]);
  const wellbeing = useMemo(() => getWellbeingInsight(state), [state]);
  const stageHeight = getLaunchFireStageHeight(height);
  const launchDuration = getLaunchSequenceDuration(reduceMotion);
  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const stopPlayer = useCallback((reference: { current: LaunchAudioPlayer | null }) => {
    const player = reference.current;
    reference.current = null;
    if (!player) return;
    try {
      player.pause();
      player.remove();
    } catch {
      // Sound is optional and must never block the launch cleanup path.
    }
  }, []);

  const stopLaunchAudio = useCallback(() => {
    audioRunRef.current += 1;
    stopPlayer(fireAudioPlayerRef);
    stopPlayer(quoteAudioPlayerRef);
  }, [stopPlayer]);

  useEffect(() => {
    if (!state.profile.soundEnabled) return;
    try {
      // Preload before the first fire frame becomes visible so neither player creation nor
      // decoding can push audio behind its corresponding visual moment on Android.
      const firePlayer = createAudioPlayer(launchFireAudio);
      firePlayer.volume = 0.5;
      firePlayer.loop = true;
      fireAudioPlayerRef.current = firePlayer;

      const quotePlayer = createAudioPlayer(launchQuoteTransitionAudio);
      quotePlayer.volume = 0.44;
      quoteAudioPlayerRef.current = quotePlayer;
    } catch {
      // Each cue has a deferred fallback below if preloading is unavailable.
    }
    void setAudioModeAsync({ playsInSilentMode: false });
    return () => {
      stopPlayer(fireAudioPlayerRef);
      stopPlayer(quoteAudioPlayerRef);
    };
  }, [state.profile.soundEnabled, stopPlayer]);

  const playAudioCue = useCallback(async (source: number, target: { current: LaunchAudioPlayer | null }, volume: number, loop = false) => {
    if (!state.profile.soundEnabled) return;
    const audioRun = ++audioRunRef.current;
    try {
      // False intentionally respects the iOS silent switch; Android and web follow their system volume state.
      await setAudioModeAsync({ playsInSilentMode: false });
      if (audioRun !== audioRunRef.current || hasFinishedRef.current) return;
      const player = createAudioPlayer(source);
      if (audioRun !== audioRunRef.current || hasFinishedRef.current) {
        player.remove();
        return;
      }
      player.volume = volume;
      player.loop = loop;
      target.current = player;
      player.play();
    } catch {
      // Autoplay restrictions, mute settings, or a failed source safely fall back to a silent visual launch.
    }
  }, [state.profile.soundEnabled]);

  const playFireAudio = useCallback(() => {
    const player = fireAudioPlayerRef.current;
    if (player) {
      try {
        player.seekTo(0);
        player.play();
        return;
      } catch {
        stopPlayer(fireAudioPlayerRef);
      }
    }
    void playAudioCue(launchFireAudio, fireAudioPlayerRef, 0.5, true);
  }, [playAudioCue, stopPlayer]);
  const playQuoteTransitionAudio = useCallback(() => {
    stopPlayer(fireAudioPlayerRef);
    const player = quoteAudioPlayerRef.current;
    if (player) {
      try {
        player.seekTo(0);
        player.play();
        return;
      } catch {
        stopPlayer(quoteAudioPlayerRef);
      }
    }
    void playAudioCue(launchQuoteTransitionAudio, quoteAudioPlayerRef, 0.44);
  }, [playAudioCue, stopPlayer]);

  const finish = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    clearTimers();
    stopLaunchAudio();
    setLaunchSequenceActive(false);
    cancelAnimation(backdrop);
    cancelAnimation(fireOpacity);
    cancelAnimation(quoteOpacity);
    cancelAnimation(quoteScale);
    cancelAnimation(glazeOpacity);
    cancelAnimation(glazeProgress);
    setVisible(false);
    onFinished?.();
  }, [backdrop, clearTimers, fireOpacity, glazeOpacity, glazeProgress, onFinished, quoteOpacity, quoteScale, stopLaunchAudio]);

  useEffect(() => {
    if (!ready) return;
    if (!hasSessionClaimRef.current) {
      if (!claimLaunchSequence()) return;
      hasSessionClaimRef.current = true;
    }
    if (hasStartedSelectionRef.current) return;
    hasStartedSelectionRef.current = true;
    let active = true;
    const selectQuote = async () => {
      let history: string[] = [];
      try {
        history = parseLaunchQuoteHistory(await AsyncStorage.getItem(LAUNCH_QUOTE_HISTORY_KEY));
      } catch {
        history = [];
      }
      const selected = selectLaunchQuote({ forecast, wellbeing, recentQuoteIds: history });
      try {
        await AsyncStorage.setItem(LAUNCH_QUOTE_HISTORY_KEY, JSON.stringify(nextLaunchQuoteHistory(history, selected.id)));
      } catch {
        // Quote history is an enhancement; storage unavailability must not delay launch playback.
      }
      if (!active) return;
      setQuote(selected);
      setLaunchSequenceActive(true);
      setVisible(true);
    };
    void selectQuote();
    return () => {
      active = false;
    };
  }, [forecast, ready, wellbeing]);

  useEffect(() => {
    if (!visible) return;
    hasFinishedRef.current = false;
    backdrop.value = 0;
    fireOpacity.value = 0;
    quoteOpacity.value = 0;
    quoteScale.value = 0.95;
    glazeOpacity.value = 0;
    glazeProgress.value = -1;
    if (reduceMotion) {
      backdrop.value = withSequence(withTiming(0.08, { duration: 100 }), withDelay(880, withTiming(0, { duration: 180 })));
      fireOpacity.value = withSequence(withTiming(0.72, { duration: 130 }), withDelay(140, withTiming(0, { duration: 190 })));
      quoteOpacity.value = withSequence(withDelay(getLaunchQuoteVisibleDelay(true), withTiming(1, { duration: 150 })), withDelay(170, withTiming(0, { duration: 150 })));
      quoteScale.value = withSequence(withDelay(getLaunchQuoteVisibleDelay(true), withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) })), withDelay(160, withTiming(0.99, { duration: 140 })));
      glazeOpacity.value = withSequence(withDelay(900, withTiming(0.34, { duration: 100 })), withTiming(0, { duration: 170 }));
      glazeProgress.value = withDelay(900, withTiming(1, { duration: 230, easing: Easing.inOut(Easing.quad) }));
    } else {
      const nativeFireVisualLead = Platform.OS === "web" ? 0 : NATIVE_FIRE_AUDIO_VISUAL_LEAD_MS;
      backdrop.value = withSequence(withTiming(0.03, { duration: 260, easing: Easing.out(Easing.cubic) }), withDelay(10_520, withTiming(0, { duration: 620, easing: Easing.inOut(Easing.cubic) })));
      fireOpacity.value = withSequence(withDelay(nativeFireVisualLead, withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) })), withDelay(5_390 - nativeFireVisualLead, withTiming(0, { duration: 650, easing: Easing.inOut(Easing.cubic) })));
      quoteOpacity.value = withSequence(withDelay(getLaunchQuoteVisibleDelay(false), withTiming(1, { duration: 430, easing: Easing.out(Easing.cubic) })), withDelay(getLaunchQuoteHoldDuration(false), withTiming(0, { duration: 590, easing: Easing.inOut(Easing.cubic) })));
      quoteScale.value = withSequence(withDelay(getLaunchQuoteVisibleDelay(false), withTiming(1, { duration: 470, easing: Easing.out(Easing.cubic) })), withDelay(getLaunchQuoteHoldDuration(false) - 50, withTiming(0.99, { duration: 620, easing: Easing.inOut(Easing.cubic) })));
      glazeOpacity.value = withSequence(withDelay(10_180, withTiming(0.58, { duration: 360, easing: Easing.out(Easing.quad) })), withDelay(170, withTiming(0, { duration: 760, easing: Easing.inOut(Easing.cubic) })));
      glazeProgress.value = withDelay(10_240, withTiming(1, { duration: 1_150, easing: Easing.inOut(Easing.cubic) }));
    }

    // The alpha fire animation and preloaded crackle begin in this same launch tick, before the first opacity frame.
    playFireAudio();
    const fireStopTimer = setTimeout(() => stopPlayer(fireAudioPlayerRef), getLaunchFireSoundStopDelay(reduceMotion));
    // The quote cue begins with the first visible quote frame, rather than an earlier
    // abstract timeline marker, so its sound is always perceptually attached to the text.
    const quoteTimer = setTimeout(playQuoteTransitionAudio, getLaunchQuoteVisibleDelay(reduceMotion));
    const endTimer = setTimeout(finish, launchDuration);
    timersRef.current = [fireStopTimer, quoteTimer, endTimer];
    return () => {
      clearTimers();
      stopLaunchAudio();
      setLaunchSequenceActive(false);
    };
  }, [backdrop, clearTimers, finish, fireOpacity, glazeOpacity, glazeProgress, launchDuration, playFireAudio, playQuoteTransitionAudio, quoteOpacity, quoteScale, reduceMotion, stopLaunchAudio, stopPlayer, visible]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active" && visible) finish();
    });
    return () => subscription.remove();
  }, [finish, visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const firePlateStyle = useAnimatedStyle(() => {
    return {
      opacity: fireOpacity.value,
    };
  });
  const fireGradeStyle = useAnimatedStyle(() => ({ opacity: fireOpacity.value * 0.4 }));
  const quoteStyle = useAnimatedStyle(() => ({ opacity: quoteOpacity.value, transform: [{ scale: quoteScale.value }] }));
  const glazeStyle = useAnimatedStyle(() => ({ opacity: glazeOpacity.value, transform: [{ translateX: interpolate(glazeProgress.value, [-1, 1], [-width * 1.3, width * 1.3]) }] }));

  if (!visible || !quote) return null;

  return (
    <View accessibilityViewIsModal accessible accessibilityLabel={`Focus Command launch sequence. ${quote.text}`} style={styles.stage}>
      <Animated.View pointerEvents="none" style={[styles.darkVeil, backdropStyle]} />
      <View style={[styles.fireStage, { height: stageHeight }]}> 
        <Animated.View style={[styles.cinematicFirePlate, { width, height: stageHeight * 1.16, bottom: -stageHeight * 0.12 }, firePlateStyle]}>
          <Image autoplay cachePolicy="memory-disk" contentFit="contain" source={cinematicFireAlphaPlate} style={styles.cinematicFireImage} />
        </Animated.View>
        <Animated.View style={[styles.fireGrade, fireGradeStyle]}>
          <Svg height={stageHeight} width={width} viewBox={`0 0 ${Math.max(1, width)} ${Math.max(1, stageHeight)}`}>
            <Defs>
              <RadialGradient id="launch-fire-ember-bed" cx="50%" cy="100%" rx="74%" ry="66%">
                <Stop offset="0" stopColor="#F06A2C" stopOpacity="0.36" />
                <Stop offset="0.46" stopColor="#B13E1D" stopOpacity="0.14" />
                <Stop offset="1" stopColor="#05070A" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width={width} height={stageHeight} fill="url(#launch-fire-ember-bed)" />
          </Svg>
        </Animated.View>
      </View>
      <Animated.View style={[styles.quoteFrame, quoteStyle]}>
        <View pointerEvents="none" style={styles.quoteVignette}>
          <Svg height="100%" width="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              <RadialGradient id="launch-quote-vignette" cx="50%" cy="50%" rx="64%" ry="58%">
                <Stop offset="0" stopColor="#05080D" stopOpacity="0.52" />
                <Stop offset="0.54" stopColor="#05080D" stopOpacity="0.34" />
                <Stop offset="1" stopColor="#05080D" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100" height="100" fill="url(#launch-quote-vignette)" />
          </Svg>
        </View>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.2} style={[styles.quote, highContrast && styles.quoteHighContrast]}>{quote.text}</Text>
      </Animated.View>
      <Animated.View style={[styles.glaze, { width: Math.max(width * 0.94, 320), height }, glazeStyle]}>
        <Svg height={height} width={Math.max(width * 0.94, 320)} viewBox={`0 0 ${Math.max(width * 0.94, 320)} ${Math.max(1, height)}`}>
          <Defs>
            <LinearGradient id="launch-glaze-primary" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#F7F2E8" stopOpacity="0" />
              <Stop offset="0.32" stopColor="#F7F2E8" stopOpacity="0.02" />
              <Stop offset="0.52" stopColor="#FFFDF7" stopOpacity="0.34" />
              <Stop offset="0.68" stopColor="#F7E6C7" stopOpacity="0.05" />
              <Stop offset="1" stopColor="#F7E6C7" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path d={`M${width * 0.14} 0H${width * 0.72}L${width * 0.5} ${height}H-${width * 0.08}Z`} fill="url(#launch-glaze-primary)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { ...StyleSheet.absoluteFillObject, zIndex: 10_000, elevation: 10_000, overflow: "hidden", justifyContent: "center" },
  darkVeil: { ...StyleSheet.absoluteFillObject, backgroundColor: "#1A0A04" },
  fireStage: { position: "absolute", left: 0, right: 0, bottom: 0, overflow: "hidden" },
  cinematicFirePlate: { position: "absolute", left: 0, bottom: 0 },
  cinematicFireImage: {
    flex: 1,
    backgroundColor: "transparent",
  },
  fireGrade: { ...StyleSheet.absoluteFillObject },
  quoteFrame: { position: "absolute", left: 38, right: 38, top: "34%", minHeight: 126, justifyContent: "center", alignItems: "center" },
  quoteVignette: { position: "absolute", left: -42, right: -42, top: -46, bottom: -46 },
  quote: { color: "#FFFDF8", textAlign: "center", fontSize: 27, lineHeight: 38, fontWeight: "800", letterSpacing: 0.12, textShadowColor: "#000000", textShadowRadius: 32, textShadowOffset: { width: 0, height: 6 } },
  quoteHighContrast: { color: "#FFFFFF", textShadowColor: "#000000", textShadowRadius: 36, textShadowOffset: { width: 0, height: 6 } },
  glaze: { position: "absolute", top: 0 },
});
