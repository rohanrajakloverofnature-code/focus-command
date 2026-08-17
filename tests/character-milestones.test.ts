import { describe, expect, it } from "vitest";

import {
  createInitialState,
  MAX_CHARACTER_MILESTONES,
  normalizeHydratedState,
  rebuildCharacterMilestonesFromProgression,
  removeCompletedMissionRun,
  type CharacterMilestone,
  type MissionCompletion,
  type ProgressionEvent,
} from "../lib/focus-command";
import { createOfflineBackupArchive, parseOfflineBackupArchive } from "../lib/offline-backup-format";

function progression(overrides: Partial<ProgressionEvent> = {}): ProgressionEvent {
  return {
    id: "progress_30",
    missionId: "mission_1",
    completionId: "completion_1",
    baseXp: 100,
    comboMultiplier: 1,
    goldMultiplier: 1,
    powerAwarded: 2_081,
    goldAwarded: 0,
    occurredAt: "2026-08-17T09:30:00.000Z",
    note: "Completed: Deep work",
    levelBefore: 29,
    levelAfter: 30,
    titleBefore: "Recruit",
    titleAfter: "Sergeant",
    ...overrides,
  };
}

function completion(id: string, progressionEventId: string): MissionCompletion {
  return {
    id,
    missionId: `mission_${id}`,
    startedAt: "2026-08-17T08:00:00.000Z",
    completedAt: "2026-08-17T09:30:00.000Z",
    durationMs: 5_400_000,
    reflectionId: `reflection_${id}`,
    progressionEventId,
  };
}

