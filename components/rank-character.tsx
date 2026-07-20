import { useEffect } from "react";
import { Image, type ImageSourcePropType, StyleSheet, Text, View } from "react-native";
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
  detail: string;
  portrait: ImageSourcePropType;
};

const PORTRAITS = {
  recruit: require("@/assets/images/characters/recruit.jpg"),
  officer: require("@/assets/images/characters/officer.jpg"),
  vanguard: require("@/assets/images/characters/vanguard.jpg"),
  ascendant: require("@/assets/images/characters/ascendant.jpg"),
} as const;

function getRankProfile(title: string, level: number): RankProfile {
  const normalized = title.toLowerCase();
  if (level >= 350 || /infinity|void|quantum|celestial|galactic|mythic|divine|solar/.test(normalized)) {
    return { name: "Ascendant", accent: "#C092FF", portrait: PORTRAITS.ascendant, detail: "Ascendant cosmic command armor" };
  }
  if (level >= 180 || /commander|general|warlord|vanguard|sentinel|operative/.test(normalized)) {
    return { name: "Vanguard", accent: "#F4C95D", portrait: PORTRAITS.vanguard, detail: "Vanguard field command armor" };
  }
  if (level >= 70 || /officer|lieutenant|captain|major|colonel/.test(normalized)) {
    return { name: "Officer", accent: "#39C6E8", portrait: PORTRAITS.officer, detail: "Officer tactical uniform" };
  }
  return { name: "Recruit", accent: "#49D17D", portrait: PORTRAITS.recruit, detail: "Recruit training command suit" };
}

export function RankCharacter({ title, level, reduceMotion, compact = false }: RankCharacterProps) {
  const colors = useColors();
  const profile = getRankProfile(title, level);
  const float = useSharedValue(0);
  const glow = useSharedValue(0.55);
  const transition = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      float.value = 0;
      glow.value = 0.55;
      transition.value = 1;
      return;
    }
    float.value = withRepeat(withSequence(withTiming(-5, { duration: 1350 }), withTiming(0, { duration: 1350 })), -1, false);
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 1200 }), withTiming(0.45, { duration: 1200 })), -1, false);
    transition.value = 0.45;
    transition.value = withTiming(1, { duration: 360 });
  }, [float, glow, reduceMotion, title, transition]);

  const motionStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));
  const auraStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const portraitStyle = useAnimatedStyle(() => ({ opacity: transition.value, transform: [{ scale: 0.96 + transition.value * 0.04 }] }));
  const size = compact ? 76 : 120;

  return (
    <View accessibilityLabel={`${profile.name} anime character for ${title}, level ${level}`} style={[styles.wrap, compact && styles.compactWrap]}>
      <Animated.View style={[styles.aura, { width: size + 10, height: size + 10, borderRadius: (size + 10) / 2, backgroundColor: `${profile.accent}22` }, auraStyle]} />
      <Animated.View style={[styles.portraitFrame, { width: size, height: size, borderRadius: size / 2, borderColor: profile.accent }, motionStyle, portraitStyle]}>
        <Image key={`${profile.name}-${title}`} source={profile.portrait} resizeMode="cover" style={styles.portrait} />
      </Animated.View>
      <View style={[styles.label, { borderColor: `${profile.accent}99`, backgroundColor: colors.background }]}> 
        <Text style={[styles.labelText, { color: profile.accent }]}>{profile.name.toUpperCase()} · L{level}</Text>
        <Text numberOfLines={1} style={[styles.detailText, { color: colors.muted }]}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 134, alignItems: "center", justifyContent: "center", gap: 3, position: "relative" },
  compactWrap: { width: 88 },
  aura: { position: "absolute", top: 0 },
  portraitFrame: { overflow: "hidden", borderWidth: 2, backgroundColor: "#071018", shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 9, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  portrait: { width: "100%", height: "100%" },
  label: { alignItems: "center", gap: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9, borderWidth: StyleSheet.hairlineWidth, maxWidth: 132 },
  labelText: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.7 },
  detailText: { fontSize: 8, lineHeight: 11, fontWeight: "800", maxWidth: 120, textAlign: "center" },
});
