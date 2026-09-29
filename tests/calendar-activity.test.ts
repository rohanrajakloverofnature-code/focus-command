import { describe, expect, it } from "vitest";

import { addLocalDays, isValidLocalDateRange, monthGrid } from "../lib/calendar-date";
import { compareCalendarPeriods, getCalendarCompletionSummary } from "../lib/calendar-activity";
import { createInitialState, normalizeHydratedState, removeCompletedMissionRun, removeMissionAndLinkedState } from "../lib/focus-command";
import { readFileSync } from "node:fs";

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

  it("unlinks dated assignments instead of deleting them when their mission is removed", () => {
    const state = createInitialState();
    state.missions = [{ id: "m1", title: "Read", subject: "Study", category: "Focus", difficulty: "medium", baseXp: 25, bossId: null, specificTopic: "", revisionEnabled: false, status: "planned", frequency: "once", createdAt: "2026-09-29T00:00:00.000Z", dueAt: null, startedAt: null, pausedAt: null, pausedMilliseconds: 0, endedAt: null, completedAt: null, revisionTopicIds: [], progressionEventId: null, allowMultipleDailyCompletions: false, completionHistory: [] }];
    state.calendarActivities = [
      { id: "linked", title: "Read", localDate: "2026-09-29", missionId: "m1", completedAt: null, createdAt: "2026-09-29T00:00:00.000Z" },
      { id: "standalone", title: "Walk", localDate: "2026-09-29", missionId: null, completedAt: null, createdAt: "2026-09-29T00:00:00.000Z" },
    ];
    const restored = removeMissionAndLinkedState(state, "m1");
    expect(restored.calendarActivities).toEqual([
      { id: "linked", title: "Read", localDate: "2026-09-29", missionId: null, completedAt: null, createdAt: "2026-09-29T00:00:00.000Z" },
      { id: "standalone", title: "Walk", localDate: "2026-09-29", missionId: null, completedAt: null, createdAt: "2026-09-29T00:00:00.000Z" },
    ]);
  });

  it("resets a linked dated assignment when its only completed run is deleted", () => {
    const state = createInitialState();
    state.missions = [{ id: "m1", title: "Read", subject: "Study", category: "Focus", difficulty: "medium", baseXp: 25, bossId: null, specificTopic: "", revisionEnabled: false, status: "completed", frequency: "once", createdAt: "2026-09-29T00:00:00.000Z", dueAt: null, startedAt: null, pausedAt: null, pausedMilliseconds: 0, endedAt: "2026-09-29T10:00:00.000Z", completedAt: "2026-09-29T10:00:00.000Z", revisionTopicIds: [], progressionEventId: "p1", allowMultipleDailyCompletions: false, completionHistory: ["2026-09-29T10:00:00.000Z"] }];
    state.calendarActivities = [{ id: "linked", title: "Read", localDate: "2026-09-29", missionId: "m1", completedAt: "2026-09-29T10:00:00.000Z", createdAt: "2026-09-29T00:00:00.000Z" }];
    state.missionCompletions = [{ id: "c1", missionId: "m1", startedAt: "2026-09-29T09:00:00.000Z", completedAt: "2026-09-29T10:00:00.000Z", durationMs: 3_600_000, reflectionId: "r1", progressionEventId: "p1" }];
    const restored = removeCompletedMissionRun(state, "c1");
    expect(restored.calendarActivities[0].completedAt).toBeNull();
    expect(restored.missionCompletions).toHaveLength(0);
  });

  it("keeps today-only completion and analytics routing contracts explicit", () => {
    const stateSource = readFileSync("lib/focus-command.tsx", "utf8");
    const missionsSource = readFileSync("app/(tabs)/missions.tsx", "utf8");
    const dashboardSource = readFileSync("app/(tabs)/dashboard.tsx", "utf8");
    expect(stateSource).toContain("target.localDate !== today");
    expect(missionsSource).toContain('setFilter("active")');
    expect(dashboardSource).toContain('router.push("/activity-calendar" as never)');
  });

  it("keeps mission completion as the canonical calendar completion path", () => {
    const source = readFileSync("lib/focus-command.tsx", "utf8");
    expect(source).toContain("activity.missionId === missionId && activity.localDate === completionDate");
    expect(source).toContain("completedAt: activity.completedAt ?? endedAt");
  });
});
