export type CelebrationKind = "level" | "title" | "combo";

export type CelebrationMilestone = {
  level: number;
  title: string;
  combo: number;
};

/**
 * Gives persisted state a baseline and only returns a celebration for a genuine
 * post-hydration advancement outside the launch overlay's exclusive stage.
 */
export function getEligibleCelebration(
  previous: CelebrationMilestone | null,
  current: CelebrationMilestone,
  launchSequenceActive: boolean,
): CelebrationKind | null {
  if (!previous || launchSequenceActive) return null;
  if (current.title !== previous.title) return "title";
  if (current.level > previous.level) return "level";
  if (current.combo > previous.combo) return "combo";
  return null;
}
