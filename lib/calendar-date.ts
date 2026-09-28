export type CalendarDateRange = {
  startDate: string;
  endDate: string;
};

export function isIsoLocalDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function compareLocalDates(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function isValidLocalDateRange(startDate: string, endDate: string): boolean {
  return isIsoLocalDate(startDate) && isIsoLocalDate(endDate) && compareLocalDates(startDate, endDate) <= 0;
}

export function addLocalDays(localDate: string, days: number): string {
  const [year, month, day] = localDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function localDateFromParts(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

export function localDateParts(localDate: string): { year: number; month: number; day: number } {
  const [year, month, day] = localDate.split("-").map(Number);
  return { year, month, day };
}

export function monthGrid(monthDate: string): string[] {
  const { year, month } = localDateParts(monthDate);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: firstWeekday + daysInMonth }, (_, index) => {
    if (index < firstWeekday) return "";
    return localDateFromParts(year, month, index - firstWeekday + 1);
  });
}

export function formatReadableLocalDate(localDate: string, withYear = true): string {
  if (!isIsoLocalDate(localDate)) return "Choose a date";
  const { year, month, day } = localDateParts(localDate);
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function formatMonthLabel(monthDate: string): string {
  const { year, month } = localDateParts(monthDate);
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(Date.UTC(year, month - 1, 1, 12)));
}
