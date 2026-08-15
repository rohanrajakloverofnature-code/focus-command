# Renewed Lag Audit — 2026-08-15

## Scope

Read-only review of `Record_2026-08-15-07-26-09` and current Focus Command runtime/source paths. No product code was changed.

## Recording observations

- Tab navigation and command taps complete; no permanent missed press was observed.
- The clearest visible hitch is on the long Command Settings scroll, particularly around the dense Combo multiplier and nearby settings sections.
- The subjective report of slow controls is consistent with short interaction contention rather than a broken action callback.

## Verified code causes

1. `CommandButton`, `IconAction`, and `MetricTile` call audio, haptic, and Reanimated acknowledgement work from `onPressIn`. A drag that begins over one of these controls invokes that work before `ScrollView` resolves the gesture as a scroll, so an aborted press can still contend with the scroll start.
2. `app/settings.tsx` is one large eager `ScrollView` containing all settings sections, including sound-role rows, palette editors, combo-tier editors, Google controls, backup controls, many text inputs, switches, and buttons. It uses the full app context.
3. `app/(tabs)/dashboard.tsx` uses the full app context, performs multiple analytics derivations and loops during render, and keeps all SVG-heavy charts mounted in a long `ScrollView`.
4. The Mission Board is already virtualized; Home ornamentation uses isolated Reanimated worklets; the compact tab wrapper has narrow settings subscriptions. These are not primary remaining causes.

## Constraints for any remedy

- Preserve every screen design, section order, control position, input, calculation, navigation, feature, audio choice, animation, and profile-logo mechanism.
- Preserve release-to-activate actions and do not create a more trigger-happy gesture.
- No APK build. Validate with the complete TypeScript, tests, lint, and export suite.
