import { memo, type ReactNode, useEffect } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import Animated, { cancelAnimation, interpolate, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from "react-native-reanimated";

export function HomeFloat({
  children,
  reduceMotion,
  distance = 6,
  sway = 1.5,
  duration = 2_900,
  delay = 0,
  style,
}: {
  children: ReactNode;
  reduceMotion: boolean;
  distance?: number;
  sway?: number;
  duration?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const phase = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(phase);
    if (reduceMotion) {
      phase.value = 0;
      return;
    }
    phase.value = withDelay(delay, withRepeat(withTiming(1, { duration }), -1, true));
    return () => cancelAnimation(phase);
  }, [delay, duration, phase, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(phase.value, [0, 1], [0, -distance]) },
      { translateX: interpolate(phase.value, [0, 1], [0, sway]) },
    ],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

export const HomeAmbientScene = memo(function HomeAmbientScene({ reduceMotion }: { reduceMotion: boolean }) {
  const phase = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(phase);
    if (reduceMotion) {
      phase.value = 0.28;
      return;
    }
    phase.value = withRepeat(withTiming(1, { duration: 4_800 }), -1, true);
    return () => cancelAnimation(phase);
  }, [phase, reduceMotion]);

  const firstOrb = useAnimatedStyle(() => ({
    opacity: interpolate(phase.value, [0, 1], [0.08, 0.27]),
    transform: [{ translateX: interpolate(phase.value, [0, 1], [0, 16]) }, { translateY: interpolate(phase.value, [0, 1], [0, -10]) }, { scale: interpolate(phase.value, [0, 1], [0.86, 1.14]) }],
  }));
  const secondOrb = useAnimatedStyle(() => ({
    opacity: interpolate(phase.value, [0, 1], [0.06, 0.2]),
    transform: [{ translateX: interpolate(phase.value, [0, 1], [0, -12]) }, { translateY: interpolate(phase.value, [0, 1], [0, 12]) }, { scale: interpolate(phase.value, [0, 1], [1.1, 0.82]) }],
  }));
  const signal = useAnimatedStyle(() => ({
    opacity: interpolate(phase.value, [0, 1], [0.18, 0.5]),
    transform: [{ translateY: interpolate(phase.value, [0, 1], [0, -18]) }, { scaleY: interpolate(phase.value, [0, 1], [0.7, 1.12]) }],
  }));

  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.orb, styles.firstOrb, firstOrb]} />
      <Animated.View pointerEvents="none" style={[styles.orb, styles.secondOrb, secondOrb]} />
      <Animated.View pointerEvents="none" style={[styles.signal, signal]} />
    </>
  );
});

const styles = StyleSheet.create({
  orb: { position: "absolute", borderRadius: 999, backgroundColor: "#A78BFA" },
  firstOrb: { width: 104, height: 104, right: -39, top: 42 },
  secondOrb: { width: 64, height: 64, left: 82, bottom: -24, backgroundColor: "#F4C95D" },
  signal: { position: "absolute", width: 2, height: 52, borderRadius: 99, right: 72, top: 74, backgroundColor: "#A78BFA" },
});
