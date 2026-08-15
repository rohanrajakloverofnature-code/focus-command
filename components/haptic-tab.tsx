import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Platform, StyleSheet } from "react-native";

import { useFocusCommandSelector, type FocusState } from "@/lib/focus-command";

type TabFeedback = { hapticsEnabled: boolean; reduceMotion: boolean };
const selectTabFeedback = (state: FocusState): TabFeedback => ({
  hapticsEnabled: state.profile.hapticsEnabled,
  reduceMotion: state.profile.reduceMotion,
});
const hasSameTabFeedback = (left: TabFeedback, right: TabFeedback) => (
  left.hapticsEnabled === right.hapticsEnabled && left.reduceMotion === right.reduceMotion
);

export function HapticTab(props: BottomTabBarButtonProps) {
  const feedback = useFocusCommandSelector(selectTabFeedback, hasSameTabFeedback);
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const pressIn = (event: Parameters<NonNullable<BottomTabBarButtonProps["onPressIn"]>>[0]) => {
    if (!feedback.reduceMotion) scale.value = withTiming(0.94, { duration: 70 });
    props.onPressIn?.(event);
  };
  const press = (event: Parameters<NonNullable<BottomTabBarButtonProps["onPress"]>>[0]) => {
    props.onPress?.(event);
    if (feedback.hapticsEnabled && Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };
  const pressOut = (event: Parameters<NonNullable<BottomTabBarButtonProps["onPressOut"]>>[0]) => {
    if (!feedback.reduceMotion) scale.value = withTiming(1, { duration: 140 });
    props.onPressOut?.(event);
  };

  return (
    <Animated.View pointerEvents="box-none" style={[styles.touchArea, scaleStyle]}>
      <PlatformPressable {...props} hitSlop={6} onPress={press} onPressIn={pressIn} onPressOut={pressOut} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  touchArea: { flex: 1 },
});
