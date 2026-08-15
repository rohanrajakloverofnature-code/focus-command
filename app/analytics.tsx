import { router, useLocalSearchParams } from "expo-router";
import { memo, useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { CommandButton, CommandCard, IconAction, LoadingScreen, ScreenTitle, StatusPill } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { formatCompactNumber, formatHours, getCalendarTimeAverages, getDashboardStats, getMissionCompletionRecords, getTotalPower, toLocalDate, useFocusCommandReady, useFocusCommandSelector, type FocusState } from "@/lib/focus-command";

type MetricKey = "power" | "daily" | "weekly" | "monthly" | "time" | "fame" | "radar" | "emotion" | "skills" | "lifeline";

type EntryTone = "gold" | "primary" | "success" | "warning";

type AnalyticsEntry = { id: string; title: string; detail: string; date: string; tone: EntryTone };

type AnalyticsDependencies = Pick<FocusState,
  "profile"
  | "missions"
  | "missionCompletions"
  | "reflections"
  | "progression"
  | "lifeline"
>;

type MetricMeta = { title: string; detail: string; icon: "chart.xyaxis.line" | "trophy.fill" | "star.fill" | "target" | "shield.fill" | "timer" };

const META: Record<MetricKey, MetricMeta> = {
  power: { title: "Total Power", detail: "All immutable progression awards earned from completed command work.", icon: "shield.fill" },
  daily: { title: "Daily Average", detail: "Lifetime average invested time across calendar days on which you completed work.", icon: "timer" },
  weekly: { title: "Weekly Average", detail: "Week-to-date average across every elapsed day from Monday through today, including zero-work days.", icon: "chart.xyaxis.line" },
  monthly: { title: "Monthly Average", detail: "Month-to-date average across every elapsed calendar day through today, including zero-work days.", icon: "target" },
  time: { title: "Invested Time", detail: "Exact active task time after every pause is removed.", icon: "timer" },
  fame: { title: "Wall of Fame", detail: "Mini achievements rated above 3/5 during their seven-day display window.", icon: "trophy.fill" },
  radar: { title: "Achievement Radar", detail: "Tasks whose post-mission feeling was logged as Great during their seven-day display window.", icon: "star.fill" },
  emotion: { title: "Emotional Insight", detail: "Post-mission feelings and reflection signals.", icon: "target" },
  skills: { title: "Skill Growth", detail: "Skills recorded in long-mission reflection debriefs.", icon: "target" },
  lifeline: { title: "Lifeline", detail: "Historical baseline data plus daily journal-derived increments.", icon: "chart.xyaxis.line" },
};

function isMetricKey(value: string | undefined): value is MetricKey {
  return Boolean(value && value in META);
}

function addCalendarDays(localDate: string, amount: number) {
  const [year, month, day] = localDate.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function calendarDates(start: string, end: string) {
  const dates: string[] = [];
  let date = start;
  while (date <= end) {
    dates.push(date);
    date = addCalendarDays(date, 1);
  }
  return dates;
}

function formatCalendarDate(localDate: string) {
  const [year, month, day] = localDate.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function hoursByDate(state: FocusState) {
  const values = new Map<string, { hours: number; missionCount: number }>();
  getMissionCompletionRecords(state).forEach((completion) => {
    const localDate = toLocalDate(completion.completedAt, state.profile.timezone);
    const prior = values.get(localDate) ?? { hours: 0, missionCount: 0 };
    values.set(localDate, { hours: prior.hours + completion.durationMs / 3_600_000, missionCount: prior.missionCount + 1 });
  });
  return values;
}

function selectAnalyticsDependencies(state: FocusState): AnalyticsDependencies {
  return {
    profile: state.profile,
    missions: state.missions,
    missionCompletions: state.missionCompletions,
    reflections: state.reflections,
    progression: state.progression,
    lifeline: state.lifeline,
  };
}

function hasSameAnalyticsDependencies(left: AnalyticsDependencies, right: AnalyticsDependencies) {
  return left.profile === right.profile
    && left.missions === right.missions
    && left.missionCompletions === right.missionCompletions
    && left.reflections === right.reflections
    && left.progression === right.progression
    && left.lifeline === right.lifeline;
}

const AnalyticsEntryCard = memo(function AnalyticsEntryCard({ entry }: { entry: AnalyticsEntry }) {
  const colors = useColors();
  const accent = entry.tone === "gold" ? "#F4C95D" : entry.tone === "success" ? colors.success : entry.tone === "warning" ? colors.warning : colors.primary;
  const pillTone = entry.tone === "gold" ? "gold" : entry.tone === "success" ? "success" : entry.tone === "warning" ? "warning" : "primary";
  return (
    <CommandCard accent={accent} style={styles.entry}>
      <View style={styles.entryTopline}>
        <Text style={[styles.entryTitle, { color: colors.foreground }]}>{entry.title}</Text>
        <StatusPill label={formatCalendarDate(entry.date)} tone={pillTone} />
      </View>
      <Text style={[styles.entryDetail, { color: colors.muted }]}>{entry.detail}</Text>
    </CommandCard>
  );
});

export default function AnalyticsDetailScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ metric?: string }>();
  const metric: MetricKey = isMetricKey(params.metric) ? params.metric : "power";
  const state = useFocusCommandSelector(selectAnalyticsDependencies, hasSameAnalyticsDependencies) as FocusState;
  const ready = useFocusCommandReady();

  const meta = META[metric];
  /* eslint-disable react-hooks/exhaustive-deps -- Analytics accepts the narrowed FocusState-compatible snapshot, and these dependency lists intentionally follow only the sources each existing derivation reads. */
  const dashboard = useMemo(
    () => getDashboardStats(state as FocusState),
    [state.missionCompletions, state.missions, state.profile, state.progression, state.reflections],
  );
  const { calculation, entries } = useMemo(() => {
    const timeAverages = getCalendarTimeAverages(state);
    const timeByDate = hoursByDate(state);
    const completedMissions = getMissionCompletionRecords(state);
    const totalHours = completedMissions.reduce((sum, completion) => sum + completion.durationMs, 0) / 3_600_000;
    const activeDayCount = timeByDate.size;
    const power = getTotalPower(state);
    const periodDates = metric === "weekly"
      ? calendarDates(timeAverages.weekStart, timeAverages.today)
      : metric === "monthly"
        ? calendarDates(timeAverages.monthStart, timeAverages.today)
        : [];
    const dayEntries: AnalyticsEntry[] = periodDates.map((date) => {
      const summary = timeByDate.get(date) ?? { hours: 0, missionCount: 0 };
      return {
        id: `day-${date}`,
        title: formatCalendarDate(date),
        detail: summary.missionCount ? `${summary.hours.toFixed(1)} h from ${summary.missionCount} completed mission${summary.missionCount === 1 ? "" : "s"}` : "0.0 h · no completed mission logged",
        date,
        tone: summary.hours > 0 ? "primary" : "warning",
      };
    });
    const activeDayEntries: AnalyticsEntry[] = [...timeByDate.entries()].map(([date, summary]) => ({
      id: `active-${date}`,
      title: formatCalendarDate(date),
      detail: `${summary.hours.toFixed(1)} h from ${summary.missionCount} completed mission${summary.missionCount === 1 ? "" : "s"}`,
      date,
      tone: "primary" as const,
    }));
    const metricEntries: AnalyticsEntry[] = metric === "power"
      ? state.progression.map((event) => ({ id: event.id, title: event.note, detail: `${formatCompactNumber(event.powerAwarded)} power · ${event.comboMultiplier.toFixed(2)}× combo · ${event.goldAwarded} gold`, date: toLocalDate(event.occurredAt, state.profile.timezone), tone: "gold" as const }))
      : metric === "daily"
        ? activeDayEntries
        : metric === "weekly" || metric === "monthly"
          ? dayEntries
          : metric === "time"
            ? completedMissions.map((completion) => ({ id: completion.id, title: completion.title, detail: `${formatHours(completion.durationMs)} · ${completion.subject} · ${completion.category}`, date: toLocalDate(completion.completedAt, state.profile.timezone), tone: "primary" as const }))
            : metric === "fame"
              ? dashboard.wallOfFame.map((entry) => ({ id: entry.id, title: entry.miniAchievement, detail: `${entry.missionTitle} · ${entry.miniAchievementRating}/5 mini achievement · visible for 7 days`, date: toLocalDate(entry.occurredAt, state.profile.timezone), tone: "gold" as const }))
              : metric === "radar"
                ? dashboard.achievementRadar.map((completion) => ({ id: completion.id, title: completion.title, detail: "After-feeling logged as Great · visible for 7 days", date: toLocalDate(completion.completedAt, state.profile.timezone), tone: "success" as const }))
                : metric === "emotion"
                  ? state.reflections.map((reflection) => ({ id: reflection.id, title: state.missions.find((mission) => mission.id === reflection.missionId)?.title ?? "Mission reflection", detail: `Before: ${reflection.feelingBefore ?? "not logged"} · After: ${reflection.feelingAfter ?? "not logged"} · Friction: ${reflection.frictionRating ?? "–"}/5`, date: toLocalDate(reflection.createdAt, state.profile.timezone), tone: "warning" as const }))
                  : metric === "skills"
                    ? state.reflections.filter((reflection) => reflection.skills.length).map((reflection) => ({ id: reflection.id, title: state.missions.find((mission) => mission.id === reflection.missionId)?.title ?? "Mission reflection", detail: reflection.skills.join(" · "), date: toLocalDate(reflection.createdAt, state.profile.timezone), tone: "primary" as const }))
                    : state.lifeline.map((point) => ({ id: point.id, title: point.source === "manual" ? `Historical baseline · ${point.year}` : `Journal contribution · ${point.localDate}`, detail: `Life Performance ${point.lifePerformance} · Experience ${point.experience}${point.note ? ` · ${point.note}` : ""}`, date: point.localDate, tone: point.source === "manual" ? "primary" as const : "success" as const }));
    const metricCalculation = metric === "power"
    ? { value: formatCompactNumber(power), label: "CURRENT TOTAL", formula: "Sum of immutable awarded power events", detail: `${state.progression.length} progression event${state.progression.length === 1 ? "" : "s"} are included.` }
    : metric === "daily"
      ? { value: `${dashboard.averageDailyHours.toFixed(1)} h`, label: "LIFETIME DAILY AVERAGE", formula: `${totalHours.toFixed(1)} total hours ÷ ${activeDayCount} active completion day${activeDayCount === 1 ? "" : "s"}`, detail: activeDayCount ? "Only calendar days with a completed mission are included in this lifetime active-day average." : "No completed missions are available yet." }
      : metric === "weekly"
        ? { value: `${timeAverages.weekDailyAverageHours.toFixed(1)} h`, label: "WEEK-TO-DATE DAILY AVERAGE", formula: `${timeAverages.weekTotalHours.toFixed(1)} total hours ÷ ${timeAverages.weekElapsedDays} elapsed calendar day${timeAverages.weekElapsedDays === 1 ? "" : "s"}`, detail: `${formatCalendarDate(timeAverages.weekStart)} through ${formatCalendarDate(timeAverages.today)}. Zero-work days remain in the denominator.` }
        : metric === "monthly"
          ? { value: `${timeAverages.monthDailyAverageHours.toFixed(1)} h`, label: "MONTH-TO-DATE DAILY AVERAGE", formula: `${timeAverages.monthTotalHours.toFixed(1)} total hours ÷ ${timeAverages.monthElapsedDays} elapsed calendar day${timeAverages.monthElapsedDays === 1 ? "" : "s"}`, detail: `${formatCalendarDate(timeAverages.monthStart)} through ${formatCalendarDate(timeAverages.today)}. Zero-work days remain in the denominator.` }
          : { value: "SOURCE", label: "TRACEABLE ANALYTICS", formula: "Records displayed below drive this analytic view", detail: "Each Dashboard number can be inspected rather than treated as a black box." };
    return { calculation: metricCalculation, entries: metricEntries.slice().sort((left, right) => right.date.localeCompare(left.date)) };
  }, [
    dashboard,
    metric,
    state.lifeline,
    state.missionCompletions,
    state.missions,
    state.profile,
    state.progression,
    state.reflections,
  ]);
  /* eslint-enable react-hooks/exhaustive-deps */

  if (!ready) return <LoadingScreen label="Opening analytic source data…" />;

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]}>
      <FlatList
        data={entries}
        keyExtractor={(entry) => entry.id}
        renderItem={({ item }) => <AnalyticsEntryCard entry={item} />}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        updateCellsBatchingPeriod={16}
        windowSize={7}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={(
          <View style={styles.header}>
            <ScreenTitle eyebrow="Data source" title={meta.title} detail={meta.detail} right={<IconAction icon="xmark" label="Close analytics detail" onPress={() => router.back()} />} />
            <CommandCard accent={metric === "power" ? "#F4C95D" : metric === "weekly" ? colors.success : metric === "monthly" ? colors.warning : colors.primary} style={styles.calculation}>
              <View style={styles.calculationTopline}>
                <View style={[styles.calculationIcon, { backgroundColor: `${colors.primary}18` }]}><IconSymbol name={meta.icon} size={22} color={colors.primary} /></View>
                <View style={styles.calculationCopy}>
                  <Text style={[styles.calculationLabel, { color: colors.muted }]}>{calculation.label}</Text>
                  <Text style={[styles.calculationValue, { color: colors.foreground }]}>{calculation.value}</Text>
                </View>
              </View>
              <Text style={[styles.formulaLabel, { color: colors.primary }]}>CALCULATION</Text>
              <Text style={[styles.formula, { color: colors.foreground }]}>{calculation.formula}</Text>
              <Text style={[styles.calculationDetail, { color: colors.muted }]}>{calculation.detail}</Text>
            </CommandCard>
            <CommandCard accent={colors.primary} style={styles.explainer}>
              <IconSymbol name="chart.xyaxis.line" size={25} color={colors.primary} />
              <View style={styles.explainerCopy}>
                <Text style={[styles.explainerTitle, { color: colors.foreground }]}>Traceable analytics</Text>
                <Text style={[styles.explainerText, { color: colors.muted }]}>The records below are the current source data for this metric. Weekly and monthly views explicitly show every elapsed calendar day, including days with no completed work.</Text>
              </View>
            </CommandCard>
          </View>
        )}
        ListHeaderComponentStyle={styles.headerSpacing}
        ItemSeparatorComponent={() => <View style={styles.entrySeparator} />}
        ListEmptyComponent={(
          <CommandCard accent={colors.border} style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No source records yet</Text>
            <Text style={[styles.emptyDetail, { color: colors.muted }]}>Complete missions, log reflections, or add Lifeline baselines to populate this analytic view.</Text>
            <CommandButton label="Return to dashboard" icon="chart.xyaxis.line" onPress={() => router.replace("/dashboard" as never)} />
          </CommandCard>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 10, paddingBottom: 28 },
  header: { gap: 16 },
  headerSpacing: { marginBottom: 16 },
  entrySeparator: { height: 10 },
  calculation: { gap: 9 },
  calculationTopline: { flexDirection: "row", alignItems: "center", gap: 11 },
  calculationIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  calculationCopy: { flex: 1 },
  calculationLabel: { fontSize: 10, lineHeight: 14, letterSpacing: 0.8, fontWeight: "900" },
  calculationValue: { fontSize: 29, lineHeight: 34, fontWeight: "900", letterSpacing: -0.5, marginTop: 1 },
  formulaLabel: { fontSize: 10, lineHeight: 14, letterSpacing: 0.85, fontWeight: "900", marginTop: 2 },
  formula: { fontSize: 14, lineHeight: 20, fontWeight: "800" },
  calculationDetail: { fontSize: 12, lineHeight: 18, fontWeight: "500" },
  explainer: { flexDirection: "row", gap: 11, alignItems: "flex-start" },
  explainerCopy: { flex: 1 },
  explainerTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  explainerText: { fontSize: 12, lineHeight: 18, fontWeight: "500", marginTop: 2 },
  entry: { gap: 5 },
  entryTopline: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  entryTitle: { flex: 1, fontSize: 14, lineHeight: 19, fontWeight: "900" },
  entryDetail: { fontSize: 12, lineHeight: 17, fontWeight: "500" },
  empty: { gap: 9, alignItems: "flex-start" },
  emptyTitle: { fontSize: 17, lineHeight: 22, fontWeight: "900" },
  emptyDetail: { fontSize: 12, lineHeight: 18, fontWeight: "500" },
});
