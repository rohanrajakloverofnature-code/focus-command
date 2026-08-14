import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const journalSource = readFileSync(resolve(process.cwd(), "app/(tabs)/journal.tsx"), "utf8");

describe("Journal composer header layout", () => {
  it("reserves a flexible, shrink-safe title column for narrow portrait screens", () => {
    expect(journalSource).toContain('composerCopy: { flex: 1, minWidth: 0 }');
    expect(journalSource).toContain('<View style={styles.composerCopy}>');
  });

  it("allows the title/date to use a second line while retaining the full Today pill", () => {
    expect(journalSource).toContain('<Text numberOfLines={2} style={[styles.composerTitle, { color: colors.foreground }]}>Journal entry · {today}</Text>');
    expect(journalSource).toContain('<StatusPill label="TODAY" tone="primary" icon="book.closed.fill" />');
    expect(journalSource.indexOf('<View style={styles.composerCopy}>')).toBeLessThan(journalSource.indexOf('<StatusPill label="TODAY" tone="primary" icon="book.closed.fill" />'));
  });
});
