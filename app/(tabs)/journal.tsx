import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { CelebrationOverlay } from "@/components/celebration-overlay";
import { CommandButton, CommandCard, EmptyCommandState, IconAction, LoadingScreen, MetricTile, ScreenTitle, SectionHeader, StatusPill } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { playFocusRole } from "@/lib/focus-audio";
import { formatCompactNumber, toLocalDate, useFocusCommand } from "@/lib/focus-command";

export default function JournalScreen() {
  const colors = useColors();
  const { compose } = useLocalSearchParams<{ compose?: string }>();
  const { state, ready, addJournal } = useFocusCommand();
  const today = toLocalDate(new Date().toISOString(), state.profile.timezone);
  const todayEntry = state.journals.find((entry) => entry.localDate === today);
  const [showComposer, setShowComposer] = useState(compose === "1" || !todayEntry);
  const [better, setBetter] = useState<boolean>(todayEntry?.betterThanYesterday ?? true);
  const [points, setPoints] = useState(String(todayEntry?.points ?? 6));
  const [note, setNote] = useState(todayEntry?.note ?? "");
  const [journalCelebration, setJournalCelebration] = useState(false);

  const entries = useMemo(() => [...state.journals].sort((a, b) => b.localDate.localeCompare(a.localDate)), [state.journals]);
  const totalPoints = state.journals.reduce((total, entry) => total + entry.points, 0);
  const lifelineContribution = totalPoints * 0.05;

  if (!ready) return <LoadingScreen label="Opening journal…" />;

  const submit = () => {
    const amount = Math.max(0, Math.round(Number(points)));
    if (!Number.isFinite(amount)) {
      Alert.alert("Use a valid point value", "Your daily point value needs to be a whole number or zero.");
      return;
    }
    addJournal({ betterThanYesterday: better, points: amount, note });
    void playFocusRole("achievement", state.profile.soundEnabled, state.profile.soundRoles.achievement);
    setShowComposer(false);
    setJournalCelebration(true);
  };

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenTitle
          eyebrow="Daily reflection"
          title="Journal"
          detail={todayEntry ? "Today’s reflection is logged. You can refine it at any time." : "Close the day with one honest signal."}
          right={<IconAction icon={showComposer ? "xmark" : "plus"} label={showComposer ? "Close journal entry" : "Create journal entry"} onPress={() => setShowComposer((value) => !value)} />}
        />

        <View style={styles.metrics}>
          <MetricTile label="Journal points" value={formatCompactNumber(totalPoints)} detail="Cumulative self-rating" icon="book.closed.fill" accent={colors.primary} />
          <MetricTile label="Lifeline gain" value={lifelineContribution.toFixed(1)} detail="5% of journal points" icon="chart.xyaxis.line" accent={colors.success} />
        </View>

	        {showComposer ? (
	          <CommandCard accent={colors.primary} style={styles.composer}>
	            <View style={styles.composerHeading}>
	              <View style={styles.composerCopy}>
	                <Text numberOfLines={2} style={[styles.composerTitle, { color: colors.foreground }]}>Journal entry · {today}</Text>
	                <Text style={[styles.composerDetail, { color: colors.muted }]}>Your answers will update the life-performance signal on the Dashboard.</Text>
	              </View>
              <StatusPill label="TODAY" tone="primary" icon="book.closed.fill" />
            </View>

            <View style={styles.questionBlock}>
              <Text style={[styles.questionLabel, { color: colors.foreground }]}>Were you better than yesterday?</Text>
              <View style={styles.answerRow}>
                <Pressable onPress={() => setBetter(true)} style={({ pressed }) => [styles.answer, { backgroundColor: better ? `${colors.success}20` : colors.background, borderColor: better ? colors.success : colors.border, opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                  <IconSymbol name="checklist" size={18} color={better ? colors.success : colors.muted} />
                  <Text style={[styles.answerText, { color: better ? colors.success : colors.muted }]}>Yes</Text>
                </Pressable>
                <Pressable onPress={() => setBetter(false)} style={({ pressed }) => [styles.answer, { backgroundColor: !better ? `${colors.warning}20` : colors.background, borderColor: !better ? colors.warning : colors.border, opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                  <IconSymbol name="arrow.clockwise" size={18} color={!better ? colors.warning : colors.muted} />
                  <Text style={[styles.answerText, { color: !better ? colors.warning : colors.muted }]}>Not yet</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.pointsBlock}>
              <View style={styles.pointsCopy}>
                <Text style={[styles.questionLabel, { color: colors.foreground }]}>Points I give myself</Text>
                <Text style={[styles.pointsDetail, { color: colors.muted }]}>Five percent will accumulate into your Lifeline graph.</Text>
              </View>
              <View style={styles.pointControls}>
                <CommandButton label="−" variant="secondary" onPress={() => setPoints(String(Math.max(0, (Number(points) || 0) - 1)))} style={styles.pointButton} />
                <TextInput value={points} onChangeText={setPoints} keyboardType="number-pad" style={[styles.pointsInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
                <CommandButton label="+" variant="secondary" onPress={() => setPoints(String((Number(points) || 0) + 1))} style={styles.pointButton} />
              </View>
            </View>

            <TextInput value={note} onChangeText={setNote} multiline placeholder="Optional reflection: What changed your day?" placeholderTextColor={colors.muted} style={[styles.noteInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} textAlignVertical="top" />
            <CommandButton label={todayEntry ? "Update entry" : "Log today"} icon="book.closed.fill" onPress={submit} />
          </CommandCard>
        ) : null}

        <SectionHeader title="Journal timeline" action={todayEntry ? "Edit today" : undefined} onAction={todayEntry ? () => setShowComposer(true) : undefined} />
        {entries.length ? (
          <View style={styles.stack}>
            {entries.map((entry) => (
              <CommandCard key={entry.id} accent={entry.betterThanYesterday ? colors.success : colors.warning} style={styles.entryCard}>
                <View style={styles.entryLeading}>
                  <View style={[styles.entryDate, { backgroundColor: `${entry.betterThanYesterday ? colors.success : colors.warning}18` }]}>
                    <Text style={[styles.entryDay, { color: entry.betterThanYesterday ? colors.success : colors.warning }]}>{entry.localDate.slice(8, 10)}</Text>
                    <Text style={[styles.entryMonth, { color: colors.muted }]}>{new Date(`${entry.localDate}T00:00:00`).toLocaleString("en", { month: "short" }).toUpperCase()}</Text>
                  </View>
                  <View style={styles.entryCopy}>
                    <Text style={[styles.entryTitle, { color: colors.foreground }]}>{entry.betterThanYesterday ? "Better than yesterday" : "A reset day"}</Text>
                    <Text numberOfLines={2} style={[styles.entryDetail, { color: colors.muted }]}>{entry.note || "No written note."}</Text>
                  </View>
                </View>
                <StatusPill label={`${entry.points} PTS`} tone={entry.betterThanYesterday ? "success" : "warning"} />
              </CommandCard>
            ))}
          </View>
        ) : (
          <EmptyCommandState icon="book.closed.fill" title="Your journal is waiting" detail="A short daily signal makes the Lifeline graph more meaningful over time." action="Log today" onAction={() => setShowComposer(true)} />
        )}
      </ScrollView>
      {journalCelebration ? <CelebrationOverlay kind="journal" reduceMotion={state.profile.reduceMotion} onDone={() => setJournalCelebration(false)} /> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingTop: 12, paddingBottom: 28 },
	  metrics: { flexDirection: "row", gap: 10 },
	  composer: { gap: 16 },
	  composerHeading: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
	  composerCopy: { flex: 1, minWidth: 0 },
	  composerTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  composerDetail: { fontSize: 12, lineHeight: 17, fontWeight: "500", marginTop: 2, maxWidth: 260 },
  questionBlock: { gap: 10 },
  questionLabel: { fontSize: 14, lineHeight: 19, fontWeight: "800" },
  answerRow: { flexDirection: "row", gap: 9 },
  answer: { flex: 1, minHeight: 52, borderWidth: StyleSheet.hairlineWidth, borderRadius: 15, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  answerText: { fontSize: 13, lineHeight: 17, fontWeight: "900" },
  pointsBlock: { flexDirection: "row", alignItems: "center", gap: 10 },
  pointsCopy: { flex: 1 },
  pointsDetail: { fontSize: 11, lineHeight: 16, fontWeight: "500", marginTop: 2 },
  pointControls: { flexDirection: "row", alignItems: "center", gap: 6 },
  pointButton: { minWidth: 38, paddingHorizontal: 0, minHeight: 40 },
  pointsInput: { width: 48, minHeight: 40, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, textAlign: "center", fontSize: 15, lineHeight: 18, fontWeight: "900" },
  noteInput: { minHeight: 96, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingTop: 12, fontSize: 13, lineHeight: 19, fontWeight: "500" },
  stack: { gap: 10 },
  entryCard: { padding: 13, flexDirection: "row", justifyContent: "space-between", gap: 11, alignItems: "center" },
  entryLeading: { flex: 1, minWidth: 0, flexDirection: "row", gap: 10, alignItems: "center" },
  entryDate: { width: 41, height: 45, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  entryDay: { fontSize: 16, lineHeight: 18, fontWeight: "900" },
  entryMonth: { fontSize: 8, lineHeight: 11, fontWeight: "800", letterSpacing: 0.7 },
  entryCopy: { flex: 1, minWidth: 0 },
  entryTitle: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
  entryDetail: { fontSize: 11, lineHeight: 16, marginTop: 1, fontWeight: "500" },
});
