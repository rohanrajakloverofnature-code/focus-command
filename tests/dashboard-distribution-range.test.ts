import { describe, expect, it } from "vitest";

import type { FocusState } from "../lib/focus-command";
import { getDashboardDistributionStats } from "../lib/focus-command";

function makeState(): FocusState {
  return {
    profile: { timezone: "UTC" },
    missions: [
      { id: "math", title: "Math", subject: "Mathematics", category: "Study", status: "completed", completionHistory: [] },
      { id: "art", title: "Art", subject: "Art", category: "Creative", status: "completed", completionHistory: [] },
    ],
    missionCompletions: [
      { id: "c1", missionId: "math", startedAt: "2026-09-01T08:00:00.000Z", completedAt: "2026-09-01T09:00:00.000Z", durationMs: 3_600_000 },
      { id: "c2", missionId: "art", startedAt: "2026-08-01T08:00:00.000Z", completedAt: "2026-08-01T10:00:00.000Z", durationMs: 7_200_000 },
    ],
    reflections: [],
    progression: [],
  } as unknown as FocusState;
}

describe("getDashboardDistributionStats", () => {
  it("uses one shared selected-range denominator for subjects and categories", () => {
    const state = makeState();
    const month = getDashboardDistributionStats(state, { startDate: "2026-09-01", endDate: "2026-09-30" });
    expect(month.subjectDistribution).toEqual([{ label: "Mathematics", duration: 3_600_000, percentage: 1 }]);
    expect(month.categoryDistribution).toEqual([{ label: "Study", duration: 3_600_000, percentage: 1 }]);

    const lifetime = getDashboardDistributionStats(state, null);
    expect(lifetime.subjectDistribution.map((point) => Math.round(point.percentage * 100))).toEqual([33, 67]);
    expect(lifetime.categoryDistribution.map((point) => Math.round(point.percentage * 100))).toEqual([33, 67]);
  });
});
