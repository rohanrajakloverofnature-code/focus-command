import { describe, expect, it } from "vitest";

import {
  SOUND_ROLE_IDS,
  createInitialState,
  getEnergy,
  mergePlayerProfile,
  normalizeSoundRoles,
  type Mission,
} from "../lib/focus-command";

function completedToday(overrides: Partial<Mission> = {}): Mission {
  const endedAt = new Date().toISOString();
  const startedAt = new Date(Date.now() - 50 * 60_000).toISOString();
  return {
    id: "energy_mission",
    title: "Energy mission",
    subject: "Physics",
    category: "Study",
    difficulty: "medium",
    baseXp: 20,
    bossId: null,
    specificTopic: "",
    revisionEnabled: false,
    status: "completed",
    frequency: "once",
    createdAt: startedAt,
    dueAt: null,
    startedAt,
    pausedAt: null,
    pausedMilliseconds: 0,
    endedAt,
    completedAt: endedAt,
    revisionTopicIds: [],
    progressionEventId: null,
    ...overrides,
  };
}

describe("final stability guards", () => {
  it("derives energy percentage from the configured maximum instead of assuming 100 units", () => {
    const state = createInitialState();
    state.profile.energyMaximum = 500;
    state.profile.energyCostPerMinute.medium = 2.5;
    state.missions.push(completedToday());

    const energy = getEnergy(state);
    expect(energy).toMatchObject({ maximum: 500, used: 125, remaining: 375, percent: 75 });
    expect(energy.percentage).toBeCloseTo(0.75, 8);
  });

  it("clamps energy at an empty 0% reserve even when logged work exceeds capacity", () => {
    const state = createInitialState();
    state.profile.energyMaximum = 50;
    state.profile.energyCostPerMinute.medium = 3;
    state.missions.push(completedToday({
      startedAt: new Date(Date.now() - 60 * 60_000).toISOString(),
      endedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }));

    const energy = getEnergy(state);
    expect(energy.rawUsed).toBeGreaterThan(energy.maximum);
    expect(energy).toMatchObject({ used: 50, remaining: 0, percent: 0, percentage: 0 });
  });

  it("normalizes invalid imported energy settings into a safe bounded configuration", () => {
    const state = createInitialState();
    const profile = mergePlayerProfile(state.profile, {
      energyMaximum: Number.NaN,
      energyCostPerMinute: { easy: -2, medium: Number.NaN, hard: 4 },
    });

    expect(profile.energyMaximum).toBe(1);
    expect(profile.energyCostPerMinute).toEqual({ easy: 0, medium: 0, hard: 4 });
  });

  it("keeps every granular sound role while applying one individual persisted selection", () => {
    const state = createInitialState();
    const saved = normalizeSoundRoles(state.profile.soundRoles, {
      achievement: { enabled: true, style: "soft", customUri: "file:///achievement.m4a", customName: "Achievement" },
    });

    expect(SOUND_ROLE_IDS.every((role) => Boolean(saved[role]))).toBe(true);
    expect(saved.achievement).toMatchObject({ style: "soft", customUri: "file:///achievement.m4a", customName: "Achievement" });
    expect(saved.tap).toEqual(state.profile.soundRoles.tap);
    expect(saved.dailyReminder).toEqual(state.profile.soundRoles.dailyReminder);
  });

  it("preserves every notification category’s custom file through later profile changes and removes only the requested role", () => {
    const state = createInitialState();
    const notificationRoles = ["dailyReminder", "revisionReminder", "multiplierReminder", "achievementReminder"] as const;
    const assigned = mergePlayerProfile(state.profile, {
      soundRoles: {
        ...state.profile.soundRoles,
        ...Object.fromEntries(notificationRoles.map((role) => [role, {
          ...state.profile.soundRoles[role],
          customUri: `file:///focus-command-sounds/${role}.m4a`,
          customName: `${role}.m4a`,
        }])),
      },
    });
    const afterUnrelatedSetting = mergePlayerProfile(assigned, { dailyTargetXp: 180 });
    const afterRemoval = mergePlayerProfile(afterUnrelatedSetting, {
      soundRoles: {
        ...afterUnrelatedSetting.soundRoles,
        revisionReminder: { ...afterUnrelatedSetting.soundRoles.revisionReminder, customUri: null, customName: null },
      },
    });

    expect(notificationRoles.map((role) => afterUnrelatedSetting.soundRoles[role].customName)).toEqual(notificationRoles.map((role) => `${role}.m4a`));
    expect(afterRemoval.soundRoles.revisionReminder.customUri).toBeNull();
    expect(afterRemoval.soundRoles.dailyReminder.customUri).toContain("dailyReminder.m4a");
    expect(afterRemoval.soundRoles.multiplierReminder.customUri).toContain("multiplierReminder.m4a");
    expect(afterRemoval.soundRoles.achievementReminder.customUri).toContain("achievementReminder.m4a");
  });

  it("merges nested Dashboard settings without erasing existing sounds, reminder rules, or palette values", () => {
    const state = createInitialState();
    const updated = mergePlayerProfile(state.profile, {
      notificationRules: { ...state.profile.notificationRules, dailyMissionEnabled: true },
    });

    expect(updated.notificationRules.dailyMissionEnabled).toBe(true);
    expect(updated.notificationRules.revisionEnabled).toBe(state.profile.notificationRules.revisionEnabled);
    expect(updated.soundRoles.levelUp).toEqual(state.profile.soundRoles.levelUp);
    expect(updated.palette.primary).toBe(state.profile.palette.primary);
  });
});
