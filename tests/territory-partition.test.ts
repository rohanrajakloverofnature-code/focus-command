import { describe, expect, it } from "vitest";

import { DYNAMIC_TERRITORY_INTERIOR_CELL_COUNT, getDynamicTerritories } from "../lib/territory-partition";

describe("dynamic India subject territories", () => {
  it("partitions every available India interior cell exactly once while preserving a visible region for every subject", () => {
    const territories = getDynamicTerritories([
      { subject: "History", capture: 0 },
      { subject: "Math", capture: 0.5 },
      { subject: "Physics", capture: 1 },
      { subject: "Biology", capture: 0.1 },
    ]);

    expect(territories).toHaveLength(4);
    expect(territories.every((territory) => territory.cellCount > 0 && territory.cellCount === territory.targetCellCount && territory.path.startsWith("M"))).toBe(true);
    expect(territories.reduce((sum, territory) => sum + territory.cellCount, 0)).toBe(DYNAMIC_TERRITORY_INTERIOR_CELL_COUNT);
  });

  it("gives greater progress a larger territory while retaining a minimum share for zero-progress subjects", () => {
    const territories = getDynamicTerritories([
      { subject: "Beginning", capture: 0 },
      { subject: "Growing", capture: 0.5 },
      { subject: "Complete", capture: 1 },
    ]);
    const countFor = (subject: string) => territories.find((territory) => territory.subject === subject)!.cellCount;

    expect(countFor("Beginning")).toBeGreaterThan(0);
    expect(countFor("Growing")).toBeGreaterThan(countFor("Beginning"));
    expect(countFor("Complete")).toBeGreaterThan(countFor("Growing"));
  });

  it("deterministically reshapes territory quotas when a subject changes progress or subjects are added", () => {
    const baseline = getDynamicTerritories([
      { subject: "Math", capture: 0.2 },
      { subject: "Physics", capture: 0.8 },
    ]);
    const progressed = getDynamicTerritories([
      { subject: "Math", capture: 1 },
      { subject: "Physics", capture: 0.8 },
      { subject: "Chemistry", capture: 0 },
    ]);
    const baselineMath = baseline.find((territory) => territory.subject === "Math")!;
    const progressedMath = progressed.find((territory) => territory.subject === "Math")!;

    expect(progressedMath.cellCount).toBeGreaterThan(baselineMath.cellCount);
    expect(progressedMath.path).not.toBe(baselineMath.path);
    expect(progressed.reduce((sum, territory) => sum + territory.cellCount, 0)).toBe(DYNAMIC_TERRITORY_INTERIOR_CELL_COUNT);
    expect(getDynamicTerritories([{ subject: "Math", capture: 1 }, { subject: "Physics", capture: 0.8 }, { subject: "Chemistry", capture: 0 }])).toEqual(progressed);
  });
});
