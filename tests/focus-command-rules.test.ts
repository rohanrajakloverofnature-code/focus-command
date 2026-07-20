import { describe, expect, it } from "vitest";

import {
  createInitialState,
  getActiveGoldMultiplier,
  getBossProgress,
  getCurrentTitle,
  getDashboardStats,
  getEmotionalPatternForecast,
  getWellbeingInsight,
  getEnergy,
  getGoldBalance,
  getLevelInfo,
  getMissionInvestedMilliseconds,
  getPendingRevisions,
  getSubjectCapture,
  getTotalPower,
  toLocalDate,
  type FocusState,
  type Mission,
} from "../lib/focus-command";

function completedMission(overrides: Partial<Mission> = {}): Mission {
  const endedAt = new Date().toISOString();
  const startedAt = new Date(Date.now() - 60 * 60_000).toISOString();
  return {
    id: "mission_1",
    title: "Deterministic mission",
    subject: "Math",
    category: "Study",
    difficulty: "medium",
    baseXp: 50,
    bossId: null,
    specificTopic: "Vectors",
    revisionEnabled: true,
    status: "completed",
    frequency: "once",
    createdAt: startedAt,
    dueAt: null,
    startedAt,
    pausedAt: null,
    pausedMilliseconds: 10 * 60_000,
    endedAt,
    completedAt: endedAt,
    revisionTopicIds: [],
    progressionEventId: null,
    ...overrides,
  };
}

function stateWithToday(): FocusState {
  const state = createInitialState();
  state.hydrated = true;
  return state;
}

