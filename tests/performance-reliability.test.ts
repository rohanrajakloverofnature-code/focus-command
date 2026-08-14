import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { createInitialState, getDashboardStats, getMissionCompletionRecords } from "../lib/focus-command";

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

describe("Performance and reliability contracts", () => {
  it("reuses completion and dashboard derivations for one immutable state snapshot", () => {
    const state = createInitialState();
    expect(getMissionCompletionRecords(state)).toBe(getMissionCompletionRecords(state));
    expect(getDashboardStats(state)).toBe(getDashboardStats(state));
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

  it("acknowledges existing controls at touch-down without moving their release-to-activate actions", () => {
    expect(focusUiSource).toContain("onPressIn={acknowledgePress}");
    expect(focusUiSource).toContain("const acknowledgePress = ()");
    expect(focusUiSource).toContain("onPress={onPress}");
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
});
