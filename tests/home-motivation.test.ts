import { describe, expect, it } from "vitest";

import type { EmotionalPatternForecast } from "../lib/focus-command";
import { getForecastMotivationMessages } from "../lib/home-motivation";

function forecast(outlook: EmotionalPatternForecast["outlook"], available = true): EmotionalPatternForecast {
  return {
    available,
    outlook,
    score: 55,
    confidence: "emerging",
    sampleSize: 5,
    headline: "Pattern forecast",
    detail: "Private on-device reflection summary.",
    signals: [],
  };
}

describe("Home forecast motivation", () => {
  it("returns outlook-specific short messages instead of a fixed home prompt", () => {
    const momentum = getForecastMotivationMessages(forecast("momentum"));
    const fragile = getForecastMotivationMessages(forecast("fragile"));

    // Verify both outlooks generate valid insights
    expect(momentum.length).toBeGreaterThan(0);
    expect(fragile.length).toBeGreaterThan(0);
    expect(momentum[0]?.headline).toBeDefined();
    expect(fragile[0]?.headline).toBeDefined();
    expect(momentum[0]?.headline.length).toBeGreaterThan(0);
    expect(fragile[0]?.headline.length).toBeGreaterThan(0);
    
    // Verify they generate different insights
    const momentumHeadline = momentum[0]?.headline.toLowerCase() ?? "";
    const fragileHeadline = fragile[0]?.headline.toLowerCase() ?? "";
    expect(momentumHeadline).not.toEqual(fragileHeadline);
  });

  it("uses an inviting setup message while the free forecast has no data", () => {
    const warming = getForecastMotivationMessages(forecast("warming_up", false));
    expect(warming.length).toBeGreaterThan(0);
    expect(warming[0]?.headline.length).toBeGreaterThan(0);
    expect(warming[0]?.detail.length).toBeGreaterThan(0);
  });
});
