import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, View, useColorScheme as useSystemColorScheme } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";

import { SchemeColors, type ColorScheme } from "@/constants/theme";

type ThemeTokenPalette = typeof SchemeColors.light;

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  setPalette: (palette: Partial<ThemeTokenPalette>) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isHex(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? "light";
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(systemScheme);
  const [paletteOverrides, setPaletteOverrides] = useState<Partial<ThemeTokenPalette>>({});
  const palette = useMemo(() => ({ ...SchemeColors[colorScheme], ...paletteOverrides }), [colorScheme, paletteOverrides]);

  const applyTheme = useCallback((scheme: ColorScheme, nextPalette: ThemeTokenPalette) => {
    nativewindColorScheme.set(scheme);
    Appearance.setColorScheme?.(scheme);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.dataset.theme = scheme;
      root.classList.toggle("dark", scheme === "dark");
      Object.entries(nextPalette).forEach(([token, value]) => root.style.setProperty(`--color-${token}`, value));
    }
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => setColorSchemeState(scheme), []);
  const setPalette = useCallback((nextPalette: Partial<ThemeTokenPalette>) => {
    setPaletteOverrides(Object.fromEntries(Object.entries(nextPalette).filter(([, value]) => isHex(value))) as Partial<ThemeTokenPalette>);
  }, []);

  useEffect(() => {
    applyTheme(colorScheme, palette);
  }, [applyTheme, colorScheme, palette]);

  const themeVariables = useMemo(
    () => vars({
      "color-primary": palette.primary,
      "color-background": palette.background,
      "color-surface": palette.surface,
      "color-foreground": palette.foreground,
      "color-muted": palette.muted,
      "color-border": palette.border,
      "color-success": palette.success,
      "color-warning": palette.warning,
      "color-error": palette.error,
    }),
    [palette],
  );

  const value = useMemo(() => ({ colorScheme, setColorScheme, setPalette }), [colorScheme, setColorScheme, setPalette]);
  return <ThemeContext.Provider value={value}><View style={[{ flex: 1 }, themeVariables]}>{children}</View></ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used within ThemeProvider");
  return ctx;
}
