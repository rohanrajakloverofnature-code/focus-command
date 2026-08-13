import { describe, expect, it } from "vitest";

import {
  canStartPowerUp,
  getCharacterTapPresentation,
  getPowerUpProfile,
  getPowerUpTier,
  POWER_UP_AUDIO_CUES,
  POWER_UP_TIMELINE_MS,
} from "../lib/power-up-profile";
import {
  CHARACTER_EVOLUTION_VIDEO_DURATION_MS,
  CHARACTER_EVOLUTION_TIMELINE_MS,
  createCharacterEvolutionMilestone,
  getCharacterEvolutionProfile,
  getCharacterEvolutionVideoDurationMs,
  getCharacterPortraitVariant,
  getEquippedGearLabels,
  hasMeaningfulCharacterEvolution,
} from "../lib/character-development";

describe("title and level cinematic power-up profiles", () => {
  it("maps every level band to the intended deterministic power tier", () => {
    expect(getPowerUpTier(1)).toBe(0);
    expect(getPowerUpTier(30)).toBe(1);
    expect(getPowerUpTier(90)).toBe(2);
    expect(getPowerUpTier(180)).toBe(3);
    expect(getPowerUpTier(300)).toBe(4);
    expect(getPowerUpTier(450)).toBe(5);
  });

  it("keeps a title signature stable while strengthening its equipment and ability by level", () => {
    const recruit = getPowerUpProfile("Recruit", 2);
    const veteran = getPowerUpProfile("Recruit", 240);

    expect(recruit.titleSignature).toBe(veteran.titleSignature);
    expect(veteran.tier).toBeGreaterThan(recruit.tier);
    expect(veteran.intensity).toBeGreaterThan(recruit.intensity);
    expect(veteran.equipment).not.toBe(recruit.equipment);
    expect(veteran.ability).not.toBe(recruit.ability);
  });

  it("provides a complete cinematic profile for every existing title shape", () => {
    for (const title of ["Recruit", "Captain", "Vanguard", "Commander", "Void Sentinel", "Celestial Sovereign", "Custom Operator"]) {
      const profile = getPowerUpProfile(title, 125);
      expect(profile.equipment.length).toBeGreaterThan(4);
      expect(profile.ammunition.length).toBeGreaterThan(4);
      expect(profile.ability.length).toBeGreaterThan(4);
      expect(profile.impactLabel).toContain("TIER");
    }
  });

  it("orders activation, build, visor, armor, weapon, ring, impact, reveal, reward, and cleanup without overlap", () => {
    expect(POWER_UP_TIMELINE_MS.activation).toBe(0);
    expect(POWER_UP_TIMELINE_MS.build).toBeGreaterThan(POWER_UP_TIMELINE_MS.activation);
    expect(POWER_UP_TIMELINE_MS.visor).toBeGreaterThan(POWER_UP_TIMELINE_MS.build);
    expect(POWER_UP_TIMELINE_MS.transformation).toBeGreaterThan(POWER_UP_TIMELINE_MS.visor);
    expect(POWER_UP_TIMELINE_MS.weapon).toBeGreaterThan(POWER_UP_TIMELINE_MS.transformation);
    expect(POWER_UP_TIMELINE_MS.ringActivation).toBeGreaterThan(POWER_UP_TIMELINE_MS.weapon);
    expect(POWER_UP_TIMELINE_MS.impact).toBeGreaterThan(POWER_UP_TIMELINE_MS.ringActivation);
    expect(POWER_UP_TIMELINE_MS.reveal).toBeGreaterThan(POWER_UP_TIMELINE_MS.impact);
    expect(POWER_UP_TIMELINE_MS.reward).toBeGreaterThan(POWER_UP_TIMELINE_MS.reveal);
    expect(POWER_UP_TIMELINE_MS.finish).toBeGreaterThan(POWER_UP_TIMELINE_MS.reward);
  });

  it("maps each dedicated cinematic sound event to its matching visual phase and clears all cues before cleanup", () => {
    expect(POWER_UP_AUDIO_CUES.map((cue) => cue.phase)).toEqual(["activation", "build", "visor", "armor", "weapon", "ring", "impact", "reveal", "reward"]);
    expect(POWER_UP_AUDIO_CUES.map((cue) => cue.at)).toEqual([
      POWER_UP_TIMELINE_MS.activation,
      POWER_UP_TIMELINE_MS.build,
      POWER_UP_TIMELINE_MS.visor,
      POWER_UP_TIMELINE_MS.transformation,
      POWER_UP_TIMELINE_MS.weapon,
      POWER_UP_TIMELINE_MS.ringActivation,
      POWER_UP_TIMELINE_MS.impact,
      POWER_UP_TIMELINE_MS.reveal,
      POWER_UP_TIMELINE_MS.reward,
    ]);
    expect(new Set(POWER_UP_AUDIO_CUES.map((cue) => cue.sourceIndex)).size).toBe(POWER_UP_AUDIO_CUES.length);
    expect(POWER_UP_AUDIO_CUES.every((cue) => cue.at < POWER_UP_TIMELINE_MS.finish)).toBe(true);
  });

  it("blocks duplicate taps and competing presentation stages until the active sequence has cleaned up", () => {
    expect(canStartPowerUp({
      alreadyVisible: false,
      launchSequenceActive: false,
      competingPresentationActive: false,
    })).toBe(true);

    expect(canStartPowerUp({
      alreadyVisible: true,
      launchSequenceActive: false,
      competingPresentationActive: false,
    })).toBe(false);

    expect(canStartPowerUp({
      alreadyVisible: false,
      launchSequenceActive: true,
      competingPresentationActive: false,
    })).toBe(false);

    expect(canStartPowerUp({
      alreadyVisible: false,
      launchSequenceActive: false,
      competingPresentationActive: true,
    })).toBe(false);
  });

  it("uses visibly distinct existing-title families and keeps development stages aligned to level thresholds", () => {
    expect(getCharacterEvolutionProfile("Recruit", 1)).toMatchObject({ family: "tactical", stage: 0, formName: "Initiate", cinematicVariant: "tactical" });
    expect(getCharacterEvolutionProfile("Captain", 90)).toMatchObject({ family: "command", stage: 2, formName: "Armored Specialist", cinematicVariant: "command" });
    expect(getCharacterEvolutionProfile("Shadow Phantom", 180)).toMatchObject({ family: "shadow", stage: 3, formName: "Elite Operator", cinematicVariant: "shadow" });
    expect(getCharacterEvolutionProfile("Celestial Sovereign", 450)).toMatchObject({ family: "ascendant", stage: 5, formName: "Sovereign Form", cinematicVariant: "ascendant" });
  });

  it("activates all eight profile-logo portraits through title family and earned level without changing cinematic families", () => {
    expect(getCharacterPortraitVariant("Recruit", 1)).toBe("recruit");
    expect(getCharacterPortraitVariant("Recruit", 90)).toBe("tactical");
    expect(getCharacterPortraitVariant("Brigadier", 89)).toBe("officer");
    expect(getCharacterPortraitVariant("Brigadier", 90)).toBe("command");
    expect(getCharacterPortraitVariant("Shadow Phantom", 180)).toBe("shadow");
    expect(getCharacterPortraitVariant("Celestial Sovereign", 1)).toBe("vanguard");
    expect(getCharacterPortraitVariant("Celestial Sovereign", 30)).toBe("ascendant");
    expect(getCharacterPortraitVariant("Celestial Sovereign", 180)).toBe("evolutionAscendant");

    expect(getCharacterEvolutionProfile("Recruit", 90).cinematicVariant).toBe("tactical");
    expect(getCharacterEvolutionProfile("Brigadier", 90).cinematicVariant).toBe("command");
    expect(getCharacterEvolutionProfile("Celestial Sovereign", 30).cinematicVariant).toBe("ascendant");
    expect(getCharacterEvolutionProfile("Celestial Sovereign", 180).cinematicVariant).toBe("ascendant");
  });

  it("uses the equipped local head, body, and accessory state as the only equipment-reveal source", () => {
    const equipment = {
      head: { id: "head-1", name: "Focus Visor", description: null, type: "FocusDevice" as const, rarity: "Epic" as const, level: 4, xpModifier: 112, energyConsumptionModifier: 95, imageUrl: null },
      body: { id: "body-1", name: "Cognitive Amplifier", description: null, type: "EnergyPack" as const, rarity: "Rare" as const, level: 3, xpModifier: 108, energyConsumptionModifier: 94, imageUrl: null },
      accessory: { id: "aura-1", name: "Aura Node", description: null, type: "AuraGenerator" as const, rarity: "Legendary" as const, level: 7, xpModifier: 125, energyConsumptionModifier: 90, imageUrl: null },
    };

    expect(getEquippedGearLabels(equipment)).toEqual([
      expect.objectContaining({ slot: "HEAD", item: expect.objectContaining({ name: "Focus Visor" }) }),
      expect.objectContaining({ slot: "BODY", item: expect.objectContaining({ name: "Cognitive Amplifier" }) }),
      expect.objectContaining({ slot: "AUX", item: expect.objectContaining({ name: "Aura Node" }) }),
    ]);
  });

  it("treats first hydration as a baseline and permits a full cinematic only after real progression or a gear change", () => {
    const baseline = createCharacterEvolutionMilestone("Recruit", 29, {});
    expect(hasMeaningfulCharacterEvolution(null, baseline)).toBe(false);
    expect(hasMeaningfulCharacterEvolution(baseline, createCharacterEvolutionMilestone("Recruit", 29, {}))).toBe(false);
    expect(hasMeaningfulCharacterEvolution(baseline, createCharacterEvolutionMilestone("Recruit", 28, {}))).toBe(false);
    expect(hasMeaningfulCharacterEvolution(baseline, createCharacterEvolutionMilestone("Recruit", 30, {}))).toBe(true);
    expect(hasMeaningfulCharacterEvolution(baseline, createCharacterEvolutionMilestone("Recruit", 29, {
      accessory: { id: "aura-1", name: "Aura Node", description: null, type: "AuraGenerator", rarity: "Rare", level: 1, xpModifier: 105, energyConsumptionModifier: 98, imageUrl: null },
    }))).toBe(true);
  });

  it("keeps the full asset-and-audio sequence ordered for every permitted replay", () => {
    expect(CHARACTER_EVOLUTION_TIMELINE_MS.build).toBeLessThan(CHARACTER_EVOLUTION_TIMELINE_MS.materialize);
    expect(CHARACTER_EVOLUTION_TIMELINE_MS.materialize).toBeLessThan(CHARACTER_EVOLUTION_TIMELINE_MS.impact);
    expect(CHARACTER_EVOLUTION_TIMELINE_MS.impact).toBeLessThan(CHARACTER_EVOLUTION_TIMELINE_MS.reveal);
    expect(CHARACTER_EVOLUTION_TIMELINE_MS.reveal).toBeLessThan(CHARACTER_EVOLUTION_TIMELINE_MS.reward);
    expect(CHARACTER_EVOLUTION_TIMELINE_MS.reward).toBeLessThan(CHARACTER_EVOLUTION_TIMELINE_MS.finish);
    expect(CHARACTER_EVOLUTION_TIMELINE_MS.acknowledgementFinish).toBeLessThan(CHARACTER_EVOLUTION_TIMELINE_MS.finish);
  });

  it("replays the full current-level cinematic on every permitted character tap", () => {
    expect(getCharacterTapPresentation(false)).toBe("evolution");
    expect(getCharacterTapPresentation(true)).toBe("evolution");
  });

  it("keeps current level stage and title family as deterministic sources of visual replay variation", () => {
    const tactical = getCharacterEvolutionProfile("Recruit", 31);
    const command = getCharacterEvolutionProfile("Brigadier", 91);
    const ascendant = getCharacterEvolutionProfile("Celestial Sovereign", 451);

    expect(tactical.family).not.toBe(command.family);
    expect(command.family).not.toBe(ascendant.family);
    expect(tactical.stage).toBeLessThan(command.stage);
    expect(command.stage).toBeLessThan(ascendant.stage);
  });

  it("keeps every completed supplied title family in its full ten-second cinematic window", () => {
    const variants = [
      getCharacterEvolutionProfile("Recruit", 31).cinematicVariant,
      getCharacterEvolutionProfile("Brigadier", 91).cinematicVariant,
      getCharacterEvolutionProfile("Shadow Phantom", 181).cinematicVariant,
      getCharacterEvolutionProfile("Celestial Sovereign", 451).cinematicVariant,
    ];

    expect(CHARACTER_EVOLUTION_VIDEO_DURATION_MS).toBe(5_000);
    expect(new Set(variants).size).toBe(4);
    expect(CHARACTER_EVOLUTION_TIMELINE_MS.materialize + CHARACTER_EVOLUTION_VIDEO_DURATION_MS).toBeGreaterThan(CHARACTER_EVOLUTION_TIMELINE_MS.materialize);
    expect(getCharacterEvolutionVideoDurationMs("tactical")).toBe(10_000);
    expect(getCharacterEvolutionVideoDurationMs("command")).toBe(10_000);
    expect(getCharacterEvolutionVideoDurationMs("ascendant")).toBe(10_000);
    expect(getCharacterEvolutionVideoDurationMs("shadow")).toBe(10_000);
  });
});
