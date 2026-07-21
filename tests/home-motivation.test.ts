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

    expect(momentum).toHaveLength(3);
    expect(fragile).toHaveLength(3);
    expect(momentum.map((message) => message.headline)).not.toEqual(fragile.map((message) => message.headline));
    expect(momentum[0]?.headline).toContain("momentum");
    expect(fragile[0]?.headline).toContain("friction");
  });

  it("uses an inviting setup message while the free forecast has no data", () => {
    const warming = getForecastMotivationMessages(forecast("warming_up", false));
    expect(warming[0]?.headline).toContain("first signal");
    expect(warming.map((message) => `${message.headline} ${message.detail}`).join(" ").toLowerCase()).not.toContain("diagnos");
  });
});
