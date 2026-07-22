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
  tap: { crisp: "tap", soft: "confirm", ceremonial: "achievement" },
  missionWin: { crisp: "confirm", soft: "notification", ceremonial: "achievement" },
  titleUnlock: { crisp: "confirm", soft: "notification", ceremonial: "achievement" },
  levelUp: { crisp: "confirm", soft: "notification", ceremonial: "achievement" },
  achievement: { crisp: "confirm", soft: "notification", ceremonial: "achievement" },
  reward: { crisp: "confirm", soft: "notification", ceremonial: "achievement" },
  notification: { crisp: "tap", soft: "notification", ceremonial: "confirm" },
  dailyReminder: { crisp: "tap", soft: "notification", ceremonial: "confirm" },
  revisionReminder: { crisp: "tap", soft: "notification", ceremonial: "confirm" },
  multiplierReminder: { crisp: "confirm", soft: "notification", ceremonial: "achievement" },
  achievementReminder: { crisp: "confirm", soft: "notification", ceremonial: "achievement" },
  extended: { crisp: "confirm", soft: "notification", ceremonial: "achievement" },
  system: { crisp: "tap", soft: "notification", ceremonial: "confirm" },
};

const defaultRoleSettings: SoundRoleSettings = { enabled: true, style: "soft", customUri: null, customName: null };
const bundledPlayers: Partial<Record<CueName, ReturnType<typeof createAudioPlayer>>> = {};
const customPlayers = new Map<string, ReturnType<typeof createAudioPlayer>>();
const MAX_CUSTOM_PLAYERS = 8;
let audioModePrepared = false;

function getBundledPlayer(name: CueName) {
  if (!bundledPlayers[name]) bundledPlayers[name] = createAudioPlayer(sources[name]);
  return bundledPlayers[name]!;
}

function getCustomPlayer(uri: string) {
  const cached = customPlayers.get(uri);
  if (cached) return cached;
  if (customPlayers.size >= MAX_CUSTOM_PLAYERS) {
    const oldest = customPlayers.entries().next().value as [string, ReturnType<typeof createAudioPlayer>] | undefined;
    if (oldest) {
      oldest[1].remove();
      customPlayers.delete(oldest[0]);
    }
  }
  const player = createAudioPlayer(uri);
  customPlayers.set(uri, player);
  return player;
}

async function prepareAudio() {
  if (audioModePrepared) return;
  await setAudioModeAsync({ playsInSilentMode: true });
  audioModePrepared = true;
}

async function playPlayer(player: ReturnType<typeof createAudioPlayer>) {
  await prepareAudio();
  await player.seekTo(0);
  player.play();
}

export async function playFocusCue(name: CueName, enabled: boolean) {
  if (!enabled) return;
  try {
    await playPlayer(getBundledPlayer(name));
  } catch {
    // Audio feedback enhances the experience but never blocks a core action.
  }
}

export async function playFocusRole(role: SoundRoleId, masterEnabled: boolean, settings?: SoundRoleSettings) {
  const resolved = settings ?? defaultRoleSettings;
  if (!masterEnabled || !resolved.enabled) return;
  const bundledCue = cueByRoleAndStyle[role][resolved.style];
  if (resolved.customUri) {
    try {
      await playPlayer(getCustomPlayer(resolved.customUri));
      return;
    } catch {
      const failed = customPlayers.get(resolved.customUri);
      failed?.remove();
      customPlayers.delete(resolved.customUri);
    }
  }
  await playFocusCue(bundledCue, true);
}

export function playFocusTap(masterEnabled: boolean, settings?: SoundRoleSettings) {
  return playFocusRole("tap", masterEnabled, settings ?? { ...defaultRoleSettings, style: "crisp" });
}

export function playFocusConfirmCue(masterEnabled: boolean, settings?: SoundRoleSettings) {
  return playFocusRole("system", masterEnabled, settings ?? defaultRoleSettings);
}

export function playFocusSuccessCue(masterEnabled: boolean, settings?: SoundRoleSettings) {
  return playFocusRole("missionWin", masterEnabled, settings ?? { ...defaultRoleSettings, style: "ceremonial" });
}

export function playFocusNotificationCue(masterEnabled: boolean, settings?: SoundRoleSettings) {
  return playFocusRole("notification", masterEnabled, settings ?? defaultRoleSettings);
}
