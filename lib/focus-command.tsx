import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

export type Difficulty = "easy" | "medium" | "hard";
export type MissionStatus = "planned" | "active" | "paused" | "completed";
export type Feeling = "charged" | "steady" | "restless" | "drained" | "great";
export type RewardCategory = "life" | "gear" | "power" | "multiplier";
export type SyncPhase = "local" | "ready" | "authorized" | "syncing" | "synced" | "needs_setup" | "error";

export interface ComboTier {
  id: string;
  days: number;
  multiplier: number;
  enabled: boolean;
}

export interface PlayerProfile {
  firstName: string;
  timezone: string;
  dailyTargetXp: number;
  lootChancePercent: number;
  energyMaximum: number;
  energyCostPerMinute: Record<Difficulty, number>;
  maxLevel: number;
  powerPerLevel: number;
  titleChangeInterval: number;
  titles: string[];
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  theme: "system" | "dark" | "light";
}

export interface ComboState {
  currentTierId: string;
  lastActiveDate: string | null;
  qualifyingStreak: number;
  missedDays: number;
}

export interface Mission {
  id: string;
  title: string;
  subject: string;
  category: string;
  difficulty: Difficulty;
  baseXp: number;
  bossId: string | null;
  specificTopic: string;
  revisionEnabled: boolean;
  status: MissionStatus;
  createdAt: string;
  dueAt: string | null;
  startedAt: string | null;
  pausedAt: string | null;
  pausedMilliseconds: number;
  endedAt: string | null;
  completedAt: string | null;
  revisionTopicIds: string[];
  progressionEventId: string | null;
}

export interface Reflection {
  id: string;
  missionId: string;
  createdAt: string;
  feelingBefore: Feeling | null;
  feelingAfter: Feeling | null;
  frictionName: string;
  frictionRating: number | null;
  provokingThought: string;
  provokingThoughtRating: number | null;
  skills: string[];
  miniAchievement: string;
  miniAchievementRating: number | null;
  customAnswers: Record<string, string | number | boolean | string[]>;
}

export interface SrsTopic {
  id: string;
  missionId: string | null;
  subject: string;
  topic: string;
  stage: number;
  dueDate: string;
  completedAt: string | null;
  createdAt: string;
  status: "due" | "scheduled" | "completed";
}

export interface Boss {
  id: string;
  title: string;
  objective: string;
  deadlineAt: string | null;
  rewardXp: number;
  rewardGold: number;
  createdAt: string;
  status: "active" | "completed" | "archived";
}

export interface JournalEntry {
  id: string;
  localDate: string;
  betterThanYesterday: boolean;
  points: number;
  note: string;
  createdAt: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  category: RewardCategory;
  goldCost: number;
  lootEnabled: boolean;
  lootWeight: number;
  goldMultiplier: number | null;
  createdAt: string;
  active: boolean;
}

export interface Transaction {
  id: string;
  type: "power_gold" | "purchase" | "loot" | "refund" | "boss_reward";
  goldDelta: number;
  sourceId: string | null;
  occurredAt: string;
  effectiveOn: string | null;
  note: string;
}

export interface InventoryItem {
  id: string;
  rewardId: string;
  acquiredAt: string;
  effectiveOn: string | null;
  consumedAt: string | null;
  active: boolean;
}

export interface ProgressionEvent {
  id: string;
  missionId: string | null;
  baseXp: number;
  comboMultiplier: number;
  goldMultiplier: number;
  powerAwarded: number;
  goldAwarded: number;
  occurredAt: string;
  note: string;
}

export interface LifelinePoint {
  id: string;
  localDate: string;
  year: number;
  lifePerformance: number;
  experience: number;
  source: "manual" | "journal";
  note: string;
}

export interface CustomQuestion {
  id: string;
  label: string;
  type: "text" | "rating" | "single_choice" | "multiple_choice";
  options: string[];
  enabled: boolean;
}

export interface GraphSeries {
  id: string;
  label: string;
  metric: "miniAchievementRating" | "frictionRating" | "provokingThoughtRating" | "feelingAfter" | "durationHours";
  color: string;
}

export interface CustomGraph {
  id: string;
  title: string;
  series: GraphSeries[];
  enabled: boolean;
}

export interface GoogleSheetConnection {
  spreadsheetId: string;
  spreadsheetName: string;
  connectedEmail: string;
  lastSyncedAt: string | null;
  phase: SyncPhase;
  errorMessage: string | null;
  pendingOperations: number;
}

export interface FocusState {
  schemaVersion: number;
  hydrated: boolean;
  profile: PlayerProfile;
  combo: ComboState;
  missions: Mission[];
  reflections: Reflection[];
  srsTopics: SrsTopic[];
  bosses: Boss[];
  journals: JournalEntry[];
  rewards: Reward[];
  transactions: Transaction[];
  inventory: InventoryItem[];
  progression: ProgressionEvent[];
  lifeline: LifelinePoint[];
  customQuestions: CustomQuestion[];
  customGraphs: CustomGraph[];
  goldPowerCarry: number;
  googleSheet: GoogleSheetConnection;
}

export interface MissionDraft {
  title: string;
  subject: string;
  category: string;
  difficulty: Difficulty;
  baseXp: number;
  bossId: string | null;
  specificTopic: string;
  revisionEnabled: boolean;
  dueAt: string | null;
}

