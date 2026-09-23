import { describe, expect, it } from "vitest";

import {
  filterCorePrinciplesCheckInsToCurrent,
  getCorePrinciplesCheckInsInRange,
  getCorePrinciplesDailyTrend,
  getCorePrinciplesListInsights,
  getCorePrinciplesSummary,
  getMostUncheckedCorePrinciples,
  isCorePrinciplesDateInRange,
} from "../lib/core-principles";
import { syncCorePrincipleDailyCheckIn } from "../lib/core-principles-sync";
import type { CorePrincipleDailyCheckIn } from "../lib/focus-command";

const checkIns: CorePrincipleDailyCheckIn[] = [
  {
    localDate: "2026-09-01", createdAt: "2026-09-01T10:00:00.000Z", updatedAt: "2026-09-01T10:00:00.000Z",
    items: [
      { itemId: "sleep", listId: "health", listTitle: "Health", itemText: "Sleep before 11 PM", checked: true },
      { itemId: "plan", listId: "study", listTitle: "Study", itemText: "Plan tomorrow", checked: false },
    ],
  },
  {
    localDate: "2026-09-02", createdAt: "2026-09-02T10:00:00.000Z", updatedAt: "2026-09-02T10:00:00.000Z",
    items: [
      { itemId: "sleep", listId: "health", listTitle: "Health", itemText: "Sleep before 11 PM", checked: false },
      { itemId: "plan", listId: "study", listTitle: "Study", itemText: "Plan tomorrow", checked: false },
      { itemId: "walk", listId: "health", listTitle: "Health", itemText: "Walk outside", checked: true },
    ],
  },
  {
    localDate: "2026-09-08", createdAt: "2026-09-08T10:00:00.000Z", updatedAt: "2026-09-08T10:00:00.000Z",
    items: [{ itemId: "sleep", listId: "health", listTitle: "Health", itemText: "Sleep before 11 PM", checked: true }],
  },
];

describe("Core Principles", () => {
  it("calculates a weighted Success Ratio and never treats no check-in as a failure", () => {
    expect(getCorePrinciplesSummary([])).toEqual({ checked: 0, applicable: 0, successRatio: null, recordedDays: 0 });
    expect(getCorePrinciplesSummary(checkIns)).toEqual({ checked: 3, applicable: 6, successRatio: 0.5, recordedDays: 3 });
    expect(getCorePrinciplesDailyTrend(checkIns).map((item) => item.ratio)).toEqual([50, 33, 100]);
  });

  it("uses inclusive week, month, lifetime, and custom local-date ranges", () => {
    const now = new Date("2026-09-08T12:00:00.000Z");
    expect(getCorePrinciplesCheckInsInRange(checkIns, { kind: "week" }, "UTC", now).map((item) => item.localDate)).toEqual(["2026-09-08"]);
    expect(getCorePrinciplesCheckInsInRange(checkIns, { kind: "month" }, "UTC", now)).toHaveLength(3);
    expect(getCorePrinciplesCheckInsInRange(checkIns, { kind: "lifetime" }, "UTC", now)).toHaveLength(3);
    expect(getCorePrinciplesCheckInsInRange(checkIns, { kind: "custom", startDate: "2026-09-01", endDate: "2026-09-02" }, "UTC", now)).toHaveLength(2);
    expect(isCorePrinciplesDateInRange("2026-09-02", { kind: "custom", startDate: "2026-09-02", endDate: "2026-09-02" }, "UTC", now)).toBe(true);
  });

  it("ranks actual unchecked daily snapshots and keeps list insights based on recorded wording", () => {
    expect(getMostUncheckedCorePrinciples(checkIns).map((item) => [item.itemText, item.uncheckedDays])).toEqual([
      ["Plan tomorrow", 2], ["Sleep before 11 PM", 1],
    ]);
    expect(getCorePrinciplesListInsights(checkIns)).toEqual([
      expect.objectContaining({ listTitle: "Health", checked: 3, applicable: 4, successRatio: 0.75 }),
      expect.objectContaining({ listTitle: "Study", checked: 0, applicable: 2, successRatio: 0 }),
    ]);
  });

  it("adds newly active principles to today without resetting existing checks", () => {
    const existing = checkIns[0]!;
    const activeItems = [
      ...existing.items,
      { itemId: "new", listId: "study", listTitle: "Study", itemText: "New rule", checked: false },
    ];
    const synced = syncCorePrincipleDailyCheckIn(existing, existing.localDate, activeItems, "2026-09-01T18:00:00.000Z");
    expect(synced.items.map((item) => [item.itemId, item.checked])).toEqual([
      ["sleep", true], ["plan", false], ["new", false],
    ]);
  });

  it("filters deleted historical snapshots from live insight calculations", () => {
    const currentOnly = filterCorePrinciplesCheckInsToCurrent(checkIns, new Set(["sleep", "walk"]), new Set(["health"]));
    expect(getMostUncheckedCorePrinciples(currentOnly).map((item) => item.itemText)).toEqual(["Sleep before 11 PM"]);
    expect(getCorePrinciplesListInsights(currentOnly)).toEqual([
      expect.objectContaining({ listTitle: "Health", checked: 3, applicable: 4, successRatio: 0.75 }),
    ]);
  });

  it("keeps all lifetime check-ins available to the summary and trend helpers", () => {
    const lifetime = Array.from({ length: 1_825 }, (_, index): CorePrincipleDailyCheckIn => ({
      localDate: new Date(Date.UTC(2021, 0, 1 + index)).toISOString().slice(0, 10),
      createdAt: "2021-01-01T00:00:00.000Z",
      updatedAt: "2021-01-01T00:00:00.000Z",
      items: [{ itemId: "rule", listId: "list", listTitle: "Standards", itemText: "Read daily", checked: index % 2 === 0 }],
    }));
    expect(getCorePrinciplesSummary(lifetime)).toMatchObject({ applicable: 1_825, recordedDays: 1_825 });
    expect(getCorePrinciplesDailyTrend(lifetime)).toHaveLength(1_825);
  });
});
