import { describe, expect, it } from "vitest";

import { createInitialState, getCalendarTimeAverages, getMissionCompletionRecords, normalizeHydratedState, type FocusState } from "../lib/focus-command";
import { filterInvestedTimeCompletions, getSavedSkillSuggestions } from "../lib/invested-time-filters";

function filteredState(): FocusState {
  const state = createInitialState();
  return normalizeHydratedState({
    ...state,
    profile: { ...state.profile, timezone: "UTC" },
    missions: [
      { id: "study_algebra", title: "Algebra practice", subject: "Math", category: "Study" },
      { id: "study_reading", title: "Physics reading", subject: "Physics", category: "Study" },
      { id: "work_review", title: "Work review", subject: "Work", category: "Work" },
    ] as FocusState["missions"],
    missionCompletions: [
      { id: "one", missionId: "study_algebra", startedAt: "2026-09-07T08:00:00.000Z", completedAt: "2026-09-07T09:00:00.000Z", durationMs: 3_600_000, reflectionId: "r1", progressionEventId: "p1" },
      { id: "two", missionId: "study_reading", startedAt: "2026-09-08T08:00:00.000Z", completedAt: "2026-09-08T10:00:00.000Z", durationMs: 7_200_000, reflectionId: "r2", progressionEventId: "p2" },
      { id: "three", missionId: "work_review", startedAt: "2026-09-08T12:00:00.000Z", completedAt: "2026-09-08T12:30:00.000Z", durationMs: 1_800_000, reflectionId: "r3", progressionEventId: "p3" },
    ],
    reflections: [
      { id: "r1", completionId: "one", missionId: "study_algebra", createdAt: "2026-09-07T09:00:00.000Z", feelingBefore: null, feelingAfter: null, frictionName: "", frictionRating: null, provokingThought: "", provokingThoughtRating: null, skills: ["Algebra", "Problem solving"], miniAchievement: "", miniAchievementRating: null, customAnswers: {} },
      { id: "r2", completionId: "two", missionId: "study_reading", createdAt: "2026-09-08T10:00:00.000Z", feelingBefore: null, feelingAfter: null, frictionName: "", frictionRating: null, provokingThought: "", provokingThoughtRating: null, skills: ["Reading"], miniAchievement: "", miniAchievementRating: null, customAnswers: {} },
      { id: "r3", completionId: "three", missionId: "work_review", createdAt: "2026-09-08T12:30:00.000Z", feelingBefore: null, feelingAfter: null, frictionName: "", frictionRating: null, provokingThought: "", provokingThoughtRating: null, skills: ["algebra"], miniAchievement: "", miniAchievementRating: null, customAnswers: {} },
    ],
  });
}

describe("invested-time filters", () => {
  it("recalculates exact time averages from either a category, a case-insensitive skill, or both", () => {
    const state = filteredState();
    const records = getMissionCompletionRecords(state);
    const study = filterInvestedTimeCompletions(records, { category: "Study", skill: null });
    const algebra = filterInvestedTimeCompletions(records, { category: null, skill: "ALGEBRA" });
    const studyAlgebra = filterInvestedTimeCompletions(records, { category: "Study", skill: "Algebra" });

    expect(study.map((record) => record.id)).toEqual(["two", "one"]);
    expect(algebra.map((record) => record.id)).toEqual(["three", "one"]);
    expect(studyAlgebra.map((record) => record.id)).toEqual(["one"]);
    expect(getCalendarTimeAverages(state, "2026-09-08T12:00:00.000Z", study).weekTotalHours).toBe(3);
    expect(getCalendarTimeAverages(state, "2026-09-08T12:00:00.000Z", studyAlgebra).weekTotalHours).toBe(1);
  });

  it("keeps reusable skill labels unique while matching them case-insensitively", () => {
    const state = filteredState();
    expect(getSavedSkillSuggestions(state.reflections)).toEqual(["Algebra", "Problem solving", "Reading"]);
  });
});
