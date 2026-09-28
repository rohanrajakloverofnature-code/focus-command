import { describe, expect, it } from "vitest";

import { addLocalDays, isValidLocalDateRange, monthGrid } from "../lib/calendar-date";
import { compareCalendarPeriods, getCalendarCompletionSummary } from "../lib/calendar-activity";
import { createInitialState, normalizeHydratedState } from "../lib/focus-command";

describe("calendar activity completion", () => {
  it("calculates task completion from planned tasks, not empty days", () => {
    const result = getCalendarCompletionSummary([
      { id: "a", title: "Read", localDate: "2026-09-28", missionId: null, completedAt: "2026-09-28T10:00:00.000Z", createdAt: "2026-09-27T10:00:00.000Z" },
      { id: "b", title: "Walk", localDate: "2026-09-28", missionId: null, completedAt: null, createdAt: "2026-09-27T10:00:00.000Z" },
    ], "2026-09-28", "2026-09-30");
    expect(result.planned).toBe(2);
    expect(result.completed).toBe(1);
    expect(result.percentage).toBe(50);
    expect(result.series).toHaveLength(3);
    expect(result.series[1].percentage).toBeNull();
  });

  it("compares only days that had planned activity", () => {
    const current = getCalendarCompletionSummary([{ id: "a", title: "Read", localDate: "2026-09-28", missionId: null, completedAt: "now", createdAt: "now" }], "2026-09-28", "2026-09-29").series;
    const previous = getCalendarCompletionSummary([{ id: "b", title: "Read", localDate: "2026-09-27", missionId: null, completedAt: null, createdAt: "now" }], "2026-09-27", "2026-09-27").series;
    expect(compareCalendarPeriods(current, previous)).toEqual({ currentAverage: 100, previousAverage: 0, delta: 100 });
  });

  it("handles local date boundaries without timezone drift", () => {
    expect(addLocalDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(isValidLocalDateRange("2026-09-28", "2026-09-30")).toBe(true);
    expect(isValidLocalDateRange("2026-09-30", "2026-09-28")).toBe(false);
    expect(monthGrid("2026-09-01").filter(Boolean)).toHaveLength(30);
  });

  it("restores an older backup with no calendar field using an empty default", () => {
    const legacy = createInitialState() as unknown as Record<string, unknown>;
    delete legacy.calendarActivities;
    const restored = normalizeHydratedState(legacy as never);
    expect(restored.calendarActivities).toEqual([]);
  });
});
