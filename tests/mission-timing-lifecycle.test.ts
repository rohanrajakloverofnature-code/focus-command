import { describe, expect, it } from "vitest";

import {
  beginMissionSession,
  createInitialState,
  getMissionInvestedMilliseconds,
  getTodayInvestedMilliseconds,
  isLongMissionReflectionEligible,
  normalizeHydratedState,
  type Mission,
} from "../lib/focus-command";

const MINUTE = 60_000;
const STARTED_AT = "2026-08-12T08:00:00.000Z";

function mission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: "mission_timing",
    title: "Mission timing",
    subject: "Study",
    category: "Focus",
    difficulty: "medium",
    baseXp: 50,
    bossId: null,
    specificTopic: "Timing",
    revisionEnabled: false,
    status: "active",
    frequency: "once",
    createdAt: STARTED_AT,
    dueAt: null,
    startedAt: STARTED_AT,
    pausedAt: null,
    pausedMilliseconds: 0,
    endedAt: null,
    completedAt: null,
    revisionTopicIds: [],
    progressionEventId: null,
    allowMultipleDailyCompletions: false,
    completionHistory: [],
    ...overrides,
  };
}

describe("mission timing lifecycle compatibility", () => {
  it("restores real active time for a hydrated pre-migration mission with no saved pause total", () => {
    const persisted = createInitialState();
    const legacyActiveMission = mission({
      id: "legacy_active",
      pausedMilliseconds: undefined as unknown as number,
    });
    const hydrated = normalizeHydratedState({ ...persisted, missions: [legacyActiveMission] });
    const recovered = hydrated.missions[0];
    const oneHourFortyEightMinutesLater = Date.parse(STARTED_AT) + 108 * MINUTE;

    expect(recovered.pausedMilliseconds).toBe(0);
    expect(getMissionInvestedMilliseconds(recovered, oneHourFortyEightMinutesLater)).toBe(108 * MINUTE);
    expect(isLongMissionReflectionEligible(recovered, oneHourFortyEightMinutesLater)).toBe(true);
  });

  it("accepts a millisecond timestamp persisted by a newer Android session and keeps its active clock advancing", () => {
    const startedAtMs = Date.parse(STARTED_AT);
    const persisted = mission({ id: "numeric_start", startedAt: startedAtMs });
    const hydrated = normalizeHydratedState({ ...createInitialState(), missions: [persisted] });
    const recovered = hydrated.missions[0];
    const tenMinutesLater = startedAtMs + 10 * MINUTE;

    expect(recovered.startedAt).toBe(startedAtMs);
    expect(getMissionInvestedMilliseconds(recovered, tenMinutesLater)).toBe(10 * MINUTE);
  });

  it("repairs an unreadable persisted live-session start into a new advancing clock without counting creation age", () => {
    const createdAt = "2026-08-01T08:00:00.000Z";
    const hydratedAt = Date.now();
    const hydrated = normalizeHydratedState({
      ...createInitialState(),
      missions: [mission({ id: "invalid_start", createdAt, startedAt: "invalid-release-value" })],
    });
    const recovered = hydrated.missions[0];

    expect(typeof recovered.startedAt).toBe("number");
    expect(getMissionInvestedMilliseconds(recovered, hydratedAt + 10 * MINUTE)).toBeLessThanOrEqual(10 * MINUTE + 1_000);
    expect(getMissionInvestedMilliseconds(recovered, hydratedAt + 10 * MINUTE)).toBeGreaterThanOrEqual(9 * MINUTE);
  });

  it("starts every new run from a fresh millisecond timestamp and clears stale completion endpoints", () => {
    const sessionStart = Date.parse(STARTED_AT);
    const freshSession = beginMissionSession(mission({
      status: "planned",
      startedAt: "not-a-date",
      pausedAt: new Date(sessionStart - MINUTE).toISOString(),
      pausedMilliseconds: 9 * MINUTE,
      endedAt: new Date(sessionStart - MINUTE).toISOString(),
      completedAt: new Date(sessionStart - MINUTE).toISOString(),
    }), sessionStart);

    expect(freshSession.status).toBe("active");
    expect(freshSession.startedAt).toBe(sessionStart);
    expect(freshSession.pausedAt).toBeNull();
    expect(freshSession.pausedMilliseconds).toBe(0);
    expect(freshSession.endedAt).toBeNull();
    expect(freshSession.completedAt).toBeNull();
    expect(getMissionInvestedMilliseconds(freshSession, sessionStart + 10 * MINUTE)).toBe(10 * MINUTE);
  });

  it("excludes every accumulated and current pause from live timing and keeps the timer frozen while paused", () => {
    const pausedAt = new Date(Date.parse(STARTED_AT) + 110 * MINUTE).toISOString();
    const pausedMission = mission({
      status: "paused",
      pausedAt,
      pausedMilliseconds: 20 * MINUTE,
    });

    expect(getMissionInvestedMilliseconds(pausedMission, Date.parse(STARTED_AT) + 180 * MINUTE)).toBe(90 * MINUTE);
    expect(isLongMissionReflectionEligible(pausedMission, Date.parse(STARTED_AT) + 180 * MINUTE)).toBe(true);
  });

  it("does not freeze an active installed session when an older persisted record carries a stale pausedAt timestamp", () => {
    const stalePausedAt = new Date(Date.parse(STARTED_AT) + 5 * MINUTE).toISOString();
    const activeMission = mission({
      status: "active",
      pausedAt: stalePausedAt,
    });
    const ninetyMinutesLater = Date.parse(STARTED_AT) + 90 * MINUTE;
    const hydrated = normalizeHydratedState({ ...createInitialState(), missions: [activeMission] });

    expect(getMissionInvestedMilliseconds(activeMission, ninetyMinutesLater)).toBe(90 * MINUTE);
    expect(hydrated.missions[0].pausedAt).toBeNull();
    expect(getMissionInvestedMilliseconds(hydrated.missions[0], ninetyMinutesLater)).toBe(90 * MINUTE);
  });

  it("opens the full emotion debrief at exactly 45 active minutes, not before", () => {
    const justBelowThreshold = mission();
    const atThreshold = mission();

    expect(isLongMissionReflectionEligible(justBelowThreshold, Date.parse(STARTED_AT) + 45 * MINUTE - 1)).toBe(false);
    expect(isLongMissionReflectionEligible(atThreshold, Date.parse(STARTED_AT) + 45 * MINUTE)).toBe(true);
  });

  it("locks a completed duration for persistence and today’s invested-time totals after reload", () => {
    const referenceTime = Date.now();
    const startedAt = new Date(referenceTime - 120 * MINUTE).toISOString();
    const endedAt = new Date(referenceTime - 12 * MINUTE).toISOString();
    const completedMission = mission({
      id: "completed_timing",
      startedAt,
      status: "completed",
      pausedMilliseconds: 18 * MINUTE,
      endedAt,
      completedAt: endedAt,
    });
    const durationMs = getMissionInvestedMilliseconds(completedMission, referenceTime + 24 * 60 * MINUTE);
    const state = createInitialState();
    state.missions = [completedMission];
    state.missionCompletions = [{
      id: "completion_timing",
      missionId: completedMission.id,
      startedAt,
      completedAt: endedAt,
      durationMs,
      reflectionId: "reflection_timing",
      progressionEventId: "progression_timing",
      missionTitle: completedMission.title,
      missionSubject: completedMission.subject,
      missionCategory: completedMission.category,
      missionDifficulty: completedMission.difficulty,
      missionBaseXp: completedMission.baseXp,
      missionFrequency: completedMission.frequency,
      allowMultipleDailyCompletions: false,
    }];

    expect(durationMs).toBe(90 * MINUTE);
    expect(getTodayInvestedMilliseconds(normalizeHydratedState(state))).toBe(90 * MINUTE);
  });
});
