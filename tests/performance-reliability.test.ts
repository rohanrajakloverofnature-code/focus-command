import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { createInitialState, getDashboardStats, getMissionCompletionRecords, shallowEqual } from "../lib/focus-command";
import { getMonthlyCommandArchive } from "../lib/monthly-command-archive";

const focusCommandSource = readFileSync(resolve(process.cwd(), "lib/focus-command.tsx"), "utf8");
const launchSource = readFileSync(resolve(process.cwd(), "components/launch-animation.tsx"), "utf8");
const cinematicSource = readFileSync(resolve(process.cwd(), "components/rank-character.tsx"), "utf8");
const missionBoardSource = readFileSync(resolve(process.cwd(), "app/(tabs)/missions.tsx"), "utf8");
const mediaLifecycleSource = readFileSync(resolve(process.cwd(), "lib/media-lifecycle.ts"), "utf8");
const focusUiSource = readFileSync(resolve(process.cwd(), "components/focus-ui.tsx"), "utf8");
const tabSource = readFileSync(resolve(process.cwd(), "components/haptic-tab.tsx"), "utf8");
const tapBridgeSource = readFileSync(resolve(process.cwd(), "components/focus-tap-feedback-bridge.tsx"), "utf8");
const focusAudioSource = readFileSync(resolve(process.cwd(), "lib/focus-audio.ts"), "utf8");
const homeSource = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");
const missionSource = readFileSync(resolve(process.cwd(), "app/mission/[id].tsx"), "utf8");
const missionResultSource = readFileSync(resolve(process.cwd(), "app/mission-result/[id].tsx"), "utf8");
const settingsSource = readFileSync(resolve(process.cwd(), "app/settings.tsx"), "utf8");
const homeMotionSource = readFileSync(resolve(process.cwd(), "components/home-motion.tsx"), "utf8");
const dashboardSource = readFileSync(resolve(process.cwd(), "app/(tabs)/dashboard.tsx"), "utf8");
const analyticsSource = readFileSync(resolve(process.cwd(), "app/analytics.tsx"), "utf8");
const archiveSource = readFileSync(resolve(process.cwd(), "app/command-archive.tsx"), "utf8");
const archiveHelperSource = readFileSync(resolve(process.cwd(), "lib/monthly-command-archive.ts"), "utf8");
const rewardsSource = readFileSync(resolve(process.cwd(), "app/(tabs)/rewards.tsx"), "utf8");
const equipmentSource = readFileSync(resolve(process.cwd(), "app/(tabs)/equipment.tsx"), "utf8");
const journalSource = readFileSync(resolve(process.cwd(), "app/(tabs)/journal.tsx"), "utf8");
const themeBridgeSource = readFileSync(resolve(process.cwd(), "components/focus-theme-bridge.tsx"), "utf8");
const notificationAudioBridgeSource = readFileSync(resolve(process.cwd(), "components/focus-notification-audio-bridge.tsx"), "utf8");

