import { getMissionCompletionRecords, toLocalDate, type FocusState, type Reflection } from "./focus-command";
import { DISTRACTION_CATEGORY_LABELS } from "./distraction-log";

export const MONTHLY_ARCHIVE_METRICS = [
  "growth",
  "xp",
  "gold",
  "time",
  "missions",
  "focus",
  "clarity",
  "motivation",
  "feeling",
  "subjects",
  "distractions",
] as const;

export type MonthlyArchiveMetric = typeof MONTHLY_ARCHIVE_METRICS[number];

export interface MonthlyArchiveSubject {
  label: string;
  durationMs: number;
  completedMissions: number;
}

export interface MonthlyArchiveCategory {
  label: string;
  count: number;
}

export interface MonthlyArchiveDay {
  localDate: string;
  label: string;
  xp: number;
  gold: number;
  investedMs: number;
  completedMissions: number;
  focus: number | null;
  clarity: number | null;
  motivation: number | null;
  feelingScore: number | null;
  subjectCount: number;
  distractions: number;
  growthScore: number;
}

export interface MonthlyCommandArchiveMonth {
  key: string;
  year: number;
  monthIndex: number;
  label: string;
  shortLabel: string;
  hasData: boolean;
  xpEarned: number;
  goldEarned: number;
  investedMs: number;
  completedMissions: number;
  scheduledPlans: number;
  reflectionCount: number;
  averageFocus: number | null;
  averageClarity: number | null;
  averageMotivation: number | null;
  mostCommonFeeling: string | null;
  energyShift: number | null;
  subjectBreakdown: MonthlyArchiveSubject[];
  distractionCount: number;
  topDistractionCategory: string | null;
  growthScore: number;
  daily: MonthlyArchiveDay[];
}

export interface MonthlyCommandArchiveYear {
  year: number;
  months: MonthlyCommandArchiveMonth[];
}

export interface MonthlyCommandArchive {
  years: MonthlyCommandArchiveYear[];
}

export interface MonthlyArchiveLifetimePoint {
  key: string;
  label: string;
  value: number;
  year: number;
  monthIndex: number;
}

export interface MonthlyArchiveLifetimeWindow {
  key: string;
  label: string;
  points: MonthlyArchiveLifetimePoint[];
}

export interface MonthlyArchiveStudiedTopic {
  key: string;
  subject: string;
  topic: string;
  firstCompletedAt: string;
  firstMonthKey: string;
  completedMissions: number;
  revisionTopicId: string | null;
  revisionCompletionPercent: number | null;
  revisionStatus: "not_enrolled" | "scheduled" | "completed";
}

export interface ArchiveTopicPeriod {
  year?: number;
  monthKey?: string;
}

interface AggregateDay {
  xp: number;
  gold: number;
  investedMs: number;
  completedMissions: number;
  focusValues: number[];
  clarityValues: number[];
  motivationValues: number[];
  feelingValues: number[];
  subjectLabels: Set<string>;
  distractions: number;
}

interface AggregateMonth extends AggregateDay {
  year: number;
  monthIndex: number;
  reflectionCount: number;
  scheduledPlans: number;
  feelingCounts: Map<string, number>;
  energyShifts: number[];
  subjects: Map<string, MonthlyArchiveSubject>;
  distractionCategories: Map<string, number>;
  daily: Map<string, AggregateDay>;
}

const archiveCache = new WeakMap<FocusState, MonthlyCommandArchive>();
const studiedTopicsCache = new WeakMap<FocusState, MonthlyArchiveStudiedTopic[]>();

const FEELING_LABELS: Record<NonNullable<Reflection["feelingAfter"]>, string> = {
  drained: "Drained",
  restless: "Restless",
  steady: "Steady",
  charged: "Charged",
  great: "Great",
};

const FEELING_SCORES: Record<NonNullable<Reflection["feelingAfter"]>, number> = {
  drained: 1,
  restless: 2,
  steady: 3,
  charged: 4,
  great: 5,
};

