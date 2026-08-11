import { afterEach, describe, expect, it } from "vitest";

import { claimLaunchSequence, resetLaunchSequenceForTests } from "../lib/launch-session";
import { getLaunchFireStageHeight, getLaunchSequenceDuration, LAUNCH_SEQUENCE_DURATION_MS, REDUCED_MOTION_LAUNCH_DURATION_MS } from "../lib/launch-sequence";

afterEach(() => resetLaunchSequenceForTests());

describe("Launch-only lifecycle guard", () => {
  it("claims the overlay once per JavaScript process so navigation cannot restart it", () => {
    expect(claimLaunchSequence()).toBe(true);
    expect(claimLaunchSequence()).toBe(false);
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
});
