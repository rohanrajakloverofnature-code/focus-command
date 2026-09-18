import {
  getMissionCompletionRecords,
  toLocalDate,
  type FocusState,
  type MissionCompletionRecord,
  type Reflection,
} from "./focus-command";
import { getCorePrinciplesCheckInsInRange, getCorePrinciplesSummary } from "./core-principles";
import { getFocusFrictionInsight } from "./distraction-log";
import { getPersonalSleepScore } from "./recovery-rhythm";

export type SuperDashboardRangeKind = "today" | "week" | "month" | "lifetime" | "custom";

export type SuperDashboardRange = {
  kind: SuperDashboardRangeKind;
  startDate: string;
  endDate: string;
  label: string;
  valid: boolean;
  calendarDays: number;
  calendarCapacityMinutes: number;
};

/** The exact immutable record collections used by the read-only Super Dashboard. */
export type SuperDashboardState = Pick<FocusState,
  | "profile"
  | "missions"
  | "missionCompletions"
  | "reflections"
  | "srsActivityLog"
  | "corePrincipleDailyCheckIns"
  | "recoveryStressors"
  | "recoveryActions"
  | "sleepLogs"
  | "napLogs"
  | "screenTimeLogs"
  | "journals"
  | "distractionLogs"
  | "progression"
  | "characterMilestones"
>;

export type SuperDashboardMetric = {
  value: number | null;
  observations: number;
};

export type SuperDashboardActivity = {
  id: string;
  label: string;
  minutes: number;
  records: number;
  shareOfReportedActivity: number;
  source: "mission" | "sleep" | "nap" | "screen";
};

export type SuperDashboardContextPattern = {
  id: "sleep_focus" | "stress_focus" | "screen_focus";
  label: string;
  pairedDays: number;
  higherDays: number;
  lowerDays: number;
  higherFocusMinutes: number | null;
  lowerFocusMinutes: number | null;
  isReliable: boolean;
};

export type SuperDashboardSummary = {
  range: SuperDashboardRange;
  activity: {
    categories: SuperDashboardActivity[];
    reportedMinutes: number;
    minimumUntrackedMinutes: number;
    recordCount: number;
    note: string;
  };
  missions: {
    completed: number;
    activeDays: number;
    focusedMinutes: number;
    averageSessionMinutes: number | null;
    medianSessionMinutes: number | null;
    totalPower: number;
    baseXp: number;
    goldEarned: number;
    powerPerFocusedHour: number | null;
    topSubject: string | null;
    topCategory: string | null;
    mostActiveCompletionWindow: string | null;
  };
  recovery: {
    averageLoggedStress: SuperDashboardMetric;
    averageReflectionStress: SuperDashboardMetric;
    peakLoggedStress: number | null;
    stressorCount: number;
    recoveryActions: number;
    averageSleepMinutes: SuperDashboardMetric;
    averageSleepScore: SuperDashboardMetric;
    sleepQuality: SuperDashboardMetric;
    restedFeeling: SuperDashboardMetric;
    totalNapMinutes: number;
    averageScreenMinutes: SuperDashboardMetric;
    screenRecordDays: number;
    commonScreenLabel: string | null;
    typicalRecentSleep: {
      medianMinutes: number | null;
      loggedNights: number;
      requiredNights: number;
      windowDays: number;
    };
  };
  focus: {
    disruptions: number;
    disruptionsPerFocusedHour: number | null;
    topDistraction: string | null;
    mostInterruptedWindow: string | null;
    loggedInterruptionRate: {
      value: number | null;
      matchedLogs: number;
      focusedMinutes: number;
      completedMissions: number;
      activeDays: number;
      sufficientData: boolean;
    };
  };
  emotions: {
    focus: SuperDashboardMetric;
    motivation: SuperDashboardMetric;
    clarity: SuperDashboardMetric;
    energy: SuperDashboardMetric;
    distraction: SuperDashboardMetric;
    friction: SuperDashboardMetric;
  };
  supportingProgress: {
    revisionActions: number;
    maturedRevisionActions: number;
    journalPoints: number;
    journalEntries: number;
    successRatio: number | null;
    principleChecked: number;
    principleApplicable: number;
    principleRecordedDays: number;
    characterFormsEarned: number;
  };
  patterns: SuperDashboardContextPattern[];
  evidence: {
    recordedDays: number;
    completionRecords: number;
    recoveryRecords: number;
    reflectionRecords: number;
    note: string;
  };
};

