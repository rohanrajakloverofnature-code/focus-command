import type { Equipment } from "./focus-command";

export type CharacterFamily = "tactical" | "command" | "shadow" | "ascendant";
export type DevelopmentStage = 0 | 1 | 2 | 3 | 4 | 5;
export type CharacterCinematicVariant = "tactical" | "command" | "shadow" | "ascendant" | "tacticalEvolution" | "commandEvolution" | "baseAscendant";
export type CharacterPortraitVariant = "recruit" | "officer" | "shadow" | "vanguard" | "tactical" | "command" | "ascendant" | "evolutionAscendant";

export type EquippedCharacterGear = {
  head?: Equipment;
  body?: Equipment;
  accessory?: Equipment;
};

export type CharacterEvolutionMilestone = {
  title: string;
  level: number;
  stage: DevelopmentStage;
  family: CharacterFamily;
  equipmentSignature: string;
};

export type CharacterEvolutionProfile = {
  stage: DevelopmentStage;
  family: CharacterFamily;
  formName: string;
  accent: string;
  secondaryAccent: string;
  armor: string;
  weaponSystem: string;
  aura: string;
  materializationLabel: string;
  impactLabel: string;
  portraitKey: CharacterFamily;
  cinematicVariant: CharacterCinematicVariant;
};

export const CHARACTER_EVOLUTION_VIDEO_DURATION_MS = 5_000;

/** Completed supplied character pairs play in their full ten-second portrait window. */
export const CHARACTER_EVOLUTION_VIDEO_DURATION_BY_VARIANT: Record<CharacterCinematicVariant, number> = {
  tactical: 10_000,
  command: 10_000,
  shadow: 10_000,
  ascendant: 10_000,
  tacticalEvolution: 10_000,
  commandEvolution: 10_000,
  baseAscendant: 10_000,
};

export function getCharacterEvolutionVideoDurationMs(variant: CharacterCinematicVariant) {
  return CHARACTER_EVOLUTION_VIDEO_DURATION_BY_VARIANT[variant];
}

export const CHARACTER_EVOLUTION_TIMELINE_MS = {
  activation: 0,
  build: 650,
  visor: 1_250,
  materialize: 1_900,
  weapon: 3_350,
  ringActivation: 4_350,
  impact: 5_250,
  reveal: 5_850,
  reward: 7_050,
  finish: 9_100,
  acknowledgementFinish: 1_550,
} as const;

const STAGE_FORMS = ["Initiate", "Field-ready", "Armored Specialist", "Elite Operator", "Mythic Commander", "Sovereign Form"] as const;

const FAMILY_PRESENTATION: Record<CharacterFamily, Omit<CharacterEvolutionProfile, "stage" | "formName">> = {
  tactical: {
    family: "tactical",
    accent: "#42D8FF",
    secondaryAccent: "#49D17D",
    armor: "Recon command armor",
    weaponSystem: "Pulse carbine system",
    aura: "Cyan tactical scan field",
    materializationLabel: "RECON ARMOR ONLINE",
    impactLabel: "FIELD COMMAND LOCKED",
    portraitKey: "tactical",
    cinematicVariant: "tactical",
  },
  command: {
    family: "command",
    accent: "#B692FF",
    secondaryAccent: "#F4C95D",
    armor: "Directive command armor",
    weaponSystem: "Command rail array",
    aura: "Violet directive field",
    materializationLabel: "COMMAND PLATING ONLINE",
    impactLabel: "DIRECTIVE LOCKED",
    portraitKey: "command",
    cinematicVariant: "command",
  },
  shadow: {
    family: "shadow",
    accent: "#A874FF",
    secondaryAccent: "#E16DFF",
    armor: "Phase-weave stealth armor",
    weaponSystem: "Phase blade and sidearm",
    aura: "Indigo phase veil",
    materializationLabel: "PHASE ARMOR ONLINE",
    impactLabel: "SHADOW ARRAY LOCKED",
    portraitKey: "shadow",
    cinematicVariant: "shadow",
  },
  ascendant: {
    family: "ascendant",
    accent: "#C092FF",
    secondaryAccent: "#6CC9FF",
    armor: "Celestial sovereign armor",
    weaponSystem: "Singularity weapon system",
    aura: "Stellar command field",
    materializationLabel: "SOVEREIGN ARMOR ONLINE",
    impactLabel: "ASCENDANT ARRAY LOCKED",
    portraitKey: "ascendant",
    cinematicVariant: "ascendant",
  },
};

