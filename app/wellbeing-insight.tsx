import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { MultiLineTrendChart, type MultiLineSeries } from "@/components/focus-charts";
import { CommandCard, IconAction, LoadingScreen, ScreenTitle, StatusPill } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getWellbeingInsight, useFocusCommand } from "@/lib/focus-command";

function mean(values: (number | null | undefined)[]) {
  const available = values.filter((value): value is number => typeof value === "number" && value > 0);
  return available.length ? available.reduce((total, value) => total + value, 0) / available.length : 0;
}

function trendLabel(direction: "rising" | "easing" | "steady", role?: "supportive" | "load") {
  if (role === "load") return direction === "rising" ? "Higher" : direction === "easing" ? "Lower" : "Steady";
  return direction === "rising" ? "Rising" : direction === "easing" ? "Easing" : "Steady";
}

function rating(value: number | null) {
  return value === null ? "Not rated" : `${value}/5`;
}

export default function WellbeingInsightScreen() {
  const colors = useColors();
  const { state, ready } = useFocusCommand();
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const insight = useMemo(() => getWellbeingInsight(state), [state]);

  const trendSeries = useMemo<MultiLineSeries[]>(() => {
    const chronological = [...insight.records].reverse();
    const labels = (index: number) => index === 0 || index === chronological.length - 1 || index === Math.floor(chronological.length / 2) ? chronological[index].localDate.slice(5) : "";
    return [
      {
        id: "supportive",
        label: "Supportive signals",
        color: colors.primary,
        points: chronological.map((record, index) => ({ label: labels(index), value: Number(mean([record.focus, record.motivation, record.clarity, record.energy]).toFixed(1)) })),
      },
      {
        id: "load",
        label: "Reported load",
        color: colors.warning,
        points: chronological.map((record, index) => ({ label: labels(index), value: Number(mean([record.stress, record.distraction, record.friction]).toFixed(1)) })),
      },
    ];
  }, [colors.primary, colors.warning, insight.records]);

  if (!ready) return <LoadingScreen label="Reading your private reflection signals…" />;

  const supportiveSignals = insight.signals.filter((signal) => signal.role === "supportive");
  const loadSignals = insight.signals.filter((signal) => signal.role === "load");
  const balanceTone = !insight.available ? colors.muted : insight.balanceScore >= 68 ? colors.success : insight.balanceScore >= 45 ? colors.warning : colors.error;

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenTitle
          eyebrow="Private reflection, not diagnosis"
          title="Wellbeing insight"
          detail="A transparent, non-clinical view of the emotional and behavioral ratings you chose to log after missions."
          right={<IconAction icon="chevron.right" label="Return to Dashboard" onPress={() => router.back()} />}
        />

        <CommandCard accent={colors.warning} style={styles.safetyCard}>
          <View style={styles.safetyTopline}>
            <StatusPill label="NON-CLINICAL" tone="warning" icon="shield.fill" />
            <Text style={[styles.privateLabel, { color: colors.muted }]}>ON DEVICE</Text>
          </View>
          <Text style={[styles.safetyTitle, { color: colors.foreground }]}>This is reflection support, not a diagnosis.</Text>
          <Text style={[styles.safetyDetail, { color: colors.muted }]}>{insight.disclaimer}</Text>
        </CommandCard>

        <CommandCard accent={balanceTone} style={styles.balanceCard}>
          <View style={styles.balanceTopline}>
            <View style={styles.balanceCopy}>
              <Text style={[styles.balanceEyebrow, { color: balanceTone }]}>RECENT REFLECTION BALANCE</Text>
              <Text style={[styles.balanceTitle, { color: colors.foreground }]}>{insight.headline}</Text>
            </View>
            <View style={[styles.balanceScore, { borderColor: `${balanceTone}66`, backgroundColor: `${balanceTone}14` }]}>
              <Text style={[styles.balanceValue, { color: balanceTone }]}>{insight.available ? insight.balanceScore : "—"}</Text>
              <Text style={[styles.balanceScoreLabel, { color: colors.muted }]}>OF 100</Text>
            </View>
          </View>
          <Text style={[styles.balanceDetail, { color: colors.muted }]}>{insight.summary}</Text>
          <View style={styles.balanceFooter}>
            <StatusPill label={`${insight.confidence.toUpperCase()} · ${insight.sampleSize} DEBRIEF${insight.sampleSize === 1 ? "" : "S"}`} tone={insight.available ? "primary" : "neutral"} icon="chart.xyaxis.line" />
            {insight.available ? <Text style={[styles.trendChip, { color: insight.trend.direction === "rising" ? colors.success : insight.trend.direction === "easing" ? colors.warning : colors.muted }]}>{trendLabel(insight.trend.direction)} pattern</Text> : null}
          </View>
        </CommandCard>

        <SectionHeading title="How the view is calculated" detail="Inputs stay visible: missing ratings are excluded instead of guessed." />
        <CommandCard accent={colors.primary} style={styles.methodCard}>
          <Text style={[styles.methodText, { color: colors.muted }]}>{insight.method}</Text>
          <View style={styles.methodDivider} />
          <Text style={[styles.methodCaption, { color: colors.primary }]}>The balance score is a visual summary only. It does not label, diagnose, predict, or replace professional care.</Text>
        </CommandCard>

        {insight.available ? <>
          <SectionHeading title="Recent reflection trend" detail={insight.trend.summary} />
          <CommandCard accent={colors.primary} style={styles.trendCard}>
            <MultiLineTrendChart series={trendSeries} accessibilityLabel="Transparent recent reflection supportive and load signal trend" />
            <View style={[styles.windowNote, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.windowNoteTitle, { color: colors.foreground }]}>Window comparison</Text>
              <Text style={[styles.windowNoteText, { color: colors.muted }]}>Latest {insight.trend.recentWindow} debrief{insight.trend.recentWindow === 1 ? "" : "s"} compared with the previous {insight.trend.earlierWindow}. Balance change: {insight.trend.change > 0 ? "+" : ""}{insight.trend.change} points.</Text>
            </View>
          </CommandCard>

          <SectionHeading title="Signal ledger" detail="Supportive signals and reported load are shown separately, using only your own ratings." />
          <View style={styles.signalStack}>
            <SignalGroup title="Supportive signals" role="supportive" signals={supportiveSignals} accent={colors.success} />
            <SignalGroup title="Reported load" role="load" signals={loadSignals} accent={colors.warning} />
          </View>

          <SectionHeading title="Debrief drill-down" detail="Open any reflection to inspect the exact values that contribute to this summary." />
          <View style={styles.recordStack}>
            {insight.records.map((record) => {
              const expanded = expandedRecordId === record.id;
              const feelingColor = record.feelingAfter === "great" || record.feelingAfter === "charged" ? colors.success : record.feelingAfter === "drained" || record.feelingAfter === "restless" ? colors.warning : colors.primary;
              return <Pressable key={record.id} onPress={() => setExpandedRecordId((current) => current === record.id ? null : record.id)} accessibilityRole="button" accessibilityState={{ expanded }} style={({ pressed }) => [styles.recordPressable, { opacity: pressed ? 0.78 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                <CommandCard accent={feelingColor} style={styles.recordCard}>
                  <View style={styles.recordHeading}>
                    <View style={styles.recordCopy}>
                      <Text style={[styles.recordTitle, { color: colors.foreground }]} numberOfLines={1}>{record.missionTitle}</Text>
                      <Text style={[styles.recordDetail, { color: colors.muted }]}>{record.subject} · {record.localDate} · {record.feelingAfter ? `${record.feelingAfter} after` : "feeling not rated"}</Text>
                    </View>
                    <StatusPill label={expanded ? "HIDE" : "DETAIL"} tone="primary" />
                  </View>
                  {expanded ? <View style={[styles.recordMetrics, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <RecordMetric label="Focus" value={rating(record.focus)} accent={colors.primary} />
                    <RecordMetric label="Motivation" value={rating(record.motivation)} accent={colors.success} />
                    <RecordMetric label="Clarity" value={rating(record.clarity)} accent="#C092FF" />
                    <RecordMetric label="Energy" value={rating(record.energy)} accent="#F4C95D" />
                    <RecordMetric label="Stress" value={rating(record.stress)} accent={colors.warning} />
                    <RecordMetric label="Distraction" value={rating(record.distraction)} accent={colors.warning} />
                    <RecordMetric label="Friction" value={rating(record.friction)} accent={colors.error} />
                  </View> : null}
                </CommandCard>
              </Pressable>;
            })}
          </View>
        </> : <CommandCard accent={colors.primary} style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No reflection signals yet</Text>
          <Text style={[styles.emptyDetail, { color: colors.muted }]}>Finish a mission and complete the optional debrief ratings for focus, energy, stress, clarity, motivation, distraction, and friction. You control what is logged; this screen will never fill in missing values.</Text>
        </CommandCard>}
      </ScrollView>
    </ScreenContainer>
  );
}

function SectionHeading({ title, detail }: { title: string; detail: string }) {
  const colors = useColors();
  return <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.sectionDetail, { color: colors.muted }]}>{detail}</Text></View>;
}

function SignalGroup({ title, role, signals, accent }: { title: string; role: "supportive" | "load"; signals: ReturnType<typeof getWellbeingInsight>["signals"]; accent: string }) {
  const colors = useColors();
  return <CommandCard accent={accent} style={styles.signalGroup}>
    <View style={styles.signalGroupHeading}><Text style={[styles.signalGroupTitle, { color: colors.foreground }]}>{title}</Text><StatusPill label={role === "supportive" ? "RESOURCE" : "PRESSURE"} tone={role === "supportive" ? "success" : "warning"} /></View>
    {signals.map((signal) => <View key={signal.id} style={[styles.signalRow, { borderColor: colors.border }]}>
      <View style={styles.signalCopy}><Text style={[styles.signalLabel, { color: colors.foreground }]}>{signal.label}</Text><Text style={[styles.signalDetail, { color: colors.muted }]}>{signal.detail}</Text></View>
      <View style={styles.signalValueWrap}><Text style={[styles.signalValue, { color: accent }]}>{signal.observations ? `${signal.average}/5` : "—"}</Text><Text style={[styles.signalTrend, { color: colors.muted }]}>{signal.observations ? trendLabel(signal.trend, role) : "No rating"}</Text></View>
    </View>)}
  </CommandCard>;
}

function RecordMetric({ label, value, accent }: { label: string; value: string; accent: string }) {
  const colors = useColors();
  return <View style={styles.recordMetric}><Text style={[styles.recordMetricLabel, { color: colors.muted }]}>{label.toUpperCase()}</Text><Text style={[styles.recordMetricValue, { color: accent }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 12, paddingBottom: 32 },
  safetyCard: { gap: 7 },
  safetyTopline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  privateLabel: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.8 },
  safetyTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  safetyDetail: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  balanceCard: { gap: 12 },
  balanceTopline: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  balanceCopy: { flex: 1, gap: 3 },
  balanceEyebrow: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.8 },
  balanceTitle: { fontSize: 17, lineHeight: 22, fontWeight: "900" },
  balanceScore: { width: 70, height: 70, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  balanceValue: { fontSize: 25, lineHeight: 29, fontWeight: "900" },
  balanceScoreLabel: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.6 },
  balanceDetail: { fontSize: 12, lineHeight: 18, fontWeight: "600" },
  balanceFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  trendChip: { fontSize: 10, lineHeight: 14, fontWeight: "900" },
  sectionHeading: { gap: 2, marginTop: 2 },
  sectionTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  sectionDetail: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  methodCard: { gap: 10 },
  methodText: { fontSize: 12, lineHeight: 18, fontWeight: "600" },
  methodDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#8B5CF655" },
  methodCaption: { fontSize: 11, lineHeight: 16, fontWeight: "900" },
  trendCard: { gap: 10 },
  windowNote: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 10, gap: 2 },
  windowNoteTitle: { fontSize: 11, lineHeight: 15, fontWeight: "900" },
  windowNoteText: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  signalStack: { gap: 10 },
  signalGroup: { gap: 8 },
  signalGroupHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  signalGroupTitle: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
  signalRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  signalCopy: { flex: 1, gap: 1 },
  signalLabel: { fontSize: 12, lineHeight: 16, fontWeight: "900" },
  signalDetail: { fontSize: 10, lineHeight: 14, fontWeight: "600" },
  signalValueWrap: { alignItems: "flex-end", gap: 1 },
  signalValue: { fontSize: 14, lineHeight: 18, fontWeight: "900" },
  signalTrend: { fontSize: 9, lineHeight: 12, fontWeight: "800" },
  recordStack: { gap: 8 },
  recordPressable: { borderRadius: 16 },
  recordCard: { gap: 9 },
  recordHeading: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  recordCopy: { flex: 1, minWidth: 0, gap: 2 },
  recordTitle: { fontSize: 13, lineHeight: 18, fontWeight: "900" },
  recordDetail: { fontSize: 10, lineHeight: 14, fontWeight: "600" },
  recordMetrics: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 9, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  recordMetric: { width: "30%", flexGrow: 1, gap: 1 },
  recordMetricLabel: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.5 },
  recordMetricValue: { fontSize: 11, lineHeight: 15, fontWeight: "900" },
  emptyCard: { gap: 6, paddingVertical: 22 },
  emptyTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900", textAlign: "center" },
  emptyDetail: { fontSize: 12, lineHeight: 18, fontWeight: "600", textAlign: "center" },
});
