import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { BarsChart, ChartPoint, DonutChart, LineTrendChart, MultiLineTrendChart, RadarChart } from "@/components/focus-charts";
import { CommandButton, CommandCard, IconAction, LoadingScreen, MetricTile, ScreenTitle, SectionHeader, StatusPill, TapFeedback } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { formatCompactNumber, getCalendarTimeAverages, getDashboardStats, getEmotionalPatternForecast, getMissionCompletionRecords, getTotalPower, getWellbeingInsight, toLocalDate, type FocusState, useFocusCommandActions, useFocusCommandReady, useFocusCommandSelector } from "@/lib/focus-command";
import { RECOGNITION_WINDOW_LAYOUT } from "@/lib/focus-layout";
import { getFocusFrictionInsight } from "@/lib/distraction-log";
import { getWeeklyAfterActionReview } from "@/lib/weekly-after-action";

function createDaySeries(days: number, profileTimezone: string) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    const localDate = toLocalDate(date.toISOString(), profileTimezone);
    return { localDate, label: index === 0 || index === days - 1 || index === Math.floor(days / 2) ? localDate.slice(5) : "" };
  });
}

const feelingScore = { drained: 1, restless: 2, steady: 3, charged: 4, great: 5 } as const;

type DashboardDependencies = Pick<FocusState,
  "profile"
  | "missions"
  | "missionCompletions"
  | "progression"
  | "characterMilestones"
  | "reflections"
  | "distractionLogs"
  | "srsTopics"
  | "customGraphs"
  | "lifeline"
>;

function selectDashboardDependencies(state: FocusState): DashboardDependencies {
  return {
    profile: state.profile,
    missions: state.missions,
    missionCompletions: state.missionCompletions,
    progression: state.progression,
    characterMilestones: state.characterMilestones,
    reflections: state.reflections,
    distractionLogs: state.distractionLogs,
    srsTopics: state.srsTopics,
    customGraphs: state.customGraphs,
    lifeline: state.lifeline,
  };
}

function hasSameDashboardDependencies(left: DashboardDependencies, right: DashboardDependencies) {
  return left.profile === right.profile
    && left.missions === right.missions
    && left.missionCompletions === right.missionCompletions
    && left.progression === right.progression
    && left.characterMilestones === right.characterMilestones
    && left.reflections === right.reflections
    && left.distractionLogs === right.distractionLogs
    && left.srsTopics === right.srsTopics
    && left.customGraphs === right.customGraphs
    && left.lifeline === right.lifeline;
}

