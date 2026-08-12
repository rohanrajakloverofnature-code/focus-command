import { describe, expect, it } from "vitest";

import {
  getMiniAchievementHeadlines,
  getNextMiniAchievementHeadlineIndex,
} from "../lib/mini-achievement-headlines";
import type { WallOfFameEntry } from "../lib/focus-command";

const entry = (overrides: Partial<WallOfFameEntry> = {}): WallOfFameEntry => ({
  id: "entry_1",
  missionId: "mission_1",
  missionTitle: "Focus block",
  miniAchievement: "Held a distraction-free block",
  miniAchievementRating: 4,
  occurredAt: "2026-08-12T09:00:00.000Z",
  ...overrides,
});

describe("Mini Achievements headline selection", () => {
  it("renders no ticker items when no mini achievement exceeds 3.0", () => {
    expect(getMiniAchievementHeadlines([
      entry({ id: "three", miniAchievementRating: 3 }),
      entry({ id: "two", miniAchievementRating: 2 }),
    ])).toEqual([]);
  });

  it("keeps a sole eligible achievement static", () => {
    const headlines = getMiniAchievementHeadlines([entry({ id: "only", miniAchievementRating: 3.1 })]);

    expect(headlines).toEqual([
      expect.objectContaining({ id: "only", title: "Held a distraction-free block", rating: 3.1 }),
    ]);
    expect(getNextMiniAchievementHeadlineIndex(0, headlines.length)).toBe(0);
  });

  it("selects and cycles multiple eligible achievements newest first", () => {
    const headlines = getMiniAchievementHeadlines([
      entry({ id: "older", miniAchievement: "Returned after a difficult pause", miniAchievementRating: 4.2, occurredAt: "2026-08-10T09:00:00.000Z" }),
      entry({ id: "ineligible", miniAchievementRating: 3 }),
      entry({ id: "latest", miniAchievement: "Completed the final review", miniAchievementRating: 5, occurredAt: "2026-08-12T10:00:00.000Z" }),
    ]);

    expect(headlines.map((headline) => headline.id)).toEqual(["latest", "older"]);
    expect(getNextMiniAchievementHeadlineIndex(0, headlines.length)).toBe(1);
    expect(getNextMiniAchievementHeadlineIndex(1, headlines.length)).toBe(0);
  });
});
