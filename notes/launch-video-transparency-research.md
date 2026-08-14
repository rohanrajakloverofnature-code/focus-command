# Android Transparent Launch Video Compatibility

Date checked: 2026-08-14.

The standard Android ExoPlayer-based video stack used by Expo Video does not reliably render a video's alpha channel. The AndroidX Media issue below requests alpha-video support, and the Expo transparent-video package documents the same limitation. A normal transparent MP4, MOV, M4V, or WebM cannot therefore be accepted with a claim that it will remain transparent in the installed Android Focus Command application.

The compatible approach is an explicitly paired **RGB + grayscale alpha-matte** video composition, decoded and composited by a transparency-aware renderer. That would require a dedicated transparent-video implementation beyond the current standard Expo Video player. The existing bundled animated transparent WebP fire remains reliable because it is an animated image rather than a standard video.

Sources:

1. https://github.com/androidx/media/issues/1388 — *Support transparent video with ExoPlayer*.
2. https://www.npmjs.com/package/expo-transparent-video — *expo-transparent-video* package documentation.
3. https://github.com/software-mansion-labs/transparent-video — *Expo Transparent Video* implementation and RGB/alpha-matte encoding guidance.
