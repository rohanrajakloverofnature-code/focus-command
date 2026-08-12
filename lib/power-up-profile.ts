export type PowerUpTier = 0 | 1 | 2 | 3 | 4 | 5;

import { CHARACTER_EVOLUTION_TIMELINE_MS, getCharacterEvolutionProfile, getDevelopmentStage } from "./character-development";

export type PowerUpProfile = {
  tier: PowerUpTier;
  titleSignature: string;
  equipment: string;
  ammunition: string;
  ability: string;
  aura: string;
  intensity: number;
  impactLabel: string;
};

export type PowerUpAvailability = {
  alreadyVisible: boolean;
  launchSequenceActive: boolean;
  competingPresentationActive: boolean;
};

export const POWER_UP_TIMELINE_MS = {
  activation: CHARACTER_EVOLUTION_TIMELINE_MS.activation,
  build: CHARACTER_EVOLUTION_TIMELINE_MS.build,
  transformation: CHARACTER_EVOLUTION_TIMELINE_MS.materialize,
  impact: CHARACTER_EVOLUTION_TIMELINE_MS.impact,
  reveal: CHARACTER_EVOLUTION_TIMELINE_MS.reveal,
  finish: CHARACTER_EVOLUTION_TIMELINE_MS.finish,
} as const;

export const POWER_UP_AUDIO_CUES = [
  { sourceIndex: 0, phase: "activation", at: POWER_UP_TIMELINE_MS.activation },
  { sourceIndex: 1, phase: "build", at: POWER_UP_TIMELINE_MS.build },
  { sourceIndex: 2, phase: "impact", at: POWER_UP_TIMELINE_MS.impact },
] as const;

const SIGNATURES = [
  { name: "Aegis", equipment: "Command blade", ammunition: "3 kinetic cells", ability: "Guard break", aura: "Cobalt field", impact: "Aegis strike" },
  { name: "Volt", equipment: "Arc sidearm", ammunition: "6 plasma rounds", ability: "Flash step", aura: "Violet current", impact: "Volt rupture" },
  { name: "Nova", equipment: "Pulse rifle", ammunition: "9 focused charges", ability: "Nova surge", aura: "Solar flare", impact: "Nova impact" },
  { name: "Phantom", equipment: "Phase blades", ammunition: "12 spectral darts", ability: "Shadow shift", aura: "Indigo veil", impact: "Phantom break" },
  { name: "Sentinel", equipment: "Aegis cannon", ammunition: "15 armor-piercing cells", ability: "Orbital guard", aura: "Emerald shield", impact: "Sentinel crash" },
  { name: "Eclipse", equipment: "Singularity lance", ammunition: "18 void charges", ability: "Eclipse drive", aura: "Astral corona", impact: "Eclipse collapse" },
] as const;

function stableTitleIndex(title: string) {
  let value = 0;
  for (let index = 0; index < title.length; index += 1) value = (value * 31 + title.charCodeAt(index)) >>> 0;
  return value % SIGNATURES.length;
}

export function getPowerUpTier(level: number): PowerUpTier {
  return getDevelopmentStage(level);
}

export function getPowerUpProfile(title: string, level: number): PowerUpProfile {
  const signature = SIGNATURES[stableTitleIndex(title || "Recruit")];
  const tier = getPowerUpTier(level);
  const evolution = getCharacterEvolutionProfile(title, level);
  const amplification = ["Pulse", "Charged", "Overclocked", "Ascended", "Mythic", "Limit-break"] as const;

  return {
    tier,
    titleSignature: signature.name,
    equipment: `${amplification[tier]} ${signature.equipment}`,
    ammunition: tier === 0 ? "Training loadout" : signature.ammunition,
    ability: tier < 2 ? signature.ability : `${amplification[tier]} ${signature.ability}`,
    aura: `${amplification[tier]} ${evolution.aura}`,
    intensity: 0.5 + tier * 0.1,
    impactLabel: `${signature.impact} · TIER ${tier + 1} · ${evolution.formName.toUpperCase()}`,
  };
}

export function canStartPowerUp({
  alreadyVisible,
  launchSequenceActive,
  competingPresentationActive,
}: PowerUpAvailability) {
  return !alreadyVisible && !launchSequenceActive && !competingPresentationActive;
}
