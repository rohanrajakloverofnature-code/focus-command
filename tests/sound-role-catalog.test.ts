import { describe, expect, it } from "vitest";

import {
  createInitialState,
  normalizeHydratedState,
  SOUND_ROLE_IDS,
  type FocusState,
  type SoundRoleId,
} from "../lib/focus-command";

const restoredRoles: SoundRoleId[] = [
  "missionWin",
  "titleUnlock",
  "levelUp",
  "achievement",
  "comboTier",
  "reward",
  "tap",
  "system",
  "dailyMissionReminder",
  "revisionReminder",
  "multiplierReminder",
  "achievementRecap",
  "notification",
  "extended",
];

describe("restored Sound Command Center catalog", () => {
  it("keeps every gameplay, system, and notification role in the default profile", () => {
    const state = createInitialState();

    expect(SOUND_ROLE_IDS).toEqual(restoredRoles);
    expect(Object.keys(state.profile.soundRoles).sort()).toEqual([...restoredRoles].sort());
    restoredRoles.forEach((role) => {
      expect(state.profile.soundRoles[role]).toMatchObject({ enabled: true, customUri: null, customName: null });
    });
  });

  it("preserves individual restored assignments and safely inherits legacy four-role choices after hydration", () => {
    const current = createInitialState();
    current.profile.soundRoles.titleUnlock = {
      enabled: true,
      style: "ceremonial",
      customUri: "file:///sounds/title.m4a",
      customName: "title.m4a",
    };
    current.profile.soundRoles.revisionReminder = {
      enabled: true,
      style: "soft",
      customUri: "file:///sounds/revision.wav",
      customName: "revision.wav",
    };

    const restored = normalizeHydratedState(current);
    expect(restored.profile.soundRoles.titleUnlock.customName).toBe("title.m4a");
    expect(restored.profile.soundRoles.revisionReminder.customName).toBe("revision.wav");

    const legacy = createInitialState() as FocusState;
    legacy.profile.soundRoles = {
      missionWin: { enabled: true, style: "ceremonial", customUri: "file:///sounds/win.mp3", customName: "win.mp3" },
      tap: { enabled: true, style: "crisp", customUri: "file:///sounds/tap.mp3", customName: "tap.mp3" },
      notification: { enabled: true, style: "soft", customUri: "file:///sounds/reminder.mp3", customName: "reminder.mp3" },
      extended: { enabled: true, style: "soft", customUri: "file:///sounds/extended.mp3", customName: "extended.mp3" },
    } as FocusState["profile"]["soundRoles"];

    const hydratedLegacy = normalizeHydratedState(legacy);
    expect(hydratedLegacy.profile.soundRoles.titleUnlock.customName).toBe("extended.mp3");
    expect(hydratedLegacy.profile.soundRoles.achievement.customName).toBe("extended.mp3");
    expect(hydratedLegacy.profile.soundRoles.dailyMissionReminder.customName).toBe("reminder.mp3");
    expect(hydratedLegacy.profile.soundRoles.revisionReminder.customName).toBe("reminder.mp3");
    expect(hydratedLegacy.profile.soundRoles.multiplierReminder.customName).toBe("reminder.mp3");
    expect(hydratedLegacy.profile.soundRoles.achievementRecap.customName).toBe("reminder.mp3");
  });
});
