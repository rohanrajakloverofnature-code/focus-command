import type { WallOfFameEntry } from "@/lib/focus-command";

export const MINI_ACHIEVEMENT_HEADLINE_INTERVAL_MS = 4_600;

export interface MiniAchievementHeadline {
  id: string;
  title: string;
  rating: number;
  occurredAt: string;
}

/**
 * Keeps Home recognition aligned with the canonical Wall of Fame window while
 * refusing incomplete or low-rated mini achievements for the compact headline.
 */
export function getMiniAchievementHeadlines(entries: readonly WallOfFameEntry[]): MiniAchievementHeadline[] {
  return entries
    .filter((entry) => entry.miniAchievementRating > 3 && entry.miniAchievement.trim().length > 0)
    .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt))
    .map((entry) => ({
      id: entry.id,
      title: entry.miniAchievement.trim(),
      rating: entry.miniAchievementRating,
      occurredAt: entry.occurredAt,
    }));
}

/** Returns zero for empty or single-item collections so they never rotate unnecessarily. */
export function getNextMiniAchievementHeadlineIndex(currentIndex: number, total: number) {
  if (total <= 1) return 0;
  return (currentIndex + 1) % total;
}
