import { describe, expect, it, vi } from "vitest";

vi.mock("expo-secure-store", () => ({
  deleteItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
}));
vi.mock("react-native", () => ({ Platform: { OS: "web" } }));

import { buildFocusWorkbookValueRanges, GOOGLE_SHEETS_SAFE_CELL_CHARACTERS } from "../lib/google-sheets";
import type { FocusState } from "../lib/focus-command";

describe("Google Sheets workbook serialization", () => {
  it("splits an oversized full-state snapshot into safe ordered cells while retaining every character", () => {
    const oversizedJournal = "journal-entry-".repeat(5_500);
    const state = {
      schemaVersion: 1,
      hydrated: true,
      profile: {},
      combo: {},
      missions: [],
      missionCompletions: [],
      reflections: [],
      srsTopics: [],
      bosses: [],
      journals: [{ id: "journal-1", content: oversizedJournal }],
      rewards: [],
      transactions: [],
      inventory: [],
      progression: [],
      lifeline: [],
      customQuestions: [],
      customGraphs: [],
      goldPowerCarry: 0,
      googleSheet: {},
      allEquipment: [],
      userEquipment: [],
    } as unknown as FocusState;

    const ranges = buildFocusWorkbookValueRanges(state);
    const appState = ranges.find((entry) => entry.range === "App_State!A1");
    const journal = ranges.find((entry) => entry.range === "Journal!A1");

    expect(appState).toBeDefined();
    expect(journal).toBeDefined();
    const chunks = appState!.values
      .slice(1)
      .filter(([key]) => String(key).startsWith("payload_"))
      .map(([, value]) => String(value));

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= GOOGLE_SHEETS_SAFE_CELL_CHARACTERS)).toBe(true);
    expect(JSON.parse(chunks.join("")).journals[0].content).toBe(oversizedJournal);
    expect(journal!.values.flat().every((value) => String(value).length <= GOOGLE_SHEETS_SAFE_CELL_CHARACTERS)).toBe(true);
  });
});
