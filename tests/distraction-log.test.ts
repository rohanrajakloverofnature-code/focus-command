import { describe, expect, it } from "vitest";

import { createInitialState, type FocusState } from "../lib/focus-command";
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

  it("keeps distraction records out of the existing Google Sheets snapshot until synchronization is explicitly approved", () => {
    const state = createInitialState();
    state.distractionLogs = [{ id: "private", missionId: "m-1", category: "thoughts", occurredAt: "2026-08-14T08:00:00.000Z" }];

    const appState = makeFocusWorkbookValueRanges(state).find((range) => range.range === "App_State!A1");
    const payload = appState?.values.find(([key]) => key === "payload")?.[1] ?? "";

    expect(payload).not.toContain("distractionLogs");
    expect(payload).not.toContain("private");
  });
});
