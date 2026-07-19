import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { CommandButton, CommandCard, IconAction, LoadingScreen, ScreenTitle, SectionHeader, StatusPill } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { GraphSeries, useFocusCommand } from "@/lib/focus-command";

const graphMetrics: { metric: GraphSeries["metric"]; label: string; color: string }[] = [
  { metric: "miniAchievementRating", label: "Mini achievement", color: "#F4C95D" },
  { metric: "frictionRating", label: "Friction", color: "#FFAA4C" },
  { metric: "provokingThoughtRating", label: "Provoking thought", color: "#39C6E8" },
  { metric: "feelingAfter", label: "After feeling", color: "#49D17D" },
  { metric: "durationHours", label: "Duration", color: "#C092FF" },
];

export default function CustomizeScreen() {
  const colors = useColors();
  const { state, ready, updateProfile, addCustomQuestion, updateCustomGraph } = useFocusCommand();
  const [titleDrafts, setTitleDrafts] = useState(state.profile.titles);
  const [questionLabel, setQuestionLabel] = useState("");
  const [showAllTitles, setShowAllTitles] = useState(false);

  const editableTitles = useMemo(() => showAllTitles ? titleDrafts : titleDrafts.slice(0, 12), [showAllTitles, titleDrafts]);

  if (!ready) return <LoadingScreen label="Opening RPG customization…" />;

  const updateTitle = (index: number, value: string) => {
    setTitleDrafts((current) => current.map((title, position) => position === index ? value : title));
  };

  const saveTitles = () => {
    const cleaned = titleDrafts.map((title, index) => title.trim() || `Title ${index + 1}`);
    setTitleDrafts(cleaned);
    updateProfile({ titles: cleaned });
  };

  const addQuestion = () => {
    const label = questionLabel.trim();
    if (!label) {
      Alert.alert("Write the question first", "Add the prompt you want to answer after a long mission.");
      return;
    }
    addCustomQuestion({ label, type: "rating", options: [], enabled: true });
    setQuestionLabel("");
  };

  const toggleMetric = (graphId: string, metric: GraphSeries["metric"], label: string, color: string) => {
    const graph = state.customGraphs.find((candidate) => candidate.id === graphId);
    if (!graph) return;
    const existing = graph.series.find((series) => series.metric === metric);
    if (existing) {
      updateCustomGraph(graphId, { series: graph.series.filter((series) => series.id !== existing.id) });
      return;
    }
    if (graph.series.length >= 5) {
      Alert.alert("Five series maximum", "Remove a current line before adding another reflection metric.");
      return;
    }
    updateCustomGraph(graphId, { series: [...graph.series, { id: `${graph.id}_${metric}`, label, metric, color }] });
  };

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenTitle eyebrow="Customization" title="Tune the system" detail="Adjust the RPG rules, reflection prompts, and dashboard lenses to fit your real life." right={<IconAction icon="xmark" label="Close customization" onPress={() => router.back()} />} />

        <SectionHeader title="Level rules" />
        <CommandCard accent={colors.primary} style={styles.cardStack}>
          <RuleStepper label="Maximum level" value={state.profile.maxLevel} minimum={10} step={10} onChange={(maxLevel) => updateProfile({ maxLevel })} />
          <Divider />
          <RuleStepper label="Power per level" value={state.profile.powerPerLevel} minimum={10} step={10} onChange={(powerPerLevel) => updateProfile({ powerPerLevel })} />
          <Divider />
          <RuleStepper label="Title change interval" value={state.profile.titleChangeInterval} minimum={1} step={1} onChange={(titleChangeInterval) => updateProfile({ titleChangeInterval })} />
          <Text style={[styles.helpText, { color: colors.muted }]}>The app always shows your current title and the distance to the next title. Defaults are configured for 500 levels and a title change every 10 levels.</Text>
        </CommandCard>

        <SectionHeader title={`Rank titles · ${state.profile.titles.length} available`} action={showAllTitles ? "Show less" : "Show all"} onAction={() => setShowAllTitles((value) => !value)} />
        <CommandCard accent={colors.primary} style={styles.titleCard}>
          <FlatList
            data={editableTitles}
            scrollEnabled={false}
            keyExtractor={(_, index) => String(index)}
            renderItem={({ item, index }) => {
              const realIndex = showAllTitles ? index : index;
              return (
                <View style={styles.titleRow}>
                  <StatusPill label={`LV ${realIndex * state.profile.titleChangeInterval + 1}`} tone="primary" />
                  <TextInput value={item} onChangeText={(value) => updateTitle(realIndex, value)} onBlur={saveTitles} style={[styles.titleInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
                </View>
              );
            }}
            ItemSeparatorComponent={() => <View style={[styles.titleDivider, { backgroundColor: colors.border }]} />}
          />
          <CommandButton label="Save title changes" icon="checklist" onPress={saveTitles} />
        </CommandCard>

        <SectionHeader title="Reflection questions" />
        <CommandCard accent={colors.success} style={styles.cardStack}>
          <Text style={[styles.helpText, { color: colors.muted }]}>The built-in long-mission debrief covers feelings, friction, thought, skills, and mini achievements. Add your own rating prompt below.</Text>
          <View style={styles.questionInputRow}>
            <TextInput value={questionLabel} onChangeText={setQuestionLabel} placeholder="e.g., Did I protect my focus?" placeholderTextColor={colors.muted} style={[styles.questionInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} returnKeyType="done" onSubmitEditing={addQuestion} />
            <CommandButton label="Add" icon="plus" onPress={addQuestion} />
          </View>
          {state.customQuestions.length ? state.customQuestions.map((question) => (
            <View key={question.id} style={styles.questionRow}>
              <View style={styles.questionCopy}>
                <Text style={[styles.questionTitle, { color: colors.foreground }]}>{question.label}</Text>
                <Text style={[styles.questionDetail, { color: colors.muted }]}>{question.type.replace("_", " ")} · {question.enabled ? "Visible" : "Hidden"}</Text>
              </View>
              <StatusPill label={question.enabled ? "ON" : "OFF"} tone={question.enabled ? "success" : "neutral"} />
            </View>
          )) : <Text style={[styles.emptyText, { color: colors.muted }]}>No additional questions yet.</Text>}
        </CommandCard>

        <SectionHeader title="Three custom graph slots" />
        <View style={styles.graphStack}>
          {state.customGraphs.map((graph, index) => (
            <CommandCard key={graph.id} accent={index === 0 ? colors.primary : index === 1 ? colors.success : "#F4C95D"} style={styles.cardStack}>
              <View style={styles.graphHeader}>
                <View style={styles.graphCopy}>
                  <Text style={[styles.graphTitle, { color: colors.foreground }]}>{graph.title || `Custom graph ${index + 1}`}</Text>
                  <Text style={[styles.graphDetail, { color: colors.muted }]}>{graph.series.length}/5 post-mission lines selected.</Text>
                </View>
                <Pressable onPress={() => updateCustomGraph(graph.id, { enabled: !graph.enabled })} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                  <StatusPill label={graph.enabled ? "ENABLED" : "OFF"} tone={graph.enabled ? "success" : "neutral"} />
                </Pressable>
              </View>
              <TextInput value={graph.title} onChangeText={(title) => updateCustomGraph(graph.id, { title })} placeholder={`Graph ${index + 1} title`} placeholderTextColor={colors.muted} style={[styles.titleInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
              <View style={styles.metricChoices}>
                {graphMetrics.map((metric) => {
                  const active = graph.series.some((series) => series.metric === metric.metric);
                  return (
                    <Pressable key={metric.metric} onPress={() => toggleMetric(graph.id, metric.metric, metric.label, metric.color)} style={({ pressed }) => [styles.metricChoice, { backgroundColor: active ? `${metric.color}1D` : colors.background, borderColor: active ? metric.color : colors.border, opacity: pressed ? 0.75 : 1 }]}>
                      <View style={[styles.metricDot, { backgroundColor: metric.color }]} />
                      <Text style={[styles.metricChoiceText, { color: active ? metric.color : colors.muted }]}>{metric.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </CommandCard>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function RuleStepper({ label, value, minimum, step, onChange }: { label: string; value: number; minimum: number; step: number; onChange: (value: number) => void }) {
  const colors = useColors();
  return (
    <View style={styles.ruleRow}>
      <View style={styles.ruleCopy}>
        <Text style={[styles.ruleLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.ruleValue, { color: colors.muted }]}>{value}</Text>
      </View>
      <View style={styles.stepper}>
        <CommandButton label="−" variant="secondary" onPress={() => onChange(Math.max(minimum, value - step))} style={styles.stepperButton} />
        <CommandButton label="+" variant="secondary" onPress={() => onChange(value + step)} style={styles.stepperButton} />
      </View>
    </View>
  );
}

function Divider() {
  const colors = useColors();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingTop: 10, paddingBottom: 28 },
  cardStack: { gap: 12 },
  ruleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  ruleCopy: { flex: 1 },
  ruleLabel: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
  ruleValue: { fontSize: 12, lineHeight: 17, marginTop: 1, fontWeight: "600" },
  stepper: { flexDirection: "row", gap: 7 },
  stepperButton: { minWidth: 40, minHeight: 39, paddingHorizontal: 0 },
  divider: { height: StyleSheet.hairlineWidth, width: "100%" },
  helpText: { fontSize: 12, lineHeight: 18, fontWeight: "500" },
  titleCard: { gap: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 6 },
  titleInput: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 11, fontSize: 13, lineHeight: 17, fontWeight: "700" },
  titleDivider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  questionInputRow: { flexDirection: "row", gap: 8 },
  questionInput: { flex: 1, minHeight: 44, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 11, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  questionRow: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "space-between" },
  questionCopy: { flex: 1 },
  questionTitle: { fontSize: 13, lineHeight: 18, fontWeight: "800" },
  questionDetail: { fontSize: 11, lineHeight: 15, marginTop: 1, fontWeight: "500" },
  emptyText: { fontSize: 12, lineHeight: 17, fontWeight: "600" },
  graphStack: { gap: 10 },
  graphHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  graphCopy: { flex: 1 },
  graphTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  graphDetail: { fontSize: 11, lineHeight: 16, marginTop: 1, fontWeight: "500" },
  metricChoices: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  metricChoice: { minHeight: 34, paddingHorizontal: 9, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", gap: 5 },
  metricDot: { width: 6, height: 6, borderRadius: 9 },
  metricChoiceText: { fontSize: 10, lineHeight: 13, fontWeight: "800" },
});
