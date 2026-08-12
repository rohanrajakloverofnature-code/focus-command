import { afterEach, describe, expect, it } from "vitest";

import { claimLaunchSequence, isLaunchSequenceActive, resetLaunchSequenceForTests, setLaunchSequenceActive } from "../lib/launch-session";
import {
  getLaunchFireSoundStopDelay,
  getLaunchFireStageHeight,
  getLaunchQuoteCueDelay,
  getLaunchQuoteHoldDuration,
  getLaunchQuoteVisibleDelay,
  LAUNCH_QUOTE_HOLD_DURATION_MS,
  getLaunchSequenceDuration,
  LAUNCH_FIRE_SOUND_STOP_DELAY_MS,
  LAUNCH_QUOTE_CUE_DELAY_MS,
  LAUNCH_QUOTE_VISIBLE_DELAY_MS,
  LAUNCH_SEQUENCE_DURATION_MS,
  REDUCED_MOTION_FIRE_SOUND_STOP_DELAY_MS,
  REDUCED_MOTION_LAUNCH_DURATION_MS,
  REDUCED_MOTION_QUOTE_CUE_DELAY_MS,
  REDUCED_MOTION_QUOTE_VISIBLE_DELAY_MS,
} from "../lib/launch-sequence";

afterEach(() => resetLaunchSequenceForTests());

describe("Launch-only lifecycle guard", () => {
  it("claims the overlay once per JavaScript process so navigation cannot restart it", () => {
    expect(claimLaunchSequence()).toBe(true);
    expect(claimLaunchSequence()).toBe(false);
  });

  it("exposes a root-level active stage so competing celebrations and sounds can remain silent", () => {
    expect(isLaunchSequenceActive()).toBe(false);
    setLaunchSequenceActive(true);
    expect(isLaunchSequenceActive()).toBe(true);
    setLaunchSequenceActive(false);
    expect(isLaunchSequenceActive()).toBe(false);
  });

  it("uses a brief reduced-motion alternative instead of the continuous sequence", () => {
    expect(getLaunchSequenceDuration(false)).toBe(LAUNCH_SEQUENCE_DURATION_MS);
    expect(getLaunchSequenceDuration(true)).toBe(REDUCED_MOTION_LAUNCH_DURATION_MS);
  });

  it("keeps fire inside the lower half of both compact and tall viewports", () => {
    expect(getLaunchFireStageHeight(320)).toBe(160);
    expect(getLaunchFireStageHeight(2_400)).toBeLessThanOrEqual(1_200);
    expect(getLaunchFireStageHeight(2_400)).toBe(520);
  });

  it("keeps the fire, deliberate quiet pause, cinematic cue, and visible quote in that order", () => {
    expect(getLaunchFireSoundStopDelay(false)).toBe(LAUNCH_FIRE_SOUND_STOP_DELAY_MS);
    expect(getLaunchFireSoundStopDelay(true)).toBe(REDUCED_MOTION_FIRE_SOUND_STOP_DELAY_MS);
    expect(getLaunchQuoteCueDelay(false)).toBe(LAUNCH_QUOTE_CUE_DELAY_MS);
    expect(getLaunchQuoteCueDelay(true)).toBe(REDUCED_MOTION_QUOTE_CUE_DELAY_MS);
    expect(getLaunchQuoteVisibleDelay(false)).toBe(LAUNCH_QUOTE_VISIBLE_DELAY_MS);
    expect(getLaunchQuoteVisibleDelay(true)).toBe(REDUCED_MOTION_QUOTE_VISIBLE_DELAY_MS);
    expect(getLaunchQuoteHoldDuration(false)).toBe(LAUNCH_QUOTE_HOLD_DURATION_MS);
    expect(getLaunchFireSoundStopDelay(false)).toBeLessThan(getLaunchQuoteCueDelay(false));
    expect(getLaunchQuoteCueDelay(false)).toBeLessThan(getLaunchQuoteVisibleDelay(false));
    expect(getLaunchQuoteVisibleDelay(false)).toBeLessThan(getLaunchSequenceDuration(false));
    expect(getLaunchFireSoundStopDelay(false)).toBeGreaterThanOrEqual(5_000);
    expect(getLaunchFireSoundStopDelay(false)).toBeLessThanOrEqual(7_000);
    expect(getLaunchQuoteHoldDuration(false)).toBeGreaterThanOrEqual(3_000);
    expect(getLaunchQuoteHoldDuration(false)).toBeLessThanOrEqual(4_000);
    expect(getLaunchFireSoundStopDelay(true)).toBeLessThan(getLaunchQuoteCueDelay(true));
    expect(getLaunchQuoteCueDelay(true)).toBeLessThan(getLaunchQuoteVisibleDelay(true));
    expect(getLaunchQuoteVisibleDelay(true)).toBeLessThan(getLaunchSequenceDuration(true));
  });
});
