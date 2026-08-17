import { getMissionCompletionRecords, type CharacterMilestone, type FocusState } from "./focus-command";

export type CharacterAchievementPathEntry = CharacterMilestone & {
  presentationTitle: string;
  investedMs: number;
  powerEarned: number;
  radarAchievements: number;
  completedMissions: number;
};

function fallbackTitle(formName: string) {
  return formName.split(" · ")[0]?.trim() || "Commander";
}

/**
 * Builds the read-only character periods in one forward pass. A completion that
 * triggers a new form belongs to that new form, and earlier work is deliberately
 * left outside the first recorded character period rather than being invented.
 */
export function getCharacterAchievementPath(state: Pick<FocusState,
  "characterMilestones"
  | "missionCompletions"
  | "missions"
  | "progression"
  | "reflections"
>): CharacterAchievementPathEntry[] {
  const milestones = [...state.characterMilestones].sort((left, right) => left.achievedAt.localeCompare(right.achievedAt));
  if (!milestones.length) return [];

  const titlesByMilestoneId = new Map(state.progression.map((event) => [
    `character_milestone_${event.id}`,
    event.titleAfter?.trim() || event.titleBefore?.trim() || "",
  ]));
  const entries = milestones.map((milestone) => ({
    ...milestone,
    presentationTitle: titlesByMilestoneId.get(milestone.id) || fallbackTitle(milestone.formName),
    investedMs: 0,
    powerEarned: 0,
    radarAchievements: 0,
    completedMissions: 0,
  }));

  let completionPeriod = 0;
  for (const completion of getMissionCompletionRecords(state as FocusState).slice().reverse()) {
    while (completionPeriod + 1 < entries.length && completion.completedAt >= entries[completionPeriod + 1].achievedAt) completionPeriod += 1;
    if (completion.completedAt < entries[completionPeriod].achievedAt) continue;
    const entry = entries[completionPeriod];
    entry.investedMs += completion.durationMs;
    entry.completedMissions += 1;
    if (completion.reflection?.feelingAfter === "great") entry.radarAchievements += 1;
  }

  let progressionPeriod = 0;
  for (const progression of [...state.progression].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt))) {
    while (progressionPeriod + 1 < entries.length && progression.occurredAt >= entries[progressionPeriod + 1].achievedAt) progressionPeriod += 1;
    if (progression.occurredAt >= entries[progressionPeriod].achievedAt) entries[progressionPeriod].powerEarned += Math.max(0, progression.powerAwarded || 0);
  }

  return entries;
}
