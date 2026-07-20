import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { CommandButton, CommandCard, IconAction, LoadingScreen, ScreenTitle, SectionHeader, StatusPill } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { CustomQuestion, GraphSeries, useFocusCommand } from "@/lib/focus-command";

const graphMetrics: { metric: GraphSeries["metric"]; label: string; color: string }[] = [
  { metric: "miniAchievementRating", label: "Mini achievement", color: "#F4C95D" },
  { metric: "frictionRating", label: "Friction", color: "#FFAA4C" },
  { metric: "provokingThoughtRating", label: "Provoking thought", color: "#A78BFA" },
  { metric: "feelingAfter", label: "After feeling", color: "#49D17D" },
  { metric: "durationHours", label: "Duration", color: "#C092FF" },
];

const questionTypes: { type: CustomQuestion["type"]; label: string }[] = [
  { type: "rating", label: "Rating" },
  { type: "text", label: "Text" },
  { type: "single_choice", label: "One choice" },
  { type: "multiple_choice", label: "Many choices" },
];

function parseOptions(value: string) {
  return value.split(",").map((option) => option.trim()).filter(Boolean);
}

export default function CustomizeScreen() {
  const colors = useColors();
  const { state, ready, updateProfile, addCustomQuestion, updateCustomQuestion, removeCustomQuestion, updateCustomGraph } = useFocusCommand();
  const [titleDrafts, setTitleDrafts] = useState(state.profile.titles);
  const [questionLabel, setQuestionLabel] = useState("");
  const [questionType, setQuestionType] = useState<CustomQuestion["type"]>("rating");
  const [questionOptions, setQuestionOptions] = useState("");
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
    const options = parseOptions(questionOptions);
    if (!label) {
      Alert.alert("Write the question first", "Add the prompt you want to answer after a long mission.");
      return;
    }
    if ((questionType === "single_choice" || questionType === "multiple_choice") && options.length < 2) {
      Alert.alert("Add choices", "Choice prompts need at least two comma-separated options.");
      return;
    }
    addCustomQuestion({ label, type: questionType, options, enabled: true });
    setQuestionLabel("");
    setQuestionOptions("");
    setQuestionType("rating");
  };

  const confirmQuestionRemoval = (questionId: string) => {
    Alert.alert("Remove reflection question?", "Existing answers remain in mission history, but future mission debriefs will no longer show this prompt.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeCustomQuestion(questionId) },
    ]);
  };

  const updateEmotionalChart = (chartId: string, patch: Partial<typeof state.profile.emotionalCharts[number]>) => {
    updateProfile({ emotionalCharts: state.profile.emotionalCharts.map((chart) => chart.id === chartId ? { ...chart, ...patch } : chart) });
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
            renderItem={({ item, index }) => (
              <View style={styles.titleRow}>
                <StatusPill label={`LV ${index * state.profile.titleChangeInterval + 1}`} tone="primary" />
                <TextInput value={item} onChangeText={(value) => updateTitle(index, value)} onBlur={saveTitles} style={[styles.titleInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
              </View>
            )}
            ItemSeparatorComponent={() => <View style={[styles.titleDivider, { backgroundColor: colors.border }]} />}
          />
          <CommandButton label="Save title changes" icon="checklist" onPress={saveTitles} />
        </CommandCard>

        <SectionHeader title="Reflection questions" />
        <CommandCard accent={colors.success} style={styles.cardStack}>
          <Text style={[styles.helpText, { color: colors.muted }]}>Built-in long-mission debriefs cover feelings, friction, thoughts, skills, and mini achievements. Add flexible prompts that appear after future long missions.</Text>
          <TextInput value={questionLabel} onChangeText={setQuestionLabel} placeholder="e.g., Did I protect my focus?" placeholderTextColor={colors.muted} style={[styles.questionInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} returnKeyType="done" />
          <View style={styles.typeChoices}>
            {questionTypes.map((choice) => {
              const active = questionType === choice.type;
              return <Pressable key={choice.type} onPress={() => setQuestionType(choice.type)} style={({ pressed }) => [styles.typeChoice, { backgroundColor: active ? `${colors.success}1D` : colors.background, borderColor: active ? colors.success : colors.border, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.typeChoiceText, { color: active ? colors.success : colors.muted }]}>{choice.label}</Text></Pressable>;
            })}
          </View>
          {questionType === "single_choice" || questionType === "multiple_choice" ? <TextInput value={questionOptions} onChangeText={setQuestionOptions} placeholder="Choices, separated by commas" placeholderTextColor={colors.muted} style={[styles.questionInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} /> : null}
          <CommandButton label="Add question" icon="plus" onPress={addQuestion} />
          {state.customQuestions.length ? state.customQuestions.map((question) => (
            <QuestionEditor
              key={question.id}
              question={question}
              onUpdate={(patch) => updateCustomQuestion(question.id, patch)}
              onRemove={() => confirmQuestionRemoval(question.id)}
            />
          )) : <Text style={[styles.emptyText, { color: colors.muted }]}>No additional questions yet.</Text>}
        </CommandCard>

        <SectionHeader title="Behavioral tendency lenses" />
        <CommandCard accent={colors.warning} style={styles.cardStack}>
          <Text style={[styles.helpText, { color: colors.muted }]}>Choose the name, visibility, and accent for the four emotional-pattern views. The values come only from your own long-mission debriefs.</Text>
          {state.profile.emotionalCharts.map((chart) => (
            <View key={chart.id} style={[styles.emotionChartEditor, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <View style={styles.questionHeader}>
                <StatusPill label={chart.enabled ? "VISIBLE" : "HIDDEN"} tone={chart.enabled ? "success" : "neutral"} />
                <CommandButton label={chart.enabled ? "Hide" : "Show"} variant="ghost" onPress={() => updateEmotionalChart(chart.id, { enabled: !chart.enabled })} />
              </View>
              <TextInput value={chart.title} onChangeText={(title) => updateEmotionalChart(chart.id, { title })} placeholder="Lens title" placeholderTextColor={colors.muted} style={[styles.questionInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} />
              <View style={styles.metricChoices}>
                {["#F4C95D", "#A78BFA", "#49D17D", "#C092FF", "#FFAA4C"].map((color) => {
                  const selected = chart.color === color;
                  return <Pressable key={color} onPress={() => updateEmotionalChart(chart.id, { color })} style={({ pressed }) => [styles.colorChoice, { borderColor: selected ? color : colors.border, backgroundColor: selected ? `${color}1D` : colors.surface, opacity: pressed ? 0.72 : 1 }]}><View style={[styles.metricDot, { backgroundColor: color }]} /><Text style={[styles.metricChoiceText, { color: selected ? color : colors.muted }]}>ACCENT</Text></Pressable>;
                })}
              </View>
            </View>
          ))}
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

function QuestionEditor({ question, onUpdate, onRemove }: { question: CustomQuestion; onUpdate: (patch: Partial<Omit<CustomQuestion, "id">>) => void; onRemove: () => void }) {
  const colors = useColors();
  const isChoice = question.type === "single_choice" || question.type === "multiple_choice";
  return (
    <View style={[styles.questionEditor, { borderColor: colors.border, backgroundColor: colors.background }]}>
      <View style={styles.questionHeader}>
        <StatusPill label={question.enabled ? "VISIBLE" : "HIDDEN"} tone={question.enabled ? "success" : "neutral"} />
        <View style={styles.questionHeaderActions}>
          <CommandButton label={question.enabled ? "Hide" : "Show"} variant="ghost" onPress={() => onUpdate({ enabled: !question.enabled })} />
          <CommandButton label="Remove" variant="ghost" onPress={onRemove} />
        </View>
      </View>
      <TextInput value={question.label} onChangeText={(label) => onUpdate({ label })} placeholder="Question prompt" placeholderTextColor={colors.muted} style={[styles.questionInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} />
      <View style={styles.typeChoices}>
        {questionTypes.map((choice) => {
          const active = question.type === choice.type;
          return <Pressable key={choice.type} onPress={() => onUpdate({ type: choice.type, options: choice.type === "single_choice" || choice.type === "multiple_choice" ? question.options : [] })} style={({ pressed }) => [styles.typeChoice, { backgroundColor: active ? `${colors.success}1D` : colors.surface, borderColor: active ? colors.success : colors.border, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.typeChoiceText, { color: active ? colors.success : colors.muted }]}>{choice.label}</Text></Pressable>;
        })}
      </View>
      {isChoice ? <TextInput value={question.options.join(", ")} onChangeText={(value) => onUpdate({ options: parseOptions(value) })} placeholder="Choices, separated by commas" placeholderTextColor={colors.muted} style={[styles.questionInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} /> : null}
    </View>
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
  questionInput: { minHeight: 44, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 11, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  typeChoices: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  typeChoice: { minHeight: 32, paddingHorizontal: 9, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, justifyContent: "center" },
  typeChoiceText: { fontSize: 10, lineHeight: 13, fontWeight: "900" },
  questionEditor: { gap: 9, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 10 },
  emotionChartEditor: { gap: 9, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 10 },
  colorChoice: { minHeight: 32, paddingHorizontal: 8, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", gap: 5 },
  questionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  questionHeaderActions: { flexDirection: "row", alignItems: "center", gap: 4 },
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
