import { getCalendarCompletionSummary } from "./calendar-activity";
import { toLocalDate, type FocusState } from "./focus-command";
import {
  getSuperDashboardSummary,
  type SuperDashboardRange,
  type SuperDashboardRangeKind,
  type SuperDashboardState,
  type SuperDashboardSummary,
} from "./super-dashboard";

export type SuperDashboardComparisonPreset = "yesterday" | "week" | "month" | "custom";
export type SuperDashboardComparisonFormat = "count" | "minutes" | "percentage" | "rating" | "number" | "text" | "boolean";
export type ComparisonCell = number | string | boolean | null;

export interface SuperDashboardComparisonRow {
  id: string;
  section: string;
  label: string;
  current: ComparisonCell;
  previous: ComparisonCell;
  delta: number | null;
  format: SuperDashboardComparisonFormat;
}

export interface SuperDashboardComparison {
  valid: boolean;
  preset: SuperDashboardComparisonPreset;
  currentRange: SuperDashboardRange;
  previousRange: SuperDashboardRange;
  currentCalendar: ReturnType<typeof getCalendarCompletionSummary>;
  previousCalendar: ReturnType<typeof getCalendarCompletionSummary>;
  rows: SuperDashboardComparisonRow[];
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00.000Z`));
}

function addDays(localDate: string, amount: number): string {
  const date = new Date(`${localDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function rangeForDates(state: Pick<FocusState, "profile">, startDate: string, endDate: string): SuperDashboardRange {
  const valid = isIsoDate(startDate) && isIsoDate(endDate) && startDate <= endDate;
  const calendarDays = valid ? Math.floor((Date.parse(`${endDate}T12:00:00.000Z`) - Date.parse(`${startDate}T12:00:00.000Z`)) / 86_400_000) + 1 : 0;
  return {
    kind: "custom",
    startDate,
    endDate,
    label: "COMPARISON PERIOD",
    valid,
    calendarDays,
    calendarCapacityMinutes: calendarDays * 24 * 60,
  };
}

function addRow(
  rows: SuperDashboardComparisonRow[],
  section: string,
  id: string,
  label: string,
  current: ComparisonCell,
  previous: ComparisonCell,
  format: SuperDashboardComparisonFormat,
): void {
  const currentNumber = typeof current === "number" && Number.isFinite(current) ? current : null;
  const previousNumber = typeof previous === "number" && Number.isFinite(previous) ? previous : null;
  rows.push({ id, section, label, current, previous, delta: currentNumber !== null && previousNumber !== null ? Number((currentNumber - previousNumber).toFixed(2)) : null, format });
}

function addMetric(rows: SuperDashboardComparisonRow[], section: string, id: string, label: string, current: { value: number | null }, previous: { value: number | null }, format: SuperDashboardComparisonFormat): void {
  addRow(rows, section, id, label, current.value, previous.value, format);
}

function addSummaryRows(rows: SuperDashboardComparisonRow[], current: SuperDashboardSummary, previous: SuperDashboardSummary): void {
  addRow(rows, "Activity", "activity.reportedMinutes", "Reported activity", current.activity.reportedMinutes, previous.activity.reportedMinutes, "minutes");
  addRow(rows, "Activity", "activity.minimumUntrackedMinutes", "Minimum untracked time", current.activity.minimumUntrackedMinutes, previous.activity.minimumUntrackedMinutes, "minutes");
  addRow(rows, "Activity", "activity.recordCount", "Activity records", current.activity.recordCount, previous.activity.recordCount, "count");
  const categories = new Map<string, { current: (typeof current.activity.categories)[number] | undefined; previous: (typeof previous.activity.categories)[number] | undefined }>();
  [...current.activity.categories, ...previous.activity.categories].forEach((category) => {
    const existing = categories.get(category.id) ?? { current: undefined, previous: undefined };
    if (current.activity.categories.some((item) => item.id === category.id)) existing.current = current.activity.categories.find((item) => item.id === category.id);
    if (previous.activity.categories.some((item) => item.id === category.id)) existing.previous = previous.activity.categories.find((item) => item.id === category.id);
    categories.set(category.id, existing);
  });
  categories.forEach((category, id) => {
    const label = category.current?.label ?? category.previous?.label ?? id;
    addRow(rows, "Activity categories", `${id}.minutes`, `${label} time`, category.current?.minutes ?? 0, category.previous?.minutes ?? 0, "minutes");
    addRow(rows, "Activity categories", `${id}.share`, `${label} share`, category.current?.shareOfReportedActivity ?? 0, category.previous?.shareOfReportedActivity ?? 0, "percentage");
  });

  addRow(rows, "Mission progress", "missions.completed", "Completed missions", current.missions.completed, previous.missions.completed, "count");
  addRow(rows, "Mission progress", "missions.activeDays", "Active days", current.missions.activeDays, previous.missions.activeDays, "count");
  addRow(rows, "Mission progress", "missions.focusedMinutes", "Focused time", current.missions.focusedMinutes, previous.missions.focusedMinutes, "minutes");
  addRow(rows, "Mission progress", "missions.averageSessionMinutes", "Average session", current.missions.averageSessionMinutes, previous.missions.averageSessionMinutes, "minutes");
  addRow(rows, "Mission progress", "missions.medianSessionMinutes", "Session median", current.missions.medianSessionMinutes, previous.missions.medianSessionMinutes, "minutes");
  addRow(rows, "Mission progress", "missions.totalPower", "Total Power", current.missions.totalPower, previous.missions.totalPower, "count");
  addRow(rows, "Mission progress", "missions.baseXp", "Base XP", current.missions.baseXp, previous.missions.baseXp, "count");
  addRow(rows, "Mission progress", "missions.goldEarned", "Gold earned", current.missions.goldEarned, previous.missions.goldEarned, "count");
  addRow(rows, "Mission progress", "missions.powerPerFocusedHour", "Power per focused hour", current.missions.powerPerFocusedHour, previous.missions.powerPerFocusedHour, "number");
  addRow(rows, "Mission progress", "missions.topSubject", "Top subject", current.missions.topSubject, previous.missions.topSubject, "text");
  addRow(rows, "Mission progress", "missions.topCategory", "Top category", current.missions.topCategory, previous.missions.topCategory, "text");
  addRow(rows, "Mission progress", "missions.mostActiveCompletionWindow", "Most active completion window", current.missions.mostActiveCompletionWindow, previous.missions.mostActiveCompletionWindow, "text");

  addMetric(rows, "Recovery & rhythm", "recovery.averageLoggedStress", "Current logged stress", current.recovery.averageLoggedStress, previous.recovery.averageLoggedStress, "rating");
  addMetric(rows, "Recovery & rhythm", "recovery.averageLoggedStressBefore", "Before logged stress", current.recovery.averageLoggedStressBefore, previous.recovery.averageLoggedStressBefore, "rating");
  addMetric(rows, "Recovery & rhythm", "recovery.averageReflectionStress", "Mission stress", current.recovery.averageReflectionStress, previous.recovery.averageReflectionStress, "rating");
  addRow(rows, "Recovery & rhythm", "recovery.peakLoggedStress", "Peak logged stress", current.recovery.peakLoggedStress, previous.recovery.peakLoggedStress, "rating");
  addRow(rows, "Recovery & rhythm", "recovery.stressorCount", "Stressors", current.recovery.stressorCount, previous.recovery.stressorCount, "count");
  addRow(rows, "Recovery & rhythm", "recovery.recoveryActions", "Recovery actions", current.recovery.recoveryActions, previous.recovery.recoveryActions, "count");
  addMetric(rows, "Recovery & rhythm", "recovery.averageSleepMinutes", "Average sleep", current.recovery.averageSleepMinutes, previous.recovery.averageSleepMinutes, "minutes");
  addMetric(rows, "Recovery & rhythm", "recovery.averageSleepScore", "Sleep score", current.recovery.averageSleepScore, previous.recovery.averageSleepScore, "rating");
  addMetric(rows, "Recovery & rhythm", "recovery.sleepQuality", "Sleep quality", current.recovery.sleepQuality, previous.recovery.sleepQuality, "rating");
  addMetric(rows, "Recovery & rhythm", "recovery.restedFeeling", "Rested feeling", current.recovery.restedFeeling, previous.recovery.restedFeeling, "rating");
  addRow(rows, "Recovery & rhythm", "recovery.totalNapMinutes", "Nap time", current.recovery.totalNapMinutes, previous.recovery.totalNapMinutes, "minutes");
  addMetric(rows, "Recovery & rhythm", "recovery.averageScreenMinutes", "Average screen time", current.recovery.averageScreenMinutes, previous.recovery.averageScreenMinutes, "minutes");
  addRow(rows, "Recovery & rhythm", "recovery.screenRecordDays", "Screen-time days", current.recovery.screenRecordDays, previous.recovery.screenRecordDays, "count");
  addRow(rows, "Recovery & rhythm", "recovery.commonScreenLabel", "Common screen label", current.recovery.commonScreenLabel, previous.recovery.commonScreenLabel, "text");
  addRow(rows, "Recovery & rhythm", "recovery.typicalRecentSleep.medianMinutes", "Recent sleep median", current.recovery.typicalRecentSleep.medianMinutes, previous.recovery.typicalRecentSleep.medianMinutes, "minutes");
  addRow(rows, "Illness context", "recovery.illnessContext.recordCount", "Illness records", current.recovery.illnessContext.recordCount, previous.recovery.illnessContext.recordCount, "count");
  addRow(rows, "Illness context", "recovery.illnessContext.contextDays", "Illness context days", current.recovery.illnessContext.contextDays, previous.recovery.illnessContext.contextDays, "count");
  addRow(rows, "Illness context", "recovery.illnessContext.debriefDays", "Debrief context days", current.recovery.illnessContext.debriefDays, previous.recovery.illnessContext.debriefDays, "count");
  addRow(rows, "Illness context", "recovery.illnessContext.ongoingRecords", "Ongoing records", current.recovery.illnessContext.ongoingRecords, previous.recovery.illnessContext.ongoingRecords, "count");
  addRow(rows, "Illness context", "recovery.illnessContext.fatigueRecords", "Fatigue records", current.recovery.illnessContext.fatigueRecords, previous.recovery.illnessContext.fatigueRecords, "count");
  addRow(rows, "Illness context", "recovery.illnessContext.sleepDisruptedRecords", "Sleep-disrupted records", current.recovery.illnessContext.sleepDisruptedRecords, previous.recovery.illnessContext.sleepDisruptedRecords, "count");

  addRow(rows, "Focus & friction", "focus.disruptions", "Disruptions", current.focus.disruptions, previous.focus.disruptions, "count");
  addRow(rows, "Focus & friction", "focus.disruptionsPerFocusedHour", "Disruptions per focus hour", current.focus.disruptionsPerFocusedHour, previous.focus.disruptionsPerFocusedHour, "number");
  addRow(rows, "Focus & friction", "focus.topDistraction", "Top distraction", current.focus.topDistraction, previous.focus.topDistraction, "text");
  addRow(rows, "Focus & friction", "focus.mostInterruptedWindow", "Most interrupted window", current.focus.mostInterruptedWindow, previous.focus.mostInterruptedWindow, "text");
  addRow(rows, "Focus & friction", "focus.loggedInterruptionRate", "Logged interruption rate", current.focus.loggedInterruptionRate.value, previous.focus.loggedInterruptionRate.value, "number");
  addRow(rows, "Focus & friction", "focus.matchedLogs", "Matched interruption logs", current.focus.loggedInterruptionRate.matchedLogs, previous.focus.loggedInterruptionRate.matchedLogs, "count");
  addRow(rows, "Focus & friction", "focus.sufficientData", "Interruption rate sufficient data", current.focus.loggedInterruptionRate.sufficientData, previous.focus.loggedInterruptionRate.sufficientData, "boolean");

  (Object.keys(current.emotions) as Array<keyof SuperDashboardSummary["emotions"]>).forEach((key) => {
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    addMetric(rows, "Emotional mission signals", `emotions.${key}`, label, current.emotions[key], previous.emotions[key], "rating");
  });

  Object.entries(current.mistakes.counts).forEach(([status, value]) => {
    addRow(rows, "Mistakes Ledger", `mistakes.counts.${status}`, `${status.replace(/_/g, " ")} mistakes`, value, previous.mistakes.counts[status as keyof typeof previous.mistakes.counts], "count");
  });
  addRow(rows, "Mistakes Ledger", "mistakes.totalAtEnd", "Tracked at period end", current.mistakes.totalAtEnd, previous.mistakes.totalAtEnd, "count");
  addRow(rows, "Mistakes Ledger", "mistakes.createdInRange", "Created in period", current.mistakes.createdInRange, previous.mistakes.createdInRange, "count");
  addRow(rows, "Mistakes Ledger", "mistakes.statusUpdatesInRange", "Status updates", current.mistakes.statusUpdatesInRange, previous.mistakes.statusUpdatesInRange, "count");
  addRow(rows, "Mistakes Ledger", "mistakes.latestChanges", "Latest status changes", current.mistakes.latestChanges.length, previous.mistakes.latestChanges.length, "count");

  addRow(rows, "Habits, learning & character", "supportingProgress.revisionActions", "Revision actions", current.supportingProgress.revisionActions, previous.supportingProgress.revisionActions, "count");
  addRow(rows, "Habits, learning & character", "supportingProgress.maturedRevisionActions", "Matured revision actions", current.supportingProgress.maturedRevisionActions, previous.supportingProgress.maturedRevisionActions, "count");
  addRow(rows, "Habits, learning & character", "supportingProgress.journalPoints", "Journal points", current.supportingProgress.journalPoints, previous.supportingProgress.journalPoints, "count");
  addRow(rows, "Habits, learning & character", "supportingProgress.journalEntries", "Journal entries", current.supportingProgress.journalEntries, previous.supportingProgress.journalEntries, "count");
  addRow(rows, "Habits, learning & character", "supportingProgress.successRatio", "Core Principles success ratio", current.supportingProgress.successRatio, previous.supportingProgress.successRatio, "percentage");
  addRow(rows, "Habits, learning & character", "supportingProgress.principleChecked", "Principles checked", current.supportingProgress.principleChecked, previous.supportingProgress.principleChecked, "count");
  addRow(rows, "Habits, learning & character", "supportingProgress.principleApplicable", "Principles applicable", current.supportingProgress.principleApplicable, previous.supportingProgress.principleApplicable, "count");
  addRow(rows, "Habits, learning & character", "supportingProgress.principleRecordedDays", "Principle recorded days", current.supportingProgress.principleRecordedDays, previous.supportingProgress.principleRecordedDays, "count");
  addRow(rows, "Habits, learning & character", "supportingProgress.characterFormsEarned", "Character forms earned", current.supportingProgress.characterFormsEarned, previous.supportingProgress.characterFormsEarned, "count");

  const patternMap = new Map(current.patterns.map((pattern) => [pattern.id, pattern]));
  previous.patterns.forEach((pattern) => patternMap.set(pattern.id, patternMap.get(pattern.id) ?? pattern));
  patternMap.forEach((currentPattern, id) => {
    const previousPattern = previous.patterns.find((pattern) => pattern.id === id);
    addRow(rows, "Personal context patterns", `${id}.pairedDays`, `${currentPattern.label} matched days`, currentPattern.pairedDays, previousPattern?.pairedDays ?? 0, "count");
    addRow(rows, "Personal context patterns", `${id}.higherFocusMinutes`, `${currentPattern.label} higher-context focus`, currentPattern.higherFocusMinutes, previousPattern?.higherFocusMinutes ?? null, "minutes");
    addRow(rows, "Personal context patterns", `${id}.lowerFocusMinutes`, `${currentPattern.label} lower-context focus`, currentPattern.lowerFocusMinutes, previousPattern?.lowerFocusMinutes ?? null, "minutes");
    addRow(rows, "Personal context patterns", `${id}.reliable`, `${currentPattern.label} reliable`, currentPattern.isReliable, previousPattern?.isReliable ?? false, "boolean");
  });

  addRow(rows, "Evidence", "evidence.recordedDays", "Recorded days", current.evidence.recordedDays, previous.evidence.recordedDays, "count");
  addRow(rows, "Evidence", "evidence.completionRecords", "Completion records", current.evidence.completionRecords, previous.evidence.completionRecords, "count");
  addRow(rows, "Evidence", "evidence.recoveryRecords", "Recovery records", current.evidence.recoveryRecords, previous.evidence.recoveryRecords, "count");
  addRow(rows, "Evidence", "evidence.reflectionRecords", "Reflection records", current.evidence.reflectionRecords, previous.evidence.reflectionRecords, "count");
}

function comparisonPeriods(state: Pick<FocusState, "profile">, preset: SuperDashboardComparisonPreset, customCurrentStart: string, customCurrentEnd: string, customPreviousStart: string, customPreviousEnd: string, now: Date) {
  const today = toLocalDate(now.toISOString(), state.profile.timezone);
  if (preset === "custom") return { currentStart: customCurrentStart.trim(), currentEnd: customCurrentEnd.trim(), previousStart: customPreviousStart.trim(), previousEnd: customPreviousEnd.trim() };
  if (preset === "yesterday") return { currentStart: today, currentEnd: today, previousStart: addDays(today, -1), previousEnd: addDays(today, -1) };
  if (preset === "week") return { currentStart: addDays(today, -6), currentEnd: today, previousStart: addDays(today, -13), previousEnd: addDays(today, -7) };
  const currentStart = `${today.slice(0, 8)}01`;
  const previousEnd = addDays(currentStart, -1);
  return { currentStart, currentEnd: today, previousStart: `${previousEnd.slice(0, 8)}01`, previousEnd };
}

export function getSuperDashboardComparison(
  state: SuperDashboardState,
  preset: SuperDashboardComparisonPreset,
  customCurrentStart = "",
  customCurrentEnd = "",
  customPreviousStart = "",
  customPreviousEnd = "",
  now = new Date(),
): SuperDashboardComparison {
  const periods = comparisonPeriods(state, preset, customCurrentStart, customCurrentEnd, customPreviousStart, customPreviousEnd, now);
  const currentRange = rangeForDates(state, periods.currentStart, periods.currentEnd);
  const previousRange = rangeForDates(state, periods.previousStart, periods.previousEnd);
  const current = getSuperDashboardSummary(state, "custom", periods.currentStart, periods.currentEnd, now);
  const previous = getSuperDashboardSummary(state, "custom", periods.previousStart, periods.previousEnd, now);
  const currentCalendar = currentRange.valid ? getCalendarCompletionSummary(state.calendarActivities, currentRange.startDate, currentRange.endDate) : getCalendarCompletionSummary([], "", "");
  const previousCalendar = previousRange.valid ? getCalendarCompletionSummary(state.calendarActivities, previousRange.startDate, previousRange.endDate) : getCalendarCompletionSummary([], "", "");
  const rows: SuperDashboardComparisonRow[] = [];
  if (currentRange.valid && previousRange.valid) {
    addSummaryRows(rows, current, previous);
    addRow(rows, "Calendar activity", "calendar.planned", "Planned activities", currentCalendar.planned, previousCalendar.planned, "count");
    addRow(rows, "Calendar activity", "calendar.completed", "Completed activities", currentCalendar.completed, previousCalendar.completed, "count");
    addRow(rows, "Calendar activity", "calendar.pending", "Pending activities", currentCalendar.pending, previousCalendar.pending, "count");
    addRow(rows, "Calendar activity", "calendar.percentage", "Completion percentage", currentCalendar.percentage, previousCalendar.percentage, "percentage");
    addRow(rows, "Calendar activity", "calendar.daysWithPlans", "Days with plans", currentCalendar.daysWithPlans, previousCalendar.daysWithPlans, "count");
  }
  return { valid: currentRange.valid && previousRange.valid, preset, currentRange, previousRange, currentCalendar, previousCalendar, rows };
}

export function formatComparisonCell(value: ComparisonCell, format: SuperDashboardComparisonFormat): string {
  if (value === null || value === undefined || value === "") return "—";
  if (format === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    if (format === "minutes") return `${Math.floor(Math.max(0, Math.round(value)) / 60)}h ${Math.max(0, Math.round(value)) % 60}m`;
    if (format === "percentage") return `${Math.round(value * (value <= 1 ? 100 : 1))}%`;
    if (format === "rating") return Number.isInteger(value) ? String(value) : value.toFixed(1);
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
  return String(value);
}

export function formatComparisonDelta(delta: number | null, format: SuperDashboardComparisonFormat): string {
  if (delta === null) return "—";
  const sign = delta > 0 ? "+" : "";
  if (format === "minutes") return `${sign}${Math.round(delta)}m`;
  if (format === "percentage") return `${sign}${Math.round(delta * (Math.abs(delta) <= 1 ? 100 : 1))} pts`;
  return `${sign}${Number.isInteger(delta) ? delta : delta.toFixed(1)}`;
}

export type { SuperDashboardRangeKind };
