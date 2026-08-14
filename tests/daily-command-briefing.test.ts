import { describe, expect, it } from "vitest";

import { getDailyCommandBriefing } from "../lib/daily-command-briefing";
import { createInitialState, type Mission } from "../lib/focus-command";

const REFERENCE = "2026-08-14T08:15:00.000Z";

function mission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: "mission_one",
    title: "Chemistry Revision",
    subject: "Science",
    category: "Study",
    difficulty: "medium",
    baseXp: 50,
    bossId: null,
    specificTopic: "Moles",
    revisionEnabled: false,
    status: "planned",
    frequency: "once",
    createdAt: REFERENCE,
    dueAt: null,
    startedAt: null,
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

describe("Daily Command Briefing", () => {
  it("derives Home metrics from existing offline state", () => {
    const state = createInitialState();
    state.profile.timezone = "UTC";
    state.profile.energyMaximum = 100;
    state.profile.dailyTargetXp = 120;
    state.combo.lastActiveDate = "2026-08-14";
    state.combo.qualifyingStreak = 4;
    state.missions = [mission({ id: "active", status: "active", startedAt: REFERENCE }), mission({ id: "planned" })];

    const briefing = getDailyCommandBriefing(state, REFERENCE);

    expect(briefing).toMatchObject({
      greeting: "Build momentum before noon.",
      localTime: "8:15 AM",
      openMissionCount: 2,
      dailyTarget: { earned: 0, target: 120 },
      energyPercent: 100,
      streakDays: 4,
    });
  });

  it("uses the saved user timezone for the greeting and displayed daily-brief time", () => {
    const state = createInitialState();
    state.profile.timezone = "Asia/Kolkata";
    state.missions = [mission()];

    const briefing = getDailyCommandBriefing(state, REFERENCE);

    expect(briefing).toMatchObject({ greeting: "Protect the next focused block.", localTime: "1:45 PM" });
  });

  it("uses the approved priority order: active mission before due mission, revision, and boss", () => {
    const state = createInitialState();
    state.profile.timezone = "UTC";
    state.missions = [
      mission({ id: "due", title: "Due mission", dueAt: "2026-08-14" }),
      mission({ id: "active", title: "Live mission", status: "active", startedAt: REFERENCE }),
    ];
    state.srsTopics = [{ id: "revision", missionId: null, subject: "Physics", topic: "Forces", stage: 1, dueDate: "2026-08-14", completedAt: null, createdAt: REFERENCE, status: "due" }];
    state.bosses = [{ id: "boss", title: "Exam Campaign", objective: "Prepare", deadlineAt: "2026-08-15", rewardXp: 100, rewardGold: 10, createdAt: REFERENCE, status: "active" }];

    const briefing = getDailyCommandBriefing(state, REFERENCE);

    expect(briefing.priority).toMatchObject({ kind: "active_mission", title: "Live mission", route: "/mission/active" });
  });

  it("selects a due revision before a boss when no active or due mission exists", () => {
    const state = createInitialState();
    state.profile.timezone = "UTC";
    state.srsTopics = [{ id: "revision", missionId: null, subject: "History", topic: "Revolt", stage: 2, dueDate: "2026-08-14", completedAt: null, createdAt: REFERENCE, status: "due" }];
    state.bosses = [{ id: "boss", title: "History Campaign", objective: "Prepare", deadlineAt: null, rewardXp: 100, rewardGold: 10, createdAt: REFERENCE, status: "active" }];

    const briefing = getDailyCommandBriefing(state, REFERENCE);

    expect(briefing.priority).toMatchObject({ kind: "revision", title: "Review: Revolt", route: "/revisions?topic=revision" });
  });

  it("provides a deploy prompt when no existing mission, revision, or boss needs attention", () => {
    const state = createInitialState();
    state.profile.timezone = "UTC";

    const briefing = getDailyCommandBriefing(state, REFERENCE);

    expect(briefing.priority).toMatchObject({ kind: "deploy", route: "/missions?compose=1" });
  });
});
