import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { BarsChart, DonutChart, LineTrendChart, RadarChart } from "@/components/focus-charts";
import { CommandButton, CommandCard, IconAction, LoadingScreen, ScreenTitle, StatusPill } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  DashboardChartType,
  DashboardDateRange,
  DashboardFeatureFilter,
  DashboardMetricId,
  DashboardWidgetConfig,
  useFocusCommand,
} from "@/lib/focus-command";
import {
  DASHBOARD_CHART_TYPES,
  DASHBOARD_DATE_RANGES,
  DASHBOARD_FEATURE_FILTERS,
  DASHBOARD_METRICS,
  createDashboardWorkspaceWidget,
  getDashboardWorkspaceResult,
  workspaceCategories,
  workspaceSubjects,
} from "@/lib/dashboard-workspace";

const ACCENTS = ["#8B5CF6", "#F4C95D", "#49D17D", "#FF7A59", "#E879F9", "#60A5FA"];

function formatMetric(value: number, metric: DashboardMetricId, unit: string) {
  if (metric === "time") return `${value.toFixed(1)} h`;
  if (["focus", "stress", "clarity", "motivation", "distraction", "energy", "friction", "achievement", "feeling"].includes(metric)) return `${value.toFixed(1)} ${unit}`;
  if (metric === "gold") return `${value > 0 ? "+" : ""}${Math.round(value)} gold`;
  return `${Math.round(value)} ${unit}`;
}

function normaliseWidget(widget: DashboardWidgetConfig): DashboardWidgetConfig {
  return { ...widget, customStartDate: widget.customStartDate ?? "", customEndDate: widget.customEndDate ?? "" };
}

export default function CustomDashboardScreen() {
  const colors = useColors();
  const { state, ready, updateProfile } = useFocusCommand();
  const [expandedWidgetId, setExpandedWidgetId] = useState<string | null>(null);
  const widgets = useMemo(() => state.profile.dashboardWidgets.map(normaliseWidget), [state.profile.dashboardWidgets]);
  const subjects = useMemo(() => workspaceSubjects(state), [state]);
  const categories = useMemo(() => workspaceCategories(state), [state]);

  if (!ready) return <LoadingScreen label="Opening custom analytics…" />;

  const replaceWidgets = (nextWidgets: DashboardWidgetConfig[]) => updateProfile({ dashboardWidgets: nextWidgets });
  const updateWidget = (widgetId: string, patch: Partial<DashboardWidgetConfig>) => {
    replaceWidgets(widgets.map((widget) => widget.id === widgetId ? { ...widget, ...patch } : widget));
  };
  const addWidget = () => {
    if (widgets.length >= 6) {
      Alert.alert("Six widget limit", "Keep the workspace focused by editing one of the six saved widgets, or remove a widget to add another.");
      return;
    }
    const widget = createDashboardWorkspaceWidget(widgets.length);
    replaceWidgets([...widgets, widget]);
    setExpandedWidgetId(widget.id);
  };
  const removeWidget = (widgetId: string) => {
    Alert.alert("Remove this widget?", "This changes only your Custom Analytics workspace. The regular Dashboard remains unchanged.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          replaceWidgets(widgets.filter((widget) => widget.id !== widgetId));
          setExpandedWidgetId((current) => current === widgetId ? null : current);
        },
      },
    ]);
  };

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenTitle
          eyebrow="Dashboard within Dashboard"
          title="Custom analytics"
          detail="Build up to six personal views using any saved Focus Command metric, period, visual, and activity filter."
          right={<IconAction icon="chevron.right" label="Return to Dashboard" onPress={() => router.back()} />}
        />

        <CommandCard accent={colors.primary} style={styles.introCard}>
          <View style={styles.introTopline}>
            <View style={styles.introCopy}>
              <Text style={[styles.introTitle, { color: colors.foreground }]}>Your workspace, your evidence</Text>
              <Text style={[styles.introDetail, { color: colors.muted }]}>This is a separate configurable workspace. The original Command Intelligence Dashboard stays exactly where it is, with its existing focused analytics intact.</Text>
            </View>
            <StatusPill label={`${widgets.length}/6 SAVED`} tone="primary" icon="chart.xyaxis.line" />
          </View>
          <View style={styles.capabilityGrid}>
            {[
              ["Metric", "Power, XP, time, gold, mission, reflection, skill, emotion, and journal signals"],
              ["Filters", "Feature source, period, subject, category, and mission recurrence"],
              ["Display", "Line, bars, donut, radar, or a concise metric summary"],
            ].map(([label, detail]) => <View key={label} style={[styles.capabilityItem, { backgroundColor: colors.background, borderColor: colors.border }]}><Text style={[styles.capabilityLabel, { color: colors.primary }]}>{label.toUpperCase()}</Text><Text style={[styles.capabilityDetail, { color: colors.muted }]}>{detail}</Text></View>)}
          </View>
        </CommandCard>

        <View style={styles.workspaceHeader}>
          <View><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Saved workspace</Text><Text style={[styles.sectionDetail, { color: colors.muted }]}>{widgets.length ? "Tap a widget to revise every dimension or inspect its data." : "Start with a metric that matters to you."}</Text></View>
          <IconAction icon="plus" label="Add analytics widget" onPress={addWidget} disabled={widgets.length >= 6} color={colors.primary} />
        </View>

        <View style={styles.widgetStack}>
          {widgets.map((widget, index) => (
            <DashboardWidgetCard
              key={widget.id}
              widget={widget}
              accent={ACCENTS[index % ACCENTS.length]}
              expanded={expandedWidgetId === widget.id}
              subjects={subjects}
              categories={categories}
              onToggle={() => setExpandedWidgetId((current) => current === widget.id ? null : widget.id)}
              onUpdate={(patch) => updateWidget(widget.id, patch)}
              onRemove={() => removeWidget(widget.id)}
            />
          ))}
        </View>

        <CommandButton label={widgets.length ? "Add another widget" : "Create your first widget"} icon="plus" onPress={addWidget} disabled={widgets.length >= 6} />
        <Text style={[styles.privacyNote, { color: colors.muted }]}>Every view runs locally against your saved Focus Command records. Empty charts mean the chosen combination has no matching entries—not that a value has been inferred.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

