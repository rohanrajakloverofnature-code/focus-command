import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
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
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

import { getEmotionalPatternForecast, getWellbeingInsight, useFocusCommand } from "@/lib/focus-command";
import { LAUNCH_QUOTE_HISTORY_KEY, nextLaunchQuoteHistory, parseLaunchQuoteHistory, selectLaunchQuote, type LaunchQuote } from "@/lib/launch-quotes";
import { getLaunchFireStageHeight, getLaunchSequenceDuration } from "@/lib/launch-sequence";
import { claimLaunchSequence } from "@/lib/launch-session";

const launchFireAudio = require("../assets/sounds/launch-fire-crackle.mp3");
const FLAME_CLUSTERS = [0, 1, 2, 3] as const;
const EMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const SMOKE_WISPS = [0, 1, 2] as const;

type SharedProgress = ReturnType<typeof useSharedValue<number>>;

function FlameCluster({
  index,
  progress,
  flicker,
  width,
  stageHeight,
  reduceMotion,
}: {
  index: number;
  progress: SharedProgress;
  flicker: SharedProgress;
  width: number;
  stageHeight: number;
  reduceMotion: boolean;
}) {
  const clusterWidth = Math.max(128, width * 0.39);
  const clusterHeight = stageHeight * (index % 2 ? 0.88 : 1);
  const left = (width - clusterWidth) * (index / 3) - clusterWidth * 0.05;
  const style = useAnimatedStyle(() => {
    const wave = reduceMotion ? 0 : Math.sin((flicker.value + index * 0.19) * Math.PI * 2);
    return {
      opacity: progress.value * (0.74 + (index % 2) * 0.08),
      transform: [
        { translateY: (1 - progress.value) * clusterHeight * 0.48 },
        { translateX: wave * (4 + index) },
        { scaleY: 0.84 + progress.value * 0.16 + wave * 0.035 },
        { scaleX: 0.96 + wave * 0.04 },
      ],
    };
  });

  return (
    <Animated.View style={[styles.flameCluster, { left, width: clusterWidth, height: clusterHeight }, style]}>
      <Svg width={clusterWidth} height={clusterHeight} viewBox="0 0 160 300">
        <Defs>
          <LinearGradient id={`flame-outer-${index}`} x1="0" y1="1" x2="0.55" y2="0">
            <Stop offset="0" stopColor="#7E1207" stopOpacity="0.98" />
            <Stop offset="0.35" stopColor="#FF4B10" stopOpacity="0.98" />
            <Stop offset="0.72" stopColor="#FF9D14" stopOpacity="0.7" />
            <Stop offset="1" stopColor="#FFB929" stopOpacity="0.02" />
          </LinearGradient>
          <LinearGradient id={`flame-inner-${index}`} x1="0.5" y1="1" x2="0.5" y2="0">
            <Stop offset="0" stopColor="#FFF5AE" stopOpacity="1" />
            <Stop offset="0.45" stopColor="#FFD348" stopOpacity="0.94" />
            <Stop offset="1" stopColor="#FF9317" stopOpacity="0.04" />
          </LinearGradient>
        </Defs>
        <Path d="M8 300C0 236 35 232 24 170C52 208 42 139 74 102C67 162 109 148 91 59C130 105 137 161 123 197C152 163 158 214 151 300H8Z" fill={`url(#flame-outer-${index})`} />
        <Path d="M42 300C30 248 64 233 57 186C78 216 83 174 102 132C97 191 126 218 113 300H42Z" fill={`url(#flame-inner-${index})`} />
        <Path d="M70 300C61 259 86 246 82 211C96 230 106 251 99 300H70Z" fill="#FFFFD9" opacity={0.82} />
      </Svg>
    </Animated.View>
  );
}

