import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { LineTrendChart, type ChartPoint } from "@/components/focus-charts";
import { CommandCard, LoadingScreen, MetricTile, ScreenTitle, SectionHeader, StatusPill } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getCorePrinciplesCheckInsInRange, getCorePrinciplesDailyTrend, getCorePrinciplesListInsights, getCorePrinciplesSummary, getMostUncheckedCorePrinciples, type CorePrinciplesRange } from "@/lib/core-principles";
import { shallowEqual, type CorePrincipleDailyCheckIn, type FocusState, useFocusCommandReady, useFocusCommandSelector } from "@/lib/focus-command";

const RANGE_OPTIONS: Array<{ kind: CorePrinciplesRange["kind"]; label: string }> = [
  { kind: "week", label: "Week" }, { kind: "month", label: "Month" }, { kind: "lifetime", label: "Lifetime" }, { kind: "custom", label: "Custom" },
];
const selectCorePrinciplesHistory = (state: FocusState) => ({ title: state.corePrinciplesTitle, checkIns: state.corePrincipleDailyCheckIns, timezone: state.profile.timezone });

function downsample(points: ChartPoint[], maxPoints = 240) {
  if (points.length <= maxPoints) return points;
  return Array.from({ length: maxPoints }, (_, index) => points[Math.round((index / (maxPoints - 1)) * (points.length - 1))]);
}

