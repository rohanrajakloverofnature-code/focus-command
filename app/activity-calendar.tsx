import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { CalendarDatePicker, CalendarDateRangeField } from "@/components/calendar-date-picker";
import { LineTrendChart } from "@/components/focus-charts";
import { CommandButton, CommandCard, IconAction, LoadingScreen, MetricTile, ScreenTitle, SectionHeader, StatusPill } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { addLocalDays, formatReadableLocalDate } from "@/lib/calendar-date";
import { compareCalendarPeriods, getCalendarCompletionPoint, getCalendarCompletionSeries, getCalendarCompletionSummary } from "@/lib/calendar-activity";
import { shallowEqual, useFocusCommandReady, useFocusCommandSelector, type FocusState } from "@/lib/focus-command";

type RangeKind = "day" | "week" | "month" | "year" | "custom";
type ComparisonKind = "yesterday" | "week" | "month" | "year";

function localToday(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function monthEnd(date: string) {
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}
function yearEnd(date: string) { return `${date.slice(0, 4)}-12-31`; }
function rangeFor(kind: RangeKind, date: string, customStart: string, customEnd: string) {
  if (kind === "day") return { startDate: date, endDate: date };
  if (kind === "week") return { startDate: addLocalDays(date, -6), endDate: date };
  if (kind === "month") return { startDate: `${date.slice(0, 8)}01`, endDate: monthEnd(date) };
  if (kind === "year") return { startDate: `${date.slice(0, 4)}-01-01`, endDate: yearEnd(date) };
  return { startDate: customStart.trim(), endDate: customEnd.trim() };
}
function comparisonRanges(kind: ComparisonKind, date: string) {
  if (kind === "yesterday") return { current: { startDate: date, endDate: date }, previous: { startDate: addLocalDays(date, -1), endDate: addLocalDays(date, -1) } };
  if (kind === "week") return { current: { startDate: addLocalDays(date, -6), endDate: date }, previous: { startDate: addLocalDays(date, -13), endDate: addLocalDays(date, -7) } };
  if (kind === "month") {
    const currentStart = `${date.slice(0, 8)}01`;
    const previousEnd = addLocalDays(currentStart, -1);
    return { current: { startDate: currentStart, endDate: date }, previous: { startDate: `${previousEnd.slice(0, 8)}01`, endDate: previousEnd } };
  }
  const currentStart = `${date.slice(0, 4)}-01-01`;
  const previousEnd = addLocalDays(currentStart, -1);
  return { current: { startDate: currentStart, endDate: date }, previous: { startDate: `${previousEnd.slice(0, 4)}-01-01`, endDate: previousEnd } };
}
function selectState(state: FocusState) { return { timezone: state.profile.timezone, activities: state.calendarActivities }; }

export default function ActivityCalendarScreen() {
  const colors = useColors();
  const ready = useFocusCommandReady();
  const state = useFocusCommandSelector(selectState, shallowEqual);
  const [selectedDate, setSelectedDate] = useState(() => localToday(state.timezone));
  const [rangeKind, setRangeKind] = useState<RangeKind>("week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [comparisonKind, setComparisonKind] = useState<ComparisonKind>("week");
  const range = useMemo(() => rangeFor(rangeKind, selectedDate, customStart, customEnd), [customEnd, customStart, rangeKind, selectedDate]);
  const summary = useMemo(() => getCalendarCompletionSummary(state.activities, range.startDate, range.endDate), [range.endDate, range.startDate, state.activities]);
  const selectedPoint = useMemo(() => getCalendarCompletionPoint(state.activities, selectedDate), [selectedDate, state.activities]);
  const comparison = useMemo(() => {
    const periods = comparisonRanges(comparisonKind, selectedDate);
    return compareCalendarPeriods(getCalendarCompletionSeries(state.activities, periods.current.startDate, periods.current.endDate), getCalendarCompletionSeries(state.activities, periods.previous.startDate, periods.previous.endDate));
  }, [comparisonKind, selectedDate, state.activities]);
  const selectedActivities = useMemo(() => state.activities.filter((activity) => activity.localDate === selectedDate), [selectedDate, state.activities]);
  const rangeLabel = rangeKind === "day" ? "DAY" : rangeKind === "week" ? "ONE WEEK" : rangeKind === "month" ? "ONE MONTH" : rangeKind === "year" ? "ONE YEAR" : "CUSTOM RANGE";

  if (!ready) return <LoadingScreen label="Opening Calendar Activity analytics…" />;
  const customInvalid = rangeKind === "custom" && (!range.startDate || !range.endDate || range.startDate > range.endDate);
  return <ScreenContainer className="px-4" containerClassName="bg-background" edges={["top", "bottom", "left", "right"]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenTitle eyebrow="CALENDAR ACTIVITY ANALYTICS" title="Completion dashboard" detail="This view measures dated tasks. The Mission Board remains the place to plan, start, and complete work." right={<IconAction icon="xmark" label="Close Calendar Activity analytics" onPress={() => router.back()} />} />
      <CommandCard accent={colors.primary} style={styles.rangeCard}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>View completion period</Text>
        <View style={styles.chips}>{(["day", "week", "month", "year", "custom"] as RangeKind[]).map((kind) => <Pressable key={kind} onPress={() => setRangeKind(kind)} style={[styles.chip, { borderColor: rangeKind === kind ? colors.primary : colors.border, backgroundColor: rangeKind === kind ? `${colors.primary}18` : colors.background }]}><Text style={[styles.chipText, { color: rangeKind === kind ? colors.primary : colors.muted }]}>{kind === "day" ? "DAY" : kind === "week" ? "WEEK" : kind === "month" ? "MONTH" : kind === "year" ? "YEAR" : "CUSTOM"}</Text></Pressable>)}</View>
        {rangeKind === "custom" ? <CalendarDateRangeField label="Choose completion period" startDate={customStart} endDate={customEnd} onChange={(start, end) => { setCustomStart(start); setCustomEnd(end); }} /> : null}
        <Text style={[styles.rangeDetail, { color: colors.muted }]}>{rangeLabel} · {range.startDate || "Choose start"} → {range.endDate || "Choose end"}</Text>
      </CommandCard>
      {customInvalid ? <CommandCard accent={colors.warning} style={styles.messageCard}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Choose a valid custom range</Text><Text style={[styles.detail, { color: colors.muted }]}>Select both dates from the calendar. The end date must not be before the start date.</Text></CommandCard> : <>
        <CommandCard accent={colors.success} style={styles.overviewCard}>
          <View style={styles.heading}><View style={styles.copy}><Text style={[styles.eyebrow, { color: colors.success }]}>DATED ACTIVITY PROGRESS</Text><Text style={[styles.title, { color: colors.foreground }]}>{summary.percentage === null ? "No assigned tasks" : `${summary.percentage}% complete`}</Text><Text style={[styles.detail, { color: colors.muted }]}>Completed assigned tasks divided by all assigned tasks in the selected period. Empty days are not failures.</Text></View><StatusPill label={summary.percentage === null ? "NO PLANS" : `${summary.percentage}% COMPLETE`} tone={summary.percentage === null ? "neutral" : "success"} /></View>
          <View style={styles.metrics}><MetricTile style={styles.metricTile} label="Planned" value={String(summary.planned)} detail={`${summary.daysWithPlans} day${summary.daysWithPlans === 1 ? "" : "s"} with plans`} icon="checklist" accent={colors.primary} /><MetricTile style={styles.metricTile} label="Completed" value={String(summary.completed)} detail={`${summary.pending} pending`} icon="checklist" accent={colors.success} /></View>
          {summary.series.length ? <LineTrendChart points={summary.series.map((point) => ({ label: point.localDate.slice(5), value: point.percentage ?? 0 }))} color={colors.success} accessibilityLabel="Day-by-day calendar task completion percentage" /> : null}
        </CommandCard>
        <SectionHeader title={`Tasks on ${formatReadableLocalDate(selectedDate)}`} />
        <CommandCard accent={colors.primary} style={styles.selectedCard}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{selectedPoint.total} assigned · {selectedPoint.completed} completed · {selectedPoint.pending} pending</Text><CalendarDatePicker mode="single" startDate={selectedDate} onChange={setSelectedDate} /></CommandCard>
        {selectedActivities.length ? selectedActivities.map((activity) => <CommandCard key={activity.id} accent={activity.completedAt ? colors.success : colors.primary} style={styles.taskCard}><View style={styles.taskRow}><View style={[styles.readOnlyMark, { borderColor: activity.completedAt ? colors.success : colors.border, backgroundColor: activity.completedAt ? colors.success : colors.background }]}><Text style={[styles.checkText, { color: activity.completedAt ? colors.background : colors.muted }]}>{activity.completedAt ? "✓" : ""}</Text></View><View style={styles.copy}><Text style={[styles.taskTitle, { color: colors.foreground, textDecorationLine: activity.completedAt ? "line-through" : "none" }]}>{activity.title}</Text><Text style={[styles.taskDetail, { color: colors.muted }]}>{activity.missionId ? "Linked mission" : "Standalone task"} · status is managed in Calendar Planned</Text></View></View></CommandCard>) : <CommandCard accent={colors.border} style={styles.taskCard}><Text style={[styles.cardTitle, { color: colors.foreground }]}>No tasks assigned to this date</Text><Text style={[styles.detail, { color: colors.muted }]}>Choose another date or open Calendar Planned to assign work.</Text></CommandCard>}
        <CommandCard accent={colors.primary} style={styles.compareCard}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Compare completion</Text><Text style={[styles.detail, { color: colors.muted }]}>Compare the selected period with the equivalent previous period.</Text><View style={styles.chips}>{(["yesterday", "week", "month", "year"] as ComparisonKind[]).map((kind) => <Pressable key={kind} onPress={() => setComparisonKind(kind)} style={[styles.chip, { borderColor: comparisonKind === kind ? colors.primary : colors.border, backgroundColor: comparisonKind === kind ? `${colors.primary}18` : colors.background }]}><Text style={[styles.chipText, { color: comparisonKind === kind ? colors.primary : colors.muted }]}>{kind === "yesterday" ? "YESTERDAY" : kind === "week" ? "WEEK" : kind === "month" ? "MONTH" : "YEAR"}</Text></Pressable>)}</View><Text style={[styles.compareResult, { color: colors.foreground }]}>{comparison.currentAverage === null ? "No planned activity in the selected period." : `Current ${comparison.currentAverage}% · Previous ${comparison.previousAverage ?? "—"}%${comparison.delta === null ? "" : ` · ${comparison.delta >= 0 ? "+" : ""}${comparison.delta} points`}`}</Text></CommandCard>
      </>}
      <CommandButton label="Open Calendar Planned" icon="checklist" onPress={() => router.push("/missions?mode=calendar" as never)} />
    </ScrollView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({ content: { gap: 13, paddingTop: 12, paddingBottom: 36 }, rangeCard: { gap: 9 }, cardTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 }, chip: { minHeight: 34, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 9, justifyContent: "center" }, chipText: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.55 }, rangeDetail: { fontSize: 10, lineHeight: 14, fontWeight: "700" }, messageCard: { gap: 5 }, overviewCard: { gap: 10 }, heading: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }, copy: { flex: 1, minWidth: 0, gap: 3 }, eyebrow: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.8 }, title: { fontSize: 20, lineHeight: 25, fontWeight: "900" }, detail: { fontSize: 11, lineHeight: 16, fontWeight: "600" }, metrics: { flexDirection: "row", gap: 9 }, metricTile: { flex: 1 }, selectedCard: { gap: 9 }, taskCard: { gap: 8 }, taskRow: { flexDirection: "row", alignItems: "center", gap: 10 }, readOnlyMark: { width: 28, height: 28, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center" }, checkText: { fontSize: 17, fontWeight: "900" }, taskTitle: { fontSize: 15, lineHeight: 19, fontWeight: "900" }, taskDetail: { fontSize: 10, lineHeight: 14, fontWeight: "700" }, compareCard: { gap: 9 }, compareResult: { fontSize: 13, lineHeight: 18, fontWeight: "900" },
});
