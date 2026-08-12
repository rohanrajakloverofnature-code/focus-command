import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

import type { SoundRoleId, SoundRoleSettings, SoundStyle } from "@/lib/focus-command";
import { isLaunchSequenceActive } from "@/lib/launch-session";

type CueName = "tap" | "confirm" | "notification" | "achievement";

const sources = {
  tap: require("../assets/sounds/focus-command-tap.mp3"),
  confirm: require("../assets/sounds/focus-command-confirm.mp3"),
  notification: require("../assets/sounds/focus-command-notification.mp3"),
  achievement: require("../assets/sounds/focus-command-cue.mp3"),
} as const;

const cueByRoleAndStyle: Record<SoundRoleId, Record<SoundStyle, CueName>> = {
  missionWin: { crisp: "confirm", soft: "notification", ceremonial: "achievement" },
  titleUnlock: { crisp: "confirm", soft: "achievement", ceremonial: "achievement" },
  levelUp: { crisp: "confirm", soft: "achievement", ceremonial: "achievement" },
  achievement: { crisp: "confirm", soft: "achievement", ceremonial: "achievement" },
  comboTier: { crisp: "tap", soft: "confirm", ceremonial: "achievement" },
  reward: { crisp: "confirm", soft: "achievement", ceremonial: "achievement" },
  tap: { crisp: "tap", soft: "confirm", ceremonial: "achievement" },
  system: { crisp: "confirm", soft: "notification", ceremonial: "achievement" },
  dailyMissionReminder: { crisp: "tap", soft: "notification", ceremonial: "confirm" },
  revisionReminder: { crisp: "tap", soft: "notification", ceremonial: "confirm" },
  multiplierReminder: { crisp: "tap", soft: "notification", ceremonial: "confirm" },
  achievementRecap: { crisp: "confirm", soft: "notification", ceremonial: "achievement" },
  notification: { crisp: "tap", soft: "notification", ceremonial: "confirm" },
  extended: { crisp: "confirm", soft: "notification", ceremonial: "achievement" },
};

const defaultRoleSettings: SoundRoleSettings = { enabled: true, style: "soft", customUri: null, customName: null };
const bundledPlayers: Partial<Record<CueName, ReturnType<typeof createAudioPlayer>>> = {};
const customPlayers: Record<string, ReturnType<typeof createAudioPlayer>> = {};
let audioModePrepared = false;

function getBundledPlayer(name: CueName) {
  if (!bundledPlayers[name]) bundledPlayers[name] = createAudioPlayer(sources[name]);
  return bundledPlayers[name]!;
}

function getCustomPlayer(uri: string) {
  if (!customPlayers[uri]) customPlayers[uri] = createAudioPlayer(uri);
  return customPlayers[uri];
}

async function prepareAudio() {
  if (audioModePrepared) return;
  await setAudioModeAsync({ playsInSilentMode: true });
  audioModePrepared = true;
}

async function playPlayer(player: ReturnType<typeof createAudioPlayer>) {
  await prepareAudio();
  player.seekTo(0);
  player.play();
}

export async function playFocusCue(name: CueName, enabled: boolean) {
  if (!enabled || isLaunchSequenceActive()) return;
  try {
    await playPlayer(getBundledPlayer(name));
  } catch {
    // Audio feedback enhances the experience but never blocks a core action.
  }
}

export async function playFocusRole(role: SoundRoleId, masterEnabled: boolean, settings?: SoundRoleSettings) {
  const resolved = settings ?? defaultRoleSettings;
  if (!masterEnabled || !resolved.enabled || isLaunchSequenceActive()) return;
  try {
    if (resolved.customUri) {
      await playPlayer(getCustomPlayer(resolved.customUri));
      return;
    }
    await playFocusCue(cueByRoleAndStyle[role][resolved.style], true);
  } catch {
    // A removed or incompatible user audio file safely falls back to silence.
  }
}

export function releaseFocusCustomSound(uri: string) {
  const player = customPlayers[uri];
  if (!player) return;
  try {
    player.release();
  } catch {
    // Releasing an already-disposed player should never affect settings changes.
  }
  delete customPlayers[uri];
}

export function playFocusTap(masterEnabled: boolean, settings?: SoundRoleSettings) {
  return playFocusRole("tap", masterEnabled, settings ?? { ...defaultRoleSettings, style: "crisp" });
}

export function playFocusConfirmCue(masterEnabled: boolean, settings?: SoundRoleSettings) {
  return playFocusRole("extended", masterEnabled, settings ?? defaultRoleSettings);
}

export function playFocusSuccessCue(masterEnabled: boolean, settings?: SoundRoleSettings) {
  return playFocusRole("missionWin", masterEnabled, settings ?? { ...defaultRoleSettings, style: "ceremonial" });
}

export function playFocusNotificationCue(masterEnabled: boolean, settings?: SoundRoleSettings) {
  return playFocusRole("notification", masterEnabled, settings ?? defaultRoleSettings);
}
