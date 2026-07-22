import { describe, expect, it } from "vitest";

import { createInitialState, type Mission } from "../lib/focus-command";
import { getDashboardWorkspaceResult } from "../lib/dashboard-workspace";

function mission(overrides: Partial<Mission> = {}): Mission {
  const now = new Date().toISOString();
  return {
    id: "workspace_math",
    title: "Math session",
    subject: "Math",
    category: "Study",
    difficulty: "medium",
    baseXp: 50,
    bossId: null,
    specificTopic: "Vectors",
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
    progressionEventId: "workspace_progress",
    ...overrides,
  };
}

describe("Custom Analytics workspace", () => {
  it("calculates a selected mission metric against date, source, and subject filters", () => {
    const state = createInitialState();
    state.hydrated = true;
    const now = new Date().toISOString();
    const mathMission = mission();
    const physicsMission = mission({ id: "workspace_physics", subject: "Physics", category: "Practice", progressionEventId: "workspace_physics_progress" });
    state.missions.push(mathMission, physicsMission);
    state.progression.push(
      { id: "workspace_progress", missionId: mathMission.id, baseXp: 50, comboMultiplier: 1, goldMultiplier: 1, powerAwarded: 120, goldAwarded: 5, occurredAt: now, note: "Math ledger" },
      { id: "workspace_physics_progress", missionId: physicsMission.id, baseXp: 50, comboMultiplier: 1, goldMultiplier: 1, powerAwarded: 80, goldAwarded: 5, occurredAt: now, note: "Physics ledger" },
    );

    const widget = { ...state.profile.dashboardWidgets[0], metric: "power" as const, dateRange: "7d" as const, feature: "missions" as const, subject: "Math", category: "all", missionFrequency: "all" as const };
    const result = getDashboardWorkspaceResult(state, widget);

    expect(result.total).toBe(50);
    expect(result.sampleCount).toBe(1);
    expect(result.breakdown).toEqual([{ label: "Math", value: 50, color: expect.any(String) }]);
  });

  it("averages selected reflection signals without leaking records from another subject", () => {
    const state = createInitialState();
    state.hydrated = true;
    const now = new Date().toISOString();
    const mathMission = mission();
    const physicsMission = mission({ id: "workspace_physics", subject: "Physics", category: "Practice" });
    state.missions.push(mathMission, physicsMission);
    state.reflections.push(
      { id: "workspace_reflection_math", missionId: mathMission.id, createdAt: now, feelingBefore: "steady", feelingAfter: "charged", frictionName: "", frictionRating: 2, provokingThought: "", provokingThoughtRating: 2, skills: ["Planning"], miniAchievement: "", miniAchievementRating: 4, customAnswers: {}, focusQuality: 4, stressLevel: 2, clarityLevel: 4, motivationLevel: 4, distractionLevel: 1, energyAfter: 4 },
      { id: "workspace_reflection_physics", missionId: physicsMission.id, createdAt: now, feelingBefore: "steady", feelingAfter: "drained", frictionName: "", frictionRating: 4, provokingThought: "", provokingThoughtRating: 4, skills: ["Recall"], miniAchievement: "", miniAchievementRating: 2, customAnswers: {}, focusQuality: 1, stressLevel: 5, clarityLevel: 1, motivationLevel: 1, distractionLevel: 4, energyAfter: 1 },
    );

    const widget = { ...state.profile.dashboardWidgets[1], metric: "focus" as const, dateRange: "7d" as const, feature: "reflections" as const, subject: "Math", category: "all", missionFrequency: "all" as const };
    const result = getDashboardWorkspaceResult(state, widget);

    expect(result.total).toBe(4);
    expect(result.average).toBe(4);
    expect(result.sampleCount).toBe(1);
  });
});
