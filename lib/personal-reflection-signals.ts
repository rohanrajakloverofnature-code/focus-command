import type { CustomQuestion, FocusState, Reflection, WellbeingSignalRole } from "./focus-command";
import { selectBehavioralReflectionWindow } from "./behavioral-reflection-window";

export const MINIMUM_CONSISTENCY_PROJECTION_REFLECTIONS = 8;
const MAX_PROJECTION_SOURCE_REFLECTIONS = 500;

export type ConsistencyProjectionHorizon = 90 | 180 | 365;

export interface RatingReflectionSignal {
  kind: "rating";
  question: CustomQuestion;
  observations: Array<{ reflectionId: string; createdAt: string; value: number }>;
}

export interface ChoiceReflectionSignal {
  kind: "choice";
  question: CustomQuestion;
  responseCounts: Array<{ label: string; count: number }>;
  answerCount: number;
}

export interface TextReflectionSignal {
  kind: "text";
  question: CustomQuestion;
  answerCount: number;
  recentAnswers: Array<{ reflectionId: string; createdAt: string; answer: string }>;
}

export type PersonalReflectionSignal = RatingReflectionSignal | ChoiceReflectionSignal | TextReflectionSignal;

export interface ConsistencyScenario {
  available: boolean;
  sampleSize: number;
  horizon: ConsistencyProjectionHorizon;
  baseline: number;
  customSignalCount: number;
  detail: string;
  points: Array<{ label: string; expected: number; lower: number; upper: number }>;
}

function numericRating(answer: unknown): number | null {
  const value = typeof answer === "number" ? answer : Number(answer);
  return Number.isFinite(value) && value >= 1 && value <= 5 ? value : null;
}

function normalizedTextAnswer(answer: unknown): string | null {
  return typeof answer === "string" && answer.trim() ? answer.trim() : null;
}

export function getPersonalReflectionSignals(state: Pick<FocusState, "customQuestions" | "reflections">): PersonalReflectionSignal[] {
  return state.customQuestions
    .filter((question) => !question.id.startsWith("__"))
    .map((question) => {
      if (question.type === "rating") {
        const observations = state.reflections.flatMap((reflection) => {
          const value = numericRating(reflection.customAnswers?.[question.id]);
          return value === null ? [] : [{ reflectionId: reflection.id, createdAt: reflection.createdAt, value }];
        });
        return { kind: "rating" as const, question, observations };
      }

      if (question.type === "single_choice" || question.type === "multiple_choice") {
        const responseCounts = new Map<string, number>();
        let answerCount = 0;
        state.reflections.forEach((reflection) => {
          const answer = reflection.customAnswers?.[question.id];
          const choices = Array.isArray(answer) ? answer : typeof answer === "string" && answer.trim() ? [answer] : [];
          if (choices.length) answerCount += 1;
          choices.forEach((choice) => {
            const label = choice.trim();
            if (label) responseCounts.set(label, (responseCounts.get(label) ?? 0) + 1);
          });
        });
        return {
          kind: "choice" as const,
          question,
          answerCount,
          responseCounts: Array.from(responseCounts.entries()).map(([label, count]) => ({ label, count })).sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
        };
      }

      const answers = state.reflections.flatMap((reflection) => {
        const answer = normalizedTextAnswer(reflection.customAnswers?.[question.id]);
        return answer ? [{ reflectionId: reflection.id, createdAt: reflection.createdAt, answer }] : [];
      });
      return {
        kind: "text" as const,
        question,
        answerCount: answers.length,
        recentAnswers: answers.slice(-12).reverse(),
      };
    });
}

function builtInConsistencyScore(reflection: Reflection): number | null {
  const supportive = [reflection.energyAfter, reflection.focusQuality, reflection.clarityLevel, reflection.motivationLevel]
    .filter((value): value is number => typeof value === "number" && value >= 1 && value <= 5);
  const load = [reflection.stressLevel, reflection.distractionLevel, reflection.frictionRating]
    .filter((value): value is number => typeof value === "number" && value >= 1 && value <= 5);
  if (!supportive.length || !load.length) return null;
  const supportiveAverage = supportive.reduce((sum, value) => sum + value, 0) / supportive.length;
  const loadAverage = load.reduce((sum, value) => sum + value, 0) / load.length;
  return Math.max(0, Math.min(100, Math.round(((supportiveAverage / 5) * 0.72 + ((5 - loadAverage) / 5) * 0.28) * 100)));
}

