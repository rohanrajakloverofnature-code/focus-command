import { describe, expect, it } from "vitest";

import type { IllnessContextRecord } from "../lib/focus-command";
import {
  getIllnessContextSummary,
  illnessContextContainsDate,
  illnessContextOverlapDays,
  inclusiveIllnessContextDays,
} from "../lib/illness-context";

const record: IllnessContextRecord = {
  id: "context_1",
  startDate: "2026-09-10",
  endDate: "2026-09-12",
  symptomsReported: true,
  severity: "moderate",
  fatigueReported: true,
  sleepDisrupted: true,
  stressElevated: false,
  note: "Private note",
  createdAt: "2026-09-10T08:00:00.000Z",
  updatedAt: "2026-09-10T08:00:00.000Z",
};

describe("private illness context", () => {
  it("uses exact inclusive local-day spans and handles ongoing records without diagnosis", () => {
    expect(inclusiveIllnessContextDays("2026-09-10", "2026-09-12")).toBe(3);
    expect(illnessContextOverlapDays(record, { startDate: "2026-09-11", endDate: "2026-09-18" }, "2026-09-18")).toBe(2);
    expect(illnessContextContainsDate({ ...record, endDate: null }, "2026-09-18", "2026-09-18")).toBe(true);
  });

  it("counts only selected-range descriptive context and preserves raw reflection dates", () => {
    const summary = getIllnessContextSummary([record], { startDate: "2026-09-11", endDate: "2026-09-18" }, "2026-09-18", ["2026-09-10", "2026-09-11", "2026-09-15"]);

    expect(summary).toMatchObject({ recordCount: 1, contextDays: 2, debriefDays: 1, moderateRecords: 1, fatigueRecords: 1, sleepDisruptedRecords: 1 });
    expect(Object.keys(summary)).not.toContain("diagnosis");
    expect(Object.keys(summary)).not.toContain("recoveryScore");
  });
});
