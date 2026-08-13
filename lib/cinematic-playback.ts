import type { CharacterCinematicVariant } from "@/lib/character-development";

/**
 * Shared native playback contract for every selectable character cinematic.
 * The additional score intentionally layers with each clip's embedded audio.
 */
export const CINEMATIC_VIDEO_AUDIO_MODE = {
  playsInSilentMode: true,
  interruptionMode: "mixWithOthers",
  interruptionModeAndroid: "duckOthers",
} as const;

/**
 * Expo Video defaults to exclusive Android audio focus. Explicit mixing lets the
 * clip's embedded audio coexist with the separate approved cinematic score.
 */
export const CINEMATIC_VIDEO_AUDIO_MIXING_MODE = "mixWithOthers" as const;

export const CINEMATIC_VIDEO_SOUNDTRACK_VOLUME = 0.56;
export const CINEMATIC_VIDEO_EMBEDDED_VOLUME = 0.84;
export const CINEMATIC_VIDEO_ASPECT_RATIO = 9 / 16;
export const CINEMATIC_VIDEO_CONTENT_FIT = "contain" as const;

/** All eight portrait clips use the approved simultaneous ten-second soundtrack. */
export function usesCinematicVideoSoundtrack(_variant: CharacterCinematicVariant) {
  return true;
}
