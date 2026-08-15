import { describe, expect, it } from "vitest";

import { createInitialState, type FocusState } from "../lib/focus-command";
import { createOfflineBackupArchive, parseOfflineBackupArchive } from "../lib/offline-backup-format";
import {
  filterMonthlyArchiveStudiedTopics,
  getMonthlyArchiveLifetimeWindows,
  getMonthlyArchiveMonthComparison,
  getMonthlyArchiveMetricSeries,
  getMonthlyArchiveMetricValue,
  getMonthlyArchiveSubjectLifetimeWindows,
  getMonthlyArchiveStudiedTopics,
  getMonthlyCommandArchive,
} from "../lib/monthly-command-archive";

function makeState(): FocusState {
  return {
    profile: { timezone: "UTC" },
    missions: [
      { id: "jan-mission", title: "January Physics", subject: "Physics", specificTopic: "Kinematics", dueAt: "2025-01-11T12:00:00.000Z", status: "completed", completionHistory: [] },
      { id: "feb-mission", title: "February Writing", subject: "Writing", specificTopic: "Argument flow", dueAt: "2026-02-18T12:00:00.000Z", status: "completed", completionHistory: [] },
      { id: "march-plan", title: "March Planning", subject: "Planning", dueAt: "2026-03-02T12:00:00.000Z", status: "planned", completionHistory: [] },
    ],
    missionCompletions: [
      { id: "jan-run", missionId: "jan-mission", startedAt: "2025-01-11T08:00:00.000Z", completedAt: "2025-01-11T10:00:00.000Z", durationMs: 7_200_000, reflectionId: "jan-reflection", progressionEventId: "jan-progression", missionTitle: "January Physics", missionSubject: "Physics", missionCategory: "Study", missionDifficulty: "medium", missionBaseXp: 20, missionFrequency: "once" },
      { id: "feb-run", missionId: "feb-mission", startedAt: "2026-02-18T08:00:00.000Z", completedAt: "2026-02-18T09:30:00.000Z", durationMs: 5_400_000, reflectionId: "feb-reflection", progressionEventId: "feb-progression", missionTitle: "February Writing", missionSubject: "Writing", missionCategory: "Study", missionDifficulty: "medium", missionBaseXp: 40, missionFrequency: "once" },
    ],
    reflections: [
      { id: "jan-reflection", missionId: "jan-mission", completionId: "jan-run", createdAt: "2025-01-11T10:00:00.000Z", feelingAfter: "steady", focusQuality: 4, clarityLevel: 4, motivationLevel: 3, energyBefore: 2, energyAfter: 3 },
      { id: "feb-reflection", missionId: "feb-mission", completionId: "feb-run", createdAt: "2026-02-18T09:30:00.000Z", feelingAfter: "great", focusQuality: 5, clarityLevel: 4, motivationLevel: 5, energyBefore: 3, energyAfter: 5 },
    ],
    progression: [
      { id: "jan-progression", missionId: "jan-mission", completionId: "jan-run", baseXp: 20, comboMultiplier: 1, goldMultiplier: 1, powerAwarded: 20, goldAwarded: 2, occurredAt: "2025-01-11T10:00:00.000Z", note: "Completed" },
      { id: "feb-progression", missionId: "feb-mission", completionId: "feb-run", baseXp: 40, comboMultiplier: 1.5, goldMultiplier: 1, powerAwarded: 60, goldAwarded: 6, occurredAt: "2026-02-18T09:30:00.000Z", note: "Completed" },
    ],
    transactions: [
      { id: "jan-gold", type: "power_gold", goldDelta: 2, sourceId: "jan-progression", occurredAt: "2025-01-11T10:00:00.000Z", effectiveOn: "2025-01-11", note: "Power conversion", completionId: "jan-run" },
      { id: "feb-gold", type: "power_gold", goldDelta: 6, sourceId: "feb-progression", occurredAt: "2026-02-18T09:30:00.000Z", effectiveOn: "2026-02-18", note: "Power conversion", completionId: "feb-run" },
    ],
    distractionLogs: [
      { id: "feb-distraction", missionId: "feb-mission", category: "phone", occurredAt: "2026-02-19T09:30:00.000Z" },
    ],
    srsTopics: [
      { id: "kinematics-review", completionId: "jan-run", missionId: "jan-mission", subject: "Physics", topic: "Kinematics", status: "scheduled", stage: 1, dueDate: "2025-01-12", createdAt: "2025-01-11T10:00:00.000Z" },
      { id: "argument-review", completionId: "feb-run", missionId: "feb-mission", subject: "Writing", topic: "Argument flow", status: "completed", stage: 3, dueDate: "2026-02-19", createdAt: "2026-02-18T09:30:00.000Z", completedAt: "2026-03-20T09:30:00.000Z" },
    ],
  } as unknown as FocusState;
}

