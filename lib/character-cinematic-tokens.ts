const FALLBACK_ACCENT = "#8B5CF9";
const CINEMATIC_BACKDROP_DARKENING = 0.72;
const MINIMUM_ROD_CONTRAST = 4.5;
const MINIMUM_AURA_CONTRAST = 3;
const MINIMUM_ENERGY_CONTRAST = 3.4;

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

function hue(hex: string): number {
  const { r, g, b } = rgb(hex);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  if (delta === 0) return 0;
  const raw = max === red
    ? ((green - blue) / delta) % 6
    : max === green
      ? (blue - red) / delta + 2
      : (red - green) / delta + 4;
  return ((raw * 60) + 360) % 360;
}

function hueDistance(left: string, right: string): number {
  const difference = Math.abs(hue(left) - hue(right));
  return Math.min(difference, 360 - difference) / 180;
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

  const midToneReadability = colorBrightness < 0.45
    ? (colorBrightness - 0.2) / 0.25
    : colorBrightness > 0.9
      ? 0.5
      : 1;
  return colorSaturation * 0.55 + Math.max(0, midToneReadability) * 0.45;
}

/** Selects a visually meaningful character identity color from native palette roles. */
export function chooseCharacterAccent(candidates: readonly CharacterColorCandidate[]): string {
  const ranked = candidates.flatMap((candidate, index) => {
    const hex = normalizeHex(candidate.value);
    if (!hex) return [];
    return [{ hex, score: visibleColorScore(hex) * candidate.priority, index }];
  });
  ranked.sort((left, right) => right.score - left.score || left.index - right.index);
  return ranked[0]?.score ? ranked[0].hex : FALLBACK_ACCENT;
}

/** Selects a visibly distinct supporting source color at media-save time only. */
export function chooseCharacterSupport(candidates: readonly CharacterColorCandidate[], accent: string): string | null {
  const ranked = candidates.flatMap((candidate, index) => {
    const hex = normalizeHex(candidate.value);
    if (!hex || hex === accent) return [];
    const separation = hueDistance(hex, accent);
    const score = visibleColorScore(hex) * candidate.priority * (0.52 + separation * 0.78);
    return [{ hex, score, index }];
  });
  ranked.sort((left, right) => right.score - left.score || left.index - right.index);
  return ranked[0]?.score ? ranked[0].hex : null;
}

function ensureContrast(color: string, background: string, minimumContrast: number): string {
  let result = color;
  for (let amount = 0.34; amount <= 0.9 && colorContrastRatio(result, background) < minimumContrast; amount += 0.08) {
    result = mix(color, "#FFFFFF", amount);
  }
  return result;
}

/** Builds legacy-compatible static tokens from only one persisted character accent. */
export function deriveCinematicTokensFromAccent(sourceAccent: string) {
  return deriveCinematicTokensFromPalette(sourceAccent);
}

/**
 * Builds the richer reference-style cinematic palette from colors cached when
 * portrait or video media is saved. This pure function is safe during profile
 * hydration because it never reads or analyzes media.
 */
export function deriveCinematicTokensFromPalette(sourceAccent: string, sourceSupport?: string | null) {
  const accent = normalizeHex(sourceAccent) ?? FALLBACK_ACCENT;
  const backdrop = mix(accent, "#06101B", CINEMATIC_BACKDROP_DARKENING);
  const support = normalizeHex(sourceSupport) ?? mix(accent, "#5BE8FF", 0.52);
  const energy = ensureContrast(mix(support, "#DDFBFF", 0.18), backdrop, MINIMUM_ENERGY_CONTRAST);
  const metallic = ensureContrast("#FFD16A", backdrop, MINIMUM_ROD_CONTRAST);
  const atmosphere = mix(energy, backdrop, 0.42);
  const frame = mix(accent, "#0A1020", 0.62);
  const rod = metallic;
  const aura = ensureContrast(energy, backdrop, MINIMUM_AURA_CONTRAST);
  return { accent, backdrop, rod, aura, support, energy, metallic, atmosphere, frame };
}
