import { Colors, type ColorScheme, type ThemeColorPalette } from "@/constants/theme";
import { shallowEqual, useFocusCommandSelector } from "@/lib/focus-command";
import { useColorScheme } from "./use-color-scheme";

function isHex(value: string | undefined): value is string {
  return Boolean(value && /^#[0-9a-fA-F]{6}$/.test(value));
}

function channel(value: string) {
  const normalized = Number.parseInt(value, 16) / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(color: string) {
  return 0.2126 * channel(color.slice(1, 3)) + 0.7152 * channel(color.slice(3, 5)) + 0.0722 * channel(color.slice(5, 7));
}

function contrast(first: string, second: string) {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Returns the active command palette. Profile overrides are accepted only as
 * valid hex values, and text/accent contrast falls back to the accessible base
 * palette when a user-selected combination would be too difficult to read.
 */
export function useColors(colorSchemeOverride?: ColorScheme): ThemeColorPalette {
  const colorSchema = useColorScheme();
  const scheme = (colorSchemeOverride ?? colorSchema ?? "light") as ColorScheme;
  const profileAppearance = useFocusCommandSelector(
    (state) => ({ highContrast: state.profile.highContrast, palette: state.profile.palette }),
    shallowEqual,
  );
  const standard = Colors[scheme];
  const contrastBase: ThemeColorPalette = profileAppearance.highContrast
    ? scheme === "dark"
      ? { ...standard, background: "#000000", surface: "#111111", foreground: "#FFFFFF", muted: "#D8D8D8", border: "#F0F0F0", primary: "#63D8FF", success: "#70F5A7", warning: "#FFD166", error: "#FF8A8A" }
      : { ...standard, background: "#FFFFFF", surface: "#FFFFFF", foreground: "#000000", muted: "#2A2A2A", border: "#1B1B1B", primary: "#005CC8", success: "#006B35", warning: "#8A3D00", error: "#A80000" }
    : standard;

  const requested = profileAppearance.palette;
  const candidate = Object.entries(requested).reduce((palette, [token, value]) => {
    if (isHex(value)) (palette as Record<string, string>)[token] = value;
    return palette;
  }, { ...contrastBase });

  if (contrast(candidate.foreground, candidate.background) < 4.5) candidate.foreground = contrastBase.foreground;
  if (contrast(candidate.muted, candidate.background) < 3) candidate.muted = contrastBase.muted;
  if (contrast(candidate.primary, candidate.background) < 3) candidate.primary = contrastBase.primary;
  if (contrast(candidate.border, candidate.background) < 1.5) candidate.border = contrastBase.border;

  return candidate;
}
