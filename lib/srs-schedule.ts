export const SRS_DIFFICULTIES = ["easy", "medium", "tough", "toughest"] as const;
export type SrsDifficulty = typeof SRS_DIFFICULTIES[number];
export type SrsScheduleTier = SrsDifficulty | "legacy";

export const SRS_INTERVALS: Record<SrsScheduleTier, readonly number[]> = {
  easy: [1, 7, 21, 45, 90],
  medium: [1, 3, 10, 30, 60, 90],
  tough: [1, 2, 5, 14, 30, 60, 90],
  toughest: [1, 2, 4, 8, 16, 30, 60, 90],
  legacy: [1, 7, 30],
};

export type SrsPhase = "seed_sown" | "emerging" | "developing" | "reinforcing" | "consolidating" | "matured";

export interface SrsProgressInput {
  stage: number;
  status?: "due" | "scheduled" | "completed";
  difficulty?: string | null;
  scheduleTier?: string | null;
}

export interface SrsProgress {
  stage: number;
  totalStages: number;
  progress: number;
  percent: number;
  phase: SrsPhase;
  scheduleTier: SrsScheduleTier;
}

export const SRS_DIFFICULTY_OPTIONS: Array<{ value: SrsDifficulty; label: string; detail: string }> = [
  { value: "easy", label: "Easy", detail: "Quick to recall" },
  { value: "medium", label: "Medium", detail: "Needs regular practice" },
  { value: "tough", label: "Tough", detail: "Hard to retain" },
  { value: "toughest", label: "Toughest", detail: "Requires close repetition" },
];

export function isSrsDifficulty(value: unknown): value is SrsDifficulty {
  return typeof value === "string" && (SRS_DIFFICULTIES as readonly string[]).includes(value);
}

export function normalizeSrsScheduleTier(value: unknown, fallback: SrsScheduleTier = "legacy"): SrsScheduleTier {
  if (value === "legacy") return "legacy";
  return isSrsDifficulty(value) ? value : fallback;
}

export function missionDifficultyToSrsDifficulty(value: unknown): SrsDifficulty {
  if (value === "easy") return "easy";
  if (value === "hard") return "tough";
  return "medium";
}

export function getSrsIntervals(input: Pick<SrsProgressInput, "difficulty" | "scheduleTier"> | SrsScheduleTier | SrsDifficulty | null | undefined): readonly number[] {
  const tier = typeof input === "string" ? normalizeSrsScheduleTier(input, "legacy") : normalizeSrsScheduleTier(input?.scheduleTier ?? input?.difficulty, "legacy");
  return SRS_INTERVALS[tier];
}

export function getSrsScheduleTier(input: Pick<SrsProgressInput, "difficulty" | "scheduleTier"> | SrsScheduleTier | SrsDifficulty | null | undefined): SrsScheduleTier {
  return typeof input === "string" ? normalizeSrsScheduleTier(input, "legacy") : normalizeSrsScheduleTier(input?.scheduleTier ?? input?.difficulty, "legacy");
}

export function getSrsProgress(input: SrsProgressInput): SrsProgress {
  const scheduleTier = getSrsScheduleTier(input);
  const totalStages = getSrsIntervals(scheduleTier).length;
  const stage = Math.max(0, Math.min(totalStages, Math.round(Number(input.stage) || 0)));
  const progress = totalStages ? Math.min(1, stage / totalStages) : 0;
  const percent = input.status === "completed" || stage >= totalStages ? 100 : Math.round(progress * 100);
  return { stage, totalStages, progress, percent, phase: getSrsPhase({ stage, totalStages, scheduleTier, percent }), scheduleTier };
}

function getSrsPhase(progress: Pick<SrsProgress, "stage" | "totalStages" | "scheduleTier" | "percent">): SrsPhase {
  if (progress.scheduleTier === "legacy") {
    if (progress.stage <= 0) return "seed_sown";
    if (progress.stage === 1) return "emerging";
    if (progress.stage === 2) return "developing";
    return "matured";
  }
  if (progress.percent >= 100) return "matured";
  if (progress.percent >= 75) return "consolidating";
  if (progress.percent >= 50) return "reinforcing";
  if (progress.percent >= 25) return "developing";
  return progress.percent > 0 ? "emerging" : "seed_sown";
}

export function getSrsIntervalForStage(input: Pick<SrsProgressInput, "difficulty" | "scheduleTier"> | SrsScheduleTier | SrsDifficulty | null | undefined, stage: number): number | null {
  const intervals = getSrsIntervals(input);
  const index = Math.max(0, Math.min(intervals.length - 1, Math.round(Number(stage) || 0)));
  return intervals[index] ?? null;
}

export function getSrsCurrentDueDate(input: SrsProgressInput, localDate: string): string | null {
  const progress = getSrsProgress(input);
  if (input.status === "completed" || progress.stage >= progress.totalStages) return null;
  const interval = getSrsIntervalForStage(progress.scheduleTier, progress.stage);
  return interval === null ? null : addLocalDays(localDate, interval);
}

export function getSrsNextDueDate(input: SrsProgressInput, localDate: string): string | null {
  const progress = getSrsProgress(input);
  const nextStage = progress.stage + 1;
  if (nextStage >= progress.totalStages) return null;
  const interval = getSrsIntervalForStage(progress.scheduleTier, nextStage);
  return interval === null ? null : addLocalDays(localDate, interval);
}

export function getSrsPhaseLabel(phase: SrsPhase): string {
  if (phase === "seed_sown") return "Seed Sown";
  if (phase === "emerging") return "Emerging";
  if (phase === "developing") return "Developing";
  if (phase === "reinforcing") return "Reinforcing";
  if (phase === "consolidating") return "Consolidating";
  return "Matured";
}

export function getSrsDifficultyLabel(difficulty: SrsDifficulty | SrsScheduleTier): string {
  if (difficulty === "legacy") return "Legacy 1–7–30";
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

export function getSrsReviewLabel(input: SrsProgressInput): string {
  const progress = getSrsProgress(input);
  if (progress.stage >= progress.totalStages || input.status === "completed") return "Matured";
  return `Review ${progress.stage + 1} of ${progress.totalStages}`;
}

function addLocalDays(localDate: string, days: number): string {
  const date = new Date(`${localDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