export interface ReflectionDraft {
  feelingBefore?: Feeling | null;
  feelingAfter?: Feeling | null;
  frictionName?: string;
  frictionRating?: number | null;
  provokingThought?: string;
  provokingThoughtRating?: number | null;
  skills?: string[];
  miniAchievement?: string;
  miniAchievementRating?: number | null;
  customAnswers?: Record<string, string | number | boolean | string[]>;
}

export interface JournalDraft {
  betterThanYesterday: boolean;
  points: number;
  note: string;
}

export interface RewardDraft {
  title: string;
  description: string;
  category: RewardCategory;
  goldCost: number;
  lootEnabled: boolean;
  lootWeight: number;
  goldMultiplier: number | null;
}

export const DEFAULT_TITLES = [
  "Recruit",
  "Private",
  "Corporal",
  "Sergeant",
  "Staff Sergeant",
  "Gunnery Sergeant",
  "Master Sergeant",
  "Sergeant Major",
  "Warrant Officer",
  "Chief Warrant Officer",
  "Lieutenant",
  "Captain",
  "Major",
  "Lieutenant Colonel",
  "Colonel",
  "Brigadier",
  "Major General",
  "Lieutenant General",
  "General",
  "Commander",
  "Special Forces",
  "Commando",
  "Tier 1 Operator",
  "Black Ops",
  "Shadow Brigadier",
  "Warlord General",
  "Phantom Vanguard",
  "Apex Predator",
  "Ghost Operative",
  "Sentinel Prime",
  "Oblivion Knight",
  "Astral Paladin",
  "Cosmic Warlord",
  "Infinity Sovereign",
  "Nexus Champion",
  "Void Walker",
  "Quantum Master",
  "Celestial Arbiter",
  "Galactic Overlord",
  "Mythic Legend",
  "Divine Ascendant",
  "Solar Marshal",
  "Iron Oracle",
  "Storm Vanguard",
  "Eclipse Commander",
  "Nova Strategist",
  "Aether Guardian",
  "Titan Architect",
  "Zenith Sovereign",
  "Focus Legend",
];

const STORAGE_KEY = "focus-command-state-v1";
const DAY_MS = 86_400_000;

function createId(prefix: string): string {
  const entropy = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${Date.now().toString(36)}_${entropy}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function toLocalDate(iso: string, timeZone?: string): string {
  const date = new Date(iso);
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function addDays(localDate: string, days: number): string {
  const [year, month, day] = localDate.split("-").map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day + days));
  return calendarDate.toISOString().slice(0, 10);
}

function differenceInDays(from: string, to: string): number {
  const fromTime = Date.parse(`${from}T00:00:00.000Z`);
  const toTime = Date.parse(`${to}T00:00:00.000Z`);
  return Math.round((toTime - fromTime) / DAY_MS);
}

export function formatHours(milliseconds: number): string {
  const hours = Math.max(0, milliseconds) / 3_600_000;
  if (hours === 0) return "0.0 h";
  return `${hours.toFixed(hours < 10 ? 1 : 0)} h`;
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 0, notation: value >= 10_000 ? "compact" : "standard" }).format(value);
}

function defaultProfile(): PlayerProfile {
  return {
    firstName: "Commander",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    dailyTargetXp: 100,
    lootChancePercent: 5,
    energyMaximum: 100,
    energyCostPerMinute: { easy: 0.15, medium: 0.3, hard: 0.5 },
    maxLevel: 500,
    powerPerLevel: 100,
    titleChangeInterval: 10,
    titles: DEFAULT_TITLES,
    soundEnabled: true,
    hapticsEnabled: true,
    notificationsEnabled: true,
    reduceMotion: false,
    highContrast: false,
    theme: "dark",
  };
}

export function createInitialState(): FocusState {
  const baseTierId = "combo_base";
  return {
    schemaVersion: 1,
    hydrated: false,
    profile: defaultProfile(),
    combo: {
      currentTierId: baseTierId,
      lastActiveDate: null,
      qualifyingStreak: 0,
      missedDays: 0,
    },
    missions: [],
    reflections: [],
    srsTopics: [],
    bosses: [],
    journals: [],
    rewards: [
      {
        id: "reward_focus_break",
        title: "Command Break",
        description: "Take a guilt-free 20-minute reset.",
        category: "life",
        goldCost: 25,
        lootEnabled: true,
        lootWeight: 2,
        goldMultiplier: null,
        createdAt: nowIso(),
        active: true,
      },
      {
        id: "reward_3x",
        title: "3× Gold Cache",
        description: "Triples power-to-gold conversion for your next active day.",
        category: "multiplier",
        goldCost: 150,
        lootEnabled: false,
        lootWeight: 0,
        goldMultiplier: 3,
        createdAt: nowIso(),
        active: true,
      },
      {
        id: "reward_5x",
        title: "5× Gold Cache",
        description: "Multiplies power-to-gold conversion by five for your next active day.",
        category: "multiplier",
        goldCost: 300,
        lootEnabled: false,
        lootWeight: 0,
        goldMultiplier: 5,
        createdAt: nowIso(),
        active: true,
      },
      {
        id: "reward_signal_blade",
        title: "Signal Blade",
        description: "An armory upgrade that changes your command profile visual.",
        category: "gear",
        goldCost: 220,
        lootEnabled: true,
        lootWeight: 1,
        goldMultiplier: null,
        createdAt: nowIso(),
        active: true,
      },
    ],
    transactions: [],
    inventory: [],
    progression: [],
    lifeline: [],
    customQuestions: [],
    customGraphs: [
      { id: "graph_growth", title: "Growth Signals", enabled: true, series: [] },
      { id: "graph_focus", title: "Focus Signals", enabled: true, series: [] },
      { id: "graph_custom", title: "Custom Signals", enabled: true, series: [] },
    ],
    goldPowerCarry: 0,
    googleSheet: {
      spreadsheetId: "",
      spreadsheetName: "",
      connectedEmail: "",
      lastSyncedAt: null,
      phase: "needs_setup",
      errorMessage: null,
      pendingOperations: 0,
    },
  };
}

