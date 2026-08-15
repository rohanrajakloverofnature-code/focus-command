import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { createInitialState, getDashboardStats, getMissionCompletionRecords } from "../lib/focus-command";
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
const settingsSource = readFileSync(resolve(process.cwd(), "app/settings.tsx"), "utf8");
const homeMotionSource = readFileSync(resolve(process.cwd(), "components/home-motion.tsx"), "utf8");
const dashboardSource = readFileSync(resolve(process.cwd(), "app/(tabs)/dashboard.tsx"), "utf8");
const archiveSource = readFileSync(resolve(process.cwd(), "app/command-archive.tsx"), "utf8");
const archiveHelperSource = readFileSync(resolve(process.cwd(), "lib/monthly-command-archive.ts"), "utf8");

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

  it("prepares optional tap feedback only after launch is inactive and never plays sound during preparation", () => {
    expect(tapBridgeSource).toContain("subscribeLaunchSequenceActivity");
    expect(tapBridgeSource).toContain("isLaunchSequenceActive()");
    expect(tapBridgeSource).toContain("Platform.OS === \"web\"");
    expect(tapBridgeSource).toContain("prepareFocusTapFeedback");
    expect(focusAudioSource).toContain("export async function prepareFocusTapFeedback");
    expect(focusAudioSource).toContain("getBundledPlayer(cueByRoleAndStyle.tap[resolved.style])");
  });

  it("keeps Home equipment updates scoped and the live mission on its existing narrow selector", () => {
    expect(homeSource).toContain("selectEquippedCharacterGear");
    expect(homeSource).toContain("useFocusCommandSelector(selectEquippedCharacterGear");
    expect(missionSource).toContain("useFocusCommandSelector((state) => selectMissionDetailSnapshot(state, id)");
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

  it("keeps Dashboard analytics behind an exact render-dependency boundary while retaining its existing derivations", () => {
    expect(dashboardSource).toContain("useFocusCommandSelector");
    expect(dashboardSource).toContain("useFocusCommandSelector((state) => ({");
    expect(dashboardSource).toContain("const state = getCurrentState();");
    expect(dashboardSource).toContain("getDashboardStats(state)");
    expect(dashboardSource).toContain("getWeeklyAfterActionReview(state)");
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
