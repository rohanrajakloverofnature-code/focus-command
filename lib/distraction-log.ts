import { DISTRACTION_CATEGORIES, type DistractionCategory, type FocusState } from "./focus-command";

export const DISTRACTION_CATEGORY_LABELS: Record<DistractionCategory, string> = {
  phone: "Phone",
  people: "People",
  environment: "Environment",
  thoughts: "Thoughts",
  energy: "Energy",
  other: "Other",
};

export interface FocusFrictionInsight {
  total: number;
  categoryCounts: Array<{ category: DistractionCategory; label: string; count: number }>;
  topCategory: { category: DistractionCategory; label: string; count: number } | null;
  timeWindow: string | null;
  recentMission: { title: string; count: number } | null;
}

export type FocusFrictionRange =
  | { kind: "week" }
  | { kind: "month" }
  | { kind: "last14Days" }
  | { kind: "custom"; startDate: string; endDate: string };

export interface FocusFrictionRangePresentation {
  label: string;
  valid: boolean;
  startDate?: string;
  endDate?: string;
}

export const DEFAULT_FOCUS_FRICTION_RANGE: FocusFrictionRange = { kind: "last14Days" };

function getLocalHour(iso: string, timezone: string) {
  const hour = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "2-digit", hour12: false }).formatToParts(new Date(iso)).find((part) => part.type === "hour")?.value;
  return Number(hour ?? 0);
}

function getTimeWindow(hour: number) {
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 22) return "Evening";
  return "Night";
}

function toLocalDate(iso: string, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

function isValidLocalDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function addLocalDays(date: string, amount: number) {
  const next = new Date(`${date}T12:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + amount);
  return next.toISOString().slice(0, 10);
}

function formatLocalDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00.000Z`)).toUpperCase();
}

export function getFocusFrictionRangePresentation(range: FocusFrictionRange, timezone: string, now = new Date()): FocusFrictionRangePresentation {
  if (range.kind === "last14Days") return { label: "LAST 14 DAYS", valid: true };
  const today = toLocalDate(now.toISOString(), timezone);
  if (range.kind === "month") {
    const startDate = `${today.slice(0, 8)}01`;
    return { label: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${startDate}T12:00:00.000Z`)).toUpperCase(), valid: true, startDate, endDate: today };
  }
  if (range.kind === "week") {
    const weekday = new Date(`${today}T12:00:00.000Z`).getUTCDay();
    const startDate = addLocalDays(today, weekday === 0 ? -6 : 1 - weekday);
    return { label: "THIS WEEK", valid: true, startDate, endDate: today };
  }
  if (!isValidLocalDate(range.startDate) || !isValidLocalDate(range.endDate) || range.startDate > range.endDate) {
    return { label: "CUSTOM RANGE", valid: false };
  }
  return { label: `${formatLocalDate(range.startDate)} – ${formatLocalDate(range.endDate)}`, valid: true, startDate: range.startDate, endDate: range.endDate };
}

export function getFocusFrictionInsight(state: FocusState, now = new Date(), range: FocusFrictionRange = DEFAULT_FOCUS_FRICTION_RANGE): FocusFrictionInsight {
  const presentation = getFocusFrictionRangePresentation(range, state.profile.timezone, now);
  const cutoff = now.getTime() - 14 * 24 * 60 * 60 * 1000;
  const entries = presentation.valid ? state.distractionLogs.filter((entry) => {
    const occurredAt = new Date(entry.occurredAt).getTime();
    if (!Number.isFinite(occurredAt) || occurredAt > now.getTime()) return false;
    if (range.kind === "last14Days") return occurredAt >= cutoff;
    const localDate = toLocalDate(entry.occurredAt, state.profile.timezone);
    return localDate >= (presentation.startDate ?? "") && localDate <= (presentation.endDate ?? "");
  }) : [];
  const categoryCounts = DISTRACTION_CATEGORIES.map((category) => ({
    category,
    label: DISTRACTION_CATEGORY_LABELS[category],
    count: entries.filter((entry) => entry.category === category).length,
  })).filter((entry) => entry.count > 0).sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
  const windowCounts = new Map<string, number>();
  const missionCounts = new Map<string, number>();
  entries.forEach((entry) => {
    const window = getTimeWindow(getLocalHour(entry.occurredAt, state.profile.timezone));
    windowCounts.set(window, (windowCounts.get(window) ?? 0) + 1);
    const title = state.missions.find((mission) => mission.id === entry.missionId)?.title ?? "Archived mission";
    missionCounts.set(title, (missionCounts.get(title) ?? 0) + 1);
  });
  const byCount = (left: [string, number], right: [string, number]) => right[1] - left[1] || left[0].localeCompare(right[0]);
  const mostInterruptedWindow = Array.from(windowCounts.entries()).sort(byCount)[0];
  const recentMission = Array.from(missionCounts.entries()).sort(byCount)[0];
  return {
    total: entries.length,
    categoryCounts,
    topCategory: categoryCounts[0] ?? null,
    timeWindow: mostInterruptedWindow?.[0] ?? null,
    recentMission: recentMission ? { title: recentMission[0], count: recentMission[1] } : null,
  };
}
