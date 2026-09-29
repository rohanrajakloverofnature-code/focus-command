import {
  DashboardChartType,
  DashboardComparisonRange,
  DashboardDateRange,
  DashboardFeatureFilter,
  DashboardMetricId,
  DashboardWidgetConfig,
  FocusState,
  Mission,
  Reflection,
  getMissionCompletionRecords,
  toLocalDate,
} from "./focus-command";

type DashboardWorkspaceState = Pick<FocusState, "profile" | "missions" | "missionCompletions" | "progression" | "reflections" | "journals" | "transactions" | "srsTopics" | "calendarActivities" | "recoveryStressors" | "recoveryActions" | "sleepLogs" | "napLogs" | "screenTimeLogs" | "corePrincipleDailyCheckIns" | "mistakeLedgerEntries" | "distractionLogs" | "shadowGateEntries" | "bosses">;

export interface DashboardWorkspacePoint {
  label: string;
  value: number;
  color?: string;
}

export interface DashboardWorkspaceComparison {
  points: DashboardWorkspacePoint[];
  breakdown: DashboardWorkspacePoint[];
  total: number;
  average: number;
  sampleCount: number;
  rangeLabel: string;
}

export interface DashboardWorkspaceResult {
  points: DashboardWorkspacePoint[];
  breakdown: DashboardWorkspacePoint[];
  total: number;
  average: number;
  sampleCount: number;
  unit: string;
  metricLabel: string;
  dataDescription: string;
  emptyMessage: string;
  comparison?: DashboardWorkspaceComparison;
}

export const DASHBOARD_METRICS: Array<{ id: DashboardMetricId; label: string; shortLabel: string; unit: string; source: DashboardFeatureFilter }> = [
  { id: "power", label: "Awarded power", shortLabel: "Power", unit: "power", source: "missions" },
  { id: "xp", label: "Base XP", shortLabel: "XP", unit: "XP", source: "missions" },
  { id: "time", label: "Focused time", shortLabel: "Time", unit: "hours", source: "missions" },
  { id: "gold", label: "Gold movement", shortLabel: "Gold", unit: "gold", source: "rewards" },
  { id: "missions", label: "Completed missions", shortLabel: "Missions", unit: "missions", source: "missions" },
  { id: "focus", label: "Focus quality", shortLabel: "Focus", unit: "/ 5", source: "reflections" },
  { id: "stress", label: "Stress load", shortLabel: "Stress", unit: "/ 5", source: "reflections" },
  { id: "clarity", label: "Mental clarity", shortLabel: "Clarity", unit: "/ 5", source: "reflections" },
  { id: "motivation", label: "Motivation", shortLabel: "Motivation", unit: "/ 5", source: "reflections" },
  { id: "distraction", label: "Distraction load", shortLabel: "Distraction", unit: "/ 5", source: "reflections" },
  { id: "energy", label: "Energy after work", shortLabel: "Energy", unit: "/ 5", source: "reflections" },
  { id: "friction", label: "Friction rating", shortLabel: "Friction", unit: "/ 5", source: "reflections" },
  { id: "achievement", label: "Mini-achievement rating", shortLabel: "Achievement", unit: "/ 5", source: "reflections" },
  { id: "skills", label: "Skills practiced", shortLabel: "Skills", unit: "skills", source: "reflections" },
  { id: "feeling", label: "After-work feeling", shortLabel: "Feeling", unit: "/ 5", source: "reflections" },
  { id: "journal", label: "Journal points", shortLabel: "Journal", unit: "points", source: "journal" },
  { id: "revisions", label: "Revision completions", shortLabel: "Revisions", unit: "reviews", source: "revisions" },
  { id: "calendarCompletion", label: "Calendar completion", shortLabel: "Calendar %", unit: "%", source: "calendar" },
  { id: "sleep", label: "Sleep duration", shortLabel: "Sleep", unit: "hours", source: "recovery" },
  { id: "sleepQuality", label: "Sleep quality", shortLabel: "Sleep quality", unit: "/ 5", source: "recovery" },
  { id: "screenTime", label: "Screen time", shortLabel: "Screen", unit: "hours", source: "recovery" },
  { id: "naps", label: "Nap duration", shortLabel: "Naps", unit: "hours", source: "recovery" },
  { id: "recoveryActions", label: "Recovery actions", shortLabel: "Recovery", unit: "actions", source: "recovery" },
  { id: "stressorIntensity", label: "Stressor intensity", shortLabel: "Stressor", unit: "/ 10", source: "recovery" },
  { id: "principles", label: "Core-principle completion", shortLabel: "Principles", unit: "%", source: "principles" },
  { id: "mistakes", label: "Mistakes logged", shortLabel: "Mistakes", unit: "entries", source: "ledger" },
  { id: "distractions", label: "Distractions logged", shortLabel: "Distractions", unit: "entries", source: "missions" },
  { id: "shadowGates", label: "Shadow Gates crossed", shortLabel: "Gates", unit: "crossings", source: "missions" },
  { id: "rewardPurchases", label: "Rewards redeemed", shortLabel: "Redemptions", unit: "purchases", source: "rewards" },
  { id: "activeDays", label: "Active days", shortLabel: "Active days", unit: "days", source: "all" },
  { id: "bosses", label: "Bosses created", shortLabel: "Bosses", unit: "bosses", source: "missions" },
];

