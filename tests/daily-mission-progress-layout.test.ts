import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(resolve(process.cwd(), "app", "(tabs)", "index.tsx"), "utf8");

describe("Daily Mission Progress percentage layout", () => {
  it("keeps long Daily Power copy inside a flexible column and reserves an unshrinkable percentage slot", () => {
    expect(homeSource).toContain('<View style={styles.progressCopy}>');
    expect(homeSource).toContain('progressTopline: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }');
    expect(homeSource).toContain('progressCopy: { flex: 1, minWidth: 0 }');
    expect(homeSource).toContain('progressPercent: { flexShrink: 0, fontSize: 22, lineHeight: 27, fontWeight: "900" }');
    expect(homeSource).toContain('{Math.round(daily.progress * 100)}%');
  });

  it("leaves the Daily Mission Progress card and its surrounding Home sections in their existing order", () => {
    expect(homeSource).toContain('<CommandCard style={styles.progressCard} accent={colors.success}>');
    expect(homeSource).toContain('<ProgressBar value={daily.progress} color={colors.success} height={10} />');
    expect(homeSource).toContain('<SectionHeader title="Territory capture" action="Mission board"');
    expect(homeSource).toContain('progressCard: { gap: 14 }');
  });
});
