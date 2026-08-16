import type { CharacterCinematicColors, TickerColorPreference } from "@/lib/focus-command";

export type TickerVisualColors = {
  surfaceColor: string;
  accentColor: string;
};

function isHexColor(value: string | null | undefined): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

/**
 * Resolves render-only ticker colors from the existing global palette, the
 * active character's already-cached colors, or explicit validated hex values.
 * It intentionally has no storage, animation, or media dependencies.
 */
export function resolveTickerVisualColors(
  preference: TickerColorPreference,
  globalColors: TickerVisualColors,
  characterColors: CharacterCinematicColors | undefined,
): TickerVisualColors {
  if (preference.source === "character" && characterColors) {
    return {
      surfaceColor: characterColors.backdrop,
      accentColor: characterColors.accent,
    };
  }

  if (preference.source === "custom") {
    return {
      surfaceColor: isHexColor(preference.surface) ? preference.surface : globalColors.surfaceColor,
      accentColor: isHexColor(preference.accent) ? preference.accent : globalColors.accentColor,
    };
  }

  return globalColors;
}