describe("getMonthlyCommandArchive", () => {
  it("derives lifetime years, honest monthly values, and real local future periods without persisting archive state", () => {
    const state = makeState();
    const archive = getMonthlyCommandArchive(state);
    const february = archive.years.find((year) => year.year === 2026)?.months[1];
    const march = archive.years.find((year) => year.year === 2026)?.months[2];
    const january = archive.years.find((year) => year.year === 2025)?.months[0];

    expect(archive.years.map((year) => year.year)).toEqual([2026, 2025]);
    expect(february).toMatchObject({ hasData: true, xpEarned: 60, goldEarned: 6, investedMs: 5_400_000, completedMissions: 1, averageFocus: 5, averageClarity: 4, averageMotivation: 5, mostCommonFeeling: "Great", energyShift: 2, distractionCount: 1, topDistractionCategory: "Phone" });
    expect(february?.subjectBreakdown).toEqual([{ label: "Writing", durationMs: 5_400_000, completedMissions: 1, xpEarned: 60 }]);
    expect(march).toMatchObject({ hasData: true, completedMissions: 0, scheduledPlans: 1 });
    expect(january).toMatchObject({ hasData: true, xpEarned: 20, goldEarned: 2, mostCommonFeeling: "Steady" });
    expect(state.missionCompletions).toHaveLength(2);
    expect((state as unknown as { monthlyArchive?: unknown }).monthlyArchive).toBeUndefined();
  });

  it("returns daily metric series and does not double-count completion-linked gold transactions", () => {
    const february = getMonthlyCommandArchive(makeState()).years[0].months[1];
    const xp = getMonthlyArchiveMetricSeries(february, "xp");
    const gold = getMonthlyArchiveMetricSeries(february, "gold");

    expect(xp).toHaveLength(28);
    expect(xp[17]).toMatchObject({ label: "", value: 60 });
    expect(gold[17]).toMatchObject({ value: 6 });
    expect(getMonthlyArchiveMetricValue(february, "time")).toBe(1.5);
    expect(getMonthlyArchiveMetricValue(february, "feeling")).toBe(5);
    expect(february.growthScore).toBeGreaterThan(0);
  });

  it("rebuilds the identical archive after the existing Offline Backup File round trip", () => {
    const original = { ...createInitialState(), ...makeState() } as FocusState;
    const restored = parseOfflineBackupArchive(createOfflineBackupArchive(original).archive).state;

    expect(getMonthlyCommandArchive(restored)).toEqual(getMonthlyCommandArchive(original));
  });

  it("builds continuous bounded lifetime windows and never fabricates activity for calendar gaps", () => {
    const windows = getMonthlyArchiveLifetimeWindows(getMonthlyCommandArchive(makeState()), 24);

    expect(windows).toHaveLength(1);
    expect(windows[0].points.map((point) => point.key)).toEqual(expect.arrayContaining(["2025-01", "2025-12", "2026-01", "2026-02"]));
    expect(windows[0].points.find((point) => point.key === "2025-12")?.value).toBe(0);
    expect(windows[0].points.find((point) => point.key === "2026-02")?.value).toBeGreaterThan(0);
  });

  it("reports only actually studied topics with their current existing revision-cadence percentage", () => {
    const state = makeState();
    const yearly = getMonthlyArchiveStudiedTopics(state, { year: 2026 });
    const january = getMonthlyArchiveStudiedTopics(state, { monthKey: "2025-01" });

    expect(yearly).toEqual([expect.objectContaining({ subject: "Writing", topic: "Argument flow", revisionCompletionPercent: 100, revisionStatus: "completed" })]);
    expect(january).toEqual([expect.objectContaining({ subject: "Physics", topic: "Kinematics", revisionCompletionPercent: 33, revisionStatus: "scheduled" })]);
  });

  it("builds a subject-only lifetime lens from that subject’s own completed runs, earned XP, and invested time", () => {
    const windows = getMonthlyArchiveSubjectLifetimeWindows(getMonthlyCommandArchive(makeState()), "Physics", 24);
    const points = windows[0].points;

    expect(points.find((point) => point.key === "2025-01")).toMatchObject({ value: 50, xpEarned: 20, completedMissions: 1, investedMs: 7_200_000 });
    expect(points.find((point) => point.key === "2026-02")).toMatchObject({ value: 0, xpEarned: 0, completedMissions: 0, investedMs: 0 });
  });

  it("returns a transparent two-month comparison with accurate deltas and subject distribution", () => {
    const archive = getMonthlyCommandArchive(makeState());
    const january = archive.years.find((year) => year.year === 2025)?.months[0];
    const february = archive.years.find((year) => year.year === 2026)?.months[1];
    expect(january).toBeDefined();
    expect(february).toBeDefined();

    const comparison = getMonthlyArchiveMonthComparison(january!, february!);
    expect(comparison.metrics.find((metric) => metric.key === "xp")).toEqual(expect.objectContaining({ firstValue: 20, secondValue: 60, delta: 40 }));
    expect(comparison.metrics.find((metric) => metric.key === "distractions")).toEqual(expect.objectContaining({ firstValue: 0, secondValue: 1, delta: 1 }));
    expect(comparison.subjects).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "Physics", firstCompletedMissions: 1, secondCompletedMissions: 0, firstInvestedMs: 7_200_000 }),
      expect.objectContaining({ label: "Writing", firstCompletedMissions: 0, secondCompletedMissions: 1, secondInvestedMs: 5_400_000 }),
    ]));
  });

  it("filters yearly studied topics by topic or subject without regard to case", () => {
    const allTopics = getMonthlyArchiveStudiedTopics(makeState());

    expect(filterMonthlyArchiveStudiedTopics(allTopics, "PHY")).toEqual([expect.objectContaining({ topic: "Kinematics", subject: "Physics" })]);
    expect(filterMonthlyArchiveStudiedTopics(allTopics, "argument")).toEqual([expect.objectContaining({ topic: "Argument flow", subject: "Writing" })]);
    expect(filterMonthlyArchiveStudiedTopics(allTopics, "   ")).toBe(allTopics);
  });
});
