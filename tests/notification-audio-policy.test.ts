import { describe, expect, it } from "vitest";

import { shouldPlayForegroundReminderAudio } from "../lib/focus-notification-audio-policy";

describe("foreground reminder audio policy", () => {
  it("keeps the visible achievement recap silent because Mission Report already owns that mission completion cue", () => {
    expect(shouldPlayForegroundReminderAudio("achievement")).toBe(false);
  });

  it("retains foreground sounds for every other reminder path", () => {
    expect(shouldPlayForegroundReminderAudio("daily_mission")).toBe(true);
    expect(shouldPlayForegroundReminderAudio("revision")).toBe(true);
    expect(shouldPlayForegroundReminderAudio("multiplier")).toBe(true);
    expect(shouldPlayForegroundReminderAudio(undefined)).toBe(true);
  });
});
