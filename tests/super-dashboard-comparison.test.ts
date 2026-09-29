import { describe, expect, it } from "vitest";

import { createInitialState } from "../lib/focus-command";
import { formatComparisonCell, formatComparisonDelta, getSuperDashboardComparison } from "../lib/super-dashboard-comparison";

const NOW = new Date("2026-09-30T12:00:00.000Z");

describe("Super Dashboard comparisons", () => {
  it("builds adjacent yesterday, week, and month periods from the profile timezone", () => {
    const state = createInitialState();
    state.profile.timezone = "UTC";

    expect(getSuperDashboardComparison(state, "yesterday", "", "", "", "", NOW).currentRange).toMatchObject({ startDate: "2026-09-30", endDate: "2026-09-30" });
    expect(getSuperDashboardComparison(state, "yesterday", "", "", "", "", NOW).previousRange).toMatchObject({ startDate: "2026-09-29", endDate: "2026-09-29" });
    expect(getSuperDashboardComparison(state, "week", "", "", "", "", NOW).currentRange).toMatchObject({ startDate: "2026-09-24", endDate: "2026-09-30" });
    expect(getSuperDashboardComparison(state, "week", "", "", "", "", NOW).previousRange).toMatchObject({ startDate: "2026-09-17", endDate: "2026-09-23" });
    expect(getSuperDashboardComparison(state, "month", "", "", "", "", NOW).previousRange).toMatchObject({ startDate: "2026-08-01", endDate: "2026-08-31" });
  });

  it("compares two independent inclusive custom ranges and includes calendar-planner metrics", () => {
    const state = createInitialState();
    state.profile.timezone = "UTC";
    state.calendarActivities = [
      { id: "a1", title: "Current task", localDate: "2026-09-15", missionId: null, completedAt: "2026-09-15T10:00:00.000Z", createdAt: "2026-09-15T08:00:00.000Z" },
      { id: "a2", title: "Current pending", localDate: "2026-09-15", missionId: null, completedAt: null, createdAt: "2026-09-15T08:00:00.000Z" },
      { id: "b1", title: "Previous task", localDate: "2026-09-01", missionId: null, completedAt: "2026-09-01T10:00:00.000Z", createdAt: "2026-09-01T08:00:00.000Z" },
    ];

    const comparison = getSuperDashboardComparison(state, "custom", "2026-09-15", "2026-09-30", "2026-09-01", "2026-09-14", NOW);

    expect(comparison.valid).toBe(true);
    expect(comparison.currentCalendar).toMatchObject({ planned: 2, completed: 1, pending: 1, percentage: 50 });
    expect(comparison.previousCalendar).toMatchObject({ planned: 1, completed: 1, pending: 0, percentage: 100 });
    expect(comparison.rows.find((row) => row.id === "calendar.percentage")).toMatchObject({ current: 50, previous: 100, delta: -50, format: "percentage" });
    expect(comparison.rows.find((row) => row.id === "mistakes.counts.needs_review")).toBeTruthy();
    expect(comparison.rows.find((row) => row.id === "recovery.averageLoggedStress")).toBeTruthy();
    expect(comparison.rows.find((row) => row.id === "evidence.recordedDays")).toBeTruthy();
  });

  it("rejects incomplete custom periods without calculating a misleading comparison", () => {
    const state = createInitialState();
    const comparison = getSuperDashboardComparison(state, "custom", "2026-09-15", "", "2026-09-01", "2026-09-14", NOW);
    expect(comparison.valid).toBe(false);
    expect(comparison.rows).toEqual([]);
  });

  it("formats missing values and unit-aware deltas without treating missing evidence as zero", () => {
    expect(formatComparisonCell(null, "minutes")).toBe("—");
    expect(formatComparisonCell(0.5, "percentage")).toBe("50%");
    expect(formatComparisonDelta(-0.5, "percentage")).toBe("-50 pts");
    expect(formatComparisonDelta(null, "count")).toBe("—");
  });
});
