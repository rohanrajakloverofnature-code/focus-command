import { describe, expect, it } from "vitest";

import type { MistakeLedgerActivity, MistakeLedgerEntry } from "./focus-command";
import { getMistakeLedgerActivities, getMistakeLedgerSubjects, getMistakeLedgerSummary, isMistakeLedgerDateInRange } from "./mistake-ledger";

const entries: MistakeLedgerEntry[] = [
  { id: "math", mistake: "Sign error", subject: "Maths", correction: "Check signs", status: "improving", missionId: null, missionTitle: null, createdAt: "2026-09-01T10:00:00.000Z", updatedAt: "2026-09-05T10:00:00.000Z" },
  { id: "chem", mistake: "Wrong unit", subject: "Chemistry", correction: "Write units", status: "improved", missionId: null, missionTitle: null, createdAt: "2026-08-20T10:00:00.000Z", updatedAt: "2026-09-04T10:00:00.000Z" },
];
const activity: MistakeLedgerActivity[] = [
  { id: "a1", entryId: "math", kind: "created", status: "noted", actionDate: "2026-09-01", occurredAt: "2026-09-01T10:00:00.000Z" },
  { id: "a2", entryId: "math", kind: "status", status: "improving", actionDate: "2026-09-05", occurredAt: "2026-09-05T10:00:00.000Z" },
  { id: "a3", entryId: "chem", kind: "created", status: "noted", actionDate: "2026-08-20", occurredAt: "2026-08-20T10:00:00.000Z" },
  { id: "a4", entryId: "chem", kind: "status", status: "improved", actionDate: "2026-09-04", occurredAt: "2026-09-04T10:00:00.000Z" },
];
const now = new Date("2026-09-05T12:00:00.000Z");

describe("Mistake Ledger filtering", () => {
  it("keeps every real status action and filters it by subject", () => {
    const result = getMistakeLedgerActivities(entries, activity, { kind: "month" }, "Maths", "all", "UTC", now);
    expect(result.map((record) => record.id)).toEqual(["a2", "a1"]);
    expect(getMistakeLedgerSubjects(entries)).toEqual(["Chemistry", "Maths"]);
  });

  it("shows an improvement in the month it actually happened, not only where it was first noted", () => {
    const result = getMistakeLedgerActivities(entries, activity, { kind: "month" }, "all", "improved", "UTC", now);
    expect(result.map((record) => record.id)).toEqual(["a4"]);
    expect(getMistakeLedgerSummary(result)).toEqual({ noted: 0, improved: 1 });
  });

  it("supports Monday-to-Sunday weekly and inclusive custom date ranges", () => {
    expect(isMistakeLedgerDateInRange("2026-08-31", { kind: "week" }, "UTC", now)).toBe(true);
    expect(isMistakeLedgerDateInRange("2026-08-30", { kind: "week" }, "UTC", now)).toBe(false);
    const result = getMistakeLedgerActivities(entries, activity, { kind: "custom", startDate: "2026-09-04", endDate: "2026-09-05" }, "all", "all", "UTC", now);
    expect(result.map((record) => record.id)).toEqual(["a2", "a4"]);
  });
});
