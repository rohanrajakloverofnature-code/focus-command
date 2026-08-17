import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { playFocusRole } from "@/lib/focus-audio";
import {
  shallowEqual,
  type SoundRoleId,
  useFocusCommandReady,
  useFocusCommandSelector,
} from "@/lib/focus-command";
import { shouldPlayForegroundReminderAudio } from "@/lib/focus-notification-audio-policy";

const ROLE_BY_REMINDER_KIND: Record<string, SoundRoleId> = {
  daily_mission: "dailyMissionReminder",
  revision: "revisionReminder",
  multiplier: "multiplierReminder",
  achievement: "achievementRecap",
};

/**
 * Native notification channels cannot play arbitrary files stored inside the app sandbox
 * while the app is backgrounded. When Focus Command is foregrounded, this bridge receives
 * each local notification and plays the user's exact persisted custom sound role instead.
 * Achievement Recap is intentionally excluded because Mission Report already owns
 * the one immediate completion cue for that exact completed mission.
 */
export function FocusNotificationAudioBridge() {
  const ready = useFocusCommandReady();
  const audioSettings = useFocusCommandSelector(
    (state) => ({ soundEnabled: state.profile.soundEnabled, soundRoles: state.profile.soundRoles }),
    shallowEqual,
  );

  useEffect(() => {
    if (!ready || Platform.OS === "web") return;

    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const kind = notification.request.content.data?.kind;
      if (!shouldPlayForegroundReminderAudio(kind)) return;
      const role = typeof kind === "string" ? ROLE_BY_REMINDER_KIND[kind] ?? "notification" : "notification";
      void playFocusRole(role, audioSettings.soundEnabled, audioSettings.soundRoles[role]);
    });

    return () => subscription.remove();
  }, [audioSettings.soundEnabled, audioSettings.soundRoles, ready]);

  return null;
}