describe("Performance and reliability contracts", () => {
  it("reuses completion and dashboard derivations for one immutable state snapshot", () => {
    const state = createInitialState();
    expect(getMissionCompletionRecords(state)).toBe(getMissionCompletionRecords(state));
    expect(getDashboardStats(state)).toBe(getDashboardStats(state));
    expect(getMonthlyCommandArchive(state)).toBe(getMonthlyCommandArchive(state));
  });

  it("defines one tolerant shared cleanup contract for pause, optional rewind, and native player removal", () => {
    expect(mediaLifecycleSource).toContain("export function disposeAudioPlayer");
    expect(mediaLifecycleSource).toContain("player.pause()");
    expect(mediaLifecycleSource).toContain("player.seekTo(0)");
    expect(mediaLifecycleSource).toContain("player.remove()");
    expect(mediaLifecycleSource).toContain("export function resetAudioPlayer");
  });

  it("keeps launch media visually unchanged but non-intercepting and centrally disposed", () => {
    expect(launchSource).toContain('pointerEvents="none"');
    expect(launchSource).toContain("disposeAudioPlayer");
    expect(launchSource).toContain("setTimeout");
    expect(cinematicSource).toContain("disposeAudioPlayer");
  });

  it("keeps persistence durable while coalescing ordinary writes and exposing opt-in narrow state subscriptions", () => {
    expect(focusCommandSource).toContain("PERSISTENCE_DEBOUNCE_MS = 250");
    expect(focusCommandSource).toContain("appState.addEventListener");
    expect(focusCommandSource).toContain("flushPendingPersistence");
    expect(focusCommandSource).toContain("useFocusCommandSelector");
    expect(focusCommandSource).toContain("useFocusCommandActions");
  });

  it("keeps shallow selector records stable for unrelated state changes and replaces them only when a subscribed reference changes", () => {
    const missions = [] as unknown[];
    const transactions = [] as unknown[];
    const profile = { name: "Commander" };
    expect(shallowEqual({ missions, transactions, profile }, { missions, transactions, profile })).toBe(true);
    expect(shallowEqual({ missions, transactions, profile }, { missions: [], transactions, profile })).toBe(false);
    expect(focusCommandSource).toContain("if (selection.current && isEqual(selection.current.value, next)) return selection.current.value;");
    expect(focusCommandSource).toContain("export function shallowEqual");
  });

  it("keeps the remaining mounted bridge and tab screens on exact selectors without changing wallet or completion calculations", () => {
    for (const source of [rewardsSource, equipmentSource, journalSource, themeBridgeSource, notificationAudioBridgeSource]) {
      expect(source).toContain("useFocusCommandSelector");
      expect(source).not.toMatch(/useFocusCommand\(\)/);
    }
    expect(rewardsSource).toContain("getGoldBalance({ transactions })");
    expect(rewardsSource).toContain("getLifetimeGold({ transactions })");
    expect(rewardsSource).toContain("useFocusCommandActions");
    expect(missionBoardSource).toContain("getMissionCompletionRecords(completionState)");
    expect(missionBoardSource).toContain("missionCompletions: state.missionCompletions");
    expect(missionBoardSource).toContain("useFocusCommandActions");
  });

  it("limits only idle custom-audio players, preserving an active cue and existing explicit release behavior", () => {
    expect(focusAudioSource).toContain("const MAX_IDLE_CUSTOM_PLAYERS = 4;");
    expect(focusAudioSource).toContain("return !entry.player.playing;");
    expect(focusAudioSource).toContain("while (idleEntries().length > MAX_IDLE_CUSTOM_PLAYERS)");
    expect(focusAudioSource).toContain("const oldest = idleEntries().find(([uri]) => uri !== protectedUri);");
    expect(focusAudioSource).toContain("entry.player.release();");
    expect(focusAudioSource).toContain("export function releaseFocusCustomSound(uri: string)");
  });

  it("keeps the compact Home portrait clean while retaining its aura, frame, image, and isolated non-compact growth layers", () => {
    const compactVisual = cinematicSource.slice(
      cinematicSource.indexOf("const characterVisual = ("),
      cinematicSource.indexOf("return (", cinematicSource.indexOf("const characterVisual = (")),
    );

    expect(compactVisual).toContain("styles.aura");
    expect(compactVisual).toContain("styles.portraitFrame");
    expect(compactVisual).toContain("source={profile.portrait}");
    expect(compactVisual).toContain("!compact ? <CharacterGrowthLayers");
    for (const faceCoveringLayer of ["coreLight", "visor", "leftPauldron", "rightWeapon", "accessoryNode", "orbitLine", "sovereignCrown"]) {
      expect(compactVisual).not.toContain(`styles.${faceCoveringLayer}`);
    }
    expect(cinematicSource).toContain("styles.cinematicPortrait");
    expect(cinematicSource).toContain("styles.cinematicRibbon");
  });

  it("uses a virtualized Mission Board with stable item keys while retaining memoized existing cards", () => {
    expect(missionBoardSource).toContain("<FlatList");
    expect(missionBoardSource).toContain("keyExtractor={(item) => item.key}");
    expect(missionBoardSource).toContain("const CompletionHistoryCard = memo");
    expect(missionBoardSource).toContain("const MissionCard = memo");
  });

  it("keeps the native pressed visual immediate but defers costly acknowledgement until a confirmed completed tap", () => {
    expect(focusUiSource).not.toContain("onPressIn={acknowledgePress}");
    expect(focusUiSource).toContain("const acknowledgeCompletedPress = ()");
    expect(focusUiSource).toContain("const handlePress = () => {");
    expect(focusUiSource).toContain("onPress();\n    acknowledgeCompletedPress();");
    expect(focusUiSource).toContain("pressed ? 0.82 : 1");
    expect(focusUiSource).toContain("useInteractionFeedback");
    expect(tabSource).toContain("useFocusCommandSelector(selectTabFeedback");
  });

  it("uses a one-frame shared single-fire guard without delaying intended later actions or press feedback", () => {
    expect(focusUiSource).toContain('import { useRef, type ReactNode } from "react"');
    expect(focusUiSource).toContain("const singleFireRef = useRef(false);");
    expect(focusUiSource).toContain("if (singleFireRef.current) return;");
    expect(focusUiSource).toContain("singleFireRef.current = true;");
    expect(focusUiSource).toContain("requestAnimationFrame(() => { singleFireRef.current = false; });");
    expect(focusUiSource).not.toContain("singleFireRef.current = false;\n    setTimeout");
  });

  it("starts TapFeedback's visual acknowledgement on press-in while preserving semantic action and avoiding audio or haptic work on an aborted touch", () => {
    const tapFeedbackSource = focusUiSource.slice(
      focusUiSource.indexOf("export function TapFeedback"),
      focusUiSource.indexOf("export function SectionHeader"),
    );

    expect(tapFeedbackSource).toContain("const acknowledgePressIn = () => {");
    expect(tapFeedbackSource).toContain("scale.value = withTiming(0.972, { duration: 45 })");
    expect(tapFeedbackSource).toContain("onPressIn={acknowledgePressIn}");
    expect(tapFeedbackSource).toContain("onPressOut={restorePressScale}");
    expect(tapFeedbackSource).toContain("onPress={onPress}");
    expect(tapFeedbackSource).not.toContain("playFocusTap");
    expect(tapFeedbackSource).not.toContain("Haptics.");
  });

  it("prepares optional tap feedback only after launch is inactive and never plays sound during preparation", () => {
    expect(tapBridgeSource).toContain("subscribeLaunchSequenceActivity");
    expect(tapBridgeSource).toContain("isLaunchSequenceActive()");
    expect(tapBridgeSource).toContain("Platform.OS === \"web\"");
    expect(tapBridgeSource).toContain("prepareFocusTapFeedback");
    expect(focusAudioSource).toContain("export async function prepareFocusTapFeedback");
    expect(focusAudioSource).toContain("getBundledPlayer(cueByRoleAndStyle.tap[resolved.style])");
  });

  it("keeps Home equipment updates, durable render dependencies, and the live mission on narrow selectors", () => {
    expect(homeSource).toContain("selectEquippedCharacterGear");
    expect(homeSource).toContain("useFocusCommandSelector(selectEquippedCharacterGear");
    expect(homeSource).toContain("selectHomeDependencies");
    expect(homeSource).toContain("useFocusCommandSelector(selectHomeDependencies, hasSameHomeDependencies)");
    expect(homeSource).toContain("const bossProgressById = useMemo(");
    expect(missionSource).toContain("useFocusCommandSelector((state) => selectMissionDetailSnapshot(state, id)");
    expect(missionResultSource).toContain("useFocusCommandSelector((state) => selectMissionResultSnapshot(state, id, completionId), hasSameMissionResultSnapshot)");
  });

  it("provides custom questions to Home's first-render combo and Daily Command Briefing path", () => {
    expect(homeSource).toContain('  | "customQuestions"');
    expect(homeSource).toContain("customQuestions: state.customQuestions");
    expect(homeSource).toContain("left.customQuestions === right.customQuestions");
    expect(homeSource).toContain("dailyCommandBriefing: getDailyCommandBriefing(state)");
    expect(homeSource).toContain("combo: getCurrentCombo(state)");
    expect(homeSource).toContain("    state.customQuestions,");
  });

  it("keeps dense Settings rendering on exact state slices while explicit backup and sync work reads the current snapshot only on demand", () => {
    expect(settingsSource).toContain("const profile = useFocusCommandSelector((snapshot) => snapshot.profile)");
    expect(settingsSource).toContain("const googleSheet = useFocusCommandSelector((snapshot) => snapshot.googleSheet)");
    expect(settingsSource).toContain("const customQuestions = useFocusCommandSelector((snapshot) => snapshot.customQuestions)");
    expect(settingsSource).toContain("getCurrentState");
    expect(settingsSource).not.toContain("useFocusCommand()" );
  });

  it("isolates the existing non-interactive Home ambient scene from unrelated parent renders without changing its animation contract", () => {
    expect(homeMotionSource).toContain("memo(function HomeAmbientScene");
    expect(homeMotionSource).toContain("withRepeat(withTiming(1, { duration: 4_800 })");
    expect(homeMotionSource).toContain('pointerEvents="none"');
  });

  it("keeps Dashboard and Analytics behind exact source-slice render boundaries while retaining existing derivations", () => {
    expect(dashboardSource).toContain("useFocusCommandSelector");
    expect(dashboardSource).toContain("selectDashboardDependencies");
    expect(dashboardSource).toContain("useFocusCommandSelector(selectDashboardDependencies, hasSameDashboardDependencies)");
    expect(dashboardSource).not.toContain("getCurrentState");
    expect(dashboardSource).toContain("getDashboardStats(state)");
    expect(dashboardSource).toContain("getWeeklyAfterActionReview(state)");
    expect(analyticsSource).toContain("type AnalyticsDependencies = Pick<FocusState");
    expect(analyticsSource).toContain("useFocusCommandSelector(selectAnalyticsDependencies, hasSameAnalyticsDependencies)");
    expect(analyticsSource).toContain("return {\n    profile: state.profile,");
  });

  it("keeps the lifetime archive derived, virtualized, and scoped to its durable source records", () => {
    expect(archiveHelperSource).toContain("const archiveCache = new WeakMap<FocusState, MonthlyCommandArchive>()");
    expect(archiveHelperSource).toContain("no archive data, rollover marker, or placeholder is stored");
    expect(archiveSource).toContain("useFocusCommandSelector((state) => ({");
    expect(archiveSource).toContain("<FlatList");
    expect(archiveSource).toContain("getMonthlyCommandArchive(state)");
  });

  it("bounds continuous lifetime rendering and defers yearly or monthly topic work until explicitly opened", () => {
    expect(archiveHelperSource).toContain("export function getMonthlyArchiveLifetimeWindows");
    expect(archiveHelperSource).toContain("const safeWindowSize = Math.max(6, Math.floor(monthsPerWindow))");
    expect(archiveSource).toContain("lifetimeWindowIndex");
    expect(archiveSource).toContain("topicPeriod");
    expect(archiveSource).toContain("ArchiveTopicListView");
    expect(missionBoardSource).toContain("archiveHistoryLabel");
    expect(missionBoardSource).toContain("archiveMonthKey");
  });
});
