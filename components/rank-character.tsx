import { useEffect, useMemo, useRef, useState } from "react";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { AppState, Image, Modal, Pressable, type ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import { useColors } from "@/hooks/use-colors";
import {
  CHARACTER_EVOLUTION_TIMELINE_MS,
  getCharacterEvolutionProfile,
  getEquippedGearLabels,
  type EquippedCharacterGear,
} from "@/lib/character-development";

export type RankCharacterProps = {
  title: string;
  level: number;
  reduceMotion: boolean;
  compact?: boolean;
  onPress?: () => void;
  equipment?: EquippedCharacterGear;
  acknowledgementNonce?: number;
};

export type CharacterPresentationMode = "evolution" | "acknowledgement";

type RankProfile = {
  name: string;
  accent: string;
  secondaryAccent: string;
  detail: string;
  portrait: ImageSourcePropType;
  stage: number;
};

export const TITLE_ACHIEVEMENT_DURATION_MS = CHARACTER_EVOLUTION_TIMELINE_MS.finish;

const PORTRAITS = {
  recruit: require("@/assets/images/characters/recruit.jpg"),
  officer: require("@/assets/images/characters/officer.jpg"),
  vanguard: require("@/assets/images/characters/vanguard.jpg"),
  ascendant: require("@/assets/images/characters/ascendant.jpg"),
  tactical: require("@/assets/images/characters/evolution/tactical.png"),
  command: require("@/assets/images/characters/evolution/command.png"),
  shadow: require("@/assets/images/characters/evolution/shadow.png"),
  evolutionAscendant: require("@/assets/images/characters/evolution/ascendant.png"),
} as const;

function getBasePortrait(title: string, level: number): ImageSourcePropType {
  const normalized = title.toLowerCase();
  if (level >= 350 || /infinity|void|quantum|celestial|galactic|mythic|divine|solar/.test(normalized)) return PORTRAITS.ascendant;
  if (level >= 180 || /commander|general|warlord|vanguard|sentinel|operative/.test(normalized)) return PORTRAITS.vanguard;
  if (level >= 70 || /officer|lieutenant|captain|major|colonel/.test(normalized)) return PORTRAITS.officer;
  return PORTRAITS.recruit;
}

export function getRankProfile(title: string, level: number): RankProfile {
  const evolution = getCharacterEvolutionProfile(title, level);
  const portrait = evolution.stage === 0
    ? getBasePortrait(title, level)
    : evolution.family === "ascendant"
      ? PORTRAITS.evolutionAscendant
      : PORTRAITS[evolution.family];
  return {
    name: evolution.formName,
    accent: evolution.accent,
    secondaryAccent: evolution.secondaryAccent,
    portrait,
    stage: evolution.stage,
    detail: `${evolution.formName} · ${evolution.armor}`,
  };
}

function CharacterGrowthLayers({ stage, accent, secondaryAccent, equipment, compact = false }: { stage: number; accent: string; secondaryAccent: string; equipment?: EquippedCharacterGear; compact?: boolean }) {
  const hasHead = Boolean(equipment?.head);
  const hasBody = Boolean(equipment?.body);
  const hasAccessory = Boolean(equipment?.accessory);
  const sizeMultiplier = compact ? 0.72 : 1;
  return (
    <View pointerEvents="none" style={styles.growthLayers}>
      {stage >= 1 ? <View style={[styles.coreLight, { backgroundColor: `${accent}B8`, width: 8 * sizeMultiplier, height: 8 * sizeMultiplier, borderRadius: 4 * sizeMultiplier }]} /> : null}
      {(stage >= 2 || hasHead) ? <View style={[styles.visor, { borderColor: `${accent}D8`, width: 28 * sizeMultiplier, height: 7 * sizeMultiplier, borderRadius: 7 * sizeMultiplier }]} /> : null}
      {(stage >= 2 || hasBody) ? <View style={[styles.leftPauldron, { borderColor: `${secondaryAccent}AA`, width: 23 * sizeMultiplier, height: 15 * sizeMultiplier, borderRadius: 8 * sizeMultiplier }]} /> : null}
      {stage >= 3 ? <View style={[styles.rightWeapon, { backgroundColor: `${accent}D0`, width: 5 * sizeMultiplier, height: 35 * sizeMultiplier, borderRadius: 4 * sizeMultiplier }]} /> : null}
      {(stage >= 3 || hasAccessory) ? <View style={[styles.accessoryNode, { borderColor: `${secondaryAccent}D0`, width: 11 * sizeMultiplier, height: 11 * sizeMultiplier, borderRadius: 6 * sizeMultiplier }]} /> : null}
      {stage >= 4 ? <View style={[styles.orbitLine, { borderColor: `${accent}95`, width: 95 * sizeMultiplier, height: 95 * sizeMultiplier, borderRadius: 48 * sizeMultiplier }]} /> : null}
      {stage >= 5 ? <View style={[styles.sovereignCrown, { borderBottomColor: `${secondaryAccent}CC`, borderLeftWidth: 7 * sizeMultiplier, borderRightWidth: 7 * sizeMultiplier, borderBottomWidth: 15 * sizeMultiplier }]} /> : null}
    </View>
  );
}

export function RankCharacter({ title, level, reduceMotion, compact = false, onPress, equipment, acknowledgementNonce = 0 }: RankCharacterProps) {
  const colors = useColors();
  const profile = getRankProfile(title, level);
  const float = useSharedValue(0);
  const glow = useSharedValue(0.55);
  const transition = useSharedValue(1);
  const acknowledgement = useSharedValue(0);
  const gearCount = getEquippedGearLabels(equipment ?? {}).length;

  useEffect(() => {
    if (reduceMotion) {
      float.value = 0;
      glow.value = 0.55;
      transition.value = 1;
      return;
    }
    const amplitude = 3 + profile.stage;
    float.value = withRepeat(withSequence(withTiming(-amplitude, { duration: 1_600 }), withTiming(0, { duration: 1_600 })), -1, false);
    glow.value = withRepeat(withSequence(withTiming(0.9, { duration: 1_500 }), withTiming(0.38 + profile.stage * 0.05, { duration: 1_500 })), -1, false);
    transition.value = 0.42;
    transition.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
  }, [float, glow, profile.stage, reduceMotion, title, transition]);

  useEffect(() => {
    if (!acknowledgementNonce || reduceMotion) return;
    acknowledgement.value = 0;
    acknowledgement.value = withSequence(withTiming(1, { duration: 130, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 680, easing: Easing.out(Easing.cubic) }));
  }, [acknowledgement, acknowledgementNonce, reduceMotion]);

  const motionStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }, { scale: 1 + acknowledgement.value * 0.055 }] }));
  const auraStyle = useAnimatedStyle(() => ({ opacity: glow.value + acknowledgement.value * 0.28, transform: [{ scale: 0.95 + acknowledgement.value * 0.18 }] }));
  const portraitStyle = useAnimatedStyle(() => ({ opacity: transition.value, transform: [{ scale: 0.95 + transition.value * 0.05 }] }));
  const size = compact ? 76 : 124;
  const stageScale = 1 + profile.stage * 0.024;

  const characterVisual = (
    <View style={styles.characterVisual}>
      <Animated.View style={[styles.aura, { width: size + 18, height: size + 18, borderRadius: (size + 18) / 2, backgroundColor: `${profile.accent}1C` }, auraStyle]} />
      <Animated.View style={[styles.portraitFrame, { width: size, height: size, borderRadius: size / 2, borderColor: profile.accent }, motionStyle, portraitStyle]}>
        <Image key={`${profile.name}-${title}-${profile.stage}`} source={profile.portrait} resizeMode="cover" style={[styles.portrait, { transform: [{ scale: stageScale }] }]} />
        <CharacterGrowthLayers stage={profile.stage} accent={profile.accent} secondaryAccent={profile.secondaryAccent} equipment={equipment} compact={compact} />
      </Animated.View>
    </View>
  );

  return (
    <View accessibilityLabel={`${profile.name} character for ${title}, level ${level}`} style={[styles.wrap, compact && styles.compactWrap]}>
      {onPress ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Inspect ${title} development`} accessibilityHint="Shows a new development reveal only after you earn progression or equip new gear" style={({ pressed }) => [styles.characterPressable, { opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>{characterVisual}</Pressable> : characterVisual}
      <View style={[styles.label, { borderColor: `${profile.accent}99`, backgroundColor: colors.background }]}>
        <Text style={[styles.labelText, { color: profile.accent }]}>{profile.name.toUpperCase()} · L{level}</Text>
        <Text numberOfLines={1} style={[styles.detailText, { color: colors.muted }]}>{title}</Text>
        {gearCount ? <View style={styles.gearPips}>{Array.from({ length: gearCount }, (_, index) => <View key={index} style={[styles.gearPip, { backgroundColor: index === 0 ? profile.accent : profile.secondaryAccent }]} />)}</View> : null}
      </View>
    </View>
  );
}

const CHARACTER_EVOLUTION_AUDIO_SOURCES = [
  require("@/assets/sounds/character-evolution-activation.mp3"),
  require("@/assets/sounds/character-evolution-impact.mp3"),
  require("@/assets/sounds/character-evolution-reveal.mp3"),
] as const;

type PowerUpPhase = "activation" | "build" | "materialize" | "impact" | "revealed" | "acknowledgement";

const PHASE_COPY: Record<PowerUpPhase, string> = {
  activation: "PROGRESSION DETECTED",
  build: "ENERGY SYNCHRONIZING",
  materialize: "LOADOUT MATERIALIZING",
  impact: "POWER SURGE",
  revealed: "DEVELOPMENT CONFIRMED",
  acknowledgement: "CURRENT FORM STABLE",
};

export function RankCharacterAchievement({
  title,
  level,
  reduceMotion,
  visible,
  onDismiss,
  soundEnabled = true,
  equipment = {},
  mode = "evolution",
}: {
  title: string;
  level: number;
  reduceMotion: boolean;
  visible: boolean;
  onDismiss: () => void;
  soundEnabled?: boolean;
  equipment?: EquippedCharacterGear;
  mode?: CharacterPresentationMode;
}) {
  const colors = useColors();
  const profile = getRankProfile(title, level);
  const evolution = useMemo(() => getCharacterEvolutionProfile(title, level), [level, title]);
  const gear = useMemo(() => getEquippedGearLabels(equipment), [equipment]);
  const [phase, setPhase] = useState<PowerUpPhase>("activation");
  const fade = useSharedValue(0);
  const camera = useSharedValue(1);
  const portraitScale = useSharedValue(0.68);
  const portraitY = useSharedValue(32);
  const halo = useSharedValue(0);
  const ring = useSharedValue(0.42);
  const flash = useSharedValue(0);
  const reveal = useSharedValue(0);
  const equipmentReveal = useSharedValue(0);
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
    const scaled = (duration: number) => (reduceMotion ? Math.min(220, duration) : duration);
    const schedule = (callback: () => void, delay: number) => timers.push(setTimeout(callback, scaled(delay)));
    const releasePlayers = () => {
      for (const player of playersRef.current) {
        try {
          player.remove();
        } catch {
          // Android can release a player while app state changes; the visual must still clean up.
        }
      }
      playersRef.current = [];
    };
    const cue = (sourceIndex: number) => {
      const player = playersRef.current[sourceIndex];
      if (!player) return;
      try {
        player.seekTo(0);
        player.play();
      } catch {
        // Dedicated cinematic sound is additive and never blocks the sequence.
      }
    };

    releasePlayers();
    if (mode === "evolution" && soundEnabled) {
      try {
        playersRef.current = CHARACTER_EVOLUTION_AUDIO_SOURCES.map((source) => createAudioPlayer(source));
        void setAudioModeAsync({ playsInSilentMode: true });
      } catch {
        playersRef.current = [];
      }
    }

    fade.value = 0;
    camera.value = 1;
    portraitScale.value = reduceMotion ? 0.98 : 0.68;
    portraitY.value = reduceMotion ? 0 : 32;
    halo.value = 0;
    ring.value = 0.42;
    flash.value = 0;
    reveal.value = 0;
    equipmentReveal.value = 0;

    if (mode === "acknowledgement") {
      setPhase("acknowledgement");
      fade.value = withTiming(1, { duration: 180 });
      portraitScale.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
      halo.value = withTiming(0.72, { duration: 300 });
      ring.value = withTiming(0.9, { duration: 300 });
      reveal.value = withTiming(1, { duration: 240 });
      equipmentReveal.value = withTiming(1, { duration: 240 });
      schedule(() => dismissRef.current(), CHARACTER_EVOLUTION_TIMELINE_MS.acknowledgementFinish);
      return () => {
        timers.forEach(clearTimeout);
        releasePlayers();
      };
    }

    setPhase("activation");
    if (reduceMotion) {
      fade.value = 1;
      portraitScale.value = 1;
      portraitY.value = 0;
      halo.value = 0.82;
      ring.value = 1;
      equipmentReveal.value = 1;
      reveal.value = 1;
      setPhase("revealed");
      cue(0);
      schedule(() => dismissRef.current(), CHARACTER_EVOLUTION_TIMELINE_MS.acknowledgementFinish);
      return () => {
        timers.forEach(clearTimeout);
        releasePlayers();
      };
    }

    fade.value = withTiming(1, { duration: 190 });
    portraitScale.value = withTiming(0.88, { duration: CHARACTER_EVOLUTION_TIMELINE_MS.build, easing: Easing.out(Easing.cubic) });
    portraitY.value = withTiming(0, { duration: CHARACTER_EVOLUTION_TIMELINE_MS.build, easing: Easing.out(Easing.cubic) });
    halo.value = withTiming(0.62 + evolution.stage * 0.06, { duration: CHARACTER_EVOLUTION_TIMELINE_MS.build, easing: Easing.inOut(Easing.quad) });
    cue(0);
    schedule(() => {
      setPhase("build");
      ring.value = withRepeat(withSequence(withTiming(1.25, { duration: 430, easing: Easing.out(Easing.quad) }), withTiming(0.76, { duration: 510, easing: Easing.inOut(Easing.sin) })), 2, false);
      camera.value = withTiming(1.035, { duration: 1_100, easing: Easing.inOut(Easing.quad) });
    }, CHARACTER_EVOLUTION_TIMELINE_MS.build);
    schedule(() => {
      setPhase("materialize");
      equipmentReveal.value = withTiming(1, { duration: 760, easing: Easing.out(Easing.exp) });
      portraitScale.value = withTiming(1.06, { duration: 850, easing: Easing.out(Easing.exp) });
      halo.value = withTiming(1, { duration: 760, easing: Easing.in(Easing.quad) });
    }, CHARACTER_EVOLUTION_TIMELINE_MS.materialize);
    schedule(() => {
      setPhase("impact");
      flash.value = 0.94;
      flash.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) });
      shakeX.value = withSequence(withTiming(7, { duration: 52 }), withTiming(-6, { duration: 52 }), withTiming(4, { duration: 52 }), withTiming(0, { duration: 90 }));
      shakeY.value = withSequence(withTiming(-4, { duration: 52 }), withTiming(4, { duration: 52 }), withTiming(-2, { duration: 52 }), withTiming(0, { duration: 90 }));
      cue(1);
    }, CHARACTER_EVOLUTION_TIMELINE_MS.impact);
    schedule(() => {
      setPhase("revealed");
      camera.value = withTiming(1, { duration: 610, easing: Easing.out(Easing.cubic) });
      portraitScale.value = withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) });
      ring.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
      reveal.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
      cue(2);
    }, CHARACTER_EVOLUTION_TIMELINE_MS.reveal);
    schedule(() => dismissRef.current(), CHARACTER_EVOLUTION_TIMELINE_MS.finish);

    return () => {
      timers.forEach(clearTimeout);
      releasePlayers();
    };
  }, [camera, equipmentReveal, evolution.stage, fade, flash, halo, mode, portraitScale, portraitY, reduceMotion, reveal, ring, shakeX, shakeY, soundEnabled, visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const cameraStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }, { translateY: shakeY.value }, { scale: camera.value }] }));
  const portraitStyle = useAnimatedStyle(() => ({ transform: [{ translateY: portraitY.value }, { scale: portraitScale.value }] }));
  const haloStyle = useAnimatedStyle(() => ({ opacity: halo.value, transform: [{ scale: 0.68 + halo.value * 0.6 }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, ring.value), transform: [{ scale: ring.value }] }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const revealStyle = useAnimatedStyle(() => ({ opacity: reveal.value, transform: [{ translateY: 14 * (1 - reveal.value) }] }));
  const equipmentStyle = useAnimatedStyle(() => ({ opacity: equipmentReveal.value, transform: [{ translateY: 12 * (1 - equipmentReveal.value) }, { scale: 0.92 + equipmentReveal.value * 0.08 }] }));

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={onDismiss}>
      <Animated.View style={[styles.modalBackdrop, backdropStyle]}>
        <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss character development" style={styles.modalPressable}>
          <Animated.View accessibilityRole="alert" accessibilityLabel={`${title} level ${level} ${mode === "evolution" ? "character development sequence" : "current character form"}`} style={[styles.powerUpStage, cameraStyle]}>
            <Animated.View pointerEvents="none" style={[styles.powerUpFlash, { backgroundColor: evolution.accent }, flashStyle]} />
            <View pointerEvents="none" style={styles.powerUpParticles}>{Array.from({ length: 16 }, (_, index) => <View key={index} style={[styles.powerUpParticle, { backgroundColor: index % 3 === 0 ? evolution.secondaryAccent : evolution.accent, transform: [{ rotate: `${index * 22.5}deg` }, { translateY: -132 - (index % 4) * 17 }] }]} />)}</View>
            <View style={styles.powerUpTopline}>
              <Text style={[styles.powerUpEyebrow, { color: evolution.accent }]}>{PHASE_COPY[phase]}</Text>
              <Text style={[styles.powerUpDismiss, { color: colors.muted }]}>TAP TO DISMISS</Text>
            </View>
            <View style={styles.powerUpCore}>
              <Animated.View pointerEvents="none" style={[styles.powerUpHalo, { backgroundColor: `${evolution.accent}36` }, haloStyle]} />
              <Animated.View pointerEvents="none" style={[styles.powerUpRing, { borderColor: `${evolution.secondaryAccent}B8` }, ringStyle]} />
              <Animated.View style={[styles.powerUpPortraitFrame, { borderColor: evolution.accent }, portraitStyle]}>
                <Image source={profile.portrait} resizeMode="cover" style={styles.powerUpPortrait} />
                <CharacterGrowthLayers stage={profile.stage} accent={evolution.accent} secondaryAccent={evolution.secondaryAccent} equipment={equipment} />
              </Animated.View>
            </View>
            <Animated.View style={[styles.powerUpReveal, revealStyle]}>
              <Text style={[styles.powerUpTitle, { color: colors.foreground }]}>{title}</Text>
              <Text style={[styles.powerUpRank, { color: evolution.accent }]}>{evolution.formName.toUpperCase()} · LEVEL {level} · STAGE {evolution.stage + 1}</Text>
              <Animated.View style={[styles.equipmentReveal, equipmentStyle]}>
                <Text style={[styles.equipmentRevealLabel, { color: evolution.secondaryAccent }]}>{gear.length ? "EQUIPPED SYSTEMS MATERIALIZED" : "DEVELOPMENT ARMOR MATERIALIZED"}</Text>
                {gear.length ? <View style={styles.powerUpLoadoutRow}>{gear.map(({ slot, item }) => <View key={`${slot}-${item.id}`} style={[styles.powerUpChip, { borderColor: `${evolution.accent}80`, backgroundColor: `${evolution.accent}13` }]}><Text style={[styles.powerUpChipSlot, { color: evolution.secondaryAccent }]}>{slot}</Text><Text numberOfLines={1} style={[styles.powerUpChipText, { color: colors.foreground }]}>{item.name}</Text></View>)}</View> : <View style={[styles.powerUpAbility, { borderColor: `${evolution.accent}88`, backgroundColor: `${evolution.accent}16` }]}><Text style={[styles.powerUpAbilityLabel, { color: evolution.accent }]}>{evolution.armor.toUpperCase()}</Text><Text numberOfLines={1} style={[styles.powerUpAbilityText, { color: colors.foreground }]}>{evolution.weaponSystem}</Text></View>}</Animated.View>
              <Text style={[styles.powerUpAura, { color: colors.muted }]}>{evolution.aura}</Text>
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
  growthLayers: { ...StyleSheet.absoluteFillObject },
  coreLight: { position: "absolute", bottom: "24%", left: "48%", shadowColor: "#FFFFFF", shadowRadius: 7, shadowOpacity: 0.9, elevation: 4 },
  visor: { position: "absolute", top: "35%", left: "50%", marginLeft: -14, borderWidth: 1.5, backgroundColor: "#07101844" },
  leftPauldron: { position: "absolute", bottom: "18%", left: "5%", borderWidth: 1.3, backgroundColor: "#07101866" },
  rightWeapon: { position: "absolute", right: "9%", bottom: "13%", shadowColor: "#FFFFFF", shadowOpacity: 0.4, shadowRadius: 5, elevation: 4 },
  accessoryNode: { position: "absolute", right: "22%", bottom: "33%", borderWidth: 1.4, backgroundColor: "#07101888" },
  orbitLine: { position: "absolute", top: "4%", left: "4%", borderWidth: 1, borderStyle: "dashed" },
  sovereignCrown: { position: "absolute", top: "6%", left: "50%", marginLeft: -7, width: 0, height: 0, borderLeftColor: "transparent", borderRightColor: "transparent" },
  label: { alignItems: "center", gap: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9, borderWidth: StyleSheet.hairlineWidth, maxWidth: 132 },
  labelText: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.7 },
  detailText: { fontSize: 8, lineHeight: 11, fontWeight: "800", maxWidth: 120, textAlign: "center" },
  gearPips: { flexDirection: "row", gap: 3, marginTop: 1 },
  gearPip: { width: 4, height: 4, borderRadius: 2 },
  modalBackdrop: { flex: 1, backgroundColor: "#06101BD6", alignItems: "center", justifyContent: "center", padding: 24 },
  modalPressable: { width: "100%", alignItems: "center", justifyContent: "center", flex: 1 },
  powerUpStage: { width: "100%", maxWidth: 390, minHeight: 540, paddingHorizontal: 20, paddingVertical: 22, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  powerUpFlash: { ...StyleSheet.absoluteFillObject },
  powerUpParticles: { position: "absolute", width: 8, height: 8, alignItems: "center", justifyContent: "center" },
  powerUpParticle: { position: "absolute", width: 3, height: 15, borderRadius: 4, opacity: 0.78 },
  powerUpTopline: { position: "absolute", top: 24, left: 20, right: 20, flexDirection: "row", justifyContent: "space-between", gap: 10 },
  powerUpEyebrow: { flex: 1, fontSize: 10, lineHeight: 13, fontWeight: "900", letterSpacing: 1.05 },
  powerUpDismiss: { fontSize: 8, lineHeight: 12, fontWeight: "800", letterSpacing: 0.55 },
  powerUpCore: { width: 266, height: 266, alignItems: "center", justifyContent: "center", marginTop: 22 },
  powerUpHalo: { position: "absolute", width: 238, height: 238, borderRadius: 119 },
  powerUpRing: { position: "absolute", width: 220, height: 220, borderRadius: 110, borderWidth: 2, borderStyle: "dashed" },
  powerUpPortraitFrame: { width: 192, height: 192, overflow: "hidden", borderRadius: 96, borderWidth: 3, backgroundColor: "#111B29", shadowColor: "#000", shadowOpacity: 0.48, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 11 },
  powerUpPortrait: { width: "100%", height: "100%" },
  powerUpReveal: { width: "100%", alignItems: "center", gap: 7, marginTop: 2 },
  powerUpTitle: { fontSize: 29, lineHeight: 34, fontWeight: "900", textAlign: "center", letterSpacing: -0.45 },
  powerUpRank: { fontSize: 10, lineHeight: 14, fontWeight: "900", letterSpacing: 0.85, textAlign: "center" },
  equipmentReveal: { width: "100%", alignItems: "center", gap: 7 },
  equipmentRevealLabel: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.8, textAlign: "center" },
  powerUpLoadoutRow: { width: "100%", flexDirection: "row", gap: 7 },
  powerUpChip: { flex: 1, minHeight: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 6, paddingVertical: 5, gap: 1 },
  powerUpChipSlot: { fontSize: 7, lineHeight: 9, fontWeight: "900", letterSpacing: 0.75 },
  powerUpChipText: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.25, textAlign: "center" },
  powerUpAbility: { width: "100%", borderWidth: StyleSheet.hairlineWidth, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 8, alignItems: "center", gap: 2 },
  powerUpAbilityLabel: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.72, textAlign: "center" },
  powerUpAbilityText: { fontSize: 13, lineHeight: 17, fontWeight: "900", textAlign: "center" },
  powerUpAura: { fontSize: 9, lineHeight: 13, fontWeight: "800", textAlign: "center", letterSpacing: 0.35 },
});
