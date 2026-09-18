import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { BarsChart, DonutChart, type ChartPoint } from "@/components/focus-charts";
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

const RANGE_ROWS: { id: SuperDashboardRangeKind; label: string }[][] = [
  [
    { id: "today", label: "TODAY" },
    { id: "week", label: "WEEK" },
    { id: "month", label: "MONTH" },
  ],
  [
    { id: "lifetime", label: "LIFETIME" },
    { id: "custom", label: "CUSTOM" },
  ],
];

const SIGNAL_MODES = [
  { id: "attention", label: "ATTENTION", detail: "Focus, clarity, and distraction ratings" },
  { id: "drive", label: "DRIVE", detail: "Motivation, energy, and friction ratings" },
  { id: "recovery", label: "RECOVERY", detail: "Sleep and mission-stress ratings" },
] as const;

type SignalMode = (typeof SIGNAL_MODES)[number]["id"];

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

function signalPoints(mode: SignalMode, summary: ReturnType<typeof getSuperDashboardSummary>, colors: ReturnType<typeof useColors>): ChartPoint[] {
  const values = mode === "attention"
    ? [
      { label: "Focus", metric: summary.emotions.focus, color: colors.success },
      { label: "Clarity", metric: summary.emotions.clarity, color: "#A78BFA" },
      { label: "Distraction", metric: summary.emotions.distraction, color: "#FFAA4C" },
    ]
    : mode === "drive"
      ? [
        { label: "Motivation", metric: summary.emotions.motivation, color: colors.primary },
        { label: "Energy", metric: summary.emotions.energy, color: "#F4C95D" },
        { label: "Friction", metric: summary.emotions.friction, color: colors.error },
      ]
      : [
        { label: "Sleep quality", metric: summary.recovery.sleepQuality, color: colors.success },
        { label: "Rested feeling", metric: summary.recovery.restedFeeling, color: "#60A5FA" },
        { label: "Mission stress", metric: summary.recovery.averageReflectionStress, color: "#FF7A59" },
      ];
  return values.flatMap((item) => item.metric.value === null ? [] : [{ label: item.label, value: item.metric.value, color: item.color }]);
}

function highlightedStyle(color: string) {
  return [styles.inlineStrong, { color }];
}

