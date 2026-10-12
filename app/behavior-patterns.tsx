import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { CalendarDateRangeField } from "@/components/calendar-date-picker";
import { CommandButton, CommandCard, IconAction, LoadingScreen, MetricTile, ScreenTitle, SectionHeader, StatusPill } from "@/components/focus-ui";
import { LineTrendChart } from "@/components/focus-charts";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFocusCommandActions, useFocusCommandReady, useFocusCommandSelector } from "@/lib/focus-command";
import {
  BEHAVIOR_ACTION_TYPES,
  BEHAVIOR_CONSEQUENCE_TYPES,
  BEHAVIOR_THOUGHT_PATTERNS,
  BEHAVIOR_URGE_TYPES,
  formatBehaviorLabel,
  getBehaviorPatternsSummary,
  type BehaviorActionType,
  type BehaviorConsequenceType,
  type BehaviorLogDraft,
  type BehaviorPatternsRangeKind,
  type BehaviorThoughtPattern,
  type BehaviorUrgeType,
} from "@/lib/behavior-patterns";

const RANGE_OPTIONS: BehaviorPatternsRangeKind[] = ["today", "week", "month", "year", "custom"];
const THOUGHT_PATTERN_DETAILS: Record<BehaviorThoughtPattern, string> = {
  all_or_nothing: "All-or-nothing",
  overgeneralizing: "Overgeneralising",
  negative_filter: "Negative filter",
  discounting_positive: "Discounting positives",
  worst_case: "Worst-case prediction",
  mind_reading: "Mind-reading",
  emotional_reasoning: "Emotional reasoning",
  magnifying_minimizing: "Magnifying/minimising",
  should_must: "Should/must rules",
  labeling: "Labelling",
  personalizing: "Personalising",
  blaming: "Blaming",
  not_sure: "Not sure",
  custom: "Custom pattern",
};

function Chip({ label, active, onPress, color }: { label: string; active: boolean; onPress: () => void; color: string }) {
  const colors = useColors();
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.chip, { borderColor: active ? color : colors.border, backgroundColor: active ? `${color}1A` : colors.background, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.chipText, { color: active ? color : colors.muted }]}>{label}</Text></Pressable>;
}

