import { describe, expect, it } from "vitest";

import {
  getBehaviorPatternsRange,
  getBehaviorPatternsSummary,
  normalizeBehaviorLogs,
  type BehaviorLog,
} from "../lib/behavior-patterns";

const logs: BehaviorLog[] = [
  {
    id: "one",
    createdAt: "2026-10-12T08:00:00.000Z",
    updatedAt: "2026-10-12T08:00:00.000Z",
    localDate: "2026-10-12",
    trigger: "Difficult task",
    urgeType: "avoidance",
    urgeIntensityBefore: 8,
    automaticThought: "I will fail",
    emotion: "tense",
    bodyResponse: "Tight chest",
    actionType: "scrolled",
    action: "Scrolled",
    immediateConsequence: "relief",
    urgeIntensityAfter: 3,
    evidenceFor: "It felt difficult",
    evidenceAgainst: "I have solved similar tasks",
    thoughtPatterns: ["worst_case"],
    customThoughtPattern: "",
    balancedThought: "I can take one small step",
    alternativeAction: "Open the notes",
    alternativeHelpful: true,
    laterConsequence: "Started after five minutes",
    missionId: null,
    calendarActivityId: null,
  },
  {
    id: "two",
    createdAt: "2026-10-11T08:00:00.000Z",
    updatedAt: "2026-10-11T08:00:00.000Z",
    localDate: "2026-10-11",
    trigger: "Phone notification",
    urgeType: "checking",
    urgeIntensityBefore: 4,
    automaticThought: "Maybe it is urgent",
    emotion: "restless",
    bodyResponse: "",
    actionType: "checked",
    action: "Checked phone",
    immediateConsequence: "no_change",
    urgeIntensityAfter: 4,
    evidenceFor: "A message arrived",
    evidenceAgainst: "It could wait",
    thoughtPatterns: ["mind_reading"],
    customThoughtPattern: "",
    balancedThought: "I can check after this block",
    alternativeAction: "",
    alternativeHelpful: null,
    laterConsequence: "Returned to task",
    missionId: "mission_1",
    calendarActivityId: "calendar_1",
  },
];

describe("behavior patterns", () => {
  it("builds today, week, month, year, and validated custom ranges", () => {
    const now = new Date("2026-10-12T12:00:00.000Z");
    expect(getBehaviorPatternsRange("today", "UTC", "", "", now)).toMatchObject({ startDate: "2026-10-12", endDate: "2026-10-12", calendarDays: 1, valid: true });
    expect(getBehaviorPatternsRange("week", "UTC", "", "", now)).toMatchObject({ startDate: "2026-10-06", endDate: "2026-10-12", calendarDays: 7, valid: true });
    expect(getBehaviorPatternsRange("month", "UTC", "", "", now)).toMatchObject({ startDate: "2026-10-01", endDate: "2026-10-12", valid: true });
    expect(getBehaviorPatternsRange("year", "UTC", "", "", now)).toMatchObject({ startDate: "2026-01-01", endDate: "2026-10-12", valid: true });
    expect(getBehaviorPatternsRange("custom", "UTC", "2026-10-01", "2026-10-10", now)).toMatchObject({ calendarDays: 10, valid: true });
    expect(getBehaviorPatternsRange("custom", "UTC", "2026-10-10", "2026-10-01", now).valid).toBe(false);
  });

  it("aggregates urges, changes, alternatives, and selected thought patterns without inventing missing values", () => {
    const summary = getBehaviorPatternsSummary(logs, "week", "UTC", "", "", new Date("2026-10-12T12:00:00.000Z"));
    expect(summary.totalLogs).toBe(2);
    expect(summary.highUrgeLogs).toBe(1);
    expect(summary.averageUrgeBefore).toBe(6);
    expect(summary.averageUrgeAfter).toBe(3.5);
    expect(summary.averageUrgeChange).toBe(-2.5);
    expect(summary.alternativeActionAttempts).toBe(1);
    expect(summary.alternativeHelpfulRate).toBe(1);
    expect(summary.linkedMissionLogs).toBe(1);
    expect(summary.triggerCounts[0]).toMatchObject({ count: 1 });
    expect(summary.thoughtPatternCounts).toHaveLength(2);
    expect(summary.dailySeries).toHaveLength(7);
  });

  it("normalizes malformed optional records and preserves valid user data", () => {
    const normalized = normalizeBehaviorLogs([{ ...logs[0], urgeIntensityBefore: 99, thoughtPatterns: ["worst_case", "not-a-pattern"], localDate: "bad" }, { id: "invalid" }], "UTC", new Date("2026-10-12T12:00:00.000Z"));
    expect(normalized).toHaveLength(1);
    expect(normalized[0].urgeIntensityBefore).toBe(10);
    expect(normalized[0].thoughtPatterns).toEqual(["worst_case"]);
    expect(normalized[0].localDate).toBe("2026-10-12");
  });
});
