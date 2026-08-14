import type { AudioPlayer } from "expo-audio";

/**
 * Releases a manually created native audio player exactly once. Cleanup intentionally
 * tolerates already-released players so interruption, timeout, and unmount paths may
 * safely converge on the same owner contract.
 */
export function disposeAudioPlayer(player: AudioPlayer | null | undefined, resetPosition = false): void {
  if (!player) return;
  try {
    player.pause();
  } catch {
    // A player can already be released by a competing native completion event.
  }
  if (resetPosition) {
    try {
      player.seekTo(0);
    } catch {
      // Reset is a best-effort replay convenience, not a cleanup prerequisite.
    }
  }
  try {
    player.remove();
  } catch {
    // Removal is idempotent from the JavaScript owner perspective.
  }
}

/** Releases each manually owned player and returns no retained player references. */
export function disposeAudioPlayers(players: readonly AudioPlayer[], resetPosition = false): void {
  players.forEach((player) => disposeAudioPlayer(player, resetPosition));
}

/** Stops a player while retaining it for the already-approved replay path. */
export function resetAudioPlayer(player: AudioPlayer | null | undefined): void {
  if (!player) return;
  try {
    player.pause();
    player.seekTo(0);
  } catch {
    // A failed reset leaves the caller free to dispose and recreate the optional cue.
  }
}
