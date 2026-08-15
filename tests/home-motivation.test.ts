import { describe, expect, it } from "vitest";

import type { EmotionalPatternForecast, Reflection } from "../lib/focus-command";
import {
  EMOTION_PREDICTION_LIBRARY_COUNT,
  EMOTION_PREDICTION_TRACK_COUNT,
  PREDICTION_LABEL_MAX_LENGTH,
  getEmotionPredictionTrio,
} from "../lib/emotion-predictions";
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

function reflection(overrides: Partial<Reflection> = {}): Reflection {
  return {
    id: "reflection-1",
    missionId: "mission-1",
    createdAt: "2026-08-15T12:00:00.000Z",
    feelingBefore: "restless",
    feelingAfter: "steady",
    frictionName: "notifications",
    frictionRating: 2,
    provokingThought: "I am behind.",
    provokingThoughtRating: 2,
    skills: [],
    miniAchievement: "",
    miniAchievementRating: null,
    customAnswers: { setting: "quiet", interrupted: false },
    energyBefore: 3,
    energyAfter: 4,
    focusQuality: 4,
    stressLevel: 2,
    clarityLevel: 4,
    motivationLevel: 4,
    distractionLevel: 2,
    ...overrides,
  };
}

describe("Home forecast motivation", () => {
  it("returns five distinct emotion-only messages for every active forecast outlook", () => {
    const outlooks: EmotionalPatternForecast["outlook"][] = ["momentum", "steady", "recovery", "fragile", "warming_up"];
    for (const outlook of outlooks) {
      const messages = getForecastMotivationMessages(forecast(outlook, outlook !== "warming_up"), [reflection()]);
      expect(messages).toHaveLength(5);
      expect(new Set(messages.map((message) => `${message.headline}|${message.detail}`)).size).toBe(5);
      expect(messages.every((message) => message.headline.length > 0 && message.detail.length > 0)).toBe(true);
    }
  });

  it("changes the selected five-message sequence when the stored emotional reflection pattern changes", () => {
    const base = [reflection(), reflection({ id: "reflection-2", createdAt: "2026-08-15T14:00:00.000Z" }), reflection({ id: "reflection-3", createdAt: "2026-08-15T15:00:00.000Z" })];
    const changed = base.map((item, index) => index === 2 ? { ...item, frictionName: "phone pull", customAnswers: { setting: "busy", interrupted: true } } : item);
    const first = getForecastMotivationMessages(forecast("momentum"), base);
    const second = getForecastMotivationMessages(forecast("momentum"), changed);
    expect(second).not.toEqual(first);
  });

  it("uses a warming-up five-message pool while the forecast has too little data", () => {
    const warming = getForecastMotivationMessages(forecast("warming_up", false));
    expect(warming).toHaveLength(5);
    expect(new Set(warming.map((message) => message.headline)).size).toBe(5);
  });
});

describe("compact emotion prediction library", () => {
  it("contains the approved larger offline library and a safe compact label limit", () => {
    expect(EMOTION_PREDICTION_TRACK_COUNT).toBeGreaterThanOrEqual(16);
    expect(EMOTION_PREDICTION_LIBRARY_COUNT).toBeGreaterThanOrEqual(48);
    expect(PREDICTION_LABEL_MAX_LENGTH).toBe(11);
  });

  it("returns three distinct icon-paired predictions for one emotional profile", () => {
    const reflections = [reflection(), reflection({ id: "reflection-2" }), reflection({ id: "reflection-3" })];
    const trio = getEmotionPredictionTrio(forecast("momentum"), reflections);
    expect(trio).toHaveLength(3);
    expect(new Set(trio.map((prediction) => prediction.label)).size).toBe(3);
    expect(new Set(trio.map((prediction) => prediction.icon)).size).toBe(3);
    expect(trio.every((prediction) => prediction.label.length <= PREDICTION_LABEL_MAX_LENGTH)).toBe(true);
  });

  it("changes to a protective prediction track when emotional load becomes high", () => {
    const supportive = [reflection(), reflection({ id: "reflection-2" }), reflection({ id: "reflection-3" })];
    const highStress = supportive.map((item) => ({ ...item, stressLevel: 5, frictionRating: 4, distractionLevel: 4 }));
    const first = getEmotionPredictionTrio(forecast("momentum"), supportive);
    const second = getEmotionPredictionTrio(forecast("fragile"), highStress);
    expect(second.map((prediction) => prediction.track)).not.toEqual(first.map((prediction) => prediction.track));
    expect(second.every((prediction) => prediction.track === "Friction guard")).toBe(true);
    expect(second.some((prediction) => ["CLEAR SPACE", "BLOCK NOISE", "REMOVE DRAG"].includes(prediction.label))).toBe(true);
  });
});
