import {
  DashboardChartType,
  DashboardDateRange,
  DashboardFeatureFilter,
  DashboardMetricId,
  DashboardWidgetConfig,
  FocusState,
  Mission,
  Reflection,
  getMissionInvestedMilliseconds,
  toLocalDate,
} from "./focus-command";

export interface DashboardWorkspacePoint {
  label: string;
  value: number;
  color?: string;
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
];

export const DASHBOARD_CHART_TYPES: Array<{ id: DashboardChartType; label: string; detail: string }> = [
  { id: "line", label: "Line", detail: "See a time trend" },
  { id: "bar", label: "Bars", detail: "Compare periods" },
  { id: "donut", label: "Donut", detail: "See distribution" },
  { id: "radar", label: "Radar", detail: "Compare filtered groups" },
  { id: "number", label: "Metric", detail: "See a single summary" },
];

export const DASHBOARD_DATE_RANGES: Array<{ id: DashboardDateRange; label: string }> = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "custom", label: "Custom dates" },
  { id: "all", label: "All time" },
];

export const DASHBOARD_FEATURE_FILTERS: Array<{ id: DashboardFeatureFilter; label: string }> = [
  { id: "all", label: "All features" },
  { id: "missions", label: "Missions" },
  { id: "reflections", label: "Reflections" },
  { id: "journal", label: "Journal" },
  { id: "revisions", label: "Revision" },
  { id: "rewards", label: "Rewards & gold" },
];

const CHART_COLORS = ["#8B5CF6", "#F4C95D", "#49D17D", "#FF7A59", "#E879F9", "#60A5FA"];

function normalized(value: string) {
  return value.trim().toLowerCase();
}

function dayBefore(days: number, timezone: string) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toLocalDate(date.toISOString(), timezone);
}

function isIsoDay(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
}

function dateRangeStart(widget: DashboardWidgetConfig, timezone: string) {
  if (widget.dateRange === "all") return null;
  if (widget.dateRange === "custom" && isIsoDay(widget.customStartDate)) return widget.customStartDate;
  const count = widget.dateRange === "7d" ? 6 : widget.dateRange === "30d" || widget.dateRange === "custom" ? 29 : 89;
  return dayBefore(count, timezone);
}

function dateRangeEnd(widget: DashboardWidgetConfig, timezone: string) {
  if (widget.dateRange === "custom" && isIsoDay(widget.customEndDate)) return widget.customEndDate;
  return toLocalDate(new Date().toISOString(), timezone);
}

function labelForDay(day: string, index: number, total: number) {
  return index === 0 || index === total - 1 || index === Math.floor(total / 2) ? day.slice(5) : "";
}

function allActivityDays(state: FocusState) {
  const timezone = state.profile.timezone;
  return [
    ...state.progression.map((item) => toLocalDate(item.occurredAt, timezone)),
    ...state.reflections.map((item) => toLocalDate(item.createdAt, timezone)),
    ...state.journals.map((item) => item.localDate),
    ...state.transactions.map((item) => toLocalDate(item.occurredAt, timezone)),
    ...state.srsTopics.map((item) => item.completedAt ? toLocalDate(item.completedAt, timezone) : item.createdAt ? toLocalDate(item.createdAt, timezone) : item.dueDate),
  ].filter(Boolean).sort();
}

function buildBuckets(state: FocusState, widget: DashboardWidgetConfig) {
  const timezone = state.profile.timezone;
  const range = widget.dateRange;
  const start = dateRangeStart(widget, timezone);
  const today = dateRangeEnd(widget, timezone);
  if (range === "all") {
    const earliest = allActivityDays(state)[0] ?? today;
    const startDate = new Date(`${earliest}T12:00:00`);
    const endDate = new Date(`${today}T12:00:00`);
    const months = Math.max(1, (endDate.getFullYear() - startDate.getFullYear()) * 12 + endDate.getMonth() - startDate.getMonth() + 1);
    if (months > 4) {
      const buckets: string[] = [];
      for (let index = 0; index < months; index += 1) {
        const date = new Date(startDate.getFullYear(), startDate.getMonth() + index, 1);
        buckets.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
      }
      return { start: earliest, buckets, granularity: "month" as const };
    }
    const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1);
    return {
      start: earliest,
      buckets: Array.from({ length: days }, (_, index) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + index);
        return toLocalDate(date.toISOString(), timezone);
      }),
      granularity: "day" as const,
    };
  }
  const resolvedStart = start ?? today;
  const startDate = new Date(`${resolvedStart}T12:00:00`);
  const endDate = new Date(`${today}T12:00:00`);
  const dayCount = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1);
  if (dayCount > 60) {
    const months = Math.max(1, (endDate.getFullYear() - startDate.getFullYear()) * 12 + endDate.getMonth() - startDate.getMonth() + 1);
    return {
      start: resolvedStart,
      buckets: Array.from({ length: months }, (_, index) => {
        const date = new Date(startDate.getFullYear(), startDate.getMonth() + index, 1);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }),
      granularity: "month" as const,
    };
  }
  return {
    start: resolvedStart,
    buckets: Array.from({ length: dayCount }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + index);
      return toLocalDate(date.toISOString(), timezone);
    }),
    granularity: "day" as const,
  };
}

