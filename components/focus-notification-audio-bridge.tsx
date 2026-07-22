import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { playFocusRole } from "@/lib/focus-audio";
import { type SoundRoleId, useFocusCommand } from "@/lib/focus-command";

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
 */
export function FocusNotificationAudioBridge() {
  const { state, ready } = useFocusCommand();

  useEffect(() => {
    if (!ready || Platform.OS === "web") return;

    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const kind = notification.request.content.data?.kind;
      const role = typeof kind === "string" ? ROLE_BY_REMINDER_KIND[kind] ?? "notification" : "notification";
      void playFocusRole(role, state.profile.soundEnabled, state.profile.soundRoles[role]);
    });

    return () => subscription.remove();
  }, [ready, state.profile.soundEnabled, state.profile.soundRoles]);

  return null;
}
