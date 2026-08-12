export const MINI_ACHIEVEMENT_TICKER_LAYOUT = {
  height: 60,
  top: 38,
  left: 126,
  right: 0,
  headerZoneMinHeight: 100,
} as const;

export const RECOGNITION_WINDOW_LAYOUT = {
  gap: 10,
  cardHeight: 202,
  minimumCardWidth: 136,
} as const;

export function hasReservedMiniAchievementTickerSpace() {
  return MINI_ACHIEVEMENT_TICKER_LAYOUT.headerZoneMinHeight >= MINI_ACHIEVEMENT_TICKER_LAYOUT.top + MINI_ACHIEVEMENT_TICKER_LAYOUT.height;
}

export function getRecognitionWindowCardWidth(containerWidth: number) {
  return Math.max(0, (containerWidth - RECOGNITION_WINDOW_LAYOUT.gap) / 2);
}
