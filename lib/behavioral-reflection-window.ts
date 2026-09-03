export const BEHAVIORAL_REFLECTION_WINDOW_OPTIONS = ["last12", "last100", "last500", "lifetime", "custom"] as const;

export type BehavioralReflectionWindow = (typeof BEHAVIORAL_REFLECTION_WINDOW_OPTIONS)[number];

export const DEFAULT_BEHAVIORAL_REFLECTION_WINDOW: BehavioralReflectionWindow = "last12";
export const DEFAULT_BEHAVIORAL_REFLECTION_CUSTOM_COUNT = 12;
export const MAX_BEHAVIORAL_REFLECTION_CUSTOM_COUNT = 10_000;

export function normalizeBehavioralReflectionWindow(value: unknown): BehavioralReflectionWindow {
  return typeof value === "string" && (BEHAVIORAL_REFLECTION_WINDOW_OPTIONS as readonly string[]).includes(value)
    ? value as BehavioralReflectionWindow
    : DEFAULT_BEHAVIORAL_REFLECTION_WINDOW;
}

export function normalizeBehavioralReflectionCustomCount(value: unknown): number {
  const count = Math.floor(Number(value));
  if (!Number.isFinite(count)) return DEFAULT_BEHAVIORAL_REFLECTION_CUSTOM_COUNT;
  return Math.max(1, Math.min(MAX_BEHAVIORAL_REFLECTION_CUSTOM_COUNT, count));
}

export function getBehavioralReflectionWindowLimit(
  window: BehavioralReflectionWindow,
  customCount: number,
): number | null {
  if (window === "lifetime") return null;
  if (window === "last100") return 100;
  if (window === "last500") return 500;
  if (window === "custom") return normalizeBehavioralReflectionCustomCount(customCount);
  return 12;
}

/** Returns a display-only tail view. The underlying reflection history is never mutated. */
export function selectBehavioralReflectionWindow<T>(
  reflections: readonly T[],
  window: BehavioralReflectionWindow,
  customCount: number,
): readonly T[] {
  const limit = getBehavioralReflectionWindowLimit(window, customCount);
  return limit === null ? reflections : reflections.slice(-limit);
}

export function getBehavioralReflectionWindowLabel(window: BehavioralReflectionWindow, customCount: number): string {
  if (window === "lifetime") return "LIFETIME";
  if (window === "last500") return "500 RECENT";
  if (window === "last100") return "100 RECENT";
  if (window === "custom") return `${normalizeBehavioralReflectionCustomCount(customCount)} RECENT`;
  return "12 RECENT";
}