export function getComboTiers(state: FocusState): ComboTier[] {
  const stored = state.customQuestions.find((question) => question.id === "__combo_tiers__");
  if (stored && stored.options.length) {
    try {
      const tiers = JSON.parse(stored.options[0]) as ComboTier[];
      if (tiers.length) return tiers.filter((tier) => tier.enabled).sort((a, b) => a.days - b.days);
    } catch {
      // The default progression remains available if a manually edited local record is malformed.
    }
  }
  return [
    { id: "combo_base", days: 1, multiplier: 1, enabled: true },
    { id: "combo_3", days: 3, multiplier: 1.1, enabled: true },
    { id: "combo_7", days: 7, multiplier: 1.3, enabled: true },
    { id: "combo_14", days: 14, multiplier: 1.5, enabled: true },
    { id: "combo_30", days: 30, multiplier: 1.75, enabled: true },
  ];
}

export function getCurrentCombo(state: FocusState, referenceDate = toLocalDate(nowIso(), state.profile.timezone)) {
  const tiers = getComboTiers(state);
  const selected = tiers.find((tier) => tier.id === state.combo.currentTierId) ?? tiers[0];
  if (!state.combo.lastActiveDate) {
    return { tier: tiers[0], multiplier: tiers[0].multiplier, missedDays: 0, daysToNext: Math.max(0, tiers[1]?.days ?? 1) };
  }
  const daysSinceActive = Math.max(0, differenceInDays(state.combo.lastActiveDate, referenceDate));
  const missedDays = Math.max(0, daysSinceActive - 1);
  if (missedDays >= 3) {
    return { tier: tiers[0], multiplier: tiers[0].multiplier, missedDays, daysToNext: Math.max(0, tiers[1]?.days ?? 1) };
  }
  const index = Math.max(0, tiers.findIndex((tier) => tier.id === selected.id) - Math.min(missedDays, 2));
  const tier = tiers[index] ?? tiers[0];
  const next = tiers[index + 1];
  const daysToNext = next ? Math.max(0, next.days - Math.max(1, missedDays ? 1 : state.combo.qualifyingStreak)) : 0;
  return { tier, multiplier: tier.multiplier, missedDays, daysToNext };
}

export function getTotalPower(state: FocusState): number {
  return state.progression.reduce((total, event) => total + event.powerAwarded, 0);
}

export function getTotalXp(state: FocusState): number {
  return state.progression.reduce((total, event) => total + event.baseXp, 0);
}

export function getGoldBalance(state: FocusState): number {
  return state.transactions.reduce((total, entry) => total + entry.goldDelta, 0);
}

export function getLifetimeGold(state: FocusState): number {
  return state.transactions.filter((entry) => entry.goldDelta > 0).reduce((total, entry) => total + entry.goldDelta, 0);
}

export function getLevelInfo(state: FocusState) {
  const totalPower = getTotalPower(state);
  const step = Math.max(1, state.profile.powerPerLevel);
  const rawLevel = Math.floor(totalPower / step) + 1;
  const level = Math.max(1, Math.min(state.profile.maxLevel, rawLevel));
  const levelStart = (level - 1) * step;
  const nextThreshold = level >= state.profile.maxLevel ? levelStart : level * step;
  return {
    level,
    currentLevelPower: Math.max(0, totalPower - levelStart),
    powerForNextLevel: Math.max(0, nextThreshold - totalPower),
    currentThreshold: levelStart,
    nextThreshold,
    progress: level >= state.profile.maxLevel ? 1 : Math.min(1, Math.max(0, (totalPower - levelStart) / step)),
  };
}

export function getCurrentTitle(state: FocusState): { title: string; index: number; progress: number } {
  const level = getLevelInfo(state).level;
  const titleIndex = Math.min(state.profile.titles.length - 1, Math.max(0, Math.floor((level - 1) / Math.max(1, state.profile.titleChangeInterval))));
  const titleStartLevel = titleIndex * state.profile.titleChangeInterval + 1;
  const progress = Math.min(1, Math.max(0, (level - titleStartLevel) / Math.max(1, state.profile.titleChangeInterval)));
  return { title: state.profile.titles[titleIndex] ?? "Commander", index: titleIndex, progress };
}

export function getMissionInvestedMilliseconds(mission: Mission, referenceTime = Date.now()): number {
  if (!mission.startedAt) return 0;
  const endTime = mission.endedAt ? Date.parse(mission.endedAt) : mission.pausedAt ? Date.parse(mission.pausedAt) : referenceTime;
  return Math.max(0, endTime - Date.parse(mission.startedAt) - mission.pausedMilliseconds);
}

export function getTodayMissions(state: FocusState): Mission[] {
  const today = toLocalDate(nowIso(), state.profile.timezone);
  return state.missions.filter((mission) => mission.completedAt && toLocalDate(mission.completedAt, state.profile.timezone) === today);
}

