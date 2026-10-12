export const BEHAVIOR_URGE_TYPES = [
  "avoidance",
  "checking",
  "scrolling",
  "anger",
  "reassurance",
  "comfort",
  "impulse",
  "procrastination",
  "other",
] as const;
export type BehaviorUrgeType = (typeof BEHAVIOR_URGE_TYPES)[number];

export const BEHAVIOR_ACTION_TYPES = [
  "avoided",
  "scrolled",
  "checked",
  "sought_reassurance",
  "confronted",
  "paused",
  "started_task",
  "used_alternative",
  "other",
] as const;
export type BehaviorActionType = (typeof BEHAVIOR_ACTION_TYPES)[number];

export const BEHAVIOR_CONSEQUENCE_TYPES = [
  "relief",
  "reward",
  "escape",
  "conflict",
  "no_change",
  "regret",
  "progress",
  "other",
] as const;
export type BehaviorConsequenceType = (typeof BEHAVIOR_CONSEQUENCE_TYPES)[number];

export const BEHAVIOR_THOUGHT_PATTERNS = [
  "all_or_nothing",
  "overgeneralizing",
  "negative_filter",
  "discounting_positive",
  "worst_case",
  "mind_reading",
  "emotional_reasoning",
  "magnifying_minimizing",
  "should_must",
  "labeling",
  "personalizing",
  "blaming",
  "not_sure",
  "custom",
] as const;
export type BehaviorThoughtPattern = (typeof BEHAVIOR_THOUGHT_PATTERNS)[number];

export type BehaviorPatternsRangeKind = "today" | "week" | "month" | "year" | "custom";

export type BehaviorLog = {
  id: string;
  createdAt: string;
  updatedAt: string;
  localDate: string;
  trigger: string;
  urgeType: BehaviorUrgeType;
  urgeIntensityBefore: number | null;
  automaticThought: string;
  emotion: string;
  bodyResponse: string;
  actionType: BehaviorActionType;
  action: string;
  immediateConsequence: BehaviorConsequenceType;
  urgeIntensityAfter: number | null;
  evidenceFor: string;
  evidenceAgainst: string;
  thoughtPatterns: BehaviorThoughtPattern[];
  customThoughtPattern: string;
  balancedThought: string;
  alternativeAction: string;
  alternativeHelpful: boolean | null;
  laterConsequence: string;
  missionId: string | null;
  calendarActivityId: string | null;
};

export type BehaviorLogDraft = Partial<Omit<BehaviorLog, "id" | "createdAt" | "updatedAt" | "localDate">> & {
  trigger: string;
  urgeType: BehaviorUrgeType;
  actionType: BehaviorActionType;
  immediateConsequence: BehaviorConsequenceType;
  localDate?: string;
};

export type BehaviorPatternsRange = {
  kind: BehaviorPatternsRangeKind;
  startDate: string;
  endDate: string;
  label: string;
  valid: boolean;
  calendarDays: number;
};

type CountItem = { label: string; count: number };

