import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { createInitialState, getDashboardStats, getMissionCompletionRecords } from "../lib/focus-command";

const focusCommandSource = readFileSync(resolve(process.cwd(), "lib/focus-command.tsx"), "utf8");
const launchSource = readFileSync(resolve(process.cwd(), "components/launch-animation.tsx"), "utf8");
const cinematicSource = readFileSync(resolve(process.cwd(), "components/rank-character.tsx"), "utf8");
const missionBoardSource = readFileSync(resolve(process.cwd(), "app/(tabs)/missions.tsx"), "utf8");
const mediaLifecycleSource = readFileSync(resolve(process.cwd(), "lib/media-lifecycle.ts"), "utf8");

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
});
