export const MINIMUM_LAUNCH_AUDIO_SECONDS = 5;
export const MAXIMUM_LAUNCH_AUDIO_SECONDS = 10;

export function assertLaunchAudioDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < MINIMUM_LAUNCH_AUDIO_SECONDS || seconds > MAXIMUM_LAUNCH_AUDIO_SECONDS) {
    const readable = Number.isFinite(seconds) ? seconds.toFixed(2) : "unknown";
    throw new Error(`Launch audio is ${readable} seconds. Choose audio from ${MINIMUM_LAUNCH_AUDIO_SECONDS.toFixed(1)} to ${MAXIMUM_LAUNCH_AUDIO_SECONDS.toFixed(1)} seconds.`);
  }
}
