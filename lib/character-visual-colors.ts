import * as VideoThumbnails from "expo-video-thumbnails";
import { getColors } from "react-native-image-colors";
import type { CharacterCinematicColors } from "./focus-command";
import {
  chooseCharacterAccent,
  deriveCinematicTokensFromAccent,
  type CharacterColorCandidate,
} from "./character-cinematic-tokens";

const FALLBACK_ACCENT = "#8B5CF9";

/**
 * Processes a single saved character visual at most once per URI. It never runs
 * inside cinematic playback and returns precomputed static tokens for rendering.
 */
export async function deriveCharacterCinematicColors(uri: string): Promise<CharacterCinematicColors> {
  let sampleUri = uri;
  if (/\.(mp4|mov|m4v|webm)$/i.test(uri)) {
    try {
      sampleUri = (await VideoThumbnails.getThumbnailAsync(uri, { time: 300, quality: 0.2 })).uri;
    } catch {
      // A saved portrait, or the stable fallback below, safely covers unsupported video thumbnails.
    }
  }
  try {
    const result = await getColors(sampleUri, { cache: true, key: `focus-character:${uri}`, quality: "lowest", pixelSpacing: 16, fallback: FALLBACK_ACCENT });
    const accent = result.platform === "ios"
      ? chooseCharacterAccent([
        { value: result.primary, priority: 1.16 },
        { value: result.detail, priority: 0.94 },
        { value: result.secondary, priority: 0.98 },
        { value: result.background, priority: 0.42 },
      ])
      : chooseCharacterAccent([
        { value: result.dominant, priority: 1.16 },
        { value: result.vibrant, priority: 0.86 },
        { value: result.lightVibrant, priority: 0.9 },
        { value: result.muted, priority: 0.56 },
        { value: result.darkVibrant, priority: 0.5 },
      ]);
    return deriveCinematicTokensFromAccent(accent);
  } catch {
    return deriveCinematicTokensFromAccent(FALLBACK_ACCENT);
  }
}
