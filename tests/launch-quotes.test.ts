import { describe, expect, it } from "vitest";

import type { EmotionalPatternForecast, WellbeingInsight } from "../lib/focus-command";
import { getLaunchQuoteThemes, nextLaunchQuoteHistory, parseLaunchQuoteHistory, selectLaunchQuote } from "../lib/launch-quotes";

function forecast(outlook: EmotionalPatternForecast["outlook"], available = true): EmotionalPatternForecast {
  return { available, outlook, score: 72, confidence: "grounded", sampleSize: 9, headline: "Pattern forecast", detail: "Private on-device reflection summary.", signals: [] };
}

function wellbeing(overrides: Partial<WellbeingInsight> = {}): WellbeingInsight {
  return {
    available: true,
    sampleSize: 9,
    confidence: "grounded",
    balanceScore: 72,
    headline: "Wellbeing insight",
    summary: "Private reflection summary.",
    method: "Logged ratings only.",
    disclaimer: "Not a medical assessment.",
    trend: { direction: "rising", change: 12, summary: "Improving", recentWindow: 4, earlierWindow: 5 },
    signals: [
      { id: "focus", label: "Focus quality", role: "supportive", average: 4.1, observations: 9, trend: "rising", detail: "Focus" },
      { id: "clarity", label: "Clarity", role: "supportive", average: 4.0, observations: 9, trend: "rising", detail: "Clarity" },
      { id: "stress", label: "Stress load", role: "load", average: 2.1, observations: 9, trend: "steady", detail: "Stress" },
      { id: "distraction", label: "Distraction load", role: "load", average: 2.2, observations: 9, trend: "steady", detail: "Distraction" },
      { id: "friction", label: "Task friction", role: "load", average: 2.0, observations: 9, trend: "steady", detail: "Friction" },
    ],
    records: [],
    ...overrides,
  };
}

describe("Launch quote selection", () => {
  it("maps supportive rising data to different contextual themes than elevated load", () => {
    const supportiveThemes = getLaunchQuoteThemes(forecast("momentum"), wellbeing());
    const strainedThemes = getLaunchQuoteThemes(forecast("fragile"), wellbeing({ balanceScore: 31, trend: { direction: "easing", change: -18, summary: "Easing", recentWindow: 4, earlierWindow: 5 } }));

    expect(supportiveThemes).toContain("momentum");
    expect(strainedThemes).toContain("recovery");
    expect(supportiveThemes).not.toEqual(strainedThemes);
  });

  it("avoids the latest selected quote when contextual alternatives exist", () => {
    const first = selectLaunchQuote({ forecast: forecast("steady"), wellbeing: wellbeing(), seed: 4 });
    const second = selectLaunchQuote({ forecast: forecast("steady"), wellbeing: wellbeing(), recentQuoteIds: [first.id], seed: 4 });

    expect(second.id).not.toBe(first.id);
  });

  it("uses an inviting first-step fallback when no pattern data exists", () => {
    const noDataForecast = forecast("warming_up", false);
    const noDataWellbeing = wellbeing({ available: false, balanceScore: 0, signals: [], trend: { direction: "steady", change: 0, summary: "More data needed", recentWindow: 0, earlierWindow: 0 } });
    const selected = selectLaunchQuote({ forecast: noDataForecast, wellbeing: noDataWellbeing, seed: 0 });

    expect(selected.theme).toBe("first_steps");
    expect(selected.text.length).toBeGreaterThan(20);
  });

  it("recovers safely from malformed persisted history and keeps the most recent distinct IDs", () => {
    expect(parseLaunchQuoteHistory("not-json")).toEqual([]);
    expect(nextLaunchQuoteHistory(["a", "b", "a"], "c")).toEqual(["a", "b", "c"]);
  });
});