describe("automatic character achievement milestones", () => {
  it("records only a genuine automatic form transition and preserves its exact date, level, and power", () => {
    const state = createInitialState();
    const transition = progression();
    const unchanged = progression({
      id: "progress_31",
      completionId: "completion_2",
      occurredAt: "2026-08-18T09:30:00.000Z",
      powerAwarded: 120,
      levelBefore: 30,
      levelAfter: 30,
      titleBefore: "Sergeant",
      titleAfter: "Sergeant",
    });

    const milestones = rebuildCharacterMilestonesFromProgression(state.profile, [transition, unchanged]);

    expect(milestones).toEqual([
      expect.objectContaining({
        id: "character_milestone_progress_30",
        sourceProgressionEventId: "progress_30",
        achievedAt: "2026-08-17T09:30:00.000Z",
        levelAtAchievement: 30,
        totalPowerAtAchievement: 2_081,
      }),
    ]);
  });

  it("rebuilds valid historic transitions for old saves and never duplicates a repeated progression id", () => {
    const state = createInitialState();
    const transition = progression();
    const legacy = { ...state, progression: [transition, { ...transition, occurredAt: "2026-08-18T09:30:00.000Z" }] };
    delete (legacy as Partial<typeof legacy>).characterMilestones;

    const hydrated = normalizeHydratedState(legacy as typeof state);

    expect(hydrated.characterMilestones).toHaveLength(1);
    expect(hydrated.characterMilestones[0]?.id).toBe("character_milestone_progress_30");
    expect(hydrated.characterMilestones[0]?.sourceProgressionEventId).toBe("progress_30");
    expect(hydrated.characterMilestones[0]?.achievedAt).toBe(transition.occurredAt);
  });

  it("captures the automatic custom-form portrait only once its earned activation threshold is crossed", () => {
    const state = createInitialState();
    state.profile.customCharacterForms = [{
      id: "arcane_form",
      name: "Arcane Commander",
      activationLevel: 30,
      portrait: { uri: "file:///arcane.png", name: "arcane.png" },
      video: { uri: "file:///arcane.mp4", name: "arcane.mp4" },
      music: {
        duringVideo: { uri: "file:///during.mp3", name: "during.mp3", durationSeconds: 10.25 },
        postVideo: { uri: "file:///after.mp3", name: "after.mp3", durationSeconds: 7.5 },
      },
      createdAt: "2026-08-01T00:00:00.000Z",
    }];

    const [milestone] = rebuildCharacterMilestonesFromProgression(state.profile, [progression()]);

    expect(milestone).toMatchObject({
      formKey: "custom:arcane_form",
      formName: "Arcane Commander",
      portraitUri: "file:///arcane.png",
    });
  });

  it("keeps the path bounded and lets old backups parse with an empty milestone collection", () => {
    const state = createInitialState();
    const legacyState = { ...state } as typeof state;
    delete (legacyState as Partial<typeof legacyState>).characterMilestones;
    const { archive } = createOfflineBackupArchive(legacyState as typeof state);
    const parsed = parseOfflineBackupArchive(archive);

    expect(parsed.state.characterMilestones).toEqual([]);

    const records: CharacterMilestone[] = Array.from({ length: MAX_CHARACTER_MILESTONES + 2 }, (_, index) => ({
      id: `milestone_${index}`,
      formKey: `builtin:tactical:${index}`,
      formName: `Form ${index}`,
      achievedAt: "2026-08-17T09:30:00.000Z",
      levelAtAchievement: index + 1,
      totalPowerAtAchievement: index,
    }));
    const normalized = normalizeHydratedState({ ...state, characterMilestones: records });
    expect(normalized.characterMilestones).toHaveLength(MAX_CHARACTER_MILESTONES);
    expect(normalized.characterMilestones[0]?.id).toBe("milestone_2");
  });

  it("removes only milestones sourced by a deleted completion and clears the path when no progression survives", () => {
    const initial = createInitialState();
    const firstProgression = progression({ id: "progress_first", completionId: "completion_first" });
    const secondProgression = progression({
      id: "progress_second",
      completionId: "completion_second",
      occurredAt: "2026-08-18T09:30:00.000Z",
      titleBefore: "Sergeant",
      titleAfter: "Lieutenant",
      levelBefore: 30,
      levelAfter: 40,
    });
    const state = {
      ...initial,
      progression: [firstProgression, secondProgression],
      missionCompletions: [completion("completion_first", firstProgression.id), completion("completion_second", secondProgression.id)],
      characterMilestones: [
        { id: "character_milestone_progress_first", sourceProgressionEventId: firstProgression.id, formKey: "builtin:tactical:1", formName: "Sergeant · Field-ready", achievedAt: firstProgression.occurredAt, levelAtAchievement: 30, totalPowerAtAchievement: 2_081 },
        { id: "character_milestone_progress_second", sourceProgressionEventId: secondProgression.id, formKey: "builtin:command:2", formName: "Lieutenant · Armored", achievedAt: secondProgression.occurredAt, levelAtAchievement: 40, totalPowerAtAchievement: 4_162 },
      ],
    };

    const afterPartialDeletion = removeCompletedMissionRun(state, "completion_first");
    expect(afterPartialDeletion.progression.map((event) => event.id)).toEqual(["progress_second"]);
    expect(afterPartialDeletion.characterMilestones.map((milestone) => milestone.sourceProgressionEventId)).toEqual(["progress_second"]);

    const afterDeleteAll = removeCompletedMissionRun(afterPartialDeletion, "completion_second");
    expect(afterDeleteAll.progression).toEqual([]);
    expect(afterDeleteAll.characterMilestones).toEqual([]);
  });

  it("rebuilds a fresh path from a later surviving progression after the earlier history was removed", () => {
    const state = createInitialState();
    const freshProgression = progression({ id: "progress_fresh", completionId: "completion_fresh" });
    const rebuilt = rebuildCharacterMilestonesFromProgression(state.profile, [freshProgression]);

    expect(rebuilt).toEqual([
      expect.objectContaining({
        id: "character_milestone_progress_fresh",
        sourceProgressionEventId: "progress_fresh",
        totalPowerAtAchievement: freshProgression.powerAwarded,
      }),
    ]);
  });
});
