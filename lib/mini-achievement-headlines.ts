import type { WallOfFameEntry } from "@/lib/focus-command";

export const MINI_ACHIEVEMENT_HEADLINE_INTERVAL_MS = 4_600;

export interface MiniAchievementHeadline {
  id: string;
  title: string;
  rating: number;
  occurredAt: string;
}

const SUMMARY_MAX_LENGTH = 42;
const SUMMARY_STOP_WORDS = new Set(["a", "an", "and", "at", "by", "for", "from", "in", "of", "on", "the", "to", "with"]);

/**
 * Preserves the complete achievement in storage and accessibility labels, while
 * keeping unusually long headline copy legible inside the compact Home ticker.
 */
export function getMiniAchievementTickerSummary(title: string): string {
  const normalized = title.trim().replace(/\s+/g, " ");
  if (normalized.length <= SUMMARY_MAX_LENGTH) return normalized;

  const meaningfulWords = normalized
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(" ")
    .filter((word) => word.length > 0 && !SUMMARY_STOP_WORDS.has(word.toLowerCase()));

  return meaningfulWords.slice(0, 2).join(" ") || normalized;
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
