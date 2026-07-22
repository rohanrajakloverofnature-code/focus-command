import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";

export type Difficulty = "easy" | "medium" | "hard";
export type MissionStatus = "planned" | "active" | "paused" | "completed";
export type MissionFrequency = "once" | "daily";
export type Feeling = "charged" | "steady" | "restless" | "drained" | "great";
export type RewardCategory = "life" | "gear" | "power" | "multiplier";
export type SyncPhase = "local" | "ready" | "authorized" | "syncing" | "synced" | "needs_setup" | "error";
export type PaletteToken = "primary" | "background" | "surface" | "foreground" | "muted" | "border" | "success" | "warning" | "error";
export type EmotionalChartId = "energy_shift" | "focus_friction" | "stress_clarity" | "motivation_distraction";
export type SoundRoleId = "missionWin" | "tap" | "notification" | "extended";
export type SoundStyle = "crisp" | "soft" | "ceremonial";
export type ForecastOutlook = "momentum" | "steady" | "recovery" | "fragile" | "warming_up";

export interface SoundRoleSettings {
  enabled: boolean;
  style: SoundStyle;
  customUri: string | null;
  customName: string | null;
}

export interface EmotionalChartConfig {
  id: EmotionalChartId;
  title: string;
  enabled: boolean;
  color: string;
}

export interface EmotionalPatternForecast {
  available: boolean;
  outlook: ForecastOutlook;
  score: number;
  confidence: "early" | "emerging" | "grounded";
  sampleSize: number;
  headline: string;
  detail: string;
  signals: Array<{ label: string; value: number; direction: "up" | "down" | "flat" }>;
}

export type WellbeingSignalRole = "supportive" | "load";
export type WellbeingTrendDirection = "rising" | "easing" | "steady";

export interface WellbeingInsight {
  available: boolean;
  sampleSize: number;
  confidence: "early" | "emerging" | "grounded";
  balanceScore: number;
  headline: string;
  summary: string;
  method: string;
  disclaimer: string;
  trend: { direction: WellbeingTrendDirection; change: number; summary: string; recentWindow: number; earlierWindow: number };
  signals: Array<{ id: string; label: string; role: WellbeingSignalRole; average: number; observations: number; trend: WellbeingTrendDirection; detail: string }>;
  records: Array<{ id: string; localDate: string; missionTitle: string; subject: string; feelingAfter: Feeling | null; focus: number | null; stress: number | null; motivation: number | null; energy: number | null; clarity: number | null; distraction: number | null; friction: number | null }>;
}

export type DashboardMetricId =
  | "power"
  | "xp"
  | "time"
  | "gold"
  | "missions"
  | "focus"
  | "stress"
  | "clarity"
  | "motivation"
  | "distraction"
  | "energy"
  | "friction"
  | "achievement"
  | "skills"
  | "feeling"
  | "journal";
export type DashboardChartType = "line" | "bar" | "donut" | "radar" | "number";
export type DashboardDateRange = "7d" | "30d" | "90d" | "custom" | "all";
export type DashboardFeatureFilter = "all" | "missions" | "reflections" | "journal" | "revisions" | "rewards";
export type DashboardMissionFrequencyFilter = "all" | MissionFrequency;

/** A user-owned widget in the separate Custom Analytics workspace. */
export interface DashboardWidgetConfig {
  id: string;
  title: string;
  metric: DashboardMetricId;
  chartType: DashboardChartType;
  dateRange: DashboardDateRange;
  feature: DashboardFeatureFilter;
  subject: string;
  category: string;
  missionFrequency: DashboardMissionFrequencyFilter;
  customStartDate: string;
  customEndDate: string;
}

export interface NotificationRules {
  dailyMissionEnabled: boolean;
  dailyMissionTime: string;
  revisionEnabled: boolean;
  revisionTime: string;
  multiplierEnabled: boolean;
  achievementEnabled: boolean;
}

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
  soundRoles: Record<SoundRoleId, SoundRoleSettings>;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  theme: "system" | "dark" | "light";
  palette: Partial<Record<PaletteToken, string>>;
  notificationRules: NotificationRules;
  emotionalCharts: EmotionalChartConfig[];
  forecastEnabled: boolean;
  forecastShowSignals: boolean;
  dashboardWidgets: DashboardWidgetConfig[];
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
  frequency: MissionFrequency;
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
  energyBefore?: number | null;
  energyAfter?: number | null;
  focusQuality?: number | null;
  stressLevel?: number | null;
  clarityLevel?: number | null;
  motivationLevel?: number | null;
  distractionLevel?: number | null;
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
  levelBefore?: number;
  levelAfter?: number;
  titleBefore?: string;
  titleAfter?: string;
  comboBefore?: number;
  comboAfter?: number;
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
  frequency: MissionFrequency;
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
  energyBefore?: number | null;
  energyAfter?: number | null;
  focusQuality?: number | null;
  stressLevel?: number | null;
  clarityLevel?: number | null;
  motivationLevel?: number | null;
  distractionLevel?: number | null;
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

