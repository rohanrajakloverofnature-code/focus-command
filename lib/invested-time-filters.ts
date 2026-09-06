import type { MissionCompletionRecord, Reflection } from "./focus-command";

export interface InvestedTimeFilters {
  category: string | null;
  skill: string | null;
}

export const DEFAULT_INVESTED_TIME_FILTERS: InvestedTimeFilters = {
  category: null,
  skill: null,
};

export function normalizeSavedSkill(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function getSavedSkillSuggestions(reflections: readonly Reflection[]): string[] {
  const displayByNormalizedSkill = new Map<string, string>();
  reflections.forEach((reflection) => {
    reflection.skills.forEach((skill) => {
      const display = skill.trim().replace(/\s+/g, " ");
      const normalized = normalizeSavedSkill(display);
      if (normalized && !displayByNormalizedSkill.has(normalized)) displayByNormalizedSkill.set(normalized, display);
    });
  });
  return Array.from(displayByNormalizedSkill.values()).sort((left, right) => left.localeCompare(right));
}

export function getCompletedMissionCategories(records: readonly MissionCompletionRecord[]): string[] {
  return Array.from(new Set(records.map((record) => record.category.trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

export function completionMatchesInvestedTimeFilters(
  completion: MissionCompletionRecord,
  filters: InvestedTimeFilters,
): boolean {
  const categoryMatches = !filters.category || completion.category.trim() === filters.category;
  const selectedSkill = filters.skill ? normalizeSavedSkill(filters.skill) : "";
  const skillMatches = !selectedSkill || Boolean(completion.reflection?.skills.some((skill) => normalizeSavedSkill(skill) === selectedSkill));
  return categoryMatches && skillMatches;
}

export function filterInvestedTimeCompletions(
  records: readonly MissionCompletionRecord[],
  filters: InvestedTimeFilters,
): MissionCompletionRecord[] {
  if (!filters.category && !filters.skill) return [...records];
  return records.filter((completion) => completionMatchesInvestedTimeFilters(completion, filters));
}
