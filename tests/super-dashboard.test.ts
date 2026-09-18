import { describe, expect, it } from "vitest";

import { createInitialState, type FocusState, type Mission } from "../lib/focus-command";
import { getSuperDashboardRange, getSuperDashboardSummary } from "../lib/super-dashboard";

const NOW = new Date("2026-09-18T12:00:00.000Z");

function mission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: "super_dashboard_mission",
    title: "Vector revision",
    subject: "Physics",
    includeInSubjectMap: true,
    category: "Study",
    difficulty: "medium",
    baseXp: 50,
    bossId: null,
    specificTopic: "Vectors",
    revisionEnabled: false,
    status: "completed",
    frequency: "once",
    createdAt: "2026-09-18T08:00:00.000Z",
    dueAt: null,
    startedAt: "2026-09-18T08:00:00.000Z",
    pausedAt: null,
    pausedMilliseconds: 0,
    endedAt: "2026-09-18T10:00:00.000Z",
    completedAt: "2026-09-18T10:00:00.000Z",
    revisionTopicIds: [],
    progressionEventId: "super_dashboard_progress",
    allowMultipleDailyCompletions: false,
    completionHistory: ["2026-09-18T10:00:00.000Z"],
    ...overrides,
  };
}

function stateWithRecords(): FocusState {
  const state = createInitialState();
  state.hydrated = true;
  state.profile.timezone = "UTC";
  const completedMission = mission();
  state.missions = [completedMission];
  state.missionCompletions = [{
    id: "super_dashboard_completion",
    missionId: completedMission.id,
    startedAt: "2026-09-18T08:00:00.000Z",
    completedAt: "2026-09-18T10:00:00.000Z",
    durationMs: 120 * 60_000,
    reflectionId: "super_dashboard_reflection",
    progressionEventId: "super_dashboard_progress",
    missionTitle: completedMission.title,
    missionSubject: completedMission.subject,
    missionCategory: completedMission.category,
    missionDifficulty: completedMission.difficulty,
    missionBaseXp: completedMission.baseXp,
    missionFrequency: completedMission.frequency,
    allowMultipleDailyCompletions: false,
  }];
  state.progression = [{
    id: "super_dashboard_progress",
    missionId: completedMission.id,
    completionId: "super_dashboard_completion",
    baseXp: 50,
    comboMultiplier: 1,
    goldMultiplier: 1,
    powerAwarded: 100,
    goldAwarded: 10,
    occurredAt: "2026-09-18T10:00:00.000Z",
    note: "Completed Vector revision",
  }];
  state.reflections = [{
    id: "super_dashboard_reflection",
    missionId: completedMission.id,
    completionId: "super_dashboard_completion",
    createdAt: "2026-09-18T10:00:00.000Z",
    feelingBefore: "steady",
    feelingAfter: "charged",
    frictionName: "",
    frictionRating: 2,
    provokingThought: "",
    provokingThoughtRating: null,
    skills: ["Vectors"],
    miniAchievement: "Solved the set",
    miniAchievementRating: 4,
    customAnswers: {},
    focusQuality: 4,
    stressLevel: 3,
    clarityLevel: 4,
    motivationLevel: 5,
    distractionLevel: 1,
    energyAfter: 4,
  }];
  state.recoveryStressors = [{
    id: "super_dashboard_stress",
    title: "Exam pressure",
    category: "Study",
    status: "identified",
    intensity: 7,
    emotions: [],
    bodySensations: [],
    concern: "",
    controllability: "influence",
    frequency: "",
    urgency: "",
    localDate: "2026-09-18",
    createdAt: "2026-09-18T07:00:00.000Z",
    updatedAt: "2026-09-18T07:00:00.000Z",
  }];
  state.recoveryActions = [];
  state.sleepLogs = [{
    id: "super_dashboard_sleep",
    localDate: "2026-09-18",
    entryMode: "duration",
    durationMinutes: 420,
    bedTime: null,
    wakeTime: null,
    quality: 4,
    dreams: "some_remembered",
    awakenings: "once",
    awakeningCount: 1,
    restedRating: 4,
    note: "",
    createdAt: "2026-09-18T07:00:00.000Z",
    updatedAt: "2026-09-18T07:00:00.000Z",
  }];
  state.napLogs = [{
    id: "super_dashboard_nap",
    localDate: "2026-09-18",
    durationMinutes: 30,
    note: "",
    createdAt: "2026-09-18T15:00:00.000Z",
    updatedAt: "2026-09-18T15:00:00.000Z",
  }];
  state.screenTimeLogs = [{
    id: "super_dashboard_screen_old",
    localDate: "2026-09-18",
    totalMinutes: 110,
    primaryLabel: "Study video",
    note: "",
    createdAt: "2026-09-18T16:00:00.000Z",
    updatedAt: "2026-09-18T16:00:00.000Z",
  }, {
    id: "super_dashboard_screen_current",
    localDate: "2026-09-18",
    totalMinutes: 120,
    primaryLabel: "Study video",
    note: "",
    createdAt: "2026-09-18T17:00:00.000Z",
    updatedAt: "2026-09-18T17:00:00.000Z",
  }];
  state.distractionLogs = [{ id: "super_dashboard_distraction", missionId: completedMission.id, category: "phone", occurredAt: "2026-09-18T09:30:00.000Z" }];
  return state;
}

