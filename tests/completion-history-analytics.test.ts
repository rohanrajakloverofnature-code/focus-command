import { describe, expect, it } from "vitest";

import {
  createInitialState,
  getDashboardStats,
  getMissionCompletionRecords,
  getTodayInvestedMilliseconds,
  normalizeHydratedState,
  type FocusState,
  type Mission,
} from "../lib/focus-command";
import { getDashboardWorkspaceResult } from "../lib/dashboard-workspace";

function mission(overrides: Partial<Mission> = {}): Mission {
  const now = new Date().toISOString();
  return {
    id: "history_mission",
    title: "Deep work block",
    subject: "Study",
    category: "Practice",
    difficulty: "medium",
    baseXp: 50,
    bossId: null,
    specificTopic: "Persistence",
    revisionEnabled: false,
    status: "active",
    frequency: "daily",
    createdAt: now,
    dueAt: null,
    startedAt: null,
    pausedAt: null,
    pausedMilliseconds: 0,
    endedAt: null,
    completedAt: null,
    revisionTopicIds: [],
    progressionEventId: null,
    allowMultipleDailyCompletions: true,
    completionHistory: [],
    ...overrides,
  };
}

function completedState(): FocusState {
  const state = createInitialState();
  const completedAt = new Date().toISOString();
  const startedAt = new Date(Date.now() - 60 * 60_000).toISOString();
  const trackedMission = mission();

  return normalizeHydratedState({
    ...state,
    profile: { ...state.profile, timezone: "UTC" },
    missions: [trackedMission],
    missionCompletions: [
      { id: "completion_one", missionId: trackedMission.id, startedAt, completedAt, durationMs: 25 * 60_000, reflectionId: "reflection_one", progressionEventId: "progression_one" },
      { id: "completion_two", missionId: trackedMission.id, startedAt, completedAt, durationMs: 35 * 60_000, reflectionId: "reflection_two", progressionEventId: "progression_two" },
    ],
    progression: [
      { id: "progression_one", completionId: "completion_one", missionId: trackedMission.id, baseXp: 50, comboMultiplier: 1, goldMultiplier: 1, powerAwarded: 60, goldAwarded: 5, occurredAt: completedAt, note: "Completed: Deep work block" },
      { id: "progression_two", completionId: "completion_two", missionId: trackedMission.id, baseXp: 50, comboMultiplier: 1, goldMultiplier: 1, powerAwarded: 60, goldAwarded: 5, occurredAt: completedAt, note: "Completed: Deep work block" },
    ],
    reflections: [
      { id: "reflection_one", completionId: "completion_one", missionId: trackedMission.id, createdAt: completedAt, feelingBefore: "steady", feelingAfter: "charged", frictionName: "", frictionRating: 1, provokingThought: "", provokingThoughtRating: 1, skills: ["Planning"], miniAchievement: "Protected a focus block", miniAchievementRating: 4.5, customAnswers: {}, focusQuality: 4, stressLevel: 1, clarityLevel: 4, motivationLevel: 4, distractionLevel: 1, energyAfter: 4 },
      { id: "reflection_two", completionId: "completion_two", missionId: trackedMission.id, createdAt: completedAt, feelingBefore: "steady", feelingAfter: "great", frictionName: "", frictionRating: 1, provokingThought: "", provokingThoughtRating: 1, skills: ["Recall"], miniAchievement: "Returned for a second session", miniAchievementRating: 5, customAnswers: {}, focusQuality: 5, stressLevel: 1, clarityLevel: 5, motivationLevel: 5, distractionLevel: 1, energyAfter: 5 },
    ],
  });
}

describe("completion instance history and analytics", () => {
  it("keeps repeated completions immediately available to History, invested time, recognition, and dashboard metrics", () => {
    const state = completedState();
    const history = getMissionCompletionRecords(state);

    expect(history).toHaveLength(2);
    expect(history.map((completion) => completion.id)).toEqual(["completion_one", "completion_two"]);
    expect(history.every((completion) => completion.title === "Deep work block" && completion.durationMs > 0)).toBe(true);
    expect(getTodayInvestedMilliseconds(state)).toBe(60 * 60_000);
    expect(getDashboardStats(state).averageDailyHours).toBeCloseTo(1, 6);
    expect(getDashboardStats(state).wallOfFame.map((entry) => entry.miniAchievement)).toEqual(["Protected a focus block", "Returned for a second session"]);

    const widget = { ...state.profile.dashboardWidgets[0], metric: "time" as const, dateRange: "7d" as const, feature: "missions" as const, subject: "all", category: "all", missionFrequency: "all" as const };
    const missionWidget = { ...widget, metric: "missions" as const };
    const powerWidget = { ...widget, metric: "power" as const };

    expect(getDashboardWorkspaceResult(state, widget)).toMatchObject({ total: 1, sampleCount: 2 });
    expect(getDashboardWorkspaceResult(state, missionWidget)).toMatchObject({ total: 2, sampleCount: 2 });
    expect(getDashboardWorkspaceResult(state, powerWidget)).toMatchObject({ total: 120, sampleCount: 2 });
  });

  it("backfills legacy progression records even when an older saved state already has an empty completion array", () => {
    const state = createInitialState();
    const trackedMission = mission();
    const completedAt = new Date().toISOString();
    const hydrated = normalizeHydratedState({
      ...state,
      missions: [trackedMission],
      missionCompletions: [],
      progression: [{ id: "legacy_progression", missionId: trackedMission.id, baseXp: 50, comboMultiplier: 1, goldMultiplier: 1, powerAwarded: 50, goldAwarded: 5, occurredAt: completedAt, note: "Completed: Deep work block" }],
    });

    expect(getMissionCompletionRecords(hydrated)).toEqual([
      expect.objectContaining({ id: "completion_legacy_legacy_progression", missionId: trackedMission.id, progression: expect.objectContaining({ id: "legacy_progression" }) }),
    ]);
  });
});
