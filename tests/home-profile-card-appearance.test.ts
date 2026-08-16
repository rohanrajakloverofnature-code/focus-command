import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { deriveCinematicTokensFromAccent } from "../lib/character-cinematic-tokens";
import { createInitialState, normalizeHydratedState, type FocusState } from "../lib/focus-command";
import { resolveHomeProfileCardVisualColors, type HomeProfileCardVisualColors } from "../lib/home-profile-card-visual-colors";

const globalColors: HomeProfileCardVisualColors = {
  surfaceColor: "#101827",
  borderColor: "#334155",
  gridColor: "#22C55E36",
  accentColor: "#22C55E",
  supportColor: "#22C55E",
  energyColor: "#22C55E",
  atmosphereColor: "#F4C95D",
};

describe("Home profile-card appearance", () => {
  it("supplies a safe Global Palette preference to older saved profiles", () => {
    const legacy = JSON.parse(JSON.stringify(createInitialState())) as FocusState;
    delete (legacy.profile as Partial<FocusState["profile"]>).homeProfileCardColorPreference;

    expect(normalizeHydratedState(legacy).profile.homeProfileCardColorPreference).toEqual({
      source: "global",
      surface: null,
      accent: null,
    });
  });

  it("uses the global palette tokens by default and when no character cache exists", () => {
    expect(resolveHomeProfileCardVisualColors({
      preference: { source: "global", surface: null, accent: null },
      globalColors,
    })).toEqual(globalColors);
    expect(resolveHomeProfileCardVisualColors({
      preference: { source: "character", surface: null, accent: null },
      globalColors,
    })).toEqual(globalColors);
  });

  it("uses the active character's already-cached cinematic palette without media work", () => {
    const characterColors = deriveCinematicTokensFromAccent("#A855F7");

    expect(resolveHomeProfileCardVisualColors({
      preference: { source: "character", surface: null, accent: null },
      characterColors,
      globalColors,
    })).toEqual({
      surfaceColor: characterColors.backdrop,
      borderColor: `${characterColors.accent}A6`,
      gridColor: `${characterColors.accent}36`,
      accentColor: characterColors.accent,
      supportColor: characterColors.support,
      energyColor: characterColors.energy,
      atmosphereColor: characterColors.metallic,
    });
  });

  it("uses only validated custom surface and accent values, with global fallbacks", () => {
    expect(resolveHomeProfileCardVisualColors({
      preference: { source: "custom", surface: "#0a0b0c", accent: "#ABCDEF" },
      globalColors,
    })).toMatchObject({
      surfaceColor: "#0A0B0C",
      accentColor: "#ABCDEF",
      borderColor: "#ABCDEFA6",
      gridColor: "#ABCDEF36",
    });
    expect(resolveHomeProfileCardVisualColors({
      preference: { source: "custom", surface: "invalid", accent: null },
      globalColors,
    })).toEqual({
      ...globalColors,
      borderColor: "#22C55EA6",
      gridColor: "#22C55E36",
    });
  });

  it("keeps Home-card changes isolated from ticker and cinematic preference records", () => {
    const source = readFileSync(resolve(process.cwd(), "lib/focus-command.tsx"), "utf8");

    expect(source).toContain("tickerColorPreferences: patch.tickerColorPreferences");
    expect(source).toContain("characterCinematicColors: patch.characterCinematicColors");
    expect(source).toContain("homeProfileCardColorPreference: patch.homeProfileCardColorPreference");
    expect(source).toContain("{ ...current.profile.homeProfileCardColorPreference, ...patch.homeProfileCardColorPreference }");
  });
});
