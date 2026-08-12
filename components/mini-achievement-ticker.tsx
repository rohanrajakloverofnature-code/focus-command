import { useEffect, useMemo, useRef, useState } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  getNextMiniAchievementHeadlineIndex,
  MINI_ACHIEVEMENT_HEADLINE_INTERVAL_MS,
  type MiniAchievementHeadline,
} from "@/lib/mini-achievement-headlines";

export function MiniAchievementTicker({
  achievements,
  reduceMotion,
  style,
}: {
  achievements: readonly MiniAchievementHeadline[];
  reduceMotion: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const changeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opacity = useSharedValue(1);
  const offsetY = useSharedValue(0);
  const achievementSignature = useMemo(() => achievements.map((achievement) => `${achievement.id}:${achievement.occurredAt}`).join("|"), [achievements]);

  useEffect(() => {
    if (changeTimerRef.current) clearTimeout(changeTimerRef.current);
    cancelAnimation(opacity);
    cancelAnimation(offsetY);
    setActiveIndex(0);
    opacity.value = 1;
    offsetY.value = 0;

    if (achievements.length <= 1 || reduceMotion) return;

    const rotate = () => {
      opacity.value = withTiming(0, { duration: 160, easing: Easing.in(Easing.cubic) });
      offsetY.value = withTiming(-6, { duration: 160, easing: Easing.in(Easing.cubic) });
      changeTimerRef.current = setTimeout(() => {
        setActiveIndex((current) => getNextMiniAchievementHeadlineIndex(current, achievements.length));
        opacity.value = 0;
        offsetY.value = 6;
        opacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) });
        offsetY.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });
      }, 175);
    };

    const rotation = setInterval(rotate, MINI_ACHIEVEMENT_HEADLINE_INTERVAL_MS);
    return () => {
      clearInterval(rotation);
      if (changeTimerRef.current) clearTimeout(changeTimerRef.current);
      cancelAnimation(opacity);
      cancelAnimation(offsetY);
    };
  }, [achievementSignature, achievements.length, offsetY, opacity, reduceMotion]);

  const headlineStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: offsetY.value }] }));
  const activeAchievement = achievements[activeIndex % Math.max(1, achievements.length)];

  if (!activeAchievement) return null;

  return (
    <View
      accessible
      accessibilityLabel={`Mini achievement: ${activeAchievement.title}, rated ${activeAchievement.rating.toFixed(1)} out of 5`}
      style={[styles.ticker, style]}
    >
      <View style={styles.accent} />
      <Animated.View style={[styles.headline, headlineStyle]}>
        <View style={styles.iconFrame}>
          <IconSymbol name="trophy.fill" size={13} color="#F4C95D" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>MINI ACHIEVEMENT</Text>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.title}>{activeAchievement.title}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <IconSymbol name="star.fill" size={9} color="#F4C95D" />
          <Text style={styles.rating}>{activeAchievement.rating.toFixed(1)}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  ticker: {
    height: 36,
    overflow: "hidden",
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#F4C95D50",
    backgroundColor: "#10233AEC",
  },
  accent: { position: "absolute", left: 0, top: 7, bottom: 7, width: 2, borderRadius: 99, backgroundColor: "#F4C95D" },
  headline: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 7, paddingLeft: 9 },
  iconFrame: { width: 19, height: 19, borderRadius: 7, alignItems: "center", justifyContent: "center", backgroundColor: "#F4C95D16" },
  copy: { flex: 1, minWidth: 0, justifyContent: "center" },
  eyebrow: { color: "#D9B65A", fontSize: 6.5, lineHeight: 8, fontWeight: "900", letterSpacing: 0.7 },
  title: { color: "#F5F9FF", fontSize: 10, lineHeight: 13, fontWeight: "800" },
  ratingBadge: { minWidth: 29, height: 19, paddingHorizontal: 4, borderRadius: 7, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2, backgroundColor: "#F4C95D18" },
  rating: { color: "#F4C95D", fontSize: 8.5, lineHeight: 11, fontWeight: "900" },
});