function average(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
}

function createDay(): AggregateDay {
  return {
    xp: 0,
    gold: 0,
    investedMs: 0,
    completedMissions: 0,
    focusValues: [],
    clarityValues: [],
    motivationValues: [],
    feelingValues: [],
    subjectLabels: new Set<string>(),
    distractions: 0,
  };
}

function createMonth(year: number, monthIndex: number): AggregateMonth {
  return {
    ...createDay(),
    year,
    monthIndex,
    reflectionCount: 0,
    scheduledPlans: 0,
    feelingCounts: new Map<string, number>(),
    energyShifts: [],
    subjects: new Map<string, MonthlyArchiveSubject>(),
    distractionCategories: new Map<string, number>(),
    daily: new Map<string, AggregateDay>(),
  };
}

function getLocalMonth(localDate: string) {
  return { year: Number(localDate.slice(0, 4)), monthIndex: Number(localDate.slice(5, 7)) - 1 };
}

function monthKey(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function getOrCreateMonth(months: Map<string, AggregateMonth>, localDate: string) {
  const { year, monthIndex } = getLocalMonth(localDate);
  const key = monthKey(year, monthIndex);
  const current = months.get(key);
  if (current) return current;
  const created = createMonth(year, monthIndex);
  months.set(key, created);
  return created;
}

function getOrCreateDay(month: AggregateMonth, localDate: string) {
  const current = month.daily.get(localDate);
  if (current) return current;
  const created = createDay();
  month.daily.set(localDate, created);
  return created;
}

function addMetric(month: AggregateMonth, localDate: string, action: (target: AggregateDay) => void) {
  action(month);
  action(getOrCreateDay(month, localDate));
}

function addReflection(month: AggregateMonth, localDate: string, reflection: Reflection) {
  const apply = (target: AggregateDay) => {
    if (typeof reflection.focusQuality === "number") target.focusValues.push(reflection.focusQuality);
    if (typeof reflection.clarityLevel === "number") target.clarityValues.push(reflection.clarityLevel);
    if (typeof reflection.motivationLevel === "number") target.motivationValues.push(reflection.motivationLevel);
    if (reflection.feelingAfter) target.feelingValues.push(FEELING_SCORES[reflection.feelingAfter]);
  };
  addMetric(month, localDate, apply);
  month.reflectionCount += 1;
  if (reflection.feelingAfter) {
    const label = FEELING_LABELS[reflection.feelingAfter];
    month.feelingCounts.set(label, (month.feelingCounts.get(label) ?? 0) + 1);
  }
  if (typeof reflection.energyBefore === "number" && typeof reflection.energyAfter === "number") {
    month.energyShifts.push(reflection.energyAfter - reflection.energyBefore);
  }
}

function calculateGrowthScore(values: {
  xp: number;
  investedMs: number;
  completedMissions: number;
  focus: number | null;
  clarity: number | null;
  motivation: number | null;
  subjectCount: number;
  distractions: number;
}) {
  const signals: Array<{ value: number | null; weight: number }> = [
    { value: values.xp > 0 || values.completedMissions > 0 ? Math.min(1, values.xp / Math.max(1, values.completedMissions * 25)) : null, weight: 24 },
    { value: values.investedMs > 0 ? Math.min(1, values.investedMs / (8 * 3_600_000)) : null, weight: 18 },
    { value: values.focus === null ? null : Math.min(1, values.focus / 5), weight: 16 },
    { value: values.clarity === null ? null : Math.min(1, values.clarity / 5), weight: 12 },
    { value: values.motivation === null ? null : Math.min(1, values.motivation / 5), weight: 12 },
    { value: values.subjectCount > 0 ? Math.min(1, values.subjectCount / 4) : null, weight: 8 },
    { value: values.completedMissions || values.distractions ? 1 / (1 + values.distractions / Math.max(1, values.completedMissions)) : null, weight: 10 },
  ];
  const available = signals.filter((signal): signal is { value: number; weight: number } => signal.value !== null);
  const totalWeight = available.reduce((total, signal) => total + signal.weight, 0);
  return totalWeight ? Math.round((available.reduce((total, signal) => total + signal.value * signal.weight, 0) / totalWeight) * 100) : 0;
}

function formatMonth(year: number, monthIndex: number, style: "long" | "short") {
  return new Intl.DateTimeFormat("en-US", { month: style, ...(style === "long" ? { year: "numeric" } : {}), timeZone: "UTC" })
    .format(new Date(Date.UTC(year, monthIndex, 1)));
}

function getMostCommon(entries: Map<string, number>) {
  return Array.from(entries.entries()).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] ?? null;
}

