import { describe, expect, it } from "vitest";

import {
  DEFAULT_BEHAVIORAL_REFLECTION_CUSTOM_COUNT,
  DEFAULT_BEHAVIORAL_REFLECTION_WINDOW,
  getBehavioralReflectionWindowLabel,
  normalizeBehavioralReflectionCustomCount,
  normalizeBehavioralReflectionWindow,
  selectBehavioralReflectionWindow,
} from "../lib/behavioral-reflection-window";

describe("Behavioural Tendency reflection windows", () => {
  const reflections = Array.from({ length: 1_200 }, (_, index) => ({ id: index + 1 }));

  it("keeps the established 12-recent display default for older profiles", () => {
    expect(normalizeBehavioralReflectionWindow(undefined)).toBe(DEFAULT_BEHAVIORAL_REFLECTION_WINDOW);
    expect(normalizeBehavioralReflectionCustomCount(undefined)).toBe(DEFAULT_BEHAVIORAL_REFLECTION_CUSTOM_COUNT);
    expect(selectBehavioralReflectionWindow(reflections, "last12", 12)).toHaveLength(12);
  });

  it("selects only a display tail for 100, 500, lifetime, and custom choices", () => {
    expect(selectBehavioralReflectionWindow(reflections, "last100", 12)).toEqual(reflections.slice(-100));
    expect(selectBehavioralReflectionWindow(reflections, "last500", 12)).toEqual(reflections.slice(-500));
    expect(selectBehavioralReflectionWindow(reflections, "lifetime", 12)).toBe(reflections);
    expect(selectBehavioralReflectionWindow(reflections, "custom", 875)).toEqual(reflections.slice(-875));
    expect(reflections).toHaveLength(1_200);
  });

  it("normalizes malformed and excessively large custom requests safely", () => {
    expect(normalizeBehavioralReflectionCustomCount(0)).toBe(1);
    expect(normalizeBehavioralReflectionCustomCount("invalid")).toBe(DEFAULT_BEHAVIORAL_REFLECTION_CUSTOM_COUNT);
    expect(normalizeBehavioralReflectionCustomCount(99_999)).toBe(10_000);
    expect(getBehavioralReflectionWindowLabel("custom", 250)).toBe("250 RECENT");
  });
});
