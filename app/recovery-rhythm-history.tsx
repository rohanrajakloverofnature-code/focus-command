import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { CommandCard, IconAction, LoadingScreen, ScreenTitle, StatusPill } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useKeyboardSafeFocus } from "@/hooks/use-keyboard-safe-focus";
import { getCorePrinciplesCheckInsInRange, getCorePrinciplesSummary, type CorePrinciplesRange } from "@/lib/core-principles";
import { getMissionCompletionRecordsInLocalDateRange, shallowEqual, useFocusCommandReady, useFocusCommandSelector } from "@/lib/focus-command";
import { formatMinutes, getRecoverySummary, type RecoveryRangeKind } from "@/lib/recovery-rhythm";

const rangeOptions: { kind: RecoveryRangeKind; label: string }[] = [{ kind: "week", label: "WEEK" }, { kind: "month", label: "MONTH" }, { kind: "lifetime", label: "LIFETIME" }, { kind: "custom", label: "CUSTOM" }];

export default function RecoveryRhythmHistoryScreen() {
  const colors = useColors();
  const { scrollRef, onInputFocus, onScroll } = useKeyboardSafeFocus();
  const ready = useFocusCommandReady();
  const data = useFocusCommandSelector((state) => ({
    profile: state.profile, recoveryStressors: state.recoveryStressors ?? [], recoveryActions: state.recoveryActions ?? [], sleepLogs: state.sleepLogs ?? [], napLogs: state.napLogs ?? [], screenLogs: state.screenTimeLogs ?? [], coreChecks: state.corePrincipleDailyCheckIns, missions: state.missions, missionCompletions: state.missionCompletions, progression: state.progression, reflections: state.reflections,
  }), shallowEqual);
  const [kind, setKind] = useState<RecoveryRangeKind>("week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const summary = useMemo(() => getRecoverySummary({ profile: data.profile, recoveryStressors: data.recoveryStressors, recoveryActions: data.recoveryActions, sleepLogs: data.sleepLogs, napLogs: data.napLogs, screenTimeLogs: data.screenLogs }, kind, customStart, customEnd), [data, kind, customStart, customEnd]);
  const balance = useMemo(() => {
    const range = summary.range;
    const coreRange: CorePrinciplesRange = kind === "custom" ? { kind: "custom", startDate: range.startDate, endDate: range.endDate } : { kind };
    const success = getCorePrinciplesSummary(getCorePrinciplesCheckInsInRange(data.coreChecks, coreRange, data.profile.timezone));
    const completions = getMissionCompletionRecordsInLocalDateRange({ missions: data.missions, missionCompletions: data.missionCompletions, progression: data.progression, reflections: data.reflections, profile: data.profile }, range.startDate, range.endDate);
    const power = completions.reduce((sum, completion) => sum + Math.max(0, completion.progression?.powerAwarded ?? completion.baseXp), 0);
    return { success, missionCount: completions.length, power };
  }, [data, kind, summary.range]);

  if (!ready) return <LoadingScreen label="Preparing your private Recovery history…" />;
  const customValid = kind !== "custom" || (/^\d{4}-\d{2}-\d{2}$/.test(customStart) && /^\d{4}-\d{2}-\d{2}$/.test(customEnd) && customStart <= customEnd);
  return <ScreenContainer className="px-4" containerClassName="bg-background" edges={["top", "bottom", "left", "right"]}><ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={32} keyboardDismissMode="none" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <ScreenTitle eyebrow="Private · Read-only overview" title="Command Balance" detail="Your recorded stress, sleep, screen time, Success Ratio, and Mission Power in one selected period." right={<IconAction icon="chevron.right" label="Return to Recovery & Rhythm" onPress={() => router.back()} />} />
    <View style={styles.rangeRow}>{rangeOptions.map((option) => <Pressable key={option.kind} onPress={() => setKind(option.kind)} style={[styles.rangeChip, { borderColor: kind === option.kind ? colors.primary : colors.border, backgroundColor: kind === option.kind ? `${colors.primary}18` : colors.surface }]}><Text style={[styles.rangeText, { color: kind === option.kind ? colors.primary : colors.muted }]}>{option.label}</Text></Pressable>)}</View>
    {kind === "custom" ? <View style={styles.customRow}><TextInput onFocus={onInputFocus} value={customStart} onChangeText={setCustomStart} placeholder="Start YYYY-MM-DD" placeholderTextColor={colors.muted} style={[styles.dateInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.foreground }]} /><TextInput onFocus={onInputFocus} value={customEnd} onChangeText={setCustomEnd} placeholder="End YYYY-MM-DD" placeholderTextColor={colors.muted} style={[styles.dateInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.foreground }]} /></View> : null}
    {!customValid ? <CommandCard accent={colors.warning}><Text style={[styles.emptyText, { color: colors.warning }]}>Enter an inclusive custom start and end date.</Text></CommandCard> : <>
      <CommandCard accent={colors.primary} style={styles.periodCard}><Text style={[styles.eyebrow, { color: colors.primary }]}>{summary.range.startDate} → {summary.range.endDate}</Text><Text style={[styles.periodTitle, { color: colors.foreground }]}>Recorded Command Balance</Text><Text style={[styles.periodDetail, { color: colors.muted }]}>No record is treated as a zero or failure. Every figure below uses only the selected period’s stored entries.</Text></CommandCard>
      <View style={styles.grid}><MetricCard accent={colors.success} label="SUCCESS RATIO" value={balance.success.successRatio === null ? "—" : `${Math.round(balance.success.successRatio * 100)}%`} detail={`${balance.success.recordedDays} recorded day${balance.success.recordedDays === 1 ? "" : "s"}`} /><MetricCard accent={colors.primary} label="MISSION POWER" value={String(Math.round(balance.power))} detail={`${balance.missionCount} completed mission${balance.missionCount === 1 ? "" : "s"}`} /><MetricCard accent={colors.warning} label="AVG STRESS" value={summary.averageStress === null ? "—" : `${summary.averageStress}/10`} detail={`${summary.recordedDays.stress} logged day${summary.recordedDays.stress === 1 ? "" : "s"}`} /><MetricCard accent={colors.success} label="AVG SLEEP" value={formatMinutes(summary.averageSleepMinutes)} detail={summary.averageSleepQuality === null ? `${summary.recordedDays.sleep} logged night${summary.recordedDays.sleep === 1 ? "" : "s"}` : `quality ${summary.averageSleepQuality}/5`} /><MetricCard accent={colors.primary} label="SLEEP SCORE" value={summary.averageSleepScore === null ? "—" : `${summary.averageSleepScore}/100`} detail={`${summary.scoredSleepCount} scored night${summary.scoredSleepCount === 1 ? "" : "s"}; personal index`} /><MetricCard accent={colors.primary} label="AVG SCREEN" value={formatMinutes(summary.averageScreenMinutes)} detail={summary.commonScreenLabel ? `most logged: ${summary.commonScreenLabel}` : `${summary.recordedDays.screen} logged day${summary.recordedDays.screen === 1 ? "" : "s"}`} /><MetricCard accent={colors.primary} label="RECOVERY ACTIONS" value={String(summary.actions.length)} detail={summary.afterActionChange === null ? "before/after optional" : `avg reported easing ${summary.afterActionChange}/10`} /></View>
      <CommandCard accent={colors.warning} style={styles.insightCard}><Text style={[styles.insightTitle, { color: colors.foreground }]}>Neutral recovery note</Text><Text style={[styles.insightText, { color: colors.muted }]}>{summary.actions.length ? `You recorded ${summary.actions.length} action${summary.actions.length === 1 ? "" : "s"} in this period. Before/after ratings are personal observations, not proof that one action caused a change.` : "Add an optional response after a stressor to build a private record of what felt useful to you."}</Text><Text style={[styles.insightText, { color: colors.muted }]}>Sleep Score basis: duration uses the 7-hour adult reference, continuity uses recorded awakenings, and quality/restedness use your 1–5 reports. Dreams remain context only. This is evidence-informed and not clinically validated.</Text>{summary.totalNapMinutes ? <StatusPill label={`NAPS · ${formatMinutes(summary.totalNapMinutes)}`} tone="primary" icon="timer" /> : null}</CommandCard>
    </>}
  </ScrollView></ScreenContainer>;
}

