import { describe, expect, it } from "vitest";

import type { FocusState } from "../lib/focus-command";
import {
  assembleFocusWorkbookPayload,
  GOOGLE_SHEETS_MAX_CELL_CHARACTERS,
  makeFocusWorkbookValueRanges,
} from "../lib/google-sheets-payload";

function makeOversizedState(): FocusState {
  const oversizedJournalNote = "A".repeat(GOOGLE_SHEETS_MAX_CELL_CHARACTERS + 9_000);
  return {
    schemaVersion: 1,
    hydrated: true,
    profile: {} as FocusState["profile"],
    combo: {} as FocusState["combo"],
    missions: [],
    missionCompletions: [],
    reflections: [],
    srsTopics: [],
    srsActivityLog: [],
    bosses: [],
    journals: [{
      id: "oversized-journal",
      localDate: "2026-08-14",
      betterThanYesterday: true,
      points: 5,
      note: oversizedJournalNote,
      createdAt: "2026-08-14T00:00:00.000Z",
    }],
    distractionLogs: [],
    rewards: [],
    transactions: [],
    inventory: [],
    progression: [],
    characterMilestones: [],
    lifeline: [],
    customQuestions: [],
    customGraphs: [],
    goldPowerCarry: 0,
    googleSheet: {} as FocusState["googleSheet"],
    allEquipment: [],
    userEquipment: [],
  };
}

describe("Google Sheets cell-limit export", () => {
  it("chunks an oversized full snapshot and caps every readable-tab cell below the Sheets limit", () => {
    const ranges = makeFocusWorkbookValueRanges(makeOversizedState());
    const appState = ranges.find((range) => range.range === "App_State!A1");
    const journal = ranges.find((range) => range.range === "Journal!A1");

    expect(appState).toBeDefined();
    expect(journal).toBeDefined();
    expect(appState?.values.some((row) => row[0] === "payloadChunkCount")).toBe(true);
    const journalNoteColumn = journal?.values[0]?.indexOf("note") ?? -1;
    expect(journalNoteColumn).toBeGreaterThanOrEqual(0);
    expect(journal?.values[1]?.[journalNoteColumn]).toContain("[Truncated in this readable Google Sheets tab.");

    const reassembledPayload = assembleFocusWorkbookPayload(new Map(appState?.values.slice(1).map(([key, value]) => [key, value])));
    expect(reassembledPayload).toContain("A".repeat(GOOGLE_SHEETS_MAX_CELL_CHARACTERS + 9_000));
    expect(assembleFocusWorkbookPayload(new Map([["payload", '{"legacy":true}']]))).toBe('{"legacy":true}');

    for (const range of ranges) {
      for (const row of range.values) {
        for (const value of row) {
          expect(value.length).toBeLessThanOrEqual(GOOGLE_SHEETS_MAX_CELL_CHARACTERS);
        }
      }
    }
  });
});
