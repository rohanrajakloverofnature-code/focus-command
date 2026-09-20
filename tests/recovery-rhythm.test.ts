import { describe, expect, it } from "vitest";

import { getSleepDurationMinutesFromBedWake, type NapLog, type RecoveryActionRecord, type RecoveryStressor, type ScreenTimeLog, type SleepLog } from "../lib/focus-command";
import { formatMinutes, getPersonalSleepScore, getRecoveryContextForDates, getRecoverySummary } from "../lib/recovery-rhythm";

const stressors: RecoveryStressor[] = [
  { id: "stress-1", title: "Exam load", category: "Study", status: "action", intensity: 8, emotions: [], bodySensations: [], concern: "Too much to finish", controllability: "influence", controlNote: "Ask for a realistic revision plan", frequency: "", urgency: "", localDate: "2026-09-10", createdAt: "2026-09-10T08:00:00.000Z", updatedAt: "2026-09-10T08:00:00.000Z" },
  { id: "stress-2", title: "Travel", category: "Personal", status: "resolved", intensity: 4, emotions: [], bodySensations: [], concern: "", controllability: "control", controlNote: "", frequency: "", urgency: "", localDate: "2026-08-15", createdAt: "2026-08-15T08:00:00.000Z", updatedAt: "2026-08-15T08:00:00.000Z" },
];
const recoveryActions: RecoveryActionRecord[] = [{ id: "action-1", stressorId: "stress-1", type: "grounding", beforeIntensity: 8, afterIntensity: 5, note: "", localDate: "2026-09-10", occurredAt: "2026-09-10T08:15:00.000Z" }];
const sleepLogs: SleepLog[] = [{ id: "sleep-1", localDate: "2026-09-10", entryMode: "bed_wake", durationMinutes: 450, bedTime: "23:30", wakeTime: "07:00", quality: 4, dreams: null, awakenings: "once", awakeningCount: null, restedRating: 4, note: "", createdAt: "2026-09-10T07:01:00.000Z", updatedAt: "2026-09-10T07:01:00.000Z" }];
const naps: NapLog[] = [{ id: "nap-1", localDate: "2026-09-10", durationMinutes: 25, note: "", createdAt: "2026-09-10T14:00:00.000Z", updatedAt: "2026-09-10T14:00:00.000Z" }];
const screenLogs: ScreenTimeLog[] = [{ id: "screen-1", localDate: "2026-09-10", totalMinutes: 210, primaryLabel: "YouTube", note: "", createdAt: "2026-09-10T20:00:00.000Z", updatedAt: "2026-09-10T20:00:00.000Z" }];
const state = { profile: { timezone: "UTC" }, recoveryStressors: stressors, recoveryActions, sleepLogs, napLogs: naps, screenTimeLogs: screenLogs } as any;

describe("Recovery & Rhythm", () => {
  it("calculates a transparent personal score without scoring dream recall", () => {
    const score = getPersonalSleepScore({ ...sleepLogs[0], durationMinutes: 420, quality: 5, awakeningCount: 0, restedRating: 5, dreams: "vivid_or_heavy" });
    expect(score.score).toBe(100);
    expect(score.completeness).toBe(100);
    expect(score.awakeningCount).toBe(0);
    expect(score.dreamLabel).toBe("Vivid or heavy");
    expect(score.basis).toContain("Not clinically validated");
  });

  it("uses the legacy awakening category when exact count is absent", () => {
    const score = getPersonalSleepScore(sleepLogs[0]);
    expect(score.awakeningCount).toBe(1);
    expect(score.components.find((component) => component.id === "continuity")?.score).toBe(80);
  });

  it("attributes overnight bed/wake duration across midnight while keeping wake-day records explicit", () => {
    expect(getSleepDurationMinutesFromBedWake("23:30", "07:00")).toBe(450);
    expect(formatMinutes(450)).toBe("7h 30m");
    expect(sleepLogs[0].localDate).toBe("2026-09-10");
  });

  it("uses only selected period manual records and retains full lifetime manual history", () => {
    const custom = getRecoverySummary(state, "custom", "2026-09-10", "2026-09-10");
    expect(custom.stressors).toHaveLength(1);
    expect(custom.averageStress).toBe(8);
    expect(custom.averageSleepMinutes).toBe(450);
    expect(custom.averageScreenMinutes).toBe(210);
    expect(custom.totalNapMinutes).toBe(25);
    expect(custom.commonScreenLabel).toBe("YouTube");
    expect(custom.afterActionChange).toBe(3);
    expect(getRecoverySummary(state, "lifetime").stressors).toHaveLength(2);
  });

  it("provides contextual manual data by date without changing existing emotional input collections", () => {
    const context = getRecoveryContextForDates(state, ["2026-09-10"]);
    expect(context).toEqual({ contextDays: 1, averageStress: 8, averageSleepMinutes: 450, averageScreenMinutes: 210, napMinutes: 25 });
    expect(getRecoveryContextForDates(state, ["2026-09-09"]).contextDays).toBe(0);
  });
});
