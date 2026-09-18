import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { BarsChart, DonutChart, LineTrendChart, type ChartPoint } from "@/components/focus-charts";
import { CommandCard, IconAction, LoadingScreen, MetricTile, ScreenTitle, SectionHeader, StatusPill } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { shallowEqual, useFocusCommandReady, useFocusCommandSelector } from "@/lib/focus-command";
import {
  formatSuperDashboardMinutes,
  getSuperDashboardSummary,
  type SuperDashboardRangeKind,
  type SuperDashboardState,
} from "@/lib/super-dashboard";

const RANGE_OPTIONS: Array<{ id: SuperDashboardRangeKind; label: string }> = [
  { id: "today", label: "TODAY" },
  { id: "week", label: "WEEK" },
  { id: "month", label: "MONTH" },
  { id: "lifetime", label: "LIFETIME" },
  { id: "custom", label: "CUSTOM" },
];

const CATEGORY_COLORS = ["#49D17D", "#A78BFA", "#F4C95D", "#60A5FA", "#FFAA4C", "#E879F9"];

function selectSuperDashboardState(state: SuperDashboardState): SuperDashboardState {
  return {
    profile: state.profile,
    missions: state.missions,
    missionCompletions: state.missionCompletions,
    reflections: state.reflections,
    srsActivityLog: state.srsActivityLog,
    corePrincipleDailyCheckIns: state.corePrincipleDailyCheckIns,
    recoveryStressors: state.recoveryStressors,
    recoveryActions: state.recoveryActions,
    sleepLogs: state.sleepLogs,
    napLogs: state.napLogs,
    screenTimeLogs: state.screenTimeLogs,
    journals: state.journals,
    distractionLogs: state.distractionLogs,
    progression: state.progression,
    characterMilestones: state.characterMilestones,
  };
}

function sameSuperDashboardState(left: SuperDashboardState, right: SuperDashboardState) {
  return shallowEqual(left, right);
}

function displayAverage(value: number | null, suffix = ""): string {
  return value === null ? "—" : `${value}${suffix}`;
}

function metricEvidence(observations: number, singular: string): string {
  return `${observations} ${singular}${observations === 1 ? "" : "s"} logged`;
}

