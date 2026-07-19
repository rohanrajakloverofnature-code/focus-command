import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { CommandButton, CommandCard, IconAction, LoadingScreen, ProgressBar, ScreenTitle, StatusPill } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { Feeling, formatHours, getDifficultyColor, getDifficultyLabel, getMissionInvestedMilliseconds, ReflectionDraft, useFocusCommand } from "@/lib/focus-command";
import { playFocusSuccessCue } from "@/lib/focus-audio";

const feelings: { value: Feeling; label: string; color: string }[] = [
  { value: "charged", label: "Charged", color: "#49D17D" },
  { value: "steady", label: "Steady", color: "#39C6E8" },
  { value: "restless", label: "Restless", color: "#FFAA4C" },
  { value: "drained", label: "Drained", color: "#FF6B6B" },
  { value: "great", label: "Great", color: "#F4C95D" },
];

export default function MissionDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, ready, startMission, toggleMissionPause, finishMission, logRevisionTopic } = useFocusCommand();
  const mission = state.missions.find((candidate) => candidate.id === id);
  const [clock, setClock] = useState(Date.now());
  const [revisionTopic, setRevisionTopic] = useState("");
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState<ReflectionDraft>({ miniAchievementRating: 3, skills: [] });
  const [skillsText, setSkillsText] = useState("");

  useEffect(() => {
    if (mission?.status !== "active") return;
    const timer = setInterval(() => setClock(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [mission?.status]);

  const duration = useMemo(() => mission ? getMissionInvestedMilliseconds(mission, clock) : 0, [mission, clock]);
  const isLongMission = duration >= 45 * 60_000;

  if (!ready) return <LoadingScreen label="Opening mission…" />;
  if (!mission) {
    return (
      <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]}>
        <View style={styles.missing}>
          <Text style={[styles.missingTitle, { color: colors.foreground }]}>Mission not found</Text>
          <CommandButton label="Return to board" onPress={() => router.replace("/missions" as never)} />
        </View>
      </ScreenContainer>
    );
  }

  const finish = async () => {
    const result = finishMission(mission.id, { ...reflection, skills: skillsText.split(",").map((value) => value.trim()).filter(Boolean) });
    if (!result) {
      Alert.alert("Mission cannot be finalized", "Start the mission before ending it.");
      return;
    }
    await playFocusSuccessCue(state.profile.soundEnabled);
    router.replace({ pathname: "/mission-result/[id]" as never, params: { id: mission.id } });
  };

  const logTopic = () => {
    if (!revisionTopic.trim()) return;
    logRevisionTopic(mission.id, revisionTopic, mission.subject);
    setRevisionTopic("");
  };

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenTitle
          eyebrow={mission.status === "completed" ? "Completed mission" : "Mission control"}
          title={mission.title}
          detail={`${mission.subject} · ${mission.category}`}
          right={<IconAction icon="xmark" label="Close mission" onPress={() => router.back()} />}
        />

        <CommandCard accent={getDifficultyColor(mission.difficulty)} style={styles.statusCard}>
          <View style={styles.statusTopline}>
            <StatusPill label={getDifficultyLabel(mission.difficulty)} tone={mission.difficulty === "easy" ? "success" : mission.difficulty === "medium" ? "warning" : "danger"} />
            <StatusPill label={`${mission.baseXp} BASE XP`} tone="primary" icon="bolt.fill" />
          </View>
          <Text style={[styles.timerValue, { color: colors.foreground }]}>{formatHours(duration)}</Text>
          <Text style={[styles.timerDetail, { color: colors.muted }]}>{mission.status === "planned" ? "No timing data until you deploy." : mission.status === "paused" ? "Timer paused — no energy or time is accumulating." : mission.status === "completed" ? "The mission’s active time is locked in the command log." : "Active time is calculated automatically minus every pause."}</Text>
          <View style={styles.timerBarWrap}>
            <ProgressBar value={Math.min(1, duration / (90 * 60_000))} color={getDifficultyColor(mission.difficulty)} height={9} />
          </View>
          {mission.status === "planned" ? (
            <CommandButton label="Start mission" icon="play.fill" onPress={() => startMission(mission.id)} />
          ) : mission.status === "completed" ? (
            <CommandButton label="View results" icon="trophy.fill" onPress={() => router.replace({ pathname: "/mission-result/[id]" as never, params: { id: mission.id } })} />
          ) : (
            <View style={styles.liveActions}>
              <CommandButton label={mission.status === "paused" ? "Resume" : "Pause"} icon={mission.status === "paused" ? "play.fill" : "pause.fill"} variant="secondary" onPress={() => toggleMissionPause(mission.id)} style={styles.liveAction} />
              <CommandButton label="End mission" icon="stop.fill" onPress={() => setShowReflection(true)} style={styles.liveAction} />
            </View>
          )}
        </CommandCard>

        {mission.status !== "completed" ? (
          <CommandCard accent={colors.warning} style={styles.revisionCard}>
            <View style={styles.revisionHeader}>
              <View style={[styles.revisionIcon, { backgroundColor: `${colors.warning}19` }]}>
                <IconSymbol name="arrow.clockwise" size={19} color={colors.warning} />
              </View>
              <View style={styles.revisionCopy}>
                <Text style={[styles.revisionTitle, { color: colors.foreground }]}>Log a revision topic</Text>
                <Text style={[styles.revisionDetail, { color: colors.muted }]}>Every topic enters the Day 1 → Day 7 → Day 30 review loop.</Text>
              </View>
            </View>
            <View style={styles.revisionInputRow}>
              <TextInput value={revisionTopic} onChangeText={setRevisionTopic} placeholder="Topic name" placeholderTextColor={colors.muted} style={[styles.revisionInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} returnKeyType="done" onSubmitEditing={logTopic} />
              <CommandButton label="Log" onPress={logTopic} />
            </View>
            {mission.revisionTopicIds.length ? <Text style={[styles.loggedTopicText, { color: colors.success }]}>{mission.revisionTopicIds.length} topic{mission.revisionTopicIds.length === 1 ? "" : "s"} secured for review.</Text> : null}
          </CommandCard>
        ) : null}

        {showReflection ? (
          <CommandCard accent={colors.primary} style={styles.reflectionCard}>
            <View>
              <Text style={[styles.reflectionTitle, { color: colors.foreground }]}>Mission debrief</Text>
              <Text style={[styles.reflectionDetail, { color: colors.muted }]}>{isLongMission ? "This session crossed 45 minutes, so your full debrief will fuel the emotional and skill analytics." : "Short mission: capture the win, then return to your command board."}</Text>
            </View>

            {isLongMission ? (
              <>
                <FeelingSelector label="Before you began" value={reflection.feelingBefore ?? null} onChange={(feelingBefore) => setReflection((current) => ({ ...current, feelingBefore }))} />
                <FeelingSelector label="After you finished" value={reflection.feelingAfter ?? null} onChange={(feelingAfter) => setReflection((current) => ({ ...current, feelingAfter }))} />
                <TextInput value={reflection.frictionName ?? ""} onChangeText={(frictionName) => setReflection((current) => ({ ...current, frictionName }))} placeholder="What feeling or thought was resisting the task?" placeholderTextColor={colors.muted} style={[styles.reflectionInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
                <RatingSelector label="How strong was that resistance?" value={reflection.frictionRating ?? 0} onChange={(frictionRating) => setReflection((current) => ({ ...current, frictionRating }))} />
                <TextInput value={reflection.provokingThought ?? ""} onChangeText={(provokingThought) => setReflection((current) => ({ ...current, provokingThought }))} placeholder="What thought got you moving?" placeholderTextColor={colors.muted} style={[styles.reflectionInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
                <RatingSelector label="How powerful was that thought?" value={reflection.provokingThoughtRating ?? 0} onChange={(provokingThoughtRating) => setReflection((current) => ({ ...current, provokingThoughtRating }))} />
                <TextInput value={skillsText} onChangeText={setSkillsText} placeholder="Skills gained, separated by commas" placeholderTextColor={colors.muted} style={[styles.reflectionInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
                {state.customQuestions.filter((question) => question.enabled && question.type === "rating").map((question) => (
                  <RatingSelector
                    key={question.id}
                    label={question.label}
                    value={typeof reflection.customAnswers?.[question.id] === "number" ? reflection.customAnswers[question.id] as number : 0}
                    onChange={(rating) => setReflection((current) => ({ ...current, customAnswers: { ...current.customAnswers, [question.id]: rating } }))}
                  />
                ))}
              </>
            ) : null}

            <TextInput value={reflection.miniAchievement ?? ""} onChangeText={(miniAchievement) => setReflection((current) => ({ ...current, miniAchievement }))} placeholder="Your mini achievement" placeholderTextColor={colors.muted} style={[styles.reflectionInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
            <RatingSelector label="How powerful was this win?" value={reflection.miniAchievementRating ?? 3} onChange={(miniAchievementRating) => setReflection((current) => ({ ...current, miniAchievementRating }))} />
            <CommandButton label="Confirm mission result" icon="trophy.fill" onPress={finish} />
          </CommandCard>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

function FeelingSelector({ label, value, onChange }: { label: string; value: Feeling | null; onChange: (value: Feeling) => void }) {
  const colors = useColors();
  return (
    <View style={styles.selectorBlock}>
      <Text style={[styles.selectorLabel, { color: colors.muted }]}>{label.toUpperCase()}</Text>
      <View style={styles.feelingGrid}>
        {feelings.map((feeling) => (
          <Pressable key={feeling.value} onPress={() => onChange(feeling.value)} style={({ pressed }) => [styles.feelingChip, { backgroundColor: value === feeling.value ? `${feeling.color}24` : colors.background, borderColor: value === feeling.value ? feeling.color : colors.border, opacity: pressed ? 0.72 : 1 }]}>
            <Text style={[styles.feelingText, { color: value === feeling.value ? feeling.color : colors.muted }]}>{feeling.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function RatingSelector({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const colors = useColors();
  return (
    <View style={styles.selectorBlock}>
      <Text style={[styles.selectorLabel, { color: colors.muted }]}>{label.toUpperCase()}</Text>
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <Pressable key={rating} onPress={() => onChange(rating)} style={({ pressed }) => [styles.ratingChip, { backgroundColor: rating <= value ? "#F4C95D25" : colors.background, borderColor: rating <= value ? "#F4C95D" : colors.border, opacity: pressed ? 0.72 : 1 }]}>
            <Text style={[styles.ratingText, { color: rating <= value ? "#F4C95D" : colors.muted }]}>{rating}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingTop: 10, paddingBottom: 26 },
  missing: { flex: 1, justifyContent: "center", gap: 14 },
  missingTitle: { fontSize: 20, lineHeight: 26, fontWeight: "900" },
  statusCard: { gap: 13 },
  statusTopline: { flexDirection: "row", justifyContent: "space-between", gap: 9 },
  timerValue: { fontSize: 43, lineHeight: 50, letterSpacing: -1.2, fontWeight: "900", fontVariant: ["tabular-nums"] },
  timerDetail: { fontSize: 13, lineHeight: 19, fontWeight: "500", marginTop: -8 },
  timerBarWrap: { marginTop: 3 },
  liveActions: { flexDirection: "row", gap: 10 },
  liveAction: { flex: 1 },
  revisionCard: { gap: 12 },
  revisionHeader: { flexDirection: "row", gap: 10, alignItems: "center" },
  revisionIcon: { width: 40, height: 40, borderRadius: 13, justifyContent: "center", alignItems: "center" },
  revisionCopy: { flex: 1 },
  revisionTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  revisionDetail: { fontSize: 11, lineHeight: 16, marginTop: 1, fontWeight: "500" },
  revisionInputRow: { flexDirection: "row", gap: 8 },
  revisionInput: { flex: 1, minHeight: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: 13, paddingHorizontal: 11, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  loggedTopicText: { fontSize: 11, lineHeight: 15, fontWeight: "700" },
  reflectionCard: { gap: 13 },
  reflectionTitle: { fontSize: 19, lineHeight: 24, fontWeight: "900" },
  reflectionDetail: { fontSize: 12, lineHeight: 18, fontWeight: "500", marginTop: 3 },
  reflectionInput: { minHeight: 47, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  selectorBlock: { gap: 7 },
  selectorLabel: { fontSize: 10, lineHeight: 13, letterSpacing: 0.8, fontWeight: "800" },
  feelingGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  feelingChip: { minHeight: 32, paddingHorizontal: 10, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  feelingText: { fontSize: 11, lineHeight: 15, fontWeight: "800" },
  ratingRow: { flexDirection: "row", gap: 7 },
  ratingChip: { flex: 1, minHeight: 37, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  ratingText: { fontSize: 13, lineHeight: 17, fontWeight: "900" },
});
