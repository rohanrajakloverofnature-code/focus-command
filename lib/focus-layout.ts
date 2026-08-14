export const MINI_ACHIEVEMENT_TICKER_LAYOUT = {
  // The ticker is intentionally full-width and placed below the variable-height
  // profile title. This prevents long player names and roles from crowding it.
  height: 78,
  gap: 10,
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
    && MINI_ACHIEVEMENT_TICKER_LAYOUT.gap >= 8;
}

export function getRecognitionWindowCardWidth(containerWidth: number) {
  return Math.max(0, (containerWidth - RECOGNITION_WINDOW_LAYOUT.gap) / 2);
}
