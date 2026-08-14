import { useEffect } from "react";
import { Platform } from "react-native";

import { type FocusState, useFocusCommandSelector } from "@/lib/focus-command";
import { prepareFocusTapFeedback } from "@/lib/focus-audio";
import { isLaunchSequenceActive, subscribeLaunchSequenceActivity } from "@/lib/launch-session";

function selectTapFeedbackSettings(state: FocusState) {
  return {
    ready: state.hydrated,
    soundEnabled: state.profile.soundEnabled,
    tapSettings: state.profile.soundRoles.tap,
  };
}

function hasSameTapFeedbackSettings(
  left: ReturnType<typeof selectTapFeedbackSettings>,
  right: ReturnType<typeof selectTapFeedbackSettings>,
) {
  return left.ready === right.ready
    && left.soundEnabled === right.soundEnabled
    && left.tapSettings === right.tapSettings;
}

/** Non-visual warm-up that runs only after the existing launch presentation has finished. */
export function FocusTapFeedbackBridge() {
  const { ready, soundEnabled, tapSettings } = useFocusCommandSelector(selectTapFeedbackSettings, hasSameTapFeedbackSettings);

  useEffect(() => {
    if (!ready || !soundEnabled || !tapSettings.enabled || Platform.OS === "web") return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const prepareWhenSafe = () => {
      if (cancelled || isLaunchSequenceActive() || timer) return;
      timer = setTimeout(() => {
        timer = null;
        if (!cancelled) void prepareFocusTapFeedback(soundEnabled, tapSettings);
      }, 180);
    };

    prepareWhenSafe();
    const unsubscribe = subscribeLaunchSequenceActivity((active) => {
      if (!active) prepareWhenSafe();
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [ready, soundEnabled, tapSettings]);

  return null;
}
