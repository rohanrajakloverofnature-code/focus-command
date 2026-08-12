import { useEffect, useMemo, useRef, useState } from "react";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { AppState, Image, Modal, Pressable, type ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import { useColors } from "@/hooks/use-colors";
import { getPowerUpProfile, POWER_UP_AUDIO_CUES, POWER_UP_TIMELINE_MS } from "@/lib/power-up-profile";

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

export const TITLE_ACHIEVEMENT_DURATION_MS = 10_000;
const TITLE_ACHIEVEMENT_PULSE_DURATION_MS = 1_250;

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
      {onPress ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${title} rank achievement`} accessibilityHint="Shows your current title achievement" style={({ pressed }) => [styles.characterPressable, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>{characterVisual}</Pressable> : characterVisual}
      <View style={[styles.label, { borderColor: `${profile.accent}99`, backgroundColor: colors.background }]}> 
        <Text style={[styles.labelText, { color: profile.accent }]}>{profile.name.toUpperCase()} · L{level}</Text>
        <Text numberOfLines={1} style={[styles.detailText, { color: colors.muted }]}>{title}</Text>
      </View>
    </View>
  );
}

const POWER_UP_AUDIO_SOURCES = [
  require("@/assets/sounds/focus-command-notification.mp3"),
  require("@/assets/sounds/focus-command-cue.mp3"),
  require("@/assets/sounds/focus-command-confirm.mp3"),
] as const;

type PowerUpPhase = "activation" | "build" | "transform" | "impact" | "revealed";

export function RankCharacterAchievement({ title, level, reduceMotion, visible, onDismiss, soundEnabled = true }: { title: string; level: number; reduceMotion: boolean; visible: boolean; onDismiss: () => void; soundEnabled?: boolean }) {
  const colors = useColors();
  const profile = getRankProfile(title, level);
  const powerProfile = useMemo(() => getPowerUpProfile(title, level), [level, title]);
  const [phase, setPhase] = useState<PowerUpPhase>("activation");
  const fade = useSharedValue(0);
  const camera = useSharedValue(1);
  const portraitScale = useSharedValue(0.72);
  const portraitY = useSharedValue(34);
  const halo = useSharedValue(0);
  const ring = useSharedValue(0.42);
  const flash = useSharedValue(0);
  const reveal = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const shakeY = useSharedValue(0);
  const dismissRef = useRef(onDismiss);
  const playersRef = useRef<ReturnType<typeof createAudioPlayer>[]>([]);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!visible) return;
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") dismissRef.current();
    });
    return () => subscription.remove();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const scaled = (duration: number) => (reduceMotion ? Math.min(180, duration) : duration);
    const schedule = (callback: () => void, delay: number) => {
      timers.push(setTimeout(callback, scaled(delay)));
    };
    const releasePlayers = () => {
      for (const player of playersRef.current) {
        try {
          player.remove();
        } catch {
          // A player can already be released if Android interrupts the sequence.
        }
      }
      playersRef.current = [];
    };
    const cue = (index: number) => {
      if (!soundEnabled) return;
      const player = playersRef.current[index];
      if (!player) return;
      try {
        player.seekTo(0);
        player.play();
      } catch {
        // Audio cannot block the visual power-up sequence.
      }
    };

    releasePlayers();
    if (soundEnabled) {
      try {
        playersRef.current = POWER_UP_AUDIO_SOURCES.map((source) => createAudioPlayer(source));
        void setAudioModeAsync({ playsInSilentMode: true });
      } catch {
        playersRef.current = [];
      }
    }

    setPhase("activation");
    fade.value = 0;
    camera.value = 1;
    portraitScale.value = reduceMotion ? 0.98 : 0.72;
    portraitY.value = reduceMotion ? 0 : 34;
    halo.value = 0;
    ring.value = 0.42;
    flash.value = 0;
    reveal.value = 0;
    if (reduceMotion) {
      fade.value = 1;
      portraitScale.value = 1;
      portraitY.value = 0;
      halo.value = powerProfile.intensity;
      ring.value = 1;
      reveal.value = 1;
      setPhase("revealed");
      cue(POWER_UP_AUDIO_CUES[0].sourceIndex);
    } else {
      fade.value = withTiming(1, { duration: 180 });
      portraitScale.value = withTiming(0.9, { duration: POWER_UP_TIMELINE_MS.build, easing: Easing.out(Easing.cubic) });
      portraitY.value = withTiming(0, { duration: POWER_UP_TIMELINE_MS.build, easing: Easing.out(Easing.cubic) });
      halo.value = withTiming(powerProfile.intensity, { duration: POWER_UP_TIMELINE_MS.build, easing: Easing.inOut(Easing.quad) });
      cue(POWER_UP_AUDIO_CUES[0].sourceIndex);
    }

    schedule(() => {
      setPhase("build");
      ring.value = withRepeat(withSequence(withTiming(1.35, { duration: 420, easing: Easing.out(Easing.quad) }), withTiming(0.78, { duration: 520, easing: Easing.inOut(Easing.sin) })), 2, false);
      camera.value = withTiming(1.045, { duration: 1_600, easing: Easing.inOut(Easing.quad) });
      cue(POWER_UP_AUDIO_CUES[1].sourceIndex);
    }, POWER_UP_TIMELINE_MS.build);
    schedule(() => {
      setPhase("transform");
      portraitScale.value = withTiming(1.08, { duration: 880, easing: Easing.out(Easing.exp) });
      halo.value = withTiming(1, { duration: 760, easing: Easing.in(Easing.quad) });
      camera.value = withTiming(1.09, { duration: 900, easing: Easing.inOut(Easing.quad) });
    }, POWER_UP_TIMELINE_MS.transformation);
    schedule(() => {
      setPhase("impact");
      flash.value = 0.95;
      flash.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.quad) });
      shakeX.value = withSequence(withTiming(8, { duration: 55 }), withTiming(-7, { duration: 55 }), withTiming(5, { duration: 55 }), withTiming(0, { duration: 80 }));
      shakeY.value = withSequence(withTiming(-5, { duration: 55 }), withTiming(5, { duration: 55 }), withTiming(-3, { duration: 55 }), withTiming(0, { duration: 80 }));
      cue(POWER_UP_AUDIO_CUES[2].sourceIndex);
    }, POWER_UP_TIMELINE_MS.impact);
    schedule(() => {
      setPhase("revealed");
      camera.value = withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) });
      portraitScale.value = withTiming(1, { duration: 580, easing: Easing.out(Easing.back(1.1)) });
      ring.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
      reveal.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    }, POWER_UP_TIMELINE_MS.reveal);
    schedule(() => dismissRef.current(), POWER_UP_TIMELINE_MS.finish);

    return () => {
      timers.forEach(clearTimeout);
      releasePlayers();
    };
  }, [camera, fade, flash, halo, portraitScale, portraitY, powerProfile, reduceMotion, reveal, ring, shakeX, shakeY, soundEnabled, visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const cameraStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }, { translateY: shakeY.value }, { scale: camera.value }] }));
  const portraitStyle = useAnimatedStyle(() => ({ transform: [{ translateY: portraitY.value }, { scale: portraitScale.value }] }));
  const haloStyle = useAnimatedStyle(() => ({ opacity: halo.value, transform: [{ scale: 0.7 + halo.value * 0.55 }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, ring.value), transform: [{ scale: ring.value }] }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const revealStyle = useAnimatedStyle(() => ({ opacity: reveal.value, transform: [{ translateY: 14 * (1 - reveal.value) }] }));

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={onDismiss}>
      <Animated.View style={[styles.modalBackdrop, backdropStyle]}>
        <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss title achievement" style={styles.modalPressable}>
          <Animated.View accessibilityRole="alert" accessibilityLabel={`${title} level ${level} power-up sequence`} style={[styles.powerUpStage, cameraStyle]}>
            <Animated.View pointerEvents="none" style={[styles.powerUpFlash, { backgroundColor: profile.accent }, flashStyle]} />
            <View pointerEvents="none" style={styles.powerUpParticles}>
              {Array.from({ length: 12 }, (_, index) => <View key={index} style={[styles.powerUpParticle, { backgroundColor: index % 3 === 0 ? "#F7D66A" : profile.accent, transform: [{ rotate: `${index * 30}deg` }, { translateY: -124 - (index % 3) * 18 }] }]} />)}
            </View>
            <View style={styles.powerUpTopline}>
              <Text style={[styles.powerUpEyebrow, { color: profile.accent }]}>{phase === "activation" ? "POWER SYSTEM ONLINE" : phase === "impact" ? powerProfile.impactLabel : `${powerProfile.titleSignature.toUpperCase()} PROTOCOL`}</Text>
              <Text style={[styles.powerUpDismiss, { color: colors.muted }]}>TAP TO DISMISS</Text>
            </View>
            <View style={styles.powerUpCore}>
              <Animated.View pointerEvents="none" style={[styles.powerUpHalo, { backgroundColor: `${profile.accent}35` }, haloStyle]} />
              <Animated.View pointerEvents="none" style={[styles.powerUpRing, { borderColor: `${profile.accent}B8` }, ringStyle]} />
              <Animated.View style={[styles.powerUpPortraitFrame, { borderColor: profile.accent }, portraitStyle]}>
                <Image source={profile.portrait} resizeMode="cover" style={styles.powerUpPortrait} />
              </Animated.View>
            </View>
            <Animated.View style={[styles.powerUpReveal, revealStyle]}>
              <Text style={[styles.powerUpTitle, { color: colors.foreground }]}>{title}</Text>
              <Text style={[styles.powerUpRank, { color: profile.accent }]}>{profile.name.toUpperCase()} · LEVEL {level} · TIER {powerProfile.tier + 1}</Text>
              <View style={styles.powerUpLoadoutRow}>
                <View style={[styles.powerUpChip, { borderColor: `${profile.accent}80`, backgroundColor: `${profile.accent}15` }]}><Text numberOfLines={1} style={[styles.powerUpChipText, { color: profile.accent }]}>{powerProfile.equipment}</Text></View>
                <View style={[styles.powerUpChip, { borderColor: "#F4C95D80", backgroundColor: "#F4C95D14" }]}><Text numberOfLines={1} style={[styles.powerUpChipText, { color: "#F4C95D" }]}>{powerProfile.ammunition}</Text></View>
              </View>
              <View style={[styles.powerUpAbility, { borderColor: `${profile.accent}88`, backgroundColor: `${profile.accent}18` }]}>
                <Text style={[styles.powerUpAbilityLabel, { color: profile.accent }]}>ABILITY UNLOCKED</Text>
                <Text numberOfLines={1} style={[styles.powerUpAbilityText, { color: colors.foreground }]}>{powerProfile.ability}</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </Pressable>
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
  powerUpStage: { width: "100%", maxWidth: 390, minHeight: 520, paddingHorizontal: 20, paddingVertical: 22, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  powerUpFlash: { ...StyleSheet.absoluteFillObject },
  powerUpParticles: { position: "absolute", width: 8, height: 8, alignItems: "center", justifyContent: "center" },
  powerUpParticle: { position: "absolute", width: 4, height: 14, borderRadius: 4, opacity: 0.82 },
  powerUpTopline: { position: "absolute", top: 24, left: 20, right: 20, flexDirection: "row", justifyContent: "space-between", gap: 10 },
  powerUpEyebrow: { flex: 1, fontSize: 10, lineHeight: 13, fontWeight: "900", letterSpacing: 1.05 },
  powerUpDismiss: { fontSize: 8, lineHeight: 12, fontWeight: "800", letterSpacing: 0.55 },
  powerUpCore: { width: 252, height: 252, alignItems: "center", justifyContent: "center", marginTop: 22 },
  powerUpHalo: { position: "absolute", width: 228, height: 228, borderRadius: 114 },
  powerUpRing: { position: "absolute", width: 212, height: 212, borderRadius: 106, borderWidth: 2, borderStyle: "dashed" },
  powerUpPortraitFrame: { width: 174, height: 174, overflow: "hidden", borderRadius: 87, borderWidth: 3, backgroundColor: "#17102B", shadowColor: "#000", shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 11 },
  powerUpPortrait: { width: "100%", height: "100%" },
  powerUpReveal: { width: "100%", alignItems: "center", gap: 8, marginTop: 4 },
  powerUpTitle: { fontSize: 29, lineHeight: 34, fontWeight: "900", textAlign: "center", letterSpacing: -0.45 },
  powerUpRank: { fontSize: 10, lineHeight: 14, fontWeight: "900", letterSpacing: 0.9, textAlign: "center" },
  powerUpLoadoutRow: { width: "100%", flexDirection: "row", gap: 8 },
  powerUpChip: { flex: 1, minHeight: 34, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 8, paddingVertical: 6 },
  powerUpChipText: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.35, textAlign: "center" },
  powerUpAbility: { width: "100%", borderWidth: StyleSheet.hairlineWidth, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 9, alignItems: "center", gap: 2 },
  powerUpAbilityLabel: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.8 },
  powerUpAbilityText: { fontSize: 13, lineHeight: 17, fontWeight: "900", textAlign: "center" },
});