function getFeelingScore(label: string | null) {
  if (!label) return 0;
  const match = Object.entries(FEELING_LABELS).find(([, feelingLabel]) => feelingLabel === label)?.[0] as keyof typeof FEELING_SCORES | undefined;
  return match ? FEELING_SCORES[match] : 0;
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function localDateFor(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildMonth(month: AggregateMonth): MonthlyCommandArchiveMonth {
  const averageFocus = average(month.focusValues);
  const averageClarity = average(month.clarityValues);
  const averageMotivation = average(month.motivationValues);
  const subjectBreakdown = Array.from(month.subjects.values()).sort((left, right) => right.durationMs - left.durationMs || left.label.localeCompare(right.label));
  const growthScore = calculateGrowthScore({
    xp: month.xp,
    investedMs: month.investedMs,
    completedMissions: month.completedMissions,
    focus: averageFocus,
    clarity: averageClarity,
    motivation: averageMotivation,
    subjectCount: subjectBreakdown.length,
    distractions: month.distractions,
  });
  const dayCount = daysInMonth(month.year, month.monthIndex);
  const daily = Array.from({ length: dayCount }, (_, index) => {
    const day = index + 1;
    const localDate = localDateFor(month.year, month.monthIndex, day);
    const aggregate = month.daily.get(localDate) ?? createDay();
    const focus = average(aggregate.focusValues);
    const clarity = average(aggregate.clarityValues);
    const motivation = average(aggregate.motivationValues);
    return {
      localDate,
      label: day === 1 || day === Math.ceil(dayCount / 2) || day === dayCount ? String(day) : "",
      xp: aggregate.xp,
      gold: aggregate.gold,
      investedMs: aggregate.investedMs,
      completedMissions: aggregate.completedMissions,
      focus,
      clarity,
      motivation,
      feelingScore: average(aggregate.feelingValues),
      subjectCount: aggregate.subjectLabels.size,
      distractions: aggregate.distractions,
      growthScore: calculateGrowthScore({
        xp: aggregate.xp,
        investedMs: aggregate.investedMs,
        completedMissions: aggregate.completedMissions,
        focus,
        clarity,
        motivation,
        subjectCount: aggregate.subjectLabels.size,
        distractions: aggregate.distractions,
      }),
    };
  });
  return {
    key: monthKey(month.year, month.monthIndex),
    year: month.year,
    monthIndex: month.monthIndex,
    label: formatMonth(month.year, month.monthIndex, "long"),
    shortLabel: formatMonth(month.year, month.monthIndex, "short"),
    hasData: Boolean(month.completedMissions || month.xp || month.gold || month.investedMs || month.reflectionCount || month.distractions || month.scheduledPlans),
    xpEarned: month.xp,
    goldEarned: month.gold,
    investedMs: month.investedMs,
    completedMissions: month.completedMissions,
    scheduledPlans: month.scheduledPlans,
    reflectionCount: month.reflectionCount,
    averageFocus,
    averageClarity,
    averageMotivation,
    mostCommonFeeling: getMostCommon(month.feelingCounts),
    energyShift: average(month.energyShifts),
    subjectBreakdown,
    distractionCount: month.distractions,
    topDistractionCategory: getMostCommon(month.distractionCategories),
    growthScore,
    daily,
  };
}

function createEmptyMonth(year: number, monthIndex: number): MonthlyCommandArchiveMonth {
  return buildMonth(createMonth(year, monthIndex));
}

/**
 * Builds a read-only lifetime archive from records already persisted by Focus Command.
 * A new local month or year appears automatically when the first eligible durable record
 * is saved in that period; no archive data, rollover marker, or placeholder is stored.
 */
export function getMonthlyCommandArchive(state: FocusState): MonthlyCommandArchive {
  const cached = archiveCache.get(state);
  if (cached) return cached;

  const timezone = state.profile.timezone;
  const months = new Map<string, AggregateMonth>();
  const linkedReflectionIds = new Set<string>();
  const linkedProgressionIds = new Set<string>();
  const linkedCompletionIds = new Set<string>();

  getMissionCompletionRecords(state).forEach((completion) => {
    const localDate = toLocalDate(completion.completedAt, timezone);
    const month = getOrCreateMonth(months, localDate);
    linkedCompletionIds.add(completion.id);
    if (completion.progression?.id) linkedProgressionIds.add(completion.progression.id);
    if (completion.reflection?.id) linkedReflectionIds.add(completion.reflection.id);
    addMetric(month, localDate, (target) => {
      target.completedMissions += 1;
      target.investedMs += completion.durationMs;
      target.xp += completion.progression?.powerAwarded ?? completion.baseXp;
      target.gold += completion.progression?.goldAwarded ?? 0;
      const subject = completion.subject.trim() || "Unspecified";
      target.subjectLabels.add(subject);
    });
    const subject = completion.subject.trim() || "Unspecified";
    const currentSubject = month.subjects.get(subject) ?? { label: subject, durationMs: 0, completedMissions: 0 };
    month.subjects.set(subject, {
      label: subject,
      durationMs: currentSubject.durationMs + completion.durationMs,
      completedMissions: currentSubject.completedMissions + 1,
    });
    if (completion.reflection) addReflection(month, localDate, completion.reflection);
  });

  state.reflections
    .filter((reflection) => !linkedReflectionIds.has(reflection.id) && Boolean(reflection.createdAt))
    .forEach((reflection) => addReflection(getOrCreateMonth(months, toLocalDate(reflection.createdAt, timezone)), toLocalDate(reflection.createdAt, timezone), reflection));

  state.progression
    .filter((event) => !linkedProgressionIds.has(event.id))
    .forEach((event) => {
      const localDate = toLocalDate(event.occurredAt, timezone);
      addMetric(getOrCreateMonth(months, localDate), localDate, (target) => {
        target.xp += event.powerAwarded;
        target.gold += event.goldAwarded;
      });
    });

  const progressionIds = new Set(state.progression.map((event) => event.id));
  state.transactions
    .filter((transaction) => transaction.goldDelta > 0 && !linkedCompletionIds.has(transaction.completionId ?? "") && !progressionIds.has(transaction.sourceId ?? ""))
    .forEach((transaction) => {
      const localDate = toLocalDate(transaction.occurredAt, timezone);
      addMetric(getOrCreateMonth(months, localDate), localDate, (target) => { target.gold += transaction.goldDelta; });
    });

  state.distractionLogs.forEach((entry) => {
    const localDate = toLocalDate(entry.occurredAt, timezone);
    const month = getOrCreateMonth(months, localDate);
    addMetric(month, localDate, (target) => { target.distractions += 1; });
    const label = DISTRACTION_CATEGORY_LABELS[entry.category];
    month.distractionCategories.set(label, (month.distractionCategories.get(label) ?? 0) + 1);
  });

  state.missions.forEach((mission) => {
    if (!mission.dueAt) return;
    const localDate = toLocalDate(mission.dueAt, timezone);
    getOrCreateMonth(months, localDate).scheduledPlans += 1;
  });

  const years = Array.from(months.values())
    .reduce((byYear, month) => {
      const current = byYear.get(month.year) ?? [];
      current.push(month);
      byYear.set(month.year, current);
      return byYear;
    }, new Map<number, AggregateMonth[]>())
    .entries();
  const archive = {
    years: Array.from(years)
      .map(([year, yearMonths]) => {
        const byMonth = new Map(yearMonths.map((month) => [month.monthIndex, month]));
        return { year, months: Array.from({ length: 12 }, (_, index) => buildMonth(byMonth.get(index) ?? createMonth(year, index))) };
      })
      .sort((left, right) => right.year - left.year),
  } satisfies MonthlyCommandArchive;
  archiveCache.set(state, archive);
  return archive;
}

export function getMonthlyArchiveMetricValue(month: MonthlyCommandArchiveMonth, metric: MonthlyArchiveMetric) {
  switch (metric) {
    case "growth": return month.growthScore;
    case "xp": return month.xpEarned;
    case "gold": return month.goldEarned;
    case "time": return month.investedMs / 3_600_000;
    case "missions": return month.completedMissions;
    case "focus": return month.averageFocus ?? 0;
    case "clarity": return month.averageClarity ?? 0;
    case "motivation": return month.averageMotivation ?? 0;
    case "feeling": return getFeelingScore(month.mostCommonFeeling);
    case "subjects": return month.subjectBreakdown.length;
    case "distractions": return month.distractionCount;
  }
}

export function getMonthlyArchiveMetricSeries(month: MonthlyCommandArchiveMonth, metric: MonthlyArchiveMetric) {
  return month.daily.map((day) => ({
    label: day.label,
    value: metric === "growth" ? day.growthScore
      : metric === "xp" ? day.xp
        : metric === "gold" ? day.gold
          : metric === "time" ? day.investedMs / 3_600_000
            : metric === "missions" ? day.completedMissions
              : metric === "focus" ? day.focus ?? 0
                : metric === "clarity" ? day.clarity ?? 0
                  : metric === "motivation" ? day.motivation ?? 0
                    : metric === "feeling" ? day.feelingScore ?? 0
                      : metric === "subjects" ? day.subjectCount
                        : day.distractions,
  }));
}

export function getMonthlyArchiveMetricLabel(metric: MonthlyArchiveMetric) {
  return {
    growth: "Growth",
    xp: "XP",
    gold: "Gold",
    time: "Focus time",
    missions: "Missions",
    focus: "Focus",
    clarity: "Clarity",
    motivation: "Motivation",
    feeling: "Feeling",
    subjects: "Subjects",
    distractions: "Distractions",
  }[metric];
}

function nextMonth(year: number, monthIndex: number) {
  return monthIndex === 11 ? { year: year + 1, monthIndex: 0 } : { year, monthIndex: monthIndex + 1 };
}

/**
 * Returns consecutive chronological windows. Missing calendar months are intentionally
 * represented as zero-growth points, so a real 2026–2029 trajectory remains continuous
 * without fabricating any activity.
 */
export function getMonthlyArchiveLifetimeWindows(archive: MonthlyCommandArchive, monthsPerWindow = 24): MonthlyArchiveLifetimeWindow[] {
  const recorded = archive.years
    .flatMap((year) => year.months)
    .filter((month) => month.hasData)
    .sort((left, right) => left.key.localeCompare(right.key));
  if (!recorded.length) return [];

  const byKey = new Map(archive.years.flatMap((year) => year.months).map((month) => [month.key, month]));
  const points: MonthlyArchiveLifetimePoint[] = [];
  let { year, monthIndex } = recorded[0];
  const last = recorded[recorded.length - 1];
  while (year < last.year || (year === last.year && monthIndex <= last.monthIndex)) {
    const key = monthKey(year, monthIndex);
    const month = byKey.get(key);
    points.push({
      key,
      label: monthIndex === 0 || monthIndex === 11 ? `${formatMonth(year, monthIndex, "short")} ${String(year).slice(-2)}` : "",
      value: month?.growthScore ?? 0,
      year,
      monthIndex,
    });
    ({ year, monthIndex } = nextMonth(year, monthIndex));
  }

  const safeWindowSize = Math.max(6, Math.floor(monthsPerWindow));
  const windows: MonthlyArchiveLifetimeWindow[] = [];
  for (let index = 0; index < points.length; index += safeWindowSize) {
    const windowPoints = points.slice(index, index + safeWindowSize);
    const first = windowPoints[0];
    const final = windowPoints[windowPoints.length - 1];
    windows.push({
      key: `${first.key}:${final.key}`,
      label: first.year === final.year ? `${first.year}` : `${first.year}–${final.year}`,
      points: windowPoints,
    });
  }
  return windows;
}

function revisionPercent(topic: FocusState["srsTopics"][number]) {
  if (topic.status === "completed") return 100;
  return [0, 33, 67][Math.max(0, Math.min(2, topic.stage))] ?? 0;
}

function getAllArchiveStudiedTopics(state: FocusState) {
  const cached = studiedTopicsCache.get(state);
  if (cached) return cached;
  const timezone = state.profile.timezone;
  const missionsById = new Map(state.missions.map((mission) => [mission.id, mission]));
  const revisionsByCompletionId = new Map((state.srsTopics ?? []).map((topic) => [topic.completionId, topic]));
  const grouped = new Map<string, MonthlyArchiveStudiedTopic>();

  getMissionCompletionRecords(state).forEach((completion) => {
    const mission = missionsById.get(completion.missionId);
    const sourceTopic = mission?.specificTopic?.trim() || completion.title.trim();
    if (!sourceTopic) return;
    const subject = mission?.subject?.trim() || completion.subject?.trim() || "Unassigned";
    const localDate = toLocalDate(completion.completedAt, timezone);
    const key = `${subject.toLocaleLowerCase()}::${sourceTopic.toLocaleLowerCase()}`;
    const revision = revisionsByCompletionId.get(completion.id);
    const existing = grouped.get(key);
    if (existing) {
      existing.completedMissions += 1;
      if (completion.completedAt < existing.firstCompletedAt) {
        existing.firstCompletedAt = completion.completedAt;
        existing.firstMonthKey = localDate.slice(0, 7);
      }
      return;
    }
    grouped.set(key, {
      key,
      subject,
      topic: sourceTopic,
      firstCompletedAt: completion.completedAt,
      firstMonthKey: localDate.slice(0, 7),
      completedMissions: 1,
      revisionTopicId: revision?.id ?? null,
      revisionCompletionPercent: revision ? revisionPercent(revision) : null,
      revisionStatus: revision?.status === "completed" ? "completed" : revision ? "scheduled" : "not_enrolled",
    });
  });
  const topics = Array.from(grouped.values()).sort((left, right) => left.subject.localeCompare(right.subject) || left.topic.localeCompare(right.topic));
  studiedTopicsCache.set(state, topics);
  return topics;
}

/**
 * Lists only genuinely completed study topics, with their current existing revision-cadence
 * status. A topic without a revision record intentionally reports no percentage instead of
 * inventing study-completion progress.
 */
export function getMonthlyArchiveStudiedTopics(state: FocusState, period: ArchiveTopicPeriod = {}) {
  return getAllArchiveStudiedTopics(state).filter((topic) => {
    if (period.monthKey) return topic.firstMonthKey === period.monthKey;
    if (period.year) return Number(topic.firstMonthKey.slice(0, 4)) === period.year;
    return true;
  });
}
