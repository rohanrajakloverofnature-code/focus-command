import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { playFocusRole } from "@/lib/focus-audio";
import { SOUND_ROLE_IDS, SoundRoleId, useFocusCommand } from "@/lib/focus-command";

function isSoundRole(value: unknown): value is SoundRoleId {
  return typeof value === "string" && SOUND_ROLE_IDS.includes(value as SoundRoleId);
}

export function FocusNotificationAudioBridge() {
  const { state, ready } = useFocusCommand();
  const profileRef = useRef(state.profile);

  useEffect(() => {
    profileRef.current = state.profile;
  }, [state.profile]);

  useEffect(() => {
    if (!ready || Platform.OS === "web") return;
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const requestedRole = notification.request.content.data?.soundRole;
      const role: SoundRoleId = isSoundRole(requestedRole) ? requestedRole : "notification";
      const profile = profileRef.current;
      void playFocusRole(role, profile.soundEnabled, profile.soundRoles[role]);
    });
    return () => subscription.remove();
  }, [ready]);

  return null;
}
