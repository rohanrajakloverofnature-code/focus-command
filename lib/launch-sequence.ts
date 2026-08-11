export const LAUNCH_SEQUENCE_DURATION_MS = 4_600;
export const REDUCED_MOTION_LAUNCH_DURATION_MS = 900;

export function getLaunchSequenceDuration(reduceMotion: boolean) {
  return reduceMotion ? REDUCED_MOTION_LAUNCH_DURATION_MS : LAUNCH_SEQUENCE_DURATION_MS;
}

/** Limits the full flame field to the lower half of any available viewport. */
export function getLaunchFireStageHeight(viewportHeight: number) {
  return Math.max(0, Math.min(viewportHeight * 0.5, 520));
}
