import { describe, expect, it } from "vitest";

import {
  calculateAdjustedPower,
  createInitialState,
  getActiveGoldMultiplier,
  getTodayRawXp,
  getTodayXp,
  getTotalPower,
  getTotalXp,
  type ProgressionEvent,
} from "../lib/focus-command";

const TODAY = "2026-07-22T12:00:00.000Z";
const YESTERDAY = "2026-07-21T12:00:00.000Z";

function createState() {
  const state = createInitialState();
  state.profile.timezone = "UTC";
  return state;
}

function award(
  id: string,
  baseXp: number,
  comboMultiplier = 1,
  goldMultiplier = 1,
  occurredAt = TODAY,
): ProgressionEvent {
  return {
    id,
    missionId: id,
    baseXp,
    comboMultiplier,
    goldMultiplier,
    // Deliberately stale: calculations must derive from the raw XP + snapshots.
    powerAwarded: 999_999,
    goldAwarded: 0,
    occurredAt,
    note: `Award ${id}`,
  };
}

describe("XP and Power ledger", () => {
  it("keeps Total XP raw and produces equal Power with no multipliers", () => {
    const state = createState();
    state.progression.push(award("one", 100), award("two", 50));

    expect(getTotalXp(state)).toBe(150);
    expect(getTotalPower(state)).toBe(150);
    expect(getTodayXp(state, TODAY)).toBe(150);
  });

  it("applies only the combo multiplier once per reward", () => {
    const state = createState();
    state.progression.push(award("one", 100, 1.3), award("two", 50, 1.3));

    expect(getTotalXp(state)).toBe(150);
    expect(getTotalPower(state)).toBe(195);
    expect(getTodayXp(state, TODAY)).toBe(195);
  });

  it("applies combo and active gold multipliers once per reward", () => {
    const state = createState();
    state.progression.push(award("one", 100, 1.3, 2), award("two", 50, 1.3, 2));

    expect(getTotalXp(state)).toBe(150);
    expect(getTotalPower(state)).toBe(390);
    expect(getTodayXp(state, TODAY)).toBe(390);
  });

  it("does not retroactively apply a gold cache after it expires during the day", () => {
    const state = createState();
    state.progression.push(
      award("gold-active", 100, 1.1, 2, "2026-07-22T08:00:00.000Z"),
      award("gold-expired", 50, 1.1, 1, "2026-07-22T16:00:00.000Z"),
    );

    expect(getTotalXp(state)).toBe(150);
    expect(getTodayXp(state, TODAY)).toBe(275);
    expect(getTotalPower(state)).toBe(275);
  });

  it("preserves each reward's combo snapshot when the combo changes", () => {
    const state = createState();
    state.progression.push(
      award("base-combo", 100, 1),
      award("upgraded-combo", 50, 1.3),
    );

    expect(getTodayXp(state, TODAY)).toBe(165);
    expect(getTotalPower(state)).toBe(165);
  });

  it("aggregates multiple rewards throughout the day without duplicate multiplication", () => {
    const state = createState();
    state.progression.push(
      award("first", 75, 1.1, 2),
      award("second", 125, 1.1, 2),
      award("third", 200, 1.3, 1),
    );

    expect(getTotalXp(state)).toBe(400);
    expect(getTodayRawXp(state, TODAY)).toBe(400);
    expect(getTodayXp(state, TODAY)).toBe(700);
    expect(getTotalPower(state)).toBe(700);
  });

  it("excludes prior calendar days from Today's XP while retaining them in Total Power", () => {
    const state = createState();
    state.progression.push(award("previous", 80, 1.5, 2, YESTERDAY), award("today", 40, 1.1, 1));

    expect(getTodayRawXp(state, TODAY)).toBe(40);
    expect(getTodayXp(state, TODAY)).toBe(44);
    expect(getTotalPower(state)).toBe(284);
  });

  it("uses a precision-safe single multiplication formula", () => {
    expect(calculateAdjustedPower(35, 1.1, 3)).toBe(115.5);
    expect(calculateAdjustedPower(100, 0, 0)).toBe(100);
  });

  it("recognizes only an unconsumed multiplier item active on the requested local day", () => {
    const state = createState();
    state.rewards.push({
      id: "boost",
      title: "Gold cache",
      description: "",
      category: "multiplier",
      goldCost: 0,
      lootEnabled: false,
      lootWeight: 0,
      goldMultiplier: 2,
      createdAt: TODAY,
      active: true,
    });
    state.inventory.push({
      id: "today-item",
      rewardId: "boost",
      acquiredAt: TODAY,
      effectiveOn: "2026-07-22",
      consumedAt: null,
      active: true,
    });

    expect(getActiveGoldMultiplier(state, "2026-07-22")).toBe(2);
    expect(getActiveGoldMultiplier(state, "2026-07-23")).toBe(1);
  });
});