export default function SuperDashboardScreen() {
  const colors = useColors();
  const ready = useFocusCommandReady();
  const state = useFocusCommandSelector(selectSuperDashboardState, sameSuperDashboardState);
  const [rangeKind, setRangeKind] = useState<SuperDashboardRangeKind>("week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [signalMode, setSignalMode] = useState<SignalMode>("attention");

  const summary = useMemo(
    () => getSuperDashboardSummary(state, rangeKind, customStart, customEnd),
    [customEnd, customStart, rangeKind, state],
  );
  const categoryChartPoints = useMemo<ChartPoint[]>(
    () => summary.activity.categories.map((category, index) => ({ label: category.label, value: category.minutes / 60, color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] })),
    [summary.activity.categories],
  );
  const activeSignal = SIGNAL_MODES.find((item) => item.id === signalMode) ?? SIGNAL_MODES[0];
  const selectedSignalPoints = useMemo(
    () => signalPoints(signalMode, summary, colors),
    [colors, signalMode, summary],
  );
  const activityBars = useMemo<ChartPoint[]>(
    () => summary.activity.categories.slice(0, 8).map((category, index) => ({ label: category.label.replace("Focus · ", ""), value: category.minutes / 60, color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] })),
    [summary.activity.categories],
  );

  if (!ready) return <LoadingScreen label="Building your local Super Dashboard…" />;

  const rangeIsCustomInvalid = rangeKind === "custom" && !summary.range.valid;
  const interruption = summary.focus.loggedInterruptionRate;
  const recentSleep = summary.recovery.typicalRecentSleep;

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenTitle
          eyebrow="Private · complete local view"
          title="Super Dashboard"
          detail="One transparent view of your time, progress, recovery, focus, and personal evidence. No cloud or AI is used."
          right={<IconAction icon="chevron.right" label="Return to Dashboard" onPress={() => router.back()} />}
        />

        <View style={styles.rangeStack}>
          {RANGE_ROWS.map((row) => <View key={row.map((item) => item.id).join("-")} style={styles.rangeRow}>
            {row.map((option) => {
              const active = rangeKind === option.id;
              return <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={`Show Super Dashboard for ${option.label.toLowerCase()}`} onPress={() => setRangeKind(option.id)} style={({ pressed }) => [styles.rangeChip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? `${colors.primary}1A` : colors.surface, opacity: pressed ? 0.72 : 1 }]}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={[styles.rangeChipText, { color: active ? colors.primary : colors.muted }]}>{option.label}</Text></Pressable>;
            })}
          </View>)}
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
            <View style={styles.chartHeading}><View style={styles.chartCopy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Activity totals</Text><Text style={[styles.cardDetail, { color: colors.muted }]}>Each category is shown independently from its own saved records.</Text></View><StatusPill label={`${summary.activity.recordCount} RECORDS`} tone="success" /></View>
            <View style={styles.chartLayout}><DonutChart points={categoryChartPoints} centerValue={formatSuperDashboardMinutes(summary.activity.reportedMinutes)} centerLabel="RECORDED" accessibilityLabel="Recorded activity time by category" /><View style={styles.legend}>{summary.activity.categories.map((category, index) => <View key={category.id} style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }]} /><View style={styles.legendCopy}><Text numberOfLines={1} style={[styles.legendLabel, { color: colors.foreground }]}>{category.label}</Text><Text style={[styles.legendDetail, { color: colors.muted }]}>{formatSuperDashboardMinutes(category.minutes)} · {Math.round(category.shareOfReportedActivity * 100)}% of recorded activity</Text></View></View>)}</View></View>
            <BarsChart points={activityBars} color={colors.success} accessibilityLabel="Recorded activity hours by category" />
          </CommandCard> : <EmptyCard accent={colors.success} title="No activity totals yet" detail="Complete a mission or add private sleep, nap, or screen-time records to see this section." />}

          <SectionHeader title="Mission progress" />
          <View style={styles.metricGrid}>
            <MetricTile style={styles.metricTile} label="Focused time" value={formatSuperDashboardMinutes(summary.missions.focusedMinutes)} detail={`${summary.missions.completed} completed mission${summary.missions.completed === 1 ? "" : "s"}`} icon="timer" accent={colors.primary} />
            <MetricTile style={styles.metricTile} label="Total Power" value={String(summary.missions.totalPower)} detail={summary.missions.powerPerFocusedHour === null ? "Awaiting focused time" : `${summary.missions.powerPerFocusedHour} power per focus hour`} icon="shield.fill" accent="#F4C95D" />
            <MetricTile style={styles.metricTile} label="Session median" value={formatSuperDashboardMinutes(summary.missions.medianSessionMinutes)} detail={summary.missions.averageSessionMinutes === null ? "No completed sessions" : `average ${formatSuperDashboardMinutes(summary.missions.averageSessionMinutes)}`} icon="target" accent={colors.success} />
            <MetricTile style={styles.metricTile} label="Gold earned" value={String(summary.missions.goldEarned)} detail={`${summary.missions.baseXp} base XP from completed runs`} icon="gift.fill" accent="#F4C95D" />
          </View>
          <CommandCard accent="#A78BFA" style={styles.detailCard}>
            <Text style={[styles.detailCardTitle, { color: colors.foreground }]}>Where progress was recorded</Text>
            <Text style={[styles.detailCardText, { color: colors.muted }]}><Text style={highlightedStyle(colors.foreground)}>{summary.missions.completed} completed mission{summary.missions.completed === 1 ? "" : "s"}</Text> across <Text style={highlightedStyle(colors.foreground)}>{summary.missions.activeDays} active day{summary.missions.activeDays === 1 ? "" : "s"}</Text>. Your most invested subject was <Text style={highlightedStyle(colors.primary)}>{summary.missions.topSubject ?? "not recorded yet"}</Text>; <Text style={highlightedStyle(colors.primary)}>{summary.missions.topCategory ?? "no category"}</Text> was your main category. You most often completed missions around <Text style={highlightedStyle(colors.primary)}>{summary.missions.mostActiveCompletionWindow ?? "no completed-time window yet"}</Text>.</Text>
          </CommandCard>

          <SectionHeader title="Recovery & rhythm" />
          <View style={styles.metricGrid}>
            <MetricTile style={styles.metricTile} label="Logged stress" value={displayAverage(summary.recovery.averageLoggedStress.value, "/10")} detail={metricEvidence(summary.recovery.averageLoggedStress.observations, "stressor")} icon="cloud.fill" accent={colors.warning} />
            <MetricTile style={styles.metricTile} label="Mission stress" value={displayAverage(summary.recovery.averageReflectionStress.value, "/5")} detail={metricEvidence(summary.recovery.averageReflectionStress.observations, "debrief")} icon="chart.xyaxis.line" accent="#FF7A59" />
            <MetricTile style={styles.metricTile} label="Sleep average" value={formatSuperDashboardMinutes(summary.recovery.averageSleepMinutes.value)} detail={metricEvidence(summary.recovery.averageSleepMinutes.observations, "night")} icon="timer" accent={colors.success} />
            <MetricTile style={styles.metricTile} label="Sleep summary" value={displayAverage(summary.recovery.averageSleepScore.value, "/100")} detail={summary.recovery.averageSleepScore.observations ? `${summary.recovery.averageSleepScore.observations} personal summar${summary.recovery.averageSleepScore.observations === 1 ? "y" : "ies"}` : "Awaiting sleep logs"} icon="star.fill" accent="#A78BFA" />
            <MetricTile style={styles.metricTile} label="Typical 7-day sleep" value={formatSuperDashboardMinutes(recentSleep.medianMinutes)} detail={recentSleep.medianMinutes === null ? `${recentSleep.loggedNights}/${recentSleep.requiredNights} recent nights logged` : `median of ${recentSleep.loggedNights} recent nights`} icon="timer" accent="#60A5FA" />
            <MetricTile style={styles.metricTile} label="Screen average" value={formatSuperDashboardMinutes(summary.recovery.averageScreenMinutes.value)} detail={summary.recovery.commonScreenLabel ? `most logged: ${summary.recovery.commonScreenLabel}` : metricEvidence(summary.recovery.screenRecordDays, "day")} icon="line.3.horizontal" accent={colors.primary} />
            <MetricTile style={styles.metricTile} label="Naps" value={formatSuperDashboardMinutes(summary.recovery.totalNapMinutes)} detail={`${summary.recovery.recoveryActions} recovery action${summary.recovery.recoveryActions === 1 ? "" : "s"} logged`} icon="timer" accent="#60A5FA" />
            <MetricTile style={styles.metricTile} label="Rested feeling" value={displayAverage(summary.recovery.restedFeeling.value, "/5")} detail={metricEvidence(summary.recovery.restedFeeling.observations, "night")} icon="star.fill" accent="#60A5FA" />
          </View>
          <CommandCard accent={colors.warning} style={styles.detailCard}>
            <Text style={[styles.detailCardTitle, { color: colors.foreground }]}>Clear separation of stress records</Text>
            <Text style={[styles.detailCardText, { color: colors.muted }]}><Text style={highlightedStyle(colors.warning)}>Logged Stress: {displayAverage(summary.recovery.averageLoggedStress.value, "/10")}</Text> comes from <Text style={highlightedStyle(colors.foreground)}>{summary.recovery.stressorCount} Recovery & Rhythm entry{summary.recovery.stressorCount === 1 ? "" : "ies"}</Text>. <Text style={highlightedStyle("#FF7A59")}>Mission Stress: {displayAverage(summary.recovery.averageReflectionStress.value, "/5")}</Text> comes from <Text style={highlightedStyle(colors.foreground)}>{summary.recovery.averageReflectionStress.observations} optional mission debrief{summary.recovery.averageReflectionStress.observations === 1 ? "" : "s"}</Text>. They remain separate because their scales and questions are different. Highest logged stress: <Text style={highlightedStyle(colors.warning)}>{summary.recovery.peakLoggedStress === null ? "—" : `${summary.recovery.peakLoggedStress}/10`}</Text>.</Text>
          </CommandCard>

          <SectionHeader title="Focus, friction & emotional data" />
          <View style={styles.metricGrid}>
            <MetricTile style={styles.metricTile} label="Disruptions" value={String(summary.focus.disruptions)} detail={summary.focus.disruptionsPerFocusedHour === null ? "No focused-time rate yet" : `${summary.focus.disruptionsPerFocusedHour} per focus hour`} icon="bolt.fill" accent={colors.warning} />
            <MetricTile style={styles.metricTile} label="Top interruption" value={summary.focus.topDistraction ?? "—"} detail={summary.focus.mostInterruptedWindow ? `most often ${summary.focus.mostInterruptedWindow}` : "No distraction logs in this range"} icon="flame.fill" accent="#FF7A59" />
            <MetricTile style={styles.metricTile} label="Logged interruption rate" value={interruption.value === null ? "—" : `${interruption.value}/h`} detail={interruption.sufficientData ? `${interruption.matchedLogs} matched logs across ${formatSuperDashboardMinutes(interruption.focusedMinutes)}` : `${interruption.completedMissions}/10 missions · ${interruption.activeDays}/5 days`} icon="bolt.fill" accent="#FFAA4C" />
            <MetricTile style={styles.metricTile} label="Focus days" value={String(summary.missions.activeDays)} detail={`${summary.missions.completed} completed mission${summary.missions.completed === 1 ? "" : "s"} in this view`} icon="checklist" accent={colors.success} />
          </View>
          {summary.evidence.reflectionRecords ? <CommandCard accent={colors.primary} style={styles.reflectionCard}>
            <View style={styles.chartHeading}><View style={styles.chartCopy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Self-reported mission signals</Text><Text style={[styles.cardDetail, { color: colors.muted }]}>Tap a group to switch the comparison. Each value uses only debriefs that contain that rating; missing ratings are never treated as zero.</Text></View><StatusPill label={`${summary.evidence.reflectionRecords} DEBRIEFS`} tone="primary" /></View>
            <View style={styles.signalTabs}>{SIGNAL_MODES.map((mode) => { const active = mode.id === signalMode; return <Pressable key={mode.id} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={`Show ${mode.label.toLowerCase()} mission signals`} onPress={() => setSignalMode(mode.id)} style={({ pressed }) => [styles.signalTab, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? `${colors.primary}1A` : colors.background, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.signalTabText, { color: active ? colors.primary : colors.muted }]}>{mode.label}</Text></Pressable>; })}</View>
            <Text style={[styles.signalExplanation, { color: colors.muted }]}><Text style={highlightedStyle(colors.foreground)}>{activeSignal.label}</Text> · {activeSignal.detail} · ratings are shown on their original 1–5 scales.</Text>
            {selectedSignalPoints.length ? <BarsChart points={selectedSignalPoints} color={colors.primary} accessibilityLabel={`${activeSignal.label.toLowerCase()} self-reported mission-signal comparison`} /> : <Text style={[styles.emptySignalText, { color: colors.muted }]}>No saved debrief ratings exist for this group in the selected period.</Text>}
          </CommandCard> : <EmptyCard accent={colors.primary} title="No mission-signal data yet" detail="Complete optional post-mission ratings to see your self-reported focus, motivation, clarity, energy, distraction, and friction." />}

          <SectionHeader title="Habits, learning & character path" />
          <View style={styles.metricGrid}>
            <MetricTile style={styles.metricTile} label="Success Ratio" value={summary.supportingProgress.successRatio === null ? "—" : `${Math.round(summary.supportingProgress.successRatio * 100)}%`} detail={summary.supportingProgress.successRatio === null ? "No principle check-ins" : `${summary.supportingProgress.principleChecked}/${summary.supportingProgress.principleApplicable} checked`} icon="checklist" accent={colors.success} />
            <MetricTile style={styles.metricTile} label="Revision actions" value={String(summary.supportingProgress.revisionActions)} detail={`${summary.supportingProgress.maturedRevisionActions} reached Matured`} icon="book.closed.fill" accent="#A78BFA" />
            <MetricTile style={styles.metricTile} label="Journal points" value={String(summary.supportingProgress.journalPoints)} detail={`${summary.supportingProgress.journalEntries} entr${summary.supportingProgress.journalEntries === 1 ? "y" : "ies"} in range`} icon="star.fill" accent="#F4C95D" />
            <MetricTile style={styles.metricTile} label="Forms earned" value={String(summary.supportingProgress.characterFormsEarned)} detail="Character milestones in this range" icon="trophy.fill" accent="#F4C95D" />
          </View>

          <SectionHeader title="Personal context patterns" />
          {summary.patterns.length ? <View style={styles.patternStack}>{summary.patterns.map((pattern) => <CommandCard key={pattern.id} accent={colors.success} style={styles.patternCard}>
            <Text style={[styles.patternTitle, { color: colors.foreground }]}>{pattern.label}</Text>
            <Text style={[styles.patternDetail, { color: colors.muted }]}><Text style={highlightedStyle(colors.success)}>{pattern.pairedDays} matched day{pattern.pairedDays === 1 ? "" : "s"}</Text> means you logged both this context measure and completed mission focus time on the same local date.</Text>
            {pattern.isReliable && pattern.higherFocusMinutes !== null && pattern.lowerFocusMinutes !== null ? <Text style={[styles.patternDetail, { color: colors.muted }]}>On your <Text style={highlightedStyle(colors.foreground)}>{pattern.higherDays} days at or above your personal midpoint</Text>, you averaged <Text style={highlightedStyle(colors.success)}>{formatSuperDashboardMinutes(pattern.higherFocusMinutes)}</Text> of focus, compared with <Text style={highlightedStyle(colors.foreground)}>{formatSuperDashboardMinutes(pattern.lowerFocusMinutes)}</Text> across <Text style={highlightedStyle(colors.foreground)}>{pattern.lowerDays} lower days</Text>. This is your personal same-day association, not proof of cause.</Text> : <Text style={[styles.patternDetail, { color: colors.muted }]}><Text style={highlightedStyle(colors.warning)}>Early observation only.</Text> A reliable comparison waits for <Text style={highlightedStyle(colors.foreground)}>14 matched days</Text>, including at least <Text style={highlightedStyle(colors.foreground)}>7 days on each side</Text> of your own midpoint. You need {Math.max(0, 14 - pattern.pairedDays)} more matched day{Math.max(0, 14 - pattern.pairedDays) === 1 ? "" : "s"} before this dashboard compares focus time.</Text>}
            <StatusPill label={pattern.isReliable ? `${pattern.pairedDays} MATCHED DAYS` : `${pattern.pairedDays} / 14 MATCHED DAYS`} tone={pattern.isReliable ? "success" : "warning"} />
          </CommandCard>)}</View> : <EmptyCard accent={colors.success} title="Patterns will appear after matching days exist" detail="A matching day has both completed mission focus time and one saved recovery measure. At 14 matched days, the dashboard can show a cautious personal comparison—not a cause." />}

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
  rangeStack: { gap: 6 },
  rangeRow: { flexDirection: "row", gap: 7 },
  rangeChip: { flex: 1, minWidth: 0, minHeight: 39, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  rangeChipText: { alignSelf: "stretch", textAlign: "center", fontSize: 10, lineHeight: 13, fontWeight: "900", letterSpacing: 0.18 },
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
  chartCopy: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 15, lineHeight: 19, fontWeight: "900" },
  cardDetail: { fontSize: 10, lineHeight: 14, fontWeight: "600", marginTop: 2 },
  chartLayout: { flexDirection: "row", alignItems: "center", gap: 8 },
  legend: { flex: 1, minWidth: 0, gap: 7 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  legendDot: { width: 8, height: 8, borderRadius: 8 },
  legendCopy: { flex: 1, minWidth: 0, gap: 1 },
  legendLabel: { fontSize: 10, lineHeight: 13, fontWeight: "800" },
  legendDetail: { fontSize: 9, lineHeight: 12, fontWeight: "600" },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 8 },
  metricTile: { flexGrow: 0, flexBasis: "48.5%", width: "48.5%" },
  detailCard: { gap: 5 },
  detailCardTitle: { fontSize: 13, lineHeight: 17, fontWeight: "900" },
  detailCardText: { fontSize: 11, lineHeight: 17, fontWeight: "600" },
  inlineStrong: { fontWeight: "900" },
  reflectionCard: { gap: 10 },
  signalTabs: { flexDirection: "row", gap: 6 },
  signalTab: { flex: 1, minHeight: 37, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  signalTabText: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.45 },
  signalExplanation: { fontSize: 10, lineHeight: 14, fontWeight: "600" },
  emptySignalText: { fontSize: 11, lineHeight: 16, fontWeight: "600", textAlign: "center", paddingVertical: 16 },
  patternStack: { gap: 9 },
  patternCard: { gap: 7 },
  patternTitle: { fontSize: 14, lineHeight: 18, fontWeight: "900" },
  patternDetail: { fontSize: 11, lineHeight: 17, fontWeight: "600" },
  emptyCard: { gap: 5 },
  emptyTitle: { fontSize: 14, lineHeight: 18, fontWeight: "900" },
  emptyDetail: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  evidenceCard: { gap: 5 },
  evidenceTitle: { fontSize: 16, lineHeight: 20, fontWeight: "900" },
  evidenceText: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
});