export const DASHBOARD_CHART_TYPES: Array<{ id: DashboardChartType; label: string; detail: string }> = [
  { id: "line", label: "Line", detail: "See a time trend" },
  { id: "bar", label: "Bars", detail: "Compare periods" },
  { id: "donut", label: "Donut", detail: "See distribution" },
  { id: "radar", label: "Radar", detail: "Compare filtered groups" },
  { id: "number", label: "Metric", detail: "See a single summary" },
];

export const DASHBOARD_DATE_RANGES: Array<{ id: DashboardDateRange; label: string }> = [
  { id: "week", label: "1 week" },
  { id: "month", label: "1 month" },
  { id: "90d", label: "90 days" },
  { id: "custom", label: "Custom dates" },
  { id: "lifetime", label: "Lifetime" },
];

export const DASHBOARD_COMPARISON_RANGES: Array<{ id: DashboardComparisonRange; label: string }> = [
  { id: "off", label: "No comparison" },
  { id: "week", label: "Previous week" },
  { id: "month", label: "Previous month" },
  { id: "lifetime", label: "Lifetime" },
  { id: "custom", label: "Custom dates" },
];

export const DASHBOARD_FEATURE_FILTERS: Array<{ id: DashboardFeatureFilter; label: string }> = [
  { id: "all", label: "All features" },
  { id: "missions", label: "Missions" },
  { id: "reflections", label: "Reflections" },
  { id: "journal", label: "Journal" },
  { id: "revisions", label: "Revision" },
  { id: "rewards", label: "Rewards & gold" },
  { id: "calendar", label: "Calendar planner" },
  { id: "recovery", label: "Recovery & wellbeing" },
  { id: "principles", label: "Core principles" },
  { id: "ledger", label: "Mistakes ledger" },
];

const CHART_COLORS = ["#8B5CF6", "#F4C95D", "#49D17D", "#FF7A59", "#E879F9", "#60A5FA"];
const REFLECTION_METRICS = ["focus", "stress", "clarity", "motivation", "distraction", "energy", "friction", "achievement", "feeling"] as const;
const RATIO_METRICS = ["calendarCompletion", "principles"] as const;
const AVERAGE_METRICS = [...REFLECTION_METRICS, "sleep", "sleepQuality", "stressorIntensity"] as const;

