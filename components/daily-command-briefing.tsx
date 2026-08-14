import { StyleSheet, Text, View } from "react-native";

import { CommandButton, CommandCard } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { DailyCommandBriefing as DailyCommandBriefingModel } from "@/lib/daily-command-briefing";

function BriefMetric({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

export function DailyCommandBriefing({ briefing, onPriorityPress }: { briefing: DailyCommandBriefingModel; onPriorityPress: () => void }) {
  const colors = useColors();
  return (
    <CommandCard accent={colors.primary} style={styles.card}>
      <View style={styles.topline}>
        <View style={styles.commandMark}>
          <IconSymbol name="target" size={16} color={colors.primary} />
          <Text style={[styles.eyebrow, { color: colors.primary }]}>TODAY&apos;S COMMAND</Text>
        </View>
        <Text style={[styles.status, { color: colors.muted }]}>{briefing.localTime}</Text>
      </View>
      <Text style={[styles.greeting, { color: colors.foreground }]}>{briefing.greeting}</Text>

      <View style={[styles.metricsPanel, { borderColor: colors.border, backgroundColor: `${colors.background}80` }]}>
        <BriefMetric label="OPEN MISSIONS" value={String(briefing.openMissionCount)} />
        <BriefMetric label="DAILY TARGET" value={`${briefing.dailyTarget.earned}/${briefing.dailyTarget.target} XP`} />
        <BriefMetric label="ENERGY" value={`${briefing.energyPercent}%`} />
        <BriefMetric label="STREAK" value={`${briefing.streakDays} DAY${briefing.streakDays === 1 ? "" : "S"}`} />
      </View>

      <View style={[styles.priorityPanel, { borderColor: `${colors.primary}38`, backgroundColor: `${colors.primary}0E` }]}>
        <Text style={[styles.priorityLabel, { color: colors.primary }]}>PRIORITY</Text>
        <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.priorityTitle, { color: colors.foreground }]}>{briefing.priority.title}</Text>
        <Text numberOfLines={2} ellipsizeMode="tail" style={[styles.priorityDetail, { color: colors.muted }]}>{briefing.priority.detail}</Text>
        <CommandButton label={briefing.priority.actionLabel} icon="chevron.right" variant="secondary" onPress={onPriorityPress} />
      </View>
    </CommandCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12, padding: 15 },
  topline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  commandMark: { flexDirection: "row", alignItems: "center", gap: 6, minWidth: 0 },
  eyebrow: { fontSize: 10, lineHeight: 13, letterSpacing: 1.05, fontWeight: "900" },
  status: { fontSize: 9, lineHeight: 12, letterSpacing: 0.85, fontWeight: "800" },
  greeting: { fontSize: 15, lineHeight: 20, fontWeight: "800" },
  metricsPanel: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, overflow: "hidden", flexDirection: "row", flexWrap: "wrap" },
  metric: { width: "50%", minHeight: 57, paddingHorizontal: 11, paddingVertical: 9, justifyContent: "center" },
  metricValue: { fontSize: 15, lineHeight: 19, fontWeight: "900" },
  metricLabel: { fontSize: 9, lineHeight: 12, letterSpacing: 0.6, fontWeight: "800", marginTop: 1 },
  priorityPanel: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 12, gap: 3 },
  priorityLabel: { fontSize: 9, lineHeight: 12, letterSpacing: 0.9, fontWeight: "900" },
  priorityTitle: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
  priorityDetail: { fontSize: 11, lineHeight: 15, fontWeight: "600", marginBottom: 6 },
});
