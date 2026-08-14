import { describe, expect, it, vi } from "vitest";

import {
  createInitialState,
  getBossProgress,
  getCalendarTimeAverages,
  getDailyProgress,
  getEnergy,
  getMissionCompletionRecords,
  getTodayInvestedMilliseconds,
  normalizeHydratedState,
  removeCompletedMissionRun,
  type FocusState,
  type Mission,
  type MissionCompletion,
  type ProgressionEvent,
} from "../lib/focus-command";

const targetStartedAt = "2026-08-11T09:00:00.000Z";
const targetCompletedAt = "2026-08-11T10:00:00.000Z";
const siblingStartedAt = "2026-08-12T09:00:00.000Z";
const siblingCompletedAt = "2026-08-12T10:00:00.000Z";

function createMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: "mission_target",
    title: "Study physics",
    subject: "Physics",
    category: "Study",
    difficulty: "medium",
    baseXp: 40,
    bossId: null,
    specificTopic: "Kinematics",
    revisionEnabled: true,
    status: "completed",
    frequency: "once",
    createdAt: targetStartedAt,
    dueAt: null,
    startedAt: null,
    pausedAt: null,
    pausedMilliseconds: 0,
    endedAt: targetCompletedAt,
    completedAt: targetCompletedAt,
    revisionTopicIds: ["revision_target"],
    progressionEventId: "progress_target",
    allowMultipleDailyCompletions: false,
    completionHistory: [targetCompletedAt],
    ...overrides,
  };
}

function createFixture(): FocusState {
  const base = createInitialState();
  const targetMission = createMission();
  const siblingMission = createMission({
    id: "mission_sibling",
    title: "Read history",
    subject: "History",
    revisionEnabled: false,
    revisionTopicIds: [],
    progressionEventId: "progress_sibling",
    createdAt: siblingStartedAt,
    endedAt: siblingCompletedAt,
    completedAt: siblingCompletedAt,
    completionHistory: [siblingCompletedAt],
  });
  const targetCompletion: MissionCompletion = {
    id: "completion_target",
    missionId: targetMission.id,
    startedAt: targetStartedAt,
    completedAt: targetCompletedAt,
    durationMs: 60 * 60_000,
    reflectionId: "reflection_target",
    progressionEventId: "progress_target",
  };
  const siblingCompletion: MissionCompletion = {
    id: "completion_sibling",
    missionId: siblingMission.id,
    startedAt: siblingStartedAt,
    completedAt: siblingCompletedAt,
    durationMs: 60 * 60_000,
    reflectionId: "reflection_sibling",
    progressionEventId: "progress_sibling",
  };
  const targetProgression: ProgressionEvent = {
    id: "progress_target",
    missionId: targetMission.id,
    completionId: targetCompletion.id,
    baseXp: 40,
    comboMultiplier: 1,
    goldMultiplier: 1,
    powerAwarded: 40,
    goldAwarded: 4,
    occurredAt: targetCompletedAt,
    note: "Completed: Study physics",
  };
  const siblingProgression: ProgressionEvent = {
    ...targetProgression,
    id: "progress_sibling",
    missionId: siblingMission.id,
    completionId: siblingCompletion.id,
    occurredAt: siblingCompletedAt,
    note: "Completed: Read history",
  };
  return {
    ...base,
    profile: { ...base.profile, timezone: "UTC" },
    missions: [targetMission, siblingMission, createMission({
      id: "mission_generated_daily",
      title: "Generated daily copy",
      status: "planned",
      frequency: "daily",
      startedAt: null,
      endedAt: null,
      completedAt: null,
      progressionEventId: null,
      completionHistory: [],
      generatedByCompletionId: targetCompletion.id,
    })],
    missionCompletions: [targetCompletion, siblingCompletion],
    progression: [targetProgression, siblingProgression],
    reflections: [
      { id: "reflection_target", missionId: targetMission.id, completionId: targetCompletion.id, createdAt: targetCompletedAt, miniAchievement: "Solved vectors", miniAchievementRating: 4.5 } as FocusState["reflections"][number],
      { id: "reflection_sibling", missionId: siblingMission.id, completionId: siblingCompletion.id, createdAt: siblingCompletedAt, miniAchievement: "Kept reading", miniAchievementRating: 4.0 } as FocusState["reflections"][number],
    ],
    srsTopics: [
      { id: "revision_target", missionId: targetMission.id, createdAt: targetCompletedAt, status: "scheduled", completionId: targetCompletion.id } as FocusState["srsTopics"][number],
      { id: "revision_sibling", missionId: siblingMission.id, createdAt: siblingCompletedAt, status: "scheduled", completionId: siblingCompletion.id } as FocusState["srsTopics"][number],
    ],
    transactions: [
      { id: "transaction_target", type: "power_gold", sourceId: targetProgression.id, occurredAt: targetCompletedAt, completionId: targetCompletion.id } as FocusState["transactions"][number],
      { id: "transaction_sibling", type: "power_gold", sourceId: siblingProgression.id, occurredAt: siblingCompletedAt, completionId: siblingCompletion.id } as FocusState["transactions"][number],
    ],
    inventory: [
      { id: "loot_target", acquiredAt: targetCompletedAt, active: true, completionId: targetCompletion.id } as FocusState["inventory"][number],
      { id: "loot_sibling", acquiredAt: siblingCompletedAt, active: true, completionId: siblingCompletion.id } as FocusState["inventory"][number],
    ],
    distractionLogs: [
      { id: "distraction_target", missionId: targetMission.id, occurredAt: "2026-08-11T09:30:00.000Z", category: "phone" } as FocusState["distractionLogs"][number],
      { id: "distraction_sibling", missionId: siblingMission.id, occurredAt: "2026-08-12T09:30:00.000Z", category: "phone" } as FocusState["distractionLogs"][number],
    ],
    goldPowerCarry: 11,
  };
}

