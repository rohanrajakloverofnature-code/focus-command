import { useEffect } from "react";
import { Image, Modal, type ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import { FeedbackPressable } from "@/components/focus-ui";
import { useColors } from "@/hooks/use-colors";

export type RankCharacterProps = {
  title: string;
  level: number;
  reduceMotion: boolean;
  compact?: boolean;
  onPress?: () => void;
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

export function getRankProfile(title: string, level: number): RankProfile {
  const normalized = title.toLowerCase();
  if (level >= 350 || /infinity|void|quantum|celestial|galactic|mythic|divine|solar/.test(normalized)) {
    return { name: "Ascendant", accent: "#C092FF", portrait: PORTRAITS.ascendant, detail: "Ascendant cosmic command armor" };
  }
  if (level >= 180 || /commander|general|warlord|vanguard|sentinel|operative/.test(normalized)) {
    return { name: "Vanguard", accent: "#F4C95D", portrait: PORTRAITS.vanguard, detail: "Vanguard field command armor" };
  }
  if (level >= 70 || /officer|lieutenant|captain|major|colonel/.test(normalized)) {
    return { name: "Officer", accent: "#A78BFA", portrait: PORTRAITS.officer, detail: "Officer tactical uniform" };
  }
  return { name: "Recruit", accent: "#49D17D", portrait: PORTRAITS.recruit, detail: "Recruit training command suit" };
}

export function RankCharacter({ title, level, reduceMotion, compact = false, onPress }: RankCharacterProps) {
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

  const characterVisual = (
    <View style={styles.characterVisual}>
      <Animated.View style={[styles.aura, { width: size + 10, height: size + 10, borderRadius: (size + 10) / 2, backgroundColor: `${profile.accent}22` }, auraStyle]} />
      <Animated.View style={[styles.portraitFrame, { width: size, height: size, borderRadius: size / 2, borderColor: profile.accent }, motionStyle, portraitStyle]}>
        <Image key={`${profile.name}-${title}`} source={profile.portrait} resizeMode="cover" style={styles.portrait} />
      </Animated.View>
    </View>
  );

  return (
    <View accessibilityLabel={`${profile.name} anime character for ${title}, level ${level}`} style={[styles.wrap, compact && styles.compactWrap]}>
      {onPress ? <FeedbackPressable sound={false} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${title} rank achievement`} accessibilityHint="Shows your current title achievement" style={({ pressed }) => [styles.characterPressable, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>{characterVisual}</FeedbackPressable> : characterVisual}
      <View style={[styles.label, { borderColor: `${profile.accent}99`, backgroundColor: colors.background }]}> 
        <Text style={[styles.labelText, { color: profile.accent }]}>{profile.name.toUpperCase()} · L{level}</Text>
        <Text numberOfLines={1} style={[styles.detailText, { color: colors.muted }]}>{title}</Text>
      </View>
    </View>
  );
}

export function RankCharacterAchievement({ title, level, reduceMotion, visible, onDismiss }: { title: string; level: number; reduceMotion: boolean; visible: boolean; onDismiss: () => void }) {
  const colors = useColors();
  const profile = getRankProfile(title, level);
  const fade = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const halo = useSharedValue(0.45);

  useEffect(() => {
    if (!visible) return;
    fade.value = 0;
    scale.value = reduceMotion ? 1 : 0.9;
    halo.value = 0.45;
    if (reduceMotion) {
      fade.value = 1;
      scale.value = 1;
    } else {
      fade.value = withTiming(1, { duration: 180 });
      scale.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
      halo.value = withRepeat(withSequence(withTiming(1, { duration: 680 }), withTiming(0.42, { duration: 680 })), -1, false);
    }
    const dismissTimer = setTimeout(onDismiss, reduceMotion ? 5000 : 4200);
    return () => clearTimeout(dismissTimer);
  }, [fade, halo, onDismiss, reduceMotion, scale, visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const panelStyle = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ scale: scale.value }] }));
  const haloStyle = useAnimatedStyle(() => ({ opacity: halo.value, transform: [{ scale: 0.9 + halo.value * 0.2 }] }));

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={onDismiss}>
      <Animated.View style={[styles.modalBackdrop, backdropStyle]}>
        <FeedbackPressable sound={false} onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss title achievement" style={styles.modalPressable}>
          <Animated.View accessibilityRole="alert" accessibilityLabel={`${title} title achievement unlocked`} style={[styles.achievementPanel, { backgroundColor: colors.surface, borderColor: `${profile.accent}88` }, panelStyle]}>
            <View style={styles.achievementTopline}>
              <Text style={[styles.achievementEyebrow, { color: profile.accent }]}>TITLE ACHIEVEMENT</Text>
              <Text style={[styles.achievementDismiss, { color: colors.muted }]}>TAP TO DISMISS</Text>
            </View>
            <View style={styles.achievementPortraitWrap}>
              <Animated.View style={[styles.achievementHalo, { backgroundColor: `${profile.accent}28` }, haloStyle]} />
              <View style={[styles.achievementPortraitFrame, { borderColor: profile.accent }]}>
                <Image source={profile.portrait} resizeMode="cover" style={styles.achievementPortrait} />
              </View>
            </View>
            <Text style={[styles.achievementTitle, { color: colors.foreground }]}>{title}</Text>
            <Text style={[styles.achievementRank, { color: profile.accent }]}>{profile.name.toUpperCase()} · LEVEL {level}</Text>
            <Text style={[styles.achievementDetail, { color: colors.muted }]}>{profile.detail}. Your current command title is ready for the next focused block.</Text>
            <View style={[styles.achievementSeal, { borderColor: `${profile.accent}66`, backgroundColor: `${profile.accent}12` }]}><Text style={[styles.achievementSealText, { color: profile.accent }]}>ACHIEVEMENT LOGGED</Text></View>
          </Animated.View>
        </FeedbackPressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 134, alignItems: "center", justifyContent: "center", gap: 3, position: "relative" },
  compactWrap: { width: 88 },
  characterPressable: { alignItems: "center", justifyContent: "center", borderRadius: 999 },
  characterVisual: { alignItems: "center", justifyContent: "center", position: "relative", minHeight: 86, minWidth: 86 },
  aura: { position: "absolute", top: 0 },
  portraitFrame: { overflow: "hidden", borderWidth: 2, backgroundColor: "#17102B", shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 9, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  portrait: { width: "100%", height: "100%" },
  label: { alignItems: "center", gap: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9, borderWidth: StyleSheet.hairlineWidth, maxWidth: 132 },
  labelText: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.7 },
  detailText: { fontSize: 8, lineHeight: 11, fontWeight: "800", maxWidth: 120, textAlign: "center" },
  modalBackdrop: { flex: 1, backgroundColor: "#071018CC", alignItems: "center", justifyContent: "center", padding: 24 },
  modalPressable: { width: "100%", alignItems: "center", justifyContent: "center", flex: 1 },
  achievementPanel: { width: "100%", maxWidth: 360, borderRadius: 28, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 22, alignItems: "center", gap: 8, shadowColor: "#000", shadowOpacity: 0.36, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
  achievementTopline: { width: "100%", flexDirection: "row", justifyContent: "space-between", gap: 10 },
  achievementEyebrow: { fontSize: 10, lineHeight: 13, fontWeight: "900", letterSpacing: 1.1 },
  achievementDismiss: { fontSize: 8, lineHeight: 12, fontWeight: "800", letterSpacing: 0.55 },
  achievementPortraitWrap: { width: 176, height: 176, alignItems: "center", justifyContent: "center", marginVertical: 4 },
  achievementHalo: { position: "absolute", width: 168, height: 168, borderRadius: 84 },
  achievementPortraitFrame: { width: 146, height: 146, overflow: "hidden", borderRadius: 73, borderWidth: 3, backgroundColor: "#17102B", shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 7 },
  achievementPortrait: { width: "100%", height: "100%" },
  achievementTitle: { fontSize: 25, lineHeight: 30, fontWeight: "900", textAlign: "center" },
  achievementRank: { fontSize: 11, lineHeight: 15, fontWeight: "900", letterSpacing: 1.05, textAlign: "center" },
  achievementDetail: { fontSize: 12, lineHeight: 18, fontWeight: "600", textAlign: "center", paddingHorizontal: 6 },
  achievementSeal: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7, marginTop: 3 },
  achievementSealText: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.7 },
});
