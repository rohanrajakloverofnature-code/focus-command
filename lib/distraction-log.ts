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

export function getFocusFrictionInsight(state: FocusState, now = new Date()): FocusFrictionInsight {
  const cutoff = now.getTime() - 14 * 24 * 60 * 60 * 1000;
  const entries = state.distractionLogs.filter((entry) => {
    const occurredAt = new Date(entry.occurredAt).getTime();
    return Number.isFinite(occurredAt) && occurredAt >= cutoff && occurredAt <= now.getTime();
  });
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
