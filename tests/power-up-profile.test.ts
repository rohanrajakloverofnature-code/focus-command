import { describe, expect, it } from "vitest";

import {
  canStartPowerUp,
  getPowerUpProfile,
  getPowerUpTier,
  POWER_UP_AUDIO_CUES,
  POWER_UP_TIMELINE_MS,
} from "../lib/power-up-profile";

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

  it("orders activation, build, transformation, impact, reveal, and cleanup without overlap", () => {
    expect(POWER_UP_TIMELINE_MS.activation).toBe(0);
    expect(POWER_UP_TIMELINE_MS.build).toBeGreaterThan(POWER_UP_TIMELINE_MS.activation);
    expect(POWER_UP_TIMELINE_MS.transformation).toBeGreaterThan(POWER_UP_TIMELINE_MS.build);
    expect(POWER_UP_TIMELINE_MS.impact).toBeGreaterThan(POWER_UP_TIMELINE_MS.transformation);
    expect(POWER_UP_TIMELINE_MS.reveal).toBeGreaterThan(POWER_UP_TIMELINE_MS.impact);
    expect(POWER_UP_TIMELINE_MS.finish).toBeGreaterThan(POWER_UP_TIMELINE_MS.reveal);
  });

  it("aligns each cinematic audio cue with a distinct active phase and clears all cues before cleanup", () => {
    expect(POWER_UP_AUDIO_CUES).toEqual([
      { sourceIndex: 0, phase: "activation", at: POWER_UP_TIMELINE_MS.activation },
      { sourceIndex: 1, phase: "build", at: POWER_UP_TIMELINE_MS.build },
      { sourceIndex: 2, phase: "impact", at: POWER_UP_TIMELINE_MS.impact },
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
});
