import { getMissionCompletionRecordsInLocalDateRange, toLocalDate, type DistractionLogEntry, type FocusState, type Reflection } from "./focus-command";
import { DISTRACTION_CATEGORY_LABELS } from "./distraction-log";
import { getMonthlyArchiveStudiedTopics, type MonthlyArchiveStudiedTopic } from "./monthly-command-archive";

const DAY_MS = 24 * 60 * 60 * 1000;

const FEELING_LABELS: Record<NonNullable<Reflection["feelingAfter"]>, string> = {
  drained: "Drained",
  restless: "Restless",
  steady: "Steady",
  charged: "Charged",
  great: "Great",
};

export interface WeeklyAfterActionReview {
  weekStart: string;
  weekEnd: string;
  completedMissions: number;
  investedMs: number;
  scheduledPlans: number;
  completedPlans: number;
  missedPlans: Array<{ id: string; title: string; dueDate: string }>;
  strongestSubject: { label: string; durationMs: number } | null;
  reflection: {
    count: number;
    mostCommonFeeling: string | null;
    averageFocus: number | null;
    energyShift: number | null;
    lowestSignal: { label: string; value: number } | null;
  };
  friction: {
    total: number;
    topCategory: string | null;
    topCategoryCount: number;
    timeWindow: string | null;
  };
  revision: {
    activities: MonthlyArchiveStudiedTopic[];
    uniqueTopicCount: number;
  };
  recommendation: string;
}

function addLocalDays(localDate: string, days: number) {
  const [year, month, day] = localDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function getWeekRange(now: Date, timezone: string) {
  const localToday = toLocalDate(now.toISOString(), timezone);
  const weekday = new Date(`${localToday}T12:00:00Z`).getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const weekStart = addLocalDays(localToday, mondayOffset);
  return { localToday, weekStart, weekEnd: addLocalDays(weekStart, 6) };
}

function isInRange(localDate: string, start: string, end: string) {
  return localDate >= start && localDate <= end;
}

function getTimeWindow(entry: DistractionLogEntry, timezone: string) {
  const hourPart = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "2-digit", hour12: false })
    .formatToParts(new Date(entry.occurredAt))
    .find((part) => part.type === "hour")?.value;
  const hour = Number(hourPart ?? 0);
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 22) return "Evening";
  return "Night";
}

function average(values: Array<number | undefined | null>) {
  const present = values.filter((value): value is number => typeof value === "number");
  return present.length ? present.reduce((total, value) => total + value, 0) / present.length : null;
}

