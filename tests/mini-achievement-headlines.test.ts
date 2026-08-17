import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  getMiniAchievementTickerSummary,
  getMiniAchievementHeadlines,
  getNextMiniAchievementHeadlineIndex,
  isMiniAchievementTickerSummaryCompact,
  MINI_ACHIEVEMENT_HEADLINE_INTERVAL_MS,
} from "../lib/mini-achievement-headlines";
import type { WallOfFameEntry } from "../lib/focus-command";
import { MINI_ACHIEVEMENT_TICKER_LAYOUT, MINI_ACHIEVEMENT_WALL_OF_FAME_ROUTE } from "../lib/focus-layout";

const tickerSource = readFileSync(resolve(process.cwd(), "components/mini-achievement-ticker.tsx"), "utf8");
const homeSource = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");

const entry = (overrides: Partial<WallOfFameEntry> = {}): WallOfFameEntry => ({
  id: "entry_1",
  missionId: "mission_1",
  missionTitle: "Focus block",
  miniAchievement: "Held a distraction-free block",
  miniAchievementRating: 4,
  occurredAt: "2026-08-12T09:00:00.000Z",
  ...overrides,
});

describe("Mini Achievements headline selection", () => {
  it("renders no ticker items when no mini achievement exceeds 3.0", () => {
    expect(getMiniAchievementHeadlines([
      entry({ id: "three", miniAchievementRating: 3 }),
      entry({ id: "two", miniAchievementRating: 2 }),
    ])).toEqual([]);
  });

  it("keeps a sole eligible achievement static", () => {
    const headlines = getMiniAchievementHeadlines([entry({ id: "only", miniAchievementRating: 3.1 })]);

    expect(headlines).toEqual([
      expect.objectContaining({ id: "only", title: "Held a distraction-free block", rating: 3.1 }),
    ]);
    expect(getNextMiniAchievementHeadlineIndex(0, headlines.length)).toBe(0);
  });

  it("selects and cycles multiple eligible achievements newest first", () => {
    const headlines = getMiniAchievementHeadlines([
      entry({ id: "older", miniAchievement: "Returned after a difficult pause", miniAchievementRating: 4.2, occurredAt: "2026-08-10T09:00:00.000Z" }),
      entry({ id: "ineligible", miniAchievementRating: 3 }),
      entry({ id: "latest", miniAchievement: "Completed the final review", miniAchievementRating: 5, occurredAt: "2026-08-12T10:00:00.000Z" }),
    ]);

    expect(headlines.map((headline) => headline.id)).toEqual(["latest", "older"]);
    expect(getNextMiniAchievementHeadlineIndex(0, headlines.length)).toBe(1);
    expect(getNextMiniAchievementHeadlineIndex(1, headlines.length)).toBe(0);
  });

  it("uses a compact semantic summary instead of clipping initial title words", () => {
    expect(getMiniAchievementTickerSummary("Held a distraction-free block")).toBe("FOCUS BLOCK");
  });

  it("reduces emotion, activity, and outcome into the approved three-word semantic format without changing the saved title", () => {
    const fullTitle = "Feels great because I completed two hours of study and five sums";

    expect(getMiniAchievementTickerSummary(fullTitle)).toBe("GREAT STUDY & SUMS");
    expect(getMiniAchievementHeadlines([entry({ miniAchievement: fullTitle })])[0]?.title).toBe(fullTitle);
  });

  it("keeps every rendered summary at three real words or fewer, including fallback copy", () => {
    [
      "Completed a deep work review and maintained focus through the final reflection",
      "A beautifully focused command block with nothing else to prove",
      "",
    ].forEach((title) => expect(isMiniAchievementTickerSummaryCompact(getMiniAchievementTickerSummary(title))).toBe(true));
  });

  it("keeps the ticker in its protected header slot and preserves the Wall of Fame route", () => {
    expect(MINI_ACHIEVEMENT_TICKER_LAYOUT).toEqual({ height: 78, gap: 12, headerZoneMinHeight: 0 });
    expect(MINI_ACHIEVEMENT_WALL_OF_FAME_ROUTE).toBe("/analytics?metric=fame");
    expect(homeSource).toContain("<MiniAchievementTicker");
    expect(homeSource).toContain("router.push(MINI_ACHIEVEMENT_WALL_OF_FAME_ROUTE as never)");
    expect(tickerSource).toContain('accessibilityHint={onPress ? "Opens the Wall of Fame" : undefined}');
  });

  it("retains full-text compact fitting, cancellable typing, the rating badge, and the low-cost rotation cadence", () => {
    expect(tickerSource).toContain('adjustsFontSizeToFit minimumFontScale={0.76} numberOfLines={1} style={styles.title}');
    expect(tickerSource).toContain("const MINI_ACHIEVEMENT_TYPING_INTERVAL_MS = 32");
    expect(tickerSource).toContain("typingTimerRef");
    expect(tickerSource).toContain("if (reduceMotion) {");
    expect(tickerSource).toContain("clearTimeout(typingTimerRef.current)");
    expect(tickerSource).toContain('style={[styles.ratingBadge, { borderColor: `${resolvedAccentColor}35`, backgroundColor: `${resolvedAccentColor}18` }]}');
    expect(tickerSource).toContain("activeAchievement.rating.toFixed(1)");
    expect(tickerSource).toContain("setInterval(rotate, MINI_ACHIEVEMENT_HEADLINE_INTERVAL_MS)");
    expect(tickerSource).toContain("if (achievements.length <= 1 || reduceMotion) return;");
    expect(MINI_ACHIEVEMENT_HEADLINE_INTERVAL_MS).toBe(4_600);
  });

  it("keeps the approved premium collectible treatment inside the existing ticker bounds", () => {
    expect(tickerSource).toContain("export const MiniAchievementTicker = memo(function MiniAchievementTicker");
    expect(tickerSource).toContain("height: MINI_ACHIEVEMENT_TICKER_LAYOUT.height");
    expect(tickerSource).toContain("ambientGlow:");
    expect(tickerSource).toContain("topline:");
    expect(tickerSource).toContain("iconRing:");
    expect(tickerSource).toContain('borderColor: `${resolvedAccentColor}35`');
  });
});
