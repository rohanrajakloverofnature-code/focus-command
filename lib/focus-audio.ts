import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

let player: ReturnType<typeof createAudioPlayer> | null = null;
let audioModePrepared = false;

function getPlayer() {
  if (!player) player = createAudioPlayer(require("../assets/sounds/focus-command-cue.mp3"));
  return player;
}

export async function playFocusSuccessCue(enabled: boolean) {
  if (!enabled) return;
  try {
    if (!audioModePrepared) {
      await setAudioModeAsync({ playsInSilentMode: true });
      audioModePrepared = true;
    }
    const cue = getPlayer();
    cue.seekTo(0);
    cue.play();
  } catch {
    // Audio is an optional enhancement; visual and haptic feedback remain available.
  }
}
