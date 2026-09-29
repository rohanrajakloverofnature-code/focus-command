import { describe, expect, it } from "vitest";

import { createInitialState, type MistakeLedgerActivity, type MistakeLedgerEntry } from "../lib/focus-command";
import { getDashboardWorkspaceResult } from "../lib/dashboard-workspace";
import { getMistakeLedgerAnalytics } from "../lib/mistake-ledger-analytics";
import { getSuperDashboardSummary } from "../lib/super-dashboard";

const entryOne: MistakeLedgerEntry = {
  id: "mistake_one",
  mistake: "Confused the vector direction",
  subject: "Physics",
  correction: "Draw the sign convention first",
  status: "improved",
  missionId: null,
  missionTitle: null,
  createdAt: "2026-09-01T08:00:00.000Z",
  updatedAt: "2026-09-08T08:00:00.000Z",
};

const entryTwo: MistakeLedgerEntry = {
  id: "mistake_two",
  mistake: "Skipped a unit check",
  subject: "Chemistry",
  correction: "Check units before submitting",
  status: "needs_review",
  missionId: null,
  missionTitle: null,
  createdAt: "2026-09-05T08:00:00.000Z",
  updatedAt: "2026-09-05T08:00:00.000Z",
};

const activity: MistakeLedgerActivity[] = [
  { id: "activity_one_created", entryId: entryOne.id, kind: "created", status: "noted", actionDate: "2026-09-01", occurredAt: "2026-09-01T08:00:00.000Z" },
  { id: "activity_one_working", entryId: entryOne.id, kind: "status", status: "working_on", actionDate: "2026-09-03", occurredAt: "2026-09-03T08:00:00.000Z" },
  { id: "activity_one_improved", entryId: entryOne.id, kind: "status", status: "improved", actionDate: "2026-09-08", occurredAt: "2026-09-08T08:00:00.000Z" },
  { id: "activity_two_created", entryId: entryTwo.id, kind: "created", status: "noted", actionDate: "2026-09-05", occurredAt: "2026-09-05T08:00:00.000Z" },
  { id: "activity_two_review", entryId: entryTwo.id, kind: "status", status: "needs_review", actionDate: "2026-09-06", occurredAt: "2026-09-06T08:00:00.000Z" },
];

describe("Mistakes Ledger status-aware analytics", () => {
  it("reconstructs status at the selected end date and counts only changes in range", () => {
    const beforeImprovement = getMistakeLedgerAnalytics([entryOne, entryTwo], activity, "2026-09-01", "2026-09-04", "UTC");
    expect(beforeImprovement.totalAtEnd).toBe(1);
    expect(beforeImprovement.counts).toMatchObject({ noted: 0, working_on: 1, improving: 0, improved: 0, needs_review: 0 });
    expect(beforeImprovement.createdInRange).toBe(1);
    expect(beforeImprovement.statusUpdatesInRange).toBe(1);
    expect(beforeImprovement.latestChanges[0]).toMatchObject({ localDate: "2026-09-03", status: "working_on" });

    const afterImprovement = getMistakeLedgerAnalytics([entryOne, entryTwo], activity, "2026-09-01", "2026-09-10", "UTC");
    expect(afterImprovement.totalAtEnd).toBe(2);
    expect(afterImprovement.counts).toMatchObject({ improved: 1, needs_review: 1 });
    expect(afterImprovement.statusUpdatesInRange).toBe(3);
  });

  it("keeps deleted entries out of status snapshots and status updates", () => {
    const analytics = getMistakeLedgerAnalytics([entryOne], activity, "2026-09-01", "2026-09-10", "UTC");
    expect(analytics.totalAtEnd).toBe(1);
    expect(analytics.latestChanges.every((change) => change.subject === "Physics")).toBe(true);
  });

  it("feeds the same status snapshot into both dashboard layers", () => {
    const state = createInitialState();
    state.hydrated = true;
    state.profile.timezone = "UTC";
    state.mistakeLedgerEntries = [entryOne, entryTwo];
    state.mistakeLedgerActivityLog = activity;

    const superSummary = getSuperDashboardSummary(state, "custom", "2026-09-01", "2026-09-10", new Date("2026-09-10T12:00:00.000Z"));
    expect(superSummary.mistakes.counts).toMatchObject({ improved: 1, needs_review: 1 });

    const workspaceResult = getDashboardWorkspaceResult(state, {
      id: "mistake_status_widget",
      title: "Mistake status",
      metric: "mistakeStatuses",
      chartType: "donut",
      dateRange: "custom",
      feature: "ledger",
      subject: "all",
      category: "all",
      missionFrequency: "all",
      customStartDate: "2026-09-01",
      customEndDate: "2026-09-10",
      mistakeStatus: "all",
      comparisonRange: "off",
      comparisonStartDate: "",
      comparisonEndDate: "",
    });
    expect(workspaceResult.total).toBe(2);
    expect(workspaceResult.sampleCount).toBe(2);
    expect(workspaceResult.breakdown.map((point) => point.label)).toContain("Improved");
    expect(workspaceResult.breakdown.map((point) => point.label)).toContain("Needs Review");
  });
});
