import { router } from "expo-router";
import { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { BarsChart, MultiLineTrendChart, type ChartPoint } from "@/components/focus-charts";
import { CommandCard, IconAction, LoadingScreen, ScreenTitle, StatusPill } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { shallowEqual, type FocusState, useFocusCommandReady, useFocusCommandSelector } from "@/lib/focus-command";
import { getPersonalReflectionSignals, type PersonalReflectionSignal } from "@/lib/personal-reflection-signals";

type SignalSnapshot = Pick<FocusState, "customQuestions" | "reflections">;

function selectSignalSnapshot(state: FocusState): SignalSnapshot {
  return { customQuestions: state.customQuestions, reflections: state.reflections };
}

function compactDate(value: string) {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(parsed) : "Saved";
}

function SignalCard({ signal }: { signal: PersonalReflectionSignal }) {
  const colors = useColors();
  if (signal.kind === "rating") {
    const points = signal.observations.slice(-500).map((observation, index, all) => ({
      label: index === 0 || index === all.length - 1 || index === Math.floor(all.length / 2) ? compactDate(observation.createdAt) : "",
      value: observation.value,
    }));
    const active = signal.question.personalSignal?.enabled === true;
    const role = signal.question.personalSignal?.role === "load" ? "Higher means more load" : "Higher means more supportive";
    return <CommandCard accent={active ? colors.primary : colors.border} style={styles.card}>
      <View style={styles.cardHeading}><View style={styles.cardCopy}><Text style={[styles.title, { color: colors.foreground }]}>{signal.question.label || "Untitled rating"}</Text><Text style={[styles.detail, { color: colors.muted }]}>{active ? role : "Private 1–5 rating history"}</Text></View><StatusPill label={`${signal.observations.length} RATING${signal.observations.length === 1 ? "" : "S"}`} tone={active ? "primary" : "neutral"} /></View>
      {points.length ? <MultiLineTrendChart series={[{ id: signal.question.id, label: "Rating", color: colors.primary, points }]} maxRenderPoints={180} accessibilityLabel={`${signal.question.label} rating trend`} /> : <Text style={[styles.empty, { color: colors.muted }]}>Answer this question after a future long mission to begin its private rating history.</Text>}
    </CommandCard>;
  }

  if (signal.kind === "choice") {
    const points: ChartPoint[] = signal.responseCounts.slice(0, 8).map((entry) => ({ label: entry.label, value: entry.count }));
    return <CommandCard accent={colors.success} style={styles.card}>
      <View style={styles.cardHeading}><View style={styles.cardCopy}><Text style={[styles.title, { color: colors.foreground }]}>{signal.question.label || "Untitled choice"}</Text><Text style={[styles.detail, { color: colors.muted }]}>Private response distribution; choices are not treated as emotional scores.</Text></View><StatusPill label={`${signal.answerCount} ANSWER${signal.answerCount === 1 ? "" : "S"}`} tone="success" /></View>
      {points.length ? <BarsChart points={points} color={colors.success} accessibilityLabel={`${signal.question.label} response distribution`} /> : <Text style={[styles.empty, { color: colors.muted }]}>Answer this question after a future long mission to show its response distribution.</Text>}
    </CommandCard>;
  }

  return <CommandCard accent="#F4C95D" style={styles.card}>
    <View style={styles.cardHeading}><View style={styles.cardCopy}><Text style={[styles.title, { color: colors.foreground }]}>{signal.question.label || "Untitled text prompt"}</Text><Text style={[styles.detail, { color: colors.muted }]}>Private written-answer history; text is never converted into an emotional score.</Text></View><StatusPill label={`${signal.answerCount} NOTE${signal.answerCount === 1 ? "" : "S"}`} tone="gold" /></View>
    {signal.recentAnswers.length ? <View style={styles.answerStack}>{signal.recentAnswers.slice(0, 3).map((answer) => <View key={answer.reflectionId} style={[styles.answer, { backgroundColor: colors.background, borderColor: colors.border }]}><Text style={[styles.answerDate, { color: "#F4C95D" }]}>{compactDate(answer.createdAt)}</Text><Text style={[styles.answerText, { color: colors.foreground }]} numberOfLines={3}>{answer.answer}</Text></View>)}</View> : <Text style={[styles.empty, { color: colors.muted }]}>Answer this question after a future long mission to begin its private note history.</Text>}
  </CommandCard>;
}

export default function ReflectionSignalsScreen() {
  const colors = useColors();
  const ready = useFocusCommandReady();
  const state = useFocusCommandSelector(selectSignalSnapshot, shallowEqual);
  const signals = useMemo(() => getPersonalReflectionSignals({ customQuestions: state.customQuestions, reflections: state.reflections }), [state.customQuestions, state.reflections]);

  if (!ready) return <LoadingScreen label="Opening reflection signals…" />;
  return <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]}>
    <FlatList
      data={signals}
      keyExtractor={(signal) => signal.question.id}
      renderItem={({ item }) => <SignalCard signal={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      initialNumToRender={4}
      maxToRenderPerBatch={4}
      updateCellsBatchingPeriod={16}
      windowSize={5}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<View style={styles.header}><ScreenTitle eyebrow="Your added questions" title="Personal Reflection Signals" detail="Rating, choice, and written answers stay private. Only a Rating you explicitly enable can join the optional consistency scenario." right={<IconAction icon="xmark" label="Close Personal Reflection Signals" onPress={() => router.back()} />} /><CommandCard accent={colors.primary} style={styles.explainer}><Text style={[styles.explainerTitle, { color: colors.foreground }]}>Each answer type stays truthful</Text><Text style={[styles.explainerText, { color: colors.muted }]}>Ratings show a 1–5 trend. Choices show counts. Written answers remain written notes. None change the four built-in emotional lenses.</Text></CommandCard></View>}
      ListHeaderComponentStyle={styles.headerSpacing}
      ListEmptyComponent={<CommandCard accent={colors.border} style={styles.emptyCard}><Text style={[styles.title, { color: colors.foreground }]}>No custom questions yet</Text><Text style={[styles.detail, { color: colors.muted }]}>Create a custom reflection question in Customize, then answer it after a future long mission.</Text></CommandCard>}
    />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 10, paddingBottom: 28 },
  header: { gap: 16 },
  headerSpacing: { marginBottom: 14 },
  explainer: { gap: 5 },
  explainerTitle: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
  explainerText: { fontSize: 12, lineHeight: 18, fontWeight: "600" },
  separator: { height: 11 },
  card: { gap: 10 },
  cardHeading: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 9 },
  cardCopy: { flex: 1 },
  title: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  detail: { fontSize: 11, lineHeight: 16, fontWeight: "600", marginTop: 2 },
  empty: { fontSize: 12, lineHeight: 18, fontWeight: "600" },
  emptyCard: { gap: 7, alignItems: "flex-start" },
  answerStack: { gap: 7 },
  answer: { gap: 2, borderWidth: StyleSheet.hairlineWidth, borderRadius: 11, padding: 9 },
  answerDate: { fontSize: 9, lineHeight: 12, letterSpacing: 0.65, fontWeight: "900" },
  answerText: { fontSize: 12, lineHeight: 17, fontWeight: "600" },
});