describe("Focus Command deterministic gameplay rules", () => {
  it("calculates power levels and titles from the immutable progression ledger", () => {
    const state = stateWithToday();
    state.progression.push(
      { id: "p1", missionId: null, baseXp: 50, comboMultiplier: 1, goldMultiplier: 1, powerAwarded: 350, goldAwarded: 0, occurredAt: new Date().toISOString(), note: "test" },
      { id: "p2", missionId: null, baseXp: 50, comboMultiplier: 1, goldMultiplier: 1, powerAwarded: 120, goldAwarded: 0, occurredAt: new Date().toISOString(), note: "test" },
    );

    expect(getTotalPower(state)).toBe(470);
    expect(getLevelInfo(state)).toMatchObject({ level: 5, currentLevelPower: 46, powerForNextLevel: 68 });
    expect(getCurrentTitle(state).index).toBe(0);

    state.profile.titleChangeInterval = 2;
    expect(getCurrentTitle(state).index).toBe(2);
    expect(getCurrentTitle(state).progress).toBeGreaterThan(0);
  });

  it("tracks gold balance separately from lifetime income and activates only effective multiplier inventory", () => {
    const state = stateWithToday();
    const today = toLocalDate(new Date().toISOString(), state.profile.timezone);
    state.transactions.push(
      { id: "t1", type: "power_gold", goldDelta: 80, sourceId: null, occurredAt: new Date().toISOString(), effectiveOn: null, note: "earned" },
      { id: "t2", type: "purchase", goldDelta: -30, sourceId: "reward_1", occurredAt: new Date().toISOString(), effectiveOn: today, note: "spent" },
    );
    state.rewards.push({ id: "reward_1", title: "Tomorrow boost", description: "", category: "multiplier", goldCost: 30, lootEnabled: false, lootWeight: 0, goldMultiplier: 2, createdAt: new Date().toISOString(), active: true });
    state.inventory.push({ id: "i1", rewardId: "reward_1", acquiredAt: new Date().toISOString(), effectiveOn: today, consumedAt: null, active: true });

    expect(getGoldBalance(state)).toBe(50);
    expect(getActiveGoldMultiplier(state, today)).toBe(2);
    expect(getActiveGoldMultiplier(state, "2001-01-01")).toBe(1);
  });

  it("subtracts pauses from task timing and derives energy use from completed daily missions", () => {
    const state = stateWithToday();
    const mission = completedMission();
    state.missions.push(mission);

    expect(getMissionInvestedMilliseconds(mission)).toBe(50 * 60_000);
    expect(getEnergy(state)).toMatchObject({ used: 15, remaining: 85, maximum: 100 });
  });

  it("returns only due revision topics and measures subject capture from completed reviews", () => {
    const state = stateWithToday();
    const today = toLocalDate(new Date().toISOString(), state.profile.timezone);
    state.srsTopics.push(
      { id: "due", missionId: null, subject: "Physics", topic: "Kinematics", stage: 0, dueDate: today, completedAt: null, createdAt: new Date().toISOString(), status: "due" },
      { id: "future", missionId: null, subject: "Physics", topic: "Dynamics", stage: 1, dueDate: "2999-01-01", completedAt: null, createdAt: new Date().toISOString(), status: "scheduled" },
      { id: "done", missionId: null, subject: "Physics", topic: "Forces", stage: 3, dueDate: today, completedAt: new Date().toISOString(), createdAt: new Date().toISOString(), status: "completed" },
    );

    expect(getPendingRevisions(state).map((topic) => topic.id)).toEqual(["due"]);
    expect(getSubjectCapture(state)).toEqual([{ subject: "Physics", completed: 1, total: 3, capture: 1 / 3, active: 0, planned: 0 }]);
  });

  it("starts with four configurable behavioral lenses and independent reminder categories", () => {
    const state = stateWithToday();
    expect(state.profile.emotionalCharts.map((chart) => chart.id)).toEqual(["energy_shift", "focus_friction", "stress_clarity", "motivation_distraction"]);
    expect(state.profile.emotionalCharts.every((chart) => chart.enabled)).toBe(true);
    expect(state.profile.notificationRules).toMatchObject({ dailyMissionEnabled: false, revisionEnabled: true, multiplierEnabled: true, achievementEnabled: true });
  });

  it("produces a transparent free on-device emotional-pattern forecast from reflection signals", () => {
    const state = stateWithToday();
    const mission = completedMission({ id: "forecast_mission" });
    state.missions.push(mission);
    state.reflections.push(
      { id: "forecast_1", missionId: mission.id, createdAt: new Date(Date.now() - 86_400_000).toISOString(), feelingBefore: "steady", feelingAfter: "charged", frictionName: "", frictionRating: 1, provokingThought: "", provokingThoughtRating: 1, skills: [], miniAchievement: "", miniAchievementRating: 3, customAnswers: {}, energyAfter: 4, focusQuality: 5, stressLevel: 1, clarityLevel: 4, motivationLevel: 5, distractionLevel: 1 },
      { id: "forecast_2", missionId: mission.id, createdAt: new Date().toISOString(), feelingBefore: "steady", feelingAfter: "great", frictionName: "", frictionRating: 1, provokingThought: "", provokingThoughtRating: 1, skills: [], miniAchievement: "", miniAchievementRating: 4, customAnswers: {}, energyAfter: 5, focusQuality: 5, stressLevel: 1, clarityLevel: 5, motivationLevel: 4, distractionLevel: 1 },
    );
    const forecast = getEmotionalPatternForecast(state);
    expect(forecast.available).toBe(true);
    expect(forecast.score).toBeGreaterThan(60);
    expect(forecast.sampleSize).toBe(2);
    expect(forecast.signals).toHaveLength(5);
  });

  it("builds a transparent non-clinical wellbeing insight from logged ratings without inferring missing data", () => {
    const state = stateWithToday();
    const mission = completedMission({ id: "wellbeing_mission" });
    state.missions.push(mission);
    state.reflections.push(
      { id: "wellbeing_1", missionId: mission.id, createdAt: new Date(Date.now() - 86_400_000).toISOString(), feelingBefore: "steady", feelingAfter: "charged", frictionName: "", frictionRating: 2, provokingThought: "", provokingThoughtRating: 2, skills: [], miniAchievement: "", miniAchievementRating: 3, customAnswers: {}, energyAfter: 4, focusQuality: 4, stressLevel: 2, clarityLevel: 4, motivationLevel: 4, distractionLevel: 1 },
      { id: "wellbeing_2", missionId: mission.id, createdAt: new Date().toISOString(), feelingBefore: "steady", feelingAfter: "great", frictionName: "", frictionRating: 1, provokingThought: "", provokingThoughtRating: 1, skills: [], miniAchievement: "", miniAchievementRating: 4, customAnswers: {}, energyAfter: 5, focusQuality: 5, stressLevel: 1, clarityLevel: 5, motivationLevel: 5, distractionLevel: 1 },
    );

    const insight = getWellbeingInsight(state);
    expect(insight.available).toBe(true);
    expect(insight.sampleSize).toBe(2);
    expect(insight.records).toHaveLength(2);
    expect(insight.signals.find((signal) => signal.id === "focus")).toMatchObject({ average: 4.5, observations: 2, role: "supportive" });
    expect(insight.signals.find((signal) => signal.id === "stress")).toMatchObject({ average: 1.5, observations: 2, role: "load" });
    expect(insight.disclaimer.toLowerCase()).toContain("not a medical");
  });

  it("computes boss completion and seven-day dashboard recognition from actual mission and reflection records", () => {
    const state = stateWithToday();
    const mission = completedMission({ id: "boss_mission", bossId: "boss_1" });
    const unfinished = completedMission({ id: "boss_pending", status: "planned", completedAt: null, startedAt: null, endedAt: null, bossId: "boss_1" });
    state.missions.push(mission, unfinished);
    state.reflections.push({ id: "r1", missionId: mission.id, createdAt: new Date().toISOString(), feelingBefore: "steady", feelingAfter: "great", frictionName: "", frictionRating: 1, provokingThought: "", provokingThoughtRating: 4, skills: ["Planning"], miniAchievement: "Finished", miniAchievementRating: 5, customAnswers: {} });

    expect(getBossProgress(state, "boss_1")).toBe(0.5);
    const dashboard = getDashboardStats(state);
    expect(dashboard.wallOfFame.map((item) => item.id)).toEqual([mission.id]);
    expect(dashboard.achievementRadar.map((item) => item.id)).toEqual([mission.id]);
    expect(dashboard.subjectDistribution[0]?.label).toBe("Math");
    expect(dashboard.averageDailyHours).toBeCloseTo(50 / 60, 6);
  });
});