function Field({ label, value, onChangeText, placeholder, multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean }) {
  const colors = useColors();
  return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} multiline={multiline} style={[styles.input, multiline && styles.multilineInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /></View>;
}

export default function BehaviorPatternsScreen() {
  const colors = useColors();
  const ready = useFocusCommandReady();
  const { addBehaviorLog, removeBehaviorLog } = useFocusCommandActions();
  const { behaviorLogs, timezone } = useFocusCommandSelector((state) => ({ behaviorLogs: state.behaviorLogs, timezone: state.profile.timezone }), (left, right) => left.behaviorLogs === right.behaviorLogs && left.timezone === right.timezone);
  const [rangeKind, setRangeKind] = useState<BehaviorPatternsRangeKind>("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showComposer, setShowComposer] = useState(true);
  const [showFullReflection, setShowFullReflection] = useState(false);
  const [trigger, setTrigger] = useState("");
  const [urgeType, setUrgeType] = useState<BehaviorUrgeType>("avoidance");
  const [urgeBefore, setUrgeBefore] = useState("");
  const [automaticThought, setAutomaticThought] = useState("");
  const [emotion, setEmotion] = useState("");
  const [bodyResponse, setBodyResponse] = useState("");
  const [actionType, setActionType] = useState<BehaviorActionType>("avoided");
  const [action, setAction] = useState("");
  const [immediateConsequence, setImmediateConsequence] = useState<BehaviorConsequenceType>("relief");
  const [urgeAfter, setUrgeAfter] = useState("");
  const [evidenceFor, setEvidenceFor] = useState("");
  const [evidenceAgainst, setEvidenceAgainst] = useState("");
  const [thoughtPatterns, setThoughtPatterns] = useState<BehaviorThoughtPattern[]>([]);
  const [customThoughtPattern, setCustomThoughtPattern] = useState("");
  const [balancedThought, setBalancedThought] = useState("");
  const [alternativeAction, setAlternativeAction] = useState("");
  const [alternativeHelpful, setAlternativeHelpful] = useState<boolean | null>(null);
  const [laterConsequence, setLaterConsequence] = useState("");

  const summary = useMemo(() => getBehaviorPatternsSummary(behaviorLogs, rangeKind, timezone, customStart, customEnd), [behaviorLogs, customEnd, customStart, rangeKind, timezone]);
  const recentLogs = useMemo(() => [...behaviorLogs].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 30), [behaviorLogs]);

  const resetComposer = () => {
    setTrigger("");
    setUrgeType("avoidance");
    setUrgeBefore("");
    setAutomaticThought("");
    setEmotion("");
    setBodyResponse("");
    setActionType("avoided");
    setAction("");
    setImmediateConsequence("relief");
    setUrgeAfter("");
    setEvidenceFor("");
    setEvidenceAgainst("");
    setThoughtPatterns([]);
    setCustomThoughtPattern("");
    setBalancedThought("");
    setAlternativeAction("");
    setAlternativeHelpful(null);
    setLaterConsequence("");
    setShowFullReflection(false);
  };

  const saveLog = () => {
    const draft: BehaviorLogDraft = {
      trigger,
      urgeType,
      urgeIntensityBefore: urgeBefore.trim() ? Number(urgeBefore) : null,
      automaticThought,
      emotion,
      bodyResponse,
      actionType,
      action,
      immediateConsequence,
      urgeIntensityAfter: urgeAfter.trim() ? Number(urgeAfter) : null,
      evidenceFor,
      evidenceAgainst,
      thoughtPatterns,
      customThoughtPattern,
      balancedThought,
      alternativeAction,
      alternativeHelpful,
      laterConsequence,
    };
    if (!addBehaviorLog(draft)) {
      Alert.alert("Add a situation first", "A short description of what was happening helps connect the urge to its context.");
      return;
    }
    resetComposer();
    setShowComposer(false);
  };

  const toggleThoughtPattern = (pattern: BehaviorThoughtPattern) => setThoughtPatterns((current) => current.includes(pattern) ? current.filter((item) => item !== pattern) : [...current, pattern].slice(0, 8));

  if (!ready) return <LoadingScreen label="Opening Behaviour Patterns…" />;

  return <ScreenContainer>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ScreenTitle eyebrow="PRIVATE · OFFLINE SELF-OBSERVATION" title="Behaviour Patterns" detail="Notice what rises before an action, then learn from the loop without diagnosing yourself." right={<IconAction icon="xmark" label="Close Behaviour Patterns" onPress={() => router.back()} />} />

      <CommandCard accent="#A78BFA" style={styles.introCard}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Trigger → urge → thought → action → consequence</Text>
        <Text style={[styles.cardDetail, { color: colors.muted }]}>These are your recorded associations, not a diagnosis or proof that one event caused another. Quick logging is enough; full reflection is optional.</Text>
      </CommandCard>

      <SectionHeader title="Your view" />
      <View style={styles.rangeRow}>{RANGE_OPTIONS.map((kind) => <Chip key={kind} label={kind === "today" ? "TODAY" : kind === "week" ? "WEEK" : kind === "month" ? "MONTH" : kind === "year" ? "YEAR" : "CUSTOM"} active={rangeKind === kind} onPress={() => setRangeKind(kind)} color="#A78BFA" />)}</View>
      {rangeKind === "custom" ? <CalendarDateRangeField label="Choose an inclusive behaviour period" startDate={customStart} endDate={customEnd} onChange={(start, end) => { setCustomStart(start); setCustomEnd(end); }} /> : null}
      {!summary.range.valid ? <CommandCard accent={colors.warning} style={styles.messageCard}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Choose both custom dates</Text><Text style={[styles.cardDetail, { color: colors.muted }]}>No calculation runs until the start and end dates are complete and the start is not later than the end.</Text></CommandCard> : null}

      <SectionHeader title="Pattern summary" />
      <View style={styles.metricGrid}>
        <MetricTile style={styles.metricTile} label="Logs" value={String(summary.totalLogs)} detail={`${summary.range.label.toLowerCase()} period`} icon="chart.xyaxis.line" accent="#A78BFA" />
        <MetricTile style={styles.metricTile} label="High urge" value={String(summary.highUrgeLogs)} detail="7/10 or higher before action" icon="bolt.fill" accent={colors.warning} />
        <MetricTile style={styles.metricTile} label="Urge before" value={summary.averageUrgeBefore === null ? "—" : `${summary.averageUrgeBefore}/10`} detail={summary.peakUrgeBefore === null ? "No rating yet" : `Peak ${summary.peakUrgeBefore}/10`} icon="target" accent={colors.primary} />
        <MetricTile style={styles.metricTile} label="Urge change" value={summary.averageUrgeChange === null ? "—" : `${summary.averageUrgeChange > 0 ? "+" : ""}${summary.averageUrgeChange}`} detail="After minus before" icon="chart.xyaxis.line" accent={colors.success} />
        <MetricTile style={styles.metricTile} label="Alternatives" value={String(summary.alternativeActionAttempts)} detail={summary.alternativeHelpfulRate === null ? "No helpfulness rating" : `${Math.round(summary.alternativeHelpfulRate * 100)}% marked helpful`} icon="checklist" accent={colors.success} />
        <MetricTile style={styles.metricTile} label="Mission links" value={String(summary.linkedMissionLogs)} detail={`${summary.linkedCalendarLogs} calendar link${summary.linkedCalendarLogs === 1 ? "" : "s"}`} icon="book.closed.fill" accent="#F4C95D" />
      </View>
      {summary.dailySeries.some((point) => point.logs > 0) ? <CommandCard accent="#A78BFA" style={styles.chartCard}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Daily behaviour trend</Text><Text style={[styles.cardDetail, { color: colors.muted }]}>Log count by local date in the selected period.</Text><LineTrendChart points={summary.dailySeries.map((point) => ({ label: point.localDate.slice(5), value: point.logs }))} color="#A78BFA" accessibilityLabel="Behaviour log count by day" /></CommandCard> : null}

      <View style={styles.summaryColumns}>
        <SummaryList title="Top triggers" items={summary.triggerCounts.slice(0, 5)} color="#A78BFA" />
        <SummaryList title="Urges" items={summary.urgeTypeCounts.slice(0, 5)} color={colors.warning} />
        <SummaryList title="Actions" items={summary.actionCounts.slice(0, 5)} color={colors.success} />
        <SummaryList title="Thinking patterns" items={summary.thoughtPatternCounts.slice(0, 5)} color="#60A5FA" />
      </View>

      <SectionHeader title="Log an event" action={showComposer ? "Minimise" : "Open form"} onAction={() => setShowComposer((current) => !current)} />
      {showComposer ? <CommandCard accent="#A78BFA" style={styles.formCard}>
        <Field label="Situation or trigger" value={trigger} onChangeText={setTrigger} placeholder="What was happening just before the urge?" multiline />
        <Text style={[styles.fieldLabel, { color: colors.muted }]}>What urge appeared?</Text>
        <View style={styles.chipWrap}>{BEHAVIOR_URGE_TYPES.map((item) => <Chip key={item} label={formatBehaviorLabel(item)} active={urgeType === item} onPress={() => setUrgeType(item)} color="#A78BFA" />)}</View>
        <Field label="Urge intensity before action (0–10, optional)" value={urgeBefore} onChangeText={setUrgeBefore} placeholder="For example, 7" />
        <Field label="Automatic thought (optional)" value={automaticThought} onChangeText={setAutomaticThought} placeholder="What went through your mind?" multiline />
        <Field label="Emotion and body response (optional)" value={emotion} onChangeText={setEmotion} placeholder="For example, tense, restless, heavy chest" multiline />
        <Text style={[styles.fieldLabel, { color: colors.muted }]}>What did you do?</Text>
        <View style={styles.chipWrap}>{BEHAVIOR_ACTION_TYPES.map((item) => <Chip key={item} label={formatBehaviorLabel(item)} active={actionType === item} onPress={() => setActionType(item)} color={colors.success} />)}</View>
        <Field label="Action detail (optional)" value={action} onChangeText={setAction} placeholder="What did you actually do?" multiline />
        <Text style={[styles.fieldLabel, { color: colors.muted }]}>What happened immediately afterward?</Text>
        <View style={styles.chipWrap}>{BEHAVIOR_CONSEQUENCE_TYPES.map((item) => <Chip key={item} label={formatBehaviorLabel(item)} active={immediateConsequence === item} onPress={() => setImmediateConsequence(item)} color={colors.warning} />)}</View>
        <Field label="Urge intensity afterward (0–10, optional)" value={urgeAfter} onChangeText={setUrgeAfter} placeholder="For example, 3" />
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: showFullReflection }} onPress={() => setShowFullReflection((current) => !current)} style={[styles.reflectionToggle, { borderColor: colors.border, backgroundColor: colors.background }]}><Text style={[styles.reflectionToggleText, { color: colors.primary }]}>{showFullReflection ? "Hide full reflection" : "Add full reflection (optional)"}</Text></Pressable>
        {showFullReflection ? <>
          <Field label="Evidence supporting the thought" value={evidenceFor} onChangeText={setEvidenceFor} placeholder="What seems to support it?" multiline />
          <Field label="Evidence against or missing evidence" value={evidenceAgainst} onChangeText={setEvidenceAgainst} placeholder="What else may be true?" multiline />
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Possible thinking pattern (choose only if useful)</Text>
          <View style={styles.chipWrap}>{BEHAVIOR_THOUGHT_PATTERNS.map((item) => <Chip key={item} label={THOUGHT_PATTERN_DETAILS[item]} active={thoughtPatterns.includes(item)} onPress={() => toggleThoughtPattern(item)} color="#60A5FA" />)}</View>
          {thoughtPatterns.includes("custom") ? <Field label="Custom pattern" value={customThoughtPattern} onChangeText={setCustomThoughtPattern} placeholder="Name it in your own words" /> : null}
          <Field label="Balanced or neutral thought" value={balancedThought} onChangeText={setBalancedThought} placeholder="What is a more flexible way to view it?" multiline />
          <Field label="Alternative action" value={alternativeAction} onChangeText={setAlternativeAction} placeholder="What else could you try next time?" multiline />
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Was the alternative helpful?</Text>
          <View style={styles.chipWrap}><Chip label="Yes" active={alternativeHelpful === true} onPress={() => setAlternativeHelpful(true)} color={colors.success} /><Chip label="No" active={alternativeHelpful === false} onPress={() => setAlternativeHelpful(false)} color={colors.warning} /><Chip label="Not rated" active={alternativeHelpful === null} onPress={() => setAlternativeHelpful(null)} color={colors.muted} /></View>
          <Field label="Later consequence" value={laterConsequence} onChangeText={setLaterConsequence} placeholder="What happened later?" multiline />
        </> : null}
        <CommandButton label="Save behaviour log" icon="checklist" onPress={saveLog} />
      </CommandCard> : null}

      <SectionHeader title="Recent logs" />
      {recentLogs.length ? recentLogs.map((log) => <CommandCard key={log.id} accent={log.urgeIntensityBefore !== null && log.urgeIntensityBefore >= 7 ? colors.warning : "#A78BFA"} style={styles.logCard}>
        <View style={styles.logHeader}><View style={styles.logCopy}><Text style={[styles.logDate, { color: colors.primary }]}>{log.localDate} · {formatBehaviorLabel(log.urgeType)}</Text><Text style={[styles.logTitle, { color: colors.foreground }]}>{log.trigger}</Text></View><StatusPill label={log.urgeIntensityBefore === null ? "NO RATING" : `${log.urgeIntensityBefore}/10 URGE`} tone={log.urgeIntensityBefore !== null && log.urgeIntensityBefore >= 7 ? "warning" : "primary"} /></View>
        <Text style={[styles.logDetail, { color: colors.muted }]}>{log.automaticThought || "No automatic thought recorded."} · {formatBehaviorLabel(log.actionType)} · {formatBehaviorLabel(log.immediateConsequence)}</Text>
        {log.balancedThought ? <Text style={[styles.logDetail, { color: colors.success }]}>Balanced thought: {log.balancedThought}</Text> : null}
        <CommandButton label="Delete log" variant="danger" onPress={() => Alert.alert("Delete this behaviour log?", "This removes only the selected local record.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => removeBehaviorLog(log.id) }])} />
      </CommandCard>) : <CommandCard accent="#A78BFA" style={styles.emptyCard}><Text style={[styles.cardTitle, { color: colors.foreground }]}>No behaviour logs yet</Text><Text style={[styles.cardDetail, { color: colors.muted }]}>Use the short form above when you notice an urge. Your first entry will appear here and in the selected dashboard period.</Text></CommandCard>}

      <Text style={[styles.disclaimer, { color: colors.muted }]}>Private offline reflection only. These records describe your own observations and do not diagnose a mental-health condition or prove causation.</Text>
    </ScrollView>
  </ScreenContainer>;
}

function SummaryList({ title, items, color }: { title: string; items: { label: string; count: number }[]; color: string }) {
  const colors = useColors();
  return <CommandCard accent={color} style={styles.summaryCard}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>{items.length ? items.map((item) => <View key={item.label} style={styles.summaryRow}><Text numberOfLines={1} style={[styles.summaryLabel, { color: colors.muted }]}>{item.label}</Text><Text style={[styles.summaryCount, { color }]}>{item.count}</Text></View>) : <Text style={[styles.cardDetail, { color: colors.muted }]}>No records in this period.</Text>}</CommandCard>;
}

const styles = StyleSheet.create({
  content: { gap: 13, paddingTop: 12, paddingBottom: 36 },
  introCard: { gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "900" },
  cardDetail: { fontSize: 13, lineHeight: 19, fontWeight: "600" },
  rangeRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 },
  chipText: { fontSize: 11, fontWeight: "900" },
  messageCard: { gap: 5 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  metricTile: { flexBasis: "47%", flexGrow: 1, minWidth: 140 },
  chartCard: { gap: 7 },
  summaryColumns: { gap: 9 },
  summaryCard: { gap: 8 },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, paddingVertical: 2 },
  summaryLabel: { flex: 1, fontSize: 12, fontWeight: "800" },
  summaryCount: { fontSize: 14, fontWeight: "900" },
  formCard: { gap: 10 },
  field: { gap: 5 },
  fieldLabel: { fontSize: 11, fontWeight: "900", letterSpacing: 0.25 },
  input: { minHeight: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 10, fontSize: 14, fontWeight: "600" },
  multilineInput: { minHeight: 78, textAlignVertical: "top" },
  reflectionToggle: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12 },
  reflectionToggleText: { fontSize: 13, fontWeight: "900", textAlign: "center" },
  logCard: { gap: 8 },
  logHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  logCopy: { flex: 1, gap: 4 },
  logDate: { fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  logTitle: { fontSize: 16, fontWeight: "900" },
  logDetail: { fontSize: 12, lineHeight: 18, fontWeight: "600" },
  emptyCard: { gap: 7 },
  disclaimer: { fontSize: 11, lineHeight: 17, fontWeight: "600", textAlign: "center", paddingHorizontal: 8 },
});
