import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { PersonalGraphTrendChart } from "@/components/focus-charts";
import { CommandButton, CommandCard, IconAction, LoadingScreen, ScreenTitle, SectionHeader, StatusPill } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFocusCommandActions, useFocusCommandReady, useFocusCommandSelector } from "@/lib/focus-command";
import { PERSONAL_GRAPH_COLORS, type PersonalGraphDatePrecision, type PersonalGraphRange } from "@/lib/personal-graphs";

const precisionOptions: { value: PersonalGraphDatePrecision; label: string; example: string }[] = [
  { value: "date", label: "Exact date", example: "2026-09-02" },
  { value: "month", label: "Month", example: "2026-09" },
  { value: "year", label: "Year", example: "2026" },
];
const rangeOptions: { value: PersonalGraphRange; label: string }[] = [
  { value: "30d", label: "30D" }, { value: "90d", label: "90D" }, { value: "1y", label: "1Y" }, { value: "5y", label: "5Y" }, { value: "all", label: "All" },
];

export default function PersonalGraphsScreen() {
  const colors = useColors();
  const ready = useFocusCommandReady();
  const { graphId } = useLocalSearchParams<{ graphId?: string }>();
  const graphs = useFocusCommandSelector((state) => state.personalGraphs);
  const {
    updatePersonalGraph,
    addPersonalGraphLine,
    updatePersonalGraphLine,
    removePersonalGraphLine,
    addPersonalGraphPoint,
    updatePersonalGraphPoint,
    removePersonalGraphPoint,
  } = useFocusCommandActions();
  const [selectedGraphId, setSelectedGraphId] = useState(graphId && graphs.some((graph) => graph.id === graphId) ? graphId : graphs[0]?.id ?? "");
  const graph = graphs.find((candidate) => candidate.id === selectedGraphId) ?? graphs[0];
  const [titleDraft, setTitleDraft] = useState(graph?.title ?? "");
  const [xAxisDraft, setXAxisDraft] = useState(graph?.xAxisLabel ?? "Date");
  const [yAxisDraft, setYAxisDraft] = useState(graph?.yAxisLabel ?? "Value");
  const [lineDraft, setLineDraft] = useState("");
  const [selectedLineId, setSelectedLineId] = useState("");
  const [xValue, setXValue] = useState("");
  const [yValue, setYValue] = useState("");
  const [range, setRange] = useState<PersonalGraphRange>("5y");
  const [editingPointId, setEditingPointId] = useState<string | null>(null);

  useEffect(() => {
    if (!graph) return;
    setTitleDraft(graph.title);
    setXAxisDraft(graph.xAxisLabel);
    setYAxisDraft(graph.yAxisLabel);
    setSelectedLineId((current) => graph.lines.some((line) => line.id === current) ? current : graph.lines[0]?.id ?? "");
    setEditingPointId(null);
    setXValue("");
    setYValue("");
  }, [graph]);

  const pointRows = useMemo(() => graph?.points.slice().sort((left, right) => right.xValue.localeCompare(left.xValue) || right.updatedAt.localeCompare(left.updatedAt)) ?? [], [graph?.points]);
  if (!ready || !graph) return <LoadingScreen label="Opening Personal Graph Studio…" />;

  const saveLabels = () => updatePersonalGraph(graph.id, {
    title: titleDraft.trim() || graph.title,
    xAxisLabel: xAxisDraft.trim() || "Date",
    yAxisLabel: yAxisDraft.trim() || "Value",
  });
  const changePrecision = (precision: PersonalGraphDatePrecision) => {
    if (precision === graph.datePrecision) return;
    if (graph.points.length) {
      Alert.alert("Time format locked", "This graph already has saved points. Its time format stays locked so no dates are changed or lost. Use one of the other two Personal Graph slots for a different time format.");
      return;
    }
    updatePersonalGraph(graph.id, { datePrecision: precision });
  };
  const addLine = () => {
    const lineId = addPersonalGraphLine(graph.id, lineDraft);
    if (!lineId) {
      Alert.alert("Line unavailable", graph.lines.length >= 4 ? "Each Personal Graph supports up to four lines." : "Write a name for this line first.");
      return;
    }
    setSelectedLineId(lineId);
    setLineDraft("");
  };
  const savePoint = () => {
    if (!selectedLineId) {
      Alert.alert("Add a line first", "Create and select a named line before adding a value.");
      return;
    }
    const draft = { lineId: selectedLineId, xValue, yValue: Number(yValue) };
    if (!Number.isFinite(draft.yValue)) {
      Alert.alert("Enter a number", `Write a numeric ${graph.yAxisLabel || "Y-axis"} value.`);
      return;
    }
    if (editingPointId) updatePersonalGraphPoint(graph.id, editingPointId, draft);
    else if (!addPersonalGraphPoint(graph.id, draft)) {
      Alert.alert("Point unavailable", `Use a valid ${graph.datePrecision} value, and keep one point per line for each time value.`);
      return;
    }
    setEditingPointId(null);
    setXValue("");
    setYValue("");
  };
  const startEditingPoint = (pointId: string) => {
    const point = graph.points.find((candidate) => candidate.id === pointId);
    if (!point) return;
    setEditingPointId(point.id);
    setSelectedLineId(point.lineId);
    setXValue(point.xValue);
    setYValue(String(point.yValue));
  };
  const selectedPrecision = precisionOptions.find((option) => option.value === graph.datePrecision) ?? precisionOptions[0];

  return <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]}>
    <FlatList
      data={pointRows}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<>
        <ScreenTitle eyebrow="Independent data" title="Personal Graph Studio" detail="Create three private graphs from numbers you enter yourself. Lines cross only when your own values cross." right={<IconAction icon="xmark" label="Close Personal Graph Studio" onPress={() => router.back()} />} />
        <View style={styles.slotRow}>{graphs.map((slot, index) => <Pressable key={slot.id} onPress={() => setSelectedGraphId(slot.id)} style={({ pressed }) => [styles.slotButton, { borderColor: slot.id === graph.id ? colors.primary : colors.border, backgroundColor: slot.id === graph.id ? `${colors.primary}18` : colors.surface, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.slotEyebrow, { color: slot.id === graph.id ? colors.primary : colors.muted }]}>GRAPH {index + 1}</Text><Text numberOfLines={1} style={[styles.slotText, { color: colors.foreground }]}>{slot.title}</Text></Pressable>)}</View>

        <SectionHeader title="Graph identity" />
        <CommandCard accent={colors.primary} style={styles.cardStack}>
          <TextInput value={titleDraft} onChangeText={setTitleDraft} onEndEditing={saveLabels} placeholder="Graph title" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
          <View style={styles.axisRow}>
            <TextInput value={xAxisDraft} onChangeText={setXAxisDraft} onEndEditing={saveLabels} placeholder="X-axis name" placeholderTextColor={colors.muted} style={[styles.axisInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
            <TextInput value={yAxisDraft} onChangeText={setYAxisDraft} onEndEditing={saveLabels} placeholder="Y-axis name" placeholderTextColor={colors.muted} style={[styles.axisInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
          </View>
          <Text style={[styles.help, { color: colors.muted }]}>Choose your time format before adding points. It locks after the first saved point so no existing date can be changed or lost.</Text>
          <View style={styles.choiceRow}>{precisionOptions.map((option) => <Pressable key={option.value} onPress={() => changePrecision(option.value)} style={({ pressed }) => [styles.choice, { borderColor: option.value === graph.datePrecision ? colors.primary : colors.border, backgroundColor: option.value === graph.datePrecision ? `${colors.primary}1A` : colors.background, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.choiceTitle, { color: option.value === graph.datePrecision ? colors.primary : colors.muted }]}>{option.label}</Text><Text style={[styles.choiceExample, { color: colors.muted }]}>{option.example}</Text></Pressable>)}</View>
          <CommandButton label="Save graph labels" icon="checklist" onPress={saveLabels} />
        </CommandCard>

        <SectionHeader title={`Lines · ${graph.lines.length}/4`} />
        <CommandCard accent={colors.success} style={styles.cardStack}>
          <Text style={[styles.help, { color: colors.muted }]}>Name up to four lines. Every line shares your one numeric Y-axis, so visible intersections are real comparisons of your values.</Text>
          <View style={styles.addRow}><TextInput value={lineDraft} onChangeText={setLineDraft} placeholder="e.g., Mock score" placeholderTextColor={colors.muted} style={[styles.flexInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} /><CommandButton label="Add line" icon="plus" onPress={addLine} style={styles.addButton} /></View>
          {graph.lines.map((line) => <View key={line.id} style={[styles.lineEditor, { borderColor: line.color, backgroundColor: colors.background }]}><Pressable onPress={() => setSelectedLineId(line.id)} style={({ pressed }) => [styles.lineSelector, { backgroundColor: selectedLineId === line.id ? `${line.color}1A` : "transparent", opacity: pressed ? 0.72 : 1 }]}><View style={[styles.dot, { backgroundColor: line.color }]} /><Text style={[styles.lineName, { color: selectedLineId === line.id ? line.color : colors.foreground }]}>SELECT LINE</Text></Pressable><TextInput defaultValue={line.name} onEndEditing={({ nativeEvent }) => updatePersonalGraphLine(graph.id, line.id, { name: nativeEvent.text })} placeholder="Line name" placeholderTextColor={colors.muted} style={[styles.lineNameInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} /><View style={styles.colorRow}>{PERSONAL_GRAPH_COLORS.map((color) => <Pressable key={color} onPress={() => updatePersonalGraphLine(graph.id, line.id, { color })} style={({ pressed }) => [styles.colorButton, { borderColor: line.color === color ? color : colors.border, opacity: pressed ? 0.65 : 1 }]}><View style={[styles.colorFill, { backgroundColor: color }]} /></Pressable>)}</View><IconAction icon="xmark" label={`Remove ${line.name}`} onPress={() => Alert.alert("Remove this line?", `This removes ${line.name} and only its ${graph.points.filter((point) => point.lineId === line.id).length} Personal Graph points.`, [{ text: "Cancel" }, { text: "Remove", style: "destructive", onPress: () => removePersonalGraphLine(graph.id, line.id) }])} /></View>)}
        </CommandCard>

        <SectionHeader title="Add a real point" />
        <CommandCard accent="#F4C95D" style={styles.cardStack}>
          <Text style={[styles.help, { color: colors.muted }]}>Selected time format: {selectedPrecision.label} ({selectedPrecision.example}). One value per named line at each time value keeps the chart truthful and easy to read.</Text>
          <View style={styles.lineChoiceRow}>{graph.lines.map((line) => <Pressable key={line.id} onPress={() => setSelectedLineId(line.id)} style={({ pressed }) => [styles.lineChoice, { borderColor: selectedLineId === line.id ? line.color : colors.border, backgroundColor: selectedLineId === line.id ? `${line.color}1A` : colors.background, opacity: pressed ? 0.72 : 1 }]}><View style={[styles.dot, { backgroundColor: line.color }]} /><Text style={[styles.lineChoiceText, { color: selectedLineId === line.id ? line.color : colors.muted }]}>{line.name}</Text></Pressable>)}</View>
          <View style={styles.axisRow}><TextInput value={xValue} onChangeText={setXValue} placeholder={selectedPrecision.example} placeholderTextColor={colors.muted} autoCapitalize="none" style={[styles.axisInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} /><TextInput value={yValue} onChangeText={setYValue} placeholder={graph.yAxisLabel} placeholderTextColor={colors.muted} keyboardType="decimal-pad" style={[styles.axisInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} /></View>
          <View style={styles.addRow}><CommandButton label={editingPointId ? "Save point" : "Add point"} icon={editingPointId ? "checklist" : "plus"} onPress={savePoint} style={styles.flexButton} />{editingPointId ? <CommandButton label="Cancel" variant="secondary" onPress={() => { setEditingPointId(null); setXValue(""); setYValue(""); }} style={styles.cancelButton} /> : null}</View>
        </CommandCard>

        <SectionHeader title="Your graph" />
        <CommandCard accent="#F4C95D" style={styles.cardStack}>
          <View style={styles.graphHeader}><View><Text style={[styles.axisCaption, { color: colors.muted }]}>Y · {graph.yAxisLabel}</Text><Text style={[styles.graphTitle, { color: colors.foreground }]}>{graph.title}</Text><Text style={[styles.axisCaption, { color: colors.muted }]}>X · {graph.xAxisLabel}</Text></View><StatusPill label={`${graph.points.length} POINTS`} tone="primary" /></View>
          <View style={styles.rangeRow}>{rangeOptions.map((option) => <Pressable key={option.value} onPress={() => setRange(option.value)} style={({ pressed }) => [styles.rangeButton, { backgroundColor: range === option.value ? `${colors.primary}1A` : colors.background, borderColor: range === option.value ? colors.primary : colors.border, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.rangeText, { color: range === option.value ? colors.primary : colors.muted }]}>{option.label}</Text></Pressable>)}</View>
          {graph.lines.length && graph.points.length ? <PersonalGraphTrendChart graph={graph} range={range} accessibilityLabel={`${graph.title} personal graph`} /> : <Text style={[styles.empty, { color: colors.muted }]}>Add a named line and its first real point to reveal this graph.</Text>}
        </CommandCard>
        <SectionHeader title={`Saved points · ${pointRows.length}`} />
      </>}
      renderItem={({ item }) => {
        const line = graph.lines.find((candidate) => candidate.id === item.lineId);
        return <Pressable onPress={() => startEditingPoint(item.id)} style={({ pressed }) => [styles.pointRow, { borderColor: line?.color ?? colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 }]}><View style={[styles.dot, { backgroundColor: line?.color ?? colors.primary }]} /><View style={styles.pointCopy}><Text style={[styles.pointLine, { color: colors.foreground }]}>{line?.name ?? "Removed line"}</Text><Text style={[styles.pointMeta, { color: colors.muted }]}>{item.xLabel} · tap to edit</Text></View><Text style={[styles.pointValue, { color: line?.color ?? colors.primary }]}>{item.yValue}</Text><IconAction icon="xmark" label={`Remove point ${item.xLabel}`} onPress={() => Alert.alert("Remove this point?", "Only this Personal Graph point will be removed.", [{ text: "Cancel" }, { text: "Remove", style: "destructive", onPress: () => removePersonalGraphPoint(graph.id, item.id) }])} /></Pressable>;
      }}
      ListEmptyComponent={<Text style={[styles.empty, { color: colors.muted }]}>No points yet. Your saved points will stay available across weeks, years, and offline backups.</Text>}
    />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 10, paddingBottom: 32 }, cardStack: { gap: 12 }, slotRow: { flexDirection: "row", gap: 8 }, slotButton: { flex: 1, minWidth: 0, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 10 }, slotEyebrow: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 1 }, slotText: { marginTop: 3, fontSize: 12, lineHeight: 16, fontWeight: "800" }, input: { minHeight: 46, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, fontSize: 14, fontWeight: "800" }, axisRow: { flexDirection: "row", gap: 9 }, axisInput: { flex: 1, minWidth: 0, minHeight: 44, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, fontSize: 12, fontWeight: "700" }, help: { fontSize: 12, lineHeight: 17, fontWeight: "500" }, choiceRow: { flexDirection: "row", gap: 7 }, choice: { flex: 1, minWidth: 0, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 8 }, choiceTitle: { fontSize: 10, lineHeight: 13, fontWeight: "900" }, choiceExample: { marginTop: 2, fontSize: 9, lineHeight: 12, fontWeight: "700" }, addRow: { flexDirection: "row", gap: 8, alignItems: "center" }, flexInput: { flex: 1, minWidth: 0, minHeight: 43, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, fontSize: 12, fontWeight: "700" }, addButton: { minWidth: 96 }, lineEditor: { borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, padding: 8, gap: 8 }, lineSelector: { minHeight: 28, flexDirection: "row", alignItems: "center", borderRadius: 9, paddingHorizontal: 6, gap: 8 }, dot: { width: 8, height: 8, borderRadius: 8 }, lineName: { flex: 1, minWidth: 0, fontSize: 12, lineHeight: 16, fontWeight: "900" }, lineNameInput: { minHeight: 40, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 9, fontSize: 12, fontWeight: "800" }, colorRow: { flexDirection: "row", gap: 6 }, colorButton: { borderWidth: 1.5, borderRadius: 9, padding: 3 }, colorFill: { width: 17, height: 17, borderRadius: 6 }, lineChoiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, lineChoice: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 7 }, lineChoiceText: { fontSize: 10, lineHeight: 13, fontWeight: "800" }, flexButton: { flex: 1 }, cancelButton: { minWidth: 88 }, graphHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }, graphTitle: { fontSize: 18, lineHeight: 24, fontWeight: "900" }, axisCaption: { fontSize: 10, lineHeight: 14, fontWeight: "800", letterSpacing: 0.5 }, rangeRow: { flexDirection: "row", gap: 6 }, rangeButton: { flex: 1, minWidth: 0, borderWidth: StyleSheet.hairlineWidth, borderRadius: 9, paddingVertical: 7, alignItems: "center" }, rangeText: { fontSize: 10, lineHeight: 13, fontWeight: "900" }, pointRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 9, borderWidth: StyleSheet.hairlineWidth, borderRadius: 13, paddingHorizontal: 10, marginTop: 7 }, pointCopy: { flex: 1, minWidth: 0 }, pointLine: { fontSize: 12, lineHeight: 16, fontWeight: "900" }, pointMeta: { marginTop: 1, fontSize: 10, lineHeight: 14, fontWeight: "600" }, pointValue: { fontSize: 17, lineHeight: 22, fontWeight: "900" }, empty: { paddingVertical: 18, fontSize: 12, lineHeight: 18, textAlign: "center", fontWeight: "600" },
});
