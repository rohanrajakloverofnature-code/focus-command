import type {
  FocusState,
  NapLog,
  RecoveryActionRecord,
  RecoveryStressor,
  ScreenTimeLog,
  SleepLog,
} from "./focus-command";

export type RecoveryRangeKind = "week" | "month" | "lifetime" | "custom";
export type RecoveryDateRange = { startDate: string; endDate: string };

function localDateNow(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function shiftDate(localDate: string, days: number): string {
  const date = new Date(`${localDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function monthStart(localDate: string): string { return `${localDate.slice(0, 7)}-01`; }

function weekStart(localDate: string): string {
  const date = new Date(`${localDate}T12:00:00Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

function validDate(value: string | undefined | null): value is string { return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value)); }

export function getRecoveryDateRange(
  kind: RecoveryRangeKind,
  timezone: string,
  localDates: string[],
  customStart?: string,
  customEnd?: string,
): RecoveryDateRange {
  const today = localDateNow(timezone);
  if (kind === "week") return { startDate: weekStart(today), endDate: today };
  if (kind === "month") return { startDate: monthStart(today), endDate: today };
  if (kind === "custom" && validDate(customStart) && validDate(customEnd) && customStart <= customEnd) return { startDate: customStart, endDate: customEnd };
  const first = localDates.filter(validDate).sort()[0] ?? today;
  return { startDate: first, endDate: today };
}

export function inRecoveryRange<T extends { localDate: string }>(records: T[], range: RecoveryDateRange): T[] {
  return records.filter((record) => record.localDate >= range.startDate && record.localDate <= range.endDate);
}

function average(values: Array<number | null | undefined>): number | null {
  const available = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return available.length ? Number((available.reduce((sum, value) => sum + value, 0) / available.length).toFixed(1)) : null;
}

function uniqueDays(records: Array<{ localDate: string }>): number { return new Set(records.map((record) => record.localDate)).size; }

export type RecoverySummary = {
  range: RecoveryDateRange;
  stressors: RecoveryStressor[];
  actions: RecoveryActionRecord[];
  sleepLogs: SleepLog[];
  naps: NapLog[];
  screenLogs: ScreenTimeLog[];
  averageStress: number | null;
  peakStress: number | null;
  averageSleepMinutes: number | null;
  averageSleepQuality: number | null;
  totalNapMinutes: number;
  averageScreenMinutes: number | null;
  recordedDays: { stress: number; sleep: number; screen: number };
  commonScreenLabel: string | null;
  afterActionChange: number | null;
};

export function getRecoverySummary(
  state: Pick<FocusState, "profile" | "recoveryStressors" | "recoveryActions" | "sleepLogs" | "napLogs" | "screenTimeLogs">,
  kind: RecoveryRangeKind = "lifetime",
  customStart?: string,
  customEnd?: string,
): RecoverySummary {
  const stressors = state.recoveryStressors ?? [];
  const actions = state.recoveryActions ?? [];
  const sleepLogs = state.sleepLogs ?? [];
  const naps = state.napLogs ?? [];
  const screenLogs = state.screenTimeLogs ?? [];
  const range = getRecoveryDateRange(kind, state.profile.timezone, [...stressors, ...actions, ...sleepLogs, ...naps, ...screenLogs].map((item) => item.localDate), customStart, customEnd);
  const selectedStressors = inRecoveryRange(stressors, range);
  const selectedActions = inRecoveryRange(actions, range);
  const selectedSleep = inRecoveryRange(sleepLogs, range);
  const selectedNaps = inRecoveryRange(naps, range);
  const selectedScreen = inRecoveryRange(screenLogs, range);
  const labels = new Map<string, number>();
  selectedScreen.forEach((entry) => {
    const label = entry.primaryLabel.trim();
    if (label) labels.set(label, (labels.get(label) ?? 0) + 1);
  });
  const commonScreenLabel = Array.from(labels.entries()).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] ?? null;
  const actionChanges = selectedActions
    .filter((action) => action.beforeIntensity !== null && action.afterIntensity !== null)
    .map((action) => (action.beforeIntensity as number) - (action.afterIntensity as number));
  return {
    range,
    stressors: selectedStressors,
    actions: selectedActions,
    sleepLogs: selectedSleep,
    naps: selectedNaps,
    screenLogs: selectedScreen,
    averageStress: average(selectedStressors.map((stressor) => stressor.intensity)),
    peakStress: selectedStressors.length ? Math.max(...selectedStressors.map((stressor) => stressor.intensity)) : null,
    averageSleepMinutes: average(selectedSleep.map((entry) => entry.durationMinutes)),
    averageSleepQuality: average(selectedSleep.map((entry) => entry.quality)),
    totalNapMinutes: selectedNaps.reduce((sum, entry) => sum + entry.durationMinutes, 0),
    averageScreenMinutes: average(selectedScreen.map((entry) => entry.totalMinutes)),
    recordedDays: { stress: uniqueDays(selectedStressors), sleep: uniqueDays(selectedSleep), screen: uniqueDays(selectedScreen) },
    commonScreenLabel,
    afterActionChange: average(actionChanges),
  };
}

export function formatMinutes(totalMinutes: number | null): string {
  if (totalMinutes === null || !Number.isFinite(totalMinutes)) return "—";
  const rounded = Math.max(0, Math.round(totalMinutes));
  return `${Math.floor(rounded / 60)}h ${rounded % 60}m`;
}

/** Context only: this helper never changes the existing emotional forecast or wellbeing calculation. */
export function getRecoveryContextForDates(
  state: Pick<FocusState, "recoveryStressors" | "sleepLogs" | "napLogs" | "screenTimeLogs">,
  localDates: string[],
) {
  const dateSet = new Set(localDates);
  const stressors = (state.recoveryStressors ?? []).filter((item) => dateSet.has(item.localDate));
  const sleepLogs = (state.sleepLogs ?? []).filter((item) => dateSet.has(item.localDate));
  const naps = (state.napLogs ?? []).filter((item) => dateSet.has(item.localDate));
  const screenLogs = (state.screenTimeLogs ?? []).filter((item) => dateSet.has(item.localDate));
  return {
    contextDays: new Set([...stressors, ...sleepLogs, ...naps, ...screenLogs].map((item) => item.localDate)).size,
    averageStress: average(stressors.map((item) => item.intensity)),
    averageSleepMinutes: average(sleepLogs.map((item) => item.durationMinutes)),
    averageScreenMinutes: average(screenLogs.map((item) => item.totalMinutes)),
    napMinutes: naps.reduce((sum, item) => sum + item.durationMinutes, 0),
  };
}

export function getRecoveryStressorLabel(status: RecoveryStressor["status"]): string {
  return ({
    identified: "Identified", understanding: "Understanding", control: "Control", action: "Action",
    monitoring: "Monitoring", resolving: "Resolving", resolved: "Resolved", recurring: "Recurring",
  })[status];
}

export function getRecoveryActionLabel(type: RecoveryActionRecord["type"]): string {
  return ({
    grounding: "Grounding", paced_breathing: "Paced breathing", relaxation: "Relaxation", mindfulness: "Mindfulness",
    acceptance: "Acceptance", problem_solving: "Problem-solving", other: "Other",
  })[type];
}