function Ember({ index, progress, drift, stageWidth, reduceMotion }: { index: number; progress: SharedProgress; drift: SharedProgress; stageWidth: number; reduceMotion: boolean }) {
  const style = useAnimatedStyle(() => {
    const phase = (drift.value + index * 0.137) % 1;
    const horizontal = reduceMotion ? 0 : Math.sin(phase * Math.PI * 3) * (5 + (index % 4) * 2);
    return {
      opacity: progress.value * Math.max(0, 0.72 - phase * 0.72),
      transform: [{ translateX: horizontal }, { translateY: -phase * (88 + (index % 3) * 28) }],
    };
  });
  const left = stageWidth * ((index + 0.7) / (EMBERS.length + 0.5));
  return <Animated.View style={[styles.ember, { left, bottom: 20 + (index % 3) * 12, width: 3 + (index % 2), height: 3 + (index % 2) }, style]} />;
}

function SmokeWisp({ index, progress, drift, stageWidth, reduceMotion }: { index: number; progress: SharedProgress; drift: SharedProgress; stageWidth: number; reduceMotion: boolean }) {
  const style = useAnimatedStyle(() => {
    const phase = (drift.value + index * 0.26) % 1;
    return {
      opacity: progress.value * (0.14 - phase * 0.1),
      transform: [
        { translateX: reduceMotion ? 0 : Math.sin(phase * Math.PI * 2) * 12 },
        { translateY: -phase * 64 },
        { scale: 0.78 + phase * 0.58 },
      ],
    };
  });
  return <Animated.View style={[styles.smoke, { left: stageWidth * (0.18 + index * 0.28), bottom: 128 + (index % 2) * 18 }, style]} />;
}

