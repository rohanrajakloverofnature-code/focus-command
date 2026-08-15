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

export const MONTHLY_ARCHIVE_REVISION_PROGRESS_FILTERS = [
  { id: "all", label: "All", percent: null },
  { id: "seed_sown", label: "Seed Sown", percent: 0 },
  { id: "emerging", label: "Emerging", percent: 33 },
  { id: "developing", label: "Developing", percent: 67 },
  { id: "matured", label: "Matured", percent: 100 },
] as const;

export type MonthlyArchiveRevisionProgressFilter = typeof MONTHLY_ARCHIVE_REVISION_PROGRESS_FILTERS[number]["id"];

export interface MonthlyArchiveSubject {
  label: string;
  durationMs: number;
  completedMissions: number;
  xpEarned: number;
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

export interface MonthlyArchiveSubjectLifetimePoint extends MonthlyArchiveLifetimePoint {
  xpEarned: number;
  investedMs: number;
  completedMissions: number;
}

export interface MonthlyArchiveMonthComparisonMetric {
  key: "xp" | "gold" | "time" | "missions" | "focus" | "clarity" | "motivation" | "feeling" | "distractions";
  label: string;
  firstValue: number;
  secondValue: number;
  delta: number;
}

export interface MonthlyArchiveMonthComparison {
  first: MonthlyCommandArchiveMonth;
  second: MonthlyCommandArchiveMonth;
  metrics: MonthlyArchiveMonthComparisonMetric[];
  subjects: Array<{
    label: string;
    firstInvestedMs: number;
    secondInvestedMs: number;
    firstCompletedMissions: number;
    secondCompletedMissions: number;
  }>;
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
  revisionStatus: "not_enrolled" | "scheduled" | "due" | "completed";
  revisionPhase: "seed_sown" | "emerging" | "developing" | "matured" | "not_enrolled";
}

export interface ArchiveTopicPeriod {
  year?: number;
  monthKey?: string;
  lifetime?: true;
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

interface ArchiveSourceCacheEntry {
  archive: MonthlyCommandArchive;
  timezone: string;
  missions: FocusState["missions"];
  reflections: FocusState["reflections"];
  progression: FocusState["progression"];
  transactions: FocusState["transactions"];
  distractionLogs: FocusState["distractionLogs"];
}

// State updates are immutable, but many routine interactions leave archive source
// arrays untouched. Reuse the same derived archive across those snapshots without
// persisting an index or altering the durable source-of-truth records.
const archiveSourceCache = new WeakMap<FocusState["missionCompletions"], ArchiveSourceCacheEntry>();

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

