import { useEffect } from "react";
import { Appearance } from "react-native";

import { shallowEqual, useFocusCommandReady, useFocusCommandSelector } from "@/lib/focus-command";
import { useThemeContext } from "@/lib/theme-provider";

export function FocusThemeBridge() {
  const ready = useFocusCommandReady();
  const appearance = useFocusCommandSelector(
    (state) => ({ palette: state.profile.palette, theme: state.profile.theme }),
    shallowEqual,
  );
  const { setColorScheme, setPalette } = useThemeContext();

  useEffect(() => {
    if (!ready) return;
    const selected = appearance.theme === "system" ? Appearance.getColorScheme() ?? "light" : appearance.theme;
    setColorScheme(selected);
    setPalette(appearance.palette);
  }, [appearance.palette, appearance.theme, ready, setColorScheme, setPalette]);

  return null;
}
