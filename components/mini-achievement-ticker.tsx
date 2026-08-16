import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  getMiniAchievementTickerSummary,
  getNextMiniAchievementHeadlineIndex,
  MINI_ACHIEVEMENT_HEADLINE_INTERVAL_MS,
  type MiniAchievementHeadline,
} from "@/lib/mini-achievement-headlines";
import { MINI_ACHIEVEMENT_TICKER_LAYOUT } from "@/lib/focus-layout";

export const MiniAchievementTicker = memo(function MiniAchievementTicker({
  achievements,
  reduceMotion,
  style,
  onPress,
  surfaceColor,
  accentColor,
}: {
  achievements: readonly MiniAchievementHeadline[];
  reduceMotion: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  /** Render-only visual token. Does not affect ticker content, cadence, or interaction. */
  surfaceColor?: string;
  /** Render-only visual token. Does not affect ticker content, cadence, or interaction. */
  accentColor?: string;
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
  const displayTitle = activeAchievement ? getMiniAchievementTickerSummary(activeAchievement.title) : "";
  const resolvedSurfaceColor = surfaceColor ?? "#000000";
  const resolvedAccentColor = accentColor ?? "#F4C95D";

  if (!activeAchievement) return null;

  return (
    <Pressable
      accessible
      accessibilityLabel={`Mini achievement: ${activeAchievement.title}, rated ${activeAchievement.rating.toFixed(1)} out of 5`}
      accessibilityHint={onPress ? "Opens the Wall of Fame" : undefined}
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.ticker, { backgroundColor: resolvedSurfaceColor, borderColor: `${resolvedAccentColor}62` }, style, onPress && pressed ? styles.tickerPressed : null]}
    >
      <View pointerEvents="none" style={[styles.ambientGlow, { backgroundColor: `${resolvedAccentColor}0E` }]} />
      <View pointerEvents="none" style={[styles.topline, { backgroundColor: `${resolvedAccentColor}42` }]} />
      <View style={[styles.accent, { backgroundColor: resolvedAccentColor }]} />
      <Animated.View style={[styles.headline, headlineStyle]}>
        <View style={[styles.iconFrame, { backgroundColor: `${resolvedAccentColor}16`, borderColor: `${resolvedAccentColor}2C` }]}>
          <View pointerEvents="none" style={[styles.iconRing, { borderColor: `${resolvedAccentColor}26` }]} />
          <IconSymbol name="trophy.fill" size={13} color={resolvedAccentColor} />
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={[styles.eyebrow, { color: resolvedAccentColor }]}>MINI ACHIEVEMENT · WALL OF FAME</Text>
          <Text numberOfLines={2} ellipsizeMode="tail" style={styles.title}>{displayTitle}</Text>
        </View>
        <View style={[styles.ratingBadge, { borderColor: `${resolvedAccentColor}35`, backgroundColor: `${resolvedAccentColor}18` }]}>
          <IconSymbol name="star.fill" size={9} color={resolvedAccentColor} />
          <Text style={[styles.rating, { color: resolvedAccentColor }]}>{activeAchievement.rating.toFixed(1)}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  ticker: {
    height: MINI_ACHIEVEMENT_TICKER_LAYOUT.height,
    overflow: "hidden",
    borderRadius: 15,
    borderWidth: 1,
    position: "relative",
  },
  tickerPressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  ambientGlow: { position: "absolute", width: 170, height: 120, borderRadius: 88, top: -72, right: -42 },
  topline: { position: "absolute", left: 17, right: 17, top: 0, height: 1 },
  accent: { position: "absolute", left: 0, top: 13, bottom: 13, width: 4, borderRadius: 99 },
  headline: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 14, paddingLeft: 17, paddingVertical: 11 },
  iconFrame: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  iconRing: { position: "absolute", width: 29, height: 29, borderRadius: 15, borderWidth: 1 },
  copy: { flex: 1, minWidth: 0, justifyContent: "center" },
  eyebrow: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.75 },
  title: { minHeight: 36, color: "#F5F9FF", fontSize: 14, lineHeight: 18, fontWeight: "800", marginTop: 2 },
  ratingBadge: { minWidth: 54, height: 36, paddingHorizontal: 9, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  rating: { fontSize: 12.5, lineHeight: 16, fontWeight: "900" },
});
