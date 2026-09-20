import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const chartSource = readFileSync(resolve(process.cwd(), "components/focus-charts.tsx"), "utf8");
const mapSource = readFileSync(resolve(process.cwd(), "components/india-subject-map.tsx"), "utf8");
const appConfigSource = readFileSync(resolve(process.cwd(), "app.config.ts"), "utf8");
const rootSource = readFileSync(resolve(process.cwd(), "app/_layout.tsx"), "utf8");
const themeProviderSource = readFileSync(resolve(process.cwd(), "lib/theme-provider.tsx"), "utf8");
const keyboardHookSource = readFileSync(resolve(process.cwd(), "hooks/use-keyboard-safe-focus.ts"), "utf8");
const missionSource = readFileSync(resolve(process.cwd(), "app/mission/[id].tsx"), "utf8");
const recoverySource = readFileSync(resolve(process.cwd(), "app/recovery-rhythm.tsx"), "utf8");
const dashboardSource = readFileSync(resolve(process.cwd(), "app/super-dashboard.tsx"), "utf8");
const dashboardTabSource = readFileSync(resolve(process.cwd(), "app/(tabs)/dashboard.tsx"), "utf8");
const focusCommandSource = readFileSync(resolve(process.cwd(), "lib/focus-command.tsx"), "utf8");

describe("first-touch, keyboard, and recovery-save contracts", () => {
  it("uses full plot press targets instead of tiny SVG-only press handlers", () => {
    expect(chartSource).toContain("function nearestIndexFromX");
    expect(chartSource).toContain('accessibilityLabel={`Select data point in ${accessibilityLabel}`}');
    expect(chartSource).toContain('accessibilityLabel={`Select bar in ${accessibilityLabel}`}');
    expect(chartSource).toContain('accessibilityLabel={`Select segment in ${accessibilityLabel}`}');
    expect(chartSource).toContain('accessibilityLabel={`Select metric in ${accessibilityLabel}`}');
    expect(chartSource).toContain('accessibilityLabel={`Select line in ${accessibilityLabel}`}');
    expect(chartSource).toContain('pointerEvents="none"');
    expect(chartSource).not.toContain("<Rect key={`${point.label}-${index}`} onPress=");
    expect(chartSource).not.toContain("<Path key={`${point.label}-${index}`} onPress=");
    const interactiveCard = dashboardTabSource.slice(dashboardTabSource.indexOf("function InteractiveChartCard"), dashboardTabSource.indexOf("function NoData"));
    expect(interactiveCard).toContain('accessibilityLabel={`Open ${title} details`}');
    expect(interactiveCard).not.toContain("<TapFeedback onPress={onPress} accessibilityLabel={`Open ${title}`}>");
  });

  it("uses enlarged territory hit geometry before the visible India-map paint", () => {
    expect(mapSource).toContain('fill="#00000001" stroke="#00000001" strokeWidth={14}');
    expect(mapSource).toContain("<G key={subject} onPress={interactive ? () => onSelect?.(subject) : undefined}>");
    expect(mapSource).toContain("A full subject label has no readable placement in this small territory.");
    expect(mapSource).toContain("compact-label-${subject}");
    expect(mapSource).toContain("const percentage = `${Math.round(capture * 100)}%`;");
    expect(mapSource).toContain('fill="#08101DD9"');
    expect(mapSource).toContain("SELECTED TERRITORY");
    expect(mapSource).not.toContain("compactSubject");
    expect(mapSource).not.toContain('stroke="#08101D"');
  });

  it("resizes native windows and provides both global and exact-field keyboard protection", () => {
    expect(appConfigSource).toContain('softwareKeyboardLayoutMode: "resize"');
    expect(rootSource).toContain("<KeyboardAvoidingView");
    expect(rootSource).toContain('behavior={Platform.OS === "ios" ? "padding" : "height"}');
    expect(keyboardHookSource).toContain("scrollResponderScrollNativeHandleToKeyboard");
    expect(keyboardHookSource).toContain("requestAnimationFrame");
    expect(missionSource).toContain("useKeyboardSafeFocus<ScrollView>()");
    expect(missionSource).toContain("onFocus={onInputFocus}");
    expect(recoverySource).toContain("useKeyboardSafeFocus<FlatList<RecoveryListRecord>>()");
    expect(recoverySource).toContain("keyboardShouldPersistTaps=\"handled\"");
    expect(themeProviderSource).toContain("backgroundColor: palette.background");
    expect(themeProviderSource).toContain("SystemUI.setBackgroundColorAsync(palette.background)");
    expect(themeProviderSource).toContain("NavigationBar.setBackgroundColorAsync(palette.background)");
    expect(appConfigSource).toContain("androidNavigationBar:");
  });

  it("acknowledges accepted recovery saves immediately while retaining single-frame duplicate protection", () => {
    expect(recoverySource).toContain("const canSave = () => {");
    expect(recoverySource).toContain("requestAnimationFrame(() => { saveLockRef.current = false; });");
    expect(recoverySource).toContain('acknowledgeSave("stress")');
    expect(recoverySource).toContain('acknowledgeSave("sleep")');
    expect(recoverySource).toContain('acknowledgeSave("screen")');
    expect(recoverySource).toContain("Sleep saved ✓");
    expect(recoverySource).toContain("Screen time saved ✓");
    expect(recoverySource).toContain("accessibilityLiveRegion=\"polite\"");
    expect(focusCommandSource).toContain("const resolved = resolveSleepDraft(draft, toLocalDate(timestamp, stateRef.current.profile.timezone));");
    expect(focusCommandSource).toContain("return id;");
    expect(focusCommandSource).not.toContain("let saved = false;");
  });

  it("edits the same stressor with its full private draft and retains the optional control note", () => {
    expect(recoverySource).toContain("const [stressorEditId, setStressorEditId]");
    expect(recoverySource).toContain("const editStressor =");
    expect(recoverySource).toContain("Edit stressor");
    expect(recoverySource).toContain("Save stress changes");
    expect(recoverySource).toContain("WHAT CAN I CONTROL? · OPTIONAL");
    expect(recoverySource).toContain("WHAT CAN I INFLUENCE? · OPTIONAL");
    expect(recoverySource).toContain("WHAT CANNOT I CONTROL TODAY? · OPTIONAL");
    expect(recoverySource).toContain("My control note:");
    expect(focusCommandSource).toContain("controlNote: normalizeRecoveryText(draft.controlNote, 500)");
    expect(focusCommandSource).toContain("controlNote: normalizeRecoveryText(entry.controlNote, 500)");
    expect(focusCommandSource).toContain("controlNote: patch.controlNote === undefined ? existing.controlNote");
  });

  it("keeps the current range layout while ensuring labels fit and metric grids remain complete", () => {
    expect(dashboardSource).toContain("adjustsFontSizeToFit");
    expect(dashboardSource).toContain("minimumFontScale={0.72}");
    expect(dashboardSource).toContain('label="Focus days"');
    expect(dashboardSource).toContain('label="Rested feeling"');
    expect(dashboardSource).toContain('flexBasis: "48.5%"');
  });
});