export function nowIso(): string {
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

export function getLevelPowerThreshold(level: number, basePower: number): number {
  const completedLevels = Math.max(0, Math.floor(level) - 1);
  const growthMultiplier = 1 + completedLevels * 0.015;
  return Math.round(Math.max(1, basePower) * completedLevels * growthMultiplier);
}

function defaultDashboardWidgets(): DashboardWidgetConfig[] {
  return [
    {
      id: "workspace_power",
      title: "Power cadence",
      metric: "power",
      chartType: "line",
      dateRange: "30d",
      feature: "missions",
      subject: "all",
      category: "all",
      missionFrequency: "all",
      customStartDate: "",
      customEndDate: "",
    },
    {
      id: "workspace_focus",
      title: "Focus signal",
      metric: "focus",
      chartType: "bar",
      dateRange: "30d",
      feature: "reflections",
      subject: "all",
      category: "all",
      missionFrequency: "all",
      customStartDate: "",
      customEndDate: "",
    },
  ];
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
    soundRoles: {
      missionWin: { enabled: true, style: "ceremonial", customUri: null, customName: null },
      tap: { enabled: true, style: "crisp", customUri: null, customName: null },
      notification: { enabled: true, style: "soft", customUri: null, customName: null },
      extended: { enabled: true, style: "soft", customUri: null, customName: null },
    },
    hapticsEnabled: true,
    notificationsEnabled: true,
    reduceMotion: false,
    highContrast: false,
    theme: "dark",
    palette: {},
    notificationRules: {
      dailyMissionEnabled: false,
      dailyMissionTime: "09:00",
      revisionEnabled: true,
      revisionTime: "09:00",
      multiplierEnabled: true,
      achievementEnabled: true,
    },
    emotionalCharts: [
      { id: "energy_shift", title: "Energy shift", enabled: true, color: "#F4C95D" },
      { id: "focus_friction", title: "Focus vs friction", enabled: true, color: "#A78BFA" },
      { id: "stress_clarity", title: "Stress & clarity", enabled: true, color: "#C092FF" },
      { id: "motivation_distraction", title: "Motivation & distraction", enabled: true, color: "#49D17D" },
    ],
    forecastEnabled: true,
    forecastShowSignals: true,
    dashboardWidgets: defaultDashboardWidgets(),
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

export function calculateAdjustedPower(baseXp: number, comboMultiplier = 1, goldMultiplier = 1): number {
  const rawXp = Math.max(0, Number(baseXp) || 0);
  const combo = Math.max(1, Number(comboMultiplier) || 1);
  const gold = Math.max(1, Number(goldMultiplier) || 1);
  return Math.round(rawXp * combo * gold * 10_000) / 10_000;
}

/** Uses the multiplier snapshot recorded when this XP award was earned. */
export function getProgressionPower(event: Pick<ProgressionEvent, "baseXp" | "comboMultiplier" | "goldMultiplier">): number {
  return calculateAdjustedPower(event.baseXp, event.comboMultiplier, event.goldMultiplier);
}

export function getTotalPower(state: FocusState): number {
  return state.progression.reduce((total, event) => total + getProgressionPower(event), 0);
}

/** Total XP is intentionally raw experience only; no combo or gold multiplier is included. */
export function getTotalXp(state: FocusState): number {
  return state.progression.reduce((total, event) => total + Math.max(0, event.baseXp), 0);
}

export function getGoldBalance(state: FocusState): number {
  return state.transactions.reduce((total, entry) => total + entry.goldDelta, 0);
}

export function getLifetimeGold(state: FocusState): number {
  return state.transactions.filter((entry) => entry.goldDelta > 0).reduce((total, entry) => total + entry.goldDelta, 0);
}

export function getLevelInfo(state: FocusState) {
  const totalPower = getTotalPower(state);
  const maxLevel = Math.max(1, state.profile.maxLevel);
  const basePower = Math.max(1, state.profile.powerPerLevel);
  let level = 1;
  while (level < maxLevel && totalPower >= getLevelPowerThreshold(level + 1, basePower)) level += 1;
  const levelStart = getLevelPowerThreshold(level, basePower);
  const nextThreshold = level >= maxLevel ? levelStart : getLevelPowerThreshold(level + 1, basePower);
  const levelSpan = Math.max(1, nextThreshold - levelStart);
  return {
    level,
    currentLevelPower: Math.max(0, totalPower - levelStart),
    powerForNextLevel: Math.max(0, nextThreshold - totalPower),
    currentThreshold: levelStart,
    nextThreshold,
    progress: level >= maxLevel ? 1 : Math.min(1, Math.max(0, (totalPower - levelStart) / levelSpan)),
  };
}

export function getCurrentTitle(state: FocusState): { title: string; index: number; progress: number } {
  const levelInfo = getLevelInfo(state);
  const interval = Math.max(1, state.profile.titleChangeInterval);
  const titleIndex = Math.min(state.profile.titles.length - 1, Math.max(0, Math.floor((levelInfo.level - 1) / interval)));
  const titleStartLevel = titleIndex * interval + 1;
  const titleEndLevel = titleStartLevel + interval;
  const titleStartPower = getLevelPowerThreshold(titleStartLevel, state.profile.powerPerLevel);
  const titleEndPower = getLevelPowerThreshold(titleEndLevel, state.profile.powerPerLevel);
  const totalPower = getTotalPower(state);
  const progress = titleIndex >= state.profile.titles.length - 1 ? 1 : Math.min(1, Math.max(0, (totalPower - titleStartPower) / Math.max(1, titleEndPower - titleStartPower)));
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

export function getTodayRawXp(state: FocusState, referenceIso = nowIso()): number {
  const today = toLocalDate(referenceIso, state.profile.timezone);
  return state.progression
    .filter((event) => toLocalDate(event.occurredAt, state.profile.timezone) === today)
    .reduce((total, event) => total + Math.max(0, event.baseXp), 0);
}

/**
 * Today's displayed XP is the sum of today's raw XP awards after each award's
 * own combo and gold-multiplier snapshot is applied. This prevents a later
 * combo change or an expired gold cache from re-multiplying earlier awards.
 */
export function getTodayXp(state: FocusState, referenceIso = nowIso()): number {
  const today = toLocalDate(referenceIso, state.profile.timezone);
  return state.progression
    .filter((event) => toLocalDate(event.occurredAt, state.profile.timezone) === today)
    .reduce((total, event) => total + getProgressionPower(event), 0);
}

export interface CalendarTimeAverages {
  today: string;
  weekStart: string;
  monthStart: string;
  weekElapsedDays: number;
  monthElapsedDays: number;
  weekTotalHours: number;
  monthTotalHours: number;
  weekDailyAverageHours: number;
  monthDailyAverageHours: number;
}

/**
 * Returns week-to-date and month-to-date daily averages. Both denominator windows
 * include the current local calendar day, even when no mission has been completed
 * today, so a zero-work day naturally affects the displayed average.
 */
export function getCalendarTimeAverages(state: FocusState, referenceIso = nowIso()): CalendarTimeAverages {
  const today = toLocalDate(referenceIso, state.profile.timezone);
  const [year, month, day] = today.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const daysSinceMonday = (weekday + 6) % 7;
  const weekStart = addDays(today, -daysSinceMonday);
  const monthStart = `${today.slice(0, 8)}01`;
  const weekElapsedDays = differenceInDays(weekStart, today) + 1;
  const monthElapsedDays = day;
  let weekTotalHours = 0;
  let monthTotalHours = 0;

  state.missions.filter((mission) => mission.completedAt).forEach((mission) => {
    const completedDate = toLocalDate(mission.completedAt!, state.profile.timezone);
    const hours = getMissionInvestedMilliseconds(mission) / 3_600_000;
    if (completedDate >= weekStart && completedDate <= today) weekTotalHours += hours;
    if (completedDate >= monthStart && completedDate <= today) monthTotalHours += hours;
  });

  return {
    today,
    weekStart,
    monthStart,
    weekElapsedDays,
    monthElapsedDays,
    weekTotalHours,
    monthTotalHours,
    weekDailyAverageHours: weekElapsedDays ? weekTotalHours / weekElapsedDays : 0,
    monthDailyAverageHours: monthElapsedDays ? monthTotalHours / monthElapsedDays : 0,
  };
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

export function getSubjectCapture(state: FocusState): Array<{ subject: string; capture: number; completed: number; total: number; active: number; planned: number }> {
  const bySubject = new Map<string, { missions: Mission[]; reviews: SrsTopic[] }>();
  state.missions.forEach((mission) => {
    const subject = mission.subject.trim() || "General";
    const current = bySubject.get(subject) ?? { missions: [], reviews: [] };
    current.missions.push(mission);
    bySubject.set(subject, current);
  });
  state.srsTopics.forEach((topic) => {
    const subject = topic.subject.trim() || "General";
    const current = bySubject.get(subject) ?? { missions: [], reviews: [] };
    current.reviews.push(topic);
    bySubject.set(subject, current);
  });
  return Array.from(bySubject.entries()).map(([subject, data]) => {
    const completedMissions = data.missions.filter((mission) => mission.status === "completed").length;
    const completedReviews = data.reviews.filter((topic) => topic.status === "completed").length;
    const total = data.missions.length + data.reviews.length;
    const completed = completedMissions + completedReviews;
    const active = data.missions.filter((mission) => mission.status === "active" || mission.status === "paused").length;
    const planned = data.missions.filter((mission) => mission.status === "planned").length;
    return { subject, completed, total, active, planned, capture: total ? completed / total : 0 };
  }).sort((left, right) => right.capture - left.capture || right.total - left.total);
}

export function getEmotionalPatternForecast(state: FocusState): EmotionalPatternForecast {
  const recent = state.reflections.slice(-14);
  if (!recent.length) {
    return {
      available: false,
      outlook: "warming_up",
      score: 0,
      confidence: "early",
      sampleSize: 0,
      headline: "Forecast begins after your first debrief",
      detail: "Complete a mission reflection with energy, focus, stress, clarity, motivation, and distraction signals. This free on-device model will then summarize your own recent pattern; it is not a medical assessment.",
      signals: [],
    };
  }

  const average = (key: keyof Pick<Reflection, "energyAfter" | "focusQuality" | "stressLevel" | "clarityLevel" | "motivationLevel" | "distractionLevel" | "frictionRating">) => {
    const values = recent.map((reflection) => Number(reflection[key] ?? 0)).filter((value) => value > 0);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  };
  const energy = average("energyAfter");
  const focus = average("focusQuality");
  const clarity = average("clarityLevel");
  const motivation = average("motivationLevel");
  const stress = average("stressLevel");
  const distraction = average("distractionLevel");
  const friction = average("frictionRating");
  const raw = energy * 0.18 + focus * 0.24 + clarity * 0.2 + motivation * 0.18 - stress * 0.09 - distraction * 0.07 - friction * 0.04;
  const score = Math.max(0, Math.min(100, Math.round((raw / 4.0) * 100)));
  const recentHalf = recent.slice(Math.max(0, recent.length - Math.ceil(recent.length / 2)));
  const earlierHalf = recent.slice(0, Math.max(1, recent.length - recentHalf.length));
  const trendAverage = (items: Reflection[]) => items.length ? items.reduce((sum, reflection) => sum + (reflection.focusQuality ?? 0) + (reflection.motivationLevel ?? 0) - (reflection.stressLevel ?? 0), 0) / items.length : 0;
  const trendDelta = trendAverage(recentHalf) - trendAverage(earlierHalf);
  const outlook: ForecastOutlook = score >= 74 ? "momentum" : score >= 54 ? "steady" : score >= 38 ? "recovery" : score > 0 ? "fragile" : "warming_up";
  const confidence = recent.length >= 8 ? "grounded" : recent.length >= 4 ? "emerging" : "early";
  const direction = (value: number): "up" | "down" | "flat" => value > 3 ? "up" : value < -3 ? "down" : "flat";
  const headline = outlook === "momentum" ? "Momentum forecast: protect your next focus block" : outlook === "steady" ? "Steady forecast: a consistent next session is likely" : outlook === "recovery" ? "Recovery forecast: choose a smaller, clearer next task" : outlook === "fragile" ? "Fragile forecast: reduce friction before your next session" : "Pattern forecast is warming up";
  const detail = `Free on-device estimate from ${recent.length} recent reflection${recent.length === 1 ? "" : "s"}. Focus and motivation are weighted against stress, distraction, and friction. ${trendDelta > 3 ? "Your recent trend is improving." : trendDelta < -3 ? "Your recent trend is easing; plan a gentler block." : "Your recent pattern is relatively stable."} This is reflective feedback, not a diagnosis.`;
  return {
    available: true,
    outlook,
    score,
    confidence,
    sampleSize: recent.length,
    headline,
    detail,
    signals: [
      { label: "Focus", value: Math.round(focus * 20), direction: direction(trendDelta) },
      { label: "Motivation", value: Math.round(motivation * 20), direction: direction(trendDelta) },
      { label: "Clarity", value: Math.round(clarity * 20), direction: direction(trendDelta) },
      { label: "Stress load", value: Math.round(stress * 20), direction: stress > 3 ? "down" : "up" },
      { label: "Distraction", value: Math.round(distraction * 20), direction: distraction > 3 ? "down" : "up" },
    ],
  };
}

export function getWellbeingInsight(state: FocusState): WellbeingInsight {
  const recent = state.reflections.slice(-12);
  const missionById = new Map(state.missions.map((mission) => [mission.id, mission]));
  const metricDefinitions: Array<{ id: string; label: string; role: WellbeingSignalRole; key: keyof Pick<Reflection, "energyAfter" | "focusQuality" | "stressLevel" | "clarityLevel" | "motivationLevel" | "distractionLevel" | "frictionRating">; detail: string }> = [
    { id: "focus", label: "Focus quality", role: "supportive", key: "focusQuality", detail: "How well you reported staying with the task." },
    { id: "motivation", label: "Motivation", role: "supportive", key: "motivationLevel", detail: "Your stated willingness to begin or continue." },
    { id: "clarity", label: "Clarity", role: "supportive", key: "clarityLevel", detail: "How clear the next thought or action felt." },
    { id: "energy", label: "Energy after work", role: "supportive", key: "energyAfter", detail: "Your self-reported energy after the session." },
    { id: "stress", label: "Stress load", role: "load", key: "stressLevel", detail: "Your self-reported stress during the reflection." },
    { id: "distraction", label: "Distraction load", role: "load", key: "distractionLevel", detail: "How much attention was pulled away from the task." },
    { id: "friction", label: "Task friction", role: "load", key: "frictionRating", detail: "How much resistance you reported before or during the work." },
  ];
  const valueFor = (reflection: Reflection, key: WellbeingInsight["signals"][number]["id"]) => {
    const definition = metricDefinitions.find((item) => item.id === key);
    return definition ? Number(reflection[definition.key] ?? 0) : 0;
  };
  const average = (items: Reflection[], key: WellbeingInsight["signals"][number]["id"]) => {
    const values = items.map((reflection) => valueFor(reflection, key)).filter((value) => value > 0);
    return { value: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0, observations: values.length };
  };
  const balanceFor = (items: Reflection[]) => {
    const supportive = metricDefinitions.filter((item) => item.role === "supportive").map((item) => average(items, item.id)).filter((item) => item.observations);
    const load = metricDefinitions.filter((item) => item.role === "load").map((item) => average(items, item.id)).filter((item) => item.observations);
    const supportiveAverage = supportive.length ? supportive.reduce((sum, item) => sum + item.value, 0) / supportive.length : 0;
    const loadAverage = load.length ? load.reduce((sum, item) => sum + item.value, 0) / load.length : 0;
    return { supportiveAverage, loadAverage, score: supportive.length || load.length ? Math.max(0, Math.min(100, Math.round(((supportiveAverage - loadAverage + 5) / 10) * 100))) : 0 };
  };

  const blankTrend = { direction: "steady" as const, change: 0, summary: "Add more complete debriefs to compare reflection windows.", recentWindow: 0, earlierWindow: 0 };
  const recordedSignalCount = metricDefinitions.reduce((count, definition) => count + recent.filter((reflection) => Number(reflection[definition.key] ?? 0) > 0).length, 0);
  if (!recent.length || !recordedSignalCount) {
    return {
      available: false,
      sampleSize: recent.length,
      confidence: "early",
      balanceScore: 0,
      headline: recent.length ? "Wellbeing insight needs optional ratings" : "Wellbeing insight begins with your first debrief",
      summary: recent.length ? "Your recent debriefs do not yet include the optional emotional or behavioral ratings used by this view. Complete only the ratings you are comfortable logging; nothing is inferred." : "Complete a mission reflection with the optional emotional and behavioral ratings to see a private, transparent overview of your own reported patterns.",
      method: "No data is inferred. This view uses only ratings you explicitly log after missions.",
      disclaimer: "This is a non-clinical reflection aid, not a medical or mental-health assessment. If you feel distressed, unsafe, or persistently unwell, contact a qualified healthcare professional or local support service.",
      trend: blankTrend,
      signals: [],
      records: [],
    };
  }

  const splitAt = Math.max(1, Math.floor(recent.length / 2));
  const earlier = recent.slice(0, splitAt);
  const recentHalf = recent.slice(splitAt);
  const balance = balanceFor(recent);
  const earlierBalance = balanceFor(earlier);
  const recentBalance = balanceFor(recentHalf);
  const change = recentBalance.score - earlierBalance.score;
  const direction: WellbeingTrendDirection = change > 8 ? "rising" : change < -8 ? "easing" : "steady";
  const trend = {
    direction,
    change,
    recentWindow: recentHalf.length,
    earlierWindow: earlier.length,
    summary: direction === "rising" ? "Your most recent reflection window has a higher supportive-to-load balance than the earlier window." : direction === "easing" ? "Your most recent reflection window has a lower supportive-to-load balance than the earlier window." : "Your two most recent reflection windows are broadly similar.",
  };
  const signals = metricDefinitions.map((definition) => {
    const current = average(recent, definition.id);
    const earlierValue = average(earlier, definition.id).value;
    const recentValue = average(recentHalf, definition.id).value;
    const delta = recentValue - earlierValue;
    const signalTrend: WellbeingTrendDirection = delta > 0.35 ? "rising" : delta < -0.35 ? "easing" : "steady";
    return { ...definition, average: Math.round(current.value * 10) / 10, observations: current.observations, trend: signalTrend };
  });
  const records = [...recent].reverse().map((reflection) => {
    const mission = missionById.get(reflection.missionId);
    return {
      id: reflection.id,
      localDate: toLocalDate(reflection.createdAt, state.profile.timezone),
      missionTitle: mission?.title || "Unlinked reflection",
      subject: mission?.subject || "Reflection",
      feelingAfter: reflection.feelingAfter,
      focus: reflection.focusQuality ?? null,
      stress: reflection.stressLevel ?? null,
      motivation: reflection.motivationLevel ?? null,
      energy: reflection.energyAfter ?? null,
      clarity: reflection.clarityLevel ?? null,
      distraction: reflection.distractionLevel ?? null,
      friction: reflection.frictionRating ?? null,
    };
  });
  const headline = balance.score >= 68 ? "Your recent reflections contain more supportive than load signals" : balance.score >= 45 ? "Your recent reflection balance looks mixed" : "Your recent reflections contain more load than supportive signals";
  const summary = `Across ${recent.length} recent debrief${recent.length === 1 ? "" : "s"}, your reported supportive signals average ${balance.supportiveAverage.toFixed(1)}/5 and your reported load signals average ${balance.loadAverage.toFixed(1)}/5. This is a summary of what you logged, not a diagnosis or prediction.`;
  return {
    available: true,
    sampleSize: recent.length,
    confidence: recent.length >= 8 ? "grounded" : recent.length >= 4 ? "emerging" : "early",
    balanceScore: balance.score,
    headline,
    summary,
    method: "Balance signal = the simple average of reported focus, motivation, clarity, and energy after work, compared with the simple average of reported stress, distraction, and task friction. Missing ratings are excluded rather than estimated.",
    disclaimer: "This is a non-clinical reflection aid, not a medical or mental-health assessment. It cannot diagnose a condition or determine what you should do. If you feel distressed, unsafe, or persistently unwell, contact a qualified healthcare professional or local support service.",
    trend,
    signals,
    records,
  };
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
  dayMarker: string;
  createMission: (draft: MissionDraft) => string;
  updateMission: (missionId: string, patch: Partial<Mission>) => void;
  removeMission: (missionId: string) => void;
  startMission: (missionId: string) => void;
  toggleMissionPause: (missionId: string) => void;
  finishMission: (missionId: string, reflection: ReflectionDraft) => { durationMs: number; lootReward: Reward | null } | null;
  logRevisionTopic: (missionId: string, topic: string, subject?: string) => void;
  completeRevision: (topicId: string) => void;
  createBoss: (input: Pick<Boss, "title" | "objective" | "deadlineAt" | "rewardXp" | "rewardGold">) => string;
  updateBoss: (bossId: string, patch: Partial<Pick<Boss, "title" | "objective" | "deadlineAt" | "rewardXp" | "rewardGold" | "status">>) => void;
  removeBoss: (bossId: string) => void;
  addJournal: (draft: JournalDraft) => void;
  addLifelinePoint: (draft: { year: number; lifePerformance: number; experience: number; note: string }) => void;
  removeLifelinePoint: (pointId: string) => void;
  createReward: (draft: RewardDraft) => void;
  updateReward: (rewardId: string, patch: Partial<Omit<Reward, "id" | "createdAt">>) => void;
  removeReward: (rewardId: string) => void;
  purchaseReward: (rewardId: string) => { ok: boolean; message: string };
  updateProfile: (patch: Partial<PlayerProfile>) => void;
  updateComboTiers: (tiers: ComboTier[]) => void;
  setGoogleSheetConnection: (patch: Partial<GoogleSheetConnection>) => void;
  importFromGoogleSheet: (remote: FocusState, connection: Partial<GoogleSheetConnection>) => void;
  markSynced: () => void;
  addCustomQuestion: (question: Omit<CustomQuestion, "id">) => void;
  updateCustomQuestion: (questionId: string, patch: Partial<Omit<CustomQuestion, "id">>) => void;
  removeCustomQuestion: (questionId: string) => void;
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
    profile: {
      ...defaults.profile,
      ...(input.profile ?? {}),
      palette: { ...defaults.profile.palette, ...(input.profile?.palette ?? {}) },
      notificationRules: { ...defaults.profile.notificationRules, ...(input.profile?.notificationRules ?? {}) },
      soundRoles: {
        missionWin: { ...defaults.profile.soundRoles.missionWin, ...(input.profile?.soundRoles?.missionWin ?? {}) },
        tap: { ...defaults.profile.soundRoles.tap, ...(input.profile?.soundRoles?.tap ?? {}) },
        notification: { ...defaults.profile.soundRoles.notification, ...(input.profile?.soundRoles?.notification ?? {}) },
        extended: { ...defaults.profile.soundRoles.extended, ...(input.profile?.soundRoles?.extended ?? {}) },
      },
      emotionalCharts: input.profile?.emotionalCharts?.length ? input.profile.emotionalCharts : defaults.profile.emotionalCharts,
    },
    combo: { ...defaults.combo, ...(input.combo ?? {}) },
    missions: (input.missions ?? []).map((mission) => ({ ...mission, frequency: mission.frequency ?? "once" })),
    googleSheet: { ...defaults.googleSheet, ...(input.googleSheet ?? {}) },
    rewards: input.rewards?.length ? input.rewards : defaults.rewards,
    customGraphs: input.customGraphs?.length ? input.customGraphs : defaults.customGraphs,
  };
}

export function FocusCommandProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [localDay, setLocalDay] = useState(() => toLocalDate(nowIso()));

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

  useEffect(() => {
    const refreshLocalDay = () => {
      const nextDay = toLocalDate(nowIso(), state.profile.timezone);
      setLocalDay((currentDay) => currentDay === nextDay ? currentDay : nextDay);
    };
    refreshLocalDay();
    const interval = setInterval(refreshLocalDay, 15_000);
    return () => clearInterval(interval);
  }, [state.profile.timezone]);

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
          frequency: draft.frequency,
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

  const removeMission = useCallback((missionId: string) => {
    commit((current) => {
      const mission = current.missions.find((candidate) => candidate.id === missionId);
      if (!mission) return current;
      const progressionIds = current.progression.filter((event) => event.missionId === missionId).map((event) => event.id);
      return withQueuedOperation({
        ...current,
        missions: current.missions.filter((candidate) => candidate.id !== missionId),
        reflections: current.reflections.filter((reflection) => reflection.missionId !== missionId),
        srsTopics: current.srsTopics.filter((topic) => topic.missionId !== missionId),
        progression: current.progression.filter((event) => event.missionId !== missionId),
        transactions: current.transactions.filter((transaction) => !progressionIds.includes(transaction.sourceId ?? "")),
      });
    });
  }, [commit]);

  const startMission = useCallback((missionId: string) => {
    commit((current) => {
      const today = toLocalDate(nowIso(), current.profile.timezone);
      return withQueuedOperation({
        ...current,
        missions: current.missions.map((mission) => {
          const scheduledForFutureDay = mission.frequency === "daily" && mission.dueAt && toLocalDate(mission.dueAt, current.profile.timezone) > today;
          if (mission.id !== missionId || scheduledForFutureDay) return mission;
          return { ...mission, status: "active", startedAt: mission.startedAt ?? nowIso(), pausedAt: null };
        }),
      });
    });
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
      const adjustedPower = calculateAdjustedPower(completedMission.baseXp, comboForAward.multiplier, goldMultiplier);
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
        energyBefore: reflectionDraft.energyBefore ?? null,
        energyAfter: reflectionDraft.energyAfter ?? null,
        focusQuality: reflectionDraft.focusQuality ?? null,
        stressLevel: reflectionDraft.stressLevel ?? null,
        clarityLevel: reflectionDraft.clarityLevel ?? null,
        motivationLevel: reflectionDraft.motivationLevel ?? null,
        distractionLevel: reflectionDraft.distractionLevel ?? null,
      };
      const levelBefore = getLevelInfo(current);
      const titleBefore = getCurrentTitle(current);
      const comboBefore = getCurrentCombo(current, completionDate);
      const updatedCombo = resolveCurrentComboAfterActivity(current, completionDate);
      const updatedMission = { ...completedMission, progressionEventId: progressionId };
      const provisionalProgression: ProgressionEvent = {
        id: progressionId,
        missionId,
        baseXp: completedMission.baseXp,
        comboMultiplier: comboForAward.multiplier,
        goldMultiplier,
        powerAwarded: adjustedPower,
        goldAwarded,
        occurredAt: endedAt,
        note: `Completed: ${completedMission.title}`,
      };
      const milestoneState = { ...current, progression: [...current.progression, provisionalProgression], combo: updatedCombo };
      const levelAfter = getLevelInfo(milestoneState);
      const titleAfter = getCurrentTitle(milestoneState);
      const progression: ProgressionEvent = {
        ...provisionalProgression,
        levelBefore: levelBefore.level,
        levelAfter: levelAfter.level,
        titleBefore: titleBefore.title,
        titleAfter: titleAfter.title,
        comboBefore: comboBefore.multiplier,
        comboAfter: getCurrentCombo(milestoneState, completionDate).multiplier,
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

      const nextDailyMission = completedMission.frequency === "daily" ? {
        ...completedMission,
        id: createId("mission"),
        status: "planned" as MissionStatus,
        createdAt: endedAt,
        dueAt: `${addDays(completionDate, 1)}T00:00:00`,
        startedAt: null,
        pausedAt: null,
        pausedMilliseconds: 0,
        endedAt: null,
        completedAt: null,
        revisionTopicIds: [],
        progressionEventId: null,
      } : null;
      return withQueuedOperation({
        ...current,
        missions: [
          ...(nextDailyMission ? [nextDailyMission] : []),
          ...current.missions.map((mission) => mission.id === missionId ? updatedMission : mission),
        ],
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

  const updateBoss = useCallback((bossId: string, patch: Partial<Pick<Boss, "title" | "objective" | "deadlineAt" | "rewardXp" | "rewardGold" | "status">>) => {
    commit((current) => withQueuedOperation({
      ...current,
      bosses: current.bosses.map((boss) => boss.id === bossId ? { ...boss, ...patch } : boss),
    }));
  }, [commit]);

  const removeBoss = useCallback((bossId: string) => {
    commit((current) => withQueuedOperation({
      ...current,
      bosses: current.bosses.filter((boss) => boss.id !== bossId),
      missions: current.missions.map((mission) => mission.bossId === bossId ? { ...mission, bossId: null } : mission),
    }));
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

  const removeLifelinePoint = useCallback((pointId: string) => {
    commit((current) => {
      const target = current.lifeline.find((point) => point.id === pointId);
      if (!target || target.source !== "manual") return current;
      return withQueuedOperation({ ...current, lifeline: current.lifeline.filter((point) => point.id !== pointId) });
    });
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

  const updateReward = useCallback((rewardId: string, patch: Partial<Omit<Reward, "id" | "createdAt">>) => {
    commit((current) => withQueuedOperation({
      ...current,
      rewards: current.rewards.map((reward) => reward.id === rewardId ? {
        ...reward,
        ...patch,
        title: patch.title === undefined ? reward.title : patch.title.trim(),
        description: patch.description === undefined ? reward.description : patch.description.trim(),
        goldCost: patch.goldCost === undefined ? reward.goldCost : Math.max(0, Math.round(patch.goldCost)),
        lootWeight: patch.lootWeight === undefined ? reward.lootWeight : Math.max(0, Number(patch.lootWeight) || 0),
        goldMultiplier: patch.goldMultiplier === undefined ? reward.goldMultiplier : patch.goldMultiplier && patch.goldMultiplier > 1 ? patch.goldMultiplier : null,
      } : reward),
    }));
  }, [commit]);

  const removeReward = useCallback((rewardId: string) => {
    commit((current) => {
      const reward = current.rewards.find((candidate) => candidate.id === rewardId);
      if (!reward) return current;
      const hasInventoryHistory = current.inventory.some((item) => item.rewardId === rewardId);
      if (hasInventoryHistory) {
        return withQueuedOperation({
          ...current,
          rewards: current.rewards.map((candidate) => candidate.id === rewardId ? { ...candidate, active: false, lootEnabled: false } : candidate),
        });
      }
      return withQueuedOperation({ ...current, rewards: current.rewards.filter((candidate) => candidate.id !== rewardId) });
    });
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

  const updateCustomQuestion = useCallback((questionId: string, patch: Partial<Omit<CustomQuestion, "id">>) => {
    commit((current) => withQueuedOperation({
      ...current,
      customQuestions: current.customQuestions.map((question) => question.id === questionId ? { ...question, ...patch } : question),
    }));
  }, [commit]);

  const removeCustomQuestion = useCallback((questionId: string) => {
    commit((current) => withQueuedOperation({
      ...current,
      customQuestions: current.customQuestions.filter((question) => question.id !== questionId),
    }));
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
    dayMarker: localDay,
    createMission,
    updateMission,
    removeMission,
    startMission,
    toggleMissionPause,
    finishMission,
    logRevisionTopic,
    completeRevision,
    createBoss,
    updateBoss,
    removeBoss,
    addJournal,
    addLifelinePoint,
    removeLifelinePoint,
    createReward,
    updateReward,
    removeReward,
    purchaseReward,
    updateProfile,
    updateComboTiers,
    setGoogleSheetConnection,
    importFromGoogleSheet,
    markSynced,
    addCustomQuestion,
    updateCustomQuestion,
    removeCustomQuestion,
    updateCustomGraph,
    resetLocalData,
  }), [
    state,
    localDay,
    createMission,
    updateMission,
    removeMission,
    startMission,
    toggleMissionPause,
    finishMission,
    logRevisionTopic,
    completeRevision,
    createBoss,
    updateBoss,
    removeBoss,
    addJournal,
    addLifelinePoint,
    removeLifelinePoint,
    createReward,
    updateReward,
    removeReward,
    purchaseReward,
    updateProfile,
    updateComboTiers,
    setGoogleSheetConnection,
    importFromGoogleSheet,
    markSynced,
    addCustomQuestion,
    updateCustomQuestion,
    removeCustomQuestion,
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
