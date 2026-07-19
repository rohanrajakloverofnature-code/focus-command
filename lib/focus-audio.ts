import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

import type { SoundRoleId, SoundRoleSettings, SoundStyle } from "@/lib/focus-command";

type CueName = "tap" | "confirm" | "notification" | "achievement";

const sources = {
  tap: require("../assets/sounds/focus-command-tap.mp3"),
  confirm: require("../assets/sounds/focus-command-confirm.mp3"),
  notification: require("../assets/sounds/focus-command-notification.mp3"),
  achievement: require("../assets/sounds/focus-command-cue.mp3"),
} as const;

const cueByRoleAndStyle: Record<SoundRoleId, Record<SoundStyle, CueName>> = {
  missionWin: { crisp: "confirm", soft: "notification", ceremonial: "achievement" },
  tap: { crisp: "tap", soft: "confirm", ceremonial: "achievement" },
  notification: { crisp: "tap", soft: "notification", ceremonial: "confirm" },
  extended: { crisp: "confirm", soft: "notification", ceremonial: "achievement" },
};

const players: Partial<Record<CueName, ReturnType<typeof createAudioPlayer>>> = {};
let audioModePrepared = false;

function getPlayer(name: CueName) {
  if (!players[name]) players[name] = createAudioPlayer(sources[name]);
  return players[name]!;
}

async function prepareAudio() {
  if (audioModePrepared) return;
  await setAudioModeAsync({ playsInSilentMode: true });
  audioModePrepared = true;
}

export async function playFocusCue(name: CueName, enabled: boolean) {
  if (!enabled) return;
  try {
    await prepareAudio();
    const cue = getPlayer(name);
    cue.seekTo(0);
    cue.play();
  } catch {
    // Audio feedback enhances the experience but never blocks a core action.
  }
}

export function playFocusRole(role: SoundRoleId, masterEnabled: boolean, settings: SoundRoleSettings) {
  return playFocusCue(cueByRoleAndStyle[role][settings.style], masterEnabled && settings.enabled);
}

export function playFocusTap(masterEnabled: boolean, settings?: SoundRoleSettings) {
  return playFocusRole("tap", masterEnabled, settings ?? { enabled: true, style: "crisp" });
}

export function playFocusConfirmCue(masterEnabled: boolean, settings?: SoundRoleSettings) {
  return playFocusRole("extended", masterEnabled, settings ?? { enabled: true, style: "soft" });
}

export function playFocusSuccessCue(masterEnabled: boolean, settings?: SoundRoleSettings) {
  return playFocusRole("missionWin", masterEnabled, settings ?? { enabled: true, style: "ceremonial" });
}

export function playFocusNotificationCue(masterEnabled: boolean, settings?: SoundRoleSettings) {
  return playFocusRole("notification", masterEnabled, settings ?? { enabled: true, style: "soft" });
}
