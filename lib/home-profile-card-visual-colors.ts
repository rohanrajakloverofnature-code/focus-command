import type { CharacterCinematicColors, TickerColorPreference } from "@/lib/focus-command";

export interface HomeProfileCardVisualColors {
  surfaceColor: string;
  borderColor: string;
  gridColor: string;
  accentColor: string;
  supportColor: string;
  energyColor: string;
  atmosphereColor: string;
}

const DEFAULT_HOME_PROFILE_CARD_COLORS: HomeProfileCardVisualColors = {
  surfaceColor: "#0E1D2E",
  borderColor: "#234865",
  gridColor: "#2C526B",
  accentColor: "#A78BFA",
  supportColor: "#8B5CF6",
  energyColor: "#38DDF6",
  atmosphereColor: "#F4C95D",
};

const HEX_COLOR = /^#[0-9A-F]{6}$/i;

function validHex(value: string | null | undefined): string | null {
  return value && HEX_COLOR.test(value) ? value.toUpperCase() : null;
}

function withAlpha(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}

function fromPalette(
  surfaceColor: string,
  accentColor: string,
  characterColors?: CharacterCinematicColors,
): HomeProfileCardVisualColors {
  return {
    surfaceColor,
    borderColor: withAlpha(accentColor, "A6"),
    gridColor: withAlpha(accentColor, "36"),
    accentColor,
    supportColor: characterColors?.support ?? accentColor,
    energyColor: characterColors?.energy ?? accentColor,
    atmosphereColor: characterColors?.metallic ?? "#F4C95D",
  };
}

/** Resolves only the marked Home profile card's render-time visual colors from durable saved preferences. */
export function resolveHomeProfileCardVisualColors({
  preference,
  characterColors,
  globalColors = DEFAULT_HOME_PROFILE_CARD_COLORS,
}: {
  preference?: TickerColorPreference;
  characterColors?: CharacterCinematicColors;
  globalColors?: HomeProfileCardVisualColors;
}): HomeProfileCardVisualColors {
  if (preference?.source === "character" && characterColors) {
    return fromPalette(characterColors.backdrop, characterColors.accent, characterColors);
  }

  if (preference?.source === "custom") {
    return fromPalette(
      validHex(preference.surface) ?? globalColors.surfaceColor,
      validHex(preference.accent) ?? globalColors.accentColor,
    );
  }

  return globalColors;
}
