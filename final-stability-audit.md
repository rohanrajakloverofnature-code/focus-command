# Final Stability Audit

## Baseline

TypeScript, Expo lint, and the deterministic test suite pass at the start of the final-release audit. Stale build workers were removed to restore memory headroom.

## Interaction findings

The main shared controls (`CommandButton`, `IconAction`, and interactive `MetricTile`) already invoke tap sound, light haptics, visual press state, and the supplied action. The generic `TapFeedback` wrapper only animates and invokes its callback, so sections and cards using it receive inconsistent sound and tactile confirmation. Several settings, chart, rank, map, and detail controls use direct `Pressable` instances and therefore bypass the shared feedback path. These targets need either shared feedback routing or safe explicit feedback while retaining their existing actions.

## Sound findings

The persisted profile currently exposes only four sound roles: mission win, tap, notification, and extended feedback. This is too coarse for independent title unlock, level-up, achievement, reward, mission completion, button tap, notification, and system-event customization. The notification scheduler also uses one Android channel configured with the default sound, and foreground handling suppresses notification audio, which can prevent a selected sound from being heard consistently.

User-picked local sound files must be copied from temporary picker/cache locations into the application document directory before their URIs are persisted. Playback must reset to the beginning on repeat, failures must be contained, and manually created audio players must be released or safely managed.

## Energy findings

The core energy helper currently returns units but does not expose a single bounded percentage source of truth. The final implementation should clamp maximum energy to at least one, clamp remaining units between zero and maximum, and derive percentage as `remaining / maximum`, constrained to `0...1`. Dashboard copy should explain the energy-cost formula and current configured capacity.

## Persistence findings

Expanded nested sound-role settings must be normalized during hydration and merged role-by-role so older saved profiles receive defaults without losing existing custom selections. Dashboard and profile patches must not overwrite unrelated nested preferences.
