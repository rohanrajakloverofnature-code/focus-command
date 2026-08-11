let launchSequenceClaimed = false;

/** Claims the per-process launch sequence so navigation and re-renders never replay it. */
export function claimLaunchSequence(): boolean {
  if (launchSequenceClaimed) return false;
  launchSequenceClaimed = true;
  return true;
}

/** Test-only reset; production process restarts naturally reset this module-level flag. */
export function resetLaunchSequenceForTests() {
  launchSequenceClaimed = false;
}
