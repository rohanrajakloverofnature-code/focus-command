export type PowerUpTier = 0 | 1 | 2 | 3 | 4 | 5;

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
  activation: 0,
  build: 850,
  transformation: 2_750,
  impact: 4_650,
  reveal: 5_100,
  finish: 8_100,
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
  if (level >= 450) return 5;
  if (level >= 300) return 4;
  if (level >= 180) return 3;
  if (level >= 90) return 2;
  if (level >= 30) return 1;
  return 0;
}

export function getPowerUpProfile(title: string, level: number): PowerUpProfile {
  const signature = SIGNATURES[stableTitleIndex(title || "Recruit")];
  const tier = getPowerUpTier(level);
  const amplification = ["Pulse", "Charged", "Overclocked", "Ascended", "Mythic", "Limit-break"] as const;

  return {
    tier,
    titleSignature: signature.name,
    equipment: `${amplification[tier]} ${signature.equipment}`,
    ammunition: tier === 0 ? "Training loadout" : signature.ammunition,
    ability: tier < 2 ? signature.ability : `${amplification[tier]} ${signature.ability}`,
    aura: `${amplification[tier]} ${signature.aura}`,
    intensity: 0.55 + tier * 0.09,
    impactLabel: `${signature.impact} · TIER ${tier + 1}`,
  };
}

export function canStartPowerUp({
  alreadyVisible,
  launchSequenceActive,
  competingPresentationActive,
}: PowerUpAvailability) {
  return !alreadyVisible && !launchSequenceActive && !competingPresentationActive;
}
