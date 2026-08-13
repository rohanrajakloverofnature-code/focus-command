# Installed Cinematic Feedback Analysis

## Supplied recording findings

The recording shows the Home portrait in ornate purple-and-gold 2D armor before and during the cinematic. At roughly 00:06–00:16, the supplied Tactical video instead shows a dark blue/black character with cyan-lit armor. These two characters do not match in outfit, color, or visual style.

At approximately 00:16, after the ten-second video completes, the current cinematic continues with the portal line, `PORTAL FIELD STABLE`, `FORM CONFIRMED`, and finally the title and reward readout. The user needs an additional ending audio cue if this post-video section remains.

The recording shows the title `Staff Sergeant` at approximately 00:18 without any portrait swap. The same initial portrait remains visible.

## Traced implementation causes

- `getRankProfile` selects the Home/cinematic still portrait from `getCharacterEvolutionProfile(...).family` and evolution stage. At Staff Sergeant, the current `command` family selects the bundled violet `evolution/command.png` portrait.
- `getCharacterFamily` classifies titles matching `sergeant` as `command`, while the user-supplied Recruit video was intentionally mapped to `tactical`. This means Staff Sergeant correctly selects the Command family under the old rule but incorrectly receives the Recruit/Tactical supplied footage if the user expects its character to match its still portrait.
- The post-video reveal is deliberately scheduled to start after `materialize + durationMs + 420`, then runs rings, impact, title reveal, reward, and dismissal. Its existing effect-audio array is not created for supplied-video variants, so a separate ending cue will be needed if the user supplies one.
- Portrait selection is rendered from the unchanged current title and level. A cinematic tap does not mutate the player title or portrait; it reuses the currently selected rank portrait throughout playback. Any perceived title-to-portrait delay must come from the underlying title/level update path or family/stage thresholds, not from the cinematic timer.
