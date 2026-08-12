# Native Launch Repair Record

## Source observation

The user-provided installed-APK recording (`Record_2026-08-12-14-11-31_b783bf344239542886fee7b48fa4b892.mp4`) showed that the launch fire appears static on Android, fire crackle does not share the fire’s visible phase boundaries, the quote transition cue is not audible, and the quote blends into Home-screen text.

## Root cause

`assets/images/launch-fire-alpha.png` is a single RGBA PNG frame, not an animated image. The preview’s behavior did not represent Android APK playback. The native repair must retain the approved source footage while packaging it in an Android-safe animated alpha format and using a native-capable playback component.

## Repair boundaries

Only the launch fire playback, associated sound timing, quote cue, and quote readability may change. Focus Command naming, screens, feature behavior, data, Google Sheets integration, and gameplay remain unchanged.