describe("completed-run deletion", () => {
  it("removes one run and its direct effects while restoring its parent mission and preserving unrelated records", () => {
    const next = removeCompletedMissionRun(createFixture(), "completion_target");
    const restoredParent = next.missions.find((mission) => mission.id === "mission_target");

    expect(restoredParent).toMatchObject({ status: "planned", startedAt: null, endedAt: null, completedAt: null, progressionEventId: null, completionHistory: [], revisionTopicIds: [] });
    expect(next.missions.some((mission) => mission.id === "mission_generated_daily")).toBe(false);
    expect(next.missionCompletions.map((completion) => completion.id)).toEqual(["completion_sibling"]);
    expect(next.progression.map((event) => event.id)).toEqual(["progress_sibling"]);
    expect(next.reflections.map((reflection) => reflection.id)).toEqual(["reflection_sibling"]);
    expect(next.srsTopics.map((topic) => topic.id)).toEqual(["revision_sibling"]);
    expect(next.transactions.map((transaction) => transaction.id)).toEqual(["transaction_sibling"]);
    expect(next.inventory.map((item) => item.id)).toEqual(["loot_sibling"]);
    expect(next.distractionLogs.map((entry) => entry.id)).toEqual(["distraction_sibling"]);
    expect(next.goldPowerCarry).toBe(0);
    expect(getMissionCompletionRecords(next).map((completion) => completion.id)).toEqual(["completion_sibling"]);
  });

  it("removes only the selected run of a repeatable mission and survives hydration without recreating it", () => {
    const state = createFixture();
    const secondCompletion: MissionCompletion = {
      id: "completion_target_second",
      missionId: "mission_target",
      startedAt: siblingStartedAt,
      completedAt: siblingCompletedAt,
      durationMs: 30 * 60_000,
      reflectionId: "reflection_target_second",
      progressionEventId: "progress_target_second",
    };
    const secondProgression: ProgressionEvent = {
      id: "progress_target_second",
      missionId: "mission_target",
      completionId: secondCompletion.id,
      baseXp: 40,
      comboMultiplier: 1,
      goldMultiplier: 1,
      powerAwarded: 40,
      goldAwarded: 4,
      occurredAt: siblingCompletedAt,
      note: "Completed: Study physics",
    };
    const repeatableState: FocusState = {
      ...state,
      missions: state.missions.map((mission) => mission.id === "mission_target" ? { ...mission, status: "planned", allowMultipleDailyCompletions: true, completionHistory: [targetCompletedAt, siblingCompletedAt], completedAt: siblingCompletedAt, endedAt: siblingCompletedAt, progressionEventId: secondProgression.id } : mission),
      missionCompletions: [...state.missionCompletions, secondCompletion],
      progression: [...state.progression, secondProgression],
      reflections: [...state.reflections, { id: "reflection_target_second", missionId: "mission_target", completionId: secondCompletion.id, createdAt: siblingCompletedAt } as FocusState["reflections"][number]],
    };

    const next = normalizeHydratedState(removeCompletedMissionRun(repeatableState, "completion_target"));
    const parent = next.missions.find((mission) => mission.id === "mission_target");

    expect(parent).toMatchObject({ status: "planned", completionHistory: [siblingCompletedAt], progressionEventId: "progress_target_second" });
    expect(next.missionCompletions.map((completion) => completion.id)).toContain("completion_target_second");
    expect(next.missionCompletions.map((completion) => completion.id)).not.toContain("completion_target");
    expect(next.progression.map((event) => event.id)).toContain("progress_target_second");
    expect(getMissionCompletionRecords(next).map((completion) => completion.id)).not.toContain("completion_target");
  });

  it("removes exactly the middle run of three completed attempts and preserves the first, third, and unrelated mission", () => {
    const state = createFixture();
    const middleCompletion: MissionCompletion = {
      id: "completion_target_middle",
      missionId: "mission_target",
      startedAt: siblingStartedAt,
      completedAt: siblingCompletedAt,
      durationMs: 30 * 60_000,
      reflectionId: "reflection_target_middle",
      progressionEventId: "progress_target_middle",
    };
    const thirdCompletedAt = "2026-08-13T10:00:00.000Z";
    const thirdCompletion: MissionCompletion = {
      id: "completion_target_third",
      missionId: "mission_target",
      startedAt: "2026-08-13T09:00:00.000Z",
      completedAt: thirdCompletedAt,
      durationMs: 45 * 60_000,
      reflectionId: "reflection_target_third",
      progressionEventId: "progress_target_third",
    };
    const middleProgression: ProgressionEvent = {
      ...state.progression[0],
      id: "progress_target_middle",
      completionId: middleCompletion.id,
      occurredAt: siblingCompletedAt,
    };
    const thirdProgression: ProgressionEvent = {
      ...state.progression[0],
      id: "progress_target_third",
      completionId: thirdCompletion.id,
      occurredAt: thirdCompletedAt,
    };
    const threeRunState: FocusState = {
      ...state,
      missions: state.missions.map((mission) => mission.id === "mission_target" ? {
        ...mission,
        status: "planned",
        allowMultipleDailyCompletions: true,
        completionHistory: [targetCompletedAt, siblingCompletedAt, thirdCompletedAt],
        endedAt: thirdCompletedAt,
        completedAt: thirdCompletedAt,
        progressionEventId: thirdProgression.id,
      } : mission),
      missionCompletions: [...state.missionCompletions, middleCompletion, thirdCompletion],
      progression: [...state.progression, middleProgression, thirdProgression],
      reflections: [...state.reflections,
        { id: "reflection_target_middle", missionId: "mission_target", completionId: middleCompletion.id, createdAt: siblingCompletedAt } as FocusState["reflections"][number],
        { id: "reflection_target_third", missionId: "mission_target", completionId: thirdCompletion.id, createdAt: thirdCompletedAt } as FocusState["reflections"][number],
      ],
    };

    const next = removeCompletedMissionRun(threeRunState, middleCompletion.id);
    const parent = next.missions.find((mission) => mission.id === "mission_target");

    expect(parent).toMatchObject({ status: "planned", completionHistory: [targetCompletedAt, thirdCompletedAt], progressionEventId: thirdProgression.id, completedAt: thirdCompletedAt });
    expect(next.missionCompletions.filter((completion) => completion.missionId === "mission_target").map((completion) => completion.id)).toEqual(["completion_target", "completion_target_third"]);
    expect(next.progression.map((event) => event.id)).toEqual(expect.arrayContaining(["progress_target", "progress_target_third", "progress_sibling"]));
    expect(next.progression.map((event) => event.id)).not.toContain(middleProgression.id);
    expect(next.reflections.map((reflection) => reflection.id)).not.toContain("reflection_target_middle");
    expect(next.missionCompletions.map((completion) => completion.id)).toContain("completion_sibling");
  });

  it("reverses the selected run from production-derived time, energy, XP, boss, and combo calculations", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-11T12:00:00.000Z"));
    try {
      const state = createFixture();
      const withBoss: FocusState = {
        ...state,
        missions: state.missions.map((mission) => mission.id === "mission_target" ? { ...mission, bossId: "boss_target" } : mission),
      };
      const next = removeCompletedMissionRun(withBoss, "completion_target");

      expect(getCalendarTimeAverages(withBoss, targetCompletedAt).weekTotalHours).toBe(1);
      expect(getCalendarTimeAverages(next, targetCompletedAt).weekTotalHours).toBe(0);
      expect(getTodayInvestedMilliseconds(withBoss)).toBe(60 * 60_000);
      expect(getTodayInvestedMilliseconds(next)).toBe(0);
      expect(getDailyProgress(withBoss).earned).toBe(40);
      expect(getDailyProgress(next).earned).toBe(0);
      expect(getEnergy(withBoss).used).toBeGreaterThan(0);
      expect(getEnergy(next).used).toBe(0);
      expect(getBossProgress(next, "boss_target")).toBe(0);
      expect(next.combo.lastActiveDate).toBe("2026-08-12");
      expect(next.combo.qualifyingStreak).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("never deletes a later active or completed daily copy that originated from the removed run", () => {
    const state = createFixture();
    const protectedGenerated = state.missions.find((mission) => mission.id === "mission_generated_daily");
    if (!protectedGenerated) throw new Error("Expected generated daily fixture");
    const next = removeCompletedMissionRun({
      ...state,
      missions: state.missions.map((mission) => mission.id === protectedGenerated.id ? {
        ...mission,
        status: "completed",
        completionHistory: [siblingCompletedAt],
        completedAt: siblingCompletedAt,
      } : mission),
    }, "completion_target");

    expect(next.missions.find((mission) => mission.id === "mission_generated_daily")).toMatchObject({
      status: "completed",
      completionHistory: [siblingCompletedAt],
    });
  });

  it("keeps ambiguous legacy loot, transactions, and revisions rather than guessing they belong to the deleted run", () => {
    const state = createFixture();
    const ambiguousLegacyState: FocusState = {
      ...state,
      srsTopics: [...state.srsTopics,
        { id: "legacy_revision_one", missionId: "mission_target", createdAt: targetCompletedAt, status: "scheduled" } as FocusState["srsTopics"][number],
        { id: "legacy_revision_two", missionId: "mission_target", createdAt: targetCompletedAt, status: "scheduled" } as FocusState["srsTopics"][number],
      ],
      inventory: [...state.inventory,
        { id: "legacy_loot_one", acquiredAt: targetCompletedAt, active: true } as FocusState["inventory"][number],
        { id: "legacy_loot_two", acquiredAt: targetCompletedAt, active: true } as FocusState["inventory"][number],
      ],
      transactions: [...state.transactions,
        { id: "legacy_loot_transaction_one", type: "loot", occurredAt: targetCompletedAt } as FocusState["transactions"][number],
        { id: "legacy_loot_transaction_two", type: "loot", occurredAt: targetCompletedAt } as FocusState["transactions"][number],
      ],
    };

    const next = removeCompletedMissionRun(ambiguousLegacyState, "completion_target");

    expect(next.srsTopics.map((topic) => topic.id)).toEqual(expect.arrayContaining(["legacy_revision_one", "legacy_revision_two"]));
    expect(next.inventory.map((item) => item.id)).toEqual(expect.arrayContaining(["legacy_loot_one", "legacy_loot_two"]));
    expect(next.transactions.map((transaction) => transaction.id)).toEqual(expect.arrayContaining(["legacy_loot_transaction_one", "legacy_loot_transaction_two"]));
  });

  it("restores only inventory consumed by the selected run and safely ignores an unknown completion id", () => {
    const state = createFixture();
    const stateWithConsumption: FocusState = {
      ...state,
      inventory: [...state.inventory,
        { id: "consumed_target", acquiredAt: "2026-08-01T10:00:00.000Z", active: false, effectiveOn: "2026-08-11", consumedAt: targetCompletedAt, consumedByCompletionId: "completion_target" } as FocusState["inventory"][number],
        { id: "consumed_other", acquiredAt: "2026-08-01T10:00:00.000Z", active: false, effectiveOn: "2026-08-10", consumedAt: targetCompletedAt } as FocusState["inventory"][number],
      ],
    };
    const next = removeCompletedMissionRun(stateWithConsumption, "completion_target");

    expect(next.inventory.find((item) => item.id === "consumed_target")).toMatchObject({ active: true, consumedAt: null, consumedByCompletionId: undefined });
    expect(next.inventory.find((item) => item.id === "consumed_other")).toMatchObject({ active: false, consumedAt: targetCompletedAt });
    expect(removeCompletedMissionRun(next, "unknown_completion")).toBe(next);
  });
});
