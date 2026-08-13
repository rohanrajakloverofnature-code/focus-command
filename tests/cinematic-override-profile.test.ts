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
});