function bucketFor(day: string, granularity: "day" | "month") {
  return granularity === "month" ? day.slice(0, 7) : day;
}

function missionMatches(mission: Mission | undefined, widget: DashboardWidgetConfig) {
  if (!mission) return widget.subject === "all" && widget.category === "all" && widget.missionFrequency === "all";
  return (widget.subject === "all" || normalized(mission.subject) === normalized(widget.subject))
    && (widget.category === "all" || normalized(mission.category) === normalized(widget.category))
    && (widget.missionFrequency === "all" || mission.frequency === widget.missionFrequency);
}

function metricDefinition(metric: DashboardMetricId) {
  return DASHBOARD_METRICS.find((item) => item.id === metric) ?? DASHBOARD_METRICS[0];
}

function readableMetricValue(value: number, metric: DashboardMetricId) {
  if (metric === "time") return Math.round(value * 10) / 10;
  if (["focus", "stress", "clarity", "motivation", "distraction", "energy", "friction", "achievement"].includes(metric)) return Math.round(value * 10) / 10;
  return Math.round(value);
}

function reflectedMetricValue(reflection: Reflection, metric: DashboardMetricId) {
  if (metric === "focus") return reflection.focusQuality ?? 0;
  if (metric === "stress") return reflection.stressLevel ?? 0;
  if (metric === "clarity") return reflection.clarityLevel ?? 0;
  if (metric === "motivation") return reflection.motivationLevel ?? 0;
  if (metric === "distraction") return reflection.distractionLevel ?? 0;
  if (metric === "energy") return reflection.energyAfter ?? 0;
  if (metric === "friction") return reflection.frictionRating ?? 0;
  if (metric === "achievement") return reflection.miniAchievementRating ?? 0;
  if (metric === "feeling") {
    const scores = { drained: 1, restless: 2, steady: 3, charged: 4, great: 5 } as const;
    return reflection.feelingAfter ? scores[reflection.feelingAfter] : 0;
  }
  return 0;
}

function featureAllows(widget: DashboardWidgetConfig, source: DashboardFeatureFilter) {
  return widget.feature === "all" || widget.feature === source;
}

function valueSourceHint(metric: DashboardMetricId) {
  if (["power", "xp", "time", "missions"].includes(metric)) return "completed mission records";
  if (["focus", "stress", "clarity", "motivation", "distraction", "energy", "friction", "achievement", "feeling"].includes(metric)) return "post-mission reflection answers";
  if (metric === "skills") return "skills logged in post-mission reflection";
  if (metric === "journal") return "journal entries";
  return "recorded gold transactions";
}

export function createDashboardWorkspaceWidget(index: number): DashboardWidgetConfig {
  return {
    id: `workspace_${Date.now()}_${index}`,
    title: `Untitled metric ${index + 1}`,
    metric: "time",
    chartType: "line",
    dateRange: "30d",
    feature: "all",
    subject: "all",
    category: "all",
    missionFrequency: "all",
    customStartDate: "",
    customEndDate: "",
  };
}