  const sourceCached = archiveSourceCache.get(state.missionCompletions);
  if (
    sourceCached
    && sourceCached.timezone === state.profile.timezone
    && sourceCached.missions === state.missions
    && sourceCached.reflections === state.reflections
    && sourceCached.progression === state.progression
    && sourceCached.transactions === state.transactions
    && sourceCached.distractionLogs === state.distractionLogs
  ) {
    archiveCache.set(state, sourceCached.archive);
    return sourceCached.archive;
  }

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
    const currentSubject = month.subjects.get(subject) ?? { label: subject, durationMs: 0, completedMissions: 0, xpEarned: 0 };
    month.subjects.set(subject, {
      label: subject,
      durationMs: currentSubject.durationMs + completion.durationMs,
      completedMissions: currentSubject.completedMissions + 1,
      xpEarned: currentSubject.xpEarned + (completion.progression?.powerAwarded ?? completion.baseXp),
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
  archiveSourceCache.set(state.missionCompletions, {
    archive,
    timezone,
    missions: state.missions,
    reflections: state.reflections,
    progression: state.progression,
    transactions: state.transactions,
    distractionLogs: state.distractionLogs,
  });
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

/**
 * Returns the exact existing workload for one subject in each existing lifetime point.
 * It intentionally does not reuse the all-subject growth score, because reflections and
 * distractions are not attributable to one particular subject.
 */
export function getMonthlyArchiveSubjectLifetimeWindows(
  archive: MonthlyCommandArchive,
  subject: string,
  monthsPerWindow = 24,
): MonthlyArchiveLifetimeWindow[] {
  const normalizedSubject = subject.trim().toLocaleLowerCase();
  if (!normalizedSubject) return getMonthlyArchiveLifetimeWindows(archive, monthsPerWindow);

  const subjectMonths = archive.years
    .flatMap((year) => year.months)
    .filter((month) => month.subjectBreakdown.some((entry) => entry.label.toLocaleLowerCase() === normalizedSubject));
  if (!subjectMonths.length) return [];
  const recorded = archive.years
    .flatMap((year) => year.months)
    .filter((month) => month.hasData)
    .sort((left, right) => left.key.localeCompare(right.key));
  if (!recorded.length) return [];

  const byKey = new Map(archive.years.flatMap((year) => year.months).map((month) => [month.key, month]));
  const points: MonthlyArchiveSubjectLifetimePoint[] = [];
  let { year, monthIndex } = recorded[0];
  const last = recorded[recorded.length - 1];
  while (year < last.year || (year === last.year && monthIndex <= last.monthIndex)) {
    const key = monthKey(year, monthIndex);
    const month = byKey.get(key);
    const entry = month?.subjectBreakdown.find((item) => item.label.toLocaleLowerCase() === normalizedSubject);
    points.push({
      key,
      label: monthIndex === 0 || monthIndex === 11 ? `${formatMonth(year, monthIndex, "short")} ${String(year).slice(-2)}` : "",
      // This score is a transparent subject-only activity index, not a substitute for the all-subject growth score.
      value: entry ? Math.round(Math.min(100,
        Math.min(40, entry.completedMissions * 20)
        + Math.min(40, entry.xpEarned / 2)
        + Math.min(20, (entry.durationMs / 3_600_000) * 10),
      )) : 0,
      xpEarned: entry?.xpEarned ?? 0,
      investedMs: entry?.durationMs ?? 0,
      completedMissions: entry?.completedMissions ?? 0,
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
      key: `${subject}:${first.key}:${final.key}`,
      label: first.year === final.year ? `${first.year}` : `${first.year}–${final.year}`,
      points: windowPoints,
    });
  }
  return windows;
}

/** Produces a read-only comparison between two actual archive months. */
export function getMonthlyArchiveMonthComparison(
  first: MonthlyCommandArchiveMonth,
  second: MonthlyCommandArchiveMonth,
): MonthlyArchiveMonthComparison {
  const metricKeys: MonthlyArchiveMonthComparisonMetric["key"][] = ["xp", "gold", "time", "missions", "focus", "clarity", "motivation", "feeling", "distractions"];
  const metrics = metricKeys.map((key) => {
    const firstValue = getMonthlyArchiveMetricValue(first, key);
    const secondValue = getMonthlyArchiveMetricValue(second, key);
    return { key, label: getMonthlyArchiveMetricLabel(key), firstValue, secondValue, delta: secondValue - firstValue };
  });
  const firstSubjects = new Map(first.subjectBreakdown.map((entry) => [entry.label, entry]));
  const secondSubjects = new Map(second.subjectBreakdown.map((entry) => [entry.label, entry]));
  const labels = Array.from(new Set([...firstSubjects.keys(), ...secondSubjects.keys()])).sort((left, right) => left.localeCompare(right));
  return {
    first,
    second,
    metrics,
    subjects: labels.map((label) => ({
      label,
      firstInvestedMs: firstSubjects.get(label)?.durationMs ?? 0,
      secondInvestedMs: secondSubjects.get(label)?.durationMs ?? 0,
      firstCompletedMissions: firstSubjects.get(label)?.completedMissions ?? 0,
      secondCompletedMissions: secondSubjects.get(label)?.completedMissions ?? 0,
    })),
  };
}

function revisionPercent(topic: FocusState["srsTopics"][number]) {
  if (topic.status === "completed") return 100;
  return [0, 33, 67][Math.max(0, Math.min(2, topic.stage))] ?? 0;
}

function revisionPhase(percent: number): MonthlyArchiveStudiedTopic["revisionPhase"] {
  if (percent >= 100) return "matured";
  if (percent >= 67) return "developing";
  if (percent >= 33) return "emerging";
  return "seed_sown";
}

function getAllArchiveStudiedTopics(state: FocusState) {
  const cached = studiedTopicsCache.get(state);
  if (cached) return cached;
  const timezone = state.profile.timezone;
  const topics = (state.srsTopics ?? [])
    .map((revision) => {
      const loggedAt = revision.createdAt;
      const percent = revisionPercent(revision);
      return {
        key: revision.id,
        subject: revision.subject.trim() || "General",
        topic: revision.topic.trim(),
        firstCompletedAt: loggedAt,
        firstMonthKey: toLocalDate(loggedAt, timezone).slice(0, 7),
        completedMissions: revision.completionId ? 1 : 0,
        revisionTopicId: revision.id,
        revisionCompletionPercent: percent,
        revisionStatus: revision.status,
        revisionPhase: revisionPhase(percent),
      } satisfies MonthlyArchiveStudiedTopic;
    })
    .filter((topic) => Boolean(topic.topic))
    .sort((left, right) => left.subject.localeCompare(right.subject) || left.topic.localeCompare(right.topic) || left.firstCompletedAt.localeCompare(right.firstCompletedAt));
  studiedTopicsCache.set(state, topics);
  return topics;
}

/**
 * Lists real saved spaced-revision topics. Period membership uses the local date that a topic
 * entered the existing review loop, never a mission title or a reconstructed completion record.
 */
export function getMonthlyArchiveStudiedTopics(state: FocusState, period: ArchiveTopicPeriod = {}) {
  return getAllArchiveStudiedTopics(state).filter((topic) => {
    if (period.monthKey) return topic.firstMonthKey === period.monthKey;
    if (period.year) return Number(topic.firstMonthKey.slice(0, 4)) === period.year;
    return true;
  });
}

/** Filters an already-derived local topic list without changing archive state or doing network work. */
export function filterMonthlyArchiveStudiedTopics(topics: MonthlyArchiveStudiedTopic[], query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return topics;
  return topics.filter((topic) => topic.topic.toLocaleLowerCase().includes(normalizedQuery) || topic.subject.toLocaleLowerCase().includes(normalizedQuery));
}

/** Filters real revision topics by their existing Day 1/7/30/completed cadence progress. */
export function filterMonthlyArchiveStudiedTopicsByProgress(topics: MonthlyArchiveStudiedTopic[], progress: MonthlyArchiveRevisionProgressFilter) {
  if (progress === "all") return topics;
  return topics.filter((topic) => topic.revisionPhase === progress);
}