export default function CorePrinciplesHistoryScreen() {
  const colors = useColors();
  const ready = useFocusCommandReady();
  const { title, checkIns, timezone } = useFocusCommandSelector(selectCorePrinciplesHistory, shallowEqual);
  const [rangeKind, setRangeKind] = useState<CorePrinciplesRange["kind"]>("week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const range = useMemo<CorePrinciplesRange>(() => rangeKind === "custom" ? { kind: "custom", startDate: customStart.trim(), endDate: customEnd.trim() } : { kind: rangeKind }, [customEnd, customStart, rangeKind]);
  const selectedCheckIns = useMemo(() => getCorePrinciplesCheckInsInRange(checkIns, range, timezone), [checkIns, range, timezone]);
  const summary = useMemo(() => getCorePrinciplesSummary(selectedCheckIns), [selectedCheckIns]);
  const trend = useMemo(() => getCorePrinciplesDailyTrend(selectedCheckIns), [selectedCheckIns]);
  const chartPoints = useMemo(() => downsample(trend.map((point, index) => ({ label: index === 0 || index === trend.length - 1 || index === Math.floor(trend.length / 2) ? point.localDate.slice(5) : "", value: point.ratio }))), [trend]);
  const mostUnchecked = useMemo(() => getMostUncheckedCorePrinciples(selectedCheckIns), [selectedCheckIns]);
  const listInsights = useMemo(() => getCorePrinciplesListInsights(selectedCheckIns).slice(0, 6), [selectedCheckIns]);
  const rows = useMemo(() => selectedCheckIns.slice().reverse(), [selectedCheckIns]);

  if (!ready) return <LoadingScreen label="Opening Success Ratio history…" />;
  const ratio = summary.successRatio === null ? null : Math.round(summary.successRatio * 100);
  const header = <>
    <ScreenTitle eyebrow="PRIVATE DAILY RECORD" title={`${title} history`} detail="Success Ratio uses only days you actually checked in. No check-in is never treated as a failed day." right={<Pressable onPress={() => router.back()}><Text style={[styles.close, { color: colors.primary }]}>Close</Text></Pressable>} />
    <View style={styles.metrics}><MetricTile label="Success ratio" value={ratio === null ? "—" : `${ratio}%`} detail={summary.applicable ? `${summary.checked}/${summary.applicable} checked` : "No recorded days"} icon="checklist" accent={colors.success} /><MetricTile label="Recorded days" value={`${summary.recordedDays}`} detail="Days with a real check-in" icon="chart.xyaxis.line" accent="#A78BFA" /></View>
    <CommandCard accent={colors.success} style={styles.filters}><Text style={[styles.filterLabel, { color: colors.success }]}>VIEW SUCCESS RATIO</Text><View style={styles.chips}>{RANGE_OPTIONS.map((option) => { const active = rangeKind === option.kind; return <Pressable key={option.kind} onPress={() => setRangeKind(option.kind)} accessibilityRole="button" accessibilityState={{ selected: active }} style={({ pressed }) => [styles.chip, { borderColor: active ? colors.success : colors.border, backgroundColor: active ? `${colors.success}1A` : colors.background, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.chipText, { color: active ? colors.success : colors.foreground }]}>{option.label}</Text></Pressable>; })}</View>{rangeKind === "custom" ? <View style={styles.dateRow}><TextInput value={customStart} onChangeText={setCustomStart} placeholder="Start YYYY-MM-DD" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} style={[styles.dateInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><TextInput value={customEnd} onChangeText={setCustomEnd} placeholder="End YYYY-MM-DD" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} style={[styles.dateInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /></View> : null}</CommandCard>
    <SectionHeader title="Daily success ratio" />
    <CommandCard accent={colors.success}>{trend.length ? <LineTrendChart points={chartPoints} color={colors.success} accessibilityLabel="Core Principles daily Success Ratio graph" /> : <Text style={[styles.emptyChart, { color: colors.muted }]}>No check-ins in this view yet.</Text>}</CommandCard>
    <SectionHeader title="Needs attention" />
    <CommandCard accent="#FFAA4C" style={styles.insightCard}>{mostUnchecked.length ? mostUnchecked.map((item) => <View key={item.itemId} style={styles.insightRow}><View style={styles.insightCopy}><Text style={[styles.insightTitle, { color: colors.foreground }]} numberOfLines={2}>{item.itemText}</Text><Text style={[styles.insightDetail, { color: colors.muted }]}>{item.listTitle} · unchecked on {item.uncheckedDays} recorded day{item.uncheckedDays === 1 ? "" : "s"}</Text></View><StatusPill label={`${item.uncheckedDays}`} tone="warning" /></View>) : <Text style={[styles.emptyChart, { color: colors.muted }]}>No unchecked principle is recorded in this view.</Text>}</CommandCard>
    <SectionHeader title="List insight" />
    <CommandCard accent="#A78BFA" style={styles.insightCard}>{listInsights.length ? listInsights.map((item) => <View key={item.listId} style={styles.insightRow}><Text style={[styles.insightTitle, { color: colors.foreground }]}>{item.listTitle}</Text><Text style={[styles.listPercent, { color: colors.success }]}>{Math.round(item.successRatio * 100)}%</Text></View>) : <Text style={[styles.emptyChart, { color: colors.muted }]}>Create daily check-ins to see list-level insight.</Text>}</CommandCard>
    <SectionHeader title="Recorded days" />
  </>;

  return <ScreenContainer className="px-4" containerClassName="bg-background"><FlatList data={rows} keyExtractor={(item) => item.localDate} contentContainerStyle={styles.content} ListHeaderComponent={header} ListEmptyComponent={<CommandCard accent="#8EA0B8"><Text style={[styles.emptyTitle, { color: colors.foreground }]}>No check-ins in this view</Text><Text style={[styles.emptyCopy, { color: colors.muted }]}>Return to your principles and check a rule to create a real daily record.</Text></CommandCard>} renderItem={({ item }) => <DailyRecordCard checkIn={item} colors={colors} />} /></ScreenContainer>;
}

function DailyRecordCard({ checkIn, colors }: { checkIn: CorePrincipleDailyCheckIn; colors: ReturnType<typeof useColors> }) {
  const summary = getCorePrinciplesSummary([checkIn]);
  const ratio = Math.round((summary.successRatio ?? 0) * 100);
  return <CommandCard accent={colors.success} style={styles.dayCard}><View style={styles.dayTop}><View><Text style={[styles.dayDate, { color: colors.foreground }]}>{checkIn.localDate}</Text><Text style={[styles.dayDetail, { color: colors.muted }]}>{summary.checked}/{summary.applicable} principles checked</Text></View><Text style={[styles.dayRatio, { color: colors.success }]}>{ratio}%</Text></View></CommandCard>;
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 48 }, close: { fontSize: 14, fontWeight: "900" }, metrics: { flexDirection: "row", gap: 10 }, filters: { gap: 10 }, filterLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.05 }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { minHeight: 36, justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderRadius: 11, paddingHorizontal: 11 }, chipText: { fontSize: 12, fontWeight: "900" }, dateRow: { flexDirection: "row", gap: 8 }, dateInput: { minHeight: 43, flex: 1, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 10, fontSize: 12, fontWeight: "700" }, emptyChart: { fontSize: 13, lineHeight: 19, fontWeight: "700" }, insightCard: { gap: 10 }, insightRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, insightCopy: { flex: 1, gap: 2 }, insightTitle: { flex: 1, fontSize: 14, lineHeight: 19, fontWeight: "900" }, insightDetail: { fontSize: 12, lineHeight: 17, fontWeight: "700" }, listPercent: { fontSize: 18, fontWeight: "900" }, dayCard: { gap: 4 }, dayTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, dayDate: { fontSize: 16, fontWeight: "900" }, dayDetail: { marginTop: 2, fontSize: 12, fontWeight: "700" }, dayRatio: { fontSize: 25, fontWeight: "900" }, emptyTitle: { fontSize: 18, fontWeight: "900" }, emptyCopy: { marginTop: 6, fontSize: 13, lineHeight: 18, fontWeight: "700" },
});
