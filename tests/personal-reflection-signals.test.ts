import { describe, expect, it } from "vitest";

import { createInitialState, normalizeHydratedState, type FocusState } from "../lib/focus-command";
import { getConsistencyScenario, getPersonalReflectionSignals } from "../lib/personal-reflection-signals";

function signalState(reflectionCount = 8): FocusState {
  const state = createInitialState();
  const reflections = Array.from({ length: reflectionCount }, (_, index) => ({
    id: `reflection_${index}`,
    missionId: "mission",
    createdAt: `2026-09-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`,
    feelingBefore: "steady" as const,
    feelingAfter: "charged" as const,
    frictionName: "",
    frictionRating: 2,
    provokingThought: "",
    provokingThoughtRating: 3,
    skills: [],
    miniAchievement: "",
    miniAchievementRating: 3,
    energyAfter: 4,
    focusQuality: 4,
    stressLevel: 2,
    clarityLevel: 4,
    motivationLevel: 4,
    distractionLevel: 2,
    customAnswers: { confidence: index % 2 ? 4 : 3, place: index % 2 ? "Library" : "Home", note: `Private note ${index + 1}` },
  }));
  return normalizeHydratedState({
    ...state,
    profile: { ...state.profile, timezone: "UTC", behavioralReflectionWindow: "lifetime" },
    customQuestions: [
      { id: "confidence", label: "How confident did you feel?", type: "rating", options: [], enabled: true, personalSignal: { enabled: true, role: "supportive", includeInProjection: true } },
      { id: "place", label: "Where did you work?", type: "single_choice", options: ["Home", "Library"], enabled: true },
      { id: "note", label: "What helped?", type: "text", options: [], enabled: true },
    ],
    reflections,
  });
}

describe("Personal Reflection Signals", () => {
  it("keeps custom ratings, choices, and notes in their truthful separate forms", () => {
    const signals = getPersonalReflectionSignals(signalState());

    expect(signals.map((signal) => signal.kind)).toEqual(["rating", "choice", "text"]);
    expect(signals[0]).toMatchObject({ kind: "rating", observations: { length: 8 } });
    expect(signals[1]).toMatchObject({ kind: "choice", answerCount: 8, responseCounts: [{ label: "Home", count: 4 }, { label: "Library", count: 4 }] });
    expect(signals[2]).toMatchObject({ kind: "text", answerCount: 8, recentAnswers: { length: 8 } });
  });

  it("requires complete built-in debrief data and a minimum sample before showing a conditional scenario", () => {
    const scenario = getConsistencyScenario(signalState(), 90);
    expect(scenario).toMatchObject({ available: true, sampleSize: 8, horizon: 90, customSignalCount: 1 });
    expect(scenario.points).toHaveLength(4);
    expect(scenario.points[0].label).toBe("NOW");
    expect(scenario.points.at(-1)?.label).toBe("+90D");
    expect(scenario.points.at(-1)?.upper).toBeGreaterThanOrEqual(scenario.points.at(-1)?.lower ?? 0);
    expect(getConsistencyScenario(signalState(7), 365)).toMatchObject({ available: false, sampleSize: 7, horizon: 365 });
  });
});
