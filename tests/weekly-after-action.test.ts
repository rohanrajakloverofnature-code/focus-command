import { describe, expect, it } from "vitest";

import type { FocusState } from "../lib/focus-command";
import { formatWeeklyRange, getWeeklyAfterActionReview } from "../lib/weekly-after-action";

function makeState(): FocusState {
  return {
    profile: { timezone: "UTC" },
    missions: [
      { id: "completed", title: "Physics Revision", subject: "Physics", dueAt: "2026-08-11T12:00:00.000Z", status: "completed", completionHistory: [] },
      { id: "missed", title: "Chemistry Notes", subject: "Chemistry", dueAt: "2026-08-10T12:00:00.000Z", status: "planned", completionHistory: [] },
    ],
    missionCompletions: [{
      id: "completion-1", missionId: "completed", startedAt: "2026-08-11T08:00:00.000Z", completedAt: "2026-08-11T09:30:00.000Z", durationMs: 5_400_000,
      reflectionId: "reflection-1", progressionEventId: "", missionTitle: "Physics Revision", missionSubject: "Physics", missionCategory: "Study", missionDifficulty: "medium", missionBaseXp: 20, missionFrequency: "once",
    }],
    reflections: [{ id: "reflection-1", missionId: "completed", createdAt: "2026-08-11T09:30:00.000Z", feelingAfter: "steady", focusQuality: 4, energyBefore: 2, energyAfter: 3, clarityLevel: 4, motivationLevel: 3 }],
    distractionLogs: [{ id: "distraction-1", missionId: "completed", category: "phone", occurredAt: "2026-08-11T18:00:00.000Z" }],
    srsTopics: [{ id: "vectors", missionId: "completed", subject: "Physics", topic: "Vectors", stage: 2, dueDate: "2026-08-18", completedAt: null, createdAt: "2026-08-09T08:00:00.000Z", status: "scheduled" }],
    srsActivityLog: [
      { id: "vectors-before-week", topicId: "vectors", missionId: "completed", subject: "Physics", topic: "Vectors", phase: "seed_sown", actionDate: "2026-08-09", occurredAt: "2026-08-09T08:00:00.000Z" },
      { id: "vectors-emerging", topicId: "vectors", missionId: "completed", subject: "Physics", topic: "Vectors", phase: "emerging", actionDate: "2026-08-11", occurredAt: "2026-08-11T10:00:00.000Z" },
      { id: "vectors-developing", topicId: "vectors", missionId: "completed", subject: "Physics", topic: "Vectors", phase: "developing", actionDate: "2026-08-15", occurredAt: "2026-08-15T10:00:00.000Z" },
      { id: "vectors-after-week", topicId: "vectors", missionId: "completed", subject: "Physics", topic: "Vectors", phase: "matured", actionDate: "2026-08-17", occurredAt: "2026-08-17T10:00:00.000Z" },
    ],
    progression: [],
  } as unknown as FocusState;
}

describe("getWeeklyAfterActionReview", () => {
  it("derives the approved Monday-Sunday review from existing offline data without mutating state", () => {
    const state = makeState();
    const review = getWeeklyAfterActionReview(state, new Date("2026-08-14T12:00:00.000Z"));

    expect(review.weekStart).toBe("2026-08-10");
    expect(review.weekEnd).toBe("2026-08-16");
    expect(review.investedMs).toBe(5_400_000);
    expect(review.completedMissions).toBe(1);
    expect(review.strongestSubject).toEqual({ label: "Physics", durationMs: 5_400_000 });
    expect(review.scheduledPlans).toBe(2);
    expect(review.completedPlans).toBe(1);
    expect(review.missedPlans.map((mission) => mission.title)).toEqual(["Chemistry Notes"]);
    expect(review.reflection.mostCommonFeeling).toBe("Steady");
    expect(review.friction).toMatchObject({ total: 1, topCategory: "Phone", timeWindow: "Evening" });
    expect(review.revision.uniqueTopicCount).toBe(1);
    expect(review.revision.activities).toEqual([
      expect.objectContaining({ key: "vectors-developing", actionDate: "2026-08-15", revisionPhase: "developing" }),
      expect.objectContaining({ key: "vectors-emerging", actionDate: "2026-08-11", revisionPhase: "emerging" }),
    ]);
    expect(review.recommendation).toContain("Chemistry Notes");
    expect(state.distractionLogs).toHaveLength(1);
  });

  it("uses neutral empty states and a transparent fallback recommendation when no weekly data exists", () => {
    const state = { profile: { timezone: "UTC" }, missions: [], missionCompletions: [], reflections: [], distractionLogs: [], progression: [] } as unknown as FocusState;
    const review = getWeeklyAfterActionReview(state, new Date("2026-08-14T12:00:00.000Z"));

    expect(review.completedMissions).toBe(0);
    expect(review.strongestSubject).toBeNull();
    expect(review.reflection.count).toBe(0);
    expect(review.friction.total).toBe(0);
    expect(review.recommendation).toBe("Choose one mission to start next week with a clear first step.");
    expect(formatWeeklyRange(review.weekStart, review.weekEnd)).toBe("Aug 10 – Aug 16");
  });
});
