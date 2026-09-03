import { describe, expect, it } from "vitest";

import {
  createInitialState,
  getDailyProgress,
  getSubjectCapture,
  normalizeHydratedState,
  type FocusState,
  type Mission,
} from "../lib/focus-command";

function mission(overrides: Partial<Mission> = {}): Mission {
  const now = new Date().toISOString();
  return {
    id: "mission_map_enabled",
    title: "Physics problems",
    subject: "Physics",
    category: "Study",
    difficulty: "medium",
    baseXp: 40,
    bossId: null,
    specificTopic: "Kinematics",
    revisionEnabled: true,
    status: "completed",
    frequency: "once",
    createdAt: now,
    dueAt: null,
    startedAt: now,
    pausedAt: null,
    pausedMilliseconds: 0,
    endedAt: now,
    completedAt: now,
    revisionTopicIds: [],
    progressionEventId: null,
    allowMultipleDailyCompletions: false,
    completionHistory: [now],
    ...overrides,
  };
}

function stateWithToday(): FocusState {
  const state = createInitialState();
  state.profile.timezone = "UTC";
  return state;
}

describe("Mission map participation and Daily Power Progress", () => {
  it("keeps legacy missions map-enabled, but excludes an opted-out mission and its linked reviews", () => {
    const state = stateWithToday();
    const legacyMission = mission({ id: "legacy_map_enabled", subject: "Physics", includeInSubjectMap: undefined });
    const optedOutMission = mission({ id: "map_disabled", subject: "Reading", includeInSubjectMap: false });
    state.missions = [legacyMission, optedOutMission];
    state.srsTopics = [
      { id: "physics_review", missionId: legacyMission.id, subject: "Physics", topic: "Velocity", stage: 3, dueDate: "2026-09-01", completedAt: "2026-09-01T12:00:00.000Z", createdAt: "2026-08-01T12:00:00.000Z", status: "completed" },
      { id: "reading_review", missionId: optedOutMission.id, subject: "Reading", topic: "Chapter one", stage: 3, dueDate: "2026-09-01", completedAt: "2026-09-01T12:00:00.000Z", createdAt: "2026-08-01T12:00:00.000Z", status: "completed" },
      { id: "unlinked_legacy_review", missionId: null, subject: "Legacy", topic: "Unlinked topic", stage: 0, dueDate: "2026-09-01", completedAt: null, createdAt: "2026-08-01T12:00:00.000Z", status: "scheduled" },
    ];

    expect(getSubjectCapture(state).map((entry) => entry.subject)).toEqual(["Physics", "Legacy"]);
    expect(getSubjectCapture(state).find((entry) => entry.subject === "Physics")).toMatchObject({ completed: 2, total: 2, capture: 1 });

    const legacyHydrated = normalizeHydratedState({ ...state, missions: [legacyMission] });
    expect(legacyHydrated.missions[0]?.includeInSubjectMap).toBe(true);
  });

  it("measures Daily Mission Progress from stored Total Power awards, not Base XP", () => {
    const state = stateWithToday();
    const completedAt = new Date().toISOString();
    const trackedMission = mission({ id: "power_progress_mission", completedAt });
    state.missions = [trackedMission];
    state.profile.dailyTargetXp = 150;
    state.missionCompletions = [
      { id: "power_completion_one", missionId: trackedMission.id, startedAt: completedAt, completedAt, durationMs: 30 * 60_000, reflectionId: "", progressionEventId: "power_progression_one" },
      { id: "power_completion_two", missionId: trackedMission.id, startedAt: completedAt, completedAt, durationMs: 20 * 60_000, reflectionId: "", progressionEventId: "power_progression_two" },
    ];
    state.progression = [
      { id: "power_progression_one", completionId: "power_completion_one", missionId: trackedMission.id, baseXp: 40, comboMultiplier: 1.5, goldMultiplier: 1, powerAwarded: 60, goldAwarded: 0, occurredAt: completedAt, note: "Completed" },
      { id: "power_progression_two", completionId: "power_completion_two", missionId: trackedMission.id, baseXp: 50, comboMultiplier: 1.8, goldMultiplier: 1, powerAwarded: 90, goldAwarded: 0, occurredAt: completedAt, note: "Completed" },
    ];

    expect(getDailyProgress(state)).toEqual({ earned: 150, target: 150, progress: 1 });
  });
});
