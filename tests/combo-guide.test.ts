import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const homeSource = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");
const guideSource = readFileSync(resolve(process.cwd(), "components/combo-guide.tsx"), "utf8");

describe("streak and combo guide", () => {
  it("keeps the explanation behind a compact Home affordance", () => {
    expect(homeSource).toContain("Explain streak and combo rules");
    expect(homeSource).toContain("<ComboGuide visible={showComboGuide}");
    expect(homeSource).toContain("currentStreak={dailyCommandBriefing.streakDays}");
  });

  it("explains completion, short gaps, recovery, and the hard reset", () => {
    expect(guideSource).toContain("Complete at least one mission on each local calendar day");
    expect(guideSource).toContain("Multiple completed missions on the same day count as one streak day");
    expect(guideSource).toContain("After one missed day");
    expect(guideSource).toContain("After two missed days");
    expect(guideSource).toContain("next consecutive day");
    expect(guideSource).toContain("Three or more missed days start a new streak at 1 day and 1.00×");
    expect(guideSource).toContain("Starting a mission is not enough");
  });
});