export type BehaviorPatternsSummary = {
  range: BehaviorPatternsRange;
  totalLogs: number;
  highUrgeLogs: number;
  averageUrgeBefore: number | null;
  peakUrgeBefore: number | null;
  averageUrgeAfter: number | null;
  averageUrgeChange: number | null;
  alternativeActionAttempts: number;
  alternativeActionAttemptRate: number | null;
  alternativeHelpfulCount: number;
  alternativeHelpfulRate: number | null;
  linkedMissionLogs: number;
  linkedCalendarLogs: number;
  triggerCounts: CountItem[];
  urgeTypeCounts: CountItem[];
  actionCounts: CountItem[];
  consequenceCounts: CountItem[];
  thoughtPatternCounts: CountItem[];
  dailySeries: Array<{ localDate: string; logs: number; averageUrgeBefore: number | null }>;
};

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidLocalDate(value: unknown): value is string {
  if (typeof value !== "string" || !LOCAL_DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function localToday(timezone: string, now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function addLocalDays(localDate: string, days: number): string {
  const date = new Date(`${localDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dayCount(startDate: string, endDate: string): number {
  return Math.floor((Date.parse(`${endDate}T12:00:00.000Z`) - Date.parse(`${startDate}T12:00:00.000Z`)) / 86_400_000) + 1;
}

function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function countLabels(values: string[]): CountItem[] {
  const counts = new Map<string, number>();
  values.map((value) => value.trim()).filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts, ([label, count]) => ({ label: titleCase(label), count })).sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function average(values: number[]): number | null {
  return values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)) : null;
}

function rating(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(10, Math.round(parsed * 10) / 10)) : null;
}

function text(value: unknown, limit: number): string {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function optionalDate(value: unknown, fallback: string): string {
  return isValidLocalDate(value) ? value : fallback;
}

export function normalizeBehaviorLogs(value: unknown, timezone: string, now = new Date()): BehaviorLog[] {
  if (!Array.isArray(value)) return [];
  const fallbackDate = localToday(timezone, now);
  return value.filter((candidate): candidate is Record<string, unknown> => Boolean(candidate) && typeof candidate === "object" && !Array.isArray(candidate)).flatMap((candidate) => {
    const createdAt = typeof candidate.createdAt === "string" && Number.isFinite(Date.parse(candidate.createdAt)) ? candidate.createdAt : "";
    if (!candidate.id || typeof candidate.id !== "string" || !createdAt || typeof candidate.updatedAt !== "string" || !Number.isFinite(Date.parse(candidate.updatedAt))) return [];
    const urgeType = BEHAVIOR_URGE_TYPES.includes(candidate.urgeType as BehaviorUrgeType) ? candidate.urgeType as BehaviorUrgeType : "other";
    const actionType = BEHAVIOR_ACTION_TYPES.includes(candidate.actionType as BehaviorActionType) ? candidate.actionType as BehaviorActionType : "other";
    const immediateConsequence = BEHAVIOR_CONSEQUENCE_TYPES.includes(candidate.immediateConsequence as BehaviorConsequenceType) ? candidate.immediateConsequence as BehaviorConsequenceType : "other";
    const thoughtPatterns = Array.isArray(candidate.thoughtPatterns)
      ? candidate.thoughtPatterns.filter((pattern): pattern is BehaviorThoughtPattern => BEHAVIOR_THOUGHT_PATTERNS.includes(pattern as BehaviorThoughtPattern)).slice(0, 8)
      : [];
    return [{
      id: candidate.id,
      createdAt,
      updatedAt: candidate.updatedAt,
      localDate: optionalDate(candidate.localDate, fallbackDate),
      trigger: text(candidate.trigger, 240),
      urgeType,
      urgeIntensityBefore: rating(candidate.urgeIntensityBefore),
      automaticThought: text(candidate.automaticThought, 500),
      emotion: text(candidate.emotion, 120),
      bodyResponse: text(candidate.bodyResponse, 240),
      actionType,
      action: text(candidate.action, 240),
      immediateConsequence,
      urgeIntensityAfter: rating(candidate.urgeIntensityAfter),
      evidenceFor: text(candidate.evidenceFor, 500),
      evidenceAgainst: text(candidate.evidenceAgainst, 500),
      thoughtPatterns,
      customThoughtPattern: text(candidate.customThoughtPattern, 120),
      balancedThought: text(candidate.balancedThought, 500),
      alternativeAction: text(candidate.alternativeAction, 240),
      alternativeHelpful: typeof candidate.alternativeHelpful === "boolean" ? candidate.alternativeHelpful : null,
      laterConsequence: text(candidate.laterConsequence, 360),
      missionId: typeof candidate.missionId === "string" ? candidate.missionId : null,
      calendarActivityId: typeof candidate.calendarActivityId === "string" ? candidate.calendarActivityId : null,
    } satisfies BehaviorLog];
  });
}

export function getBehaviorPatternsRange(kind: BehaviorPatternsRangeKind, timezone: string, customStart = "", customEnd = "", now = new Date()): BehaviorPatternsRange {
  const today = localToday(timezone, now);
  let startDate = today;
  let endDate = today;
  let valid = true;
  if (kind === "week") startDate = addLocalDays(today, -6);
  if (kind === "month") startDate = `${today.slice(0, 8)}01`;
  if (kind === "year") startDate = `${today.slice(0, 4)}-01-01`;
  if (kind === "custom") {
    startDate = customStart.trim();
    endDate = customEnd.trim();
    valid = isValidLocalDate(startDate) && isValidLocalDate(endDate) && startDate <= endDate;
  }
  return {
    kind,
    startDate,
    endDate,
    label: kind === "today" ? "TODAY" : kind === "week" ? "LAST 7 DAYS" : kind === "month" ? "THIS MONTH" : kind === "year" ? "THIS YEAR" : "CUSTOM RANGE",
    valid,
    calendarDays: valid ? dayCount(startDate, endDate) : 0,
  };
}

export function getBehaviorLogsInRange(logs: BehaviorLog[], range: BehaviorPatternsRange): BehaviorLog[] {
  if (!range.valid) return [];
  return logs.filter((log) => log.localDate >= range.startDate && log.localDate <= range.endDate);
}

export function getBehaviorPatternsSummary(logs: BehaviorLog[], kind: BehaviorPatternsRangeKind, timezone: string, customStart = "", customEnd = "", now = new Date()): BehaviorPatternsSummary {
  const range = getBehaviorPatternsRange(kind, timezone, customStart, customEnd, now);
  const selected = getBehaviorLogsInRange(logs, range);
  const before = selected.map((log) => log.urgeIntensityBefore).filter((value): value is number => value !== null);
  const after = selected.map((log) => log.urgeIntensityAfter).filter((value): value is number => value !== null);
  const changes = selected.flatMap((log) => log.urgeIntensityBefore !== null && log.urgeIntensityAfter !== null ? [Number((log.urgeIntensityAfter - log.urgeIntensityBefore).toFixed(1))] : []);
  const alternativeActionLogs = selected.filter((log) => Boolean(log.alternativeAction.trim()));
  const helpfulLogs = alternativeActionLogs.filter((log) => log.alternativeHelpful !== null);
  const dailySeries = range.valid ? Array.from({ length: range.calendarDays }, (_, index) => {
    const localDate = addLocalDays(range.startDate, index);
    const dayLogs = selected.filter((log) => log.localDate === localDate);
    return { localDate, logs: dayLogs.length, averageUrgeBefore: average(dayLogs.map((log) => log.urgeIntensityBefore).filter((value): value is number => value !== null)) };
  }) : [];
  return {
    range,
    totalLogs: selected.length,
    highUrgeLogs: before.filter((value) => value >= 7).length,
    averageUrgeBefore: average(before),
    peakUrgeBefore: before.length ? Math.max(...before) : null,
    averageUrgeAfter: average(after),
    averageUrgeChange: average(changes),
    alternativeActionAttempts: alternativeActionLogs.length,
    alternativeActionAttemptRate: selected.length ? Number((alternativeActionLogs.length / selected.length).toFixed(3)) : null,
    alternativeHelpfulCount: helpfulLogs.filter((log) => log.alternativeHelpful === true).length,
    alternativeHelpfulRate: helpfulLogs.length ? Number((helpfulLogs.filter((log) => log.alternativeHelpful === true).length / helpfulLogs.length).toFixed(3)) : null,
    linkedMissionLogs: selected.filter((log) => Boolean(log.missionId)).length,
    linkedCalendarLogs: selected.filter((log) => Boolean(log.calendarActivityId)).length,
    triggerCounts: countLabels(selected.map((log) => log.trigger)),
    urgeTypeCounts: countLabels(selected.map((log) => log.urgeType)),
    actionCounts: countLabels(selected.map((log) => log.action || log.actionType)),
    consequenceCounts: countLabels(selected.map((log) => log.immediateConsequence)),
    thoughtPatternCounts: countLabels(selected.flatMap((log) => log.thoughtPatterns)),
    dailySeries,
  };
}

export function formatBehaviorLabel(value: string): string {
  return titleCase(value);
}
