import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "app/super-dashboard.tsx"), "utf8");

describe("Super Dashboard mobile layout and signal controls", () => {
  it("keeps range choices in readable three-plus-two rows", () => {
    expect(source).toContain("const RANGE_ROWS");
    expect(source).toContain('{ id: "today", label: "TODAY" }');
    expect(source).toContain('{ id: "lifetime", label: "LIFETIME" }');
    expect(source).toContain("rangeStack");
    expect(source).toContain("minHeight: 39");
  });

  it("uses an explicit two-column metric grid rather than squeezed flexible cards", () => {
    expect(source).toContain('flexBasis: "48.5%"');
    expect(source).toContain('width: "48.5%"');
    expect(source).not.toContain('metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }');
  });

  it("provides visibly switchable Attention, Drive, and Recovery signal groups", () => {
    expect(source).toContain('id: "attention", label: "ATTENTION"');
    expect(source).toContain('id: "drive", label: "DRIVE"');
    expect(source).toContain('id: "recovery", label: "RECOVERY"');
    expect(source).toContain("setSignalMode(mode.id)");
    expect(source).toContain("selectedSignalPoints");
    expect(source).toContain("<BarsChart points={selectedSignalPoints}");
  });

  it("explains paired days and preserves conservative personal-pattern guardrails", () => {
    expect(source).toContain("matched day");
    expect(source).toContain("14 matched days");
    expect(source).toContain("same-day association, not proof of cause");
    expect(source).toContain("Clear separation of stress records");
    expect(source).toContain("Where progress was recorded");
  });
});
