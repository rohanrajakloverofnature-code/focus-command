import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { CommandButton, CommandCard, IconAction, LoadingScreen, ProgressBar, ScreenTitle, StatusPill } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { DistractionLogger } from "@/components/distraction-logger";
import { ShadowGateSheet } from "@/components/shadow-gate-sheet";
import { useColors } from "@/hooks/use-colors";
import { getActiveCustomCharacterForm, getCurrentTitle, getLevelInfo, CustomQuestion, Feeling, formatHours, getDifficultyColor, getDifficultyLabel, getDueMissionRevisions, getMissionInvestedMilliseconds, isLongMissionReflectionEligible, ReflectionDraft, type FocusState, type SrsTopic, useFocusCommandActions, useFocusCommandSelector } from "@/lib/focus-command";
import { scheduleAchievementRecap, scheduleRevisionReminder } from "@/lib/focus-reminders";
import { getCharacterEvolutionProfile } from "@/lib/character-development";

const feelings: { value: Feeling; label: string; color: string }[] = [
  { value: "charged", label: "Charged", color: "#49D17D" },
  { value: "steady", label: "Steady", color: "#A78BFA" },
  { value: "restless", label: "Restless", color: "#FFAA4C" },
  { value: "drained", label: "Drained", color: "#FF6B6B" },
  { value: "great", label: "Great", color: "#F4C95D" },
];

type MissionDetailSnapshot = {
  hydrated: boolean;
  mission: FocusState["missions"][number] | undefined;
  missionDistractionCount: number;
  missionRevisionTopics: FocusState["srsTopics"];
  activeBosses: FocusState["bosses"];
  customQuestions: FocusState["customQuestions"];
  revisionReminderSound: FocusState["profile"]["soundRoles"]["revisionReminder"];
  timezone: FocusState["profile"]["timezone"];
  notificationsEnabled: boolean;
  notificationRules: FocusState["profile"]["notificationRules"];
  achievementRecapSound: FocusState["profile"]["soundRoles"]["achievementRecap"];
  shadowGatePersonalDoorways: FocusState["shadowGatePersonalDoorways"];
  shadowGateSealAccent: string;
};

function hasSameReferences<T>(left: readonly T[], right: readonly T[]) {
  return left.length === right.length && left.every((entry, index) => entry === right[index]);
}

function hasSameMissionDetailSnapshot(left: MissionDetailSnapshot, right: MissionDetailSnapshot) {
  return left.hydrated === right.hydrated
    && left.mission === right.mission
    && left.missionDistractionCount === right.missionDistractionCount
    && hasSameReferences(left.missionRevisionTopics, right.missionRevisionTopics)
    && hasSameReferences(left.activeBosses, right.activeBosses)
    && left.customQuestions === right.customQuestions
    && left.revisionReminderSound === right.revisionReminderSound
    && left.timezone === right.timezone
    && left.notificationsEnabled === right.notificationsEnabled
    && left.notificationRules === right.notificationRules
    && left.achievementRecapSound === right.achievementRecapSound
    && left.shadowGatePersonalDoorways === right.shadowGatePersonalDoorways
    && left.shadowGateSealAccent === right.shadowGateSealAccent;
}

function getShadowGateSealAccent(state: FocusState) {
  const level = getLevelInfo(state).level;
  const title = getCurrentTitle(state).title;
  const customForm = getActiveCustomCharacterForm(state.profile, level);
  const evolution = getCharacterEvolutionProfile(title, level);
  const colorSource = customForm?.portrait?.uri
    ?? customForm?.video?.uri
    ?? state.profile.localCinematicOverrides[evolution.cinematicVariant]?.uri;
  return colorSource
    ? state.profile.characterCinematicColors[colorSource]?.accent ?? state.profile.palette.primary ?? "#A78BFA"
    : state.profile.palette.primary ?? "#A78BFA";
}

