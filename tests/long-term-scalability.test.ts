import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { createInitialState, getDashboardStats, getMissionCompletionRecordsInLocalDateRange, getTotalPower, type FocusState } from "../lib/focus-command";
import { getMonthlyArchiveLifetimeWindows, getMonthlyCommandArchive } from "../lib/monthly-command-archive";

const analyticsSource = readFileSync(resolve(process.cwd(), "app/analytics.tsx"), "utf8");
const archiveSource = readFileSync(resolve(process.cwd(), "app/command-archive.tsx"), "utf8");

function makeLongHistoryState(): FocusState {
  const base = createInitialState();
  const completions = Array.from({ length: 180 }, (_, index) => {
    const year = 2012 + Math.floor(index / 12);
    const month = (index % 12) + 1;
    const monthValue = String(month).padStart(2, "0");
    const id = `long-run-${index}`;
    const missionId = `long-mission-${index}`;
    const timestamp = `${year}-${monthValue}-15T12:00:00.000Z`;
    return {
      id,
      missionId,
      startedAt: timestamp,
      completedAt: timestamp,
      durationMs: 3_600_000,
      reflectionId: `long-reflection-${index}`,
      progressionEventId: `long-progression-${index}`,
      missionTitle: `Long-term command ${index + 1}`,
      missionSubject: index % 2 ? "Science" : "Writing",
      missionCategory: "Study",
      missionDifficulty: "medium",
      missionBaseXp: 20,
      missionFrequency: "once",
    };
  });

  return {
    ...base,
    profile: { ...base.profile, timezone: "UTC" },
    missions: completions.map((completion) => ({
      id: completion.missionId,
      title: completion.missionTitle,
      subject: completion.missionSubject,
      specificTopic: `Topic ${completion.id}`,
      dueAt: completion.completedAt,
      status: "completed",
      completionHistory: [],
    })),
    missionCompletions: completions,
    reflections: completions.map((completion) => ({
      id: completion.reflectionId,
      missionId: completion.missionId,
      completionId: completion.id,
      createdAt: completion.completedAt,
      focusQuality: 4,
      clarityLevel: 4,
      motivationLevel: 4,
      feelingAfter: "steady",
      energyBefore: 3,
      energyAfter: 3,
      skills: [],
    })),
    progression: completions.map((completion, index) => ({
      id: completion.progressionEventId,
      missionId: completion.missionId,
      completionId: completion.id,
      baseXp: 20,
      comboMultiplier: 1,
      goldMultiplier: 1,
      powerAwarded: 20,
      goldAwarded: index % 3,
      occurredAt: completion.completedAt,
      note: "Completed",
    })),
    transactions: [],
    distractionLogs: [],
  } as unknown as FocusState;
}

describe("Long-term scalability contracts", () => {
  it("retains a 15-year real monthly history while keeping each rendered lifetime window bounded", () => {
    const archive = getMonthlyCommandArchive(makeLongHistoryState());
    const windows = getMonthlyArchiveLifetimeWindows(archive, 24);

    expect(archive.years).toHaveLength(15);
    expect(windows).toHaveLength(8);
    expect(windows.flatMap((window) => window.points)).toHaveLength(180);
    expect(windows.every((window) => window.points.length <= 24)).toBe(true);
    expect(windows.at(-1)?.points.at(-1)?.key).toBe("2026-12");
  });

  it("reuses the derived archive for one immutable long-history snapshot", () => {
    const state = makeLongHistoryState();

    expect(getMonthlyCommandArchive(state)).toBe(getMonthlyCommandArchive(state));
  });

  it("reuses archive output after an unrelated state update while retaining the same durable archive sources", () => {
    const state = makeLongHistoryState();
    const original = getMonthlyCommandArchive(state);
    const unrelatedUpdate = {
      ...state,
      profile: { ...state.profile, soundEnabled: !state.profile.soundEnabled },
    } as FocusState;

    expect(getMonthlyCommandArchive(unrelatedUpdate)).toBe(original);
  });

  it("reuses Dashboard summaries after an unrelated state update without changing their values", () => {
    const state = makeLongHistoryState();
    const original = getDashboardStats(state);
    const unrelatedUpdate = {
      ...state,
      profile: { ...state.profile, soundEnabled: !state.profile.soundEnabled },
    } as FocusState;

    expect(getDashboardStats(unrelatedUpdate)).toBe(original);
  });

  it("reuses the immutable lifetime power aggregate after an unrelated update", () => {
    const state = makeLongHistoryState();
    const original = getTotalPower(state);
    const unrelatedUpdate = {
      ...state,
      profile: { ...state.profile, soundEnabled: !state.profile.soundEnabled },
    } as FocusState;

    expect(getTotalPower(unrelatedUpdate)).toBe(original);
  });

  it("returns an exact visible-week completion slice from a multi-year descending history", () => {
    const state = makeLongHistoryState();
    const slice = getMissionCompletionRecordsInLocalDateRange(state, "2026-12-01", "2026-12-31", "UTC");

    expect(slice).toHaveLength(1);
    expect(slice[0]?.completedAt).toBe("2026-12-15T12:00:00.000Z");
  });

  it("keeps source-tracing Analytics virtualized and isolated from unrelated state updates", () => {
    expect(analyticsSource).toContain("<FlatList");
    expect(analyticsSource).toContain("initialNumToRender={12}");
    expect(analyticsSource).toContain("windowSize={7}");
    expect(analyticsSource).toContain("useFocusCommandSelector(selectAnalyticsDependencies, hasSameAnalyticsDependencies)");
    expect(analyticsSource).toContain("const AnalyticsEntryCard = memo");
    expect(analyticsSource).not.toContain("<ScrollView");
    expect(analyticsSource).not.toContain("useFocusCommand()");
  });

  it("keeps the Command Archive’s existing long-history views virtualized and lifetime drawing bounded", () => {
    expect(archiveSource).toContain("<FlatList");
    expect(archiveSource).toContain("lifetimeWindowIndex");
    expect(archiveSource).toContain("getMonthlyArchiveLifetimeWindows");
  });
});
