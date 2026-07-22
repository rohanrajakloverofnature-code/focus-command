import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Platform } from "react-native";

import { playFocusTap } from "@/lib/focus-audio";
import { useFocusCommand } from "@/lib/focus-command";

export function HapticTab(props: BottomTabBarButtonProps) {
  const { state } = useFocusCommand();
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const pressIn = (event: Parameters<NonNullable<BottomTabBarButtonProps["onPressIn"]>>[0]) => {
    if (!state.profile.reduceMotion) scale.value = withTiming(0.94, { duration: 70 });
    if (state.profile.hapticsEnabled && Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    props.onPressIn?.(event);
  };
  const pressOut = (event: Parameters<NonNullable<BottomTabBarButtonProps["onPressOut"]>>[0]) => {
    if (!state.profile.reduceMotion) scale.value = withTiming(1, { duration: 140 });
    props.onPressOut?.(event);
  };
  const press = (event: Parameters<NonNullable<BottomTabBarButtonProps["onPress"]>>[0]) => {
    playFocusTap(state.profile.soundEnabled, state.profile.soundRoles.tap);
    props.onPress?.(event);
  };

  return (
    <Animated.View style={scaleStyle}>
      <PlatformPressable {...props} onPress={press} onPressIn={pressIn} onPressOut={pressOut} />
    </Animated.View>
  );
}
