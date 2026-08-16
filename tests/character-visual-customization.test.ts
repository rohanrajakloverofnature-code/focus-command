import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

const nativeMocks = vi.hoisted(() => ({
  getColors: vi.fn(),
  getThumbnailAsync: vi.fn(),
}));

vi.mock("react-native-image-colors", () => ({ getColors: nativeMocks.getColors }));
vi.mock("expo-video-thumbnails", () => ({ getThumbnailAsync: nativeMocks.getThumbnailAsync }));

import {
  deriveCharacterCinematicColors,
} from "../lib/character-visual-colors";
import {
  chooseCharacterAccent,
  chooseCharacterSupport,
  colorContrastRatio,
  deriveCinematicTokensFromAccent,
  deriveCinematicTokensFromPalette,
} from "../lib/character-cinematic-tokens";
import { resolveTickerVisualColors } from "../lib/ticker-visual-colors";

describe("character visual customization", () => {
  it("uses the stable cinematic fallback when native color sampling is unavailable", async () => {
    nativeMocks.getColors.mockRejectedValueOnce(new Error("unavailable"));

    await expect(deriveCharacterCinematicColors("file:///character.png")).resolves.toEqual(
      deriveCinematicTokensFromAccent("#8B5CF9"),
    );
  });

  it("prefers a meaningful dominant mid-tone over a small saturated highlight", async () => {
    nativeMocks.getColors.mockResolvedValueOnce({
      platform: "android",
      vibrant: "#00A2FF",
      lightVibrant: "#B1EBFF",
      dominant: "#C9982E",
      muted: null,
      darkVibrant: "#06101B",
    });

    await expect(deriveCharacterCinematicColors("file:///character.png")).resolves.toMatchObject({ accent: "#C9982E" });
    expect(chooseCharacterAccent([
      { value: "#00A2FF", priority: 0.86 },
      { value: "#C9982E", priority: 1.16 },
      { value: "#06101B", priority: 0.5 },
    ])).toBe("#C9982E");
  });

  it("derives a bright rod and visible aura that remain distinct from the character-tinted backdrop", () => {
    const tokens = deriveCinematicTokensFromAccent("#C9982E");

    expect(colorContrastRatio(tokens.rod, tokens.backdrop)).toBeGreaterThanOrEqual(4.5);
    expect(colorContrastRatio(tokens.aura, tokens.backdrop)).toBeGreaterThanOrEqual(3);
    expect(tokens.backdrop).not.toBe(tokens.rod);
    expect(tokens.backdrop).not.toBe(tokens.aura);
  });

  it("keeps a distinct saved-media support color and derives readable energy and metallic cinematic roles", () => {
    const candidates = [
      { value: "#6E32C9", priority: 1.16 },
      { value: "#00B8D4", priority: 0.94 },
      { value: "#2A174A", priority: 0.42 },
    ];
    const accent = chooseCharacterAccent(candidates);
    const support = chooseCharacterSupport(candidates, accent);
    const palette = deriveCinematicTokensFromPalette(accent, support);

    expect(accent).toBe("#6E32C9");
    expect(support).toBe("#00B8D4");
    expect(palette.energy).not.toBe(palette.accent);
    expect(palette.metallic).not.toBe(palette.energy);
    expect(colorContrastRatio(palette.energy, palette.backdrop)).toBeGreaterThanOrEqual(3.4);
    expect(colorContrastRatio(palette.metallic, palette.backdrop)).toBeGreaterThanOrEqual(4.5);
  });

  it("resolves ticker colors by global, cached-character, and validated-custom precedence", () => {
    const globalColors = { surfaceColor: "#101827", accentColor: "#22C55E" };
    const characterColors = deriveCinematicTokensFromAccent("#F59E0B");

    expect(resolveTickerVisualColors({ source: "global", surface: null, accent: null }, globalColors, characterColors)).toEqual(globalColors);
    expect(resolveTickerVisualColors({ source: "character", surface: null, accent: null }, globalColors, characterColors)).toEqual({ surfaceColor: characterColors.backdrop, accentColor: characterColors.accent });
    expect(resolveTickerVisualColors({ source: "custom", surface: "#0A0B0C", accent: "#ABCDEF" }, globalColors, characterColors)).toEqual({ surfaceColor: "#0A0B0C", accentColor: "#ABCDEF" });
    expect(resolveTickerVisualColors({ source: "custom", surface: "invalid", accent: null }, globalColors, characterColors)).toEqual(globalColors);
  });

  it("keeps extraction in saved-media handlers and protects the cinematic reward strip's Total Power slot", () => {
    const root = process.cwd();
    const cinematicLibrary = readFileSync(resolve(root, "app/cinematic-library.tsx"), "utf8");
    const cinematic = readFileSync(resolve(root, "components/rank-character.tsx"), "utf8");

    expect(cinematicLibrary).toContain("deriveCharacterCinematicColors");
    expect(cinematic).not.toContain("deriveCharacterCinematicColors");
    expect(cinematic).toContain("cinematicColors.energy");
    expect(cinematic).toContain("cinematicColors.metallic");
    expect(cinematic).toContain("const powerText = Math.max(0, Math.round(totalPower))");
    expect(cinematic).toContain(">TOTAL POWER</Text>");
    expect(cinematic).toContain(">{powerText}</Text>");
  });

  it("uses neutral true-glass surfaces without adding live blur or playback work to the protected cinematic", () => {
    const cinematic = readFileSync(resolve(process.cwd(), "components/rank-character.tsx"), "utf8");

    expect(cinematic).toContain('modalBackdrop: { flex: 1, backgroundColor: "transparent"');
    expect(cinematic).toContain('backgroundColor: "rgba(255, 255, 255, 0.018)"');
    expect(cinematic).toContain('borderColor: "rgba(255, 255, 255, 0.12)"');
    expect(cinematic).toContain('backgroundColor: "rgba(255, 255, 255, 0.035)"');
    expect(cinematic).toContain('borderColor: "rgba(255, 255, 255, 0.16)"');
    expect(cinematic).not.toContain('{ backgroundColor: cinematicColors.backdrop }');
    expect(cinematic).not.toContain('backgroundColor: `${cinematicColors.atmosphere}6A`');
    expect(cinematic).not.toContain('backgroundColor: `${cinematicColors.frame}78`');
    expect(cinematic).not.toContain('backgroundColor: `${cinematicColors.frame}B8`');
    expect(cinematic).toContain('cinematicColors.metallic}EA');
    expect(cinematic).toContain('cinematicColors.energy}B4');
    expect(cinematic).toContain('cinematicColors.energy : cinematicColors.accent');
    expect(cinematic).toContain('cinematicColors.atmosphere}A0');
    expect(cinematic).not.toContain("expo-blur");
    expect(cinematic).not.toContain("BlurView");
    expect(cinematic).not.toContain("deriveCharacterCinematicColors");
  });
});
