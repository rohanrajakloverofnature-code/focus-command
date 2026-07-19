import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { CommandButton, CommandCard, IconAction, LoadingScreen, ScreenTitle, StatusPill } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { formatCompactNumber, formatHours, getDashboardStats, getMissionInvestedMilliseconds, useFocusCommand } from "@/lib/focus-command";

const META: Record<string, { title: string; detail: string; icon: "chart.xyaxis.line" | "trophy.fill" | "star.fill" | "target" | "shield.fill" }> = {
  power: { title: "Total Power", detail: "Immutable progression events awarded after each mission completion.", icon: "shield.fill" },
  time: { title: "Invested Time", detail: "Exact active task time after every pause is removed.", icon: "timer" as "chart.xyaxis.line" },
  fame: { title: "Wall of Fame", detail: "Mini achievements rated above 3/5 during their seven-day display window.", icon: "trophy.fill" },
  radar: { title: "Achievement Radar", detail: "Tasks whose post-mission feeling was logged as Great during their seven-day display window.", icon: "star.fill" },
  emotion: { title: "Emotional Insight", detail: "Post-mission feelings and reflection signals.", icon: "target" },
  skills: { title: "Skill Growth", detail: "Skills recorded in long-mission reflection debriefs.", icon: "target" },
  lifeline: { title: "Lifeline", detail: "Historical baseline data plus daily journal-derived increments.", icon: "chart.xyaxis.line" },
};

export default function AnalyticsDetailScreen() {
  const colors = useColors();
  const { metric = "power" } = useLocalSearchParams<{ metric?: string }>();
  const { state, ready } = useFocusCommand();

  if (!ready) return <LoadingScreen label="Opening analytic source data…" />;

  const meta = META[metric] ?? META.power;
  const dashboard = getDashboardStats(state);
  const entries = metric === "power"
    ? state.progression.map((event) => ({ id: event.id, title: event.note, detail: `${formatCompactNumber(event.powerAwarded)} power · ${event.comboMultiplier.toFixed(2)}× combo · ${event.goldAwarded} gold`, date: event.occurredAt, tone: "gold" as const }))
    : metric === "time"
      ? state.missions.filter((mission) => mission.status === "completed").map((mission) => ({ id: mission.id, title: mission.title, detail: `${formatHours(getMissionInvestedMilliseconds(mission))} · ${mission.subject} · ${mission.category}`, date: mission.completedAt ?? mission.createdAt, tone: "primary" as const }))
      : metric === "fame"
        ? dashboard.wallOfFame.map((mission) => ({ id: mission.id, title: mission.title, detail: "Mini achievement score above 3/5 · visible for 7 days", date: mission.completedAt ?? mission.createdAt, tone: "gold" as const }))
        : metric === "radar"
          ? dashboard.achievementRadar.map((mission) => ({ id: mission.id, title: mission.title, detail: "After-feeling logged as Great · visible for 7 days", date: mission.completedAt ?? mission.createdAt, tone: "success" as const }))
          : metric === "emotion"
            ? state.reflections.map((reflection) => ({ id: reflection.id, title: state.missions.find((mission) => mission.id === reflection.missionId)?.title ?? "Mission reflection", detail: `Before: ${reflection.feelingBefore ?? "not logged"} · After: ${reflection.feelingAfter ?? "not logged"} · Friction: ${reflection.frictionRating ?? "–"}/5`, date: reflection.createdAt, tone: "warning" as const }))
            : metric === "skills"
              ? state.reflections.filter((reflection) => reflection.skills.length).map((reflection) => ({ id: reflection.id, title: state.missions.find((mission) => mission.id === reflection.missionId)?.title ?? "Mission reflection", detail: reflection.skills.join(" · "), date: reflection.createdAt, tone: "primary" as const }))
              : state.lifeline.map((point) => ({ id: point.id, title: point.source === "manual" ? `Historical baseline · ${point.year}` : `Journal contribution · ${point.localDate}`, detail: `Life Performance ${point.lifePerformance} · Experience ${point.experience}${point.note ? ` · ${point.note}` : ""}`, date: point.localDate, tone: point.source === "manual" ? "primary" as const : "success" as const }));

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenTitle eyebrow="Data source" title={meta.title} detail={meta.detail} right={<IconAction icon="xmark" label="Close analytics detail" onPress={() => router.back()} />} />
        <CommandCard accent={colors.primary} style={styles.explainer}>
          <IconSymbol name={meta.icon} size={25} color={colors.primary} />
          <View style={styles.explainerCopy}>
            <Text style={[styles.explainerTitle, { color: colors.foreground }]}>Traceable analytics</Text>
            <Text style={[styles.explainerText, { color: colors.muted }]}>This view shows the records driving the selected metric, so every number in the Dashboard can be inspected rather than treated as a black box.</Text>
          </View>
        </CommandCard>
        {entries.length ? (
          <View style={styles.stack}>
            {entries.sort((a, b) => b.date.localeCompare(a.date)).map((entry) => (
              <CommandCard key={entry.id} accent={entry.tone === "gold" ? "#F4C95D" : entry.tone === "success" ? colors.success : entry.tone === "warning" ? colors.warning : colors.primary} style={styles.entry}>
                <View style={styles.entryTopline}>
                  <Text style={[styles.entryTitle, { color: colors.foreground }]}>{entry.title}</Text>
                  <StatusPill label={new Date(entry.date).toLocaleDateString()} tone={entry.tone === "gold" ? "gold" : entry.tone === "success" ? "success" : entry.tone === "warning" ? "warning" : "primary"} />
                </View>
                <Text style={[styles.entryDetail, { color: colors.muted }]}>{entry.detail}</Text>
              </CommandCard>
            ))}
          </View>
        ) : (
          <CommandCard accent={colors.border} style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No source records yet</Text>
            <Text style={[styles.emptyDetail, { color: colors.muted }]}>Complete missions, log reflections, or add Lifeline baselines to populate this analytic view.</Text>
            <CommandButton label="Return to dashboard" icon="chart.xyaxis.line" onPress={() => router.replace("/dashboard" as never)} />
          </CommandCard>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingTop: 10, paddingBottom: 28 },
  explainer: { flexDirection: "row", gap: 11, alignItems: "flex-start" },
  explainerCopy: { flex: 1 },
  explainerTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  explainerText: { fontSize: 12, lineHeight: 18, fontWeight: "500", marginTop: 2 },
  stack: { gap: 10 },
  entry: { gap: 5 },
  entryTopline: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  entryTitle: { flex: 1, fontSize: 14, lineHeight: 19, fontWeight: "900" },
  entryDetail: { fontSize: 12, lineHeight: 17, fontWeight: "500" },
  empty: { gap: 9, alignItems: "flex-start" },
  emptyTitle: { fontSize: 17, lineHeight: 22, fontWeight: "900" },
  emptyDetail: { fontSize: 12, lineHeight: 18, fontWeight: "500" },
});