describe("Super Dashboard calculation layer", () => {
  it("uses exact inclusive local-date ranges without a fixed thirty-day month", () => {
    const state = createInitialState();
    state.profile.timezone = "UTC";

    expect(getSuperDashboardRange(state, "today", "", "", undefined, NOW)).toMatchObject({ startDate: "2026-09-18", endDate: "2026-09-18", calendarDays: 1, calendarCapacityMinutes: 1440 });
    expect(getSuperDashboardRange(state, "week", "", "", undefined, NOW)).toMatchObject({ startDate: "2026-09-12", endDate: "2026-09-18", calendarDays: 7, calendarCapacityMinutes: 10_080 });
    expect(getSuperDashboardRange(state, "month", "", "", undefined, NOW)).toMatchObject({ startDate: "2026-09-01", endDate: "2026-09-18", calendarDays: 18, calendarCapacityMinutes: 25_920 });
    expect(getSuperDashboardRange(state, "custom", "2026-02-01", "2026-02-28", undefined, NOW)).toMatchObject({ valid: true, calendarDays: 28, calendarCapacityMinutes: 40_320 });
    expect(getSuperDashboardRange(state, "custom", "2026-09-19", "2026-09-18", undefined, NOW).valid).toBe(false);
  });

  it("keeps recovery stress and reflection stress separate while aggregating latest daily manual totals", () => {
    const summary = getSuperDashboardSummary(stateWithRecords(), "today", "", "", NOW);

    expect(summary.recovery.averageLoggedStress).toEqual({ value: 7, observations: 1 });
    expect(summary.recovery.averageReflectionStress).toEqual({ value: 3, observations: 1 });
    expect(summary.recovery.averageScreenMinutes).toEqual({ value: 120, observations: 1 });
    expect(summary.recovery.screenRecordDays).toBe(1);
    expect(summary.recovery.averageSleepMinutes).toEqual({ value: 420, observations: 1 });
    expect(summary.recovery.averageSleepScore).toEqual({ value: 86, observations: 1 });
  });

  it("calculates mission totals, rates, category shares, and evidence from only selected records", () => {
    const summary = getSuperDashboardSummary(stateWithRecords(), "today", "", "", NOW);

    expect(summary.missions).toMatchObject({
      completed: 1,
      activeDays: 1,
      focusedMinutes: 120,
      averageSessionMinutes: 120,
      medianSessionMinutes: 120,
      totalPower: 100,
      baseXp: 50,
      goldEarned: 10,
      powerPerFocusedHour: 50,
      topSubject: "Physics",
      topCategory: "Study",
      mostActiveCompletionWindow: "10 AM – 11 AM",
    });
    expect(summary.focus).toMatchObject({ disruptions: 1, disruptionsPerFocusedHour: 0.5, topDistraction: "Phone", mostInterruptedWindow: "9 AM – 10 AM" });
    expect(summary.activity.categories.map((item) => [item.label, item.minutes])).toEqual([
      ["Sleep", 420],
      ["Focus · Study", 120],
      ["Screen time", 120],
      ["Naps", 30],
    ]);
    expect(summary.activity.reportedMinutes).toBe(690);
    expect(summary.activity.minimumUntrackedMinutes).toBe(750);
    expect(summary.evidence).toMatchObject({ recordedDays: 1, completionRecords: 1, recoveryRecords: 4, reflectionRecords: 1 });
    expect(summary.focus.loggedInterruptionRate).toMatchObject({ value: 0.5, matchedLogs: 1, focusedMinutes: 120, completedMissions: 1, activeDays: 1, sufficientData: false });
  });

  it("counts only distraction logs that fall inside their linked completed-mission interval", () => {
    const state = stateWithRecords();
    state.distractionLogs.push({ id: "outside_run", missionId: state.missions[0].id, category: "phone", occurredAt: "2026-09-18T07:45:00.000Z" });
    const summary = getSuperDashboardSummary(state, "today", "", "", NOW);

    expect(summary.focus.disruptions).toBe(2);
    expect(summary.focus.loggedInterruptionRate).toMatchObject({ matchedLogs: 1, value: 0.5 });
  });

  it("uses a median only after five recent night records and never imputes missing nights", () => {
    const state = stateWithRecords();
    state.sleepLogs = [300, 360, 420, 480, 540].map((durationMinutes, index) => ({
      ...state.sleepLogs![0],
      id: `recent_sleep_${index}`,
      localDate: `2026-09-${14 + index}`,
      durationMinutes,
      createdAt: `2026-09-${14 + index}T07:00:00.000Z`,
      updatedAt: `2026-09-${14 + index}T07:00:00.000Z`,
    }));
    const summary = getSuperDashboardSummary(state, "custom", "2026-09-12", "2026-09-18", NOW);

    expect(summary.recovery.typicalRecentSleep).toEqual({ medianMinutes: 420, loggedNights: 5, requiredNights: 5, windowDays: 7 });
  });

  it("does not turn missing ratings into zero or fabricate overlap-free time", () => {
    const state = stateWithRecords();
    state.sleepLogs![0] = { ...state.sleepLogs![0], quality: null, restedRating: null, awakeningCount: null, awakenings: null };
    state.reflections[0] = { ...state.reflections[0], focusQuality: null, stressLevel: null };
    state.screenTimeLogs![0] = { ...state.screenTimeLogs![0], totalMinutes: 1440 };
    state.screenTimeLogs![1] = { ...state.screenTimeLogs![1], totalMinutes: 1440 };

    const summary = getSuperDashboardSummary(state, "today", "", "", NOW);

    expect(summary.recovery.sleepQuality).toEqual({ value: null, observations: 0 });
    expect(summary.recovery.restedFeeling).toEqual({ value: null, observations: 0 });
    expect(summary.recovery.averageReflectionStress).toEqual({ value: null, observations: 0 });
    expect(summary.emotions.focus).toEqual({ value: null, observations: 0 });
    expect(summary.activity.minimumUntrackedMinutes).toBe(0);
    expect(summary.activity.note).toMatch(/may overlap/i);
  });

  it("filters every source by custom range and keeps lifetime anchored to real saved history", () => {
    const state = stateWithRecords();
    state.journals = [{ id: "journal_before", localDate: "2026-09-10", betterThanYesterday: true, points: 5, note: "", createdAt: "2026-09-10T12:00:00.000Z" }];
    state.srsActivityLog = [{ id: "revision_before", topicId: "topic", missionId: null, subject: "Physics", topic: "Vectors", phase: "matured", actionDate: "2026-09-10", occurredAt: "2026-09-10T12:00:00.000Z" }];

    const today = getSuperDashboardSummary(state, "custom", "2026-09-18", "2026-09-18", NOW);
    const lifetime = getSuperDashboardSummary(state, "lifetime", "", "", NOW);

    expect(today.supportingProgress).toMatchObject({ journalPoints: 0, revisionActions: 0, maturedRevisionActions: 0 });
    expect(lifetime.range.startDate).toBe("2026-09-10");
    expect(lifetime.supportingProgress).toMatchObject({ journalPoints: 5, revisionActions: 1, maturedRevisionActions: 1 });
  });

  it("labels early personal context honestly and upgrades only after fourteen matched days", () => {
    const state = stateWithRecords();
    const early = getSuperDashboardSummary(state, "month", "", "", NOW).patterns;
    expect(early.find((pattern) => pattern.id === "sleep_focus")).toMatchObject({ pairedDays: 1, isReliable: false });

    const completion = state.missionCompletions[0];
    const sleep = state.sleepLogs![0];
    state.missionCompletions = Array.from({ length: 14 }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      const durationMs = index < 7 ? 60 * 60_000 : 120 * 60_000;
      return { ...completion, id: `paired_completion_${index}`, startedAt: `2026-09-${day}T08:00:00.000Z`, completedAt: `2026-09-${day}T${index < 7 ? "09" : "10"}:00:00.000Z`, durationMs };
    });
    state.sleepLogs = Array.from({ length: 14 }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      return { ...sleep, id: `paired_sleep_${index}`, localDate: `2026-09-${day}`, durationMinutes: index < 7 ? 360 : 480, createdAt: `2026-09-${day}T07:00:00.000Z`, updatedAt: `2026-09-${day}T07:00:00.000Z` };
    });
    state.screenTimeLogs = [];
    state.recoveryStressors = [];
    const reliable = getSuperDashboardSummary({ ...state }, "custom", "2026-09-01", "2026-09-14", NOW).patterns.find((pattern) => pattern.id === "sleep_focus");

    expect(reliable).toMatchObject({ pairedDays: 14, higherDays: 7, lowerDays: 7, higherFocusMinutes: 120, lowerFocusMinutes: 60, isReliable: true });
  });
});
