import type { WallOfFameEntry } from "@/lib/focus-command";

export const MINI_ACHIEVEMENT_HEADLINE_INTERVAL_MS = 4_600;

export interface MiniAchievementHeadline {
  id: string;
  title: string;
  rating: number;
  occurredAt: string;
}

const SUMMARY_STOP_WORDS = new Set(["a", "an", "and", "at", "by", "for", "from", "in", "of", "on", "the", "to", "with"]);
const SUMMARY_MAX_WORDS = 3;

type SemanticCategory = { value: string; patterns: readonly RegExp[] };

const EMOTION_CATEGORIES: readonly SemanticCategory[] = [
  { value: "GREAT", patterns: [/\bgreat\b/i, /\bproud\b/i, /\bhappy\b/i, /\bjoy\b/i] },
  { value: "CLEAR", patterns: [/\bclear(?:ity)?\b/i, /\bsharp\b/i] },
  { value: "CALM", patterns: [/\bcalm\b/i, /\bsettled\b/i, /\bsteady\b/i] },
  { value: "DRIVEN", patterns: [/\bmotivated?\b/i, /\bdrive\b/i, /\benerg(?:y|ized)\b/i] },
  { value: "STRONG", patterns: [/\bconfident\b/i, /\bstrong\b/i, /\bbrave\b/i] },
];

const ACTIVITY_CATEGORIES: readonly SemanticCategory[] = [
  { value: "STUDY", patterns: [/\bstud(?:y|ied|ying)\b/i, /\blearn(?:ed|ing)?\b/i, /\bread(?:ing)?\b/i, /\bnotes?\b/i] },
  { value: "REVIEW", patterns: [/\brevis(?:e|ed|ing|ion)\b/i, /\breview(?:ed|ing)?\b/i] },
  { value: "FOCUS", patterns: [/\bfocus(?:ed|ing)?\b/i, /\bdeep work\b/i, /\bdistraction[- ]free\b/i] },
  { value: "PRACTICE", patterns: [/\bpracti[cs](?:e|ed|ing)?\b/i] },
  { value: "COMMAND", patterns: [/\bmission\b/i, /\btask\b/i, /\bcommand\b/i] },
  { value: "TRAINING", patterns: [/\bworkout\b/i, /\bexercise\b/i, /\btraining\b/i] },
  { value: "JOURNAL", patterns: [/\bjournal(?:ed|ing)?\b/i, /\breflect(?:ed|ing|ion)?\b/i] },
  { value: "WRITING", patterns: [/\bwriting\b/i, /\bwrote\b/i, /\bwrite\b/i] },
];

const OUTCOME_CATEGORIES: readonly SemanticCategory[] = [
  { value: "SUMS", patterns: [/\bsums?\b/i, /\bquestions?\b/i, /\bproblems?\b/i] },
  { value: "STREAK", patterns: [/\bstreak\b/i, /\bcombo\b/i] },
  { value: "BLOCK", patterns: [/\bblock\b/i, /\bsession\b/i] },
  { value: "DONE", patterns: [/\bcomplet(?:e|ed|ing|ion)\b/i, /\bfinish(?:ed|ing)?\b/i, /\bsolved?\b/i] },
  { value: "HELD", patterns: [/\bheld\b/i, /\bmaintain(?:ed|ing)?\b/i, /\bsustain(?:ed|ing)?\b/i] },
  { value: "RETURN", patterns: [/\breturn(?:ed|ing)?\b/i, /\breset\b/i, /\brecover(?:ed|y|ing)?\b/i] },
];

function findSemanticValue(text: string, categories: readonly SemanticCategory[]) {
  return categories.find((category) => category.patterns.some((pattern) => pattern.test(text)))?.value;
}

function countSemanticWords(value: string) {
  return value.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
}

function fallbackSemanticWords(text: string) {
  return text
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1 && !SUMMARY_STOP_WORDS.has(word.toLowerCase()))
    .slice(0, SUMMARY_MAX_WORDS)
    .map((word) => word.toUpperCase());
}

/**
 * Preserves the complete achievement in storage and accessibility labels, while
 * keeping unusually long headline copy legible inside the compact Home ticker.
 */
export function getMiniAchievementTickerSummary(title: string): string {
  const normalized = title.trim().replace(/\s+/g, " ");
  if (!normalized) return "ACHIEVEMENT UNLOCKED";

  const emotion = findSemanticValue(normalized, EMOTION_CATEGORIES);
  const activity = findSemanticValue(normalized, ACTIVITY_CATEGORIES);
  const outcome = findSemanticValue(normalized, OUTCOME_CATEGORIES);
  const words = [emotion, activity, outcome].filter((word): word is string => Boolean(word)).slice(0, SUMMARY_MAX_WORDS);

  if (words.length === 3 && outcome && words[2] === outcome) return `${words[0]} ${words[1]} & ${words[2]}`;
  if (words.length) return words.join(" ");

  const fallback = fallbackSemanticWords(normalized);
  return fallback.join(" ") || "ACHIEVEMENT UNLOCKED";
}

/** Semantic ticker labels are always capped at three real words; an ampersand is only a visual connector. */
export function isMiniAchievementTickerSummaryCompact(summary: string) {
  return countSemanticWords(summary) <= SUMMARY_MAX_WORDS;
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
