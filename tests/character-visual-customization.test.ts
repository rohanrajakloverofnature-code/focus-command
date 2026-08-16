import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

const nativeMocks = vi.hoisted(() => ({
  getColors: vi.fn(),
  getThumbnailAsync: vi.fn(),
}));

vi.mock("react-native-image-colors", () => ({ getColors: nativeMocks.getColors }));
vi.mock("expo-video-thumbnails", () => ({ getThumbnailAsync: nativeMocks.getThumbnailAsync }));

import { deriveCharacterCinematicColors } from "../lib/character-visual-colors";
import { resolveTickerVisualColors } from "../lib/ticker-visual-colors";

describe("character visual customization", () => {
  it("uses the stable cinematic fallback when native color sampling is unavailable", async () => {
    nativeMocks.getColors.mockRejectedValueOnce(new Error("unavailable"));

    await expect(deriveCharacterCinematicColors("file:///character.png")).resolves.toEqual({
      accent: "#8B5CF9",
      backdrop: "#10102A",
      rod: "#A78BFA",
      aura: "#7C3AED",
    });
  });

  it("selects the most saturated sampled accent before deriving static cinematic tokens", async () => {
    nativeMocks.getColors.mockResolvedValueOnce({
      platform: "android",
      vibrant: "#FF0000",
      lightVibrant: "#777777",
      dominant: "#123456",
      muted: null,
      darkVibrant: "#222222",
    });

    await expect(deriveCharacterCinematicColors("file:///character.png")).resolves.toEqual({
      accent: "#FF0000",
      backdrop: "#240E18",
      rod: "#FF3333",
      aura: "#D90000",
    });
  });

  it("resolves ticker colors by global, cached-character, and validated-custom precedence", () => {
    const globalColors = { surfaceColor: "#101827", accentColor: "#22C55E" };
    const characterColors = { accent: "#F59E0B", backdrop: "#201606", rod: "#FFD066", aura: "#CE8500" };

    expect(resolveTickerVisualColors({ source: "global", surface: null, accent: null }, globalColors, characterColors)).toEqual(globalColors);
    expect(resolveTickerVisualColors({ source: "character", surface: null, accent: null }, globalColors, characterColors)).toEqual({ surfaceColor: "#201606", accentColor: "#F59E0B" });
    expect(resolveTickerVisualColors({ source: "custom", surface: "#0A0B0C", accent: "#ABCDEF" }, globalColors, characterColors)).toEqual({ surfaceColor: "#0A0B0C", accentColor: "#ABCDEF" });
    expect(resolveTickerVisualColors({ source: "custom", surface: "invalid", accent: null }, globalColors, characterColors)).toEqual(globalColors);
  });

  it("keeps extraction in saved-media handlers and protects the cinematic reward strip's Total Power slot", () => {
    const root = process.cwd();
    const cinematicLibrary = readFileSync(resolve(root, "app/cinematic-library.tsx"), "utf8");
    const cinematic = readFileSync(resolve(root, "components/rank-character.tsx"), "utf8");

    expect(cinematicLibrary).toContain("deriveCharacterCinematicColors");
    expect(cinematic).not.toContain("deriveCharacterCinematicColors");
    expect(cinematic).toContain("const powerText = Math.max(0, Math.round(totalPower))");
    expect(cinematic).toContain(">TOTAL POWER</Text>");
    expect(cinematic).toContain(">{powerText}</Text>");
  });
});
