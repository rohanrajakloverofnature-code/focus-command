import { Colors, type ColorScheme, type ThemeColorPalette } from "@/constants/theme";
import { useFocusCommand } from "@/lib/focus-command";
import { useColorScheme } from "./use-color-scheme";

/**
 * Returns the active command palette. When high contrast is enabled, the
 * shared palette intentionally increases surface and text separation across
 * every screen without requiring per-component overrides.
 */
export function useColors(colorSchemeOverride?: ColorScheme): ThemeColorPalette {
  const colorSchema = useColorScheme();
  const scheme = (colorSchemeOverride ?? colorSchema ?? "light") as ColorScheme;
  const { state } = useFocusCommand();
  const base = Colors[scheme];

  if (!state.profile.highContrast) return base;

  return scheme === "dark"
    ? {
        ...base,
        background: "#000000",
        surface: "#111111",
        foreground: "#FFFFFF",
        muted: "#D8D8D8",
        border: "#F0F0F0",
        primary: "#63D8FF",
        success: "#70F5A7",
        warning: "#FFD166",
        error: "#FF8A8A",
      }
    : {
        ...base,
        background: "#FFFFFF",
        surface: "#FFFFFF",
        foreground: "#000000",
        muted: "#2A2A2A",
        border: "#1B1B1B",
        primary: "#005CC8",
        success: "#006B35",
        warning: "#8A3D00",
        error: "#A80000",
      };
}
