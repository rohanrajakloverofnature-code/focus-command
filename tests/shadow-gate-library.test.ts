import { describe, expect, it } from "vitest";

import {
  SHADOW_GATE_LIBRARY,
  SHADOW_GATE_LIBRARY_ACTION_COUNT,
  getShadowGateSection,
} from "../lib/shadow-gate-library";

describe("Shadow Gate offline doorway library", () => {
  it("contains exactly six fixed resistance states with twenty-one curated actions each", () => {
    expect(SHADOW_GATE_LIBRARY).toHaveLength(6);
    expect(SHADOW_GATE_LIBRARY_ACTION_COUNT).toBe(126);
    expect(SHADOW_GATE_LIBRARY.every((section) => section.actions.length === 21)).toBe(true);
  });

  it("keeps every stored doorway action short, unique, and fully offline", () => {
    const actions = SHADOW_GATE_LIBRARY.flatMap((section) => section.actions);
    expect(new Set(actions.map((action) => action.id)).size).toBe(126);
    expect(actions.every((action) => action.label.length <= 90 && !/https?:\/\//i.test(action.label))).toBe(true);
    expect(getShadowGateSection("discomfort").title).toBe("Discomfort");
  });
});
