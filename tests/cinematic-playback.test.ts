import { describe, expect, it } from "vitest";

import {
  CINEMATIC_VIDEO_ASPECT_RATIO,
  CINEMATIC_VIDEO_AUDIO_MODE,
  CINEMATIC_VIDEO_CONTENT_FIT,
  CINEMATIC_VIDEO_EMBEDDED_VOLUME,
  CINEMATIC_VIDEO_SOUNDTRACK_VOLUME,
  usesCinematicVideoSoundtrack,
} from "../lib/cinematic-playback";

describe("character cinematic native playback contract", () => {
  it("keeps the approved ten-second score enabled for every portrait cinematic", () => {
    const variants = [
      "tactical",
      "tacticalEvolution",
      "command",
      "commandEvolution",
      "shadow",
      "ascendant",
      "baseAscendant",
      "sovereignAscendant",
    ] as const;

    expect(variants.every(usesCinematicVideoSoundtrack)).toBe(true);
  });

  it("uses an explicit native audio session that keeps the score audible beside embedded video audio", () => {
    expect(CINEMATIC_VIDEO_AUDIO_MODE).toEqual({
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
      interruptionModeAndroid: "duckOthers",
    });
    expect(CINEMATIC_VIDEO_SOUNDTRACK_VOLUME).toBeGreaterThan(0.5);
    expect(CINEMATIC_VIDEO_EMBEDDED_VOLUME).toBeGreaterThan(0.8);
  });

  it("preserves the complete portrait image instead of cropping it into the previous wide frame", () => {
    expect(CINEMATIC_VIDEO_CONTENT_FIT).toBe("contain");
    expect(CINEMATIC_VIDEO_ASPECT_RATIO).toBeCloseTo(9 / 16);
  });
});
