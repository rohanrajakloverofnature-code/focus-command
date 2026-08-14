import { router, useLocalSearchParams } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { CommandButton, CommandCard, EmptyCommandState, IconAction, LoadingScreen, ScreenTitle, SectionHeader, StatusPill } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { Difficulty, MissionCompletionRecord, MissionFrequency, getDifficultyColor, getDifficultyLabel, getMissionCompletionRecords, getMissionInvestedMilliseconds, useFocusCommand, useFocusCommandActions } from "@/lib/focus-command";

type MissionFilter = "open" | "active" | "completed";
type MissionBoardListItem =
  | { key: string; kind: "completion"; completion: MissionCompletionRecord }
  | { key: string; kind: "mission"; mission: ReturnType<typeof useFocusCommand>["state"]["missions"][number] };

const difficultyOptions: Difficulty[] = ["easy", "medium", "hard"];

export default function MissionsScreen() {
  const colors = useColors();
  const { compose, filter: requestedFilter, bossId: requestedBossId } = useLocalSearchParams<{ compose?: string; filter?: MissionFilter; bossId?: string }>();
  const { state, ready, createMission, createBoss } = useFocusCommand();
  const [showComposer, setShowComposer] = useState(compose === "1");
  const [filter, setFilter] = useState<MissionFilter>(requestedFilter === "active" || requestedFilter === "completed" ? requestedFilter : "open");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [topic, setTopic] = useState("");
  const [xp, setXp] = useState("25");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [revisionEnabled, setRevisionEnabled] = useState(true);
  const [frequency, setFrequency] = useState<MissionFrequency>("once");
  const [allowMultipleDailyCompletions, setAllowMultipleDailyCompletions] = useState(false);
  const [bossId, setBossId] = useState<string | null>(requestedBossId ?? null);
  const [showBossDraft, setShowBossDraft] = useState(false);
  const [bossTitle, setBossTitle] = useState("");
  const [bossObjective, setBossObjective] = useState("");
  const [bossDeadline, setBossDeadline] = useState("");

  useEffect(() => {
    if (requestedBossId && state.bosses.some((boss) => boss.id === requestedBossId && boss.status === "active")) {
      setBossId(requestedBossId);
      setShowComposer(true);
    }
  }, [requestedBossId, state.bosses]);

  const missions = useMemo(() => {
    if (filter === "active") return state.missions.filter((mission) => mission.status === "active" || mission.status === "paused");
    return state.missions.filter((mission) => mission.status === "planned");
  }, [filter, state.missions]);
  const completionRecords = useMemo(() => getMissionCompletionRecords(state), [state]);
  const boardItems = useMemo<MissionBoardListItem[]>(() => {
    if (filter === "completed") return completionRecords.map((completion) => ({ key: `completion:${completion.id}`, kind: "completion", completion }));
    return missions.map((mission) => ({ key: `mission:${mission.id}`, kind: "mission", mission }));
  }, [completionRecords, filter, missions]);
  const renderBoardItem = useCallback(({ item }: { item: MissionBoardListItem }) => (
    item.kind === "completion" ? <CompletionHistoryCard completion={item.completion} /> : <MissionCard mission={item.mission} />
  ), []);

  if (!ready) return <LoadingScreen label="Loading mission board…" />;

  const createBossFromMission = () => {
    const cleanTitle = bossTitle.trim();
    if (!cleanTitle) {
      Alert.alert("Name the boss", "Give the campaign a clear name before linking it to this mission.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bossDeadline.trim()) || Number.isNaN(Date.parse(`${bossDeadline.trim()}T12:00:00`))) {
      Alert.alert("Set a valid boss deadline", "Use YYYY-MM-DD to set the deadline before activating this campaign.");
      return;
    }
    const createdBossId = createBoss({
      title: cleanTitle,
      objective: bossObjective.trim() || `Advance ${cleanTitle} through linked missions.`,
      deadlineAt: new Date(`${bossDeadline.trim()}T12:00:00`).toISOString(),
      rewardXp: 0,
      rewardGold: 0,
    });
    setBossId(createdBossId);
    setBossTitle("");
    setBossObjective("");
    setBossDeadline("");
    setShowBossDraft(false);
  };

  const submitMission = () => {
    if (!title.trim()) {
      Alert.alert("Name the mission", "Give this mission a clear action title before deploying it.");
      return;
    }
    createMission({
      title,
      subject,
      category,
      difficulty,
      baseXp: Math.max(1, Math.round(Number(xp) || 25)),
      bossId,
      specificTopic: topic,
      revisionEnabled,
      dueAt: null,
      frequency,
      allowMultipleDailyCompletions,
    });
    setTitle("");
    setSubject("");
    setCategory("");
    setTopic("");
    setXp("25");
    setDifficulty("medium");
    setRevisionEnabled(true);
    setFrequency("once");
    setAllowMultipleDailyCompletions(false);
    setBossId(null);
    setShowComposer(false);
  };

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background">
      <FlatList
        data={boardItems}
        renderItem={renderBoardItem}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={<View style={styles.listHeader}>
        <ScreenTitle
          eyebrow="Mission board"
          title="Deploy work"
          detail="Define a task, start the clock, then turn focused time into power."
          right={<IconAction icon={showComposer ? "xmark" : "plus"} label={showComposer ? "Close mission composer" : "Create mission"} onPress={() => setShowComposer((value) => !value)} />}
        />

        {showComposer ? (
          <CommandCard accent={colors.primary} style={styles.composer}>
            <View style={styles.composerTitleRow}>
              <View>
                <Text style={[styles.composerTitle, { color: colors.foreground }]}>New mission</Text>
                <Text style={[styles.composerDetail, { color: colors.muted }]}>Make the objective clear enough to start immediately.</Text>
              </View>
              <StatusPill label="READY" tone="primary" icon="target" />
            </View>
            <TextInput value={title} onChangeText={setTitle} placeholder="Mission name" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} returnKeyType="next" />
            <View style={styles.twoColumns}>
              <TextInput value={subject} onChangeText={setSubject} placeholder="Subject" placeholderTextColor={colors.muted} style={[styles.input, styles.half, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
              <TextInput value={category} onChangeText={setCategory} placeholder="Category" placeholderTextColor={colors.muted} style={[styles.input, styles.half, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
            </View>
            <TextInput value={topic} onChangeText={setTopic} placeholder="Specific topic (for revision)" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
            <View>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>DIFFICULTY</Text>
              <View style={styles.choiceRow}>
                {difficultyOptions.map((option) => {
                  const active = difficulty === option;
                  const color = getDifficultyColor(option);
                  return (
                    <Pressable key={option} onPress={() => setDifficulty(option)} style={({ pressed }) => [styles.choice, { backgroundColor: active ? `${color}25` : colors.background, borderColor: active ? color : colors.border, opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                      <View style={[styles.choiceDot, { backgroundColor: color }]} />
                      <Text style={[styles.choiceLabel, { color: active ? color : colors.foreground }]}>{getDifficultyLabel(option)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={styles.xpRow}>
              <View style={styles.xpCopy}>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>BASE XP REWARD</Text>
                <Text style={[styles.xpDetail, { color: colors.muted }]}>Applied once when the mission ends.</Text>
              </View>
              <TextInput value={xp} onChangeText={setXp} keyboardType="number-pad" style={[styles.xpInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
            </View>
            <Pressable onPress={() => setRevisionEnabled((value) => !value)} style={({ pressed }) => [styles.revisionToggle, { borderColor: revisionEnabled ? colors.primary : colors.border, backgroundColor: revisionEnabled ? `${colors.primary}16` : colors.background, opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
              <IconSymbol name={revisionEnabled ? "checklist" : "xmark"} size={17} color={revisionEnabled ? colors.primary : colors.muted} />
              <View style={styles.revisionCopy}>
                <Text style={[styles.revisionTitle, { color: colors.foreground }]}>Queue spaced repetition</Text>
                <Text style={[styles.revisionDetail, { color: colors.muted }]}>Schedule a 1–7–30 day review when you complete this mission.</Text>
              </View>
            </Pressable>
            <View style={styles.frequencySection}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>TASK FREQUENCY</Text>
              <View style={styles.frequencyOptions}>
                {(["once", "daily"] as MissionFrequency[]).map((value) => {
                  const selected = frequency === value;
                  return <Pressable key={value} onPress={() => { setFrequency(value); setAllowMultipleDailyCompletions(value === "daily"); }} style={({ pressed }) => [styles.frequencyChoice, { backgroundColor: selected ? `${colors.primary}18` : colors.background, borderColor: selected ? colors.primary : colors.border, opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                    <Text style={[styles.frequencyChoiceTitle, { color: selected ? colors.primary : colors.foreground }]}>{value === "daily" ? "Daily" : "One time"}</Text>
                    <Text style={[styles.frequencyChoiceDetail, { color: selected ? colors.primary : colors.muted }]}>{value === "daily" ? "Repeatable by default" : "Completes once"}</Text>
                  </Pressable>;
                })}
              </View>
              {frequency === "daily" ? <Pressable onPress={() => setAllowMultipleDailyCompletions((value) => !value)} style={({ pressed }) => [styles.repeatabilityToggle, { borderColor: allowMultipleDailyCompletions ? colors.primary : colors.border, backgroundColor: allowMultipleDailyCompletions ? `${colors.primary}16` : colors.background, opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                <IconSymbol name={allowMultipleDailyCompletions ? "checklist" : "xmark"} size={17} color={allowMultipleDailyCompletions ? colors.primary : colors.muted} />
                <View style={styles.repeatabilityCopy}>
                  <Text style={[styles.revisionTitle, { color: colors.foreground }]}>{allowMultipleDailyCompletions ? "Run more than once today" : "Limit to one run today"}</Text>
                  <Text style={[styles.revisionDetail, { color: colors.muted }]}>{allowMultipleDailyCompletions ? "Each completion returns this mission to Planned so you can start it again before midnight." : "A fresh daily mission will be scheduled for tomorrow after completion."}</Text>
                </View>
              </Pressable> : null}
              {frequency === "daily" ? <Text style={[styles.frequencyHint, { color: colors.muted }]}>{allowMultipleDailyCompletions ? "Every valid run receives its own time, XP, reflection, and history record." : "Today’s XP and time totals reset automatically at midnight."}</Text> : null}
            </View>
            <View style={styles.bossSection}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>MISSION CAMPAIGN</Text>
              <Text style={[styles.bossSectionDetail, { color: colors.muted }]}>Link this task to an existing campaign, or create a boss here before you deploy the mission.</Text>
              {state.bosses.filter((boss) => boss.status === "active").length ? (
                <View style={styles.bossChoices}>
                  <Pressable onPress={() => setBossId(null)} style={({ pressed }) => [styles.bossChoice, { backgroundColor: bossId === null ? `${colors.primary}18` : colors.background, borderColor: bossId === null ? colors.primary : colors.border, opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                    <Text style={[styles.bossChoiceText, { color: bossId === null ? colors.primary : colors.muted }]}>No boss</Text>
                  </Pressable>
                  {state.bosses.filter((boss) => boss.status === "active").map((boss) => (
                    <Pressable key={boss.id} onPress={() => setBossId(boss.id)} style={({ pressed }) => [styles.bossChoice, { backgroundColor: bossId === boss.id ? "#F4C95D1D" : colors.background, borderColor: bossId === boss.id ? "#F4C95D" : colors.border, opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                      <Text numberOfLines={1} style={[styles.bossChoiceText, { color: bossId === boss.id ? "#F4C95D" : colors.muted }]}>{boss.title}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <CommandButton label={showBossDraft ? "Cancel boss draft" : "Create boss for this mission"} icon={showBossDraft ? "xmark" : "trophy.fill"} variant="secondary" onPress={() => setShowBossDraft((value) => !value)} />
              {showBossDraft ? <View style={[styles.bossDraft, { borderColor: `${colors.warning}70`, backgroundColor: `${colors.warning}0E` }]}>
                <TextInput value={bossTitle} onChangeText={setBossTitle} placeholder="Boss campaign name" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
                <TextInput value={bossObjective} onChangeText={setBossObjective} placeholder="What will victory look like?" placeholderTextColor={colors.muted} multiline style={[styles.input, styles.bossObjectiveInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
                <Text style={[styles.inputLabel, { color: colors.muted }]}>REQUIRED DEADLINE · YYYY-MM-DD</Text>
                <TextInput value={bossDeadline} onChangeText={setBossDeadline} placeholder="2026-12-31" autoCapitalize="none" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
                <CommandButton label="Activate & link boss" icon="trophy.fill" onPress={createBossFromMission} />
              </View> : null}
            </View>
            <CommandButton label={bossId ? "Deploy linked mission" : "Deploy mission"} icon="play.fill" onPress={submitMission} />
          </CommandCard>
        ) : null}

        <View style={styles.filterRow}>
          {([
            ["open", "Planned"],
            ["active", "Live"],
            ["completed", "History"],
          ] as [MissionFilter, string][]).map(([value, label]) => (
            <Pressable key={value} onPress={() => setFilter(value)} style={({ pressed }) => [styles.filter, { backgroundColor: filter === value ? `${colors.primary}18` : colors.surface, borderColor: filter === value ? colors.primary : colors.border, opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
              <Text style={[styles.filterLabel, { color: filter === value ? colors.primary : colors.muted }]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <SectionHeader title={filter === "open" ? "Planned missions" : filter === "active" ? "Live missions" : "Completed history"} action={filter === "open" ? "New mission" : undefined} onAction={filter === "open" ? () => setShowComposer(true) : undefined} />
        </View>}
        ListEmptyComponent={(
          <EmptyCommandState
            icon={filter === "completed" ? "trophy.fill" : filter === "active" ? "timer" : "target"}
            title={filter === "completed" ? "No completed missions yet" : filter === "active" ? "No mission is running" : "Your board is open"}
            detail={filter === "completed" ? "Your completed missions and reflections will be preserved here." : filter === "active" ? "Start any planned mission when you are ready to focus." : "Build a small, clear mission. You can refine it after it starts."}
            action={filter === "open" ? "Create mission" : undefined}
            onAction={filter === "open" ? () => setShowComposer(true) : undefined}
          />
        )}
      />
    </ScreenContainer>
  );
}

const CompletionHistoryCard = memo(function CompletionHistoryCard({ completion }: { completion: MissionCompletionRecord }) {
  const colors = useColors();
  const { removeMissionCompletion } = useFocusCommandActions();
  const removalInFlight = useRef(false);
  const color = getDifficultyColor(completion.difficulty);
  const completedLabel = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(completion.completedAt));
  const reflection = completion.reflection;
  const openResult = () => router.push({ pathname: "/mission-result/[id]" as never, params: { id: completion.missionId, completionId: completion.id } });
  const removeOnce = useCallback(() => {
    if (removalInFlight.current) return;
    removalInFlight.current = true;
    removeMissionCompletion(completion.id);
  }, [completion.id, removeMissionCompletion]);
  const confirmRemoval = (event: { stopPropagation?: () => void }) => {
    event.stopPropagation?.();
    Alert.alert(
      "Delete this completed run and its data?",
      `This will permanently remove ${completion.title}, its invested time, XP, power, gold, reflection answers, mini achievement, recognition, and other data earned by this run. The main mission will remain. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete run and data", style: "destructive", onPress: removeOnce },
      ],
    );
  };
  return (
    <Pressable onPress={openResult} style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
      <CommandCard accent={color} style={styles.missionCard}>
        <View style={styles.missionTopline}>
          <StatusPill label={getDifficultyLabel(completion.difficulty)} tone={completion.difficulty === "easy" ? "success" : completion.difficulty === "medium" ? "warning" : "danger"} />
          <StatusPill label="COMPLETE" tone="success" icon="checklist" />
        </View>
        <Text numberOfLines={2} style={[styles.missionTitle, { color: colors.foreground }]}>{completion.title}</Text>
        <Text numberOfLines={2} style={[styles.missionMeta, { color: colors.muted }]}>{completion.subject || "Unassigned"} · {completion.category || "General"} · {(completion.durationMs / 3_600_000).toFixed(2)} h · {completedLabel}</Text>
        {reflection?.miniAchievement.trim() ? <Text numberOfLines={2} style={[styles.historyReflection, { color: colors.muted }]}>Mini achievement: {reflection.miniAchievement.trim()} {reflection.miniAchievementRating ? `· ${reflection.miniAchievementRating.toFixed(1)}/5` : ""}</Text> : null}
        <View style={styles.missionFooter}>
          <View style={styles.missionFooterCopy}>
            <Text style={[styles.historyAward, { color }]}>{completion.progression?.powerAwarded ?? completion.baseXp} power · {completion.progression?.goldAwarded ?? 0} gold</Text>
          </View>
          <View style={styles.historyActions}>
            <CommandButton label="Open" icon="chevron.right" variant="ghost" onPress={openResult} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete completed run: ${completion.title}`}
              onPress={confirmRemoval}
              hitSlop={4}
              style={({ pressed }) => [styles.deleteRunButton, { borderColor: `${colors.error}88`, backgroundColor: `${colors.error}12`, opacity: pressed ? 0.74 : 1 }]}
            >
              <IconSymbol name="xmark" size={15} color={colors.error} />
              <Text style={[styles.deleteRunLabel, { color: colors.error }]}>Delete run</Text>
            </Pressable>
          </View>
        </View>
      </CommandCard>
    </Pressable>
  );
});

const MissionCard = memo(function MissionCard({ mission }: { mission: ReturnType<typeof useFocusCommand>["state"]["missions"][number] }) {
  const colors = useColors();
  const { startMission } = useFocusCommandActions();
  const startInFlight = useRef(false);
  const active = mission.status === "active" || mission.status === "paused";
  const color = getDifficultyColor(mission.difficulty);
  const duration = getMissionInvestedMilliseconds(mission);
  const startOnce = useCallback(() => {
    if (startInFlight.current) return;
    startInFlight.current = true;
    startMission(mission.id);
  }, [mission.id, startMission]);
  return (
    <Pressable onPress={() => router.push({ pathname: "/mission/[id]" as never, params: { id: mission.id } })} style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
      <CommandCard accent={color} style={styles.missionCard}>
        <View style={styles.missionTopline}>
          <StatusPill label={getDifficultyLabel(mission.difficulty)} tone={mission.difficulty === "easy" ? "success" : mission.difficulty === "medium" ? "warning" : "danger"} />
          {active ? <StatusPill label={mission.status === "paused" ? "PAUSED" : "LIVE"} tone={mission.status === "paused" ? "warning" : "primary"} icon={mission.status === "paused" ? "pause.fill" : "timer"} /> : null}
        </View>
        <Text style={[styles.missionTitle, { color: colors.foreground }]}>{mission.title}</Text>
        <Text style={[styles.missionMeta, { color: colors.muted }]}>{mission.subject} · {mission.category} · {mission.baseXp} base XP{mission.allowMultipleDailyCompletions && mission.completionHistory.length > 0 ? ` · ${mission.completionHistory.length} completions` : ""}{active ? ` · ${(duration / 3_600_000).toFixed(2)} h` : ""}</Text>
        <View style={styles.missionFooter}>
          <View style={styles.missionFooterCopy}>
            <View style={styles.missionBadges}>
              {mission.frequency === "daily" ? <StatusPill label="DAILY" tone="success" icon="arrow.clockwise" /> : null}
              {mission.allowMultipleDailyCompletions ? <StatusPill label="REPEATABLE" tone="primary" icon="arrow.clockwise" /> : null}
              {mission.revisionEnabled ? <StatusPill label="SRS READY" tone="primary" icon="arrow.clockwise" /> : <StatusPill label="STANDARD" tone="neutral" />}
            </View>
          </View>
          {mission.status === "planned" ? <CommandButton label="Start" icon="play.fill" onPress={startOnce} /> : <CommandButton label="Open" icon="chevron.right" variant="ghost" onPress={() => router.push({ pathname: "/mission/[id]" as never, params: { id: mission.id } })} />}
        </View>
      </CommandCard>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  content: { paddingTop: 12, paddingBottom: 28 },
  listHeader: { gap: 16, paddingBottom: 16 },
  listSeparator: { height: 10 },
  composer: { gap: 12 },
  composerTitleRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  composerTitle: { fontSize: 18, lineHeight: 23, fontWeight: "900" },
  composerDetail: { fontSize: 12, lineHeight: 17, marginTop: 2, fontWeight: "500" },
  input: { minHeight: 47, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, fontSize: 14, lineHeight: 18, fontWeight: "600" },
  twoColumns: { flexDirection: "row", gap: 9 },
  half: { flex: 1 },
  inputLabel: { fontSize: 10, lineHeight: 13, letterSpacing: 0.85, fontWeight: "800", marginBottom: 7 },
  choiceRow: { flexDirection: "row", gap: 8 },
  choice: { flex: 1, minHeight: 41, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  choiceDot: { width: 7, height: 7, borderRadius: 99 },
  choiceLabel: { fontSize: 12, lineHeight: 16, fontWeight: "800" },
  xpRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  xpCopy: { flex: 1 },
  xpDetail: { fontSize: 11, lineHeight: 15, fontWeight: "500" },
  xpInput: { width: 74, minHeight: 44, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, textAlign: "center", fontSize: 15, lineHeight: 18, fontWeight: "900" },
  revisionToggle: { minHeight: 56, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, padding: 11, flexDirection: "row", alignItems: "center", gap: 10 },
  revisionCopy: { flex: 1 },
  revisionTitle: { fontSize: 13, lineHeight: 18, fontWeight: "800" },
  revisionDetail: { fontSize: 11, lineHeight: 15, marginTop: 1, fontWeight: "500" },
  repeatabilityToggle: { minHeight: 56, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, padding: 11, flexDirection: "row", alignItems: "center", gap: 10 },
  repeatabilityCopy: { flex: 1 },
  frequencySection: { gap: 7 },
  frequencyOptions: { flexDirection: "row", gap: 8 },
  frequencyChoice: { flex: 1, minHeight: 58, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 11, paddingVertical: 9, justifyContent: "center" },
  frequencyChoiceTitle: { fontSize: 12, lineHeight: 16, fontWeight: "900" },
  frequencyChoiceDetail: { fontSize: 10, lineHeight: 14, fontWeight: "600", marginTop: 1 },
  frequencyHint: { fontSize: 10, lineHeight: 15, fontWeight: "500" },
  bossSection: { gap: 8 },
  bossSectionDetail: { fontSize: 11, lineHeight: 16, fontWeight: "500", marginTop: -3 },
  bossChoices: { flexDirection: "row", gap: 7, flexWrap: "wrap" },
  bossChoice: { maxWidth: 150, minHeight: 34, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, justifyContent: "center", paddingHorizontal: 10 },
  bossChoiceText: { fontSize: 11, lineHeight: 15, fontWeight: "800" },
  bossDraft: { gap: 9, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 10 },
  bossObjectiveInput: { minHeight: 74, paddingTop: 10, textAlignVertical: "top" },
  filterRow: { flexDirection: "row", gap: 8 },
  filter: { flex: 1, minHeight: 38, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  filterLabel: { fontSize: 12, lineHeight: 16, fontWeight: "800" },
  missionStack: { gap: 11 },
  missionCard: { gap: 9 },
  missionTopline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  missionTitle: { fontSize: 17, lineHeight: 22, fontWeight: "900", letterSpacing: -0.2 },
  missionMeta: { fontSize: 12, lineHeight: 17, fontWeight: "600" },
  historyReflection: { fontSize: 11, lineHeight: 16, fontWeight: "600", marginTop: -2 },
  historyAward: { fontSize: 11, lineHeight: 16, fontWeight: "900" },
  missionFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 2 },
  missionFooterCopy: { flex: 1 },
  historyActions: { flexDirection: "row", alignItems: "center", gap: 2 },
  deleteRunButton: { minHeight: 32, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderWidth: StyleSheet.hairlineWidth, borderRadius: 11, paddingHorizontal: 9 },
  deleteRunLabel: { fontSize: 10, lineHeight: 14, fontWeight: "900" },
  missionBadges: { flexDirection: "row", gap: 5, flexWrap: "wrap" },
});
