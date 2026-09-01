import { describe, expect, it } from "vitest";

import {
  createInitialState,
  getJournalLifelineContribution,
  normalizeHydratedState,
  rebuildJournalLifelineContributions,
} from "../lib/focus-command";

describe("Journal Lifeline contribution", () => {
  it("keeps the 5% default for older saved profiles and repairs journal rows on both lines", () => {
    const state = createInitialState();
    state.journals = [{ id: "journal_one", localDate: "2026-09-01", betterThanYesterday: true, points: 10, note: "Reviewed carefully", createdAt: "2026-09-01T20:00:00.000Z" }];
    state.lifeline = [{ id: "journal_2026-09-01", localDate: "2026-09-01", year: 2026, lifePerformance: 0.5, experience: 0, source: "journal", note: "Legacy Journal contribution" }];
    const legacyProfile = { ...state.profile } as Record<string, unknown>;
    delete legacyProfile.journalLifelinePercentage;
    state.profile = legacyProfile as unknown as typeof state.profile;

    const hydrated = normalizeHydratedState(state);

    expect(hydrated.profile.journalLifelinePercentage).toBe(5);
    expect(hydrated.lifeline).toEqual([expect.objectContaining({ id: "journal_2026-09-01", lifePerformance: 0.5, experience: 0.5, source: "journal" })]);
  });

  it("uses the selected rate on both lines while preserving a manual baseline", () => {
    const journals = [{ id: "journal_two", localDate: "2026-09-02", betterThanYesterday: false, points: 20, note: "Try again", createdAt: "2026-09-02T20:00:00.000Z" }];
    const manual = { id: "manual", localDate: "2020-01-01", year: 2020, lifePerformance: 4, experience: 6, source: "manual" as const, note: "Baseline" };

    expect(getJournalLifelineContribution(20, 25)).toBe(5);
    expect(rebuildJournalLifelineContributions([manual], journals, 25)).toEqual([
      manual,
      expect.objectContaining({ id: "journal_2026-09-02", lifePerformance: 5, experience: 5, source: "journal" }),
    ]);
  });

  it("bounds the Journal-only rate to a whole 0–100% value", () => {
    expect(getJournalLifelineContribution(13, -2)).toBe(0);
    expect(getJournalLifelineContribution(13, 1000)).toBe(13);
    expect(getJournalLifelineContribution(13, 12.7)).toBe(13 * 0.13);
  });
});
