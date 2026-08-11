import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { VideoView, useVideoPlayer } from "expo-video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";

import { getEmotionalPatternForecast, getWellbeingInsight, useFocusCommand } from "@/lib/focus-command";
import { LAUNCH_QUOTE_HISTORY_KEY, nextLaunchQuoteHistory, parseLaunchQuoteHistory, selectLaunchQuote, type LaunchQuote } from "@/lib/launch-quotes";
import { getLaunchFireStageHeight, getLaunchQuoteCueDelay, getLaunchSequenceDuration } from "@/lib/launch-sequence";
import { claimLaunchSequence } from "@/lib/launch-session";

const launchFireAudio = require("../assets/sounds/launch-fire-crackle.mp3");
const launchQuoteAudio = require("../assets/sounds/launch-quote-reveal.m4a");
const cinematicFirePlate = require("../assets/videos/cinematic-launch-fire.mp4");

const EMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const SMOKE_WISPS = [0, 1, 2, 3] as const;

type SharedProgress = ReturnType<typeof useSharedValue<number>>;
type LaunchAudioPlayer = ReturnType<typeof createAudioPlayer>;

function Ember({ index, progress, drift, stageWidth, reduceMotion }: { index: number; progress: SharedProgress; drift: SharedProgress; stageWidth: number; reduceMotion: boolean }) {
  const style = useAnimatedStyle(() => {
    const phase = (drift.value + index * 0.113) % 1;
    const horizontal = reduceMotion ? 0 : Math.sin(phase * Math.PI * 4 + index) * (4 + (index % 5) * 2.2);
    return {
      opacity: progress.value * Math.max(0, 0.62 - phase * 0.62),
      transform: [{ translateX: horizontal }, { translateY: -phase * (78 + (index % 4) * 34) }, { scale: 0.5 + (1 - phase) * 0.75 }],
    };
  });
  const left = stageWidth * ((index + 0.45) / (EMBERS.length + 0.1));
  const size = index % 3 === 0 ? 3 : 2;
  return <Animated.View style={[styles.ember, { left, bottom: 18 + (index % 4) * 10, width: size, height: size }, style]} />;
}