function enabledProjectionQuestions(questions: readonly CustomQuestion[]) {
  return questions.filter((question) => question.type === "rating" && question.personalSignal?.enabled && question.personalSignal.includeInProjection);
}

function projectionCustomScore(reflection: Reflection, questions: readonly CustomQuestion[]): number | null {
  const values = questions.flatMap((question) => {
    const rating = numericRating(reflection.customAnswers?.[question.id]);
    if (rating === null) return [];
    const role: WellbeingSignalRole = question.personalSignal?.role === "load" ? "load" : "supportive";
    return [role === "supportive" ? rating * 20 : (5 - rating) * 20];
  });
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getConsistencyScenario(
  state: Pick<FocusState, "profile" | "reflections" | "customQuestions">,
  horizon: ConsistencyProjectionHorizon,
): ConsistencyScenario {
  const windowed = selectBehavioralReflectionWindow(
    state.reflections,
    state.profile.behavioralReflectionWindow,
    state.profile.behavioralReflectionCustomCount,
  ).slice(-MAX_PROJECTION_SOURCE_REFLECTIONS);
  const customQuestions = enabledProjectionQuestions(state.customQuestions);
  const scores = windowed.flatMap((reflection) => {
    const builtIn = builtInConsistencyScore(reflection);
    if (builtIn === null) return [];
    const custom = projectionCustomScore(reflection, customQuestions);
    const score = custom === null ? builtIn : builtIn * 0.84 + custom * 0.16;
    return [score];
  });
  const sampleSize = scores.length;
  const customSignalCount = customQuestions.length;
  if (sampleSize < MINIMUM_CONSISTENCY_PROJECTION_REFLECTIONS) {
    return {
      available: false,
      sampleSize,
      horizon,
      baseline: 0,
      customSignalCount,
      detail: `Add ${Math.max(0, MINIMUM_CONSISTENCY_PROJECTION_REFLECTIONS - sampleSize)} more complete long-mission debrief${MINIMUM_CONSISTENCY_PROJECTION_REFLECTIONS - sampleSize === 1 ? "" : "s"} to view a cautious local scenario.`,
      points: [],
    };
  }
  const baseline = scores.reduce((sum, score) => sum + score, 0) / sampleSize;
  const variance = scores.reduce((sum, score) => sum + (score - baseline) ** 2, 0) / sampleSize;
  const observedVariation = Math.sqrt(variance);
  const half = Math.max(1, Math.floor(sampleSize / 2));
  const earlier = scores.slice(0, half);
  const later = scores.slice(half);
  const drift = (later.reduce((sum, value) => sum + value, 0) / later.length) - (earlier.reduce((sum, value) => sum + value, 0) / earlier.length);
  const monthMarks = [0, Math.round(horizon / 3), Math.round((horizon * 2) / 3), horizon];
  const points = monthMarks.map((day, index) => {
    const progress = index / Math.max(1, monthMarks.length - 1);
    const expected = clampScore(baseline + drift * progress * 0.18);
    const uncertainty = Math.max(8, observedVariation * 0.75) + progress * (horizon === 365 ? 20 : horizon === 180 ? 15 : 11);
    return {
      label: day === 0 ? "NOW" : `+${day}D`,
      expected,
      lower: clampScore(expected - uncertainty),
      upper: clampScore(expected + uncertainty),
    };
  });
  return {
    available: true,
    sampleSize,
    horizon,
    baseline: clampScore(baseline),
    customSignalCount,
    detail: `Conditional local continuation from ${sampleSize} complete debrief${sampleSize === 1 ? "" : "s"}. The middle line stays close to your recent self-reported pattern; the outer lines widen because future consistency can differ.`,
    points,
  };
}