export default function SuperDashboardScreen() {
  const colors = useColors();
  const ready = useFocusCommandReady();
  const state = useFocusCommandSelector(selectSuperDashboardState, sameSuperDashboardState);
  const [rangeKind, setRangeKind] = useState<SuperDashboardRangeKind>("week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const summary = useMemo(
    () => getSuperDashboardSummary(state, rangeKind, customStart, customEnd),
    [customEnd, customStart, rangeKind, state],
  );
  const categoryChartPoints = useMemo<ChartPoint[]>(
    () => summary.activity.categories.map((category, index) => ({ label: category.label, value: category.minutes / 60, color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] })),
    [summary.activity.categories],
  );
  const emotionPoints = useMemo<ChartPoint[]>(
    () => [
      { label: "Focus", value: summary.emotions.focus.value ?? 0, color: colors.success },
      { label: "Motivation", value: summary.emotions.motivation.value ?? 0, color: colors.primary },
      { label: "Clarity", value: summary.emotions.clarity.value ?? 0, color: "#A78BFA" },
      { label: "Energy", value: summary.emotions.energy.value ?? 0, color: "#F4C95D" },
      { label: "Distraction", value: summary.emotions.distraction.value ?? 0, color: "#FFAA4C" },
      { label: "Friction", value: summary.emotions.friction.value ?? 0, color: colors.error },
    ],
    [colors.error, colors.primary, colors.success, summary.emotions],
  );
  const activityBars = useMemo<ChartPoint[]>(
    () => summary.activity.categories.slice(0, 8).map((category, index) => ({ label: category.label.replace("Focus · ", ""), value: category.minutes / 60, color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] })),
    [summary.activity.categories],
  );

  if (!ready) return <LoadingScreen label="Building your local Super Dashboard…" />;

  const rangeIsCustomInvalid = rangeKind === "custom" && !summary.range.valid;
  return (
    <ScreenContainer className="px-4" containerClassName="bg-background" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenTitle
          eyebrow="Private · complete local view"
          title="Super Dashboard"
          detail="One transparent view of your time, progress, recovery, focus, and personal evidence. No cloud or AI is used."
          right={<IconAction icon="chevron.right" label="Return to Dashboard" onPress={() => router.back()} />}
        />

        <View style={styles.rangeRow}>
          {RANGE_OPTIONS.map((option) => {
            const active = rangeKind === option.id;
            return <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={`Show Super Dashboard for ${option.label.toLowerCase()}`} onPress={() => setRangeKind(option.id)} style={({ pressed }) => [styles.rangeChip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? `${colors.primary}1A` : colors.surface, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.rangeChipText, { color: active ? colors.primary : colors.muted }]}>{option.label}</Text></Pressable>;
          })}
        </View>
        {rangeKind === "custom" ? <View style={styles.customRow}>
          <TextInput value={customStart} onChangeText={setCustomStart} placeholder="Start YYYY-MM-DD" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} style={[styles.dateInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} />
          <TextInput value={customEnd} onChangeText={setCustomEnd} placeholder="End YYYY-MM-DD" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} style={[styles.dateInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} />
        </View> : null}

        {rangeIsCustomInvalid ? <CommandCard accent={colors.warning} style={styles.messageCard}>
          <Text style={[styles.messageTitle, { color: colors.foreground }]}>Choose a valid custom period</Text>
          <Text style={[styles.messageDetail, { color: colors.muted }]}>Use inclusive dates in YYYY-MM-DD order. No calculation is made until both dates are valid.</Text>
        </CommandCard> : <>
          <CommandCard accent={colors.primary} style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <View style={styles.overviewCopy}>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>{summary.range.label} · {summary.range.startDate} → {summary.range.endDate}</Text>
                <Text style={[styles.overviewTitle, { color: colors.foreground }]}>{formatSuperDashboardMinutes(summary.activity.reportedMinutes)} activity recorded</Text>
                <Text style={[styles.overviewDetail, { color: colors.muted }]}>{formatSuperDashboardMinutes(summary.activity.minimumUntrackedMinutes)} minimum untracked from {formatSuperDashboardMinutes(summary.range.calendarCapacityMinutes)} calendar capacity.</Text>
              </View>
              <View style={[styles.overviewBadge, { borderColor: `${colors.primary}55`, backgroundColor: `${colors.primary}14` }]}>
                <Text style={[styles.overviewBadgeValue, { color: colors.primary }]}>{summary.evidence.recordedDays}</Text>
                <Text style={[styles.overviewBadgeLabel, { color: colors.muted }]}>DAYS</Text>
              </View>
            </View>
            <Text style={[styles.calculationNote, { color: colors.muted }]}>{summary.activity.note}</Text>
          </CommandCard>

          <SectionHeader title="Time recorded" />
          {categoryChartPoints.length ? <CommandCard accent={colors.success} style={styles.timeCard}>
            <View style={styles.chartHeading}><View><Text style={[styles.cardTitle, { color: colors.foreground }]}>Activity totals</Text><Text style={[styles.cardDetail, { color: colors.muted }]}>Each category is shown independently from its own saved records.</Text></View><StatusPill label={`${summary.activity.recordCount} RECORDS`} tone="success" /></View>
            <View style={styles.chartLayout}><DonutChart points={categoryChartPoints} centerValue={formatSuperDashboardMinutes(summary.activity.reportedMinutes)} centerLabel="RECORDED" accessibilityLabel="Recorded activity time by category" /><View style={styles.legend}>{summary.activity.categories.map((category, index) => <View key={category.id} style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }]} /><View style={styles.legendCopy}><Text numberOfLines={1} style={[styles.legendLabel, { color: colors.foreground }]}>{category.label}</Text><Text style={[styles.legendDetail, { color: colors.muted }]}>{formatSuperDashboardMinutes(category.minutes)} · {Math.round(category.shareOfReportedActivity * 100)}% of recorded activity</Text></View></View>)}</View></View>
            <BarsChart points={activityBars} color={colors.success} accessibilityLabel="Recorded activity hours by category" />
          </CommandCard> : <EmptyCard accent={colors.success} title="No activity totals yet" detail="Complete a mission or add private sleep, nap, or screen-time records to see this section." />}

          <SectionHeader title="Mission progress" />
          <View style={styles.metricGrid}>
            <MetricTile label="Focused time" value={formatSuperDashboardMinutes(summary.missions.focusedMinutes)} detail={`${summary.missions.completed} completed mission${summary.missions.completed === 1 ? "" : "s"}`} icon="timer" accent={colors.primary} />
            <MetricTile label="Total Power" value={String(summary.missions.totalPower)} detail={summary.missions.powerPerFocusedHour === null ? "Awaiting focused time" : `${summary.missions.powerPerFocusedHour} power per focus hour`} icon="shield.fill" accent="#F4C95D" />
            <MetricTile label="Session median" value={formatSuperDashboardMinutes(summary.missions.medianSessionMinutes)} detail={summary.missions.averageSessionMinutes === null ? "No completed sessions" : `average ${formatSuperDashboardMinutes(summary.missions.averageSessionMinutes)}`} icon="target" accent={colors.success} />
            <MetricTile label="Gold earned" value={String(summary.missions.goldEarned)} detail={`${summary.missions.baseXp} base XP from completed runs`} icon="gift.fill" accent="#F4C95D" />
          </View>
          <CommandCard accent="#A78BFA" style={styles.detailCard}>
            <Text style={[styles.detailCardTitle, { color: colors.foreground }]}>Where progress was recorded</Text>
            <Text style={[styles.detailCardText, { color: colors.muted }]}>Top subject: {summary.missions.topSubject ?? "—"} · top category: {summary.missions.topCategory ?? "—"} · most active completion window: {summary.missions.mostActiveCompletionWindow ?? "—"}.</Text>
          </CommandCard>

          <SectionHeader title="Recovery & rhythm" />
          <View style={styles.metricGrid}>
            <MetricTile label="Logged stress" value={displayAverage(summary.recovery.averageLoggedStress.value, "/10")} detail={metricEvidence(summary.recovery.averageLoggedStress.observations, "stressor")} icon="cloud.fill" accent={colors.warning} />
            <MetricTile label="Mission stress" value={displayAverage(summary.recovery.averageReflectionStress.value, "/5")} detail={metricEvidence(summary.recovery.averageReflectionStress.observations, "debrief")} icon="chart.xyaxis.line" accent="#FF7A59" />
            <MetricTile label="Sleep average" value={formatSuperDashboardMinutes(summary.recovery.averageSleepMinutes.value)} detail={metricEvidence(summary.recovery.averageSleepMinutes.observations, "night")} icon="timer" accent={colors.success} />
            <MetricTile label="Sleep summary" value={displayAverage(summary.recovery.averageSleepScore.value, "/100")} detail={summary.recovery.averageSleepScore.observations ? `${summary.recovery.averageSleepScore.observations} personal summary${summary.recovery.averageSleepScore.observations === 1 ? "" : "ies"}` : "Awaiting sleep logs"} icon="star.fill" accent="#A78BFA" />
            <MetricTile label="Screen average" value={formatSuperDashboardMinutes(summary.recovery.averageScreenMinutes.value)} detail={summary.recovery.commonScreenLabel ? `most logged: ${summary.recovery.commonScreenLabel}` : metricEvidence(summary.recovery.screenRecordDays, "day")} icon="line.3.horizontal" accent={colors.primary} />
            <MetricTile label="Naps" value={formatSuperDashboardMinutes(summary.recovery.totalNapMinutes)} detail={`${summary.recovery.recoveryActions} recovery action${summary.recovery.recoveryActions === 1 ? "" : "s"} logged`} icon="timer" accent="#60A5FA" />
          </View>
          <CommandCard accent={colors.warning} style={styles.detailCard}>
            <Text style={[styles.detailCardTitle, { color: colors.foreground }]}>Clear separation of stress records</Text>
            <Text style={[styles.detailCardText, { color: colors.muted }]}>Logged Stress comes only from Recovery & Rhythm stressors. Mission Stress comes only from optional post-mission ratings. They stay separate so no different scales are mixed incorrectly. Peak logged stress: {summary.recovery.peakLoggedStress === null ? "—" : `${summary.recovery.peakLoggedStress}/10`}.</Text>
          </CommandCard>

          <SectionHeader title="Focus, friction & emotional data" />
          <View style={styles.metricGrid}>
            <MetricTile label="Disruptions" value={String(summary.focus.disruptions)} detail={summary.focus.disruptionsPerFocusedHour === null ? "No focused-time rate yet" : `${summary.focus.disruptionsPerFocusedHour} per focus hour`} icon="bolt.fill" accent={colors.warning} />
            <MetricTile label="Top interruption" value={summary.focus.topDistraction ?? "—"} detail={summary.focus.mostInterruptedWindow ? `most often ${summary.focus.mostInterruptedWindow}` : "No distraction logs in this range"} icon="flame.fill" accent="#FF7A59" />
          </View>
          {summary.evidence.reflectionRecords ? <CommandCard accent={colors.primary} style={styles.reflectionCard}>
            <View style={styles.chartHeading}><View><Text style={[styles.cardTitle, { color: colors.foreground }]}>Self-reported mission signals</Text><Text style={[styles.cardDetail, { color: colors.muted }]}>Averages use only debriefs that contain that specific rating. Missing ratings remain missing.</Text></View><StatusPill label={`${summary.evidence.reflectionRecords} DEBRIEFS`} tone="primary" /></View>
            <LineTrendChart points={emotionPoints} color={colors.primary} accessibilityLabel="Average self-reported mission signals" />
          </CommandCard> : <EmptyCard accent={colors.primary} title="No mission-signal data yet" detail="Complete optional post-mission ratings to see your self-reported focus, motivation, clarity, energy, distraction, and friction." />}

          <SectionHeader title="Habits, learning & character path" />
          <View style={styles.metricGrid}>
            <MetricTile label="Success Ratio" value={summary.supportingProgress.successRatio === null ? "—" : `${Math.round(summary.supportingProgress.successRatio * 100)}%`} detail={summary.supportingProgress.successRatio === null ? "No principle check-ins" : `${summary.supportingProgress.principleChecked}/${summary.supportingProgress.principleApplicable} checked`} icon="checklist" accent={colors.success} />
            <MetricTile label="Revision actions" value={String(summary.supportingProgress.revisionActions)} detail={`${summary.supportingProgress.maturedRevisionActions} reached Matured`} icon="book.closed.fill" accent="#A78BFA" />
            <MetricTile label="Journal points" value={String(summary.supportingProgress.journalPoints)} detail={`${summary.supportingProgress.journalEntries} entry${summary.supportingProgress.journalEntries === 1 ? "" : "ies"} in range`} icon="star.fill" accent="#F4C95D" />
            <MetricTile label="Forms earned" value={String(summary.supportingProgress.characterFormsEarned)} detail="Character milestones in this range" icon="trophy.fill" accent="#F4C95D" />
          </View>

          <SectionHeader title="Personal context patterns" />
          {summary.patterns.length ? <View style={styles.patternStack}>{summary.patterns.map((pattern) => <CommandCard key={pattern.id} accent={colors.success} style={styles.patternCard}><Text style={[styles.patternTitle, { color: colors.foreground }]}>{pattern.label}</Text><Text style={[styles.patternDetail, { color: colors.muted }]}>{pattern.detail}</Text><StatusPill label={`${pattern.pairedDays} PAIRED DAYS`} tone="success" /></CommandCard>)}</View> : <EmptyCard accent={colors.success} title="Patterns will appear after enough matching days" detail="The dashboard needs at least four days that contain both focused mission time and the same recovery measure. It reports same-day context only, never cause." />}

          <CommandCard accent={colors.primary} style={styles.evidenceCard}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>CALCULATION EVIDENCE</Text>
            <Text style={[styles.evidenceTitle, { color: colors.foreground }]}>What this view used</Text>
            <Text style={[styles.evidenceText, { color: colors.muted }]}>{summary.evidence.completionRecords} completed mission record{summary.evidence.completionRecords === 1 ? "" : "s"} · {summary.evidence.recoveryRecords} recovery record{summary.evidence.recoveryRecords === 1 ? "" : "s"} · {summary.evidence.reflectionRecords} mission debrief{summary.evidence.reflectionRecords === 1 ? "" : "s"} · {summary.evidence.recordedDays} recorded day{summary.evidence.recordedDays === 1 ? "" : "s"}.</Text>
            <Text style={[styles.evidenceText, { color: colors.muted }]}>{summary.evidence.note}</Text>
          </CommandCard>
        </>}
      </ScrollView>
    </ScreenContainer>
  );
}