export default function DashboardScreen() {
  const colors = useColors();
  const ready = useFocusCommandReady();
  const { addLifelinePoint, removeLifelinePoint } = useFocusCommandActions();
  const state = useFocusCommandSelector(selectDashboardDependencies, hasSameDashboardDependencies) as FocusState;
  const [showLifelineEditor, setShowLifelineEditor] = useState(false);
  const [birthYear, setBirthYear] = useState(String(new Date().getFullYear() - 20));
  const [lifePerformance, setLifePerformance] = useState("5");
  const [experience, setExperience] = useState("5");
  const [lifelineNote, setLifelineNote] = useState("");
  const [showLifelineDetails, setShowLifelineDetails] = useState(false);

  const daySeries = useMemo(() => createDaySeries(14, state.profile.timezone), [state.profile.timezone]);
  /* eslint-disable react-hooks/exhaustive-deps -- These pure helpers require a FocusState shape, while each memo intentionally tracks only the source references it actually reads. Adding the full state would reinstate unrelated interaction-path work. */
  const dashboard = useMemo(() => getDashboardStats(state), [state.missionCompletions, state.missions, state.profile, state.progression, state.reflections]);
  const completionRecords = useMemo(() => getMissionCompletionRecords(state), [state.missionCompletions, state.missions, state.progression, state.reflections]);
  const forecast = useMemo(() => getEmotionalPatternForecast(state), [state.profile, state.reflections]);
  const wellbeing = useMemo(() => getWellbeingInsight(state), [state.profile, state.reflections]);
  const focusFriction = useMemo(() => getFocusFrictionInsight(state), [state.distractionLogs, state.missions, state.profile]);
  const weeklyReview = useMemo(() => getWeeklyAfterActionReview(state), [state.distractionLogs, state.missionCompletions, state.missions, state.profile, state.progression, state.reflections]);
  /* eslint-enable react-hooks/exhaustive-deps */

  if (!ready) return <LoadingScreen label="Compiling command analytics…" />;

  const progressionByDate = new Map<string, number>();
  state.progression.forEach((event) => {
    const date = toLocalDate(event.occurredAt, state.profile.timezone);
    progressionByDate.set(date, (progressionByDate.get(date) ?? 0) + event.powerAwarded);
  });
  const powerSeries: ChartPoint[] = daySeries.map((day) => ({ label: day.label, value: progressionByDate.get(day.localDate) ?? 0 }));

  const timeByDate = new Map<string, number>();
  completionRecords.forEach((completion) => {
    const date = toLocalDate(completion.completedAt, state.profile.timezone);
    timeByDate.set(date, (timeByDate.get(date) ?? 0) + completion.durationMs / 3_600_000);
  });
  const timeSeries: ChartPoint[] = daySeries.map((day) => ({ label: day.label, value: timeByDate.get(day.localDate) ?? 0 }));

  const skillCounts = new Map<string, number>();
  state.reflections.forEach((reflection) => reflection.skills.forEach((skill) => skillCounts.set(skill, (skillCounts.get(skill) ?? 0) + 1)));
  const skillPoints = Array.from(skillCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value }));

  const emotionCounts = new Map<string, number>();
  state.reflections.forEach((reflection) => {
    if (reflection.feelingAfter) emotionCounts.set(reflection.feelingAfter, (emotionCounts.get(reflection.feelingAfter) ?? 0) + 1);
  });
  const emotionalPoints = ["charged", "steady", "restless", "drained", "great"].map((label) => ({ label, value: emotionCounts.get(label) ?? 0 }));

  const completionByReflectionId = new Map(completionRecords.filter((completion) => completion.reflectionId).map((completion) => [completion.reflectionId, completion]));
  const customGraphData = state.customGraphs.map((graph) => ({
    graph,
    series: graph.series.map((series) => ({
      ...series,
      points: state.reflections.slice(-12).map((reflection, index) => {
        const completion = completionByReflectionId.get(reflection.id);
        const value = series.metric === "miniAchievementRating" ? reflection.miniAchievementRating ?? 0
          : series.metric === "frictionRating" ? reflection.frictionRating ?? 0
          : series.metric === "provokingThoughtRating" ? reflection.provokingThoughtRating ?? 0
          : series.metric === "feelingAfter" ? reflection.feelingAfter ? feelingScore[reflection.feelingAfter] : 0
          : completion ? completion.durationMs / 3_600_000 : 0;
        const source = reflection.createdAt ? toLocalDate(reflection.createdAt, state.profile.timezone).slice(5) : String(index + 1);
        return { label: index === 0 || index === state.reflections.slice(-12).length - 1 || index === Math.floor(state.reflections.slice(-12).length / 2) ? source : "", value };
      }),
    })),
  }));

  const recentEmotionReflections = state.reflections.slice(-12);
  const emotionLabels = (index: number, reflection: typeof recentEmotionReflections[number]) => {
    const source = reflection.createdAt ? toLocalDate(reflection.createdAt, state.profile.timezone).slice(5) : String(index + 1);
    return index === 0 || index === recentEmotionReflections.length - 1 || index === Math.floor(recentEmotionReflections.length / 2) ? source : "";
  };
  const behavioralCharts = state.profile.emotionalCharts.map((chart) => {
    const pointsFor = (key: "energyBefore" | "energyAfter" | "focusQuality" | "frictionRating" | "stressLevel" | "clarityLevel" | "motivationLevel" | "distractionLevel") => recentEmotionReflections.map((reflection, index) => ({ label: emotionLabels(index, reflection), value: reflection[key] ?? 0 }));
    const definition = chart.id === "energy_shift"
      ? { detail: "Energy before and after your focused sessions", series: [{ id: "before", label: "Before", color: chart.color, points: pointsFor("energyBefore") }, { id: "after", label: "After", color: "#49D17D", points: pointsFor("energyAfter") }] }
      : chart.id === "focus_friction"
        ? { detail: "Focus quality compared with resistance", series: [{ id: "focus", label: "Focus", color: chart.color, points: pointsFor("focusQuality") }, { id: "friction", label: "Friction", color: "#FFAA4C", points: pointsFor("frictionRating") }] }
        : chart.id === "stress_clarity"
          ? { detail: "Stress load compared with mental clarity", series: [{ id: "stress", label: "Stress", color: chart.color, points: pointsFor("stressLevel") }, { id: "clarity", label: "Clarity", color: "#A78BFA", points: pointsFor("clarityLevel") }] }
          : { detail: "Motivation compared with environmental distraction", series: [{ id: "motivation", label: "Motivation", color: chart.color, points: pointsFor("motivationLevel") }, { id: "distraction", label: "Distraction", color: "#FF6B6B", points: pointsFor("distractionLevel") }] };
    return { chart, ...definition };
  });

  const sortedLifeline = [...state.lifeline].sort((a, b) => a.localDate.localeCompare(b.localDate));
  const manualLifeline = sortedLifeline.filter((point) => point.source === "manual");
  let runningLife = 0;
  let runningExperience = 0;
  const lifelinePower: ChartPoint[] = sortedLifeline.map((point) => {
    runningLife += point.lifePerformance;
    return { label: point.source === "manual" ? String(point.year) : point.localDate.slice(5), value: runningLife };
  });
  const lifelineExperience: ChartPoint[] = sortedLifeline.map((point) => {
    runningExperience += point.experience;
    return { label: point.source === "manual" ? String(point.year) : point.localDate.slice(5), value: runningExperience };
  });

  const submitLifelinePoint = () => {
    const year = Math.max(1900, Math.round(Number(birthYear)));
    const life = Number(lifePerformance);
    const experienceScore = Number(experience);
    if (!Number.isFinite(year) || !Number.isFinite(life) || !Number.isFinite(experienceScore)) {
      Alert.alert("Use valid values", "Your year and both Lifeline scores must be numeric.");
      return;
    }
    addLifelinePoint({ year, lifePerformance: life, experience: experienceScore, note: lifelineNote });
    setShowLifelineEditor(false);
    setLifelineNote("");
  };

  const timeAverages = getCalendarTimeAverages(state);

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenTitle
          eyebrow="Analytics suite"
          title="Command intelligence"
          detail="Every graph is calculated from your missions, reflections, rewards, and journal—not sample data."
          right={<IconAction icon="line.3.horizontal" label="Open settings" onPress={() => router.push("/settings")} />}
        />

        <View style={styles.metrics}>
          <MetricTile label="Total power" value={formatCompactNumber(getTotalPower(state))} detail="Tap for power ledger" icon="shield.fill" accent="#F4C95D" onPress={() => router.push("/analytics?metric=power" as never)} />
          <MetricTile label="Daily average" value={`${dashboard.averageDailyHours.toFixed(1)} h`} detail="Tap for daily detail" icon="timer" accent={colors.primary} onPress={() => router.push("/analytics?metric=daily" as never)} />
          <MetricTile label="Weekly average" value={`${timeAverages.weekDailyAverageHours.toFixed(1)} h`} detail="Tap for week detail" icon="chart.xyaxis.line" accent={colors.success} onPress={() => router.push("/analytics?metric=weekly" as never)} />
          <MetricTile label="Monthly average" value={`${timeAverages.monthDailyAverageHours.toFixed(1)} h`} detail="Tap for month detail" icon="target" accent={colors.warning} onPress={() => router.push("/analytics?metric=monthly" as never)} />
        </View>

        <TapFeedback onPress={() => router.push("/command-archive" as never)} accessibilityLabel="Open monthly command archive">
          <CommandCard accent="#A78BFA" style={styles.commandArchiveCard}>
            <View style={styles.commandArchiveHeading}>
              <View style={styles.commandArchiveCopy}>
                <Text style={[styles.commandArchiveEyebrow, { color: "#A78BFA" }]}>LIFETIME COMMAND RECORD</Text>
                <Text style={[styles.commandArchiveTitle, { color: colors.foreground }]}>Monthly command archive</Text>
                <Text style={[styles.commandArchiveDetail, { color: colors.muted }]}>Explore every recorded local year and month, with growth, focus, rewards, subjects, and friction kept in one read-only record.</Text>
              </View>
              <IconSymbol name="chevron.right" size={22} color="#A78BFA" />
            </View>
          </CommandCard>
        </TapFeedback>

        <TapFeedback onPress={() => router.push("/character-achievement-path" as never)} accessibilityLabel="Open character achievement path">
          <CommandCard accent="#F4C95D" style={styles.commandArchiveCard}>
            <View style={styles.commandArchiveHeading}>
              <View style={styles.commandArchiveCopy}>
                <Text style={[styles.commandArchiveEyebrow, { color: "#F4C95D" }]}>LIFETIME CHARACTER PATH</Text>
                <Text style={[styles.commandArchiveTitle, { color: colors.foreground }]}>Your earned form achievements</Text>
                <Text style={[styles.commandArchiveDetail, { color: colors.muted }]}>{state.characterMilestones.length ? `${state.characterMilestones.length} unlocked form${state.characterMilestones.length === 1 ? "" : "s"} · tap to follow the path` : "Your next earned form change will be recorded here automatically."}</Text>
              </View>
              <IconSymbol name="chevron.right" size={22} color="#F4C95D" />
            </View>
          </CommandCard>
        </TapFeedback>

        <TapFeedback onPress={() => router.push("/weekly-review" as never)} accessibilityLabel="Open weekly after-action review">
          <CommandCard accent="#F4C95D" style={styles.weeklyReviewCard}>
            <View style={styles.weeklyReviewHeading}>
              <View style={styles.weeklyReviewCopy}>
                <Text style={[styles.weeklyReviewEyebrow, { color: "#F4C95D" }]}>WEEKLY AFTER-ACTION</Text>
                <Text style={[styles.weeklyReviewTitle, { color: colors.foreground }]}>Review this week’s command record</Text>
                <Text style={[styles.weeklyReviewDetail, { color: colors.muted }]}>{(weeklyReview.investedMs / 3_600_000).toFixed(1)} h invested · {weeklyReview.completedMissions} mission{weeklyReview.completedMissions === 1 ? "" : "s"} completed</Text>
              </View>
              <IconSymbol name="chevron.right" size={22} color={colors.primary} />
            </View>
          </CommandCard>
        </TapFeedback>

        <SectionHeader title="Recognition window" />
        <View style={styles.recognitionGrid}>
          <RecognitionCard title="Wall of Fame" subtitle="Mini achievements rated above 3/5 remain here for 7 days." items={dashboard.wallOfFame.map((entry) => entry.miniAchievement)} icon="trophy.fill" accent="#F4C95D" onPress={() => router.push("/analytics?metric=fame" as never)} />
          <RecognitionCard title="Achievement Radar" subtitle="Tasks finishing with a Great feeling remain visible for 7 days." items={dashboard.achievementRadar.map((mission) => mission.title)} icon="star.fill" accent={colors.success} onPress={() => router.push("/analytics?metric=radar" as never)} />
        </View>

        <SectionHeader title="Power & time history" />
        <InteractiveChartCard title="Total Power by day" detail="Awarded power in the last 14 days" tag="POWER" onPress={() => router.push("/analytics?metric=power" as never)}>
          <LineTrendChart points={powerSeries} color="#F4C95D" accessibilityLabel="Total Power line chart over the last fourteen days" />
        </InteractiveChartCard>
        <InteractiveChartCard title="Time invested by day" detail="All task time is presented in hours" tag="HOURS" onPress={() => router.push("/analytics?metric=time" as never)}>
          <BarsChart points={timeSeries} color={colors.primary} accessibilityLabel="Invested time bar chart in hours over the last fourteen days" />
        </InteractiveChartCard>

        <SectionHeader title="Skill tree & distribution" />
        <View style={styles.distributionGrid}>
          <CommandCard accent={colors.primary} style={styles.distributionCard}>
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>Time distribution</Text>
            <View style={styles.centerChart}>
              <DonutChart points={dashboard.subjectDistribution.map((point) => ({ label: point.label, value: point.duration / 3_600_000 }))} centerValue={`${dashboard.subjectDistribution.length}`} centerLabel="SUBJECTS" accessibilityLabel="Time distribution by subject" />
            </View>
            <Legend points={dashboard.subjectDistribution.map((point) => ({ label: point.label, value: point.percentage * 100 }))} formatter={(value) => `${Math.round(value)}%`} />
          </CommandCard>
          <CommandCard accent={colors.success} style={styles.distributionCard}>
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>Category skill tree</Text>
            <View style={styles.centerChart}>
              <DonutChart points={dashboard.categoryDistribution.map((point) => ({ label: point.label, value: point.duration / 3_600_000 }))} centerValue={`${dashboard.categoryDistribution.length}`} centerLabel="BRANCHES" accessibilityLabel="Category distribution by invested time" />
            </View>
            <Legend points={dashboard.categoryDistribution.map((point) => ({ label: point.label, value: point.percentage * 100 }))} formatter={(value) => `${Math.round(value)}%`} />
          </CommandCard>
        </View>

        {state.profile.forecastEnabled ? <>
        <SectionHeader title="Pattern forecast" />
        <CommandCard accent={forecast.outlook === "momentum" ? colors.success : forecast.outlook === "fragile" ? colors.warning : colors.primary} style={styles.forecastCard}>
          <View style={styles.forecastHeading}>
            <View style={styles.forecastCopy}>
              <Text style={[styles.forecastEyebrow, { color: colors.primary }]}>FREE ON-DEVICE FORECAST</Text>
              <Text style={[styles.forecastTitle, { color: colors.foreground }]}>{forecast.headline}</Text>
            </View>
            <View style={[styles.forecastScore, { borderColor: `${colors.primary}66`, backgroundColor: `${colors.primary}15` }]}>
              <Text style={[styles.forecastScoreValue, { color: colors.primary }]}>{forecast.available ? forecast.score : "—"}</Text>
              <Text style={[styles.forecastScoreLabel, { color: colors.muted }]}>READINESS</Text>
            </View>
          </View>
          <Text style={[styles.forecastDetail, { color: colors.muted }]}>{forecast.detail}</Text>
          {state.profile.forecastShowSignals && forecast.signals.length ? <View style={styles.forecastSignals}>{forecast.signals.map((signal) => <View key={signal.label} style={[styles.forecastSignal, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.forecastSignalLabel, { color: colors.muted }]}>{signal.label}</Text>
            <Text style={[styles.forecastSignalValue, { color: signal.direction === "down" ? colors.warning : signal.direction === "up" ? colors.success : colors.foreground }]}>{signal.value}%</Text>
          </View>)}</View> : null}
          <StatusPill label={`${forecast.confidence.toUpperCase()} · ${forecast.sampleSize} SIGNAL${forecast.sampleSize === 1 ? "" : "S"}`} tone={forecast.available ? "primary" : "neutral"} icon="chart.xyaxis.line" />
        </CommandCard>
        </> : null}

        <SectionHeader title="Wellbeing insight" />
        <TapFeedback onPress={() => router.push("/wellbeing-insight" as never)} accessibilityLabel="Open non-clinical wellbeing insight">
          <CommandCard accent={wellbeing.available ? wellbeing.balanceScore >= 68 ? colors.success : wellbeing.balanceScore >= 45 ? colors.warning : colors.error : colors.primary} style={styles.wellbeingCard}>
            <View style={styles.wellbeingHeading}>
              <View style={styles.wellbeingCopy}>
                <Text style={[styles.wellbeingEyebrow, { color: colors.primary }]}>NON-CLINICAL · PRIVATE REFLECTION</Text>
                <Text style={[styles.wellbeingTitle, { color: colors.foreground }]}>{wellbeing.headline}</Text>
              </View>
              <View style={[styles.wellbeingScore, { borderColor: `${colors.primary}55`, backgroundColor: `${colors.primary}14` }]}>
                <Text style={[styles.wellbeingScoreValue, { color: colors.primary }]}>{wellbeing.available ? wellbeing.balanceScore : "—"}</Text>
                <Text style={[styles.wellbeingScoreLabel, { color: colors.muted }]}>BALANCE</Text>
              </View>
            </View>
            <Text style={[styles.wellbeingDetail, { color: colors.muted }]}>{wellbeing.available ? wellbeing.trend.summary : wellbeing.summary}</Text>
            <View style={styles.wellbeingFooter}>
              <StatusPill label={wellbeing.available ? `${wellbeing.confidence.toUpperCase()} · ${wellbeing.sampleSize} LOG${wellbeing.sampleSize === 1 ? "" : "S"}` : "AWAITING DEBRIEF"} tone={wellbeing.available ? "primary" : "neutral"} icon="shield.fill" />
              <Text style={[styles.wellbeingOpen, { color: colors.primary }]}>VIEW DETAIL ›</Text>
            </View>
          </CommandCard>
        </TapFeedback>

        <SectionHeader title="Focus friction" />
        <CommandCard accent={colors.warning} style={styles.frictionCard}>
          {focusFriction.total ? <>
            <View style={styles.frictionHeading}>
              <View style={styles.frictionCopy}>
                <Text style={[styles.frictionEyebrow, { color: colors.warning }]}>PRIVATE · LAST 14 DAYS</Text>
                <Text style={[styles.frictionTitle, { color: colors.foreground }]}>{focusFriction.total} disruption{focusFriction.total === 1 ? "" : "s"} logged</Text>
              </View>
              <StatusPill label={`TOP · ${focusFriction.topCategory?.label.toUpperCase()}`} tone="warning" />
            </View>
            <Text style={[styles.frictionDetail, { color: colors.muted }]}>Most interrupted window: {focusFriction.timeWindow}. {focusFriction.recentMission ? `${focusFriction.recentMission.title} recorded ${focusFriction.recentMission.count}.` : ""}</Text>
            <View style={styles.frictionBars}>{focusFriction.categoryCounts.map((entry) => <View key={entry.category} style={styles.frictionBarRow}><Text numberOfLines={1} style={[styles.frictionBarLabel, { color: colors.muted }]}>{entry.label}</Text><View style={[styles.frictionBarTrack, { backgroundColor: colors.background }]}><View style={[styles.frictionBarFill, { backgroundColor: colors.warning, width: `${Math.max(12, (entry.count / Math.max(focusFriction.topCategory?.count ?? 1, 1)) * 100)}%` }]} /></View><Text style={[styles.frictionBarValue, { color: colors.foreground }]}>{entry.count}</Text></View>)}</View>
          </> : <View style={styles.frictionEmpty}><Text style={[styles.frictionTitle, { color: colors.foreground }]}>No distraction signals logged yet.</Text><Text style={[styles.frictionDetail, { color: colors.muted }]}>Your private focus log will appear here after you record a live-mission interruption.</Text></View>}
        </CommandCard>

        <SectionHeader title="Emotional intelligence" />
        <InteractiveChartCard title="Emotional radar" detail="How you tend to feel after finishing work" tag="INSIGHT" onPress={() => router.push("/analytics?metric=emotion" as never)}>
          {state.reflections.length ? <RadarChart points={emotionalPoints} color={colors.warning} accessibilityLabel="Emotional radar based on post-mission feeling data" /> : <NoData label="Complete a mission debrief to reveal emotional patterns." icon="star.fill" />}
        </InteractiveChartCard>
        <InteractiveChartCard title="Skill radar" detail="Skills you logged during post-mission reflection" tag="GROWTH" onPress={() => router.push("/analytics?metric=skills" as never)}>
          {skillPoints.length ? <RadarChart points={skillPoints} color={colors.primary} accessibilityLabel="Skill radar based on learned skills" /> : <NoData label="Add skills to a long-mission debrief to map your growth." icon="target" />}
        </InteractiveChartCard>

        <SectionHeader title="Behavioral tendency lenses" action="Customize" onAction={() => router.push("/customize" as never)} />
        <Text style={[styles.behavioralIntro, { color: colors.muted }]}>These visualizations reveal patterns in your own reported context. They are reflective trend tools, not clinical predictions.</Text>
        <View style={styles.behavioralStack}>
          {behavioralCharts.filter(({ chart }) => chart.enabled).map(({ chart, detail, series }) => (
            <InteractiveChartCard key={chart.id} title={chart.title} detail={detail} tag="PATTERN" onPress={() => router.push("/analytics?metric=emotion" as never)}>
              {recentEmotionReflections.length ? <MultiLineTrendChart series={series} accessibilityLabel={`${chart.title} behavioral trend chart`} /> : <NoData label="Complete a long-mission debrief to reveal this perspective." icon="chart.xyaxis.line" />}
            </InteractiveChartCard>
          ))}
        </View>

        <SectionHeader title="Lifeline graph" action="Add baseline" onAction={() => setShowLifelineEditor((value) => !value)} />
        {showLifelineEditor ? (
          <CommandCard accent={colors.success} style={styles.lifelineEditor}>
            <Text style={[styles.editorTitle, { color: colors.foreground }]}>Add a Lifeline baseline</Text>
            <Text style={[styles.editorDetail, { color: colors.muted }]}>Record a year from your life history. Daily journal points remain a separate, derived contribution.</Text>
            <View style={styles.editorRow}>
              <TextInput value={birthYear} onChangeText={setBirthYear} keyboardType="number-pad" placeholder="Year" placeholderTextColor={colors.muted} style={[styles.editorInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
              <TextInput value={lifePerformance} onChangeText={setLifePerformance} keyboardType="decimal-pad" placeholder="Life" placeholderTextColor={colors.muted} style={[styles.editorInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
              <TextInput value={experience} onChangeText={setExperience} keyboardType="decimal-pad" placeholder="Experience" placeholderTextColor={colors.muted} style={[styles.editorInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
            </View>
            <TextInput value={lifelineNote} onChangeText={setLifelineNote} placeholder="Optional note" placeholderTextColor={colors.muted} style={[styles.noteInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
            <CommandButton label="Add baseline" icon="plus" onPress={submitLifelinePoint} />
          </CommandCard>
        ) : null}
        <InteractiveChartCard title="Life Performance vs Experience" detail="Tap to inspect baseline entries. Cyan is cumulative Life Performance; green is cumulative Experience." tag={showLifelineDetails ? "DETAIL" : "LIFELINE"} onPress={() => setShowLifelineDetails((value) => !value)}>
          {lifelinePower.length ? <LineTrendChart points={lifelinePower} secondaryPoints={lifelineExperience} color={colors.primary} secondaryColor={colors.success} accessibilityLabel="Dual-line Lifeline graph for life performance and experience" /> : <NoData label="Add a historical baseline or journal entry to begin your Lifeline graph." icon="chart.xyaxis.line" />}
        </InteractiveChartCard>
        {showLifelineDetails ? <CommandCard accent={colors.primary} style={styles.lifelineDetailDrawer}>
          <View style={styles.lifelineDrawerHeading}>
            <View><Text style={[styles.editorTitle, { color: colors.foreground }]}>Lifeline detail</Text><Text style={[styles.editorDetail, { color: colors.muted }]}>Manual baselines can be removed here. Journal-derived signals remain linked to your daily journal.</Text></View>
            <StatusPill label={`${manualLifeline.length} MANUAL`} tone="primary" icon="chart.xyaxis.line" />
          </View>
          {manualLifeline.length ? manualLifeline.map((point) => <CommandCard key={point.id} accent={colors.primary} style={styles.manualLifelineCard}>
            <View style={styles.manualLifelineCopy}>
              <Text style={[styles.manualLifelineTitle, { color: colors.foreground }]}>{point.year} baseline</Text>
              <Text style={[styles.manualLifelineDetail, { color: colors.muted }]}>Life {point.lifePerformance} · Experience {point.experience}{point.note ? ` · ${point.note}` : ""}</Text>
            </View>
            <CommandButton label="Delete" variant="danger" onPress={() => Alert.alert("Delete Lifeline baseline?", "This removes only this manual record. Your journal contributions remain unchanged.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => removeLifelinePoint(point.id) }])} />
          </CommandCard>) : <NoData label="No manual baselines yet. Use Add baseline above to create one." icon="chart.xyaxis.line" />}
        </CommandCard> : null}

        <SectionHeader title="Custom analytics workspace" />
        <CommandCard accent={colors.primary} style={styles.customAnalyticsCard}>
          <View style={styles.customAnalyticsCopy}>
            <Text style={[styles.customAnalyticsTitle, { color: colors.foreground }]}>Dashboard within Dashboard</Text>
            <Text style={[styles.customAnalyticsDetail, { color: colors.muted }]}>Build up to six views with your own metric, chart style, exact date range, feature source, subject, category, and recurrence filters. Your existing Command Intelligence dashboard stays unchanged.</Text>
          </View>
          <CommandButton label="Open Custom Analytics" icon="chart.xyaxis.line" onPress={() => router.push("/custom-dashboard" as never)} />
        </CommandCard>

        <SectionHeader title="Custom graph slots" action="Configure" onAction={() => router.push("/customize")} />
        <View style={styles.customGraphStack}>
          {customGraphData.map(({ graph, series }, index) => (
            <CommandCard key={graph.id} accent={index === 0 ? colors.primary : index === 1 ? colors.success : "#F4C95D"} style={styles.customGraphCard}>
              <View style={styles.customGraphHeading}>
                <View>
                  <Text style={[styles.customGraphTitle, { color: colors.foreground }]}>{graph.title || `Custom graph ${index + 1}`}</Text>
                  <Text style={[styles.customGraphDetail, { color: colors.muted }]}>{series.length ? `${series.length}/5 post-mission metrics shown` : "Choose up to five reflection metrics in customization."}</Text>
                </View>
                <StatusPill label={graph.enabled ? "READY" : "OFF"} tone={graph.enabled ? "primary" : "neutral"} />
              </View>
              {graph.enabled && series.length && state.reflections.length ? <MultiLineTrendChart series={series} accessibilityLabel={`${graph.title || `Custom graph ${index + 1}`} with ${series.map((item) => item.label).join(", ")}`} /> : <NoData label={graph.enabled ? "Configure a metric and complete a mission debrief to reveal this graph." : "Enable this graph in customization when you are ready to use it."} icon="chart.xyaxis.line" />}
              <CommandButton label="Customize" icon="gearshape.fill" variant="secondary" onPress={() => router.push("/customize")} />
            </CommandCard>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function RecognitionCard({ title, subtitle, items, icon, accent, onPress }: { title: string; subtitle: string; items: string[]; icon: "trophy.fill" | "star.fill"; accent: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.recognitionSlot}>
      <TapFeedback onPress={onPress} style={styles.recognitionTap} accessibilityLabel={`Open ${title}`}>
        <View style={[styles.recognitionCard, { backgroundColor: colors.surface, borderColor: `${accent}55` }]}> 
          <View style={[styles.recognitionIcon, { backgroundColor: `${accent}18` }]}><IconSymbol name={icon} size={20} color={accent} /></View>
          <Text numberOfLines={2} style={[styles.recognitionTitle, { color: colors.foreground }]}>{title}</Text>
          <Text numberOfLines={3} ellipsizeMode="tail" style={[styles.recognitionDetail, { color: colors.muted }]}>{items.length ? items.slice(0, 2).join(" · ") : subtitle}</Text>
          <View style={styles.recognitionPill}><StatusPill label={items.length ? `${items.length} LIVE` : "AWAITING DATA"} tone={items.length ? "success" : "neutral"} /></View>
        </View>
      </TapFeedback>
    </View>
  );
}

function InteractiveChartCard({ title, detail, tag, onPress, children }: { title: string; detail: string; tag: string; onPress: () => void; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <TapFeedback onPress={onPress} accessibilityLabel={`Open ${title}`}>
      <CommandCard accent={colors.primary} style={styles.chartCard}>
        <View style={styles.chartHeading}>
          <View style={styles.chartCopy}>
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>{title}</Text>
            <Text style={[styles.chartDetail, { color: colors.muted }]}>{detail}</Text>
          </View>
          <StatusPill label={tag} tone="primary" />
        </View>
        {children}
      </CommandCard>
    </TapFeedback>
  );
}

function NoData({ label, icon }: { label: string; icon: "star.fill" | "target" | "chart.xyaxis.line" }) {
  const colors = useColors();
  return (
    <View style={styles.noData}>
      <IconSymbol name={icon} size={22} color={colors.muted} />
      <Text style={[styles.noDataText, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

function Legend({ points, formatter }: { points: ChartPoint[]; formatter: (value: number) => string }) {
  const colors = useColors();
  return (
    <View style={styles.legend}>
      {points.slice(0, 3).map((point, index) => <Text key={`${point.label}-${index}`} numberOfLines={1} style={[styles.legendText, { color: colors.muted }]}>{point.label}: {formatter(point.value)}</Text>)}
      {!points.length ? <Text style={[styles.legendText, { color: colors.muted }]}>No completed mission time yet.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingTop: 12, paddingBottom: 28 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  commandArchiveCard: { gap: 8 },
  commandArchiveHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  commandArchiveCopy: { flex: 1, gap: 3 },
  commandArchiveEyebrow: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.9 },
  commandArchiveTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  commandArchiveDetail: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  weeklyReviewCard: { gap: 8 },
  weeklyReviewHeading: { flexDirection: "row", alignItems: "center", gap: 11 },
  weeklyReviewCopy: { flex: 1, gap: 3 },
  weeklyReviewEyebrow: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.85 },
  weeklyReviewTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  weeklyReviewDetail: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  behavioralIntro: { fontSize: 12, lineHeight: 17, fontWeight: "600", marginTop: -7 },
  wellbeingCard: { gap: 10 },
  wellbeingHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  wellbeingCopy: { flex: 1, gap: 3 },
  wellbeingEyebrow: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.85 },
  wellbeingTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  wellbeingScore: { width: 62, height: 62, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  wellbeingScoreValue: { fontSize: 21, lineHeight: 25, fontWeight: "900" },
  wellbeingScoreLabel: { fontSize: 7, lineHeight: 10, fontWeight: "900", letterSpacing: 0.55 },
  wellbeingDetail: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  wellbeingFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  wellbeingOpen: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.65 },
  frictionCard: { gap: 11 },
  frictionHeading: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  frictionCopy: { flex: 1, gap: 3 },
  frictionEyebrow: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.85 },
  frictionTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  frictionDetail: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  frictionBars: { gap: 7 },
  frictionBarRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  frictionBarLabel: { width: 88, fontSize: 10, lineHeight: 14, fontWeight: "700" },
  frictionBarTrack: { flex: 1, height: 7, overflow: "hidden", borderRadius: 99 },
  frictionBarFill: { height: "100%", borderRadius: 99 },
  frictionBarValue: { minWidth: 14, textAlign: "right", fontSize: 11, lineHeight: 14, fontWeight: "900" },
  frictionEmpty: { minHeight: 78, justifyContent: "center", gap: 4 },
  behavioralStack: { gap: 12 },
  forecastCard: { gap: 12 },
  forecastHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  forecastCopy: { flex: 1, gap: 3 },
  forecastEyebrow: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.9 },
  forecastTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  forecastScore: { width: 66, height: 66, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  forecastScoreValue: { fontSize: 23, lineHeight: 27, fontWeight: "900" },
  forecastScoreLabel: { fontSize: 7, lineHeight: 10, fontWeight: "900", letterSpacing: 0.7 },
  forecastDetail: { fontSize: 12, lineHeight: 18, fontWeight: "500" },
  forecastSignals: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  forecastSignal: { minWidth: "30%", flexGrow: 1, borderWidth: StyleSheet.hairlineWidth, borderRadius: 11, paddingHorizontal: 9, paddingVertical: 8, gap: 2 },
  forecastSignalLabel: { fontSize: 9, lineHeight: 12, fontWeight: "800" },
  forecastSignalValue: { fontSize: 14, lineHeight: 18, fontWeight: "900" },
  manualLifelineStack: { gap: 9 },
  lifelineDetailDrawer: { gap: 10 },
  lifelineDrawerHeading: { flexDirection: "row", justifyContent: "space-between", gap: 10, alignItems: "flex-start" },
  manualLifelineCard: { padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  manualLifelineCopy: { flex: 1, gap: 2 },
  manualLifelineTitle: { fontSize: 13, lineHeight: 18, fontWeight: "900" },
  manualLifelineDetail: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  recognitionGrid: { width: "100%", flexDirection: "row", alignItems: "stretch", gap: RECOGNITION_WINDOW_LAYOUT.gap },
  recognitionSlot: { flex: 1, minWidth: 0, alignSelf: "stretch" },
  recognitionTap: { flex: 1, alignSelf: "stretch" },
  recognitionCard: { width: "100%", height: RECOGNITION_WINDOW_LAYOUT.cardHeight, minHeight: RECOGNITION_WINDOW_LAYOUT.cardHeight, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 13, gap: 7, overflow: "hidden" },
  recognitionIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  recognitionTitle: { minHeight: 38, flexShrink: 1, fontSize: 14, lineHeight: 19, fontWeight: "900" },
  recognitionDetail: { flex: 1, minHeight: 48, fontSize: 11, lineHeight: 16, fontWeight: "500" },
  recognitionPill: { alignSelf: "flex-start", marginTop: "auto", maxWidth: "100%" },
  chartCard: { gap: 13 },
  chartHeading: { flexDirection: "row", justifyContent: "space-between", gap: 10, alignItems: "flex-start" },
  chartCopy: { flex: 1 },
  chartTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  chartDetail: { fontSize: 11, lineHeight: 16, marginTop: 2, fontWeight: "500" },
  distributionGrid: { gap: 11 },
  distributionCard: { alignItems: "center", gap: 8 },
  centerChart: { alignItems: "center", justifyContent: "center" },
  legend: { alignSelf: "stretch", gap: 3 },
  legendText: { fontSize: 11, lineHeight: 15, fontWeight: "600" },
  noData: { minHeight: 110, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 18 },
  noDataText: { fontSize: 12, lineHeight: 17, fontWeight: "600", textAlign: "center" },
  lifelineEditor: { gap: 10 },
  editorTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  editorDetail: { fontSize: 12, lineHeight: 17, fontWeight: "500", marginTop: -5 },
  editorRow: { flexDirection: "row", gap: 8 },
  editorInput: { flex: 1, minHeight: 44, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 9, textAlign: "center", fontSize: 12, lineHeight: 16, fontWeight: "700" },
  noteInput: { minHeight: 44, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 11, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  customGraphStack: { gap: 10 },
  customAnalyticsCard: { gap: 12 },
  customAnalyticsCopy: { gap: 4 },
  customAnalyticsTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  customAnalyticsDetail: { fontSize: 12, lineHeight: 18, fontWeight: "600" },
  customGraphCard: { gap: 11 },
  customGraphHeading: { flexDirection: "row", justifyContent: "space-between", gap: 10, alignItems: "flex-start" },
  customGraphTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  customGraphDetail: { fontSize: 11, lineHeight: 16, marginTop: 2, fontWeight: "500" },
});
