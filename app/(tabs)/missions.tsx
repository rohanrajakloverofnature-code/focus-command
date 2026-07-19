import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { CommandButton, CommandCard, EmptyCommandState, IconAction, LoadingScreen, ScreenTitle, SectionHeader, StatusPill } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { Difficulty, getDifficultyColor, getDifficultyLabel, getMissionInvestedMilliseconds, useFocusCommand } from "@/lib/focus-command";

type MissionFilter = "open" | "active" | "completed";

const difficultyOptions: Difficulty[] = ["easy", "medium", "hard"];

export default function MissionsScreen() {
  const colors = useColors();
  const { compose, filter: requestedFilter } = useLocalSearchParams<{ compose?: string; filter?: MissionFilter }>();
  const { state, ready, createMission, startMission } = useFocusCommand();
  const [showComposer, setShowComposer] = useState(compose === "1");
  const [filter, setFilter] = useState<MissionFilter>(requestedFilter === "active" || requestedFilter === "completed" ? requestedFilter : "open");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [topic, setTopic] = useState("");
  const [xp, setXp] = useState("25");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [revisionEnabled, setRevisionEnabled] = useState(true);
  const [bossId, setBossId] = useState<string | null>(null);

  const missions = useMemo(() => {
    if (filter === "active") return state.missions.filter((mission) => mission.status === "active" || mission.status === "paused");
    if (filter === "completed") return state.missions.filter((mission) => mission.status === "completed");
    return state.missions.filter((mission) => mission.status === "planned");
  }, [filter, state.missions]);

  if (!ready) return <LoadingScreen label="Loading mission board…" />;

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
    });
    setTitle("");
    setSubject("");
    setCategory("");
    setTopic("");
    setXp("25");
    setDifficulty("medium");
    setRevisionEnabled(true);
    setBossId(null);
    setShowComposer(false);
  };

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
                    <Pressable key={option} onPress={() => setDifficulty(option)} style={({ pressed }) => [styles.choice, { backgroundColor: active ? `${color}25` : colors.background, borderColor: active ? color : colors.border, opacity: pressed ? 0.75 : 1 }]}>
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
            <Pressable onPress={() => setRevisionEnabled((value) => !value)} style={({ pressed }) => [styles.revisionToggle, { borderColor: revisionEnabled ? colors.primary : colors.border, backgroundColor: revisionEnabled ? `${colors.primary}16` : colors.background, opacity: pressed ? 0.75 : 1 }]}>
              <IconSymbol name={revisionEnabled ? "checklist" : "xmark"} size={17} color={revisionEnabled ? colors.primary : colors.muted} />
              <View style={styles.revisionCopy}>
                <Text style={[styles.revisionTitle, { color: colors.foreground }]}>Queue spaced repetition</Text>
                <Text style={[styles.revisionDetail, { color: colors.muted }]}>Schedule a 1–7–30 day review when you complete this mission.</Text>
              </View>
            </Pressable>
            {state.bosses.filter((boss) => boss.status === "active").length ? (
              <View>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>LINKED BOSS (OPTIONAL)</Text>
                <View style={styles.bossChoices}>
                  <Pressable onPress={() => setBossId(null)} style={({ pressed }) => [styles.bossChoice, { backgroundColor: bossId === null ? `${colors.primary}18` : colors.background, borderColor: bossId === null ? colors.primary : colors.border, opacity: pressed ? 0.75 : 1 }]}>
                    <Text style={[styles.bossChoiceText, { color: bossId === null ? colors.primary : colors.muted }]}>None</Text>
                  </Pressable>
                  {state.bosses.filter((boss) => boss.status === "active").map((boss) => (
                    <Pressable key={boss.id} onPress={() => setBossId(boss.id)} style={({ pressed }) => [styles.bossChoice, { backgroundColor: bossId === boss.id ? "#F4C95D1D" : colors.background, borderColor: bossId === boss.id ? "#F4C95D" : colors.border, opacity: pressed ? 0.75 : 1 }]}>
                      <Text numberOfLines={1} style={[styles.bossChoiceText, { color: bossId === boss.id ? "#F4C95D" : colors.muted }]}>{boss.title}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
            <CommandButton label="Deploy mission" icon="play.fill" onPress={submitMission} />
          </CommandCard>
        ) : null}

        <View style={styles.filterRow}>
          {([
            ["open", "Planned"],
            ["active", "Live"],
            ["completed", "History"],
          ] as [MissionFilter, string][]).map(([value, label]) => (
            <Pressable key={value} onPress={() => setFilter(value)} style={({ pressed }) => [styles.filter, { backgroundColor: filter === value ? `${colors.primary}18` : colors.surface, borderColor: filter === value ? colors.primary : colors.border, opacity: pressed ? 0.75 : 1 }]}>
              <Text style={[styles.filterLabel, { color: filter === value ? colors.primary : colors.muted }]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <SectionHeader title={filter === "open" ? "Planned missions" : filter === "active" ? "Live missions" : "Completed history"} action={filter === "open" ? "New mission" : undefined} onAction={filter === "open" ? () => setShowComposer(true) : undefined} />
        {missions.length ? (
          <View style={styles.missionStack}>
            {missions.map((mission) => <MissionCard key={mission.id} mission={mission} onStart={() => startMission(mission.id)} />)}
          </View>
        ) : (
          <EmptyCommandState
            icon={filter === "completed" ? "trophy.fill" : filter === "active" ? "timer" : "target"}
            title={filter === "completed" ? "No completed missions yet" : filter === "active" ? "No mission is running" : "Your board is open"}
            detail={filter === "completed" ? "Your completed missions and reflections will be preserved here." : filter === "active" ? "Start any planned mission when you are ready to focus." : "Build a small, clear mission. You can refine it after it starts."}
            action={filter === "open" ? "Create mission" : undefined}
            onAction={filter === "open" ? () => setShowComposer(true) : undefined}
          />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function MissionCard({ mission, onStart }: { mission: ReturnType<typeof useFocusCommand>["state"]["missions"][number]; onStart: () => void }) {
  const colors = useColors();
  const active = mission.status === "active" || mission.status === "paused";
  const color = getDifficultyColor(mission.difficulty);
  const duration = getMissionInvestedMilliseconds(mission);
  return (
    <Pressable onPress={() => router.push({ pathname: "/mission/[id]" as never, params: { id: mission.id } })} style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}>
      <CommandCard accent={color} style={styles.missionCard}>
        <View style={styles.missionTopline}>
          <StatusPill label={getDifficultyLabel(mission.difficulty)} tone={mission.difficulty === "easy" ? "success" : mission.difficulty === "medium" ? "warning" : "danger"} />
          {active ? <StatusPill label={mission.status === "paused" ? "PAUSED" : "LIVE"} tone={mission.status === "paused" ? "warning" : "primary"} icon={mission.status === "paused" ? "pause.fill" : "timer"} /> : null}
        </View>
        <Text style={[styles.missionTitle, { color: colors.foreground }]}>{mission.title}</Text>
        <Text style={[styles.missionMeta, { color: colors.muted }]}>{mission.subject} · {mission.category} · {mission.baseXp} base XP{active ? ` · ${(duration / 3_600_000).toFixed(2)} h` : ""}</Text>
        <View style={styles.missionFooter}>
          <View style={styles.missionFooterCopy}>
            {mission.revisionEnabled ? <StatusPill label="SRS READY" tone="primary" icon="arrow.clockwise" /> : <StatusPill label="STANDARD" tone="neutral" />}
          </View>
          {mission.status === "planned" ? <CommandButton label="Start" icon="play.fill" onPress={onStart} /> : <CommandButton label="Open" icon="chevron.right" variant="ghost" onPress={() => router.push({ pathname: "/mission/[id]" as never, params: { id: mission.id } })} />}
        </View>
      </CommandCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingTop: 12, paddingBottom: 28 },
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
  bossChoices: { flexDirection: "row", gap: 7, flexWrap: "wrap" },
  bossChoice: { maxWidth: 150, minHeight: 34, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, justifyContent: "center", paddingHorizontal: 10 },
  bossChoiceText: { fontSize: 11, lineHeight: 15, fontWeight: "800" },
  filterRow: { flexDirection: "row", gap: 8 },
  filter: { flex: 1, minHeight: 38, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  filterLabel: { fontSize: 12, lineHeight: 16, fontWeight: "800" },
  missionStack: { gap: 11 },
  missionCard: { gap: 9 },
  missionTopline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  missionTitle: { fontSize: 17, lineHeight: 22, fontWeight: "900", letterSpacing: -0.2 },
  missionMeta: { fontSize: 12, lineHeight: 17, fontWeight: "600" },
  missionFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 2 },
  missionFooterCopy: { flex: 1 },
});
