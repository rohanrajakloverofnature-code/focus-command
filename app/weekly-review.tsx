import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { CommandCard, IconAction, LoadingScreen, ScreenTitle, SectionHeader } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFocusCommand } from "@/lib/focus-command";
import { formatWeeklyRange, getWeeklyAfterActionReview } from "@/lib/weekly-after-action";
import { filterMonthlyArchiveStudiedTopicsByProgress, MONTHLY_ARCHIVE_REVISION_PROGRESS_FILTERS, type MonthlyArchiveRevisionProgressFilter } from "@/lib/monthly-command-archive";

function formatHours(milliseconds: number) {
  return `${(milliseconds / 3_600_000).toFixed(1)} h`;
}

function Metric({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return <View style={[styles.metric, { borderColor: colors.border, backgroundColor: colors.background }]}>
    <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
    <Text style={[styles.metricLabel, { color: colors.muted }]}>{label}</Text>
  </View>;
}

export default function WeeklyReviewScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, ready } = useFocusCommand();
  const review = useMemo(() => getWeeklyAfterActionReview(state), [state]);
  const [revisionFilter, setRevisionFilter] = useState<MonthlyArchiveRevisionProgressFilter>("all");
  const visibleRevisionActivities = useMemo(
    () => filterMonthlyArchiveStudiedTopicsByProgress(review.revision.activities, revisionFilter),
    [review.revision.activities, revisionFilter],
  );

  if (!ready) return <LoadingScreen label="Preparing weekly command record…" />;

  const scheduledDetail = review.scheduledPlans
    ? `${review.completedPlans} / ${review.scheduledPlans} scheduled plans completed`
    : "No dated plans were scheduled this week.";

  return <ScreenContainer className="px-4" containerClassName="bg-background">
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenTitle
        eyebrow="Command review"
        title="Weekly after-action"
        detail={`${formatWeeklyRange(review.weekStart, review.weekEnd)} · Local time`}
        right={<IconAction icon="xmark" label="Close weekly review" onPress={() => router.back()} />}
      />

      <CommandCard accent="#F4C95D" style={styles.outcomeCard}>
        <Text style={[styles.eyebrow, { color: "#F4C95D" }]}>MISSION OUTCOME</Text>
        <View style={styles.metrics}>
          <Metric label="INVESTED" value={formatHours(review.investedMs)} />
          <Metric label="COMPLETED" value={`${review.completedMissions}`} />
        </View>
        <Text style={[styles.detail, { color: colors.muted }]}>{review.completedMissions ? "Time is calculated from completed mission records using the existing active-time formula." : "No completed missions were recorded this week."}</Text>
      </CommandCard>

      <SectionHeader title="Command record" />
      <CommandCard accent={colors.primary} style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Strongest focus</Text>
        <Text style={[styles.emphasis, { color: colors.primary }]}>{review.strongestSubject ? `${review.strongestSubject.label} · ${formatHours(review.strongestSubject.durationMs)}` : "No completed subject time yet"}</Text>
        <Text style={[styles.detail, { color: colors.muted }]}>{review.strongestSubject ? "Your most-invested subject during this week." : "Complete a mission to identify your strongest subject."}</Text>
      </CommandCard>

      <CommandCard accent={colors.warning} style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Plan follow-through</Text>
        <Text style={[styles.emphasis, { color: colors.warning }]}>{scheduledDetail}</Text>
        {review.missedPlans.length ? <View style={styles.missedStack}>
          <Text style={[styles.missedLabel, { color: colors.muted }]}>MISSED OR UNFINISHED</Text>
          {review.missedPlans.slice(0, 3).map((mission) => <Text key={mission.id} style={[styles.missedItem, { color: colors.foreground }]} numberOfLines={1}>• {mission.title}</Text>)}
        </View> : <Text style={[styles.detail, { color: colors.muted }]}>{review.scheduledPlans ? "No past-due scheduled plans remain unfinished." : "Add due dates to review planned follow-through here."}</Text>}
      </CommandCard>

      <SectionHeader title="Patterns" />
      <CommandCard accent="#A78BFA" style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Reflection patterns</Text>
        {review.reflection.count ? <>
          <View style={styles.metrics}>
            <Metric label="DEBRIEFS" value={`${review.reflection.count}`} />
            <Metric label="FOCUS" value={review.reflection.averageFocus ? `${review.reflection.averageFocus.toFixed(1)} / 5` : "—"} />
          </View>
          <Text style={[styles.detail, { color: colors.muted }]}>Feeling after: {review.reflection.mostCommonFeeling ?? "No common pattern"} · Energy change: {review.reflection.energyShift === null ? "—" : `${review.reflection.energyShift >= 0 ? "+" : ""}${review.reflection.energyShift.toFixed(1)}`}</Text>
        </> : <Text style={[styles.detail, { color: colors.muted }]}>No eligible debrief data this week.</Text>}
      </CommandCard>

      <CommandCard accent="#FFAA4C" style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Focus friction</Text>
        {review.friction.total ? <Text style={[styles.detail, { color: colors.muted }]}>{review.friction.topCategory} · {review.friction.topCategoryCount} disruption{review.friction.topCategoryCount === 1 ? "" : "s"}{review.friction.timeWindow ? ` · Most interrupted: ${review.friction.timeWindow}` : ""}</Text> : <Text style={[styles.detail, { color: colors.muted }]}>No distraction signals logged this week.</Text>}
      </CommandCard>

      <SectionHeader title="Weekly revision review" />
      <CommandCard accent="#A78BFA" style={styles.revisionCard}>
        <View style={styles.revisionHeading}>
          <View style={styles.revisionHeadingCopy}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Revision activity</Text>
            <Text style={[styles.detail, { color: colors.muted }]}>{review.revision.activities.length ? `${review.revision.uniqueTopicCount} topic${review.revision.uniqueTopicCount === 1 ? "" : "s"} active · ${review.revision.activities.length} real action${review.revision.activities.length === 1 ? "" : "s"}` : "No revision activity this week"}</Text>
          </View>
          <Text style={[styles.revisionRange, { color: "#A78BFA" }]}>{formatWeeklyRange(review.weekStart, review.weekEnd)}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.revisionFilters}>
          {MONTHLY_ARCHIVE_REVISION_PROGRESS_FILTERS.map((filter) => {
            const active = filter.id === revisionFilter;
            return <Pressable key={filter.id} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={`Filter weekly revision activity by ${filter.label}`} onPress={() => setRevisionFilter(filter.id)} style={({ pressed }) => [styles.revisionFilter, { borderColor: active ? "#5DD6C0" : colors.border, backgroundColor: active ? "#5DD6C01F" : colors.background, opacity: pressed ? 0.7 : 1 }]}><Text style={[styles.revisionFilterText, { color: active ? "#5DD6C0" : colors.foreground }]}>{filter.label}</Text></Pressable>;
          })}
        </ScrollView>
        {visibleRevisionActivities.length ? <View style={styles.revisionRows}>
          {visibleRevisionActivities.map((activity) => <Pressable key={activity.key} accessibilityRole="button" accessibilityLabel={`Open ${activity.topic} revision`} onPress={() => router.push({ pathname: "/revisions", params: { topic: activity.revisionTopicId! } })} style={({ pressed }) => [styles.revisionRow, { borderColor: colors.border, backgroundColor: colors.background, opacity: pressed ? 0.72 : 1 }]}>
            <View style={styles.revisionRowCopy}><Text style={[styles.revisionSubject, { color: "#55B7FF" }]}>{activity.subject.toUpperCase()}</Text><Text style={[styles.revisionTopic, { color: colors.foreground }]} numberOfLines={1}>{activity.topic}</Text><Text style={[styles.detail, { color: colors.muted }]}>{activity.actionLabel} · {activity.actionDate}</Text></View>
            <Text style={[styles.revisionPercent, { color: "#5DD6C0" }]}>{activity.revisionCompletionPercent}%</Text>
          </Pressable>)}
        </View> : <Text style={[styles.detail, { color: colors.muted }]}>{revisionFilter === "all" ? "No revision activity this week" : "No revision activity matches this phase filter."}</Text>}
      </CommandCard>

      <SectionHeader title="Next week’s command" />
      <CommandCard accent={colors.success} style={styles.recommendationCard}>
        <Text style={[styles.eyebrow, { color: colors.success }]}>READ-ONLY RECOMMENDATION</Text>
        <Text style={[styles.recommendation, { color: colors.foreground }]}>{review.recommendation}</Text>
        <Text style={[styles.detail, { color: colors.muted }]}>Derived from your existing mission, debrief, and distraction records. It does not alter any mission or plan.</Text>
      </CommandCard>
    </ScrollView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 12, paddingBottom: 30 },
  outcomeCard: { gap: 10 },
  card: { gap: 8 },
  revisionCard: { gap: 10 },
  recommendationCard: { gap: 9 },
  eyebrow: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.9 },
  cardTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  emphasis: { fontSize: 14, lineHeight: 20, fontWeight: "900" },
  detail: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  metrics: { flexDirection: "row", gap: 8 },
  metric: { flex: 1, minHeight: 62, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, paddingVertical: 9, justifyContent: "center", gap: 2 },
  metricValue: { fontSize: 17, lineHeight: 22, fontWeight: "900" },
  metricLabel: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.65 },
  missedStack: { gap: 4, marginTop: 2 },
  missedLabel: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.7 },
  missedItem: { fontSize: 11, lineHeight: 16, fontWeight: "700" },
  revisionHeading: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  revisionHeadingCopy: { flex: 1, gap: 3 },
  revisionRange: { fontSize: 9, lineHeight: 13, fontWeight: "900", letterSpacing: 0.35, textAlign: "right", maxWidth: 88 },
  revisionFilters: { gap: 7, paddingRight: 4 },
  revisionFilter: { minHeight: 32, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  revisionFilterText: { fontSize: 10, lineHeight: 13, fontWeight: "900" },
  revisionRows: { gap: 7 },
  revisionRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 68, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, paddingVertical: 9 },
  revisionRowCopy: { flex: 1, minWidth: 0, gap: 2 },
  revisionSubject: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.65 },
  revisionTopic: { fontSize: 13, lineHeight: 17, fontWeight: "900" },
  revisionPercent: { fontSize: 16, lineHeight: 20, fontWeight: "900" },
  recommendation: { fontSize: 16, lineHeight: 23, fontWeight: "900" },
});
