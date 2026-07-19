import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import { useColors } from "@/hooks/use-colors";

export type RankCharacterProps = {
  title: string;
  level: number;
  reduceMotion: boolean;
  compact?: boolean;
};

type RankProfile = {
  name: string;
  accent: string;
  suit: string;
  cape: string;
  insignia: "rookie" | "officer" | "vanguard" | "legend";
  detail: string;
};

function getRankProfile(title: string, level: number): RankProfile {
  const normalized = title.toLowerCase();
  if (level >= 350 || /infinity|void|quantum|celestial|galactic|mythic|divine|solar/.test(normalized)) {
    return { name: "Ascendant", accent: "#C092FF", suit: "#28164D", cape: "#6945B8", insignia: "legend", detail: "Cosmic command armor" };
  }
  if (level >= 180 || /commander|general|warlord|vanguard|sentinel|operative/.test(normalized)) {
    return { name: "Vanguard", accent: "#F4C95D", suit: "#473712", cape: "#9C7314", insignia: "vanguard", detail: "Field command armor" };
  }
  if (level >= 70 || /officer|lieutenant|captain|major|colonel/.test(normalized)) {
    return { name: "Officer", accent: "#39C6E8", suit: "#123D54", cape: "#1D6E8C", insignia: "officer", detail: "Tactical officer uniform" };
  }
  return { name: "Recruit", accent: "#49D17D", suit: "#123D31", cape: "#1F7255", insignia: "rookie", detail: "Training command suit" };
}

export function RankCharacter({ title, level, reduceMotion, compact = false }: RankCharacterProps) {
  const colors = useColors();
  const profile = getRankProfile(title, level);
  const float = useSharedValue(0);
  const glow = useSharedValue(0.55);

  useEffect(() => {
    if (reduceMotion) {
      float.value = 0;
      glow.value = 0.55;
      return;
    }
    float.value = withRepeat(withSequence(withTiming(-5, { duration: 1_350 }), withTiming(0, { duration: 1_350 })), -1, false);
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 1_200 }), withTiming(0.45, { duration: 1_200 })), -1, false);
  }, [float, glow, reduceMotion]);

  const motionStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));
  const auraStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const size = compact ? 76 : 120;

  return (
    <View accessibilityLabel={`${profile.name} character for ${title}, level ${level}`} style={[styles.wrap, compact && styles.compactWrap]}>
      <Animated.View style={[styles.aura, { width: size, height: size, borderRadius: size / 2, backgroundColor: `${profile.accent}22` }, auraStyle]} />
      <Animated.View style={motionStyle}>
        <Svg width={size} height={size} viewBox="0 0 120 120">
          <Circle cx="60" cy="59" r="50" fill="#071018" stroke={profile.accent} strokeWidth="2" />
          <Circle cx="60" cy="36" r="15" fill="#F6D4BE" />
          <Path d="M43 35c2-16 31-17 35 1l-5 5H47z" fill={profile.suit} />
          <Path d="M39 53c8-8 34-8 42 0l8 41H31z" fill={profile.suit} />
          <Path d="M39 55l-13 34 10 5 12-28M81 55l13 34-10 5-12-28" stroke="#F6D4BE" strokeWidth="7" strokeLinecap="round" />
          <Path d="M41 57c9 11 28 11 38 0l4 39H37z" fill={profile.cape} opacity="0.72" />
          <Rect x="47" y="56" width="26" height="16" rx="4" fill="#071018" stroke={profile.accent} strokeWidth="2" />
          {profile.insignia === "rookie" ? <Circle cx="60" cy="64" r="4" fill={profile.accent} /> : null}
          {profile.insignia === "officer" ? <Path d="M52 67l8-10 8 10-8 5z" fill={profile.accent} /> : null}
          {profile.insignia === "vanguard" ? <Path d="M50 58h20l-4 14H54z" fill={profile.accent} /> : null}
          {profile.insignia === "legend" ? <Path d="M60 54l5 8 9 1-6 6 2 9-10-5-10 5 2-9-6-6 9-1z" fill={profile.accent} /> : null}
          <Path d="M34 96h52" stroke={profile.accent} strokeWidth="3" strokeLinecap="round" opacity="0.65" />
        </Svg>
      </Animated.View>
      <View style={[styles.label, { borderColor: `${profile.accent}99`, backgroundColor: colors.background }]}>
        <Text style={[styles.labelText, { color: profile.accent }]}>{profile.name.toUpperCase()}</Text>
        <Text numberOfLines={1} style={[styles.detailText, { color: colors.muted }]}>{profile.detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 130, alignItems: "center", justifyContent: "center", gap: 2, position: "relative" },
  compactWrap: { width: 88 },
  aura: { position: "absolute", top: 5 },
  label: { alignItems: "center", gap: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9, borderWidth: StyleSheet.hairlineWidth, maxWidth: 128 },
  labelText: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.7 },
  detailText: { fontSize: 7, lineHeight: 10, fontWeight: "700", maxWidth: 116 },
});
