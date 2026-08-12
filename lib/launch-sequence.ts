export const LAUNCH_SEQUENCE_DURATION_MS = 11_900;
export const REDUCED_MOTION_LAUNCH_DURATION_MS = 1_200;
export const LAUNCH_FIRE_SOUND_STOP_DELAY_MS = 6_200;
export const REDUCED_MOTION_FIRE_SOUND_STOP_DELAY_MS = 360;
export const LAUNCH_QUOTE_CUE_DELAY_MS = 6_520;
export const REDUCED_MOTION_QUOTE_CUE_DELAY_MS = 650;
export const LAUNCH_QUOTE_VISIBLE_DELAY_MS = 6_860;
export const REDUCED_MOTION_QUOTE_VISIBLE_DELAY_MS = 740;
export const LAUNCH_QUOTE_HOLD_DURATION_MS = 3_350;
export const REDUCED_MOTION_QUOTE_HOLD_DURATION_MS = 170;

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

/** Holds the motivational quote on screen after its entrance animation. */
export function getLaunchQuoteHoldDuration(reduceMotion: boolean) {
  return reduceMotion ? REDUCED_MOTION_QUOTE_HOLD_DURATION_MS : LAUNCH_QUOTE_HOLD_DURATION_MS;
}

/** Limits the full flame field to the lower half of any available viewport. */
export function getLaunchFireStageHeight(viewportHeight: number) {
  return Math.max(0, Math.min(viewportHeight * 0.5, 520));
}
