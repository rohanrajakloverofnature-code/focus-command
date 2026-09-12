import { toLocalDate, type CorePrincipleDailyCheckIn } from "./focus-command";

export type CorePrinciplesRange =
  | { kind: "week" | "month" | "lifetime" }
  | { kind: "custom"; startDate: string; endDate: string };

export type CorePrinciplesSummary = {
  checked: number;
  applicable: number;
  successRatio: number | null;
  recordedDays: number;
};

function startOfWeek(localDate: string): string {
  const date = new Date(`${localDate}T12:00:00Z`);
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1));
  return date.toISOString().slice(0, 10);
}

export function isCorePrinciplesDateInRange(
  localDate: string,
  range: CorePrinciplesRange,
  timezone: string,
  now = new Date(),
): boolean {
  if (range.kind === "lifetime") return true;
  if (range.kind === "custom") {
    return /^\d{4}-\d{2}-\d{2}$/.test(range.startDate)
      && /^\d{4}-\d{2}-\d{2}$/.test(range.endDate)
      && range.startDate <= range.endDate
      && localDate >= range.startDate
      && localDate <= range.endDate;
  }
  const today = toLocalDate(now.toISOString(), timezone);
  if (range.kind === "week") return localDate >= startOfWeek(today) && localDate <= today;
  return localDate.slice(0, 7) === today.slice(0, 7);
}

export function getCorePrinciplesCheckInsInRange(
  checkIns: readonly CorePrincipleDailyCheckIn[],
  range: CorePrinciplesRange,
  timezone: string,
  now = new Date(),
): CorePrincipleDailyCheckIn[] {
  return checkIns
    .filter((checkIn) => isCorePrinciplesDateInRange(checkIn.localDate, range, timezone, now))
    .slice()
    .sort((left, right) => left.localDate.localeCompare(right.localDate));
}

export function getCorePrinciplesSummary(checkIns: readonly CorePrincipleDailyCheckIn[]): CorePrinciplesSummary {
  const applicable = checkIns.reduce((total, checkIn) => total + checkIn.items.length, 0);
  const checked = checkIns.reduce((total, checkIn) => total + checkIn.items.filter((item) => item.checked).length, 0);
  return {
    checked,
    applicable,
    successRatio: applicable ? checked / applicable : null,
    recordedDays: checkIns.length,
  };
}

export function getCorePrinciplesDailyTrend(checkIns: readonly CorePrincipleDailyCheckIn[]) {
  return checkIns.map((checkIn) => {
    const summary = getCorePrinciplesSummary([checkIn]);
    return {
      localDate: checkIn.localDate,
      ratio: Math.round((summary.successRatio ?? 0) * 100),
      checked: summary.checked,
      applicable: summary.applicable,
    };
  });
}

export function getMostUncheckedCorePrinciples(checkIns: readonly CorePrincipleDailyCheckIn[], limit = 5) {
  const insights = new Map<string, { itemId: string; itemText: string; listTitle: string; uncheckedDays: number; recordedDays: number }>();
  for (const checkIn of checkIns) {
    for (const item of checkIn.items) {
      const current = insights.get(item.itemId) ?? {
        itemId: item.itemId,
        itemText: item.itemText,
        listTitle: item.listTitle,
        uncheckedDays: 0,
        recordedDays: 0,
      };
      current.recordedDays += 1;
      if (!item.checked) current.uncheckedDays += 1;
      insights.set(item.itemId, current);
    }
  }
  return Array.from(insights.values())
    .filter((item) => item.uncheckedDays > 0)
    .sort((left, right) => right.uncheckedDays - left.uncheckedDays || right.recordedDays - left.recordedDays || left.itemText.localeCompare(right.itemText))
    .slice(0, limit);
}

export function getCorePrinciplesListInsights(checkIns: readonly CorePrincipleDailyCheckIn[]) {
  const insights = new Map<string, { listId: string; listTitle: string; checked: number; applicable: number }>();
  for (const checkIn of checkIns) {
    for (const item of checkIn.items) {
      const current = insights.get(item.listId) ?? { listId: item.listId, listTitle: item.listTitle, checked: 0, applicable: 0 };
      current.applicable += 1;
      if (item.checked) current.checked += 1;
      insights.set(item.listId, current);
    }
  }
  return Array.from(insights.values())
    .map((item) => ({ ...item, successRatio: item.applicable ? item.checked / item.applicable : 0 }))
    .sort((left, right) => right.successRatio - left.successRatio || right.applicable - left.applicable || left.listTitle.localeCompare(right.listTitle));
}
