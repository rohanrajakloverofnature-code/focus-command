import { describe, expect, it } from "vitest";

import { getMostUsedShadowGateDoorway, getShadowGateEntriesForRange, getShadowGatePersonalProof, getShadowGateRangePresentation } from "../lib/shadow-gate-analytics";
import type { ShadowGateEntry } from "../lib/focus-command";

const entries: ShadowGateEntry[] = [
  { id: "gate_1", missionId: "mission_1", resistanceState: "too_big", doorwayId: "too_big_01", doorwayLabel: "Open the first page.", occurredAt: "2026-08-19T08:00:00.000Z" },
  { id: "gate_2", missionId: "mission_2", resistanceState: "too_big", doorwayId: "too_big_01", doorwayLabel: "Open the first page.", occurredAt: "2026-08-18T08:00:00.000Z" },
  { id: "gate_3", missionId: "mission_3", resistanceState: "too_big", doorwayId: "too_big_01", doorwayLabel: "Open the first page.", occurredAt: "2026-08-17T08:00:00.000Z" },
  { id: "gate_4", missionId: "mission_4", resistanceState: "drained", doorwayId: "drained_01", doorwayLabel: "Set a tiny timer.", occurredAt: "2026-07-02T08:00:00.000Z" },
];

describe("Shadow Gate analytics", () => {
  it("filters honest records by local calendar-date range without changing the underlying ledger", () => {
    expect(getShadowGateEntriesForRange(entries, "UTC", { kind: "last7Days" }, new Date("2026-08-19T12:00:00.000Z")).map((entry) => entry.id)).toEqual(["gate_1", "gate_2", "gate_3"]);
    expect(entries).toHaveLength(4);
  });

  it("validates a custom date range and exposes its exact bounds", () => {
    expect(getShadowGateRangePresentation({ kind: "custom", startDate: "2026-08-17", endDate: "2026-08-19" }, "UTC")).toMatchObject({ valid: true, startDate: "2026-08-17", endDate: "2026-08-19" });
    expect(getShadowGateRangePresentation({ kind: "custom", startDate: "2026-08-20", endDate: "2026-08-19" }, "UTC").valid).toBe(false);
  });

  it("reports only factual repeated doorway evidence after three matching Gate-to-mission records", () => {
    expect(getMostUsedShadowGateDoorway(entries)).toMatchObject({ doorwayLabel: "Open the first page.", count: 3 });
    expect(getShadowGatePersonalProof(entries)?.line).toContain("3 Too Big Gates");
    expect(getShadowGatePersonalProof(entries.slice(0, 2))).toBeNull();
  });
});