function EmptyCard({ accent, title, detail }: { accent: string; title: string; detail: string }) {
  const colors = useColors();
  return <CommandCard accent={accent} style={styles.emptyCard}><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.emptyDetail, { color: colors.muted }]}>{detail}</Text></CommandCard>;
}

const styles = StyleSheet.create({
  content: { gap: 13, paddingTop: 12, paddingBottom: 32 },
  rangeRow: { flexDirection: "row", gap: 5 },
  rangeChip: { flex: 1, minHeight: 35, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  rangeChipText: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.35 },
  customRow: { flexDirection: "row", gap: 8 },
  dateInput: { flex: 1, minHeight: 43, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, fontSize: 11, lineHeight: 14, fontWeight: "700" },
  messageCard: { gap: 5 },
  messageTitle: { fontSize: 14, lineHeight: 18, fontWeight: "900" },
  messageDetail: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  overviewCard: { gap: 9 },
  overviewHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  overviewCopy: { flex: 1, minWidth: 0, gap: 3 },
  eyebrow: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.75 },
  overviewTitle: { fontSize: 20, lineHeight: 25, fontWeight: "900" },
  overviewDetail: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  overviewBadge: { minWidth: 60, minHeight: 60, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", paddingHorizontal: 7 },
  overviewBadgeValue: { fontSize: 20, lineHeight: 24, fontWeight: "900" },
  overviewBadgeLabel: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.8 },
  calculationNote: { fontSize: 10, lineHeight: 15, fontWeight: "600" },
  timeCard: { gap: 10 },
  chartHeading: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  cardTitle: { fontSize: 15, lineHeight: 19, fontWeight: "900" },
  cardDetail: { maxWidth: 235, fontSize: 10, lineHeight: 14, fontWeight: "600", marginTop: 2 },
  chartLayout: { flexDirection: "row", alignItems: "center", gap: 8 },
  legend: { flex: 1, minWidth: 0, gap: 7 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  legendDot: { width: 8, height: 8, borderRadius: 8 },
  legendCopy: { flex: 1, minWidth: 0, gap: 1 },
  legendLabel: { fontSize: 10, lineHeight: 13, fontWeight: "800" },
  legendDetail: { fontSize: 9, lineHeight: 12, fontWeight: "600" },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  detailCard: { gap: 4 },
  detailCardTitle: { fontSize: 13, lineHeight: 17, fontWeight: "900" },
  detailCardText: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  reflectionCard: { gap: 10 },
  patternStack: { gap: 9 },
  patternCard: { gap: 6 },
  patternTitle: { fontSize: 14, lineHeight: 18, fontWeight: "900" },
  patternDetail: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  emptyCard: { gap: 5 },
  emptyTitle: { fontSize: 14, lineHeight: 18, fontWeight: "900" },
  emptyDetail: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  evidenceCard: { gap: 5 },
  evidenceTitle: { fontSize: 16, lineHeight: 20, fontWeight: "900" },
  evidenceText: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
});