export function LaunchAnimation({ onFinished }: { onFinished?: () => void }) {
  const { state, ready } = useFocusCommand();
  const { width, height } = useWindowDimensions();
  const [quote, setQuote] = useState<LaunchQuote | null>(null);
  const [visible, setVisible] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audioPlayerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const audioRunRef = useRef(0);
  const hasFinishedRef = useRef(false);
  const hasSessionClaimRef = useRef(false);

  const backdrop = useSharedValue(0);
  const flameProgress = useSharedValue(0);
  const flameFlicker = useSharedValue(0);
  const emberDrift = useSharedValue(0);
  const quoteOpacity = useSharedValue(0);
  const quoteScale = useSharedValue(0.94);
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

  const stopLaunchAudio = useCallback(() => {
    audioRunRef.current += 1;
    const player = audioPlayerRef.current;
    audioPlayerRef.current = null;
    if (!player) return;
    try {
      player.pause();
      player.remove();
    } catch {
      // Audio feedback is optional and must never block the launch or cleanup path.
    }
  }, []);

  const playLaunchAudio = useCallback(async () => {
    if (!state.profile.soundEnabled) return;
    const audioRun = ++audioRunRef.current;
    try {
      // False intentionally respects the iOS silent switch; Android/web follow their system volume state.
      await setAudioModeAsync({ playsInSilentMode: false });
      if (audioRun !== audioRunRef.current || hasFinishedRef.current) return;
      const player = createAudioPlayer(launchFireAudio);
      if (audioRun !== audioRunRef.current || hasFinishedRef.current) {
        player.remove();
        return;
      }
      player.volume = 0.34;
      audioPlayerRef.current = player;
      player.play();
    } catch {
      // Autoplay restrictions, mute settings, or a failed source safely fall back to a silent visual launch.
    }
  }, [state.profile.soundEnabled]);

  const finish = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    clearTimers();
    stopLaunchAudio();
    cancelAnimation(backdrop);
    cancelAnimation(flameProgress);
    cancelAnimation(flameFlicker);
    cancelAnimation(emberDrift);
    cancelAnimation(quoteOpacity);
    cancelAnimation(quoteScale);
    cancelAnimation(glazeOpacity);
    cancelAnimation(glazeProgress);
    setVisible(false);
    onFinished?.();
  }, [backdrop, clearTimers, emberDrift, flameFlicker, flameProgress, glazeOpacity, glazeProgress, onFinished, quoteOpacity, quoteScale, stopLaunchAudio]);

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
    flameProgress.value = 0;
    quoteOpacity.value = 0;
    quoteScale.value = 0.94;
    glazeOpacity.value = 0;
    glazeProgress.value = -1;
    flameFlicker.value = 0;
    emberDrift.value = 0;

    if (reduceMotion) {
      backdrop.value = withSequence(withTiming(0.66, { duration: 120 }), withDelay(590, withTiming(0, { duration: 160 })));
      flameProgress.value = withSequence(withDelay(55, withTiming(0.46, { duration: 140 })), withDelay(430, withTiming(0, { duration: 160 })));
      quoteOpacity.value = withSequence(withDelay(80, withTiming(1, { duration: 150 })), withDelay(460, withTiming(0, { duration: 150 })));
      quoteScale.value = withSequence(withDelay(80, withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) })), withDelay(460, withTiming(1, { duration: 150 })));
      glazeOpacity.value = withSequence(withDelay(620, withTiming(0.75, { duration: 100 })), withTiming(0, { duration: 130 }));
      glazeProgress.value = withDelay(620, withTiming(1, { duration: 210, easing: Easing.inOut(Easing.quad) }));
    } else {
      backdrop.value = withSequence(withTiming(0.72, { duration: 280, easing: Easing.out(Easing.cubic) }), withDelay(3_920, withTiming(0, { duration: 350, easing: Easing.inOut(Easing.quad) })));
      flameProgress.value = withSequence(withDelay(180, withTiming(1, { duration: 1_240, easing: Easing.out(Easing.cubic) })), withDelay(1_480, withTiming(0, { duration: 880, easing: Easing.inOut(Easing.cubic) })));
      quoteOpacity.value = withSequence(withDelay(780, withTiming(1, { duration: 460, easing: Easing.out(Easing.cubic) })), withDelay(1_610, withTiming(0, { duration: 600, easing: Easing.inOut(Easing.quad) })));
      quoteScale.value = withSequence(withDelay(780, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) })), withDelay(1_550, withTiming(0.98, { duration: 660, easing: Easing.inOut(Easing.quad) })));
      glazeOpacity.value = withSequence(withDelay(3_350, withTiming(0.9, { duration: 260 })), withDelay(160, withTiming(0, { duration: 470 })));
      glazeProgress.value = withDelay(3_280, withTiming(1, { duration: 760, easing: Easing.inOut(Easing.cubic) }));
      flameFlicker.value = withRepeat(withSequence(withTiming(1, { duration: 920, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1_140, easing: Easing.inOut(Easing.sin) })), -1, true);
      emberDrift.value = withRepeat(withTiming(1, { duration: 1_960, easing: Easing.linear }), -1, false);
    }

    const audioTimer = setTimeout(() => void playLaunchAudio(), reduceMotion ? 60 : 240);
    const endTimer = setTimeout(finish, launchDuration);
    timersRef.current = [audioTimer, endTimer];
    return () => {
      clearTimers();
      stopLaunchAudio();
    };
  }, [backdrop, clearTimers, emberDrift, finish, flameFlicker, flameProgress, glazeOpacity, glazeProgress, launchDuration, playLaunchAudio, quoteOpacity, quoteScale, reduceMotion, stopLaunchAudio, visible]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active" && visible) finish();
    });
    return () => subscription.remove();
  }, [finish, visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const flameBaseStyle = useAnimatedStyle(() => ({ opacity: flameProgress.value * 0.9, transform: [{ translateY: (1 - flameProgress.value) * stageHeight * 0.22 }] }));
  const quoteStyle = useAnimatedStyle(() => ({ opacity: quoteOpacity.value, transform: [{ scale: quoteScale.value }] }));
  const glazeStyle = useAnimatedStyle(() => ({ opacity: glazeOpacity.value, transform: [{ translateX: interpolate(glazeProgress.value, [-1, 1], [-width * 1.15, width * 1.15]) }, { rotate: "-12deg" }] }));

  if (!visible || !quote) return null;

  return (
    <View accessibilityViewIsModal accessible accessibilityLabel={`Focus Command launch sequence. ${quote.text}`} style={styles.stage}>
      <Animated.View style={[styles.darkVeil, backdropStyle]} />
      <View style={[styles.fireStage, { height: stageHeight }]}>
        <Animated.View style={[styles.flameBase, flameBaseStyle]}>
          <Svg height={stageHeight} width={width} viewBox={`0 0 ${Math.max(1, width)} ${Math.max(1, stageHeight)}`}>
            <Defs>
              <LinearGradient id="launch-fire-base" x1="0.5" y1="1" x2="0.5" y2="0">
                <Stop offset="0" stopColor="#6E1008" stopOpacity="0.98" />
                <Stop offset="0.24" stopColor="#EF3D0D" stopOpacity="0.96" />
                <Stop offset="0.57" stopColor="#FF9819" stopOpacity="0.48" />
                <Stop offset="1" stopColor="#FFB92D" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Path d={`M0 ${stageHeight}V${stageHeight * 0.38}C${width * 0.2} ${stageHeight * 0.28},${width * 0.3} ${stageHeight * 0.5},${width * 0.48} ${stageHeight * 0.32}C${width * 0.68} ${stageHeight * 0.16},${width * 0.77} ${stageHeight * 0.48},${width} ${stageHeight * 0.28}V${stageHeight}H0Z`} fill="url(#launch-fire-base)" />
          </Svg>
        </Animated.View>
        {FLAME_CLUSTERS.map((index) => <FlameCluster key={index} index={index} progress={flameProgress} flicker={flameFlicker} width={width} stageHeight={stageHeight} reduceMotion={reduceMotion} />)}
        {EMBERS.map((index) => <Ember key={index} index={index} progress={flameProgress} drift={emberDrift} stageWidth={width} reduceMotion={reduceMotion} />)}
        {SMOKE_WISPS.map((index) => <SmokeWisp key={index} index={index} progress={flameProgress} drift={emberDrift} stageWidth={width} reduceMotion={reduceMotion} />)}
      </View>
      <Animated.View style={[styles.quoteFrame, quoteStyle]}>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.2} style={[styles.quote, highContrast && styles.quoteHighContrast]}>{quote.text}</Text>
      </Animated.View>
      <Animated.View style={[styles.glaze, { width: Math.max(width * 0.72, 250), height: height * 1.3 }, glazeStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { ...StyleSheet.absoluteFillObject, zIndex: 10_000, elevation: 10_000, overflow: "hidden", justifyContent: "center" },
  darkVeil: { ...StyleSheet.absoluteFillObject, backgroundColor: "#03070D" },
  fireStage: { position: "absolute", left: 0, right: 0, bottom: 0, overflow: "hidden" },
  flameBase: { ...StyleSheet.absoluteFillObject, bottom: -1 },
  flameCluster: { position: "absolute", bottom: -2, shadowColor: "#FF6A16", shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 0 } },
  ember: { position: "absolute", borderRadius: 8, backgroundColor: "#FFD35A", shadowColor: "#FF9D14", shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  smoke: { position: "absolute", width: 46, height: 18, borderRadius: 20, backgroundColor: "#252A30" },
  quoteFrame: { position: "absolute", left: 26, right: 26, top: "28%", alignItems: "center" },
  quote: { color: "#FFFFFF", textAlign: "center", fontSize: 30, lineHeight: 39, fontWeight: "900", letterSpacing: 0.25, textShadowColor: "#0A101AD9", textShadowRadius: 10, textShadowOffset: { width: 0, height: 2 } },
  quoteHighContrast: { textShadowColor: "#000000", textShadowRadius: 2, textShadowOffset: { width: 1, height: 1 } },
  glaze: { position: "absolute", top: "-15%", backgroundColor: "#D9F7FF", opacity: 0.72, borderRadius: 180, shadowColor: "#85D9FF", shadowOpacity: 0.95, shadowRadius: 34, shadowOffset: { width: 0, height: 0 } },
});
