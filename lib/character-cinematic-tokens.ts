const FALLBACK_ACCENT = "#8B5CF9";
const CINEMATIC_BACKDROP_DARKENING = 0.72;
const MINIMUM_ROD_CONTRAST = 4.5;
const MINIMUM_AURA_CONTRAST = 3;

export interface CharacterColorCandidate {
  value: string | null | undefined;
  /** Relative trust in a platform palette role, not a visual override. */
  priority: number;
}

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

function brightness(hex: string): number {
  const { r, g, b } = rgb(hex);
  return Math.max(r, g, b) / 255;
}

function linearChannel(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const { r, g, b } = rgb(hex);
  return 0.2126 * linearChannel(r) + 0.7152 * linearChannel(g) + 0.0722 * linearChannel(b);
}

export function colorContrastRatio(foreground: string, background: string): number {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function mix(hex: string, target: string, amount: number): string {
  const source = rgb(hex);
  const destination = rgb(target);
  const channel = (start: number, end: number) => Math.round(start + (end - start) * amount).toString(16).padStart(2, "0");
  return `#${channel(source.r, destination.r)}${channel(source.g, destination.g)}${channel(source.b, destination.b)}`.toUpperCase();
}

function visibleColorScore(hex: string): number {
  const colorSaturation = saturation(hex);
  const colorBrightness = brightness(hex);
  if (colorSaturation < 0.2 || colorBrightness < 0.2) return 0;

  // Highly saturated highlights should not automatically beat the character's
  // dominant mid-tone. Very pale colors are also reduced so portal details stay rich.
  const midToneReadability = colorBrightness < 0.45
    ? (colorBrightness - 0.2) / 0.25
    : colorBrightness > 0.9
      ? 0.5
      : 1;
  return colorSaturation * 0.55 + Math.max(0, midToneReadability) * 0.45;
}

/**
 * Selects a visually meaningful character accent from native palette roles.
 * Dark background swatches and tiny neon highlights are deliberately penalized.
 */
export function chooseCharacterAccent(candidates: readonly CharacterColorCandidate[]): string {
  const ranked = candidates.flatMap((candidate, index) => {
    const hex = normalizeHex(candidate.value);
    if (!hex) return [];
    return [{ hex, score: visibleColorScore(hex) * candidate.priority, index }];
  });
  ranked.sort((left, right) => right.score - left.score || left.index - right.index);
  return ranked[0]?.score ? ranked[0].hex : FALLBACK_ACCENT;
}

function ensureContrast(color: string, background: string, minimumContrast: number): string {
  let result = color;
  for (let amount = 0.34; amount <= 0.9 && colorContrastRatio(result, background) < minimumContrast; amount += 0.08) {
    result = mix(color, "#FFFFFF", amount);
  }
  return result;
}

/** Builds static tokens with intentional cinematic separation from one saved accent. */
export function deriveCinematicTokensFromAccent(sourceAccent: string) {
  const accent = normalizeHex(sourceAccent) ?? FALLBACK_ACCENT;
  const backdrop = mix(accent, "#06101B", CINEMATIC_BACKDROP_DARKENING);
  const rod = ensureContrast(mix(accent, "#FFFFFF", 0.28), backdrop, MINIMUM_ROD_CONTRAST);
  const aura = ensureContrast(mix(accent, "#FFFFFF", 0.12), backdrop, MINIMUM_AURA_CONTRAST);
  return { accent, backdrop, rod, aura };
}

