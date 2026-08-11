export const LAUNCH_SEQUENCE_DURATION_MS = 6_100;
export const REDUCED_MOTION_LAUNCH_DURATION_MS = 1_200;
export const LAUNCH_FIRE_SOUND_STOP_DELAY_MS = 1_750;
export const REDUCED_MOTION_FIRE_SOUND_STOP_DELAY_MS = 360;
export const LAUNCH_QUOTE_CUE_DELAY_MS = 2_480;
export const REDUCED_MOTION_QUOTE_CUE_DELAY_MS = 650;
export const LAUNCH_QUOTE_VISIBLE_DELAY_MS = 2_640;
export const REDUCED_MOTION_QUOTE_VISIBLE_DELAY_MS = 740;

export function getLaunchSequenceDuration(reduceMotion: boolean) {
  return reduceMotion ? REDUCED_MOTION_LAUNCH_DURATION_MS : LAUNCH_SEQUENCE_DURATION_MS;
}

/** Ends the fire phase before the deliberate quiet transition into the quote. */
export function getLaunchFireSoundStopDelay(reduceMotion: boolean) {
  return reduceMotion ? REDUCED_MOTION_FIRE_SOUND_STOP_DELAY_MS : LAUNCH_FIRE_SOUND_STOP_DELAY_MS;
}

/** Starts the single refined transition cue after the fire has completely settled. */
export function getLaunchQuoteCueDelay(reduceMotion: boolean) {
  return reduceMotion ? REDUCED_MOTION_QUOTE_CUE_DELAY_MS : LAUNCH_QUOTE_CUE_DELAY_MS;
}

/** Delays the visible quote slightly after the transition cue begins. */
export function getLaunchQuoteVisibleDelay(reduceMotion: boolean) {
  return reduceMotion ? REDUCED_MOTION_QUOTE_VISIBLE_DELAY_MS : LAUNCH_QUOTE_VISIBLE_DELAY_MS;
}

/** Limits the full flame field to the lower half of any available viewport. */
export function getLaunchFireStageHeight(viewportHeight: number) {
  return Math.max(0, Math.min(viewportHeight * 0.5, 520));
}
