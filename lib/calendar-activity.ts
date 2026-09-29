import type { CalendarActivity } from "@/lib/focus-command";
import { addLocalDays, compareLocalDates, isIsoLocalDate } from "./calendar-date";

export type CalendarCompletionPoint = {
  localDate: string;
  total: number;
  completed: number;
  pending: number;
  percentage: number | null;
};

export function getCalendarCompletionPoint(activities: CalendarActivity[], localDate: string): CalendarCompletionPoint {
  const day = activities.filter((activity) => activity.localDate === localDate);
  const completed = day.filter((activity) => Boolean(activity.completedAt)).length;
  return { localDate, total: day.length, completed, pending: day.length - completed, percentage: day.length ? Math.round((completed / day.length) * 100) : null };
}

export function getCalendarCompletionSeries(activities: CalendarActivity[], startDate: string, endDate: string): CalendarCompletionPoint[] {
  if (!isIsoLocalDate(startDate) || !isIsoLocalDate(endDate) || compareLocalDates(startDate, endDate) > 0) return [];
  const series: CalendarCompletionPoint[] = [];
  for (let date = startDate; date <= endDate; date = addLocalDays(date, 1)) {
    series.push(getCalendarCompletionPoint(activities, date));
    if (date === endDate) break;
  }
  return series;
}

export function getCalendarCompletionSummary(activities: CalendarActivity[], startDate: string, endDate: string) {
  const series = getCalendarCompletionSeries(activities, startDate, endDate);
  const planned = series.reduce((sum, point) => sum + point.total, 0);
  const completed = series.reduce((sum, point) => sum + point.completed, 0);
  const daysWithPlans = series.filter((point) => point.total > 0).length;
  return {
    series,
    planned,
    completed,
    pending: planned - completed,
    daysWithPlans,
    percentage: planned ? Math.round((completed / planned) * 100) : null,
  };
}

export function compareCalendarPeriods(current: CalendarCompletionPoint[], previous: CalendarCompletionPoint[]) {
  const currentValues = current.filter((point) => point.percentage !== null).map((point) => point.percentage as number);
  const previousValues = previous.filter((point) => point.percentage !== null).map((point) => point.percentage as number);
  const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
  const currentAverage = average(currentValues);
  const previousAverage = average(previousValues);
  return { currentAverage, previousAverage, delta: currentAverage !== null && previousAverage !== null ? currentAverage - previousAverage : null };
}

export type CalendarComparisonKind = "yesterday" | "week" | "month" | "year";

export function getCalendarComparison(kind: CalendarComparisonKind, endDate: string, activities: CalendarActivity[]) {
  if (!isIsoLocalDate(endDate)) return compareCalendarPeriods([], []);
  let startDate = endDate;
  let currentEnd = endDate;
  if (kind === "week") startDate = addLocalDays(endDate, -6);
  if (kind === "month") startDate = `${endDate.slice(0, 8)}01`;
  if (kind === "year") startDate = `${endDate.slice(0, 4)}-01-01`;
  const previousEnd = addLocalDays(startDate, -1);
  let previousStart = previousEnd;
  if (kind === "week") previousStart = addLocalDays(previousEnd, -6);
  if (kind === "month") previousStart = `${previousEnd.slice(0, 8)}01`;
  if (kind === "year") previousStart = `${previousEnd.slice(0, 4)}-01-01`;
  return compareCalendarPeriods(getCalendarCompletionSeries(activities, startDate, currentEnd), getCalendarCompletionSeries(activities, previousStart, previousEnd));
}
