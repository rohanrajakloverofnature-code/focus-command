import type { EmotionalPatternForecast, ForecastOutlook, Reflection } from "./focus-command";

export interface ForecastMotivationMessage {
  headline: string;
  detail: string;
}

type LibraryMessage = ForecastMotivationMessage & { id: string };

const library = (prefix: string, headlines: string[], details: string[]): LibraryMessage[] => (
  headlines.map((headline, index) => ({ id: `${prefix}-${index}`, headline, detail: details[index]! }))
);

const FORECAST_LIBRARY: Record<ForecastOutlook, LibraryMessage[]> = {
  momentum: library("momentum", [
    "Your focus is finding its current.", "Clarity is giving effort a direction.", "Drive is meeting a workable pace.", "A calmer rhythm is supporting progress.", "Energy and attention are moving together.",
    "The supportive signals are holding.", "Quiet confidence is appearing.", "Your emotional signals are aligning.", "The next focus window looks open.", "Momentum is present; protect its edges.",
  ], [
    "The recent emotional pattern supports a defined block while attention still feels available.", "Use the steadier emotional window for one meaningful step before the pattern changes.", "Your reflections suggest momentum stays useful when the next action remains specific.", "Let the current emotional balance guide a focused start instead of adding pressure.", "The next session can build on this supportive pattern with one clear point of entry.",
    "Protect the conditions that recently made focus feel more natural and less forced.", "A deliberate next block can use the present focus without turning it into a demand.", "Keep the next step narrow enough for motivation and clarity to stay together.", "Recent reflections point toward a usable balance between inner drive and mental space.", "A little less switching and friction can help the current lift remain steady.",
  ]),
  steady: library("steady", [
    "Your emotional ground is holding steady.", "Clarity is giving the day a stable center.", "A calm pace is working in your favor.", "Your pattern has found an anchor.", "The emotional signals are broadly balanced.",
    "Attention is settling into a reliable rhythm.", "There is useful steadiness beneath the noise.", "Your recent pattern supports staying the course.", "Quiet consistency is becoming visible.", "Your center is easier to return to.",
  ], [
    "A consistent, well-defined session fits the balance you have recently been building.", "Keep the next step simple enough for the present emotional balance to remain intact.", "Recent reflections suggest steady effort is more useful than forcing a surge.", "Return to the kind of small, direct start that kept focus and pressure in balance.", "Use this stable base for a clear task rather than spending the window deciding.",
    "A focused block with few moving parts can reinforce what the reflections already show.", "Let an uncomplicated next action preserve the emotional room you currently have.", "One measured session can keep clarity, motivation, and pressure from drifting apart.", "The emotional data favors a repeatable pace over a heavier push right now.", "Choose a bounded task and let the existing balance do more of the work.",
  ]),
  recovery: library("recovery", [
    "A gentler start suits the current pattern.", "Clarity can return through a smaller step.", "Your emotional pattern is asking for a reset.", "Give the next block more breathing space.", "Energy may respond to a lighter entry.",
    "Focus can rebuild without forcing intensity.", "The next useful move can be quiet and small.", "A kinder pace is still a real direction.", "Restoring the conditions matters first.", "Your rhythm can return one step at a time.",
  ], [
    "Recent reflection signals suggest beginning with a small, clear action before adding demand.", "Reduce the number of decisions around the next session and let focus rebuild gradually.", "A lower-pressure entry can create room for motivation and attention to recover.", "Recent load signals favor a calm beginning with fewer distractions and less friction.", "Choose an action that feels easy to begin, then let the emotional pattern guide what follows.",
    "A short, defined session is more aligned with the current emotional recovery signal.", "Lowering friction first gives clarity and motivation a better chance to return together.", "Your reflections suggest reducing pressure can be more useful than pushing through it.", "Simplify the start so attention has fewer emotional obstacles to work around.", "Let a manageable beginning rebuild trust between effort, energy, and clarity.",
  ]),
  fragile: library("fragile", [
    "Reduce friction before asking for focus.", "The next step should carry less load.", "Protect the mental space you still have.", "A soft reset fits better than forcing momentum.", "Quiet conditions may matter most right now.",
    "A smaller boundary can protect your energy.", "Create room before creating pressure.", "Attention needs a safer starting point.", "Lower pressure can be a precise response.", "Beginning lightly is enough for this moment.",
  ], [
    "The recent emotional pattern suggests a simpler environment matters more than a harder push.", "Choose a small, concrete action that asks less from energy, clarity, and attention.", "Lowering distractions and decisions can make the next session feel more possible.", "Use the reflection pattern as permission to make the next entry point easier.", "Clear one source of friction before beginning and let the action remain intentionally small.",
    "The current emotional signals favor one limited commitment over a demanding session.", "A forgiving next action can help the load signals settle instead of compound.", "Reduce the pull of friction and distraction before expecting sustained focus.", "A gentle, defined session respects what the emotional data is currently showing.", "Use a short, low-friction action to meet the present emotional state with care.",
  ]),
  warming_up: library("warming", [
    "Your reflection pattern is beginning to form.", "A personal baseline is taking shape.", "The first useful emotional threads are appearing.", "Honest observations make the reading sharper.", "Notice the change without judging it.",
    "Your emotional map is building quietly.", "Each debrief adds a clearer signal.", "The pattern begins with one clear observation.", "Your private reading is still warming up.", "The forecast is learning your own rhythm.",
  ], [
    "Each honest emotional check-in gives the on-device forecast a clearer personal signal.", "Continue noting how focus, energy, clarity, stress, distraction, and friction feel after work.", "A few more reflections will help distinguish a stable pattern from a passing moment.", "The forecast stays private and on-device, learning only from the emotional signals you log.", "Early reflections can reveal how your inner conditions shift around work.",
    "Complete reflections give the next forecast more context about energy, focus, and friction.", "The model becomes more personal as your emotional reflection history becomes more complete.", "Use the next reflection to record what supported or strained your focus without pressure.", "More emotional check-ins will help the forecast respond with more specific guidance.", "It uses only the reflection details you choose to record after completed work.",
  ]),
};

function stableHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return hash;
}

function reflectionSignature(reflections: Reflection[]): string {
  return reflections.slice(-14).map((reflection) => [
    reflection.feelingBefore, reflection.feelingAfter, reflection.energyBefore, reflection.energyAfter,
    reflection.focusQuality, reflection.stressLevel, reflection.clarityLevel, reflection.motivationLevel,
    reflection.distractionLevel, reflection.frictionRating, reflection.frictionName.trim().toLowerCase(),
    reflection.provokingThoughtRating,
    Object.entries(reflection.customAnswers).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}:${JSON.stringify(value)}`).join(","),
  ].join("~")).join("|");
}

/** Returns five distinct emotion-only messages for the current bounded local reflection signature. */
export function getForecastMotivationMessages(
  forecast: EmotionalPatternForecast,
  reflections: Reflection[] = [],
): ForecastMotivationMessage[] {
  const outlook = forecast.available ? forecast.outlook : "warming_up";
  const signature = [
    outlook, forecast.score, forecast.confidence, forecast.sampleSize,
    forecast.signals.map((signal) => `${signal.label}:${signal.value}:${signal.direction}`).join("|"),
    reflectionSignature(reflections),
  ].join(";");
  const pool = FORECAST_LIBRARY[outlook];
  const hash = stableHash(signature);
  const start = hash % pool.length;
  const steps = [1, 3, 7, 9];
  const step = steps[Math.floor(hash / pool.length) % steps.length]!;
  return Array.from({ length: 5 }, (_, index) => {
    const message = pool[(start + index * step) % pool.length]!;
    return { headline: message.headline, detail: message.detail };
  });
}
