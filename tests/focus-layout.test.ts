import { describe, expect, it } from "vitest";

import {
  MINI_ACHIEVEMENT_TICKER_LAYOUT,
  RECOGNITION_WINDOW_LAYOUT,
  getRecognitionWindowCardWidth,
  hasReservedMiniAchievementTickerSpace,
} from "../lib/focus-layout";

describe("focused Home and Dashboard layout constraints", () => {
  it("reserves the full ticker height inside the header zone before the profile card begins", () => {
    expect(MINI_ACHIEVEMENT_TICKER_LAYOUT.height).toBeGreaterThanOrEqual(56);
    expect(hasReservedMiniAchievementTickerSpace()).toBe(true);
  });

  it("keeps Recognition Window cards equal and usable on compact and wide portrait content widths", () => {
    const compactCardWidth = getRecognitionWindowCardWidth(288);
    const wideCardWidth = getRecognitionWindowCardWidth(420);

    expect(compactCardWidth).toBeGreaterThanOrEqual(RECOGNITION_WINDOW_LAYOUT.minimumCardWidth);
    expect(wideCardWidth).toBeGreaterThan(compactCardWidth);
    expect(RECOGNITION_WINDOW_LAYOUT.cardHeight).toBeGreaterThan(180);
  });
});
