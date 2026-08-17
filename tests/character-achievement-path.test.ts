import { describe, expect, it } from "vitest";

import { getCharacterAchievementPath } from "../lib/character-achievement-path";
import type { FocusState } from "@/lib/focus-command";

function createPathState() {
  return {
    profile: { timezone: "UTC" },
    characterMilestones: [
      { id: "character_milestone_p0", formKey: "builtin:tactical:1", formName: "Cadet · Field-ready", achievedAt: "2026-01-01T10:00:00.000Z", levelAtAchievement: 30, totalPowerAtAchievement: 30 },
      { id: "character_milestone_p1", formKey: "builtin:command:2", formName: "Lieutenant · Armored Specialist", achievedAt: "2026-01-03T10:00:00.000Z", levelAtAchievement: 90, totalPowerAtAchievement: 80 },
    ],
    missions: [],
    missionCompletions: [
      { id: "c0", missionId: "m0", startedAt: "2026-01-02T08:00:00.000Z", completedAt: "2026-01-02T09:00:00.000Z", durationMs: 3_600_000, reflectionId: "r0", progressionEventId: "p0" },
      { id: "c1", missionId: "m1", startedAt: "2026-01-03T08:00:00.000Z", completedAt: "2026-01-03T10:00:00.000Z", durationMs: 1_800_000, reflectionId: "r1", progressionEventId: "p1" },
    ],
    progression: [
      { id: "p0", occurredAt: "2026-01-01T10:00:00.000Z", powerAwarded: 30, titleAfter: "Cadet" },
      { id: "p1", occurredAt: "2026-01-03T10:00:00.000Z", powerAwarded: 50, titleAfter: "Lieutenant" },
      { id: "p2", occurredAt: "2026-01-04T10:00:00.000Z", powerAwarded: 20, titleAfter: "Lieutenant" },
    ],
    reflections: [
      { id: "r0", missionId: "m0", completionId: "c0", createdAt: "2026-01-02T09:00:00.000Z", feelingAfter: "great", skills: [] },
      { id: "r1", missionId: "m1", completionId: "c1", createdAt: "2026-01-03T10:00:00.000Z", feelingAfter: "steady", skills: [] },
    ],
  } as unknown as FocusState;
}

describe("getCharacterAchievementPath", () => {
  it("keeps each earned form’s real focus, radar, and Total Power records inside exact milestone boundaries", () => {
    const entries = getCharacterAchievementPath(createPathState());

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ presentationTitle: "Cadet", investedMs: 3_600_000, radarAchievements: 1, powerEarned: 30, completedMissions: 1 });
    expect(entries[1]).toMatchObject({ presentationTitle: "Lieutenant", investedMs: 1_800_000, radarAchievements: 0, powerEarned: 70, completedMissions: 1 });
  });

  it("keeps the path empty until a real automatic form transition has been recorded", () => {
    const state = createPathState();
    state.characterMilestones = [];
    expect(getCharacterAchievementPath(state)).toEqual([]);
  });
});