function MetricCard({ accent, label, value, detail }: { accent: string; label: string; value: string; detail: string }) { const colors = useColors(); return <CommandCard accent={accent} style={styles.metricCard}><Text style={[styles.metricLabel, { color: colors.muted }]}>{label}</Text><Text style={[styles.metricValue, { color: accent }]}>{value}</Text><Text style={[styles.metricDetail, { color: colors.muted }]}>{detail}</Text></CommandCard>; }

const styles = StyleSheet.create({ content: { gap: 13, paddingTop: 12, paddingBottom: 32 }, rangeRow: { flexDirection: "row", gap: 6 }, rangeChip: { flex: 1, minHeight: 36, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderRadius: 10 }, rangeText: { fontSize: 9, fontWeight: "900" }, customRow: { flexDirection: "row", gap: 8 }, dateInput: { flex: 1, minHeight: 42, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, fontSize: 11, fontWeight: "700" }, periodCard: { gap: 5 }, eyebrow: { fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }, periodTitle: { fontSize: 18, fontWeight: "900" }, periodDetail: { fontSize: 11, lineHeight: 16, fontWeight: "600" }, grid: { flexDirection: "row", gap: 8, flexWrap: "wrap" }, metricCard: { width: "48.5%", minHeight: 112, gap: 4 }, metricLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 0.6 }, metricValue: { fontSize: 19, lineHeight: 24, fontWeight: "900" }, metricDetail: { fontSize: 10, lineHeight: 14, fontWeight: "600" }, insightCard: { gap: 7 }, insightTitle: { fontSize: 14, fontWeight: "900" }, insightText: { fontSize: 11, lineHeight: 16, fontWeight: "600" }, emptyText: { fontSize: 12, fontWeight: "800" } });
