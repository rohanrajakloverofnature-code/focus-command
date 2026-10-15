import { describe, expect, it } from "vitest";

import { createInitialState, getCurrentCombo, resolveCurrentComboAfterActivity } from "../lib/focus-command";
import { getDailyCommandBriefing } from "../lib/daily-command-briefing";

function stateAfterLongStreak() {
  const state = createInitialState();
  state.profile.timezone = "UTC";
  state.combo = {
    currentTierId: "combo_30",
    lastActiveDate: "2026-10-10",
    qualifyingStreak: 43,
    missedDays: 0,
  };
  return state;
}

describe("combo recovery after missed local days", () => {
  it("preserves a 42-day streak and the one-tier-lower combo after one missed day", () => {
    const state = stateAfterLongStreak();
    const recovered = resolveCurrentComboAfterActivity(state, "2026-10-12");

    expect(recovered).toMatchObject({ currentTierId: "combo_14", qualifyingStreak: 42, missedDays: 0, lastActiveDate: "2026-10-12" });
    expect(getCurrentCombo({ ...state, combo: recovered }, "2026-10-12")).toMatchObject({ multiplier: 1.5, missedDays: 0 });
    expect(getDailyCommandBriefing({ ...state, combo: recovered }, "2026-10-12T12:00:00.000Z").streakDays).toBe(42);
  });

  it("preserves a 41-day streak and the two-tier-lower combo after two missed days", () => {
    const state = stateAfterLongStreak();
    const recovered = resolveCurrentComboAfterActivity(state, "2026-10-13");

    expect(recovered).toMatchObject({ currentTierId: "combo_7", qualifyingStreak: 41, missedDays: 0, lastActiveDate: "2026-10-13" });
    expect(getCurrentCombo({ ...state, combo: recovered }, "2026-10-13")).toMatchObject({ multiplier: 1.3, missedDays: 0 });
  });

  it("keeps the hard reset for three or more missed days", () => {
    const state = stateAfterLongStreak();
    const recovered = resolveCurrentComboAfterActivity(state, "2026-10-14");

    expect(recovered).toMatchObject({ currentTierId: "combo_base", qualifyingStreak: 1, missedDays: 0, lastActiveDate: "2026-10-14" });
    expect(getCurrentCombo({ ...state, combo: recovered }, "2026-10-14")).toMatchObject({ multiplier: 1, missedDays: 0 });
    expect(getDailyCommandBriefing({ ...state, combo: recovered }, "2026-10-14T12:00:00.000Z").streakDays).toBe(1);
  });
});
