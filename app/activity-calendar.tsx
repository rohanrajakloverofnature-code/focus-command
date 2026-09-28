import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { CalendarDatePicker } from "@/components/calendar-date-picker";
import { LineTrendChart } from "@/components/focus-charts";
import { CommandButton, CommandCard, IconAction, LoadingScreen, MetricTile, ScreenTitle, SectionHeader, StatusPill } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { addLocalDays, formatReadableLocalDate } from "@/lib/calendar-date";
import { compareCalendarPeriods, getCalendarCompletionPoint, getCalendarCompletionSeries } from "@/lib/calendar-activity";
import { shallowEqual, useFocusCommandActions, useFocusCommandReady, useFocusCommandSelector, type FocusState } from "@/lib/focus-command";

function today(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function monthStart(date: string) { return `${date.slice(0, 8)}01`; }
function monthEnd(date: string) { const [year, month] = date.split("-").map(Number); return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10); }
function selectCalendarState(state: FocusState) { return { timezone: state.profile.timezone, activities: state.calendarActivities, missions: state.missions }; }

type ComparisonKind = "yesterday" | "month" | "year";

export default function ActivityCalendarScreen() {
  const colors = useColors();
  const ready = useFocusCommandReady();
  const state = useFocusCommandSelector(selectCalendarState, shallowEqual);
  const actions = useFocusCommandActions();
  const [selectedDate, setSelectedDate] = useState(today(state.timezone));
  const [title, setTitle] = useState("");
  const [missionId, setMissionId] = useState<string | null>(null);
  const [comparisonKind, setComparisonKind] = useState<ComparisonKind>("yesterday");
  const currentMonthStart = monthStart(selectedDate);
  const currentMonthEnd = monthEnd(selectedDate);
  const selected = useMemo(() => getCalendarCompletionPoint(state.activities, selectedDate), [selectedDate, state.activities]);
  const monthSeries = useMemo(() => getCalendarCompletionSeries(state.activities, currentMonthStart, currentMonthEnd), [currentMonthEnd, currentMonthStart, state.activities]);
  const selectedActivities = useMemo(() => state.activities.filter((activity) => activity.localDate === selectedDate), [selectedDate, state.activities]);
  const missionOptions = useMemo(() => state.missions.filter((mission) => mission.status !== "completed"), [state.missions]);
  const comparison = useMemo(() => {
    if (comparisonKind === "yesterday") return compareCalendarPeriods([selected], [getCalendarCompletionPoint(state.activities, addLocalDays(selectedDate, -1))]);
    if (comparisonKind === "month") {
      const previousEnd = addLocalDays(currentMonthStart, -1);
      const previousStart = monthStart(previousEnd);
      return compareCalendarPeriods(monthSeries, getCalendarCompletionSeries(state.activities, previousStart, previousEnd));
    }
    const year = Number(selectedDate.slice(0, 4));
    return compareCalendarPeriods(getCalendarCompletionSeries(state.activities, `${year}-01-01`, `${year}-12-31`), getCalendarCompletionSeries(state.activities, `${year - 1}-01-01`, `${year - 1}-12-31`));
  }, [comparisonKind, currentMonthStart, monthSeries, selected, selectedDate, state.activities]);

  if (!ready) return <LoadingScreen label="Opening your Activity Calendar…" />;
  const addActivity = () => {
    if (!title.trim()) { Alert.alert("Name this activity", "Enter a short activity title before adding it."); return; }
    actions.scheduleCalendarActivity({ title, localDate: selectedDate, missionId });
    setTitle("");
    setMissionId(null);
  };

  return <ScreenContainer className="px-4" containerClassName="bg-background" edges={["top", "bottom", "left", "right"]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenTitle eyebrow="PRIVATE ACTIVITY CALENDAR" title="Plan by date" detail="This is an additional calendar planner. Your existing Mission Board → Planned workflow remains unchanged." right={<IconAction icon="xmark" label="Close Activity Calendar" onPress={() => router.back()} />} />
      <CommandCard accent={colors.primary} style={styles.calendarCard}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Choose a day</Text><CalendarDatePicker mode="single" startDate={selectedDate} onChange={(date) => setSelectedDate(date)} /></CommandCard>
      <View style={styles.metrics}><MetricTile label="Planned" value={String(selected.total)} detail={formatReadableLocalDate(selectedDate)} icon="checklist" accent={colors.primary} /><MetricTile label="Completed" value={String(selected.completed)} detail={selected.percentage === null ? "No planned tasks" : `${selected.percentage}% complete`} icon="checklist" accent={colors.success} /></View>
      <CommandCard accent={colors.success} style={styles.addCard}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Add activity for {formatReadableLocalDate(selectedDate)}</Text><TextInput value={title} onChangeText={setTitle} placeholder="Example: Read chapter 4" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} /><Text style={[styles.label, { color: colors.muted }]}>OPTIONAL MISSION LINK</Text><View style={styles.missionChoices}><Pressable onPress={() => setMissionId(null)} style={[styles.choice, { borderColor: missionId === null ? colors.primary : colors.border, backgroundColor: missionId === null ? `${colors.primary}18` : colors.background }]}><Text style={[styles.choiceText, { color: missionId === null ? colors.primary : colors.muted }]}>No link</Text></Pressable>{missionOptions.slice(0, 6).map((mission) => <Pressable key={mission.id} onPress={() => setMissionId(mission.id)} style={[styles.choice, { borderColor: missionId === mission.id ? colors.primary : colors.border, backgroundColor: missionId === mission.id ? `${colors.primary}18` : colors.background }]}><Text numberOfLines={1} style={[styles.choiceText, { color: missionId === mission.id ? colors.primary : colors.muted }]}>{mission.title}</Text></Pressable>)}</View><CommandButton label="Add to this date" icon="plus" onPress={addActivity} /></CommandCard>
      <SectionHeader title={`Activities · ${formatReadableLocalDate(selectedDate)}`} />
      {selectedActivities.length ? selectedActivities.map((activity) => <CommandCard key={activity.id} accent={activity.completedAt ? colors.success : colors.primary} style={styles.activityCard}><View style={styles.activityRow}><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: Boolean(activity.completedAt) }} onPress={() => actions.toggleCalendarActivityCompleted(activity.id)} style={[styles.check, { borderColor: activity.completedAt ? colors.success : colors.border, backgroundColor: activity.completedAt ? colors.success : colors.background }]}><Text style={[styles.checkText, { color: activity.completedAt ? colors.background : colors.muted }]}>{activity.completedAt ? "✓" : ""}</Text></Pressable><View style={styles.activityCopy}><Text style={[styles.activityTitle, { color: colors.foreground, textDecorationLine: activity.completedAt ? "line-through" : "none" }]}>{activity.title}</Text><Text style={[styles.activityDetail, { color: colors.muted }]}>{activity.missionId ? "Linked to an existing mission" : "Calendar activity"}</Text></View><Pressable onPress={() => Alert.alert("Remove activity?", "This removes only this calendar assignment.", [{ text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: () => actions.removeCalendarActivity(activity.id) }])}><Text style={[styles.delete, { color: colors.error }]}>REMOVE</Text></Pressable></View></CommandCard>) : <CommandCard accent={colors.border}><Text style={[styles.emptyTitle, { color: colors.foreground }]}>No activities planned for this date.</Text><Text style={[styles.emptyDetail, { color: colors.muted }]}>Add an activity above. Empty dates are not counted as failed days.</Text></CommandCard>}
      <SectionHeader title="This month" /><CommandCard accent={colors.primary} style={styles.graphCard}><View style={styles.graphHeading}><View><Text style={[styles.cardTitle, { color: colors.foreground }]}>Day-by-day completion</Text><Text style={[styles.graphDetail, { color: colors.muted }]}>Days without plans remain visible as no-plan days.</Text></View><StatusPill label={`${monthSeries.filter((point) => point.total > 0).length} PLANNED DAYS`} tone="primary" /></View>{monthSeries.length ? <LineTrendChart points={monthSeries.map((point) => ({ label: point.localDate.slice(8), value: point.percentage ?? 0 }))} color={colors.success} accessibilityLabel="Daily calendar activity completion percentage" /> : null}</CommandCard>
      <CommandCard accent={colors.primary} style={styles.compareCard}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Compare completion</Text><Text style={[styles.graphDetail, { color: colors.muted }]}>Compare the selected day or period against the previous equivalent period.</Text><View style={styles.compareRow}>{(["yesterday", "month", "year"] as const).map((kind) => <Pressable key={kind} onPress={() => setComparisonKind(kind)} style={[styles.compareChip, { borderColor: comparisonKind === kind ? colors.primary : colors.border, backgroundColor: comparisonKind === kind ? `${colors.primary}18` : colors.background }]}><Text style={[styles.choiceText, { color: comparisonKind === kind ? colors.primary : colors.muted }]}>{kind === "yesterday" ? "Yesterday" : kind === "month" ? "Previous month" : "Previous year"}</Text></Pressable>)}</View><Text style={[styles.compareResult, { color: colors.foreground }]}>{comparison.currentAverage === null ? "No planned activity in the current comparison period." : `Current ${comparison.currentAverage}% · Previous ${comparison.previousAverage ?? "—"}%${comparison.delta === null ? "" : ` · ${comparison.delta >= 0 ? "+" : ""}${comparison.delta} points`}`}</Text></CommandCard>
    </ScrollView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 13, paddingTop: 12, paddingBottom: 36 }, calendarCard: { gap: 8 }, metrics: { flexDirection: "row", gap: 10 }, addCard: { gap: 10 }, cardTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" }, input: { minHeight: 46, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 12, fontSize: 14, fontWeight: "700" }, label: { fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }, missionChoices: { flexDirection: "row", flexWrap: "wrap", gap: 6 }, choice: { maxWidth: "100%", minHeight: 34, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 9, justifyContent: "center" }, choiceText: { fontSize: 10, fontWeight: "800" }, activityCard: { gap: 8 }, activityRow: { flexDirection: "row", alignItems: "center", gap: 10 }, check: { width: 28, height: 28, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center" }, checkText: { fontSize: 17, fontWeight: "900" }, activityCopy: { flex: 1, gap: 2 }, activityTitle: { fontSize: 15, fontWeight: "900" }, activityDetail: { fontSize: 10, fontWeight: "700" }, delete: { fontSize: 9, fontWeight: "900" }, emptyTitle: { fontSize: 15, fontWeight: "900" }, emptyDetail: { marginTop: 3, fontSize: 11, lineHeight: 16, fontWeight: "600" }, graphCard: { gap: 9 }, graphHeading: { flexDirection: "row", alignItems: "flex-start", gap: 9 }, graphDetail: { marginTop: 2, fontSize: 10, lineHeight: 15, fontWeight: "600" }, compareCard: { gap: 9 }, compareRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 }, compareChip: { minHeight: 34, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 9, justifyContent: "center" }, compareResult: { fontSize: 13, lineHeight: 18, fontWeight: "900" },
});
