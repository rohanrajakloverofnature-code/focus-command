import { describe, expect, it } from "vitest";

import { assertCharacterMusicDuration } from "../lib/character-music-validation";
import {
  createInitialState,
  getActiveCustomCharacterForm,
  getMinimumProfileMaxLevel,
  getResolvedRankTitles,
  isCustomCharacterFormReady,
} from "../lib/focus-command";

function completeForm(overrides: Record<string, unknown> = {}) {
  return {
    id: "custom_1",
    name: "Arcane Commander",
    activationLevel: 120,
    portrait: { uri: "file:///portrait.png", name: "portrait.png" },
    video: { uri: "file:///video.mp4", name: "video.mp4" },
    music: {
      duringVideo: { uri: "file:///during.mp3", name: "during.mp3", durationSeconds: 10.25 },
      postVideo: { uri: "file:///after.mp3", name: "after.mp3", durationSeconds: 7.5 },
    },
    createdAt: "2026-08-14T00:00:00.000Z",
    ...overrides,
  };
}

describe("extensible ranks and character forms", () => {
  it("keeps legacy titles tied to Title Change Interval while retaining edited thresholds and titles beyond the original list", () => {
    const state = createInitialState();
    const firstLegacy = state.profile.rankTitles[0];
    const secondLegacy = state.profile.rankTitles[1];
    state.profile.rankTitles = [
      firstLegacy,
      secondLegacy,
      { id: "rank_51", name: "Aether Commander", startLevel: 501, thresholdMode: "explicit" },
    ];
    state.profile.titles = state.profile.rankTitles.map((title) => title.name);

    expect(getResolvedRankTitles(state.profile).map((title) => title.startLevel)).toEqual([1, 11, 501]);
    state.profile.titleChangeInterval = 5;
    expect(getResolvedRankTitles(state.profile).map((title) => title.startLevel)).toEqual([1, 6, 501]);
    expect(getResolvedRankTitles(state.profile).at(-1)).toMatchObject({ name: "Aether Commander", startLevel: 501, thresholdMode: "explicit" });
  });

  it("activates only a complete custom form at its configured level and selects the highest eligible form", () => {
    const first = completeForm({ id: "form_1", activationLevel: 120, name: "Arcane Commander" });
    const later = completeForm({ id: "form_2", activationLevel: 180, name: "Sovereign Arcane", createdAt: "2026-08-15T00:00:00.000Z" });
    const draft = completeForm({ id: "draft", activationLevel: 200, name: "Incomplete", video: null });
    const profile = { customCharacterForms: [first, later, draft] };

    expect(isCustomCharacterFormReady(draft)).toBe(false);
    expect(getActiveCustomCharacterForm(profile, 119)).toBeNull();
    expect(getActiveCustomCharacterForm(profile, 120)?.id).toBe("form_1");
    expect(getActiveCustomCharacterForm(profile, 199)?.id).toBe("form_2");
    expect(getActiveCustomCharacterForm(profile, 300)?.id).toBe("form_2");
  });

  it("derives the protected minimum maximum level from explicit rank and character thresholds", () => {
    const state = createInitialState();
    state.profile.rankTitles = [{ id: "rank_future", name: "Future Marshal", startLevel: 725, thresholdMode: "explicit" }];
    state.profile.customCharacterForms = [completeForm({ activationLevel: 810 })];
    expect(getMinimumProfileMaxLevel(state.profile)).toBe(810);
  });

  it("accepts only the exact inclusive music-duration windows and rejects adjacent values", () => {
    expect(() => assertCharacterMusicDuration("duringVideo", 10)).not.toThrow();
    expect(() => assertCharacterMusicDuration("duringVideo", 10.5)).not.toThrow();
    expect(() => assertCharacterMusicDuration("duringVideo", 9.999)).toThrow("10.00–10.50");
    expect(() => assertCharacterMusicDuration("duringVideo", 10.501)).toThrow("10.00–10.50");
    expect(() => assertCharacterMusicDuration("postVideo", 7)).not.toThrow();
    expect(() => assertCharacterMusicDuration("postVideo", 8)).not.toThrow();
    expect(() => assertCharacterMusicDuration("postVideo", 6.999)).toThrow("7.00–8.00");
    expect(() => assertCharacterMusicDuration("postVideo", 8.001)).toThrow("7.00–8.00");
  });
});
