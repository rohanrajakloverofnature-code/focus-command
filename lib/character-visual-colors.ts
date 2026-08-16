import * as VideoThumbnails from "expo-video-thumbnails";
import { getColors } from "react-native-image-colors";

import type { CharacterCinematicColors } from "@/lib/focus-command";

const FALLBACK_ACCENT = "#8B5CF9";

function normalizeHex(value: string | null | undefined): string | null {
  return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : null;
}

function rgb(hex: string) {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

function saturation(hex: string): number {
  const { r, g, b } = rgb(hex);
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  return max === 0 ? 0 : (max - min) / max;
}

function mix(hex: string, target: string, amount: number): string {
  const source = rgb(hex);
  const destination = rgb(target);
  const channel = (start: number, end: number) => Math.round(start + (end - start) * amount).toString(16).padStart(2, "0");
  return `#${channel(source.r, destination.r)}${channel(source.g, destination.g)}${channel(source.b, destination.b)}`.toUpperCase();
}

function chooseAccent(candidates: Array<string | null | undefined>): string {
  const valid = candidates.flatMap((candidate) => {
    const hex = normalizeHex(candidate);
    return hex ? [hex] : [];
  });
  return [...valid].sort((left, right) => saturation(right) - saturation(left))[0] ?? FALLBACK_ACCENT;
}

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
      ? chooseAccent([result.primary, result.detail, result.secondary, result.background])
      : chooseAccent([result.vibrant, result.lightVibrant, result.dominant, result.muted, result.darkVibrant]);
    return {
      accent,
      backdrop: mix(accent, "#06101B", 0.88),
      rod: mix(accent, "#FFFFFF", 0.2),
      aura: mix(accent, "#000000", 0.15),
    };
  } catch {
    return { accent: FALLBACK_ACCENT, backdrop: "#10102A", rod: "#A78BFA", aura: "#7C3AED" };
  }
}
