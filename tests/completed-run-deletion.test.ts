import { describe, expect, it } from "vitest";

import {
  createInitialState,
  getMissionCompletionRecords,
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
});