const MINUTES_PER_DAY = 24 * 60;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function isIsoDay(value: string | undefined | null): value is string {
  if (!value || !ISO_DAY.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function addDays(localDate: string, amount: number): string {
  const date = new Date(`${localDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function inclusiveDayCount(startDate: string, endDate: string): number {
  if (!isIsoDay(startDate) || !isIsoDay(endDate) || endDate < startDate) return 0;
  return Math.floor((Date.parse(`${endDate}T12:00:00.000Z`) - Date.parse(`${startDate}T12:00:00.000Z`)) / 86_400_000) + 1;
}

function localToday(timezone: string, now: Date): string {
  return toLocalDate(now.toISOString(), timezone);
}

function rangeLabel(kind: SuperDashboardRangeKind): string {
  if (kind === "today") return "TODAY";
  if (kind === "week") return "LAST 7 DAYS";
  if (kind === "month") return "THIS MONTH";
  if (kind === "lifetime") return "LIFETIME";
  return "CUSTOM RANGE";
}

function dateInRange(localDate: string, range: SuperDashboardRange): boolean {
  return range.valid && localDate >= range.startDate && localDate <= range.endDate;
}

function safeLocalDate(iso: string | undefined | null, timezone: string): string | null {
  if (!iso || !Number.isFinite(Date.parse(iso))) return null;
  return toLocalDate(iso, timezone);
}

function average(values: Array<number | null | undefined>): SuperDashboardMetric {
  const observed = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return {
    value: observed.length ? Number((observed.reduce((sum, value) => sum + value, 0) / observed.length).toFixed(1)) : null,
    observations: observed.length,
  };
}

function median(values: number[]): number | null {
  const sorted = values.filter(Number.isFinite).slice().sort((left, right) => left - right);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  const result = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  return Number(result.toFixed(1));
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function localHour(iso: string, timezone: string): number | null {
  if (!Number.isFinite(Date.parse(iso))) return null;
  const hour = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "2-digit", hour12: false })
    .formatToParts(new Date(iso))
    .find((part) => part.type === "hour")?.value;
  const parsed = Number(hour);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 23 ? parsed : null;
}

function hourWindow(hour: number): string {
  const label = (value: number) => {
    const normalized = ((value % 24) + 24) % 24;
    return `${normalized % 12 || 12} ${normalized >= 12 ? "PM" : "AM"}`;
  };
  return `${label(hour)} – ${label(hour + 1)}`;
}

function increment(map: Map<string, number>, key: string, amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) return;
  map.set(key, (map.get(key) ?? 0) + amount);
}

function bestLabel(map: Map<string, number>): string | null {
  return Array.from(map.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] ?? null;
}

/** A daily manual total is a snapshot, so an edited/latest entry replaces an earlier same-day entry. */
function latestDailyRecords<T extends { localDate: string; updatedAt?: string; createdAt?: string; id: string }>(records: readonly T[]): T[] {
  const latestByDay = new Map<string, T>();
  for (const record of records) {
    const existing = latestByDay.get(record.localDate);
    const stamp = record.updatedAt ?? record.createdAt ?? "";
    const existingStamp = existing?.updatedAt ?? existing?.createdAt ?? "";
    if (!existing || stamp > existingStamp || (stamp === existingStamp && record.id > existing.id)) latestByDay.set(record.localDate, record);
  }
  return Array.from(latestByDay.values());
}

function contextualPattern(
  id: SuperDashboardContextPattern["id"],
  label: string,
  valuesByDay: Map<string, number>,
  focusedMinutesByDay: Map<string, number>,
): SuperDashboardContextPattern | null {
  const paired = Array.from(valuesByDay.entries())
    .flatMap(([localDate, value]) => {
      const focusedMinutes = focusedMinutesByDay.get(localDate);
      return typeof focusedMinutes === "number" && focusedMinutes > 0 && Number.isFinite(value)
        ? [{ value, focusedMinutes }]
        : [];
    });
  if (!paired.length) return null;
  const dividingValue = median(paired.map((entry) => entry.value));
  if (dividingValue === null) return null;
  const lower = paired.filter((entry) => entry.value < dividingValue);
  const higher = paired.filter((entry) => entry.value >= dividingValue);
  const isReliable = paired.length >= 14 && lower.length >= 7 && higher.length >= 7;
  return {
    id,
    label,
    pairedDays: paired.length,
    higherDays: higher.length,
    lowerDays: lower.length,
    higherFocusMinutes: higher.length ? Math.round(sum(higher.map((entry) => entry.focusedMinutes)) / higher.length) : null,
    lowerFocusMinutes: lower.length ? Math.round(sum(lower.map((entry) => entry.focusedMinutes)) / lower.length) : null,
    isReliable,
  };
}

function typicalRecentSleep(selectedSleep: Array<{ localDate: string; durationMinutes: number }>, rangeEndDate: string) {
  const windowStart = addDays(rangeEndDate, -6);
  const values = selectedSleep
    .filter((record) => record.localDate >= windowStart && record.localDate <= rangeEndDate)
    .map((record) => Math.max(0, record.durationMinutes));
  return {
    medianMinutes: values.length >= 5 ? median(values) : null,
    loggedNights: values.length,
    requiredNights: 5,
    windowDays: 7,
  };
}

function calculateLoggedInterruptionRate(completions: readonly MissionCompletionRecord[], distractionLogs: SuperDashboardState["distractionLogs"], timezone: string) {
  const completionByMission = new Map<string, Array<{ start: number; end: number }>>();
  completions.forEach((completion) => {
    const end = Date.parse(completion.completedAt);
    const durationMs = Math.max(0, completion.durationMs);
    if (!Number.isFinite(end) || durationMs <= 0) return;
    const intervals = completionByMission.get(completion.missionId) ?? [];
    intervals.push({ start: end - durationMs, end });
    completionByMission.set(completion.missionId, intervals);
  });
  let matchedLogs = 0;
  distractionLogs.forEach((entry) => {
    const occurredAt = Date.parse(entry.occurredAt);
    if (!Number.isFinite(occurredAt)) return;
    const intervals = completionByMission.get(entry.missionId) ?? [];
    if (intervals.some((interval) => occurredAt >= interval.start && occurredAt <= interval.end)) matchedLogs += 1;
  });
  const focusedMinutes = Math.round(completions.reduce((total, completion) => total + Math.max(0, completion.durationMs) / 60_000, 0));
  const activeDays = new Set(completions.map((completion) => safeLocalDate(completion.completedAt, timezone)).filter(Boolean)).size;
  const value = focusedMinutes > 0 ? Number((matchedLogs / (focusedMinutes / 60)).toFixed(1)) : null;
  return {
    value,
    matchedLogs,
    focusedMinutes,
    completedMissions: completions.length,
    activeDays,
    sufficientData: completions.length >= 10 && activeDays >= 5 && focusedMinutes >= 300,
  };
}

function earliestRecordedDay(state: SuperDashboardState, completionRecords: readonly MissionCompletionRecord[], timezone: string, today: string): string {
  const candidates: string[] = [];
  const includeLocal = (day: string | undefined | null) => { if (isIsoDay(day) && day <= today) candidates.push(day); };
  const includeTimestamp = (timestamp: string | undefined | null) => {
    const localDate = safeLocalDate(timestamp, timezone);
    if (localDate && localDate <= today) candidates.push(localDate);
  };
  completionRecords.forEach((record) => includeTimestamp(record.completedAt));
  state.progression.forEach((record) => includeTimestamp(record.occurredAt));
  state.reflections.forEach((record) => includeTimestamp(record.createdAt));
  state.journals.forEach((record) => includeLocal(record.localDate));
  state.srsActivityLog.forEach((record) => includeLocal(record.actionDate));
  state.corePrincipleDailyCheckIns.forEach((record) => includeLocal(record.localDate));
  (state.recoveryStressors ?? []).forEach((record) => includeLocal(record.localDate));
  (state.recoveryActions ?? []).forEach((record) => includeLocal(record.localDate));
  (state.sleepLogs ?? []).forEach((record) => includeLocal(record.localDate));
  (state.napLogs ?? []).forEach((record) => includeLocal(record.localDate));
  (state.screenTimeLogs ?? []).forEach((record) => includeLocal(record.localDate));
  return candidates.sort()[0] ?? today;
}

export function getSuperDashboardRange(
  state: Pick<FocusState, "profile">,
  kind: SuperDashboardRangeKind,
  customStart = "",
  customEnd = "",
  earliestDate?: string,
  now = new Date(),
): SuperDashboardRange {
  const today = localToday(state.profile.timezone, now);
  let startDate = today;
  let endDate = today;
  let valid = true;
  if (kind === "week") startDate = addDays(today, -6);
  if (kind === "month") startDate = `${today.slice(0, 8)}01`;
  if (kind === "lifetime") startDate = isIsoDay(earliestDate) ? earliestDate : today;
  if (kind === "custom") {
    startDate = customStart.trim();
    endDate = customEnd.trim();
    valid = isIsoDay(startDate) && isIsoDay(endDate) && startDate <= endDate;
  }
  const calendarDays = valid ? inclusiveDayCount(startDate, endDate) : 0;
  return {
    kind,
    startDate,
    endDate,
    label: rangeLabel(kind),
    valid,
    calendarDays,
    calendarCapacityMinutes: calendarDays * MINUTES_PER_DAY,
  };
}

/**
 * Builds a read-only local summary. Duration-only sleep and screen-time records do not
 * contain exact event intervals, so the activity ledger never claims an exact 24-hour
 * allocation. It reports a mathematically safe minimum untracked time instead.
 */
export function getSuperDashboardSummary(
  state: SuperDashboardState,
  kind: SuperDashboardRangeKind = "week",
  customStart = "",
  customEnd = "",
  now = new Date(),
): SuperDashboardSummary {
  const timezone = state.profile.timezone;
  const completionRecords = getMissionCompletionRecords(state);
  const today = localToday(timezone, now);
  const earliest = earliestRecordedDay(state, completionRecords, timezone, today);
  const range = getSuperDashboardRange(state, kind, customStart, customEnd, earliest, now);
  const emptyMetric: SuperDashboardMetric = { value: null, observations: 0 };
  if (!range.valid) {
    return {
      range,
      activity: { categories: [], reportedMinutes: 0, minimumUntrackedMinutes: 0, recordCount: 0, note: "Enter valid inclusive YYYY-MM-DD dates to calculate this private dashboard." },
      missions: { completed: 0, activeDays: 0, focusedMinutes: 0, averageSessionMinutes: null, medianSessionMinutes: null, totalPower: 0, baseXp: 0, goldEarned: 0, powerPerFocusedHour: null, topSubject: null, topCategory: null, mostActiveCompletionWindow: null },
      recovery: { averageLoggedStress: emptyMetric, averageReflectionStress: emptyMetric, peakLoggedStress: null, stressorCount: 0, recoveryActions: 0, averageSleepMinutes: emptyMetric, averageSleepScore: emptyMetric, sleepQuality: emptyMetric, restedFeeling: emptyMetric, totalNapMinutes: 0, averageScreenMinutes: emptyMetric, screenRecordDays: 0, commonScreenLabel: null, typicalRecentSleep: { medianMinutes: null, loggedNights: 0, requiredNights: 5, windowDays: 7 } },
      focus: { disruptions: 0, disruptionsPerFocusedHour: null, topDistraction: null, mostInterruptedWindow: null, loggedInterruptionRate: { value: null, matchedLogs: 0, focusedMinutes: 0, completedMissions: 0, activeDays: 0, sufficientData: false } },
      emotions: { focus: emptyMetric, motivation: emptyMetric, clarity: emptyMetric, energy: emptyMetric, distraction: emptyMetric, friction: emptyMetric },
      supportingProgress: { revisionActions: 0, maturedRevisionActions: 0, journalPoints: 0, journalEntries: 0, successRatio: null, principleChecked: 0, principleApplicable: 0, principleRecordedDays: 0, characterFormsEarned: 0 },
      patterns: [],
      evidence: { recordedDays: 0, completionRecords: 0, recoveryRecords: 0, reflectionRecords: 0, note: "No calculation is run until the date range is valid." },
    };
  }

  const selectedCompletions = completionRecords.filter((record) => {
    const localDate = safeLocalDate(record.completedAt, timezone);
    return localDate ? dateInRange(localDate, range) : false;
  });
  const selectedReflections = state.reflections.filter((record) => {
    const localDate = safeLocalDate(record.createdAt, timezone);
    return localDate ? dateInRange(localDate, range) : false;
  });
  const selectedStressors = (state.recoveryStressors ?? []).filter((record) => dateInRange(record.localDate, range));
  const selectedActions = (state.recoveryActions ?? []).filter((record) => dateInRange(record.localDate, range));
  const selectedSleep = latestDailyRecords((state.sleepLogs ?? []).filter((record) => dateInRange(record.localDate, range)));
  const selectedNaps = (state.napLogs ?? []).filter((record) => dateInRange(record.localDate, range));
  const selectedScreen = latestDailyRecords((state.screenTimeLogs ?? []).filter((record) => dateInRange(record.localDate, range)));

  const missionMinutesByCategory = new Map<string, number>();
  const missionMinutesBySubject = new Map<string, number>();
  const focusedMinutesByDay = new Map<string, number>();
  const completionHours = new Map<string, number>();
  let focusedMinutes = 0;
  let totalPower = 0;
  let baseXp = 0;
  let goldEarned = 0;
  selectedCompletions.forEach((record) => {
    const minutes = Math.max(0, record.durationMs) / 60_000;
    focusedMinutes += minutes;
    increment(missionMinutesByCategory, record.category.trim() || "Focus", minutes);
    increment(missionMinutesBySubject, record.subject.trim() || "Unassigned", minutes);
    const localDate = safeLocalDate(record.completedAt, timezone);
    if (localDate) increment(focusedMinutesByDay, localDate, minutes);
    const hour = localHour(record.completedAt, timezone);
    if (hour !== null) increment(completionHours, String(hour), 1);
    totalPower += Math.max(0, record.progression?.powerAwarded ?? 0);
    baseXp += Math.max(0, record.progression?.baseXp ?? record.baseXp ?? 0);
    goldEarned += Math.max(0, record.progression?.goldAwarded ?? 0);
  });

  const activitySeed: Array<Omit<SuperDashboardActivity, "shareOfReportedActivity">> = Array.from(missionMinutesByCategory.entries()).map(([label, minutes]) => ({ id: `mission:${label}`, label: `Focus · ${label}`, minutes, records: selectedCompletions.filter((record) => (record.category.trim() || "Focus") === label).length, source: "mission" as const }));
  if (selectedSleep.length) activitySeed.push({ id: "sleep", label: "Sleep", minutes: selectedSleep.reduce((sum, record) => sum + Math.max(0, record.durationMinutes), 0), records: selectedSleep.length, source: "sleep" });
  if (selectedNaps.length) activitySeed.push({ id: "nap", label: "Naps", minutes: selectedNaps.reduce((sum, record) => sum + Math.max(0, record.durationMinutes), 0), records: selectedNaps.length, source: "nap" });
  if (selectedScreen.length) activitySeed.push({ id: "screen", label: "Screen time", minutes: selectedScreen.reduce((sum, record) => sum + Math.max(0, record.totalMinutes), 0), records: selectedScreen.length, source: "screen" });
  const reportedMinutes = activitySeed.reduce((sum, category) => sum + category.minutes, 0);
  const categories = activitySeed
    .filter((category) => category.minutes > 0)
    .map((category) => ({ ...category, shareOfReportedActivity: reportedMinutes ? category.minutes / reportedMinutes : 0 }))
    .sort((left, right) => right.minutes - left.minutes || left.label.localeCompare(right.label));

  const sleepScores = selectedSleep.map((record) => getPersonalSleepScore(record).score);
  const screenLabels = new Map<string, number>();
  selectedScreen.forEach((record) => { const label = record.primaryLabel.trim(); if (label) increment(screenLabels, label, 1); });
  const dailyStress = new Map<string, number[]>();
  selectedStressors.forEach((record) => {
    const values = dailyStress.get(record.localDate) ?? [];
    values.push(record.intensity);
    dailyStress.set(record.localDate, values);
  });
  const dailySleep = new Map(selectedSleep.map((record) => [record.localDate, record.durationMinutes]));
  const dailyScreen = new Map(selectedScreen.map((record) => [record.localDate, record.totalMinutes]));
  const recentSleep = typicalRecentSleep(selectedSleep, range.endDate);

  const friction = getFocusFrictionInsight(state as FocusState, now, { kind: "custom", startDate: range.startDate, endDate: range.endDate });
  const loggedInterruptionRate = calculateLoggedInterruptionRate(selectedCompletions, state.distractionLogs, timezone);
  const coreCheckIns = getCorePrinciplesCheckInsInRange(state.corePrincipleDailyCheckIns, { kind: "custom", startDate: range.startDate, endDate: range.endDate }, timezone, now);
  const principles = getCorePrinciplesSummary(coreCheckIns);
  const revisionActions = state.srsActivityLog.filter((record) => dateInRange(record.actionDate, range));
  const journals = state.journals.filter((record) => dateInRange(record.localDate, range));
  const characterFormsEarned = state.characterMilestones.filter((record) => {
    const localDate = safeLocalDate(record.achievedAt, timezone);
    return localDate ? dateInRange(localDate, range) : false;
  }).length;

  const recordedDays = new Set<string>();
  selectedCompletions.forEach((record) => { const day = safeLocalDate(record.completedAt, timezone); if (day) recordedDays.add(day); });
  selectedReflections.forEach((record) => { const day = safeLocalDate(record.createdAt, timezone); if (day) recordedDays.add(day); });
  [...selectedStressors, ...selectedActions, ...selectedSleep, ...selectedNaps, ...selectedScreen, ...journals, ...revisionActions, ...coreCheckIns].forEach((record) => recordedDays.add("localDate" in record ? record.localDate : record.actionDate));

  const patterns = [
    contextualPattern("sleep_focus", "Sleep and focus context", dailySleep, focusedMinutesByDay),
    contextualPattern("stress_focus", "Stress and focus context", new Map(Array.from(dailyStress.entries()).map(([day, values]) => [day, values.reduce((sum, value) => sum + value, 0) / values.length])), focusedMinutesByDay),
    contextualPattern("screen_focus", "Screen time and focus context", dailyScreen, focusedMinutesByDay),
  ].filter((pattern): pattern is SuperDashboardContextPattern => Boolean(pattern));

  const emotionMetric = (key: keyof Pick<Reflection, "focusQuality" | "motivationLevel" | "clarityLevel" | "energyAfter" | "distractionLevel" | "frictionRating">) => average(selectedReflections.map((record) => record[key]));
  const completionDurations = selectedCompletions.map((record) => Math.max(0, record.durationMs) / 60_000);

  return {
    range,
    activity: {
      categories,
      reportedMinutes: Math.round(reportedMinutes),
      minimumUntrackedMinutes: Math.max(0, range.calendarCapacityMinutes - Math.round(reportedMinutes)),
      recordCount: activitySeed.reduce((sum, category) => sum + category.records, 0),
      note: "Recorded activity totals may overlap because manual sleep and screen-time reports do not always include exact intervals. The untracked figure is therefore a safe minimum, not an exact 24-hour allocation.",
    },
    missions: {
      completed: selectedCompletions.length,
      activeDays: new Set(selectedCompletions.map((record) => safeLocalDate(record.completedAt, timezone)).filter(Boolean)).size,
      focusedMinutes: Math.round(focusedMinutes),
      averageSessionMinutes: average(completionDurations).value,
      medianSessionMinutes: median(completionDurations),
      totalPower: Math.round(totalPower),
      baseXp: Math.round(baseXp),
      goldEarned: Math.round(goldEarned),
      powerPerFocusedHour: focusedMinutes > 0 ? Number((totalPower / (focusedMinutes / 60)).toFixed(1)) : null,
      topSubject: bestLabel(missionMinutesBySubject),
      topCategory: bestLabel(missionMinutesByCategory),
      mostActiveCompletionWindow: (() => { const hour = bestLabel(completionHours); return hour === null ? null : hourWindow(Number(hour)); })(),
    },
    recovery: {
      averageLoggedStress: average(selectedStressors.map((record) => record.intensity)),
      averageReflectionStress: average(selectedReflections.map((record) => record.stressLevel)),
      peakLoggedStress: selectedStressors.length ? Math.max(...selectedStressors.map((record) => record.intensity)) : null,
      stressorCount: selectedStressors.length,
      recoveryActions: selectedActions.length,
      averageSleepMinutes: average(selectedSleep.map((record) => record.durationMinutes)),
      averageSleepScore: average(sleepScores),
      sleepQuality: average(selectedSleep.map((record) => record.quality)),
      restedFeeling: average(selectedSleep.map((record) => record.restedRating)),
      totalNapMinutes: selectedNaps.reduce((sum, record) => sum + Math.max(0, record.durationMinutes), 0),
      averageScreenMinutes: average(selectedScreen.map((record) => record.totalMinutes)),
      screenRecordDays: new Set(selectedScreen.map((record) => record.localDate)).size,
      commonScreenLabel: bestLabel(screenLabels),
      typicalRecentSleep: recentSleep,
    },
    focus: {
      disruptions: friction.total,
      disruptionsPerFocusedHour: focusedMinutes > 0 ? Number((friction.total / (focusedMinutes / 60)).toFixed(1)) : null,
      topDistraction: friction.topCategory?.label ?? null,
      mostInterruptedWindow: friction.timeWindow,
      loggedInterruptionRate,
    },
    emotions: {
      focus: emotionMetric("focusQuality"),
      motivation: emotionMetric("motivationLevel"),
      clarity: emotionMetric("clarityLevel"),
      energy: emotionMetric("energyAfter"),
      distraction: emotionMetric("distractionLevel"),
      friction: emotionMetric("frictionRating"),
    },
    supportingProgress: {
      revisionActions: revisionActions.length,
      maturedRevisionActions: revisionActions.filter((record) => record.phase === "matured").length,
      journalPoints: journals.reduce((sum, record) => sum + record.points, 0),
      journalEntries: journals.length,
      successRatio: principles.successRatio,
      principleChecked: principles.checked,
      principleApplicable: principles.applicable,
      principleRecordedDays: principles.recordedDays,
      characterFormsEarned,
    },
    patterns,
    evidence: {
      recordedDays: recordedDays.size,
      completionRecords: selectedCompletions.length,
      recoveryRecords: selectedStressors.length + selectedActions.length + selectedSleep.length + selectedNaps.length + selectedScreen.length,
      reflectionRecords: selectedReflections.length,
      note: "Every result is calculated on-device from the selected local-date range. A missing record remains missing and is never converted into zero.",
    },
  };
}

export function formatSuperDashboardMinutes(totalMinutes: number | null): string {
  if (totalMinutes === null || !Number.isFinite(totalMinutes)) return "—";
  const rounded = Math.max(0, Math.round(totalMinutes));
  return `${Math.floor(rounded / 60)}h ${rounded % 60}m`;
}
