import { useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import { StyleSheet, View } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import { IconSymbol } from "@/components/ui/icon-symbol";

export function HomeFire({ reduceMotion }: { reduceMotion: boolean }) {
  const isFocused = useIsFocused();
  const burst = useSharedValue(0.25);

  useEffect(() => {
    if (reduceMotion || !isFocused) {
      cancelAnimation(burst);
      burst.value = reduceMotion ? 0.35 : 0.25;
      return;
    }
    burst.value = withRepeat(
      withSequence(
        withDelay(5000, withTiming(1, { duration: 360 })),
        withTiming(0.28, { duration: 680 }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(burst);
  }, [burst, isFocused, reduceMotion]);

  const leftFlame = useAnimatedStyle(() => ({ opacity: burst.value, transform: [{ scale: 0.8 + burst.value * 0.35 }, { translateY: -burst.value * 4 }] }));
  const centerFlame = useAnimatedStyle(() => ({ opacity: 0.35 + burst.value * 0.65, transform: [{ scale: 0.92 + burst.value * 0.26 }, { translateY: -burst.value * 7 }] }));
  const rightFlame = useAnimatedStyle(() => ({ opacity: burst.value * 0.85, transform: [{ scale: 0.72 + burst.value * 0.3 }, { translateY: -burst.value * 3 }] }));

  return (
    <View pointerEvents="none" accessibilityLabel="Periodic command fire animation" style={styles.wrap}>
      <Animated.View style={[styles.flame, styles.left, leftFlame]}><IconSymbol name="flame.fill" size={17} color="#FFAA4C" /></Animated.View>
      <Animated.View style={[styles.flame, styles.center, centerFlame]}><IconSymbol name="flame.fill" size={24} color="#F4C95D" /></Animated.View>
      <Animated.View style={[styles.flame, styles.right, rightFlame]}><IconSymbol name="flame.fill" size={15} color="#FF6B5A" /></Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 31, width: 68, alignSelf: "center", position: "relative", marginTop: -4 },
  flame: { position: "absolute", bottom: 0 },
  left: { left: 8 },
  center: { left: 22 },
  right: { right: 9 },
});
