import { describe, expect, it } from "vitest";

import { createInitialState, removeMissionAndLinkedState, type FocusState } from "../lib/focus-command";
import { getFocusFrictionInsight } from "../lib/distraction-log";
import { makeFocusWorkbookValueRanges } from "../lib/google-sheets-payload";

describe("Distraction Log", () => {
  it("derives an offline Focus Friction pattern from only the last fourteen days without mutating mission data", () => {
    const state = createInitialState();
    state.profile.timezone = "Asia/Kolkata";
    state.missions = [{ id: "chemistry", title: "Chemistry Revision" } as FocusState["missions"][number]];
    state.distractionLogs = [
      { id: "one", missionId: "chemistry", category: "phone", occurredAt: "2026-08-14T13:00:00.000Z" },
      { id: "two", missionId: "chemistry", category: "phone", occurredAt: "2026-08-14T13:30:00.000Z" },
      { id: "three", missionId: "chemistry", category: "people", occurredAt: "2026-08-13T13:00:00.000Z" },
      { id: "old", missionId: "chemistry", category: "energy", occurredAt: "2026-07-20T13:00:00.000Z" },
    ];
    const originalMissions = JSON.stringify(state.missions);

    const insight = getFocusFrictionInsight(state, new Date("2026-08-14T18:00:00.000Z"));

    expect(insight.total).toBe(3);
    expect(insight.topCategory).toEqual({ category: "phone", label: "Phone", count: 2 });
    expect(insight.timeWindow).toBe("Evening");
    expect(insight.recentMission).toEqual({ title: "Chemistry Revision", count: 3 });
    expect(JSON.stringify(state.missions)).toBe(originalMissions);
  });

  it("uses inclusive local-week, local-month, and custom-date boundaries without including future entries", () => {
    const state = createInitialState();
    state.profile.timezone = "Asia/Kolkata";
    state.missions = [{ id: "chemistry", title: "Chemistry Revision" } as FocusState["missions"][number]];
    state.distractionLogs = [
      { id: "week-start", missionId: "chemistry", category: "phone", occurredAt: "2026-08-10T13:00:00.000Z" },
      { id: "week-end", missionId: "chemistry", category: "people", occurredAt: "2026-08-14T13:00:00.000Z" },
      { id: "month-only", missionId: "chemistry", category: "energy", occurredAt: "2026-08-03T13:00:00.000Z" },
      { id: "prior-month", missionId: "chemistry", category: "other", occurredAt: "2026-07-31T13:00:00.000Z" },
      { id: "future", missionId: "chemistry", category: "thoughts", occurredAt: "2026-08-15T13:00:00.000Z" },
    ];
    const now = new Date("2026-08-14T18:00:00.000Z");

    expect(getFocusFrictionInsight(state, now, { kind: "week" }).total).toBe(2);
    expect(getFocusFrictionInsight(state, now, { kind: "month" }).total).toBe(3);
    expect(getFocusFrictionInsight(state, now, { kind: "custom", startDate: "2026-08-03", endDate: "2026-08-10" }).total).toBe(2);
    expect(getFocusFrictionInsight(state, now, { kind: "custom", startDate: "2026-08-11", endDate: "2026-08-12" })).toMatchObject({ total: 0, categoryCounts: [] });
    expect(getFocusFrictionInsight(state, now, { kind: "custom", startDate: "2026-08-14", endDate: "2026-08-10" })).toMatchObject({ total: 0, categoryCounts: [] });
    expect(getFocusFrictionInsight(state, now, { kind: "custom", startDate: "2026-02-30", endDate: "2026-08-10" })).toMatchObject({ total: 0, categoryCounts: [] });
  });

  it("removes only a deleted mission’s linked distraction history, returning Focus Friction to zero when no missions remain", () => {
    const state = createInitialState();
    state.profile.timezone = "Asia/Kolkata";
    state.missions = [
      { id: "first", title: "First mission" } as FocusState["missions"][number],
      { id: "second", title: "Second mission" } as FocusState["missions"][number],
    ];
    state.distractionLogs = [
      { id: "first-log", missionId: "first", category: "phone", occurredAt: "2026-08-14T13:00:00.000Z" },
      { id: "second-log", missionId: "second", category: "people", occurredAt: "2026-08-14T13:30:00.000Z" },
    ];
    const now = new Date("2026-08-14T18:00:00.000Z");

    const afterFirstDeletion = removeMissionAndLinkedState(state, "first");
    expect(afterFirstDeletion.distractionLogs).toEqual([state.distractionLogs[1]]);
    expect(getFocusFrictionInsight(afterFirstDeletion, now).total).toBe(1);

    const afterAllDeletions = removeMissionAndLinkedState(afterFirstDeletion, "second");
    expect(afterAllDeletions.distractionLogs).toEqual([]);
    expect(getFocusFrictionInsight(afterAllDeletions, now)).toMatchObject({ total: 0, categoryCounts: [], topCategory: null, recentMission: null });
  });

  it("keeps distraction records out of the existing Google Sheets snapshot until synchronization is explicitly approved", () => {
    const state = createInitialState();
    state.distractionLogs = [{ id: "private", missionId: "m-1", category: "thoughts", occurredAt: "2026-08-14T08:00:00.000Z" }];

    const appState = makeFocusWorkbookValueRanges(state).find((range) => range.range === "App_State!A1");
    const payload = appState?.values.find(([key]) => key === "payload")?.[1] ?? "";

    expect(payload).not.toContain("distractionLogs");
    expect(payload).not.toContain("private");
  });
});
