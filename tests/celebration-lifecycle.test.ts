import { describe, expect, it } from "vitest";

import { getEligibleCelebration } from "../lib/celebration-lifecycle";

const baseline = { level: 5, title: "Pathfinder", combo: 1.2 };

describe("Home celebration lifecycle", () => {
  it("does not treat hydrated persisted progress as a new achievement", () => {
    expect(getEligibleCelebration(null, baseline, false)).toBeNull();
  });

  it("keeps level-up, title, and combo animations silent while launch owns the stage", () => {
    expect(getEligibleCelebration(baseline, { ...baseline, level: 6 }, true)).toBeNull();
    expect(getEligibleCelebration(baseline, { ...baseline, title: "Vanguard" }, true)).toBeNull();
  });

  it("emits a level celebration only for a genuine level advancement after hydration", () => {
    expect(getEligibleCelebration(baseline, { ...baseline, level: 6 }, false)).toBe("level");
    expect(getEligibleCelebration(baseline, baseline, false)).toBeNull();
  });
});
