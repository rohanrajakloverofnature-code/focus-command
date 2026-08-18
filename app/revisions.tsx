import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { CommandButton, CommandCard, EmptyCommandState, IconAction, LoadingScreen, ScreenTitle, StatusPill } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getPendingRevisions, SrsTopic, shallowEqual, useFocusCommandActions, useFocusCommandReady, useFocusCommandSelector } from "@/lib/focus-command";
import { scheduleRevisionReminder } from "@/lib/focus-reminders";

export default function RevisionsScreen() {
  const colors = useColors();
  const ready = useFocusCommandReady();
  const { completeRevision } = useFocusCommandActions();
  const { profile, srsTopics } = useFocusCommandSelector((state) => ({ profile: state.profile, srsTopics: state.srsTopics }), shallowEqual);
  const { topic: topicId } = useLocalSearchParams<{ topic?: string }>();

  if (!ready) return <LoadingScreen label="Opening revision queue…" />;

  const topics = getPendingRevisions({ profile, srsTopics });
  const selected = topicId ? topics.find((topic) => topic.id === topicId) : null;

  const finishRevision = async (topic: SrsTopic, returnToQueue = false) => {
    const nextDelayDays = topic.stage === 0 ? 7 : topic.stage === 1 ? 30 : null;
    completeRevision(topic.id);
    if (profile.notificationsEnabled && nextDelayDays) {
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + nextDelayDays);
      await scheduleRevisionReminder(topic.topic, nextDue.toISOString(), profile.notificationRules, profile.soundRoles.revisionReminder);
    }
    if (returnToQueue) router.replace("/revisions");
  };

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenTitle
          eyebrow="SRS Queue"
          title="Pending revisions"
          detail={topics.length ? "Complete a topic to unlock its next review interval." : "Your review cadence is clear."}
          right={<IconAction icon="xmark" label="Close revision queue" onPress={() => router.back()} />}
        />

        {selected ? (
          <CommandCard accent={colors.warning} style={styles.selectedCard}>
            <StatusPill label={`DAY ${[1, 7, 30][Math.min(selected.stage, 2)] ?? 30}`} tone="warning" icon="arrow.clockwise" />
            <Text style={[styles.selectedTitle, { color: colors.foreground }]}>{selected.topic}</Text>
            <Text style={[styles.selectedSubject, { color: colors.muted }]}>{selected.subject} · Due {selected.dueDate}</Text>
            <View style={[styles.studyPrompt, { backgroundColor: `${colors.warning}16` }]}>
              <IconSymbol name="target" size={18} color={colors.warning} />
              <Text style={[styles.studyPromptText, { color: colors.foreground }]}>Recall the idea without notes, then confirm completion when you are satisfied with your retrieval.</Text>
            </View>
            <CommandButton
              label="Complete revision"
              icon="checklist"
              onPress={() => finishRevision(selected, true)}
            />
          </CommandCard>
        ) : null}

        {topics.length ? (
          <View style={styles.stack}>
            {topics.map((topic) => {
              const overdue = topic.dueDate < new Date().toISOString().slice(0, 10);
              return (
                <CommandCard key={topic.id} accent={overdue ? colors.error : colors.warning} style={styles.topicCard}>
                  <View style={styles.topicRow}>
                    <View style={[styles.topicIcon, { backgroundColor: `${overdue ? colors.error : colors.warning}18` }]}>
                      <IconSymbol name="arrow.clockwise" size={20} color={overdue ? colors.error : colors.warning} />
                    </View>
                    <View style={styles.topicCopy}>
                      <Text style={[styles.topicTitle, { color: colors.foreground }]}>{topic.topic}</Text>
                      <Text style={[styles.topicDetail, { color: colors.muted }]}>{topic.subject} · Day {[1, 7, 30][Math.min(topic.stage, 2)] ?? 30} · {overdue ? "Overdue" : `Due ${topic.dueDate}`}</Text>
                    </View>
                  </View>
                  <View style={styles.topicActions}>
                    <CommandButton label="Open" variant="secondary" onPress={() => router.replace(`/revisions?topic=${topic.id}` as never)} style={styles.topicButton} />
                    <CommandButton
                      label="Done"
                      icon="checklist"
                      onPress={() => finishRevision(topic)}
                      style={styles.topicButton}
                    />
                  </View>
                </CommandCard>
              );
            })}
          </View>
        ) : (
          <EmptyCommandState icon="arrow.clockwise" title="Revision queue secure" detail="New review topics will appear here after you log a topic on a mission." action="Return Home" onAction={() => router.replace("/")} />
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
  topicActions: { flexDirection: "row", gap: 9 },
  topicButton: { flex: 1 },
});
