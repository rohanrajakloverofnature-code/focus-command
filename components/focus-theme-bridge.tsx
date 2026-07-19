import { useEffect } from "react";
import { Appearance } from "react-native";

import { useFocusCommand } from "@/lib/focus-command";
import { useThemeContext } from "@/lib/theme-provider";

export function FocusThemeBridge() {
  const { state, ready } = useFocusCommand();
  const { setColorScheme, setPalette } = useThemeContext();

  useEffect(() => {
    if (!ready) return;
    const selected = state.profile.theme === "system" ? Appearance.getColorScheme() ?? "light" : state.profile.theme;
    setColorScheme(selected);
    setPalette(state.profile.palette);
  }, [ready, setColorScheme, setPalette, state.profile.palette, state.profile.theme]);

  return null;
}
