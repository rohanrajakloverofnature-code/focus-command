import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CommandButton, CommandCard, EmptyCommandState, IconAction, LoadingScreen, ScreenTitle, StatusPill } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { SrsTopic, shallowEqual, useFocusCommandActions, useFocusCommandReady, useFocusCommandSelector } from "@/lib/focus-command";
import { scheduleRevisionReminder } from "@/lib/focus-reminders";
import { getSrsDifficultyLabel, getSrsNextDueDate, getSrsProgress, SRS_DIFFICULTY_OPTIONS, type SrsDifficulty } from "@/lib/srs-schedule";

export default function RevisionsScreen() {
  const colors = useColors();
  const ready = useFocusCommandReady();
  const { completeRevision, updateRevisionTopicDifficulty } = useFocusCommandActions();
  const { profile, srsTopics } = useFocusCommandSelector((state) => ({ profile: state.profile, srsTopics: state.srsTopics }), shallowEqual);
  const { topic: topicId } = useLocalSearchParams<{ topic?: string }>();

  if (!ready) return <LoadingScreen label="Opening revision queue…" />;

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: profile.timezone }).format(new Date());
  const topics = srsTopics.slice().sort((left, right) => left.dueDate.localeCompare(right.dueDate) || left.topic.localeCompare(right.topic));
  const selected = topicId ? topics.find((topic) => topic.id === topicId) : null;
  const selectedIsDue = Boolean(selected && selected.status !== "completed" && selected.dueDate <= today);

  const finishRevision = async (topic: SrsTopic, returnToQueue = false) => {
    const nextDueDate = getSrsNextDueDate(topic, today);
    completeRevision(topic.id);
    if (profile.notificationsEnabled && nextDueDate) {
      await scheduleRevisionReminder(topic.topic, `${nextDueDate}T00:00:00`, profile.notificationRules, profile.soundRoles.revisionReminder);
    }
    if (returnToQueue) router.replace("/revisions");
  };

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenTitle
          eyebrow="SRS Queue"
          title="Pending revisions"
          detail={topics.length ? "Choose a topic difficulty to control review gaps. Editing a topic keeps its current progress." : "Your revision topic library is clear."}
          right={<IconAction icon="xmark" label="Close revision queue" onPress={() => router.back()} />}
        />

        {selected ? (
          <CommandCard accent={colors.warning} style={styles.selectedCard}>
            <StatusPill label={`${getSrsDifficultyLabel(selected.scheduleTier ?? "legacy")} · ${getSrsProgress(selected).percent}%`} tone="warning" icon="arrow.clockwise" />
            <Text style={[styles.selectedTitle, { color: colors.foreground }]}>{selected.topic}</Text>
            <Text style={[styles.selectedSubject, { color: colors.muted }]}>{selected.subject} · Due {selected.dueDate}</Text>
            <View style={[styles.studyPrompt, { backgroundColor: `${colors.warning}16` }]}>
              <IconSymbol name="target" size={18} color={colors.warning} />
              <Text style={[styles.studyPromptText, { color: colors.foreground }]}>Recall the idea without notes, then confirm completion when you are satisfied with your retrieval.</Text>
            </View>
              {selected && selectedIsDue ? <CommandButton label="Complete revision" icon="checklist" onPress={() => finishRevision(selected, true)} /> : <Text style={[styles.topicDetail, { color: colors.muted }]}>{selected?.status === "completed" ? "Completed · history preserved" : `Scheduled for ${selected?.dueDate}`}</Text>}
          </CommandCard>
        ) : null}

        {topics.length ? (
          <View style={styles.stack}>
            {topics.map((topic) => {
              const overdue = topic.status !== "completed" && topic.dueDate < today;
              const due = topic.status !== "completed" && topic.dueDate <= today;
              return (
                <CommandCard key={topic.id} accent={overdue ? colors.error : colors.warning} style={styles.topicCard}>
                  <View style={styles.topicRow}>
                    <View style={[styles.topicIcon, { backgroundColor: `${overdue ? colors.error : colors.warning}18` }]}>
                      <IconSymbol name="arrow.clockwise" size={20} color={overdue ? colors.error : colors.warning} />
                    </View>
                    <View style={styles.topicCopy}>
                      <Text style={[styles.topicTitle, { color: colors.foreground }]}>{topic.topic}</Text>
                        <Text style={[styles.topicDetail, { color: colors.muted }]}>{topic.subject} · {getSrsDifficultyLabel(topic.scheduleTier ?? "legacy")} · {getSrsProgress(topic).percent}% · {topic.status === "completed" ? "Completed" : overdue ? "Overdue" : due ? "Due today" : `Due ${topic.dueDate}`}</Text>
                    </View>
                  </View>
                  <View style={styles.difficultyRow}>
                    {SRS_DIFFICULTY_OPTIONS.map((option) => {
                      const active = (topic.difficulty ?? "medium") === option.value;
                      return <Pressable key={option.value} onPress={() => updateRevisionTopicDifficulty(topic.id, option.value as SrsDifficulty)} style={[styles.difficultyChip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? `${colors.primary}18` : colors.background }]}><Text style={[styles.difficultyChipText, { color: active ? colors.primary : colors.muted }]}>{option.label}</Text></Pressable>;
                    })}
                  </View>
                  <View style={styles.topicActions}>
                    <CommandButton label="Open" variant="secondary" onPress={() => router.replace(`/revisions?topic=${topic.id}` as never)} style={styles.topicButton} />
                    {due ? <CommandButton label="Done" icon="checklist" onPress={() => finishRevision(topic)} style={styles.topicButton} /> : null}
                  </View>
                </CommandCard>
              );
            })}
          </View>
        ) : (
          <EmptyCommandState icon="arrow.clockwise" title="Revision topic library clear" detail="Log a topic in a mission to start a difficulty-based review cycle." action="Return Home" onAction={() => router.replace("/")} />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18, paddingTop: 10, paddingBottom: 24 },
  selectedCard: { gap: 12 },
  selectedTitle: { fontSize: 24, lineHeight: 30, fontWeight: "900", letterSpacing: -0.4 },
  selectedSubject: { fontSize: 13, lineHeight: 18, fontWeight: "600", marginTop: -7 },
  studyPrompt: { borderRadius: 15, padding: 13, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  studyPromptText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "600" },
  stack: { gap: 10 },
  topicCard: { gap: 12 },
  topicRow: { flexDirection: "row", gap: 11, alignItems: "center" },
  topicIcon: { width: 40, height: 40, borderRadius: 13, justifyContent: "center", alignItems: "center" },
  topicCopy: { flex: 1 },
  topicTitle: { fontSize: 15, lineHeight: 20, fontWeight: "800" },
  topicDetail: { fontSize: 11, lineHeight: 16, marginTop: 2, fontWeight: "600" },
  difficultyRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  difficultyChip: { minHeight: 29, borderRadius: 9, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 8, justifyContent: "center" },
  difficultyChipText: { fontSize: 10, lineHeight: 13, fontWeight: "800" },
  topicActions: { flexDirection: "row", gap: 9 },
  topicButton: { flex: 1 },
});