function normalized(value: string) { return value.trim().toLowerCase(); }
function isIsoDay(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime()); }
function dayBefore(days: number, timezone: string, anchor = new Date()) { const date = new Date(anchor); date.setDate(date.getDate() - days); return toLocalDate(date.toISOString(), timezone); }
function dayAfter(day: string, days: number, timezone: string) { const date = new Date(`${day}T12:00:00`); date.setDate(date.getDate() + days); return toLocalDate(date.toISOString(), timezone); }
function legacyRange(range: DashboardDateRange): DashboardDateRange { return range === "7d" ? "week" : range === "30d" ? "month" : range === "all" ? "lifetime" : range; }
function metricDefinition(metric: DashboardMetricId) { return DASHBOARD_METRICS.find((item) => item.id === metric) ?? DASHBOARD_METRICS[0]; }
function readableMetricValue(value: number, metric: DashboardMetricId) { return RATIO_METRICS.includes(metric as typeof RATIO_METRICS[number]) || AVERAGE_METRICS.includes(metric as typeof AVERAGE_METRICS[number]) || metric === "stressorIntensity" ? Math.round(value * 10) / 10 : Math.round(value); }
function normalizedMetricValue(value: number, metric: DashboardMetricId) { return Number.isFinite(value) ? readableMetricValue(value, metric) : 0; }
function featureAllows(widget: DashboardWidgetConfig, source: DashboardFeatureFilter) { return widget.feature === "all" || widget.feature === source; }
function missionMatches(mission: Pick<Mission, "subject" | "category" | "frequency"> | undefined, widget: DashboardWidgetConfig) {
  if (!mission) return widget.subject === "all" && widget.category === "all" && widget.missionFrequency === "all";
  return (widget.subject === "all" || normalized(mission.subject) === normalized(widget.subject))
    && (widget.category === "all" || normalized(mission.category) === normalized(widget.category))
    && (widget.missionFrequency === "all" || mission.frequency === widget.missionFrequency);
}
function valueSourceHint(metric: DashboardMetricId) {
  if (["power", "xp", "time", "missions", "distractions", "shadowGates", "bosses"].includes(metric)) return "mission and activity records";
  if ([...REFLECTION_METRICS, "skills"].includes(metric as typeof REFLECTION_METRICS[number] | "skills")) return "post-mission reflection answers";
  if (["sleep", "sleepQuality", "screenTime", "naps", "recoveryActions", "stressorIntensity"].includes(metric)) return "private recovery records";
  if (metric === "calendarCompletion") return "dated calendar-planner assignments";
  if (metric === "principles") return "daily core-principle check-ins";
  if (metric === "mistakes") return "Mistakes Ledger entries";
  if (metric === "revisions") return "completed spaced-repetition topics";
  if (metric === "journal") return "journal entries";
  if (metric === "rewardPurchases") return "reward redemption transactions";
  if (metric === "activeDays") return "all dated local activity records";
  return "recorded gold transactions";
}

function dateRangeStart(widget: DashboardWidgetConfig, timezone: string, override?: Partial<DashboardWidgetConfig>) {
  const range = legacyRange((override?.dateRange ?? widget.dateRange) as DashboardDateRange);
  const customStart = override?.customStartDate ?? widget.customStartDate;
  if (range === "lifetime") return null;
  if (range === "custom" && isIsoDay(customStart)) return customStart;
  const count = range === "week" ? 6 : range === "month" ? 29 : 89;
  return dayBefore(count, timezone);
}
function dateRangeEnd(widget: DashboardWidgetConfig, timezone: string, override?: Partial<DashboardWidgetConfig>) {
  const range = legacyRange((override?.dateRange ?? widget.dateRange) as DashboardDateRange);
  const customEnd = override?.customEndDate ?? widget.customEndDate;
  if (range === "custom" && isIsoDay(customEnd)) return customEnd;
  return toLocalDate(new Date().toISOString(), timezone);
}
function labelForDay(day: string, index: number, total: number) { return index === 0 || index === total - 1 || index === Math.floor(total / 2) ? day.slice(5) : ""; }

function allActivityDays(state: DashboardWorkspaceState): string[] {
  const timezone = state.profile.timezone;
  return [
    ...state.progression.map((item) => toLocalDate(item.occurredAt, timezone)),
    ...getMissionCompletionRecords(state).map((item) => toLocalDate(item.completedAt, timezone)),
    ...state.reflections.map((item) => toLocalDate(item.createdAt, timezone)),
    ...state.journals.map((item) => item.localDate),
    ...state.transactions.map((item) => toLocalDate(item.occurredAt, timezone)),
    ...state.srsTopics.map((item) => item.completedAt ? toLocalDate(item.completedAt, timezone) : item.createdAt ? toLocalDate(item.createdAt, timezone) : item.dueDate),
    ...state.calendarActivities.map((item) => item.localDate),
    ...(state.sleepLogs ?? []).map((item) => item.localDate),
    ...(state.screenTimeLogs ?? []).map((item) => item.localDate),
    ...(state.napLogs ?? []).map((item) => item.localDate),
    ...(state.recoveryActions ?? []).map((item) => item.localDate),
    ...(state.recoveryStressors ?? []).map((item) => item.localDate),
    ...state.corePrincipleDailyCheckIns.map((item) => item.localDate),
    ...state.mistakeLedgerEntries.map((item) => toLocalDate(item.createdAt, timezone)),
    ...state.distractionLogs.map((item) => toLocalDate(item.occurredAt, timezone)),
    ...state.shadowGateEntries.map((item) => toLocalDate(item.occurredAt, timezone)),
    ...state.bosses.map((item) => toLocalDate(item.createdAt, timezone)),
  ].filter(Boolean).sort();
}

