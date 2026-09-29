import { describe, expect, it } from "vitest";

import { getRewardInventoryView } from "../lib/reward-inventory-view";
import type { InventoryItem, Reward } from "../lib/focus-command";

const rewards: Reward[] = [
  { id: "life_today", title: "Today reset", description: "", category: "life", goldCost: 1, lootEnabled: false, lootWeight: 0, goldMultiplier: null, createdAt: "2026-09-01T00:00:00.000Z", active: true },
  { id: "life_old", title: "Old reset", description: "", category: "life", goldCost: 1, lootEnabled: false, lootWeight: 0, goldMultiplier: null, createdAt: "2026-09-01T00:00:00.000Z", active: false },
  { id: "gear_today", title: "Gear", description: "", category: "gear", goldCost: 1, lootEnabled: false, lootWeight: 0, goldMultiplier: null, createdAt: "2026-09-01T00:00:00.000Z", active: true },
  { id: "multiplier", title: "Multiplier", description: "", category: "multiplier", goldCost: 1, lootEnabled: false, lootWeight: 0, goldMultiplier: 2, createdAt: "2026-09-01T00:00:00.000Z", active: true },
];

const item = (id: string, rewardId: string, acquiredAt: string, patch: Partial<InventoryItem> = {}): InventoryItem => ({
  id, rewardId, acquiredAt, effectiveOn: null, consumedAt: null, active: true, ...patch,
});

describe("life reward inventory view", () => {
  it("keeps non-life rewards active across dates while date-scoping Life rewards and history", () => {
    const view = getRewardInventoryView([
      item("today", "life_today", "2026-09-29T08:00:00.000Z"),
      item("old-preserved", "life_old", "2026-09-28T08:00:00.000Z"),
      item("old-used", "life_old", "2026-09-27T08:00:00.000Z", { consumedAt: "2026-09-27T10:00:00.000Z" }),
      item("gear", "gear_today", "2026-09-29T09:00:00.000Z"),
      item("gear-old", "gear_today", "2026-09-20T09:00:00.000Z"),
      item("multiplier-old", "multiplier", "2026-09-10T09:00:00.000Z"),
      item("today-used", "life_today", "2026-09-29T10:00:00.000Z", { consumedAt: "2026-09-29T11:00:00.000Z" }),
    ], rewards, "2026-09-29", "UTC");

    expect(view.activeInventory.map((row) => row.item.id)).toEqual(["gear", "today", "gear-old", "multiplier-old"]);
    expect(view.lifeHistory.map((row) => ({ id: row.item.id, date: row.acquiredDate }))).toEqual([
      { id: "old-preserved", date: "2026-09-28" },
      { id: "old-used", date: "2026-09-27" },
    ]);
  });
});
