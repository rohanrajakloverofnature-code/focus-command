import type { EmotionalPatternForecast, Reflection } from "./focus-command";

export const PREDICTION_LABEL_MAX_LENGTH = 11;

export type PredictionIconName =
  | "star.fill" | "target" | "flame.fill" | "shield.fill" | "cloud.fill" | "circle.grid.cross.fill"
  | "bolt.fill" | "timer" | "arrow.clockwise" | "figure.run" | "book.closed.fill" | "gift.fill";

export interface EmotionPrediction {
  id: string;
  label: string;
  icon: PredictionIconName;
  accent: string;
  track: string;
}

type TrackId =
  | "flow" | "focus" | "steady" | "clarity" | "return" | "energy" | "protect"
  | "friction" | "focus_recover" | "clarity_recover" | "drive" | "stress" | "noise"
  | "shift" | "warming" | "mixed";

type Track = { title: string; readings: EmotionPrediction[] };

function makeTrack(id: TrackId, title: string, icons: [PredictionIconName, PredictionIconName, PredictionIconName], accent: string, labels: [string, string, string]): Track {
  return {
    title,
    readings: labels.map((label, index) => ({ id: `${id}-${index}`, label, icon: icons[index]!, accent, track: title })),
  };
}

const TRACKS: Record<TrackId, Track> = {
  flow: makeTrack("flow", "Flow momentum", ["star.fill", "target", "flame.fill"], "#B79CFF", ["FLOW AHEAD", "CLEAR PATH", "MOMENTUM UP"]),
  focus: makeTrack("focus", "Focused momentum", ["target", "timer", "bolt.fill"], "#7DD3FC", ["FOCUS SET", "SHARP PATH", "QUIET DRIVE"]),
  steady: makeTrack("steady", "Steady balance", ["shield.fill", "cloud.fill", "circle.grid.cross.fill"], "#8DE7C7", ["STEADY NOW", "CALM PACE", "EVEN KEEL"]),
  clarity: makeTrack("clarity", "Stable clarity", ["book.closed.fill", "target", "shield.fill"], "#93C5FD", ["CRISP ROUTE", "CLEAR ROUTE", "CENTERED"]),
  return: makeTrack("return", "Recovery return", ["cloud.fill", "arrow.clockwise", "gift.fill"], "#C4B5FD", ["CALM RETURN", "EASING", "SOFT LAND"]),
  energy: makeTrack("energy", "Energy recovery", ["bolt.fill", "timer", "flame.fill"], "#FCD34D", ["GENTLE", "SLOW BUILD", "RESTORE"]),
  protect: makeTrack("protect", "Protective reset", ["shield.fill", "target", "cloud.fill"], "#FDA4AF", ["LOWER LOAD", "GUARD FOCUS", "QUIET FIRST"]),
  friction: makeTrack("friction", "Friction guard", ["figure.run", "shield.fill", "arrow.clockwise"], "#F9A8D4", ["CLEAR SPACE", "BLOCK NOISE", "REMOVE DRAG"]),
  focus_recover: makeTrack("focus_recover", "Focus recovery", ["circle.grid.cross.fill", "target", "star.fill"], "#A5B4FC", ["FOCUS BACK", "RECENTER", "ONE STEP"]),
  clarity_recover: makeTrack("clarity_recover", "Clarity recovery", ["book.closed.fill", "target", "timer"], "#67E8F9", ["CLARITY UP", "PATH OPENS", "SIMPLE NEXT"]),
  drive: makeTrack("drive", "Motivation build", ["flame.fill", "bolt.fill", "star.fill"], "#FDBA74", ["DRIVE BACK", "INNER SPARK", "PURPOSE"]),
  stress: makeTrack("stress", "Stress easing", ["cloud.fill", "shield.fill", "timer"], "#86EFAC", ["STRESS EASE", "LOAD EASES", "BREATHE"]),
  noise: makeTrack("noise", "Distraction easing", ["circle.grid.cross.fill", "cloud.fill", "target"], "#D8B4FE", ["NOISE EASES", "MIND CLEARS", "LESS PULL"]),
  shift: makeTrack("shift", "Emotional shift", ["arrow.clockwise", "cloud.fill", "star.fill"], "#5EEAD4", ["BETTER NOW", "CALM LANDS", "GOOD TURN"]),
  warming: makeTrack("warming", "Pattern warming", ["timer", "circle.grid.cross.fill", "book.closed.fill"], "#C4B5FD", ["WARMING UP", "SIGNALS UP", "READ AHEAD"]),
  mixed: makeTrack("mixed", "Mixed pattern", ["book.closed.fill", "cloud.fill", "star.fill"], "#CBD5E1", ["READ GENTLY", "HOLD LIGHT", "CURIOUS"]),
};

