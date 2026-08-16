import { describe, expect, it } from "vitest";

import { createInitialState, normalizeHydratedState, type FocusState } from "../lib/focus-command";

describe("cinematic override profile persistence", () => {
  it("starts with no local override so every character retains its bundled cinematic", () => {
    expect(createInitialState().profile.localCinematicOverrides).toEqual({});
  });

  it("keeps saved overrides while safely providing an empty record to legacy profiles", () => {
    const saved = createInitialState();
    saved.profile.localCinematicOverrides = {
      tacticalEvolution: { uri: "file:///documents/focus-command-cinematics/tactical-evolution.mp4", name: "Tactical evolution.mp4" },
    };
    expect(normalizeHydratedState(saved).profile.localCinematicOverrides).toEqual(saved.profile.localCinematicOverrides);

    const legacy = JSON.parse(JSON.stringify(createInitialState())) as FocusState;
    delete (legacy.profile as Partial<FocusState["profile"]>).localCinematicOverrides;
    expect(normalizeHydratedState(legacy as FocusState).profile.localCinematicOverrides).toEqual({});
  });

  it("hydrates new rank, per-form music, and custom-form fields without changing legacy defaults", () => {
    const legacy = JSON.parse(JSON.stringify(createInitialState())) as FocusState;
    delete (legacy.profile as Partial<FocusState["profile"]>).rankTitles;
    delete (legacy.profile as Partial<FocusState["profile"]>).localCinematicMusicOverrides;
    delete (legacy.profile as Partial<FocusState["profile"]>).customCharacterForms;

    const hydratedLegacy = normalizeHydratedState(legacy as FocusState).profile;
    expect(hydratedLegacy.rankTitles).toHaveLength(hydratedLegacy.titles.length);
    expect(hydratedLegacy.rankTitles[0]).toMatchObject({ startLevel: 1, thresholdMode: "interval" });
    expect(hydratedLegacy.localCinematicMusicOverrides).toEqual({});
    expect(hydratedLegacy.customCharacterForms).toEqual([]);

    const saved = createInitialState();
    saved.profile.localCinematicMusicOverrides = {
      tactical: {
        duringVideo: { uri: "file:///documents/focus-command-sounds/recruit-during.mp3", name: "recruit-during.mp3", durationSeconds: 10.2 },
        postVideo: { uri: "file:///documents/focus-command-sounds/recruit-after.mp3", name: "recruit-after.mp3", durationSeconds: 7.4 },
      },
    };
    saved.profile.customCharacterForms = [{
      id: "custom_saved",
      name: "Arcane Commander",
      activationLevel: 600,
      portrait: { uri: "file:///documents/focus-command-portraits/arcane.png", name: "arcane.png" },
      video: { uri: "file:///documents/focus-command-cinematics/arcane.mp4", name: "arcane.mp4" },
      music: {
        duringVideo: { uri: "file:///documents/focus-command-sounds/arcane-during.mp3", name: "arcane-during.mp3", durationSeconds: 10.3 },
        postVideo: { uri: "file:///documents/focus-command-sounds/arcane-after.mp3", name: "arcane-after.mp3", durationSeconds: 7.2 },
      },
      createdAt: "2026-08-14T00:00:00.000Z",
    }];
    const hydratedSaved = normalizeHydratedState(saved).profile;
    expect(hydratedSaved.localCinematicMusicOverrides.tactical?.duringVideo?.uri).toContain("recruit-during.mp3");
    expect(hydratedSaved.customCharacterForms[0]).toMatchObject({ name: "Arcane Commander", activationLevel: 600 });
  });

  it("safely supplies empty visual caches and global ticker preferences to legacy profiles", () => {
    const legacy = JSON.parse(JSON.stringify(createInitialState())) as FocusState;
    delete (legacy.profile as Partial<FocusState["profile"]>).characterCinematicColors;
    delete (legacy.profile as Partial<FocusState["profile"]>).tickerColorPreferences;

    const hydrated = normalizeHydratedState(legacy).profile;
    expect(hydrated.characterCinematicColors).toEqual({});
    expect(hydrated.tickerColorPreferences).toEqual({
      miniAchievement: { source: "global", surface: null, accent: null },
      prediction: { source: "global", surface: null, accent: null },
    });
  });
});
