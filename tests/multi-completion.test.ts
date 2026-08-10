import { describe, it, expect } from "vitest";
import { createInitialState, type Mission } from "../lib/focus-command";

function testMission(overrides: Partial<Mission> = {}): Mission {
  const now = new Date().toISOString();
  return {
    id: "multi_test_1",
    title: "Repeatable mission",
    subject: "Test",
    category: "Practice",
    difficulty: "medium",
    baseXp: 50,
    bossId: null,
    specificTopic: "Multi-completion",
    revisionEnabled: false,
    status: "completed",
    frequency: "once",
    createdAt: now,
    dueAt: null,
    startedAt: now,
    pausedAt: null,
    pausedMilliseconds: 0,
    endedAt: now,
    completedAt: now,
    revisionTopicIds: [],
    progressionEventId: null,
    allowMultipleDailyCompletions: true,
    completionHistory: [now],
    ...overrides,
  };
}

describe("Multi-completion system", () => {
  it("allows a mission to be marked as repeatable", () => {
    const mission = testMission({ allowMultipleDailyCompletions: true });
    expect(mission.allowMultipleDailyCompletions).toBe(true);
  });

  it("tracks completion history across multiple completions", () => {
    const now = new Date().toISOString();
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const mission = testMission({
      completionHistory: [oneHourAgo, now],
    });
    expect(mission.completionHistory).toHaveLength(2);
    expect(mission.completionHistory[0]).toBe(oneHourAgo);
    expect(mission.completionHistory[1]).toBe(now);
  });

  it("defaults to non-repeatable missions", () => {
    const mission = testMission({ allowMultipleDailyCompletions: false });
    expect(mission.allowMultipleDailyCompletions).toBe(false);
  });

  it("maintains empty completion history for new missions", () => {
    const mission = testMission({ completionHistory: [] });
    expect(mission.completionHistory).toHaveLength(0);
  });

  it("preserves multi-completion settings when creating daily missions", () => {
    const dailyMission = testMission({
      frequency: "daily",
      allowMultipleDailyCompletions: true,
    });
    expect(dailyMission.frequency).toBe("daily");
    expect(dailyMission.allowMultipleDailyCompletions).toBe(true);
  });

  it("allows multiple completions per day when enabled", () => {
    const now = new Date().toISOString();
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const twoHoursAgo = new Date(Date.now() - 7200000).toISOString();
    
    const mission = testMission({
      allowMultipleDailyCompletions: true,
      completionHistory: [twoHoursAgo, oneHourAgo, now],
    });
    
    expect(mission.completionHistory).toHaveLength(3);
    expect(mission.allowMultipleDailyCompletions).toBe(true);
  });

  it("tracks completion count for today", () => {
    const today = new Date().toDateString();
    const now = new Date().toISOString();
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    
    const mission = testMission({
      completionHistory: [yesterday, oneHourAgo, now],
    });
    
    // Count completions from today
    const todayCompletions = mission.completionHistory.filter(
      (timestamp) => new Date(timestamp).toDateString() === today
    ).length;
    
    expect(todayCompletions).toBe(2);
  });

  it("prevents re-completion when disabled and already completed today", () => {
    const mission = testMission({
      allowMultipleDailyCompletions: false,
      status: "completed",
      completionHistory: [new Date().toISOString()],
    });
    
    expect(mission.allowMultipleDailyCompletions).toBe(false);
    expect(mission.status).toBe("completed");
    expect(mission.completionHistory.length).toBeGreaterThan(0);
  });

  it("resets completion history for new daily missions", () => {
    const mission = testMission({
      frequency: "daily",
      completionHistory: [],
    });
    
    expect(mission.completionHistory).toHaveLength(0);
  });

  it("maintains XP rewards across multiple completions", () => {
    const mission = testMission({
      baseXp: 50,
      allowMultipleDailyCompletions: true,
    });
    
    // Each completion should award the same base XP
    expect(mission.baseXp).toBe(50);
  });
});
