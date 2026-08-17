import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { getCharacterAchievementPath } from "../lib/character-achievement-path";
import type { FocusState } from "@/lib/focus-command";

function createPathState() {
  return {
    profile: { timezone: "UTC" },
    characterMilestones: [
      { id: "character_milestone_p0", sourceProgressionEventId: "p0", formKey: "builtin:tactical:1", formName: "Cadet · Field-ready", achievedAt: "2026-01-01T10:00:00.000Z", levelAtAchievement: 30, totalPowerAtAchievement: 30 },
      { id: "character_milestone_p1", sourceProgressionEventId: "p1", formKey: "builtin:command:2", formName: "Lieutenant · Armored Specialist", achievedAt: "2026-01-03T10:00:00.000Z", levelAtAchievement: 90, totalPowerAtAchievement: 80 },
    ],
    missions: [],
    missionCompletions: [
      { id: "c0", missionId: "m0", startedAt: "2026-01-02T08:00:00.000Z", completedAt: "2026-01-02T09:00:00.000Z", durationMs: 3_600_000, reflectionId: "r0", progressionEventId: "p0" },
      { id: "c1", missionId: "m1", startedAt: "2026-01-03T08:00:00.000Z", completedAt: "2026-01-03T10:00:00.000Z", durationMs: 1_800_000, reflectionId: "r1", progressionEventId: "p1" },
    ],
    progression: [
      { id: "p0", occurredAt: "2026-01-01T10:00:00.000Z", powerAwarded: 30, goldAwarded: 3, titleAfter: "Cadet", levelAfter: 30 },
      { id: "p1", occurredAt: "2026-01-03T10:00:00.000Z", powerAwarded: 50, goldAwarded: 5, titleAfter: "Lieutenant", levelAfter: 90 },
      { id: "p2", occurredAt: "2026-01-04T10:00:00.000Z", powerAwarded: 20, goldAwarded: 7, titleAfter: "Lieutenant", levelAfter: 91 },
    ],
    reflections: [
      { id: "r0", missionId: "m0", completionId: "c0", createdAt: "2026-01-02T09:00:00.000Z", feelingAfter: "great", skills: [] },
      { id: "r1", missionId: "m1", completionId: "c1", createdAt: "2026-01-03T10:00:00.000Z", feelingAfter: "steady", skills: [] },
    ],
  } as unknown as FocusState;
}

describe("getCharacterAchievementPath", () => {
  it("keeps each earned form’s real focus, radar, power, gold, and level range inside exact progression boundaries", () => {
    const entries = getCharacterAchievementPath(createPathState());

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ presentationTitle: "Cadet", investedMs: 3_600_000, radarAchievements: 1, powerEarned: 30, goldEarned: 3, completedMissions: 1, totalPowerAtAchievement: 30, levelStart: 30, levelEnd: 30 });
    expect(entries[1]).toMatchObject({ presentationTitle: "Lieutenant", investedMs: 1_800_000, radarAchievements: 0, powerEarned: 70, goldEarned: 12, completedMissions: 1, totalPowerAtAchievement: 80, levelStart: 90, levelEnd: 91 });
  });

  it("uses the selected node’s own immutable source title and excludes milestones whose source progression was removed", () => {
    const state = createPathState();
    state.characterMilestones.push({
      id: "character_milestone_removed",
      sourceProgressionEventId: "removed_event",
      formKey: "builtin:shadow:3",
      formName: "Incorrect Current Profile · Shadow",
      achievedAt: "2026-01-05T10:00:00.000Z",
      levelAtAchievement: 120,
      totalPowerAtAchievement: 999,
    });

    const entries = getCharacterAchievementPath(state);

    expect(entries.map((entry) => entry.presentationTitle)).toEqual(["Cadet", "Lieutenant"]);
    expect(entries[1]).toMatchObject({ totalPowerAtAchievement: 80, goldEarned: 12 });
  });

  it("keeps the path empty until a real automatic form transition has been recorded", () => {
    const state = createPathState();
    state.characterMilestones = [];
    expect(getCharacterAchievementPath(state)).toEqual([]);
  });

  it("restarts connectors on each route focus while keeping Reduced Motion instant and forwards the node-owned historic snapshot", () => {
    const screen = readFileSync(resolve(process.cwd(), "app/character-achievement-path.tsx"), "utf8");
    const cinematic = readFileSync(resolve(process.cwd(), "components/rank-character.tsx"), "utf8");

    expect(screen).toContain("useFocusEffect(useCallback(() => {");
    expect(screen).toContain("setPathAnimationRun((run) => run + 1)");
    expect(screen).toContain("const CONNECTOR_DRAW_DURATION_MS = 420");
    expect(screen).toContain("const CONNECTOR_HANDOFF_MS = 120");
    expect(screen).toContain("withSequence(");
    expect(screen).toContain("onScrollBeginDrag={cancelAutoFollow}");
    expect(screen).toContain("if (!autoFollowActive.current) return");
    expect(screen).toContain("if (!displayEntries.length || state.profile.reduceMotion)");
    expect(screen).toContain("goldBalance={selectedAchievement.goldEarned}");
    expect(screen).toContain("historicPortraitUri={selectedAchievement.portraitUri}");
    expect(screen).toContain("historicFormName={selectedAchievement.formName}");
    expect(cinematic).toContain("historicPortraitUri?: string");
    expect(cinematic).toContain("historicFormName?: string");
  });
});
