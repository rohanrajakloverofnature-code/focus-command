export type CharacterMusicSlot = "duringVideo" | "postVideo";

export const CHARACTER_MUSIC_DURATION_RULES: Record<CharacterMusicSlot, { minimum: number; maximum: number; label: string }> = {
  duringVideo: { minimum: 10, maximum: 10.5, label: "During-video music" },
  postVideo: { minimum: 7, maximum: 8, label: "Post-video ending cue" },
};

export function formatMusicDuration(seconds: number) {
  return `${seconds.toFixed(2)} seconds`;
}

/** Rejects unreadable or out-of-window music before any selected file is persisted. */
export function assertCharacterMusicDuration(slot: CharacterMusicSlot, seconds: number): void {
  const rule = CHARACTER_MUSIC_DURATION_RULES[slot];
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(`${rule.label} could not be read. Choose a standard audio file with a known duration.`);
  }
  if (seconds < rule.minimum || seconds > rule.maximum) {
    throw new Error(`${formatMusicDuration(seconds)} detected. ${rule.label} must be ${rule.minimum.toFixed(2)}–${rule.maximum.toFixed(2)} seconds.`);
  }
}
