let launchSequenceClaimed = false;
let launchSequenceActive = false;

const listeners = new Set<(active: boolean) => void>();

function notify() {
  listeners.forEach((listener) => listener(launchSequenceActive));
}

/** Claims the per-process launch sequence so navigation and re-renders never replay it. */
export function claimLaunchSequence(): boolean {
  if (launchSequenceClaimed) return false;
  launchSequenceClaimed = true;
  return true;
}

/** The root overlay owns the presentation and sound stage while this is true. */
export function setLaunchSequenceActive(active: boolean) {
  if (launchSequenceActive === active) return;
  launchSequenceActive = active;
  notify();
}

export function isLaunchSequenceActive() {
  return launchSequenceActive;
}

export function subscribeLaunchSequenceActivity(listener: (active: boolean) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Test-only reset; production process restarts naturally reset this module-level flag. */
export function resetLaunchSequenceForTests() {
  launchSequenceClaimed = false;
  launchSequenceActive = false;
  notify();
}