export const EMOTION_PREDICTION_TRACK_COUNT = Object.keys(TRACKS).length;
export const EMOTION_PREDICTION_LIBRARY_COUNT = Object.values(TRACKS).flatMap((track) => track.readings).length;

for (const reading of Object.values(TRACKS).flatMap((track) => track.readings)) {
  if (reading.label.length > PREDICTION_LABEL_MAX_LENGTH) throw new Error(`Prediction label exceeds compact width: ${reading.label}`);
}

type NumericReflectionKey = "energyBefore" | "energyAfter" | "focusQuality" | "stressLevel" | "clarityLevel" | "motivationLevel" | "distractionLevel" | "frictionRating" | "provokingThoughtRating";
const SUPPORTIVE_KEYS: NumericReflectionKey[] = ["energyAfter", "focusQuality", "clarityLevel", "motivationLevel"];
const LOAD_KEYS: NumericReflectionKey[] = ["stressLevel", "distractionLevel", "frictionRating", "provokingThoughtRating"];

function average(reflections: Reflection[], keys: NumericReflectionKey[]): number {
  const values = reflections.flatMap((reflection) => keys.map((key) => reflection[key]).filter((value): value is number => typeof value === "number"));
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function stableHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return hash;
}

function signature(forecast: EmotionalPatternForecast, reflections: Reflection[]): string {
  const reflectionValues = reflections.slice(-14).map((reflection) => [
    reflection.feelingBefore, reflection.feelingAfter, reflection.energyBefore, reflection.energyAfter,
    reflection.focusQuality, reflection.stressLevel, reflection.clarityLevel, reflection.motivationLevel,
    reflection.distractionLevel, reflection.frictionRating, reflection.frictionName.trim().toLowerCase(),
    reflection.provokingThought.trim().toLowerCase(), reflection.provokingThoughtRating,
    Object.entries(reflection.customAnswers).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}:${JSON.stringify(value)}`).join(","),
  ].join("~")).join("|");
  return [forecast.available, forecast.outlook, forecast.score, forecast.confidence, forecast.sampleSize, forecast.signals.map((signal) => `${signal.label}:${signal.value}:${signal.direction}`).join("|"), reflectionValues].join(";");
}

function selectTrack(forecast: EmotionalPatternForecast, reflections: Reflection[]): Track {
  const recent = reflections.slice(-14);
  if (!forecast.available || recent.length < 3) return TRACKS.warming;
  const focus = average(recent, ["focusQuality"]);
  const clarity = average(recent, ["clarityLevel"]);
  const motivation = average(recent, ["motivationLevel"]);
  const energy = average(recent, ["energyAfter"]);
  const stress = average(recent, ["stressLevel"]);
  const distraction = average(recent, ["distractionLevel"]);
  const friction = average(recent, ["frictionRating"]);
  const pressure = average(recent, LOAD_KEYS);
  const support = average(recent, SUPPORTIVE_KEYS);

  if (friction >= 3.5) return TRACKS.friction;
  if (stress >= 3.8) return TRACKS.protect;
  if (distraction >= 3.6) return TRACKS.noise;
  if (forecast.outlook === "momentum") return focus >= 3.6 && clarity >= 3.4 ? TRACKS.focus : TRACKS.flow;
  if (forecast.outlook === "steady") return clarity >= 3.5 ? TRACKS.clarity : TRACKS.steady;
  if (forecast.outlook === "recovery") {
    if (focus <= 2.5) return TRACKS.focus_recover;
    if (clarity <= 2.5) return TRACKS.clarity_recover;
    if (motivation <= 2.5) return TRACKS.drive;
    if (energy <= 2.5) return TRACKS.energy;
    return support >= pressure ? TRACKS.return : TRACKS.stress;
  }
  if (forecast.outlook === "fragile") return stress >= 3.3 || pressure > support ? TRACKS.protect : TRACKS.mixed;
  return TRACKS.mixed;
}

/** Returns one exact trio of local, non-clinical next-session emotional possibilities. */
export function getEmotionPredictionTrio(forecast: EmotionalPatternForecast, reflections: Reflection[]): EmotionPrediction[] {
  const readings = selectTrack(forecast, reflections).readings;
  const start = stableHash(signature(forecast, reflections)) % readings.length;
  return Array.from({ length: 3 }, (_, index) => readings[(start + index) % readings.length]!);
}

export function getEmotionPredictionLibrarySummary() {
  return { trackCount: EMOTION_PREDICTION_TRACK_COUNT, readingCount: EMOTION_PREDICTION_LIBRARY_COUNT };
}