export function getEnergy(state: FocusState): { remaining: number; used: number; maximum: number } {
  const used = getTodayMissions(state).reduce((total, mission) => {
    const minutes = getMissionInvestedMilliseconds(mission) / 60_000;
    return total + minutes * state.profile.energyCostPerMinute[mission.difficulty];
  }, 0);
  const maximum = state.profile.energyMaximum;
  return { remaining: Math.max(0, Math.round(maximum - used)), used: Math.round(used), maximum };
}

export function getDailyProgress(state: FocusState): { earned: number; target: number; progress: number } {
  const earned = getTodayMissions(state).reduce((total, mission) => total + mission.baseXp, 0);
  const target = Math.max(1, state.profile.dailyTargetXp);
  return { earned, target, progress: Math.min(1, earned / target) };
}

export function getTodayInvestedMilliseconds(state: FocusState): number {
  return getTodayMissions(state).reduce((total, mission) => total + getMissionInvestedMilliseconds(mission), 0);
}

export function getPendingRevisions(state: FocusState): SrsTopic[] {
  const today = toLocalDate(nowIso(), state.profile.timezone);
  return state.srsTopics.filter((topic) => topic.status !== "completed" && topic.dueDate <= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function getBossProgress(state: FocusState, bossId: string): number {
  const linked = state.missions.filter((mission) => mission.bossId === bossId);
  if (!linked.length) return 0;
  return linked.filter((mission) => mission.status === "completed").length / linked.length;
}

export function getActiveGoldMultiplier(state: FocusState, localDate = toLocalDate(nowIso(), state.profile.timezone)): number {
  return state.inventory
    .filter((item) => item.active && !item.consumedAt && item.effectiveOn === localDate)
    .map((item) => state.rewards.find((reward) => reward.id === item.rewardId)?.goldMultiplier ?? 1)
    .reduce((maximum, multiplier) => Math.max(maximum, multiplier), 1);
}

export function getSubjectCapture(state: FocusState): Array<{ subject: string; capture: number; completed: number; total: number }> {
  const subjects = new Map<string, SrsTopic[]>();
  state.srsTopics.forEach((topic) => {
    const existing = subjects.get(topic.subject) ?? [];
    existing.push(topic);
    subjects.set(topic.subject, existing);
  });
  return Array.from(subjects.entries()).map(([subject, topics]) => {
    const completed = topics.filter((topic) => topic.status === "completed").length;
    return { subject, completed, total: topics.length, capture: topics.length ? completed / topics.length : 0 };
  });
}

export function getDashboardStats(state: FocusState) {
  const today = toLocalDate(nowIso(), state.profile.timezone);
  const sevenDaysAgo = addDays(today, -6);
  const recentCompleted = state.missions.filter((mission) => mission.completedAt && toLocalDate(mission.completedAt, state.profile.timezone) >= sevenDaysAgo);
  const reflectionsByMission = new Map(state.reflections.map((reflection) => [reflection.missionId, reflection]));
  const wallOfFame = recentCompleted.filter((mission) => (reflectionsByMission.get(mission.id)?.miniAchievementRating ?? 0) > 3);
  const achievementRadar = recentCompleted.filter((mission) => reflectionsByMission.get(mission.id)?.feelingAfter === "great");

  const bySubject = new Map<string, number>();
  const byCategory = new Map<string, number>();
  recentCompleted.forEach((mission) => {
    const duration = getMissionInvestedMilliseconds(mission);
    bySubject.set(mission.subject || "Unassigned", (bySubject.get(mission.subject || "Unassigned") ?? 0) + duration);
    byCategory.set(mission.category || "Unassigned", (byCategory.get(mission.category || "Unassigned") ?? 0) + duration);
  });

  const totalHours = state.missions.filter((mission) => mission.status === "completed").reduce((total, mission) => total + getMissionInvestedMilliseconds(mission), 0) / 3_600_000;
  const distinctDays = new Set(state.missions.filter((mission) => mission.completedAt).map((mission) => toLocalDate(mission.completedAt!, state.profile.timezone))).size;
  return {
    wallOfFame,
    achievementRadar,
    subjectDistribution: Array.from(bySubject, ([label, duration]) => ({ label, duration, percentage: totalHours ? duration / 3_600_000 / totalHours : 0 })),
    categoryDistribution: Array.from(byCategory, ([label, duration]) => ({ label, duration, percentage: totalHours ? duration / 3_600_000 / totalHours : 0 })),
    averageDailyHours: distinctDays ? totalHours / distinctDays : 0,
  };
}

function resolveCurrentComboAfterActivity(state: FocusState, activityDate: string): ComboState {
  const tiers = getComboTiers(state);
  const prior = getCurrentCombo(state, activityDate);
  const previousDate = state.combo.lastActiveDate;
  const isSameDay = previousDate === activityDate;
  const consecutive = previousDate ? differenceInDays(previousDate, activityDate) === 1 : false;
  const nextStreak = isSameDay ? Math.max(1, state.combo.qualifyingStreak) : consecutive ? Math.max(1, state.combo.qualifyingStreak + 1) : 1;
  const earnedTier = tiers.filter((tier) => tier.days <= nextStreak).at(-1) ?? tiers[0];
  const tier = isSameDay ? prior.tier : earnedTier;
  return {
    currentTierId: tier.id,
    lastActiveDate: activityDate,
    qualifyingStreak: nextStreak,
    missedDays: 0,
  };
}

function withQueuedOperation(state: FocusState, operationCount = 1): FocusState {
  const connected = Boolean(state.googleSheet.spreadsheetId);
  return {
    ...state,
    googleSheet: {
      ...state.googleSheet,
      pendingOperations: state.googleSheet.pendingOperations + operationCount,
      phase: connected ? "ready" : "needs_setup",
    },
  };
}

type Action =
  | { type: "hydrate"; state: FocusState }
  | { type: "replace"; state: FocusState };

function reducer(state: FocusState, action: Action): FocusState {
  if (action.type === "hydrate") return { ...action.state, hydrated: true };
  return action.state;
}

interface FocusCommandContextValue {
  state: FocusState;
  ready: boolean;
  createMission: (draft: MissionDraft) => string;
  updateMission: (missionId: string, patch: Partial<Mission>) => void;
  startMission: (missionId: string) => void;
  toggleMissionPause: (missionId: string) => void;
  finishMission: (missionId: string, reflection: ReflectionDraft) => { durationMs: number; lootReward: Reward | null } | null;
  logRevisionTopic: (missionId: string, topic: string, subject?: string) => void;
  completeRevision: (topicId: string) => void;
  createBoss: (input: Pick<Boss, "title" | "objective" | "deadlineAt" | "rewardXp" | "rewardGold">) => string;
  addJournal: (draft: JournalDraft) => void;
  addLifelinePoint: (draft: { year: number; lifePerformance: number; experience: number; note: string }) => void;
  createReward: (draft: RewardDraft) => void;
  purchaseReward: (rewardId: string) => { ok: boolean; message: string };
  updateProfile: (patch: Partial<PlayerProfile>) => void;
  updateComboTiers: (tiers: ComboTier[]) => void;
  setGoogleSheetConnection: (patch: Partial<GoogleSheetConnection>) => void;
  importFromGoogleSheet: (remote: FocusState, connection: Partial<GoogleSheetConnection>) => void;
  markSynced: () => void;
  addCustomQuestion: (question: Omit<CustomQuestion, "id">) => void;
  updateCustomGraph: (graphId: string, patch: Partial<CustomGraph>) => void;
  resetLocalData: () => Promise<void>;
}

const FocusCommandContext = createContext<FocusCommandContextValue | null>(null);

function normalizeHydratedState(input: FocusState): FocusState {
  const defaults = createInitialState();
  return {
    ...defaults,
    ...input,
    hydrated: true,
    profile: { ...defaults.profile, ...(input.profile ?? {}) },
    combo: { ...defaults.combo, ...(input.combo ?? {}) },
    googleSheet: { ...defaults.googleSheet, ...(input.googleSheet ?? {}) },
    rewards: input.rewards?.length ? input.rewards : defaults.rewards,
    customGraphs: input.customGraphs?.length ? input.customGraphs : defaults.customGraphs,
  };
}

export function FocusCommandProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active) return;
        if (!raw) {
          dispatch({ type: "hydrate", state: { ...createInitialState(), hydrated: true } });
          return;
        }
        try {
          dispatch({ type: "hydrate", state: normalizeHydratedState(JSON.parse(raw) as FocusState) });
        } catch {
          dispatch({ type: "hydrate", state: { ...createInitialState(), hydrated: true } });
        }
      })
      .catch(() => {
        if (active) dispatch({ type: "hydrate", state: { ...createInitialState(), hydrated: true } });
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const { hydrated, ...persistable } = state;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persistable)).catch(() => undefined);
  }, [state]);

  const commit = useCallback((producer: (current: FocusState) => FocusState) => {
    dispatch({ type: "replace", state: producer(state) });
  }, [state]);

  const createMission = useCallback((draft: MissionDraft) => {
    const id = createId("mission");
    commit((current) => withQueuedOperation({
      ...current,
      missions: [
        {
          id,
          title: draft.title.trim(),
          subject: draft.subject.trim() || "General",
          category: draft.category.trim() || "Focus",
          difficulty: draft.difficulty,
          baseXp: Math.max(1, Math.round(draft.baseXp)),
          bossId: draft.bossId,
          specificTopic: draft.specificTopic.trim(),
          revisionEnabled: draft.revisionEnabled,
          status: "planned",
          createdAt: nowIso(),
          dueAt: draft.dueAt,
          startedAt: null,
          pausedAt: null,
          pausedMilliseconds: 0,
          endedAt: null,
          completedAt: null,
          revisionTopicIds: [],
          progressionEventId: null,
        },
        ...current.missions,
      ],
    }));
    return id;
  }, [commit]);

  const updateMission = useCallback((missionId: string, patch: Partial<Mission>) => {
    commit((current) => withQueuedOperation({
      ...current,
      missions: current.missions.map((mission) => mission.id === missionId ? { ...mission, ...patch } : mission),
    }));
  }, [commit]);

  const startMission = useCallback((missionId: string) => {
    commit((current) => withQueuedOperation({
      ...current,
      missions: current.missions.map((mission) => mission.id === missionId ? {
        ...mission,
        status: "active",
        startedAt: mission.startedAt ?? nowIso(),
        pausedAt: null,
      } : mission),
    }));
  }, [commit]);

  const toggleMissionPause = useCallback((missionId: string) => {
    commit((current) => withQueuedOperation({
      ...current,
      missions: current.missions.map((mission) => {
        if (mission.id !== missionId || !mission.startedAt) return mission;
        if (mission.status === "active") {
          return { ...mission, status: "paused", pausedAt: nowIso() };
        }
        if (mission.status === "paused" && mission.pausedAt) {
          const pausedMilliseconds = mission.pausedMilliseconds + Math.max(0, Date.now() - Date.parse(mission.pausedAt));
          return { ...mission, status: "active", pausedAt: null, pausedMilliseconds };
        }
        return mission;
      }),
    }));
  }, [commit]);

  const logRevisionTopic = useCallback((missionId: string, topic: string, subject?: string) => {
    const trimmed = topic.trim();
    if (!trimmed) return;
    commit((current) => {
      const mission = current.missions.find((candidate) => candidate.id === missionId);
      const id = createId("srs");
      const today = toLocalDate(nowIso(), current.profile.timezone);
      return withQueuedOperation({
        ...current,
        missions: current.missions.map((candidate) => candidate.id === missionId ? { ...candidate, revisionTopicIds: [...candidate.revisionTopicIds, id] } : candidate),
        srsTopics: [
          ...current.srsTopics,
          {
            id,
            missionId,
            subject: subject?.trim() || mission?.subject || "General",
            topic: trimmed,
            stage: 0,
            dueDate: addDays(today, 1),
            completedAt: null,
            createdAt: nowIso(),
            status: "scheduled",
          },
        ],
      });
    });
  }, [commit]);

  const finishMission = useCallback((missionId: string, reflectionDraft: ReflectionDraft) => {
    const sourceMission = state.missions.find((mission) => mission.id === missionId);
    if (!sourceMission || !sourceMission.startedAt || sourceMission.status === "completed") return null;
    const endedAt = nowIso();
    const pausedMilliseconds = sourceMission.pausedMilliseconds + (sourceMission.pausedAt ? Math.max(0, Date.now() - Date.parse(sourceMission.pausedAt)) : 0);
    const completedMission: Mission = {
      ...sourceMission,
      status: "completed",
      pausedAt: null,
      pausedMilliseconds,
      endedAt,
      completedAt: endedAt,
    };
    const durationMs = getMissionInvestedMilliseconds(completedMission);
    let lootReward: Reward | null = null;

    commit((current) => {
      const completionDate = toLocalDate(endedAt, current.profile.timezone);
      const comboForAward = getCurrentCombo(current, completionDate);
      const goldMultiplier = getActiveGoldMultiplier(current, completionDate);
      const basePower = completedMission.baseXp * comboForAward.multiplier;
      const adjustedPower = basePower * goldMultiplier;
      const carryTotal = current.goldPowerCarry + adjustedPower;
      const goldAwarded = Math.floor(carryTotal / 10);
      const goldPowerCarry = carryTotal - goldAwarded * 10;
      const progressionId = createId("progress");
      const reflectionId = createId("reflection");
      const reflection: Reflection = {
        id: reflectionId,
        missionId,
        createdAt: endedAt,
        feelingBefore: reflectionDraft.feelingBefore ?? null,
        feelingAfter: reflectionDraft.feelingAfter ?? null,
        frictionName: reflectionDraft.frictionName?.trim() ?? "",
        frictionRating: reflectionDraft.frictionRating ?? null,
        provokingThought: reflectionDraft.provokingThought?.trim() ?? "",
        provokingThoughtRating: reflectionDraft.provokingThoughtRating ?? null,
        skills: reflectionDraft.skills?.filter(Boolean) ?? [],
        miniAchievement: reflectionDraft.miniAchievement?.trim() ?? "",
        miniAchievementRating: reflectionDraft.miniAchievementRating ?? null,
        customAnswers: reflectionDraft.customAnswers ?? {},
      };
      const updatedCombo = resolveCurrentComboAfterActivity(current, completionDate);
      const updatedMission = { ...completedMission, progressionEventId: progressionId };
      const progression: ProgressionEvent = {
        id: progressionId,
        missionId,
        baseXp: completedMission.baseXp,
        comboMultiplier: comboForAward.multiplier,
        goldMultiplier,
        powerAwarded: basePower,
        goldAwarded,
        occurredAt: endedAt,
        note: `Completed: ${completedMission.title}`,
      };
      const transactions = [...current.transactions];
      if (goldAwarded > 0) {
        transactions.push({
          id: createId("transaction"),
          type: "power_gold",
          goldDelta: goldAwarded,
          sourceId: progressionId,
          occurredAt: endedAt,
          effectiveOn: completionDate,
          note: `Power conversion from ${completedMission.title}`,
        });
      }
      const consumedInventory = current.inventory.map((item) => item.active && !item.consumedAt && item.effectiveOn === completionDate ? { ...item, consumedAt: endedAt, active: false } : item);
      const srsTopics = [...current.srsTopics];
      if (completedMission.revisionEnabled && completedMission.specificTopic.trim() && !completedMission.revisionTopicIds.length) {
        const topicId = createId("srs");
        srsTopics.push({
          id: topicId,
          missionId,
          subject: completedMission.subject,
          topic: completedMission.specificTopic.trim(),
          stage: 0,
          dueDate: addDays(completionDate, 1),
          completedAt: null,
          createdAt: endedAt,
          status: "scheduled",
        });
        updatedMission.revisionTopicIds = [topicId];
      }

      const eligibleLoot = current.rewards.filter((reward) => reward.active && reward.lootEnabled && reward.lootWeight > 0);
      const totalWeight = eligibleLoot.reduce((total, reward) => total + reward.lootWeight, 0);
      const lootChance = Math.min(1, Math.max(0, current.profile.lootChancePercent / 100));
      const roll = Math.random();
      let nextInventory = consumedInventory;
      if (eligibleLoot.length && roll <= lootChance) {
        let cursor = Math.random() * totalWeight;
        lootReward = eligibleLoot[eligibleLoot.length - 1];
        for (const reward of eligibleLoot) {
          cursor -= reward.lootWeight;
          if (cursor <= 0) {
            lootReward = reward;
            break;
          }
        }
        if (lootReward) {
          if (lootReward.goldMultiplier) {
            nextInventory = [
              ...nextInventory,
              {
                id: createId("inventory"),
                rewardId: lootReward.id,
                acquiredAt: endedAt,
                effectiveOn: addDays(completionDate, 1),
                consumedAt: null,
                active: true,
              },
            ];
          } else {
            transactions.push({
              id: createId("transaction"),
              type: "loot",
              goldDelta: 0,
              sourceId: lootReward.id,
              occurredAt: endedAt,
              effectiveOn: null,
              note: `Loot obtained: ${lootReward.title}`,
            });
          }
        }
      }

      return withQueuedOperation({
        ...current,
        missions: current.missions.map((mission) => mission.id === missionId ? updatedMission : mission),
        reflections: [...current.reflections, reflection],
        srsTopics,
        progression: [...current.progression, progression],
        transactions,
        inventory: nextInventory,
        combo: updatedCombo,
        goldPowerCarry,
      }, 4);
    });
    return { durationMs, lootReward };
  }, [commit, state.missions]);

  const completeRevision = useCallback((topicId: string) => {
    commit((current) => {
      const today = toLocalDate(nowIso(), current.profile.timezone);
      return withQueuedOperation({
        ...current,
        srsTopics: current.srsTopics.map((topic) => {
          if (topic.id !== topicId || topic.status === "completed") return topic;
          const nextStage = topic.stage + 1;
          if (nextStage >= 3) {
            return { ...topic, stage: nextStage, status: "completed", completedAt: nowIso() };
          }
          const intervals = [1, 7, 30];
          return {
            ...topic,
            stage: nextStage,
            dueDate: addDays(today, intervals[nextStage]),
            status: "scheduled",
            completedAt: nowIso(),
          };
        }),
      });
    });
  }, [commit]);

  const createBoss = useCallback((input: Pick<Boss, "title" | "objective" | "deadlineAt" | "rewardXp" | "rewardGold">) => {
    const id = createId("boss");
    commit((current) => withQueuedOperation({
      ...current,
      bosses: [{ id, ...input, createdAt: nowIso(), status: "active" }, ...current.bosses],
    }));
    return id;
  }, [commit]);

  const addJournal = useCallback((draft: JournalDraft) => {
    commit((current) => {
      const localDate = toLocalDate(nowIso(), current.profile.timezone);
      const existing = current.journals.find((entry) => entry.localDate === localDate);
      const entry: JournalEntry = {
        id: existing?.id ?? createId("journal"),
        localDate,
        betterThanYesterday: draft.betterThanYesterday,
        points: Math.max(0, Math.round(draft.points)),
        note: draft.note.trim(),
        createdAt: existing?.createdAt ?? nowIso(),
      };
      const contribution = entry.points * 0.05;
      const currentYear = new Date().getFullYear();
      const lifelinePoint: LifelinePoint = {
        id: `journal_${localDate}`,
        localDate,
        year: currentYear,
        lifePerformance: contribution,
        experience: 0,
        source: "journal",
        note: `Journal contribution from ${localDate}`,
      };
      return withQueuedOperation({
        ...current,
        journals: existing ? current.journals.map((candidate) => candidate.id === existing.id ? entry : candidate) : [entry, ...current.journals],
        lifeline: [...current.lifeline.filter((point) => point.id !== lifelinePoint.id), lifelinePoint],
      }, 2);
    });
  }, [commit]);

  const addLifelinePoint = useCallback((draft: { year: number; lifePerformance: number; experience: number; note: string }) => {
    commit((current) => withQueuedOperation({
      ...current,
      lifeline: [
        ...current.lifeline,
        {
          id: createId("lifeline"),
          localDate: `${Math.max(1900, Math.round(draft.year))}-01-01`,
          year: Math.max(1900, Math.round(draft.year)),
          lifePerformance: Number(draft.lifePerformance) || 0,
          experience: Number(draft.experience) || 0,
          source: "manual",
          note: draft.note.trim(),
        },
      ],
    }));
  }, [commit]);

  const createReward = useCallback((draft: RewardDraft) => {
    commit((current) => withQueuedOperation({
      ...current,
      rewards: [
        {
          id: createId("reward"),
          title: draft.title.trim(),
          description: draft.description.trim(),
          category: draft.category,
          goldCost: Math.max(0, Math.round(draft.goldCost)),
          lootEnabled: draft.lootEnabled,
          lootWeight: Math.max(0, Number(draft.lootWeight) || 0),
          goldMultiplier: draft.goldMultiplier && draft.goldMultiplier > 1 ? draft.goldMultiplier : null,
          createdAt: nowIso(),
          active: true,
        },
        ...current.rewards,
      ],
    }));
  }, [commit]);

  const purchaseReward = useCallback((rewardId: string) => {
    const reward = state.rewards.find((candidate) => candidate.id === rewardId);
    if (!reward) return { ok: false, message: "That reward is no longer available." };
    const balance = getGoldBalance(state);
    if (balance < reward.goldCost) return { ok: false, message: `You need ${reward.goldCost - balance} more gold.` };
    commit((current) => {
      const localDate = toLocalDate(nowIso(), current.profile.timezone);
      const effectiveOn = reward.goldMultiplier ? addDays(localDate, 1) : null;
      return withQueuedOperation({
        ...current,
        transactions: [
          {
            id: createId("transaction"),
            type: "purchase",
            goldDelta: -reward.goldCost,
            sourceId: rewardId,
            occurredAt: nowIso(),
            effectiveOn,
            note: `Purchased: ${reward.title}`,
          },
          ...current.transactions,
        ],
        inventory: [
          {
            id: createId("inventory"),
            rewardId,
            acquiredAt: nowIso(),
            effectiveOn,
            consumedAt: null,
            active: true,
          },
          ...current.inventory,
        ],
      }, 2);
    });
    return { ok: true, message: reward.goldMultiplier ? `Activated for ${addDays(toLocalDate(nowIso(), state.profile.timezone), 1)}.` : `${reward.title} added to inventory.` };
  }, [commit, state]);

  const updateProfile = useCallback((patch: Partial<PlayerProfile>) => {
    commit((current) => withQueuedOperation({ ...current, profile: { ...current.profile, ...patch } }));
  }, [commit]);

  const updateComboTiers = useCallback((tiers: ComboTier[]) => {
    commit((current) => {
      const packed = JSON.stringify(tiers);
      const existing = current.customQuestions.find((question) => question.id === "__combo_tiers__");
      const configQuestion: CustomQuestion = {
        id: "__combo_tiers__",
        label: "Internal combo tiers",
        type: "text",
        options: [packed],
        enabled: false,
      };
      return withQueuedOperation({
        ...current,
        customQuestions: existing ? current.customQuestions.map((question) => question.id === existing.id ? configQuestion : question) : [...current.customQuestions, configQuestion],
      });
    });
  }, [commit]);

  const setGoogleSheetConnection = useCallback((patch: Partial<GoogleSheetConnection>) => {
    commit((current) => ({
      ...current,
      googleSheet: { ...current.googleSheet, ...patch },
    }));
  }, [commit]);

  const importFromGoogleSheet = useCallback((remote: FocusState, connection: Partial<GoogleSheetConnection>) => {
    commit((current) => normalizeHydratedState({
      ...remote,
      googleSheet: {
        ...remote.googleSheet,
        ...current.googleSheet,
        ...connection,
        phase: "synced",
        pendingOperations: 0,
        lastSyncedAt: nowIso(),
        errorMessage: null,
      },
    }));
  }, [commit]);

  const markSynced = useCallback(() => {
    commit((current) => ({
      ...current,
      googleSheet: {
        ...current.googleSheet,
        phase: current.googleSheet.spreadsheetId ? "synced" : "needs_setup",
        lastSyncedAt: current.googleSheet.spreadsheetId ? nowIso() : current.googleSheet.lastSyncedAt,
        pendingOperations: 0,
        errorMessage: null,
      },
    }));
  }, [commit]);

  const addCustomQuestion = useCallback((question: Omit<CustomQuestion, "id">) => {
    commit((current) => withQueuedOperation({ ...current, customQuestions: [...current.customQuestions, { ...question, id: createId("question") }] }));
  }, [commit]);

  const updateCustomGraph = useCallback((graphId: string, patch: Partial<CustomGraph>) => {
    commit((current) => withQueuedOperation({
      ...current,
      customGraphs: current.customGraphs.map((graph) => graph.id === graphId ? { ...graph, ...patch, series: patch.series?.slice(0, 5) ?? graph.series } : graph),
    }));
  }, [commit]);

  const resetLocalData = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    dispatch({ type: "replace", state: { ...createInitialState(), hydrated: true } });
  }, []);

  const value = useMemo<FocusCommandContextValue>(() => ({
    state,
    ready: state.hydrated,
    createMission,
    updateMission,
    startMission,
    toggleMissionPause,
    finishMission,
    logRevisionTopic,
    completeRevision,
    createBoss,
    addJournal,
    addLifelinePoint,
    createReward,
    purchaseReward,
    updateProfile,
    updateComboTiers,
    setGoogleSheetConnection,
    importFromGoogleSheet,
    markSynced,
    addCustomQuestion,
    updateCustomGraph,
    resetLocalData,
  }), [
    state,
    createMission,
    updateMission,
    startMission,
    toggleMissionPause,
    finishMission,
    logRevisionTopic,
    completeRevision,
    createBoss,
    addJournal,
    addLifelinePoint,
    createReward,
    purchaseReward,
    updateProfile,
    updateComboTiers,
    setGoogleSheetConnection,
    importFromGoogleSheet,
    markSynced,
    addCustomQuestion,
    updateCustomGraph,
    resetLocalData,
  ]);

  return <FocusCommandContext.Provider value={value}>{children}</FocusCommandContext.Provider>;
}

export function useFocusCommand(): FocusCommandContextValue {
  const context = useContext(FocusCommandContext);
  if (!context) throw new Error("useFocusCommand must be used inside FocusCommandProvider");
  return context;
}

export function getDifficultyColor(difficulty: Difficulty): string {
  if (difficulty === "easy") return "#49D17D";
  if (difficulty === "medium") return "#FFAA4C";
  return "#FF6B6B";
}

export function getDifficultyLabel(difficulty: Difficulty): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

export function formatTimeUntil(iso: string | null): string {
  if (!iso) return "No deadline";
  const delta = Date.parse(iso) - Date.now();
  if (delta <= 0) return "Due";
  const hours = Math.ceil(delta / 3_600_000);
  if (hours < 24) return `${hours}h remaining`;
  return `${Math.ceil(hours / 24)}d remaining`;
}