export function getWeeklyAfterActionReview(state: FocusState, now = new Date()): WeeklyAfterActionReview {
  const timezone = state.profile.timezone;
  const { localToday, weekStart, weekEnd } = getWeekRange(now, timezone);
  const completions = getMissionCompletionRecordsInLocalDateRange(state, weekStart, weekEnd, timezone);
  const completedMissionIds = new Set(completions.map((completion) => completion.missionId));
  const scheduledMissionRows = state.missions.filter((mission) => mission.dueAt && isInRange(toLocalDate(mission.dueAt, timezone), weekStart, weekEnd));
  const completedPlans = scheduledMissionRows.filter((mission) => mission.status === "completed" || completedMissionIds.has(mission.id)).length;
  const missedPlans = state.missions
    .filter((mission) => mission.dueAt && toLocalDate(mission.dueAt, timezone) < localToday && mission.status !== "completed" && !completedMissionIds.has(mission.id))
    .sort((left, right) => (left.dueAt ?? "").localeCompare(right.dueAt ?? ""))
    .map((mission) => ({ id: mission.id, title: mission.title, dueDate: toLocalDate(mission.dueAt!, timezone) }));

  const subjectTotals = new Map<string, number>();
  completions.forEach((completion) => {
    const subject = completion.subject.trim() || "Unspecified";
    subjectTotals.set(subject, (subjectTotals.get(subject) ?? 0) + completion.durationMs);
  });
  const strongestSubject = Array.from(subjectTotals.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0];

  const reflections = completions.map((completion) => completion.reflection).filter((reflection): reflection is Reflection => Boolean(reflection));
  const feelingCounts = new Map<string, number>();
  reflections.forEach((reflection) => {
    if (reflection.feelingAfter) feelingCounts.set(FEELING_LABELS[reflection.feelingAfter], (feelingCounts.get(FEELING_LABELS[reflection.feelingAfter]) ?? 0) + 1);
  });
  const mostCommonFeeling = Array.from(feelingCounts.entries()).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] ?? null;
  const averageFocus = average(reflections.map((reflection) => reflection.focusQuality));
  const energyShiftValues = reflections
    .filter((reflection) => typeof reflection.energyBefore === "number" && typeof reflection.energyAfter === "number")
    .map((reflection) => reflection.energyAfter! - reflection.energyBefore!);
  const energyShift = average(energyShiftValues);
  const reflectionSignals = [
    { label: "Focus", value: averageFocus },
    { label: "Clarity", value: average(reflections.map((reflection) => reflection.clarityLevel)) },
    { label: "Motivation", value: average(reflections.map((reflection) => reflection.motivationLevel)) },
  ].filter((signal): signal is { label: string; value: number } => typeof signal.value === "number");
  const lowestSignal = reflectionSignals.sort((left, right) => left.value - right.value || left.label.localeCompare(right.label))[0] ?? null;

  const weeklyFriction = state.distractionLogs.filter((entry) => isInRange(toLocalDate(entry.occurredAt, timezone), weekStart, weekEnd));
  const categoryCounts = new Map<string, number>();
  const timeWindowCounts = new Map<string, number>();
  weeklyFriction.forEach((entry) => {
    const label = DISTRACTION_CATEGORY_LABELS[entry.category];
    categoryCounts.set(label, (categoryCounts.get(label) ?? 0) + 1);
    const timeWindow = getTimeWindow(entry, timezone);
    timeWindowCounts.set(timeWindow, (timeWindowCounts.get(timeWindow) ?? 0) + 1);
  });
  const topCategory = Array.from(categoryCounts.entries()).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0];
  const timeWindow = Array.from(timeWindowCounts.entries()).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] ?? null;
  const revisionActivities = getMonthlyArchiveStudiedTopics(state, { lifetime: true })
    .filter((activity) => isInRange(activity.actionDate, weekStart, weekEnd));
  const uniqueRevisionTopicCount = new Set(revisionActivities.map((activity) => activity.revisionTopicId)).size;

  const strongest = strongestSubject ? { label: strongestSubject[0], durationMs: strongestSubject[1] } : null;
  const totalInvestedMs = completions.reduce((total, completion) => total + completion.durationMs, 0);
  const recommendation = missedPlans[0]
    ? `Complete “${missedPlans[0].title}” before adding a new plan.`
    : strongest && totalInvestedMs < 3 * 60 * 60 * 1000
      ? `Protect one focused ${strongest.label} block early next week.`
      : topCategory
        ? `Protect your next focus block from ${topCategory[0].toLowerCase()} distractions.`
        : lowestSignal && lowestSignal.value < 3.5
          ? `Support your ${lowestSignal.label.toLowerCase()} before your next longer mission.`
          : "Choose one mission to start next week with a clear first step.";

  return {
    weekStart,
    weekEnd,
    completedMissions: completions.length,
    investedMs: totalInvestedMs,
    scheduledPlans: scheduledMissionRows.length,
    completedPlans,
    missedPlans,
    strongestSubject: strongest,
    reflection: { count: reflections.length, mostCommonFeeling, averageFocus, energyShift, lowestSignal },
    friction: { total: weeklyFriction.length, topCategory: topCategory?.[0] ?? null, topCategoryCount: topCategory?.[1] ?? 0, timeWindow },
    revision: { activities: revisionActivities, uniqueTopicCount: uniqueRevisionTopicCount },
    recommendation,
  };
}

export function formatWeeklyRange(weekStart: string, weekEnd: string) {
  const formatDate = (localDate: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${localDate}T12:00:00Z`));
  return `${formatDate(weekStart)} – ${formatDate(weekEnd)}`;
}

export const WEEKLY_REVIEW_DAY_MS = DAY_MS;
