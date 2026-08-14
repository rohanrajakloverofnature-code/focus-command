export const MINI_ACHIEVEMENT_TICKER_LAYOUT = {
  // The ticker remains in its original logical header slot, directly after the
  // variable-height profile name and role, with a fixed safety gap.
  height: 78,
  gap: 12,
  headerZoneMinHeight: 0,
} as const;

export const MINI_ACHIEVEMENT_WALL_OF_FAME_ROUTE = "/analytics?metric=fame";

export const RECOGNITION_WINDOW_LAYOUT = {
  gap: 10,
  cardHeight: 202,
  minimumCardWidth: 136,
} as const;

export function hasReservedMiniAchievementTickerSpace() {
  return MINI_ACHIEVEMENT_TICKER_LAYOUT.height >= 72
    && MINI_ACHIEVEMENT_TICKER_LAYOUT.gap >= 12;
}

export function getRecognitionWindowCardWidth(containerWidth: number) {
  return Math.max(0, (containerWidth - RECOGNITION_WINDOW_LAYOUT.gap) / 2);
}
