import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

type CueName = "tap" | "confirm" | "achievement";

const sources = {
  tap: require("../assets/sounds/focus-command-tap.mp3"),
  confirm: require("../assets/sounds/focus-command-confirm.mp3"),
  achievement: require("../assets/sounds/focus-command-cue.mp3"),
} as const;

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

export function playFocusTap(enabled: boolean) {
  return playFocusCue("tap", enabled);
}

export function playFocusConfirmCue(enabled: boolean) {
  return playFocusCue("confirm", enabled);
}

export function playFocusSuccessCue(enabled: boolean) {
  return playFocusCue("achievement", enabled);
}