export function getDevelopmentStage(level: number): DevelopmentStage {
  if (level >= 450) return 5;
  if (level >= 300) return 4;
  if (level >= 180) return 3;
  if (level >= 90) return 2;
  if (level >= 30) return 1;
  return 0;
}

export function getCharacterFamily(title: string): CharacterFamily {
  const normalized = title.toLowerCase();
  if (/(special forces|commando|tier 1|black ops|shadow|phantom|apex|ghost|oblivion|eclipse)/.test(normalized)) return "shadow";
  if (/(commander|general|warlord|vanguard|sentinel|cosmic|infinity|nexus|void|quantum|celestial|galactic|mythic|divine|solar|astral|nova|aether|titan|zenith|focus legend|iron oracle|storm)/.test(normalized)) return "ascendant";
  if (/(sergeant|warrant|officer|lieutenant|captain|major|colonel|brigadier)/.test(normalized)) return "command";
  return "tactical";
}

/**
 * Keeps the existing profile-logo interaction intact while activating every bundled portrait
 * through the current title family and earned level stage. Cinematic videos remain family based.
 */
export function getCharacterPortraitVariant(title: string, level = 0): CharacterPortraitVariant {
  const family = getCharacterFamily(title);
  if (family === "tactical") return level >= 90 ? "tactical" : "recruit";
  if (family === "command") return level >= 90 ? "command" : "officer";
  if (family === "ascendant") {
    if (level >= 180) return "evolutionAscendant";
    if (level >= 30) return "ascendant";
    return "vanguard";
  }
  return "shadow";
}

/**
 * Existing cinematic families remain unchanged. Newly activated evolution portraits receive
 * their own verified ten-second source only after the applicable level-based portrait switch.
 */
export function getCharacterCinematicVariant(title: string, level = 0): CharacterCinematicVariant {
  const portrait = getCharacterPortraitVariant(title, level);
  if (portrait === "tactical") return "tacticalEvolution";
  if (portrait === "command") return "commandEvolution";
  if (portrait === "ascendant") return "baseAscendant";
  return getCharacterFamily(title);
}

export function getCharacterEvolutionProfile(title: string, level: number): CharacterEvolutionProfile {
  const stage = getDevelopmentStage(level);
  const family = getCharacterFamily(title);
  return {
    stage,
    formName: STAGE_FORMS[stage],
    ...FAMILY_PRESENTATION[family],
    cinematicVariant: getCharacterCinematicVariant(title, level),
  };
}

function itemSignature(item?: Equipment) {
  return item ? `${item.id}:${item.name}:${item.rarity}:${item.level}` : "none";
}

export function getEquipmentSignature(equipment: EquippedCharacterGear) {
  return [itemSignature(equipment.head), itemSignature(equipment.body), itemSignature(equipment.accessory)].join("|");
}

export function createCharacterEvolutionMilestone(title: string, level: number, equipment: EquippedCharacterGear): CharacterEvolutionMilestone {
  return {
    title,
    level,
    stage: getDevelopmentStage(level),
    family: getCharacterFamily(title),
    equipmentSignature: getEquipmentSignature(equipment),
  };
}

/** The first hydrated state is only a baseline; a cinematic needs a genuine change after it. */
export function hasMeaningfulCharacterEvolution(previous: CharacterEvolutionMilestone | null, current: CharacterEvolutionMilestone) {
  if (!previous) return false;
  return previous.title !== current.title
    || previous.stage !== current.stage
    || previous.family !== current.family
    || previous.equipmentSignature !== current.equipmentSignature;
}

export function getEquippedGearLabels(equipment: EquippedCharacterGear) {
  return ([
    equipment.head ? { slot: "HEAD", item: equipment.head } : null,
    equipment.body ? { slot: "BODY", item: equipment.body } : null,
    equipment.accessory ? { slot: "AUX", item: equipment.accessory } : null,
  ]).filter(Boolean) as Array<{ slot: "HEAD" | "BODY" | "AUX"; item: Equipment }>;
}