function selectMissionDetailSnapshot(state: FocusState, missionId: string | undefined): MissionDetailSnapshot {
  return {
    hydrated: state.hydrated,
    mission: state.missions.find((candidate) => candidate.id === missionId),
    missionDistractionCount: state.distractionLogs.filter((entry) => entry.missionId === missionId).length,
    missionRevisionTopics: state.srsTopics.filter((topic) => topic.missionId === missionId),
    activeBosses: state.bosses.filter((boss) => boss.status === "active"),
    customQuestions: state.customQuestions,
    revisionReminderSound: state.profile.soundRoles.revisionReminder,
    timezone: state.profile.timezone,
    notificationsEnabled: state.profile.notificationsEnabled,
    notificationRules: state.profile.notificationRules,
    achievementRecapSound: state.profile.soundRoles.achievementRecap,
    shadowGatePersonalDoorways: state.shadowGatePersonalDoorways,
    shadowGateSealAccent: getShadowGateSealAccent(state),
  };
}

export default function MissionDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { startMission, startMissionThroughShadowGate, toggleMissionPause, finishMission, logDistraction, logRevisionTopic, completeRevision, updateMission, removeMission } = useFocusCommandActions();
  const detail = useFocusCommandSelector((state) => selectMissionDetailSnapshot(state, id), hasSameMissionDetailSnapshot);
  const { hydrated: ready, mission, missionDistractionCount, missionRevisionTopics, activeBosses, customQuestions, revisionReminderSound, timezone, notificationsEnabled, notificationRules, achievementRecapSound, shadowGatePersonalDoorways, shadowGateSealAccent } = detail;
  const [nowMs, setNowMs] = useState(Date.now());
  const [revisionTopic, setRevisionTopic] = useState("");
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState<ReflectionDraft>({ miniAchievementRating: 3, skills: [] });
  const [skillsText, setSkillsText] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTopic, setEditTopic] = useState("");
  const [editXp, setEditXp] = useState("");
  const [editDueAt, setEditDueAt] = useState("");
  const [editAllowMultipleDailyCompletions, setEditAllowMultipleDailyCompletions] = useState(false);
  const [editBossId, setEditBossId] = useState<string | null>(null);
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);
  const [showShadowGate, setShowShadowGate] = useState(false);
  const submissionLock = useRef(false);
  const startLock = useRef(false);
  const deletionLock = useRef(false);
  const revisionCompletionLocks = useRef(new Set<string>());

  useEffect(() => {
    // Refresh immediately whenever this session becomes visible, then maintain
    // a real millisecond reference while the mission is actively running.
    setNowMs(Date.now());
    if (mission?.status !== "active") return;
    const timer = setInterval(() => setNowMs(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [mission?.id, mission?.status]);

  const duration = useMemo(() => mission ? getMissionInvestedMilliseconds(mission, nowMs) : 0, [mission, nowMs]);
  const isLongMission = mission ? isLongMissionReflectionEligible(mission, nowMs) : false;
  const dueMissionRevisions = useMemo(() => mission ? getDueMissionRevisions(missionRevisionTopics, mission.id, timezone, new Date(nowMs).toISOString()) : [], [mission, missionRevisionTopics, nowMs, timezone]);
  const dueMissionRevisionKey = dueMissionRevisions.map((topic) => topic.id).join("|");

  useEffect(() => {
    const dueTopicIds = new Set(dueMissionRevisionKey ? dueMissionRevisionKey.split("|") : []);
    for (const topicId of revisionCompletionLocks.current) {
      if (!dueTopicIds.has(topicId)) revisionCompletionLocks.current.delete(topicId);
    }
  }, [dueMissionRevisionKey]);

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
    if (submissionLock.current) return;
    const miniAchievement = reflection.miniAchievement?.trim() ?? "";
    if (!miniAchievement) {
      Alert.alert("Add your mission win", "Write a short mini achievement before confirming the mission result.");
      return;
    }
    if (!reflection.miniAchievementRating || reflection.miniAchievementRating < 1 || reflection.miniAchievementRating > 5) {
      Alert.alert("Rate the mission win", "Choose a rating from 1 to 5 before confirming the mission result.");
      return;
    }
    if (isLongMission) {
      const requiredRatings = [reflection.energyBefore, reflection.energyAfter, reflection.focusQuality, reflection.stressLevel, reflection.clarityLevel, reflection.motivationLevel, reflection.distractionLevel];
      if (!reflection.feelingBefore || !reflection.feelingAfter || requiredRatings.some((rating) => !rating || rating < 1 || rating > 5)) {
        Alert.alert("Complete the mission debrief", "Select both feelings and every behavioral rating before confirming this longer mission.");
        return;
      }
    }
    submissionLock.current = true;
    setIsSubmittingResult(true);
    let navigationQueued = false;
    try {
      const result = finishMission(mission.id, { ...reflection, miniAchievement, skills: skillsText.split(",").map((value) => value.trim()).filter(Boolean) });
      if (!result) {
        Alert.alert("Mission cannot be finalized", "This mission is no longer active. Return to the mission board, start it again if it is repeatable, then submit a new result.");
        return;
      }
      // Keep the existing visible saving acknowledgement for one committed frame,
      // then begin navigation before optional audio and notification work. This
      // preserves the durable completion and single-submit lock while keeping
      // native media/session preparation off the touch-to-navigation path.
      requestAnimationFrame(() => {
        router.replace({ pathname: "/mission-result/[id]" as never, params: { id: mission.id, completionId: result.completionId } });
        setTimeout(() => {
          if (notificationsEnabled) void scheduleAchievementRecap(mission.title, notificationRules, achievementRecapSound);
        }, 0);
      });
      navigationQueued = true;
      return;
    } catch {
      Alert.alert("Could not save mission result", "Your result was not confirmed. Please try again. If this continues, reopen the app and submit the active mission once more.");
    } finally {
      // A successfully submitted result stays locked until this screen unmounts
      // during the queued route transition. Failed submissions remain retryable.
      if (!navigationQueued) {
        submissionLock.current = false;
        setIsSubmittingResult(false);
      }
    }
  };

  const logTopic = () => {
    if (!revisionTopic.trim()) return;
    logRevisionTopic(mission.id, revisionTopic, mission.subject);
    setRevisionTopic("");
  };

  const completeLiveMissionRevision = (topic: SrsTopic) => {
    if (revisionCompletionLocks.current.has(topic.id)) return;
    revisionCompletionLocks.current.add(topic.id);
    const nextDelayDays = topic.stage === 0 ? 7 : topic.stage === 1 ? 30 : null;
    completeRevision(topic.id);
    if (notificationsEnabled && nextDelayDays) {
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + nextDelayDays);
      void scheduleRevisionReminder(topic.topic, nextDue.toISOString(), notificationRules, revisionReminderSound);
    }
  };

  const startOnce = () => {
    if (startLock.current) return;
    startLock.current = true;
    startMission(mission.id);
  };

  const startThroughShadowGate = (selection: Parameters<typeof startMissionThroughShadowGate>[1]) => (
    startMissionThroughShadowGate(mission.id, selection)
  );

  const openEditor = () => {
    setEditTitle(mission.title);
    setEditSubject(mission.subject);
    setEditCategory(mission.category);
    setEditTopic(mission.specificTopic);
    setEditXp(String(mission.baseXp));
    setEditDueAt(mission.dueAt?.slice(0, 10) ?? "");
    setEditAllowMultipleDailyCompletions(mission.allowMultipleDailyCompletions);
    setEditBossId(mission.bossId);
    setShowEditor(true);
  };

  const saveEditor = () => {
    const title = editTitle.trim();
    const dueAt = editDueAt.trim();
    if (!title) {
      Alert.alert("Mission needs a title", "Enter a concise action title before saving.");
      return;
    }
    if (dueAt && !/^\d{4}-\d{2}-\d{2}$/.test(dueAt)) {
      Alert.alert("Use a valid deadline", "Use YYYY-MM-DD, or leave the deadline blank.");
      return;
    }
    updateMission(mission.id, {
      title,
      subject: editSubject.trim() || "General",
      category: editCategory.trim() || "Focus",
      specificTopic: editTopic.trim(),
      baseXp: Math.max(1, Math.round(Number(editXp) || mission.baseXp)),
      dueAt: dueAt ? new Date(`${dueAt}T12:00:00`).toISOString() : null,
      allowMultipleDailyCompletions: editAllowMultipleDailyCompletions,
      bossId: editBossId,
    });
    setShowEditor(false);
  };

  const confirmDelete = () => {
    Alert.alert("Delete this mission?", mission.status === "completed" ? "This also removes its linked progression, reflection, revision, and gold records. This cannot be undone." : "This removes the mission from your board. This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete mission", style: "destructive", onPress: () => {
        if (deletionLock.current) return;
        deletionLock.current = true;
        removeMission(mission.id);
        router.replace("/missions" as never);
      } },
    ]);
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

        <CommandCard accent={colors.primary} style={styles.managementCard}>
          <View style={styles.managementCopy}>
            <Text style={[styles.managementTitle, { color: colors.foreground }]}>Mission management</Text>
            <Text style={[styles.managementDetail, { color: colors.muted }]}>Edit the objective, reward, deadline, topic, or campaign link. Deletion permanently clears linked mission records.</Text>
          </View>
          <View style={styles.managementActions}>
            <CommandButton label={showEditor ? "Close editor" : "Edit mission"} variant="secondary" onPress={() => showEditor ? setShowEditor(false) : openEditor()} style={styles.managementAction} />
            <CommandButton label="Delete" variant="danger" onPress={confirmDelete} style={styles.managementAction} />
          </View>
        </CommandCard>

        {showEditor ? <CommandCard accent={colors.primary} style={styles.editorCard}>
          <Text style={[styles.editorTitle, { color: colors.foreground }]}>Edit mission</Text>
          <TextInput value={editTitle} onChangeText={setEditTitle} placeholder="Mission title" placeholderTextColor={colors.muted} style={[styles.editorInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
          <View style={styles.editorRow}>
            <TextInput value={editSubject} onChangeText={setEditSubject} placeholder="Subject" placeholderTextColor={colors.muted} style={[styles.editorInput, styles.editorHalf, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
            <TextInput value={editCategory} onChangeText={setEditCategory} placeholder="Category" placeholderTextColor={colors.muted} style={[styles.editorInput, styles.editorHalf, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
          </View>
          <TextInput value={editTopic} onChangeText={setEditTopic} placeholder="Specific topic" placeholderTextColor={colors.muted} style={[styles.editorInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
          <View style={styles.editorRow}>
            <TextInput value={editXp} onChangeText={setEditXp} keyboardType="number-pad" placeholder="Base XP" placeholderTextColor={colors.muted} style={[styles.editorInput, styles.editorHalf, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
            <TextInput value={editDueAt} onChangeText={setEditDueAt} autoCapitalize="none" placeholder="Deadline YYYY-MM-DD" placeholderTextColor={colors.muted} style={[styles.editorInput, styles.editorHalf, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
          </View>
          {mission.frequency === "daily" ? <Pressable onPress={() => setEditAllowMultipleDailyCompletions((value) => !value)} style={({ pressed }) => [styles.repeatabilityToggle, { borderColor: editAllowMultipleDailyCompletions ? colors.primary : colors.border, backgroundColor: editAllowMultipleDailyCompletions ? `${colors.primary}16` : colors.background, opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
            <IconSymbol name={editAllowMultipleDailyCompletions ? "checklist" : "xmark"} size={17} color={editAllowMultipleDailyCompletions ? colors.primary : colors.muted} />
            <View style={styles.repeatabilityCopy}>
              <Text style={[styles.repeatabilityTitle, { color: colors.foreground }]}>{editAllowMultipleDailyCompletions ? "Run more than once today" : "Limit to one run today"}</Text>
              <Text style={[styles.repeatabilityDetail, { color: colors.muted }]}>{editAllowMultipleDailyCompletions ? "After every valid completion, this mission returns to Planned and can be started again today." : "After completion, the next daily mission stays scheduled for tomorrow."}</Text>
            </View>
          </Pressable> : null}
          <Text style={[styles.editorLabel, { color: colors.muted }]}>CAMPAIGN LINK</Text>
          <View style={styles.bossPicker}>
            <Pressable onPress={() => setEditBossId(null)} style={({ pressed }) => [styles.bossChoice, { backgroundColor: editBossId === null ? `${colors.primary}18` : colors.background, borderColor: editBossId === null ? colors.primary : colors.border, opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}><Text style={[styles.bossChoiceText, { color: editBossId === null ? colors.primary : colors.muted }]}>No boss</Text></Pressable>
            {activeBosses.map((boss) => <Pressable key={boss.id} onPress={() => setEditBossId(boss.id)} style={({ pressed }) => [styles.bossChoice, { backgroundColor: editBossId === boss.id ? "#F4C95D1D" : colors.background, borderColor: editBossId === boss.id ? "#F4C95D" : colors.border, opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}><Text numberOfLines={1} style={[styles.bossChoiceText, { color: editBossId === boss.id ? "#F4C95D" : colors.muted }]}>{boss.title}</Text></Pressable>)}
          </View>
          <CommandButton label="Save mission changes" icon="checklist" onPress={saveEditor} />
        </CommandCard> : null}

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
            <>
              <CommandButton label="Start mission" icon="play.fill" onPress={startOnce} />
              <CommandButton label="BREACH SHADOW GATE" variant="secondary" onPress={() => setShowShadowGate(true)} style={styles.shadowGateStart} />
            </>
          ) : mission.status === "completed" ? (
            <CommandButton label="View results" icon="trophy.fill" onPress={() => router.replace({ pathname: "/mission-result/[id]" as never, params: { id: mission.id } })} />
          ) : (
            <>
              <View style={styles.liveActions}>
                <CommandButton label={mission.status === "paused" ? "Resume" : "Pause"} icon={mission.status === "paused" ? "play.fill" : "pause.fill"} variant="secondary" onPress={() => toggleMissionPause(mission.id)} style={styles.liveAction} />
                <CommandButton label="End mission" icon="stop.fill" onPress={() => setShowReflection(true)} style={styles.liveAction} />
              </View>
              <DistractionLogger count={missionDistractionCount} onLog={(category, note) => logDistraction(mission.id, category, note)} />
            </>
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
            {(mission.status === "active" || mission.status === "paused") && dueMissionRevisions.length ? (
              <View style={[styles.dueRevisionSection, { borderColor: `${colors.warning}45`, backgroundColor: `${colors.warning}0D` }]}>
                <Text style={[styles.dueRevisionEyebrow, { color: colors.warning }]}>DUE FOR REVIEW</Text>
                {dueMissionRevisions.map((topic) => (
                  <View key={topic.id} style={[styles.dueRevisionRow, { borderColor: `${colors.warning}38`, backgroundColor: colors.background }]}>
                    <View style={styles.dueRevisionCopy}>
                      <StatusPill label={`DAY ${[1, 7, 30][Math.min(topic.stage, 2)] ?? 30}`} tone="warning" icon="arrow.clockwise" />
                      <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.dueRevisionTitle, { color: colors.foreground }]}>{topic.topic}</Text>
                      <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.dueRevisionDetail, { color: colors.muted }]}>{topic.subject} · Due {topic.dueDate}</Text>
                    </View>
                    <CommandButton label="Complete review" icon="checklist" onPress={() => completeLiveMissionRevision(topic)} style={styles.dueRevisionAction} />
                  </View>
                ))}
              </View>
            ) : null}
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
                <View style={[styles.emotionTelemetry, { borderColor: `${colors.primary}55`, backgroundColor: `${colors.primary}0B` }]}>
                  <Text style={[styles.telemetryTitle, { color: colors.primary }]}>BEHAVIORAL TELEMETRY</Text>
                  <Text style={[styles.telemetryDetail, { color: colors.muted }]}>These private ratings create your energy, focus, stress, clarity, motivation, and distraction patterns on the dashboard.</Text>
                  <RatingSelector label="Energy before the mission" value={reflection.energyBefore ?? 0} onChange={(energyBefore) => setReflection((current) => ({ ...current, energyBefore }))} />
                  <RatingSelector label="Energy after the mission" value={reflection.energyAfter ?? 0} onChange={(energyAfter) => setReflection((current) => ({ ...current, energyAfter }))} />
                  <RatingSelector label="How focused were you?" value={reflection.focusQuality ?? 0} onChange={(focusQuality) => setReflection((current) => ({ ...current, focusQuality }))} />
                  <RatingSelector label="How stressed did you feel?" value={reflection.stressLevel ?? 0} onChange={(stressLevel) => setReflection((current) => ({ ...current, stressLevel }))} />
                  <RatingSelector label="How clear did your thinking feel?" value={reflection.clarityLevel ?? 0} onChange={(clarityLevel) => setReflection((current) => ({ ...current, clarityLevel }))} />
                  <RatingSelector label="How motivated did you feel?" value={reflection.motivationLevel ?? 0} onChange={(motivationLevel) => setReflection((current) => ({ ...current, motivationLevel }))} />
                  <RatingSelector label="How distracting was the environment?" value={reflection.distractionLevel ?? 0} onChange={(distractionLevel) => setReflection((current) => ({ ...current, distractionLevel }))} />
                </View>
                <TextInput value={reflection.frictionName ?? ""} onChangeText={(frictionName) => setReflection((current) => ({ ...current, frictionName }))} placeholder="What feeling or thought was resisting the task?" placeholderTextColor={colors.muted} style={[styles.reflectionInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
                <RatingSelector label="How strong was that resistance?" value={reflection.frictionRating ?? 0} onChange={(frictionRating) => setReflection((current) => ({ ...current, frictionRating }))} />
                <TextInput value={reflection.provokingThought ?? ""} onChangeText={(provokingThought) => setReflection((current) => ({ ...current, provokingThought }))} placeholder="What thought got you moving?" placeholderTextColor={colors.muted} style={[styles.reflectionInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
                <RatingSelector label="How powerful was that thought?" value={reflection.provokingThoughtRating ?? 0} onChange={(provokingThoughtRating) => setReflection((current) => ({ ...current, provokingThoughtRating }))} />
                <TextInput value={skillsText} onChangeText={setSkillsText} placeholder="Skills gained, separated by commas" placeholderTextColor={colors.muted} style={[styles.reflectionInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
                {customQuestions.filter((question) => question.enabled).map((question) => (
                  <CustomQuestionInput
                    key={question.id}
                    question={question}
                    answer={reflection.customAnswers?.[question.id]}
                    onChange={(answer) => setReflection((current) => ({ ...current, customAnswers: { ...current.customAnswers, [question.id]: answer } }))}
                  />
                ))}
              </>
            ) : null}

            <TextInput value={reflection.miniAchievement ?? ""} onChangeText={(miniAchievement) => setReflection((current) => ({ ...current, miniAchievement }))} placeholder="Your mini achievement" placeholderTextColor={colors.muted} style={[styles.reflectionInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
            <RatingSelector label="How powerful was this win?" value={reflection.miniAchievementRating ?? 3} onChange={(miniAchievementRating) => setReflection((current) => ({ ...current, miniAchievementRating }))} />
            <CommandButton label={isSubmittingResult ? "Saving mission result…" : "Confirm mission result"} icon="trophy.fill" onPress={finish} disabled={isSubmittingResult} />
          </CommandCard>
        ) : null}
      </ScrollView>
      <ShadowGateSheet
        visible={showShadowGate && mission.status === "planned"}
        missionTitle={mission.title}
        missionSubject={mission.subject}
        sealAccent={shadowGateSealAccent}
        personalDoorways={shadowGatePersonalDoorways}
        onClose={() => setShowShadowGate(false)}
        onEnterMission={startThroughShadowGate}
      />
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
          <Pressable key={feeling.value} onPress={() => onChange(feeling.value)} style={({ pressed }) => [styles.feelingChip, { backgroundColor: value === feeling.value ? `${feeling.color}24` : colors.background, borderColor: value === feeling.value ? feeling.color : colors.border, opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
            <Text style={[styles.feelingText, { color: value === feeling.value ? feeling.color : colors.muted }]}>{feeling.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function CustomQuestionInput({ question, answer, onChange }: { question: CustomQuestion; answer: string | number | boolean | string[] | undefined; onChange: (value: string | number | boolean | string[]) => void }) {
  const colors = useColors();
  if (question.type === "rating") return <RatingSelector label={question.label} value={typeof answer === "number" ? answer : 0} onChange={onChange} />;
  if (question.type === "text") return (
    <View style={styles.selectorBlock}>
      <Text style={[styles.selectorLabel, { color: colors.muted }]}>{question.label.toUpperCase()}</Text>
      <TextInput value={typeof answer === "string" ? answer : ""} onChangeText={onChange} placeholder="Write your answer" placeholderTextColor={colors.muted} style={[styles.reflectionInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
    </View>
  );
  const selected = question.type === "multiple_choice" && Array.isArray(answer) ? answer : [];
  return (
    <View style={styles.selectorBlock}>
      <Text style={[styles.selectorLabel, { color: colors.muted }]}>{question.label.toUpperCase()}</Text>
      <View style={styles.choiceAnswerGrid}>
        {question.options.map((option) => {
          const active = question.type === "single_choice" ? answer === option : selected.includes(option);
          return <Pressable key={option} onPress={() => onChange(question.type === "single_choice" ? option : active ? selected.filter((value) => value !== option) : [...selected, option])} style={({ pressed }) => [styles.answerChoice, { backgroundColor: active ? `${colors.primary}1D` : colors.background, borderColor: active ? colors.primary : colors.border, opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}><Text style={[styles.answerChoiceText, { color: active ? colors.primary : colors.muted }]}>{option}</Text></Pressable>;
        })}
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
          <Pressable key={rating} onPress={() => onChange(rating)} style={({ pressed }) => [styles.ratingChip, { backgroundColor: rating <= value ? "#F4C95D25" : colors.background, borderColor: rating <= value ? "#F4C95D" : colors.border, opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
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
  managementCard: { gap: 10 },
  managementCopy: { gap: 3 },
  managementTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  managementDetail: { fontSize: 12, lineHeight: 17, fontWeight: "600" },
  managementActions: { flexDirection: "row", gap: 8 },
  managementAction: { flex: 1 },
  editorCard: { gap: 10 },
  editorTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  editorInput: { minHeight: 45, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 11, fontSize: 13, lineHeight: 17, fontWeight: "600" },
  editorRow: { flexDirection: "row", gap: 8 },
  editorHalf: { flex: 1 },
  repeatabilityToggle: { minHeight: 56, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 11, flexDirection: "row", alignItems: "center", gap: 10 },
  repeatabilityCopy: { flex: 1 },
  repeatabilityTitle: { fontSize: 13, lineHeight: 18, fontWeight: "800" },
  repeatabilityDetail: { fontSize: 11, lineHeight: 15, marginTop: 1, fontWeight: "500" },
  editorLabel: { fontSize: 10, lineHeight: 13, letterSpacing: 0.8, fontWeight: "900" },
  bossPicker: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  bossChoice: { minHeight: 33, maxWidth: "100%", paddingHorizontal: 10, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, justifyContent: "center" },
  bossChoiceText: { fontSize: 11, lineHeight: 14, fontWeight: "800" },
  statusCard: { gap: 12 },
  statusTopline: { flexDirection: "row", justifyContent: "space-between", gap: 9 },
  timerValue: { fontSize: 43, lineHeight: 50, letterSpacing: -1.2, fontWeight: "900", fontVariant: ["tabular-nums"] },
  timerDetail: { fontSize: 13, lineHeight: 19, fontWeight: "500", marginTop: -8 },
  timerBarWrap: { marginTop: 3 },
  shadowGateStart: { marginTop: -5 },
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
  dueRevisionSection: { gap: 8, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 10 },
  dueRevisionEyebrow: { fontSize: 10, lineHeight: 13, letterSpacing: 0.9, fontWeight: "900" },
  dueRevisionRow: { gap: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 10 },
  dueRevisionCopy: { gap: 4, minWidth: 0 },
  dueRevisionTitle: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
  dueRevisionDetail: { fontSize: 11, lineHeight: 15, fontWeight: "600" },
  dueRevisionAction: { alignSelf: "stretch" },
  reflectionCard: { gap: 13 },
  reflectionTitle: { fontSize: 19, lineHeight: 24, fontWeight: "900" },
  reflectionDetail: { fontSize: 12, lineHeight: 17, fontWeight: "500", marginTop: 2 },
  emotionTelemetry: { gap: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 15, padding: 12 },
  telemetryTitle: { fontSize: 10, lineHeight: 13, fontWeight: "900", letterSpacing: 0.9 },
  telemetryDetail: { fontSize: 11, lineHeight: 16, fontWeight: "600", marginTop: -5 },
  reflectionInput: { minHeight: 47, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  selectorBlock: { gap: 7 },
  selectorLabel: { fontSize: 10, lineHeight: 13, letterSpacing: 0.8, fontWeight: "800" },
  feelingGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  feelingChip: { minHeight: 32, paddingHorizontal: 10, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  feelingText: { fontSize: 11, lineHeight: 15, fontWeight: "800" },
  ratingRow: { flexDirection: "row", gap: 7 },
  ratingChip: { flex: 1, minHeight: 37, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  ratingText: { fontSize: 11, lineHeight: 14, fontWeight: "900" },
  choiceAnswerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  answerChoice: { minHeight: 34, paddingHorizontal: 10, justifyContent: "center", borderRadius: 11, borderWidth: StyleSheet.hairlineWidth },
  answerChoiceText: { fontSize: 11, lineHeight: 14, fontWeight: "800" },
});
