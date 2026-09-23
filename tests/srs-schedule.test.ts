import { describe, expect, it } from "vitest";

import { createInitialState, normalizeHydratedState } from "../lib/focus-command";
import {
  getSrsCurrentDueDate,
  getSrsNextDueDate,
  getSrsProgress,
  getSrsIntervals,
} from "../lib/srs-schedule";

describe("difficulty-based spaced repetition", () => {
  it("keeps every new schedule within the 90-day limit", () => {
    expect(getSrsIntervals("easy")).toEqual([1, 7, 21, 45, 90]);
    expect(getSrsIntervals("medium")).toEqual([1, 3, 10, 30, 60, 90]);
    expect(getSrsIntervals("tough")).toEqual([1, 2, 5, 14, 30, 60, 90]);
    expect(getSrsIntervals("toughest")).toEqual([1, 2, 4, 8, 16, 30, 60, 90]);
    expect(Math.max(...getSrsIntervals("easy"))).toBe(90);
    expect(Math.max(...getSrsIntervals("medium"))).toBe(90);
    expect(Math.max(...getSrsIntervals("tough"))).toBe(90);
    expect(Math.max(...getSrsIntervals("toughest"))).toBe(90);
  });

  it("calculates comparable percentages from each topic's own stage count", () => {
    expect(getSrsProgress({ stage: 0, difficulty: "easy" })).toMatchObject({ percent: 0, phase: "seed_sown", totalStages: 5 });
    expect(getSrsProgress({ stage: 2, difficulty: "easy" })).toMatchObject({ percent: 40, phase: "developing", totalStages: 5 });
    expect(getSrsProgress({ stage: 4, difficulty: "easy" })).toMatchObject({ percent: 80, phase: "consolidating", totalStages: 5 });
    expect(getSrsProgress({ stage: 8, difficulty: "toughest", status: "completed" })).toMatchObject({ percent: 100, phase: "matured", totalStages: 8 });
    expect(getSrsProgress({ stage: 1, scheduleTier: "legacy" })).toMatchObject({ percent: 33, phase: "emerging", totalStages: 3 });
  });

  it("calculates the current and next due dates from the same schedule", () => {
    const topic = { stage: 3, difficulty: "medium" as const, status: "scheduled" as const };
    expect(getSrsCurrentDueDate(topic, "2026-09-23")).toBe("2026-10-23");
    expect(getSrsNextDueDate(topic, "2026-09-23")).toBe("2026-11-22");
  });

  it("migrates old topics to the legacy schedule without changing their progress model", () => {
    const state = createInitialState();
    state.profile.timezone = "UTC";
    state.missions = [{ id: "hard-mission", difficulty: "hard" } as typeof state.missions[number]];
    state.srsTopics = [{
      id: "old-topic",
      missionId: "hard-mission",
      subject: "Physics",
      topic: "Vectors",
      stage: 2,
      dueDate: "2026-09-30",
      completedAt: "2026-09-20T08:00:00.000Z",
      createdAt: "2026-09-01T08:00:00.000Z",
      status: "scheduled",
    }];

    const normalized = normalizeHydratedState(state);
    expect(normalized.srsTopics[0]).toMatchObject({
      difficulty: "tough",
      scheduleTier: "legacy",
      totalStages: 3,
      stage: 2,
      dueDate: "2026-09-30",
    });
  });
});