function DashboardWidgetCard({
  widget,
  accent,
  expanded,
  subjects,
  categories,
  onToggle,
  onUpdate,
  onRemove,
}: {
  widget: DashboardWidgetConfig;
  accent: string;
  expanded: boolean;
  subjects: string[];
  categories: string[];
  onToggle: () => void;
  onUpdate: (patch: Partial<DashboardWidgetConfig>) => void;
  onRemove: () => void;
}) {
  const colors = useColors();
  const { state } = useFocusCommand();
  const result = useMemo(() => getDashboardWorkspaceResult(state, widget), [state, widget]);
  const chartLabel = DASHBOARD_CHART_TYPES.find((item) => item.id === widget.chartType)?.label ?? "Chart";
  const rangeLabel = DASHBOARD_DATE_RANGES.find((item) => item.id === widget.dateRange)?.label ?? "Period";

  return (
    <CommandCard accent={accent} style={styles.widgetCard}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityLabel={`Edit ${widget.title || result.metricLabel} dashboard widget`} style={({ pressed }) => [styles.widgetHeading, { opacity: pressed ? 0.78 : 1 }]}>
        <View style={styles.widgetHeadingCopy}>
          <Text style={[styles.widgetTitle, { color: colors.foreground }]}>{widget.title.trim() || result.metricLabel}</Text>
          <Text style={[styles.widgetDescription, { color: colors.muted }]}>{result.metricLabel} · {rangeLabel} · {chartLabel}</Text>
        </View>
        <StatusPill label={expanded ? "EDITING" : "TAP TO EDIT"} tone={expanded ? "primary" : "neutral"} />
      </Pressable>

      <WidgetPreview widget={widget} result={result} accent={accent} />

      <View style={styles.widgetFooter}>
        <Text numberOfLines={2} style={[styles.evidenceText, { color: colors.muted }]}>{result.dataDescription}</Text>
        <Text style={[styles.sampleText, { color: result.sampleCount ? colors.success : colors.muted }]}>{result.sampleCount ? `${result.sampleCount} matched record${result.sampleCount === 1 ? "" : "s"}` : "No matching records"}</Text>
      </View>

      {expanded ? <View style={[styles.editor, { borderColor: colors.border, backgroundColor: colors.background }]}>
        <Text style={[styles.editorTitle, { color: colors.foreground }]}>Configure this view</Text>
        <Text style={[styles.editorDetail, { color: colors.muted }]}>Each selection affects this widget only. Choose any combination; the preview updates from records that match it.</Text>

        <Text style={[styles.fieldLabel, { color: colors.muted }]}>WIDGET TITLE</Text>
        <TextInput value={widget.title} onChangeText={(title) => onUpdate({ title })} placeholder={result.metricLabel} placeholderTextColor={colors.muted} style={[styles.titleInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} />

        <OptionGroup label="Metric" items={DASHBOARD_METRICS.map((item) => ({ id: item.id, label: item.shortLabel }))} selected={widget.metric} accent={accent} onChange={(value) => onUpdate({ metric: value as DashboardMetricId })} />
        <OptionGroup label="Chart style" items={DASHBOARD_CHART_TYPES.map((item) => ({ id: item.id, label: item.label }))} selected={widget.chartType} accent={accent} onChange={(value) => onUpdate({ chartType: value as DashboardChartType })} />
        <OptionGroup label="Date range" items={DASHBOARD_DATE_RANGES} selected={widget.dateRange} accent={accent} onChange={(value) => onUpdate({ dateRange: value as DashboardDateRange })} />
        {widget.dateRange === "custom" ? <View style={styles.customDateRow}>
          <TextInput value={widget.customStartDate} onChangeText={(customStartDate) => onUpdate({ customStartDate })} autoCapitalize="none" placeholder="Start YYYY-MM-DD" placeholderTextColor={colors.muted} style={[styles.dateInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} />
          <TextInput value={widget.customEndDate} onChangeText={(customEndDate) => onUpdate({ customEndDate })} autoCapitalize="none" placeholder="End YYYY-MM-DD" placeholderTextColor={colors.muted} style={[styles.dateInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} />
        </View> : null}
        <Text style={[styles.dateHint, { color: colors.muted }]}>{widget.dateRange === "custom" ? "Use YYYY-MM-DD. Leaving either date blank falls back to a recent 30-day view or today." : "Choose Custom dates for an exact start and end date."}</Text>

        <OptionGroup label="Feature source" items={DASHBOARD_FEATURE_FILTERS} selected={widget.feature} accent={accent} onChange={(value) => onUpdate({ feature: value as DashboardFeatureFilter })} />
        <OptionGroup label="Subject" items={[{ id: "all", label: "All subjects" }, ...subjects.map((subject) => ({ id: subject, label: subject }))]} selected={widget.subject} accent={accent} onChange={(subject) => onUpdate({ subject })} />
        <OptionGroup label="Category" items={[{ id: "all", label: "All categories" }, ...categories.map((category) => ({ id: category, label: category }))]} selected={widget.category} accent={accent} onChange={(category) => onUpdate({ category })} />
        <OptionGroup label="Mission recurrence" items={[{ id: "all", label: "Any mission" }, { id: "once", label: "One-time" }, { id: "daily", label: "Daily" }]} selected={widget.missionFrequency} accent={accent} onChange={(missionFrequency) => onUpdate({ missionFrequency: missionFrequency as DashboardWidgetConfig["missionFrequency"] })} />

        <View style={styles.editorActions}>
          <CommandButton label="Done editing" icon="checklist" variant="secondary" onPress={onToggle} style={styles.actionButton} />
          <CommandButton label="Remove" icon="xmark" variant="danger" onPress={onRemove} style={styles.actionButton} />
        </View>
      </View> : null}
    </CommandCard>
  );
}

function WidgetPreview({ widget, result, accent }: { widget: DashboardWidgetConfig; result: ReturnType<typeof getDashboardWorkspaceResult>; accent: string }) {
  const colors = useColors();
  if (!result.sampleCount) return <View style={styles.emptyPreview}><Text style={[styles.emptyPreviewText, { color: colors.muted }]}>{result.emptyMessage}</Text></View>;
  if (widget.chartType === "number") return <View style={[styles.metricPreview, { backgroundColor: `${accent}12`, borderColor: `${accent}44` }]}>
    <Text style={[styles.metricPreviewValue, { color: accent }]}>{formatMetric(result.total, widget.metric, result.unit)}</Text>
    <Text style={[styles.metricPreviewLabel, { color: colors.foreground }]}>{result.metricLabel}</Text>
    <Text style={[styles.metricPreviewDetail, { color: colors.muted }]}>Average active period: {formatMetric(result.average, widget.metric, result.unit)}</Text>
  </View>;
  if (widget.chartType === "donut") return <View style={styles.centerPreview}><DonutChart points={result.breakdown} centerValue={formatMetric(result.total, widget.metric, result.unit)} centerLabel={result.metricLabel.toUpperCase()} accessibilityLabel={`${result.metricLabel} distribution chart`} /></View>;
  if (widget.chartType === "radar") return <View style={styles.centerPreview}><RadarChart points={result.breakdown.slice(0, 5)} color={accent} accessibilityLabel={`${result.metricLabel} filtered comparison chart`} /></View>;
  if (widget.chartType === "bar") return <BarsChart points={result.points} color={accent} accessibilityLabel={`${result.metricLabel} bar chart`} />;
  return <LineTrendChart points={result.points} color={accent} accessibilityLabel={`${result.metricLabel} line chart`} />;
}

function OptionGroup({ label, items, selected, accent, onChange }: { label: string; items: { id: string; label: string }[]; selected: string; accent: string; onChange: (value: string) => void }) {
  const colors = useColors();
  return <View style={styles.optionGroup}>
    <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label.toUpperCase()}</Text>
    <View style={styles.optionWrap}>{items.map((item) => {
      const active = selected === item.id;
      return <Pressable key={item.id} onPress={() => onChange(item.id)} accessibilityRole="button" accessibilityState={{ selected: active }} style={({ pressed }) => [styles.option, { borderColor: active ? accent : colors.border, backgroundColor: active ? `${accent}18` : colors.surface, opacity: pressed ? 0.72 : 1 }]}><Text numberOfLines={1} style={[styles.optionLabel, { color: active ? accent : colors.muted }]}>{item.label}</Text></Pressable>;
    })}</View>
  </View>;
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 12, paddingBottom: 32 },
  introCard: { gap: 12 },
  introTopline: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  introCopy: { flex: 1, gap: 4 },
  introTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  introDetail: { fontSize: 12, lineHeight: 18, fontWeight: "500" },
  capabilityGrid: { gap: 7 },
  capabilityItem: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9, gap: 2 },
  capabilityLabel: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.7 },
  capabilityDetail: { fontSize: 11, lineHeight: 15, fontWeight: "600" },
  workspaceHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 2 },
  sectionTitle: { fontSize: 17, lineHeight: 22, fontWeight: "900" },
  sectionDetail: { fontSize: 11, lineHeight: 15, fontWeight: "600", marginTop: 2, maxWidth: 286 },
  widgetStack: { gap: 12 },
  widgetCard: { gap: 12 },
  widgetHeading: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  widgetHeadingCopy: { flex: 1, minWidth: 0 },
  widgetTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  widgetDescription: { fontSize: 11, lineHeight: 16, fontWeight: "600", marginTop: 2 },
  widgetFooter: { gap: 3 },
  evidenceText: { fontSize: 10, lineHeight: 14, fontWeight: "600" },
  sampleText: { fontSize: 10, lineHeight: 14, fontWeight: "900" },
  emptyPreview: { minHeight: 122, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  emptyPreviewText: { fontSize: 12, lineHeight: 18, fontWeight: "600", textAlign: "center" },
  centerPreview: { alignItems: "center", justifyContent: "center", minHeight: 168 },
  metricPreview: { minHeight: 136, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 16, justifyContent: "center", gap: 4 },
  metricPreviewValue: { fontSize: 26, lineHeight: 32, fontWeight: "900" },
  metricPreviewLabel: { fontSize: 13, lineHeight: 18, fontWeight: "900" },
  metricPreviewDetail: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  editor: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 12, gap: 12 },
  editorTitle: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
  editorDetail: { fontSize: 11, lineHeight: 16, fontWeight: "600", marginTop: -7 },
  fieldLabel: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.75 },
  titleInput: { minHeight: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 11, fontSize: 13, lineHeight: 18, fontWeight: "700", marginTop: -7 },
  optionGroup: { gap: 6 },
  optionWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  option: { maxWidth: "100%", borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  optionLabel: { fontSize: 10, lineHeight: 14, fontWeight: "800" },
  customDateRow: { flexDirection: "row", gap: 8, marginTop: -5 },
  dateInput: { flex: 1, minHeight: 42, borderWidth: StyleSheet.hairlineWidth, borderRadius: 11, paddingHorizontal: 9, fontSize: 11, lineHeight: 16, fontWeight: "700" },
  dateHint: { fontSize: 10, lineHeight: 14, fontWeight: "600", marginTop: -7 },
  editorActions: { flexDirection: "row", gap: 8 },
  actionButton: { flex: 1 },
  privacyNote: { fontSize: 10, lineHeight: 15, fontWeight: "600", textAlign: "center", paddingHorizontal: 10 },
});
