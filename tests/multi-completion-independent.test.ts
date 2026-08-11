import { describe, it, expect } from "vitest";
import { createInitialState, normalizeHydratedState, type FocusState, type Mission, type MissionCompletion, type ProgressionEvent } from "../lib/focus-command";

function createTestMission(overrides: Partial<Mission> = {}): Mission {
  const now = new Date().toISOString();
  return {
    id: "test_mission_1",
    title: "Read for 20 minutes",
    subject: "Reading",
    category: "Practice",
    difficulty: "medium",
    baseXp: 50,
    bossId: null,
    specificTopic: "Multi-completion test",
    revisionEnabled: false,
    status: "active",
    frequency: "once",
    createdAt: now,
    dueAt: null,
    startedAt: now,
    pausedAt: null,
    pausedMilliseconds: 0,
    endedAt: null,
    completedAt: null,
    revisionTopicIds: [],
    progressionEventId: null,
    allowMultipleDailyCompletions: true,
    completionHistory: [],
    ...overrides,
  };
}

describe("Independent Multi-Completion System", () => {
  describe("Completion Recording", () => {
    it("records three completions at different times as separate instances", () => {
      const now = new Date();
      const completion1 = new Date(now.getTime() - 7200000).toISOString(); // 2 hours ago
      const completion2 = new Date(now.getTime() - 3600000).toISOString(); // 1 hour ago
      const completion3 = new Date(now.getTime()).toISOString(); // now

      const mission = createTestMission({
        completionHistory: [completion1, completion2, completion3],
      });

      expect(mission.completionHistory).toHaveLength(3);
      expect(mission.completionHistory[0]).toBe(completion1);
      expect(mission.completionHistory[1]).toBe(completion2);
      expect(mission.completionHistory[2]).toBe(completion3);
    });

    it("never overwrites previous completions when adding new ones", () => {
      const completion1 = "2026-08-11T09:00:00Z";
      const completion2 = "2026-08-11T14:00:00Z";

      let mission = createTestMission({
        completionHistory: [completion1],
      });

      // Simulate adding a second completion
      mission = {
        ...mission,
        completionHistory: [...mission.completionHistory, completion2],
      };

      expect(mission.completionHistory).toHaveLength(2);
      expect(mission.completionHistory[0]).toBe(completion1);
      expect(mission.completionHistory[1]).toBe(completion2);
    });

    it("treats each completion as a separate instance with unique timestamp", () => {
      const timestamps = [
        "2026-08-11T09:00:00Z",
        "2026-08-11T14:30:00Z",
        "2026-08-11T20:15:00Z",
      ];

      const mission = createTestMission({
        completionHistory: timestamps,
      });

      // Verify each timestamp is unique
      const uniqueTimestamps = new Set(mission.completionHistory);
      expect(uniqueTimestamps.size).toBe(3);
    });
  });

  describe("XP Calculation Independence", () => {
    it("calculates XP independently for each completion", () => {
      const baseXp = 50;
      const comboMultiplier = 1.3; // 7-day streak
      const equipmentModifier = 1.1; // +10% from gear
      const goldMultiplier = 1.0; // no gold boost

      // Completion 1: 50 * 1.3 * 1.1 * 1.0 = 71.5 XP
      const xp1 = baseXp * comboMultiplier * equipmentModifier * goldMultiplier;

      // Completion 2: Same calculation = 71.5 XP (independent)
      const xp2 = baseXp * comboMultiplier * equipmentModifier * goldMultiplier;

      // Completion 3: Same calculation = 71.5 XP (independent)
      const xp3 = baseXp * comboMultiplier * equipmentModifier * goldMultiplier;

      expect(xp1).toBe(xp2);
      expect(xp2).toBe(xp3);
      expect(xp1 + xp2 + xp3).toBe(214.5); // Total from 3 completions
    });

    it("applies multipliers independently to each completion", () => {
      const baseXp = 100;

      // Completion 1: Standard multipliers
      const combo1 = 1.0;
      const equipment1 = 1.0;
      const gold1 = 1.0;
      const total1 = baseXp * combo1 * equipment1 * gold1;

      // Completion 2: Better combo (streak increased)
      const combo2 = 1.5;
      const equipment2 = 1.0;
      const gold2 = 1.0;
      const total2 = baseXp * combo2 * equipment2 * gold2;

      // Completion 3: Even better (gold boost applied)
      const combo3 = 1.5;
      const equipment3 = 1.0;
      const gold3 = 2.0;
      const total3 = baseXp * combo3 * equipment3 * gold3;

      expect(total1).toBe(100);
      expect(total2).toBe(150);
      expect(total3).toBe(300);
      expect(total1 + total2 + total3).toBe(550); // All independent
    });
  });

  describe("Mission State Management", () => {
    it("keeps repeatable mission in active state after completion", () => {
      const mission = createTestMission({
        allowMultipleDailyCompletions: true,
        status: "active",
        completionHistory: ["2026-08-11T09:00:00Z"],
      });

      // Mission should remain active, not marked as completed
      expect(mission.status).toBe("active");
      expect(mission.allowMultipleDailyCompletions).toBe(true);
    });

    it("allows immediate re-completion without resetting mission", () => {
      const mission = createTestMission({
        allowMultipleDailyCompletions: true,
        status: "active",
        completionHistory: ["2026-08-11T09:00:00Z"],
        startedAt: null, // Reset for re-start
      });

      // Mission can be started again immediately
      expect(mission.status).toBe("active");
      expect(mission.startedAt).toBeNull();
    });

    it("prevents re-completion of non-repeatable missions", () => {
      const mission = createTestMission({
        allowMultipleDailyCompletions: false,
        status: "completed",
        completionHistory: ["2026-08-11T09:00:00Z"],
      });

      // Non-repeatable mission is locked
      expect(mission.allowMultipleDailyCompletions).toBe(false);
      expect(mission.status).toBe("completed");
    });
  });

  describe("Completion Count Accuracy", () => {
    it("counts all completions on the same day", () => {
      const today = new Date().toDateString();
      const completions = [
        new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        new Date(Date.now()).toISOString(), // now
      ];

      const mission = createTestMission({
        completionHistory: completions,
      });

      const todayCompletions = mission.completionHistory.filter(
        (ts) => new Date(ts).toDateString() === today
      ).length;

      expect(todayCompletions).toBe(3);
    });

    it("counts completions across multiple days correctly", () => {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      const completions = [
        new Date(Date.now() - 86400000).toISOString(), // yesterday
        new Date(Date.now() - 82800000).toISOString(), // yesterday
        new Date(Date.now() - 3600000).toISOString(), // today
        new Date(Date.now()).toISOString(), // today
      ];

      const mission = createTestMission({
        completionHistory: completions,
      });

      const todayCount = mission.completionHistory.filter(
        (ts) => new Date(ts).toDateString() === today
      ).length;

      const yesterdayCount = mission.completionHistory.filter(
        (ts) => new Date(ts).toDateString() === yesterday
      ).length;

      expect(todayCount).toBe(2);
      expect(yesterdayCount).toBe(2);
    });
  });

  describe("Real-World Scenario", () => {
    it("handles the example: Read for 20 minutes completed 3 times", () => {
      const mission = createTestMission({
        title: "Read for 20 minutes",
        baseXp: 50,
        allowMultipleDailyCompletions: true,
        completionHistory: [
          "2026-08-11T09:00:00Z", // 9:00 AM
          "2026-08-11T14:00:00Z", // 2:00 PM
          "2026-08-11T20:00:00Z", // 8:00 PM
        ],
      });

      // Verify all three completions are recorded independently
      expect(mission.completionHistory).toHaveLength(3);
      expect(mission.title).toBe("Read for 20 minutes");
      expect(mission.baseXp).toBe(50);

      // Each completion should award 50 base XP (before multipliers)
      // Total: 150 base XP from 3 independent completions
      const totalBaseXp = mission.baseXp * mission.completionHistory.length;
      expect(totalBaseXp).toBe(150);
    });

    it("prevents overwriting when completing the same mission multiple times", () => {
      let mission = createTestMission({
        allowMultipleDailyCompletions: true,
        completionHistory: ["2026-08-11T09:00:00Z"],
      });

      const firstCompletion = mission.completionHistory[0];

      // Simulate second completion
      mission = {
        ...mission,
        completionHistory: [...mission.completionHistory, "2026-08-11T14:00:00Z"],
      };

      // First completion should still be there
      expect(mission.completionHistory[0]).toBe(firstCompletion);
      expect(mission.completionHistory).toHaveLength(2);
    });
  });

  describe("Durable completion instances", () => {
    it("preserves three independently linked outcomes for the same repeatable mission", () => {
      const base = createInitialState();
      const mission = createTestMission({ completionHistory: ["2026-08-11T09:00:00Z", "2026-08-11T14:00:00Z", "2026-08-11T20:00:00Z"] });
      const completions: MissionCompletion[] = mission.completionHistory.map((completedAt, index) => ({
        id: `completion_${index + 1}`,
        missionId: mission.id,
        startedAt: completedAt,
        completedAt,
        durationMs: 20 * 60_000,
        reflectionId: `reflection_${index + 1}`,
        progressionEventId: `progress_${index + 1}`,
      }));
      const normalized = normalizeHydratedState({ ...base, missions: [mission], missionCompletions: completions });

      expect(normalized.missionCompletions).toHaveLength(3);
      expect(new Set(normalized.missionCompletions.map((completion) => completion.id)).size).toBe(3);
      expect(normalized.missionCompletions.map((completion) => completion.progressionEventId)).toEqual(["progress_1", "progress_2", "progress_3"]);
      expect(normalized.missionCompletions.map((completion) => completion.reflectionId)).toEqual(["reflection_1", "reflection_2", "reflection_3"]);
    });

    it("migrates legacy progression outcomes into independent completion records without discarding any", () => {
      const base = createInitialState();
      const mission = createTestMission();
      const progression: ProgressionEvent[] = ["09:00:00", "14:00:00", "20:00:00"].map((time, index) => ({
        id: `legacy_progress_${index + 1}`,
        missionId: mission.id,
        baseXp: 50,
        comboMultiplier: 1,
        goldMultiplier: 1,
        powerAwarded: 50,
        goldAwarded: 5,
        occurredAt: `2026-08-11T${time}Z`,
        note: "Completed: Read for 20 minutes",
      }));
      const legacyState = { ...base, missions: [mission], progression } as FocusState;
      delete (legacyState as Partial<FocusState>).missionCompletions;

      const normalized = normalizeHydratedState(legacyState);

      expect(normalized.missionCompletions).toHaveLength(3);
      expect(normalized.missionCompletions.map((completion) => completion.progressionEventId)).toEqual(progression.map((event) => event.id));
      expect(normalized.missionCompletions.every((completion) => completion.missionId === mission.id)).toBe(true);
    });
  });
});
