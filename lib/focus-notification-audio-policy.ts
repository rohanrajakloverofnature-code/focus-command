/**
 * Mission Result already owns the immediate completion cue. Achievement Recap
 * remains a visible local notification, but must not create a second manual
 * foreground sound for that same completed mission.
 */
export function shouldPlayForegroundReminderAudio(kind: unknown): boolean {
  return kind !== "achievement";
}
