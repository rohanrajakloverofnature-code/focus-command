import { getMissionCompletionRecords, type CharacterMilestone, type FocusState } from "./focus-command";

export type CharacterAchievementPathEntry = CharacterMilestone & {
  presentationTitle: string;
  investedMs: number;
  powerEarned: number;
  goldEarned: number;
  radarAchievements: number;
  completedMissions: number;
  levelStart: number;
  levelEnd: number;
};

function fallbackTitle(formName: string) {
  return formName.split(" · ")[0]?.trim() || "Commander";
}

/**
 * Builds read-only character periods from the surviving immutable progression
 * stream. A completion that triggers a new form belongs to that new form, while
 * work before the first recorded form remains outside the path rather than being
 * invented. Event IDs make equal-timestamp boundaries deterministic.
 */
export function getCharacterAchievementPath(state: Pick<FocusState,
  "characterMilestones"
  | "missionCompletions"
  | "missions"
  | "progression"
  | "reflections"
>): CharacterAchievementPathEntry[] {
  const progression = state.progression
    .map((event, originalIndex) => ({ event, originalIndex }))
    .sort((left, right) => left.event.occurredAt.localeCompare(right.event.occurredAt) || left.originalIndex - right.originalIndex);
  const progressionIndexById = new Map(progression.map(({ event }, index) => [event.id, index]));

  const milestones = state.characterMilestones
    .filter((milestone) => !milestone.sourceProgressionEventId || progressionIndexById.has(milestone.sourceProgressionEventId))
    .map((milestone, originalIndex) => {
      const linkedIndex = milestone.sourceProgressionEventId
        ? progressionIndexById.get(milestone.sourceProgressionEventId)
        : undefined;
      const timestampIndex = progression.findIndex(({ event }) => event.occurredAt >= milestone.achievedAt);
      return {
        milestone,
        originalIndex,
        startIndex: linkedIndex ?? (timestampIndex >= 0 ? timestampIndex : Number.MAX_SAFE_INTEGER),
      };
    })
    .sort((left, right) => left.startIndex - right.startIndex || left.milestone.achievedAt.localeCompare(right.milestone.achievedAt) || left.originalIndex - right.originalIndex);
  if (!milestones.length) return [];

  const titlesByProgressionId = new Map(progression.map(({ event }) => [
    event.id,
    event.titleAfter?.trim() || event.titleBefore?.trim() || "",
  ]));
  const entries = milestones.map(({ milestone, startIndex }) => ({
    ...milestone,
    totalPowerAtAchievement: 0,
    levelAtAchievement: Math.max(1, milestone.levelAtAchievement),
    presentationTitle: titlesByProgressionId.get(milestone.sourceProgressionEventId ?? "") || fallbackTitle(milestone.formName),
    investedMs: 0,
    powerEarned: 0,
    goldEarned: 0,
    radarAchievements: 0,
    completedMissions: 0,
    levelStart: Math.max(1, milestone.levelAtAchievement),
    levelEnd: Math.max(1, milestone.levelAtAchievement),
    startIndex,
  }));

  const periodByProgressionId = new Map<string, number>();
  let activePeriod = -1;
  let cumulativePower = 0;
  for (const [{ event }, progressionIndex] of progression.map((item, index) => [item, index] as const)) {
    cumulativePower += Math.max(0, event.powerAwarded || 0);
    while (activePeriod + 1 < entries.length && entries[activePeriod + 1].startIndex <= progressionIndex) {
      activePeriod += 1;
      const entry = entries[activePeriod];
      entry.totalPowerAtAchievement = cumulativePower;
      entry.levelAtAchievement = Math.max(1, Math.floor(event.levelAfter ?? entry.levelAtAchievement));
      entry.levelStart = entry.levelAtAchievement;
      entry.levelEnd = entry.levelAtAchievement;
    }
    if (activePeriod < 0) continue;
    const entry = entries[activePeriod];
    periodByProgressionId.set(event.id, activePeriod);
    entry.powerEarned += Math.max(0, event.powerAwarded || 0);
    entry.goldEarned += Math.max(0, event.goldAwarded || 0);
    entry.levelEnd = Math.max(entry.levelEnd, Math.floor(event.levelAfter ?? entry.levelEnd));
  }

  for (const completion of getMissionCompletionRecords(state as FocusState)) {
    const periodIndex = periodByProgressionId.get(completion.progressionEventId);
    if (periodIndex === undefined) continue;
    const entry = entries[periodIndex];
    entry.investedMs += Math.max(0, completion.durationMs);
    entry.completedMissions += 1;
    if (completion.reflection?.feelingAfter === "great") entry.radarAchievements += 1;
  }

  return entries.map(({ startIndex: _startIndex, ...entry }) => entry);
}
