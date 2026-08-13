import { useEffect, useMemo, useRef, useState } from "react";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { VideoView, useVideoPlayer } from "expo-video";
import { AppState, Image, Modal, Pressable, type ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import { useColors } from "@/hooks/use-colors";
import {
  CHARACTER_EVOLUTION_TIMELINE_MS,
  getCharacterEvolutionProfile,
  getCharacterEvolutionVideoDurationMs,
  getCharacterPortraitVariant,
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

const CHARACTER_EVOLUTION_AUDIO_SOURCES = [
  require("@/assets/sounds/character-evolution-cinematic-best.mp3"),
  require("@/assets/sounds/evolution-armor-materialize.mp3"),
  require("@/assets/sounds/evolution-weapon-portal.mp3"),
  require("@/assets/sounds/evolution-impact-flash.mp3"),
  require("@/assets/sounds/evolution-title-reward.mp3"),
] as const;

const CHARACTER_EVOLUTION_VIDEO_SOURCES = {
  tactical: require("@/assets/videos/character-cycles/recruit-tactical-10s.mp4"),
  command: require("@/assets/videos/character-cycles/officer-command-10s.mp4"),
  shadow: require("@/assets/videos/character-cycles/shadow-10s.mp4"),
  ascendant: require("@/assets/videos/character-cycles/vanguard-ascendant-10s.mp4"),
} as const;

const CHARACTER_EVOLUTION_VIDEO_SOUNDTRACK_SOURCE = require("@/assets/sounds/character-evolution-video-10s.mp3");
const CHARACTER_EVOLUTION_POST_VIDEO_REVEAL_SOURCE = require("@/assets/sounds/character-evolution-ending.mp3");

export function getRankProfile(title: string, level: number): RankProfile {
  const evolution = getCharacterEvolutionProfile(title, level);
  const portrait = PORTRAITS[getCharacterPortraitVariant(title, level)];
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

type PowerUpPhase = "activation" | "build" | "visor" | "armor" | "weapon" | "ring" | "impact" | "revealed" | "reward" | "acknowledgement";

const PHASE_COPY: Record<PowerUpPhase, string> = {
  activation: "EVOLUTION PROTOCOL",
  build: "ENERGY MATRIX ONLINE",
  visor: "HEAD SYSTEMS LOCKING",
  armor: "ARMOR MATERIALIZING",
  weapon: "WEAPON SYSTEM DEPLOYING",
  ring: "PORTAL FIELD STABLE",
  impact: "POWER SURGE",
  revealed: "FORM CONFIRMED",
  reward: "PROGRESSION SYNCHRONIZED",
  acknowledgement: "CURRENT FORM STABLE",
};

function EquipmentReadout({ gear, accent, secondaryAccent, foreground }: { gear: { slot: "HEAD" | "BODY" | "AUX"; item: { id: string; name: string } }[]; accent: string; secondaryAccent: string; foreground: string }) {
  if (!gear.length) return <Text style={[styles.cinematicReadout, { color: secondaryAccent }]}>DEVELOPMENT ARMOR · WEAPON ARRAY</Text>;
  return <View style={styles.cinematicGearRow}>{gear.map(({ slot, item }) => <View key={`${slot}-${item.id}`} style={[styles.cinematicGearChip, { borderColor: `${accent}99`, backgroundColor: `${accent}15` }]}><Text style={[styles.cinematicGearSlot, { color: secondaryAccent }]}>{slot}</Text><Text numberOfLines={1} style={[styles.cinematicGearName, { color: foreground }]}>{item.name}</Text></View>)}</View>;
}

export function RankCharacterAchievement({
  title,
  level,
  reduceMotion,
  visible,
  onDismiss,
  soundEnabled = true,
  equipment = {},
  mode = "evolution",
  totalXp = 0,
  goldBalance = 0,
}: {
  title: string;
  level: number;
  reduceMotion: boolean;
  visible: boolean;
  onDismiss: () => void;
  soundEnabled?: boolean;
  equipment?: EquippedCharacterGear;
  mode?: CharacterPresentationMode;
  totalXp?: number;
  goldBalance?: number;
}) {
  const colors = useColors();
  const profile = getRankProfile(title, level);
  const evolution = useMemo(() => getCharacterEvolutionProfile(title, level), [level, title]);
  const cinematicVideoDurationMs = getCharacterEvolutionVideoDurationMs(evolution.cinematicVariant);
  const gear = useMemo(() => getEquippedGearLabels(equipment), [equipment]);
  const [phase, setPhase] = useState<PowerUpPhase>("activation");
  const fade = useSharedValue(0);
  const camera = useSharedValue(0.92);
  const portraitScale = useSharedValue(0.48);
  const portraitY = useSharedValue(44);
  const portal = useSharedValue(0);
  const ribbon = useSharedValue(0);
  const particles = useSharedValue(0);
  const flash = useSharedValue(0);
  const shockwave = useSharedValue(0);
  const reveal = useSharedValue(0);
  const reward = useSharedValue(0);
  const videoOpacity = useSharedValue(0);
  const [videoVisible, setVideoVisible] = useState(false);
  const videoPlayer = useVideoPlayer(CHARACTER_EVOLUTION_VIDEO_SOURCES[evolution.cinematicVariant], (player) => {
    player.loop = false;
    player.muted = true;
  });
  const spin = useSharedValue(0);
  const counterSpin = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const shakeY = useSharedValue(0);
  const dismissRef = useRef(onDismiss);
  const playersRef = useRef<ReturnType<typeof createAudioPlayer>[]>([]);
  const videoSoundtrackPlayerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const postVideoRevealPlayerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const usesSuppliedTenSecondCinematic = evolution.cinematicVariant !== "shadow";
  const variationSeed = level + evolution.stage + (evolution.family === "shadow" ? 1 : evolution.family === "ascendant" ? 2 : evolution.family === "command" ? 3 : 0);
  const impactDirection = variationSeed % 2 === 0 ? 1 : -1;
  const cinematicIntensity = 1 + evolution.stage * 0.09 + (level % 3) * 0.045;

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
    const scaled = (duration: number) => reduceMotion ? Math.min(220, duration) : duration;
    const schedule = (callback: () => void, delay: number) => timers.push(setTimeout(callback, scaled(delay)));
    const releasePlayers = () => {
      for (const player of playersRef.current) {
        try {
          player.remove();
        } catch {
          // Native audio cleanup must never obstruct the visual dismissal path.
        }
      }
      playersRef.current = [];
      const videoSoundtrackPlayer = videoSoundtrackPlayerRef.current;
      if (videoSoundtrackPlayer) {
        try {
          videoSoundtrackPlayer.pause();
          videoSoundtrackPlayer.seekTo(0);
          videoSoundtrackPlayer.remove();
        } catch {
          // Native during-video soundtrack cleanup must never obstruct dismissal.
        }
      }
      videoSoundtrackPlayerRef.current = null;
      const postVideoRevealPlayer = postVideoRevealPlayerRef.current;
      if (postVideoRevealPlayer) {
        try {
          postVideoRevealPlayer.pause();
          postVideoRevealPlayer.seekTo(0);
          postVideoRevealPlayer.remove();
        } catch {
          // Native post-video soundtrack cleanup must never obstruct dismissal.
        }
      }
      postVideoRevealPlayerRef.current = null;
    };
    const stopVideoSoundtrack = () => {
      const videoSoundtrackPlayer = videoSoundtrackPlayerRef.current;
      if (!videoSoundtrackPlayer) return;
      try {
        videoSoundtrackPlayer.pause();
        videoSoundtrackPlayer.seekTo(0);
      } catch {
        // A soundtrack interruption must never leave the cinematic modal unresponsive.
      }
    };
    const playVideoSoundtrack = () => {
      const videoSoundtrackPlayer = videoSoundtrackPlayerRef.current;
      if (!videoSoundtrackPlayer) return;
      try {
        videoSoundtrackPlayer.pause();
        videoSoundtrackPlayer.seekTo(0);
        videoSoundtrackPlayer.volume = 0.24;
        videoSoundtrackPlayer.play();
      } catch {
        // Original video audio remains available if the separate soundtrack cannot start.
      }
    };
    const stopVideo = () => {
      try {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
      } catch {
        // Native video cleanup must never block dismissal or app-state recovery.
      }
      setVideoVisible(false);
      videoOpacity.value = 0;
      stopVideoSoundtrack();
    };
    const playArmorVideo = () => {
      try {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
        videoPlayer.muted = !usesSuppliedTenSecondCinematic;
        videoPlayer.volume = usesSuppliedTenSecondCinematic ? 0.9 : 1;
        setVideoVisible(true);
        videoOpacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
        videoPlayer.play();
        if (usesSuppliedTenSecondCinematic) playVideoSoundtrack();
      } catch {
        stopVideo();
      }
    };
    const finishArmorVideo = () => {
      try {
        videoPlayer.pause();
      } catch {
        // Reaching the end of a native video must never prevent visual completion.
      }
      stopVideoSoundtrack();
      videoOpacity.value = withTiming(0, { duration: 340, easing: Easing.out(Easing.quad) });
    };
    const playPostVideoReveal = () => {
      const postVideoRevealPlayer = postVideoRevealPlayerRef.current;
      if (!postVideoRevealPlayer) return;
      try {
        postVideoRevealPlayer.pause();
        postVideoRevealPlayer.seekTo(0);
        postVideoRevealPlayer.play();
      } catch {
        // The character-information reveal must continue if its ending cue is unavailable.
      }
    };
    const prepareEffects = () => {
      if (!soundEnabled || mode !== "evolution") return;
      try {
        if (usesSuppliedTenSecondCinematic) {
          videoSoundtrackPlayerRef.current = createAudioPlayer(CHARACTER_EVOLUTION_VIDEO_SOUNDTRACK_SOURCE);
          postVideoRevealPlayerRef.current = createAudioPlayer(CHARACTER_EVOLUTION_POST_VIDEO_REVEAL_SOURCE);
        } else {
          playersRef.current = CHARACTER_EVOLUTION_AUDIO_SOURCES.map((source) => createAudioPlayer(source));
        }
        void setAudioModeAsync({ playsInSilentMode: true });
      } catch {
        releasePlayers();
      }
    };
    const playEffect = (index: number) => {
      const player = playersRef.current[index];
      if (!player) return;
      try {
        player.seekTo(0);
        player.play();
      } catch {
        // A missing cue must never disrupt the visual progression result.
      }
    };
    const pulse = (strength = 0.78) => {
      flash.value = strength;
      flash.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.quad) });
    };

    releasePlayers();
    stopVideo();
    fade.value = 0;
    camera.value = 0.92;
    portraitScale.value = reduceMotion ? 1 : 0.48;
    portraitY.value = reduceMotion ? 0 : 44;
    portal.value = 0;
    ribbon.value = 0;
    particles.value = 0;
    flash.value = 0;
    shockwave.value = 0;
    reveal.value = 0;
    reward.value = 0;
    spin.value = 0;
    counterSpin.value = 0;
    shakeX.value = 0;
    shakeY.value = 0;

    if (mode === "acknowledgement") {
      setPhase("acknowledgement");
      fade.value = withTiming(1, { duration: 180 });
      portraitScale.value = withTiming(0.82, { duration: 260, easing: Easing.out(Easing.cubic) });
      portal.value = withTiming(0.5, { duration: 260 });
      reveal.value = withTiming(1, { duration: 230 });
      schedule(() => dismissRef.current(), CHARACTER_EVOLUTION_TIMELINE_MS.acknowledgementFinish);
      return () => {
        timers.forEach(clearTimeout);
        releasePlayers();
      };
    }

    setPhase("activation");
    fade.value = withTiming(1, { duration: scaled(180), easing: Easing.out(Easing.quad) });
    prepareEffects();
    playEffect(0);

    if (reduceMotion) {
      portraitScale.value = 1;
      portraitY.value = 0;
      portal.value = 0.9;
      ribbon.value = 1;
      particles.value = 1;
      reveal.value = 1;
      reward.value = 1;
      setPhase("reward");
      schedule(() => dismissRef.current(), CHARACTER_EVOLUTION_TIMELINE_MS.acknowledgementFinish);
      return () => {
        timers.forEach(clearTimeout);
        releasePlayers();
      };
    }

    portraitScale.value = withTiming(0.9, { duration: CHARACTER_EVOLUTION_TIMELINE_MS.build, easing: Easing.out(Easing.cubic) });
    portraitY.value = withTiming(0, { duration: CHARACTER_EVOLUTION_TIMELINE_MS.build, easing: Easing.out(Easing.cubic) });
    schedule(() => {
      setPhase("build");
      portal.value = withTiming(0.88, { duration: 640, easing: Easing.out(Easing.cubic) });
      ribbon.value = withTiming(1, { duration: 780, easing: Easing.out(Easing.cubic) });
      particles.value = withTiming(1, { duration: 780, easing: Easing.out(Easing.quad) });
      spin.value = withRepeat(withTiming(1, { duration: 3_400, easing: Easing.linear }), -1, false);
      counterSpin.value = withRepeat(withTiming(-1, { duration: 2_200, easing: Easing.linear }), -1, false);
    }, CHARACTER_EVOLUTION_TIMELINE_MS.build);
    schedule(() => {
      setPhase("visor");
      pulse(0.34);
    }, CHARACTER_EVOLUTION_TIMELINE_MS.visor);
    schedule(() => {
      setPhase("armor");
      playArmorVideo();
      portraitScale.value = withTiming(1.06 + evolution.stage * 0.012, { duration: 660, easing: Easing.out(Easing.exp) });
      pulse(Math.min(0.62, 0.44 * cinematicIntensity));
    }, CHARACTER_EVOLUTION_TIMELINE_MS.materialize);
    schedule(() => {
      pulse(Math.min(0.48, 0.26 * cinematicIntensity));
    }, CHARACTER_EVOLUTION_TIMELINE_MS.materialize + 1_760);
    schedule(() => {
      pulse(Math.min(0.42, 0.22 * cinematicIntensity));
    }, CHARACTER_EVOLUTION_TIMELINE_MS.materialize + 3_380);
    schedule(() => {
      finishArmorVideo();
    }, CHARACTER_EVOLUTION_TIMELINE_MS.materialize + cinematicVideoDurationMs - 340);
    schedule(() => {
      stopVideo();
      if (usesSuppliedTenSecondCinematic) {
        playPostVideoReveal();
      } else {
        playEffect(1);
      }
    }, CHARACTER_EVOLUTION_TIMELINE_MS.materialize + cinematicVideoDurationMs);
    schedule(() => {
      setPhase("weapon");
      playEffect(2);
      portal.value = withTiming(1.1 + evolution.stage * 0.025, { duration: 650, easing: Easing.out(Easing.quad) });
      pulse(Math.min(0.78, 0.56 * cinematicIntensity));
    }, CHARACTER_EVOLUTION_TIMELINE_MS.materialize + cinematicVideoDurationMs + 420);
    schedule(() => {
      setPhase("ring");
      shockwave.value = 0;
      shockwave.value = withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) });
    }, CHARACTER_EVOLUTION_TIMELINE_MS.materialize + cinematicVideoDurationMs + 1_250);
    schedule(() => {
      setPhase("impact");
      playEffect(3);
      pulse(Math.min(1, 0.82 * cinematicIntensity));
      shakeX.value = withSequence(withTiming(13 * impactDirection * cinematicIntensity, { duration: 44 }), withTiming(-11 * impactDirection * cinematicIntensity, { duration: 50 }), withTiming(8 * impactDirection * cinematicIntensity, { duration: 46 }), withTiming(-4 * impactDirection * cinematicIntensity, { duration: 44 }), withTiming(0, { duration: 100 }));
      shakeY.value = withSequence(withTiming(-8 * cinematicIntensity, { duration: 44 }), withTiming(7 * cinematicIntensity, { duration: 50 }), withTiming(-5 * cinematicIntensity, { duration: 46 }), withTiming(3 * cinematicIntensity, { duration: 44 }), withTiming(0, { duration: 100 }));
      portraitScale.value = withSequence(withTiming(1.16 + evolution.stage * 0.018, { duration: 120 }), withTiming(1, { duration: 430, easing: Easing.out(Easing.cubic) }));
    }, CHARACTER_EVOLUTION_TIMELINE_MS.materialize + cinematicVideoDurationMs + 1_950);
    schedule(() => {
      setPhase("revealed");
      playEffect(4);
      camera.value = withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) });
      reveal.value = withTiming(1, { duration: 430, easing: Easing.out(Easing.cubic) });
    }, CHARACTER_EVOLUTION_TIMELINE_MS.materialize + cinematicVideoDurationMs + 2_550);
    schedule(() => {
      setPhase("reward");
      reward.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) });
    }, CHARACTER_EVOLUTION_TIMELINE_MS.materialize + cinematicVideoDurationMs + 3_650);
    schedule(() => dismissRef.current(), CHARACTER_EVOLUTION_TIMELINE_MS.materialize + cinematicVideoDurationMs + 5_400);

    return () => {
      timers.forEach(clearTimeout);
      stopVideo();
      releasePlayers();
    };
  }, [camera, cinematicIntensity, cinematicVideoDurationMs, counterSpin, evolution.stage, fade, flash, impactDirection, mode, particles, portal, portraitScale, portraitY, reduceMotion, reveal, reward, ribbon, shakeX, shakeY, shockwave, soundEnabled, spin, usesSuppliedTenSecondCinematic, videoOpacity, videoPlayer, visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const stageStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }, { translateY: shakeY.value }, { scale: camera.value }] }));
  const portraitStyle = useAnimatedStyle(() => ({ transform: [{ translateY: portraitY.value }, { scale: portraitScale.value }] }));
  const portalStyle = useAnimatedStyle(() => ({ opacity: portal.value, transform: [{ rotate: `${spin.value * 360}deg` }, { scale: 0.72 + portal.value * 0.38 }] }));
  const innerPortalStyle = useAnimatedStyle(() => ({ opacity: portal.value * 0.86, transform: [{ rotate: `${counterSpin.value * 360}deg` }, { scale: 0.6 + portal.value * 0.31 }] }));
  const ribbonStyle = useAnimatedStyle(() => ({ opacity: ribbon.value, transform: [{ scale: 0.78 + ribbon.value * 0.25 }, { rotate: `${-13 + ribbon.value * 12}deg` }] }));
  const particleStyle = useAnimatedStyle(() => ({ opacity: particles.value, transform: [{ scale: 0.7 + particles.value * 0.35 }] }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const shockwaveStyle = useAnimatedStyle(() => ({ opacity: 1 - shockwave.value, transform: [{ scale: 0.45 + shockwave.value * 2.25 }] }));
  const videoStyle = useAnimatedStyle(() => ({ opacity: videoOpacity.value, transform: [{ scale: 0.94 + videoOpacity.value * 0.06 }] }));
  const revealStyle = useAnimatedStyle(() => ({ opacity: reveal.value, transform: [{ translateY: 20 * (1 - reveal.value) }] }));
  const rewardStyle = useAnimatedStyle(() => ({ opacity: reward.value, transform: [{ translateY: 14 * (1 - reward.value) }, { scale: 0.94 + reward.value * 0.06 }] }));

  const tierText = `${evolution.formName.toUpperCase()} · LEVEL ${level} · STAGE ${evolution.stage + 1}`;
  const xpText = Math.max(0, Math.round(totalXp)).toLocaleString("en-IN");
  const goldText = Math.max(0, Math.round(goldBalance)).toLocaleString("en-IN");
  const phaseCopy = phase === "armor"
    ? evolution.materializationLabel
    : phase === "impact"
      ? evolution.impactLabel
      : PHASE_COPY[phase];

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={onDismiss}>
      <Animated.View style={[styles.modalBackdrop, backdropStyle]}>
        <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss character evolution" style={styles.modalPressable}>
          <Animated.View accessibilityRole="alert" accessibilityLabel={`${title} level ${level} ${mode === "evolution" ? "character evolution sequence" : "current character form"}`} style={[styles.cinematicStage, stageStyle]}>
            <Animated.View pointerEvents="none" style={[styles.cinematicFlash, { backgroundColor: evolution.accent }, flashStyle]} />
            <View pointerEvents="none" style={styles.cinematicNoise} />
            <View pointerEvents="none" style={styles.cinematicTopline}><Text style={[styles.cinematicProtocol, { color: evolution.accent }]}>{phaseCopy}</Text><Text style={styles.cinematicDismiss}>TAP TO DISMISS</Text></View>
            <Animated.View pointerEvents="none" style={[styles.cinematicPortal, { borderColor: `${evolution.accent}D8` }, portalStyle]} />
            <Animated.View pointerEvents="none" style={[styles.cinematicPortalInner, { borderColor: `${evolution.secondaryAccent}A8` }, innerPortalStyle]} />
            <Animated.View pointerEvents="none" style={[styles.cinematicShockwave, { borderColor: `${evolution.accent}B8` }, shockwaveStyle]} />
            <Animated.View pointerEvents="none" style={[styles.cinematicRibbon, { backgroundColor: evolution.accent, shadowColor: evolution.accent }, ribbonStyle]}><View style={[styles.cinematicRibbonCore, { backgroundColor: evolution.secondaryAccent }]} /></Animated.View>
            <Animated.View pointerEvents="none" style={[styles.cinematicParticles, particleStyle]}>{Array.from({ length: 22 }, (_, index) => <View key={index} style={[styles.cinematicParticle, { backgroundColor: index % 4 === 0 ? evolution.secondaryAccent : evolution.accent, transform: [{ rotate: `${index * 16.35}deg` }, { translateY: -92 - (index % 5) * 29 }] }]} />)}</Animated.View>
            <Animated.View style={[styles.cinematicAvatarSystem, portraitStyle]}>
              <View pointerEvents="none" style={[styles.cinematicAvatarAura, { backgroundColor: `${evolution.accent}28`, shadowColor: evolution.accent }]} />
              <Image source={profile.portrait} resizeMode="contain" style={styles.cinematicPortrait} />
              {videoVisible ? <Animated.View pointerEvents="none" style={[styles.cinematicVideoFrame, { borderColor: `${evolution.accent}72`, shadowColor: evolution.accent }, videoStyle]}>
                <VideoView player={videoPlayer} contentFit="cover" nativeControls={false} surfaceType="textureView" style={styles.cinematicArmorVideo} />
              </Animated.View> : null}
            </Animated.View>
            <Animated.View style={[styles.cinematicReveal, revealStyle]}>
              <Text style={[styles.cinematicTitle, { color: colors.foreground }]}>{title}</Text>
              <Text style={[styles.cinematicRank, { color: evolution.accent }]}>{tierText}</Text>
              <EquipmentReadout gear={gear} accent={evolution.accent} secondaryAccent={evolution.secondaryAccent} foreground={colors.foreground} />
              <Text style={[styles.cinematicAura, { color: colors.muted }]}>{evolution.aura.toUpperCase()}</Text>
            </Animated.View>
            <Animated.View style={[styles.cinematicReward, { borderColor: `${evolution.accent}9E`, backgroundColor: `${evolution.accent}14` }, rewardStyle]}>
              <View><Text style={[styles.cinematicRewardEyebrow, { color: evolution.secondaryAccent }]}>LEVEL REACHED</Text><Text style={[styles.cinematicRewardValue, { color: colors.foreground }]}>LEVEL {level}</Text></View>
              <View style={styles.cinematicRewardDivider} />
              <View><Text style={[styles.cinematicRewardEyebrow, { color: evolution.secondaryAccent }]}>TOTAL XP</Text><Text style={[styles.cinematicRewardValue, { color: colors.foreground }]}>{xpText}</Text></View>
              <View style={styles.cinematicRewardDivider} />
              <View><Text style={[styles.cinematicRewardEyebrow, { color: evolution.secondaryAccent }]}>GOLD CACHE</Text><Text style={[styles.cinematicRewardValue, { color: colors.foreground }]}>{goldText}</Text></View>
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
  modalBackdrop: { flex: 1, backgroundColor: "#020914EE", alignItems: "center", justifyContent: "center" },
  modalPressable: { width: "100%", alignItems: "center", justifyContent: "center", flex: 1 },
  cinematicStage: { width: "100%", maxWidth: 440, height: "100%", minHeight: 600, paddingHorizontal: 18, paddingTop: 48, paddingBottom: 34, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  cinematicFlash: { ...StyleSheet.absoluteFillObject },
  cinematicNoise: { position: "absolute", width: "136%", height: "136%", borderRadius: 999, backgroundColor: "#0A234650" },
  cinematicTopline: { position: "absolute", top: 55, left: 22, right: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  cinematicProtocol: { flex: 1, fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 1.45 },
  cinematicDismiss: { color: "#9CAFBE", fontSize: 8, lineHeight: 11, fontWeight: "800", letterSpacing: 0.75 },
  cinematicPortal: { position: "absolute", width: 334, height: 334, borderRadius: 167, borderWidth: 1.6, borderStyle: "dashed", shadowOpacity: 0.7, shadowRadius: 14, elevation: 8 },
  cinematicPortalInner: { position: "absolute", width: 256, height: 256, borderRadius: 128, borderWidth: 1.3, borderStyle: "dotted" },
  cinematicShockwave: { position: "absolute", width: 170, height: 170, borderRadius: 85, borderWidth: 2 },
  cinematicRibbon: { position: "absolute", width: 36, height: 450, borderRadius: 42, opacity: 0.72, shadowOpacity: 0.95, shadowRadius: 24, elevation: 10, transform: [{ rotate: "-16deg" }] },
  cinematicRibbonCore: { width: 9, height: "100%", alignSelf: "center", borderRadius: 10, opacity: 0.82 },
  cinematicParticles: { position: "absolute", width: 8, height: 8, alignItems: "center", justifyContent: "center" },
  cinematicParticle: { position: "absolute", width: 3, height: 20, borderRadius: 4, opacity: 0.9 },
  cinematicAvatarSystem: { width: 300, height: 365, alignItems: "center", justifyContent: "flex-end", position: "relative" },
  cinematicAvatarAura: { position: "absolute", width: 230, height: 230, borderRadius: 115, bottom: 55, shadowOpacity: 0.9, shadowRadius: 30, elevation: 6 },
  cinematicPortrait: { width: 294, height: 352, zIndex: 1 },
  cinematicVideoFrame: { position: "absolute", width: 234, height: 300, bottom: 14, borderRadius: 24, borderWidth: 1, overflow: "hidden", zIndex: 4, backgroundColor: "#020914", shadowOpacity: 0.76, shadowRadius: 20, elevation: 17 },
  cinematicArmorVideo: { width: "100%", height: "100%" },
  cinematicVisor: { position: "absolute", width: 92, height: 18, top: 93, borderRadius: 11, borderWidth: 2, backgroundColor: "#04142699", zIndex: 4, shadowOpacity: 0.95, shadowRadius: 11, elevation: 14, overflow: "hidden" },
  cinematicVisorBeam: { position: "absolute", left: 9, right: 9, top: 6, height: 3, borderRadius: 2 },
  cinematicArmorSystem: { ...StyleSheet.absoluteFillObject, zIndex: 3 },
  cinematicArmorPiece: { ...StyleSheet.absoluteFillObject },
  cinematicPauldron: { position: "absolute", top: 144, width: 72, height: 40, borderWidth: 2, backgroundColor: "#071421C7", shadowOpacity: 0.8, shadowRadius: 12, elevation: 11 },
  cinematicLeftPauldron: { left: 47, borderTopLeftRadius: 26, borderBottomLeftRadius: 12, transform: [{ rotate: "-12deg" }] },
  cinematicRightPauldron: { right: 47, borderTopRightRadius: 26, borderBottomRightRadius: 12, transform: [{ rotate: "12deg" }] },
  cinematicBreastplate: { position: "absolute", top: 170, left: 88, right: 88, height: 111, borderWidth: 2, borderTopLeftRadius: 34, borderTopRightRadius: 34, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, backgroundColor: "#061421C4", alignItems: "center", paddingTop: 25, shadowOpacity: 0.76, shadowRadius: 13, elevation: 12 },
  cinematicChestCore: { width: 16, height: 16, borderRadius: 8, shadowOpacity: 0.94, shadowRadius: 12, elevation: 13 },
  cinematicArmorLine: { marginTop: 12, width: 75, height: 2, borderRadius: 1, opacity: 0.85 },
  cinematicHipPlate: { position: "absolute", top: 275, left: 112, right: 112, height: 31, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderWidth: 1.5, borderTopWidth: 0, backgroundColor: "#061421B0" },
  cinematicWeaponSystem: { position: "absolute", right: 17, top: 152, zIndex: 5 },
  cinematicWeaponBody: { width: 40, height: 157, borderRadius: 18, borderWidth: 2, backgroundColor: "#071B2DE8", alignItems: "center", shadowOpacity: 0.95, shadowRadius: 13, elevation: 16 },
  cinematicWeaponRail: { width: 5, height: 104, marginTop: 16, borderRadius: 5 },
  cinematicWeaponCore: { position: "absolute", width: 14, height: 14, borderRadius: 7, top: 63, shadowOpacity: 0.95, shadowRadius: 12, elevation: 17 },
  cinematicWeaponTip: { position: "absolute", bottom: -14, width: 16, height: 32, borderRadius: 9 },
  cinematicReveal: { position: "absolute", left: 22, right: 22, bottom: 114, alignItems: "center", gap: 6 },
  cinematicTitle: { fontSize: 30, lineHeight: 35, fontWeight: "900", textAlign: "center", letterSpacing: -0.45 },
  cinematicRank: { fontSize: 9, lineHeight: 13, fontWeight: "900", letterSpacing: 1.05, textAlign: "center" },
  cinematicReadout: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.85, textAlign: "center" },
  cinematicGearRow: { width: "100%", flexDirection: "row", gap: 5, marginTop: 1 },
  cinematicGearChip: { flex: 1, minWidth: 0, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 4, paddingVertical: 4, alignItems: "center", gap: 1 },
  cinematicGearSlot: { fontSize: 6, lineHeight: 8, fontWeight: "900", letterSpacing: 0.65 },
  cinematicGearName: { width: "100%", fontSize: 7, lineHeight: 9, fontWeight: "800", textAlign: "center" },
  cinematicAura: { fontSize: 8, lineHeight: 11, fontWeight: "700", letterSpacing: 0.55, textAlign: "center" },
  cinematicReward: { position: "absolute", bottom: 29, left: 18, right: 18, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, minHeight: 54, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cinematicRewardDivider: { width: StyleSheet.hairlineWidth, height: 29, backgroundColor: "#6B91A866" },
  cinematicRewardEyebrow: { fontSize: 6, lineHeight: 9, fontWeight: "900", letterSpacing: 0.75 },
  cinematicRewardValue: { fontSize: 13, lineHeight: 16, fontWeight: "900", letterSpacing: -0.1, marginTop: 1 },
});