function buildBuckets(state: DashboardWorkspaceState, widget: DashboardWidgetConfig, override?: Partial<DashboardWidgetConfig>) {
  const timezone = state.profile.timezone;
  const range = legacyRange((override?.dateRange ?? widget.dateRange) as DashboardDateRange);
  const start = dateRangeStart(widget, timezone, override);
  const today = dateRangeEnd(widget, timezone, override);
  if (range === "lifetime") {
    const earliest: string = allActivityDays(state)[0] ?? today;
    const startDate = new Date(`${earliest}T12:00:00`);
    const endDate = new Date(`${today}T12:00:00`);
    const months = Math.max(1, (endDate.getFullYear() - startDate.getFullYear()) * 12 + endDate.getMonth() - startDate.getMonth() + 1);
    if (months > 4) {
      const buckets: string[] = [];
      for (let index = 0; index < months; index += 1) { const date = new Date(startDate.getFullYear(), startDate.getMonth() + index, 1); buckets.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`); }
      return { start: earliest, end: today, buckets, granularity: "month" as const };
    }
    const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1);
    return { start: earliest, end: today, buckets: Array.from({ length: days }, (_, index) => dayAfter(earliest, index, timezone)), granularity: "day" as const };
  }
  const resolvedStart = start ?? today;
  const startDate = new Date(`${resolvedStart}T12:00:00`);
  const endDate = new Date(`${today}T12:00:00`);
  const boundedEnd = endDate.getTime() < startDate.getTime() ? startDate : endDate;
  const dayCount = range === "week" ? 7 : range === "month" ? 30 : range === "90d" ? 90 : Math.max(1, Math.ceil((boundedEnd.getTime() - startDate.getTime()) / 86_400_000) + 1);
  if (dayCount > 60) {
    const months = Math.max(1, (boundedEnd.getFullYear() - startDate.getFullYear()) * 12 + boundedEnd.getMonth() - startDate.getMonth() + 1);
    return { start: resolvedStart, end: today, buckets: Array.from({ length: months }, (_, index) => { const date = new Date(startDate.getFullYear(), startDate.getMonth() + index, 1); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }), granularity: "month" as const };
  }
  return { start: resolvedStart, end: today, buckets: Array.from({ length: dayCount }, (_, index) => dayAfter(resolvedStart, index, timezone)), granularity: "day" as const };
}
function bucketFor(day: string, granularity: "day" | "month") { return granularity === "month" ? day.slice(0, 7) : day; }
function reflectedMetricValue(reflection: Reflection, metric: DashboardMetricId) {
  if (metric === "focus") return reflection.focusQuality ?? 0;
  if (metric === "stress") return reflection.stressLevel ?? 0;
  if (metric === "clarity") return reflection.clarityLevel ?? 0;
  if (metric === "motivation") return reflection.motivationLevel ?? 0;
  if (metric === "distraction") return reflection.distractionLevel ?? 0;
  if (metric === "energy") return reflection.energyAfter ?? 0;
  if (metric === "friction") return reflection.frictionRating ?? 0;
  if (metric === "achievement") return reflection.miniAchievementRating ?? 0;
  if (metric === "feeling") return reflection.feelingAfter ? ({ drained: 1, restless: 2, steady: 3, charged: 4, great: 5 } as const)[reflection.feelingAfter] : 0;
  return 0;
}

function comparisonOverride(state: DashboardWorkspaceState, widget: DashboardWidgetConfig): { override: Partial<DashboardWidgetConfig>; label: string } | null {
  const range = widget.comparisonRange ?? "off";
  if (range === "off") return null;
  if (range === "custom") return { override: { dateRange: "custom", customStartDate: widget.comparisonStartDate ?? "", customEndDate: widget.comparisonEndDate ?? "" }, label: "Custom comparison" };
  if (range === "lifetime") return { override: { dateRange: "lifetime" }, label: "Lifetime comparison" };
  const timezone = state.profile.timezone;
  const primaryStart = dateRangeStart(widget, timezone) ?? dateRangeEnd(widget, timezone);
  const end = dayBefore(1, timezone, new Date(`${primaryStart}T12:00:00`));
  const start = dayBefore(range === "week" ? 6 : 29, timezone, new Date(`${end}T12:00:00`));
  return { override: { dateRange: "custom", customStartDate: start, customEndDate: end }, label: range === "week" ? "Previous week" : "Previous month" };
}

export function createDashboardWorkspaceWidget(index: number): DashboardWidgetConfig {
  return { id: `workspace_${Date.now()}_${index}`, title: `Untitled metric ${index + 1}`, metric: "time", chartType: "line", dateRange: "month", feature: "all", subject: "all", category: "all", missionFrequency: "all", customStartDate: "", customEndDate: "", comparisonRange: "off", comparisonStartDate: "", comparisonEndDate: "" };
}
export function workspaceSubjects(state: DashboardWorkspaceState) { return Array.from(new Set(state.missions.map((mission) => mission.subject.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)); }
export function workspaceCategories(state: DashboardWorkspaceState) { return Array.from(new Set(state.missions.map((mission) => mission.category.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)); }

function buildWorkspaceResult(state: DashboardWorkspaceState, widget: DashboardWidgetConfig, override?: Partial<DashboardWidgetConfig>): DashboardWorkspaceResult {
  const definition = metricDefinition(widget.metric);
  const { buckets, start, end, granularity } = buildBuckets(state, widget, override);
  const valuesByBucket = new Map(buckets.map((bucket) => [bucket, 0]));
  const countsByBucket = new Map(buckets.map((bucket) => [bucket, 0]));
  const denominatorsByBucket = new Map(buckets.map((bucket) => [bucket, 0]));
  const breakdownBySubject = new Map<string, number>();
  let recordSampleCount = 0;
  const missionsById = new Map(state.missions.map((mission) => [mission.id, mission]));
  const completionRecords = getMissionCompletionRecords(state);
  const add = (day: string, value: number, group: string, average = false) => {
    if (day < start || day > end || !Number.isFinite(value)) return;
    const bucket = bucketFor(day, granularity);
    if (!valuesByBucket.has(bucket)) return;
    recordSampleCount += 1;
    valuesByBucket.set(bucket, (valuesByBucket.get(bucket) ?? 0) + value);
    countsByBucket.set(bucket, (countsByBucket.get(bucket) ?? 0) + (average ? 1 : 0));
    breakdownBySubject.set(group || "Unassigned", (breakdownBySubject.get(group || "Unassigned") ?? 0) + value);
  };

  if (["power", "xp"].includes(widget.metric) && featureAllows(widget, "missions")) completionRecords.forEach((completion) => { if (!missionMatches(completion, widget) || !completion.progression) return; add(toLocalDate(completion.completedAt, state.profile.timezone), widget.metric === "power" ? completion.progression.powerAwarded : completion.progression.baseXp, completion.subject || "Campaign"); });
  if (["time", "missions"].includes(widget.metric) && featureAllows(widget, "missions")) completionRecords.filter((completion) => missionMatches(completion, widget)).forEach((completion) => add(toLocalDate(completion.completedAt, state.profile.timezone), widget.metric === "time" ? completion.durationMs / 3_600_000 : 1, completion.subject));
  if (REFLECTION_METRICS.includes(widget.metric as typeof REFLECTION_METRICS[number]) && featureAllows(widget, "reflections")) state.reflections.forEach((reflection) => { const mission = missionsById.get(reflection.missionId); if (!missionMatches(mission, widget)) return; const value = reflectedMetricValue(reflection, widget.metric); if (value) add(toLocalDate(reflection.createdAt, state.profile.timezone), value, widget.metric === "feeling" ? (reflection.feelingAfter ?? "Unreported") : (mission?.subject || "Reflection"), true); });
  if (widget.metric === "skills" && featureAllows(widget, "reflections")) state.reflections.forEach((reflection) => { const mission = missionsById.get(reflection.missionId); if (!missionMatches(mission, widget)) return; reflection.skills.forEach((skill) => add(toLocalDate(reflection.createdAt, state.profile.timezone), 1, skill || "Unlabelled skill")); });
  if (widget.metric === "journal" && featureAllows(widget, "journal")) state.journals.forEach((entry) => add(entry.localDate, entry.points, "Journal"));
  if (widget.metric === "gold" && (featureAllows(widget, "rewards") || featureAllows(widget, "missions"))) state.transactions.forEach((transaction) => { const mission = transaction.sourceId ? missionsById.get(transaction.sourceId) : undefined; const sourceMatches = widget.feature === "all" || (widget.feature === "missions" && Boolean(mission)) || (widget.feature === "rewards" && !mission); if (sourceMatches && missionMatches(mission, widget)) add(toLocalDate(transaction.occurredAt, state.profile.timezone), transaction.goldDelta, mission?.subject || (transaction.type === "purchase" ? "Rewards" : "Gold")); });
  if (widget.metric === "revisions" && featureAllows(widget, "revisions")) state.srsTopics.filter((topic) => topic.completedAt).forEach((topic) => add(toLocalDate(topic.completedAt!, state.profile.timezone), 1, topic.subject || "Revision"));
  if (widget.metric === "calendarCompletion" && featureAllows(widget, "calendar")) state.calendarActivities.forEach((activity) => { if (activity.localDate < start || activity.localDate > end) return; const bucket = bucketFor(activity.localDate, granularity); if (!valuesByBucket.has(bucket)) return; denominatorsByBucket.set(bucket, (denominatorsByBucket.get(bucket) ?? 0) + 1); if (activity.completedAt) valuesByBucket.set(bucket, (valuesByBucket.get(bucket) ?? 0) + 1); breakdownBySubject.set(activity.completedAt ? "Completed" : "Pending", (breakdownBySubject.get(activity.completedAt ? "Completed" : "Pending") ?? 0) + 1); });
  if (["sleep", "sleepQuality"].includes(widget.metric) && featureAllows(widget, "recovery")) (state.sleepLogs ?? []).forEach((entry) => add(entry.localDate, widget.metric === "sleep" ? entry.durationMinutes / 60 : entry.quality ?? 0, "Sleep", true));
  if (widget.metric === "screenTime" && featureAllows(widget, "recovery")) (state.screenTimeLogs ?? []).forEach((entry) => add(entry.localDate, entry.totalMinutes / 60, entry.primaryLabel || "Screen time", true));
  if (widget.metric === "naps" && featureAllows(widget, "recovery")) (state.napLogs ?? []).forEach((entry) => add(entry.localDate, entry.durationMinutes / 60, "Naps", true));
  if (widget.metric === "recoveryActions" && featureAllows(widget, "recovery")) (state.recoveryActions ?? []).forEach((entry) => add(entry.localDate, 1, entry.type));
  if (widget.metric === "stressorIntensity" && featureAllows(widget, "recovery")) { const actionsByStressor = new Map<string, typeof state.recoveryActions>(); (state.recoveryActions ?? []).forEach((action) => actionsByStressor.set(action.stressorId, [...(actionsByStressor.get(action.stressorId) ?? []), action])); (state.recoveryStressors ?? []).forEach((stressor) => { const latest = actionsByStressor.get(stressor.id)?.at(-1); const value = latest?.afterIntensity ?? stressor.intensity; add(stressor.localDate, value, stressor.category || "Stressor", true); }); }
  if (widget.metric === "principles" && featureAllows(widget, "principles")) state.corePrincipleDailyCheckIns.forEach((checkIn) => { const total = checkIn.items.length; if (!total || checkIn.localDate < start || checkIn.localDate > end) return; const bucket = bucketFor(checkIn.localDate, granularity); if (!valuesByBucket.has(bucket)) return; denominatorsByBucket.set(bucket, (denominatorsByBucket.get(bucket) ?? 0) + total); valuesByBucket.set(bucket, (valuesByBucket.get(bucket) ?? 0) + checkIn.items.filter((item) => item.checked).length); });
  if (widget.metric === "mistakes" && featureAllows(widget, "ledger")) state.mistakeLedgerEntries.forEach((entry) => add(toLocalDate(entry.createdAt, state.profile.timezone), 1, entry.subject || "Ledger"));
  if (widget.metric === "distractions" && featureAllows(widget, "missions")) state.distractionLogs.forEach((entry) => add(toLocalDate(entry.occurredAt, state.profile.timezone), 1, entry.category));
  if (widget.metric === "shadowGates" && featureAllows(widget, "missions")) state.shadowGateEntries.forEach((entry) => add(toLocalDate(entry.occurredAt, state.profile.timezone), 1, entry.doorwayLabel));
  if (widget.metric === "rewardPurchases" && featureAllows(widget, "rewards")) state.transactions.filter((transaction) => transaction.type === "purchase").forEach((transaction) => add(toLocalDate(transaction.occurredAt, state.profile.timezone), 1, "Rewards"));
  if (widget.metric === "bosses" && featureAllows(widget, "missions")) state.bosses.forEach((boss) => add(toLocalDate(boss.createdAt, state.profile.timezone), 1, boss.status));
  if (widget.metric === "activeDays") { const days: string[] = Array.from(new Set(allActivityDays(state).filter((day: string) => day >= start && day <= end))); days.forEach((day) => add(day, 1, "Active days")); }

  const ratioMetric = RATIO_METRICS.includes(widget.metric as typeof RATIO_METRICS[number]);
  const averagedMetric = AVERAGE_METRICS.includes(widget.metric as typeof AVERAGE_METRICS[number]);
  const points = buckets.map((bucket, index) => {
    const sum = valuesByBucket.get(bucket) ?? 0;
    const count = countsByBucket.get(bucket) ?? 0;
    const denominator = denominatorsByBucket.get(bucket) ?? 0;
    const value = ratioMetric ? (denominator ? (sum / denominator) * 100 : 0) : averagedMetric && count ? sum / count : sum;
    return { label: granularity === "month" ? (index === 0 || index === buckets.length - 1 || index === Math.floor(buckets.length / 2) ? bucket : "") : labelForDay(bucket, index, buckets.length), value: normalizedMetricValue(value, widget.metric) };
  });
  const sumValues = Array.from(valuesByBucket.values()).reduce((sum, value) => sum + value, 0);
  const totalDenominator = Array.from(denominatorsByBucket.values()).reduce((sum, value) => sum + value, 0);
  const sampleCount = ratioMetric ? totalDenominator : recordSampleCount;
  const rawTotal = ratioMetric ? (totalDenominator ? (sumValues / totalDenominator) * 100 : 0) : points.reduce((total, point) => total + point.value, 0);
  const average = ratioMetric ? rawTotal : averagedMetric ? (sampleCount ? sumValues / sampleCount : 0) : rawTotal / Math.max(1, points.filter((point) => point.value !== 0).length);
  const breakdown = Array.from(breakdownBySubject.entries()).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 6).map(([label, value], index) => ({ label, value: normalizedMetricValue(value, ratioMetric ? "missions" : widget.metric), color: CHART_COLORS[index % CHART_COLORS.length] }));
  return { points, breakdown, total: normalizedMetricValue(rawTotal, widget.metric), average: normalizedMetricValue(average, widget.metric), sampleCount, unit: definition.unit, metricLabel: definition.label, dataDescription: `Calculated from ${valueSourceHint(widget.metric)} within the selected filters.`, emptyMessage: `No ${definition.label.toLowerCase()} records match this widget’s current source, date, and mission filters.` };
}

export function getDashboardWorkspaceResult(state: DashboardWorkspaceState, widget: DashboardWidgetConfig): DashboardWorkspaceResult {
  const primary = buildWorkspaceResult(state, widget);
  const comparison = comparisonOverride(state, widget);
  if (!comparison) return primary;
  const compared = buildWorkspaceResult(state, { ...widget, comparisonRange: "off" }, comparison.override);
  return { ...primary, comparison: { points: compared.points, breakdown: compared.breakdown, total: compared.total, average: compared.average, sampleCount: compared.sampleCount, rangeLabel: comparison.label } };
}