export function workspaceSubjects(state: FocusState) {
  return Array.from(new Set(state.missions.map((mission) => mission.subject.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export function workspaceCategories(state: FocusState) {
  return Array.from(new Set(state.missions.map((mission) => mission.category.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

/**
 * Builds a chart-ready series from persisted activity only. The current widget controls all
 * dimensions: metric, date range, source feature, subject, category, and mission frequency.
 */
export function getDashboardWorkspaceResult(state: FocusState, widget: DashboardWidgetConfig): DashboardWorkspaceResult {
  const definition = metricDefinition(widget.metric);
  const { buckets, start, granularity } = buildBuckets(state, widget);
  const valuesByBucket = new Map(buckets.map((bucket) => [bucket, 0]));
  const countsByBucket = new Map(buckets.map((bucket) => [bucket, 0]));
  const breakdownBySubject = new Map<string, number>();
  const missionsById = new Map(state.missions.map((mission) => [mission.id, mission]));
  let sampleCount = 0;

  const add = (day: string, value: number, group: string, average = false) => {
    if (day < start || !Number.isFinite(value)) return;
    const bucket = bucketFor(day, granularity);
    if (!valuesByBucket.has(bucket)) return;
    valuesByBucket.set(bucket, (valuesByBucket.get(bucket) ?? 0) + value);
    countsByBucket.set(bucket, (countsByBucket.get(bucket) ?? 0) + (average ? 1 : 0));
    breakdownBySubject.set(group || "Unassigned", (breakdownBySubject.get(group || "Unassigned") ?? 0) + value);
    sampleCount += 1;
  };

  if (["power", "xp"].includes(widget.metric) && featureAllows(widget, "missions")) {
    state.progression.forEach((event) => {
      const mission = event.missionId ? missionsById.get(event.missionId) : undefined;
      if (!missionMatches(mission, widget)) return;
      const value = widget.metric === "power" ? event.powerAwarded : event.baseXp;
      add(toLocalDate(event.occurredAt, state.profile.timezone), value, mission?.subject || "Campaign");
    });
  }

  if (["time", "missions"].includes(widget.metric) && featureAllows(widget, "missions")) {
    state.missions.filter((mission) => mission.status === "completed" && mission.completedAt && missionMatches(mission, widget)).forEach((mission) => {
      const value = widget.metric === "time" ? getMissionInvestedMilliseconds(mission) / 3_600_000 : 1;
      add(toLocalDate(mission.completedAt!, state.profile.timezone), value, mission.subject);
    });
  }

  if (["focus", "stress", "clarity", "motivation", "distraction", "energy", "friction", "achievement", "feeling"].includes(widget.metric) && featureAllows(widget, "reflections")) {
    state.reflections.forEach((reflection) => {
      const mission = missionsById.get(reflection.missionId);
      if (!missionMatches(mission, widget)) return;
      const value = reflectedMetricValue(reflection, widget.metric);
      if (!value) return;
      const group = widget.metric === "feeling" ? (reflection.feelingAfter ?? "Unreported") : (mission?.subject || "Reflection");
      add(toLocalDate(reflection.createdAt, state.profile.timezone), value, group, true);
    });
  }

  if (widget.metric === "skills" && featureAllows(widget, "reflections")) {
    state.reflections.forEach((reflection) => {
      const mission = missionsById.get(reflection.missionId);
      if (!missionMatches(mission, widget)) return;
      reflection.skills.forEach((skill) => add(toLocalDate(reflection.createdAt, state.profile.timezone), 1, skill || "Unlabelled skill"));
    });
  }

  if (widget.metric === "journal" && featureAllows(widget, "journal")) {
    state.journals.forEach((entry) => add(entry.localDate, entry.points, "Journal"));
  }

  if (widget.metric === "gold" && (featureAllows(widget, "rewards") || featureAllows(widget, "missions"))) {
    state.transactions.forEach((transaction) => {
      const mission = transaction.sourceId ? missionsById.get(transaction.sourceId) : undefined;
      const sourceMatches = widget.feature === "all"
        || (widget.feature === "missions" && Boolean(mission))
        || (widget.feature === "rewards" && !mission);
      if (!sourceMatches || !missionMatches(mission, widget)) return;
      add(toLocalDate(transaction.occurredAt, state.profile.timezone), transaction.goldDelta, mission?.subject || (transaction.type === "purchase" ? "Rewards" : "Gold"));
    });
  }

  if (widget.metric === "missions" && featureAllows(widget, "revisions")) {
    state.srsTopics.filter((topic) => topic.completedAt).forEach((topic) => {
      const mission = topic.missionId ? missionsById.get(topic.missionId) : undefined;
      if (!missionMatches(mission, widget)) return;
      add(toLocalDate(topic.completedAt!, state.profile.timezone), 1, topic.subject || "Revision");
    });
  }

  const averagedMetric = ["focus", "stress", "clarity", "motivation", "distraction", "energy", "friction", "achievement", "feeling"].includes(widget.metric);
  const points = buckets.map((bucket, index) => {
    const sum = valuesByBucket.get(bucket) ?? 0;
    const count = countsByBucket.get(bucket) ?? 0;
    const value = averagedMetric && count ? sum / count : sum;
    return { label: granularity === "month" ? (index === 0 || index === buckets.length - 1 || index === Math.floor(buckets.length / 2) ? bucket : "") : labelForDay(bucket, index, buckets.length), value: readableMetricValue(value, widget.metric) };
  });
  const rawTotal = points.reduce((total, point) => total + point.value, 0);
  const total = readableMetricValue(rawTotal, widget.metric);
  const average = averagedMetric
    ? readableMetricValue(sampleCount ? Array.from(valuesByBucket.values()).reduce((sum, value) => sum + value, 0) / Math.max(1, Array.from(countsByBucket.values()).reduce((sum, value) => sum + value, 0)) : 0, widget.metric)
    : readableMetricValue(rawTotal / Math.max(1, points.filter((point) => point.value !== 0).length), widget.metric);
  const breakdown = Array.from(breakdownBySubject.entries()).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 6).map(([label, value], index) => ({ label, value: readableMetricValue(value, widget.metric), color: CHART_COLORS[index % CHART_COLORS.length] }));

  return {
    points,
    breakdown,
    total,
    average,
    sampleCount,
    unit: definition.unit,
    metricLabel: definition.label,
    dataDescription: `Calculated from ${valueSourceHint(widget.metric)} within the selected filters.`,
    emptyMessage: `No ${definition.label.toLowerCase()} records match this widget’s current source, date, and mission filters.`,
  };
}