function SmokeWisp({ index, progress, drift, stageWidth, reduceMotion }: { index: number; progress: SharedProgress; drift: SharedProgress; stageWidth: number; reduceMotion: boolean }) {
  const style = useAnimatedStyle(() => {
    const phase = (drift.value + index * 0.218) % 1;
    return {
      opacity: progress.value * Math.max(0, 0.13 - phase * 0.1),
      transform: [
        { translateX: reduceMotion ? 0 : Math.sin(phase * Math.PI * 2.2 + index) * 15 },
        { translateY: -phase * (76 + index * 9) },
        { scale: 0.72 + phase * 0.76 },
      ],
    };
  });
  return <Animated.View style={[styles.smoke, { left: stageWidth * (0.1 + index * 0.23), bottom: 80 + (index % 2) * 22 }, style]} />;
}

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

  const backdrop = useSharedValue(0);
  const fireOpacity = useSharedValue(0);
  const fireFlicker = useSharedValue(0);
  const emberDrift = useSharedValue(0);
  const quoteOpacity = useSharedValue(0);
  const quoteScale = useSharedValue(0.95);
  const quoteBloom = useSharedValue(0);
  const glazeOpacity = useSharedValue(0);
  const glazeProgress = useSharedValue(-1);

  const reduceMotion = state.profile.reduceMotion;
  const highContrast = state.profile.highContrast;
  const forecast = useMemo(() => getEmotionalPatternForecast(state), [state]);
  const wellbeing = useMemo(() => getWellbeingInsight(state), [state]);
  const stageHeight = getLaunchFireStageHeight(height);
  const launchDuration = getLaunchSequenceDuration(reduceMotion);
  const fireVideoPlayer = useVideoPlayer(cinematicFirePlate, (player) => {
    player.loop = true;
    player.muted = true;
  });

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

  const playAudioCue = useCallback(async (source: number, target: { current: LaunchAudioPlayer | null }, volume: number) => {
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
      target.current = player;
      player.play();
    } catch {
      // Autoplay restrictions, mute settings, or a failed source safely fall back to a silent visual launch.
    }
  }, [state.profile.soundEnabled]);

  const playFireAudio = useCallback(() => void playAudioCue(launchFireAudio, fireAudioPlayerRef, 0.34), [playAudioCue]);
  const playQuoteAudio = useCallback(() => void playAudioCue(launchQuoteAudio, quoteAudioPlayerRef, 0.22), [playAudioCue]);

  const finish = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    clearTimers();
    stopLaunchAudio();
    try {
      fireVideoPlayer.pause();
    } catch {
      // A video decoder can already be released by the platform during an interruption.
    }
    cancelAnimation(backdrop);
    cancelAnimation(fireOpacity);
    cancelAnimation(fireFlicker);
    cancelAnimation(emberDrift);
    cancelAnimation(quoteOpacity);
    cancelAnimation(quoteScale);
    cancelAnimation(quoteBloom);
    cancelAnimation(glazeOpacity);
    cancelAnimation(glazeProgress);
    setVisible(false);
    onFinished?.();
  }, [backdrop, clearTimers, emberDrift, fireFlicker, fireOpacity, fireVideoPlayer, glazeOpacity, glazeProgress, onFinished, quoteBloom, quoteOpacity, quoteScale, stopLaunchAudio]);

  useEffect(() => {
    if (!ready) return;
    if (!hasSessionClaimRef.current) {
      if (!claimLaunchSequence()) return;
      hasSessionClaimRef.current = true;
    }
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
    quoteBloom.value = 0;
    glazeOpacity.value = 0;
    glazeProgress.value = -1;
    fireFlicker.value = 0;
    emberDrift.value = 0;

    try {
      fireVideoPlayer.currentTime = 0;
      fireVideoPlayer.play();
    } catch {
      // The grade, ember, and smoke layers remain a graceful visual fallback if the video decoder is unavailable.
    }

    if (reduceMotion) {
      backdrop.value = withSequence(withTiming(0.72, { duration: 120 }), withDelay(590, withTiming(0, { duration: 160 })));
      fireOpacity.value = withSequence(withDelay(55, withTiming(0.52, { duration: 140 })), withDelay(430, withTiming(0, { duration: 160 })));
      quoteOpacity.value = withSequence(withDelay(80, withTiming(1, { duration: 150 })), withDelay(460, withTiming(0, { duration: 150 })));
      quoteScale.value = withSequence(withDelay(80, withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) })), withDelay(460, withTiming(0.99, { duration: 150 })));
      quoteBloom.value = withSequence(withDelay(80, withTiming(0.32, { duration: 160 })), withDelay(380, withTiming(0, { duration: 200 })));
      glazeOpacity.value = withSequence(withDelay(620, withTiming(0.58, { duration: 100 })), withTiming(0, { duration: 130 }));
      glazeProgress.value = withDelay(620, withTiming(1, { duration: 210, easing: Easing.inOut(Easing.quad) }));
    } else {
      backdrop.value = withSequence(withTiming(0.76, { duration: 300, easing: Easing.out(Easing.cubic) }), withDelay(3_880, withTiming(0, { duration: 420, easing: Easing.inOut(Easing.quad) })));
      fireOpacity.value = withSequence(withDelay(160, withTiming(1, { duration: 1_080, easing: Easing.out(Easing.cubic) })), withDelay(1_640, withTiming(0, { duration: 940, easing: Easing.inOut(Easing.cubic) })));
      quoteOpacity.value = withSequence(withDelay(790, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })), withDelay(1_570, withTiming(0, { duration: 620, easing: Easing.inOut(Easing.quad) })));
      quoteScale.value = withSequence(withDelay(790, withTiming(1, { duration: 540, easing: Easing.out(Easing.cubic) })), withDelay(1_500, withTiming(0.985, { duration: 690, easing: Easing.inOut(Easing.quad) })));
      quoteBloom.value = withSequence(withDelay(760, withTiming(0.42, { duration: 620, easing: Easing.out(Easing.quad) })), withDelay(1_430, withTiming(0, { duration: 820, easing: Easing.inOut(Easing.cubic) })));
      glazeOpacity.value = withSequence(withDelay(3_340, withTiming(0.78, { duration: 300, easing: Easing.out(Easing.quad) })), withDelay(120, withTiming(0, { duration: 520, easing: Easing.inOut(Easing.cubic) })));
      glazeProgress.value = withDelay(3_250, withTiming(1, { duration: 920, easing: Easing.inOut(Easing.cubic) }));
      fireFlicker.value = withRepeat(withSequence(withTiming(1, { duration: 920, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1_130, easing: Easing.inOut(Easing.sin) })), -1, true);
      emberDrift.value = withRepeat(withTiming(1, { duration: 2_050, easing: Easing.linear }), -1, false);
    }

    const fireTimer = setTimeout(playFireAudio, reduceMotion ? 60 : 210);
    const quoteTimer = setTimeout(playQuoteAudio, getLaunchQuoteCueDelay(reduceMotion));
    const endTimer = setTimeout(finish, launchDuration);
    timersRef.current = [fireTimer, quoteTimer, endTimer];
    return () => {
      clearTimers();
      stopLaunchAudio();
      try {
        fireVideoPlayer.pause();
      } catch {
        // Native video cleanup can race with an app-state interruption.
      }
    };
  }, [backdrop, clearTimers, emberDrift, finish, fireFlicker, fireOpacity, fireVideoPlayer, glazeOpacity, glazeProgress, launchDuration, playFireAudio, playQuoteAudio, quoteBloom, quoteOpacity, quoteScale, reduceMotion, stopLaunchAudio, visible]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active" && visible) finish();
    });
    return () => subscription.remove();
  }, [finish, visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const firePlateStyle = useAnimatedStyle(() => {
    const swell = reduceMotion ? 0 : Math.sin(fireFlicker.value * Math.PI * 2) * 0.018;
    return { opacity: fireOpacity.value * (0.95 + swell), transform: [{ translateY: (1 - fireOpacity.value) * stageHeight * 0.18 }, { scaleX: 1 + swell }] };
  });
  const fireGradeStyle = useAnimatedStyle(() => ({ opacity: fireOpacity.value * 0.82 }));
  const quoteStyle = useAnimatedStyle(() => ({ opacity: quoteOpacity.value, transform: [{ scale: quoteScale.value }] }));
  const quoteBloomStyle = useAnimatedStyle(() => ({ opacity: quoteBloom.value, transform: [{ scale: 0.9 + quoteBloom.value * 0.14 }] }));
  const glazeStyle = useAnimatedStyle(() => ({ opacity: glazeOpacity.value, transform: [{ translateX: interpolate(glazeProgress.value, [-1, 1], [-width * 1.3, width * 1.3]) }] }));

  if (!visible || !quote) return null;

  return (
    <View accessibilityViewIsModal accessible accessibilityLabel={`Focus Command launch sequence. ${quote.text}`} style={styles.stage}>
      <Animated.View style={[styles.darkVeil, backdropStyle]} />
      <View style={[styles.fireStage, { height: stageHeight }]}>
        <Animated.View style={[styles.cinematicFirePlate, { width, height: stageHeight }, firePlateStyle]}>
          <VideoView contentFit="cover" nativeControls={false} player={fireVideoPlayer} surfaceType="textureView" style={styles.cinematicFireVideo} />
        </Animated.View>
        <Animated.View style={[styles.fireGrade, fireGradeStyle]}>
          <Svg height={stageHeight} width={width} viewBox={`0 0 ${Math.max(1, width)} ${Math.max(1, stageHeight)}`}>
            <Defs>
              <RadialGradient id="launch-fire-ember-bed" cx="50%" cy="100%" rx="74%" ry="66%">
                <Stop offset="0" stopColor="#E83712" stopOpacity="0.52" />
                <Stop offset="0.46" stopColor="#89200D" stopOpacity="0.28" />
                <Stop offset="1" stopColor="#05070A" stopOpacity="0" />
              </RadialGradient>
              <LinearGradient id="launch-fire-vignette" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#00050A" stopOpacity="0.82" />
                <Stop offset="0.52" stopColor="#08090C" stopOpacity="0.12" />
                <Stop offset="1" stopColor="#160804" stopOpacity="0.1" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={width} height={stageHeight} fill="url(#launch-fire-ember-bed)" />
            <Rect x="0" y="0" width={width} height={stageHeight} fill="url(#launch-fire-vignette)" />
          </Svg>
        </Animated.View>
        {EMBERS.map((index) => <Ember key={index} index={index} progress={fireOpacity} drift={emberDrift} stageWidth={width} reduceMotion={reduceMotion} />)}
        {SMOKE_WISPS.map((index) => <SmokeWisp key={index} index={index} progress={fireOpacity} drift={emberDrift} stageWidth={width} reduceMotion={reduceMotion} />)}
      </View>
      <Animated.View style={[styles.quoteBloom, quoteBloomStyle]} />
      <Animated.View style={[styles.quoteFrame, quoteStyle]}>
        <View style={styles.quoteRule} />
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.2} style={[styles.quote, highContrast && styles.quoteHighContrast]}>{quote.text}</Text>
        <View style={styles.quoteRule} />
      </Animated.View>
      <Animated.View style={[styles.glaze, { width: Math.max(width * 0.94, 320), height }, glazeStyle]}>
        <Svg height={height} width={Math.max(width * 0.94, 320)} viewBox={`0 0 ${Math.max(width * 0.94, 320)} ${Math.max(1, height)}`}>
          <Defs>
            <LinearGradient id="launch-glaze-primary" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#F8D78C" stopOpacity="0" />
              <Stop offset="0.38" stopColor="#F8D78C" stopOpacity="0.04" />
              <Stop offset="0.5" stopColor="#FFF5D9" stopOpacity="0.88" />
              <Stop offset="0.59" stopColor="#FFCC71" stopOpacity="0.25" />
              <Stop offset="1" stopColor="#FFCC71" stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="launch-glaze-secondary" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#E5B55A" stopOpacity="0" />
              <Stop offset="0.5" stopColor="#FFE1A2" stopOpacity="0.38" />
              <Stop offset="1" stopColor="#E5B55A" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path d={`M${width * 0.18} 0H${width * 0.66}L${width * 0.42} ${height}H-${width * 0.06}Z`} fill="url(#launch-glaze-primary)" />
          <Path d={`M${width * 0.54} 0H${width * 0.72}L${width * 0.49} ${height}H${width * 0.31}Z`} fill="url(#launch-glaze-secondary)" opacity="0.72" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { ...StyleSheet.absoluteFillObject, zIndex: 10_000, elevation: 10_000, overflow: "hidden", justifyContent: "center" },
  darkVeil: { ...StyleSheet.absoluteFillObject, backgroundColor: "#02050A" },
  fireStage: { position: "absolute", left: 0, right: 0, bottom: 0, overflow: "hidden", backgroundColor: "#030508" },
  cinematicFirePlate: { position: "absolute", left: 0, bottom: 0 },
  cinematicFireVideo: { flex: 1, backgroundColor: "#030508" },
  fireGrade: { ...StyleSheet.absoluteFillObject },
  ember: { position: "absolute", borderRadius: 8, backgroundColor: "#FFE0A0", shadowColor: "#FF7426", shadowOpacity: 0.95, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  smoke: { position: "absolute", width: 54, height: 18, borderRadius: 24, backgroundColor: "#17191D" },
  quoteBloom: { position: "absolute", top: "19%", alignSelf: "center", width: 290, height: 190, borderRadius: 145, backgroundColor: "#D77A2A", shadowColor: "#F5A34D", shadowOpacity: 0.75, shadowRadius: 44, shadowOffset: { width: 0, height: 0 } },
  quoteFrame: { position: "absolute", left: 32, right: 32, top: "26%", alignItems: "center", gap: 16 },
  quoteRule: { height: 1, width: 42, backgroundColor: "#F6C46C", shadowColor: "#FFD993", shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  quote: { color: "#FFF9E9", textAlign: "center", fontSize: 29, lineHeight: 39, fontWeight: "800", letterSpacing: 0.2, textShadowColor: "#05070DDD", textShadowRadius: 14, textShadowOffset: { width: 0, height: 3 } },
  quoteHighContrast: { color: "#FFFFFF", textShadowColor: "#000000", textShadowRadius: 3, textShadowOffset: { width: 1, height: 1 } },
  glaze: { position: "absolute", top: 0 },
});
