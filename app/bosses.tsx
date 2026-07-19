import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { CommandButton, CommandCard, EmptyCommandState, IconAction, LoadingScreen, ProgressBar, ScreenTitle, StatusPill } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { formatTimeUntil, getBossProgress, useFocusCommand } from "@/lib/focus-command";

export default function BossesScreen() {
  const colors = useColors();
  const { state, ready, createBoss } = useFocusCommand();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");

  if (!ready) return <LoadingScreen label="Loading campaign board…" />;

  const submitBoss = () => {
    if (!title.trim()) {
      Alert.alert("Name your campaign", "A boss needs a clear objective before it can command missions.");
      return;
    }
    createBoss({
      title: title.trim(),
      objective: objective.trim() || "Complete the linked missions.",
      deadlineAt: null,
      rewardXp: 0,
      rewardGold: 0,
    });
    setTitle("");
    setObjective("");
    setCreating(false);
  };

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenTitle
          eyebrow="Campaigns"
          title="Active bosses"
          detail="Big objectives are cleared through linked missions."
          right={<IconAction icon="xmark" label="Close boss board" onPress={() => router.back()} />}
        />

        <CommandButton label={creating ? "Cancel draft" : "Create boss"} icon={creating ? "xmark" : "plus"} variant={creating ? "secondary" : "primary"} onPress={() => setCreating((value) => !value)} />

        {creating ? (
          <CommandCard accent="#F4C95D" style={styles.formCard}>
            <Text style={[styles.formTitle, { color: colors.foreground }]}>Define the campaign</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Boss name"
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              returnKeyType="next"
            />
            <TextInput
              value={objective}
              onChangeText={setObjective}
              placeholder="What will winning look like?"
              placeholderTextColor={colors.muted}
              multiline
              style={[styles.input, styles.objectiveInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
            />
            <CommandButton label="Activate boss" icon="trophy.fill" onPress={submitBoss} />
          </CommandCard>
        ) : null}

        {state.bosses.filter((boss) => boss.status === "active").length ? (
          <View style={styles.stack}>
            {state.bosses.filter((boss) => boss.status === "active").map((boss) => {
              const progress = getBossProgress(state, boss.id);
              return (
                <CommandCard key={boss.id} accent="#F4C95D" style={styles.bossCard}>
                  <View style={styles.bossHeader}>
                    <View style={styles.bossIconWrap}>
                      <IconSymbol name="trophy.fill" size={23} color="#F4C95D" />
                    </View>
                    <View style={styles.bossCopy}>
                      <Text style={[styles.bossTitle, { color: colors.foreground }]}>{boss.title}</Text>
                      <Text style={[styles.bossObjective, { color: colors.muted }]}>{boss.objective}</Text>
                    </View>
                    <StatusPill label={formatTimeUntil(boss.deadlineAt)} tone={boss.deadlineAt ? "warning" : "neutral"} />
                  </View>
                  <View style={styles.progressRow}>
                    <Text style={[styles.progressLabel, { color: colors.muted }]}>MISSION CLEARANCE</Text>
                    <Text style={[styles.progressValue, { color: "#F4C95D" }]}>{Math.round(progress * 100)}%</Text>
                  </View>
                  <ProgressBar value={progress} color="#F4C95D" height={9} />
                  <CommandButton label="Add linked mission" icon="plus" variant="secondary" onPress={() => router.push("/(tabs)/missions" as never)} />
                </CommandCard>
              );
            })}
          </View>
        ) : (
          <EmptyCommandState icon="trophy.fill" title="No campaign is active" detail="Turn your largest outcome into a boss, then connect each mission that advances it." />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingTop: 10, paddingBottom: 24 },
  formCard: { gap: 11 },
  formTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  input: { minHeight: 48, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 13, fontSize: 14, lineHeight: 19, fontWeight: "600" },
  objectiveInput: { minHeight: 80, paddingTop: 12, textAlignVertical: "top" },
  stack: { gap: 12 },
  bossCard: { gap: 13 },
  bossHeader: { flexDirection: "row", gap: 11, alignItems: "flex-start" },
  bossIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#F4C95D1E", alignItems: "center", justifyContent: "center" },
  bossCopy: { flex: 1, gap: 2 },
  bossTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  bossObjective: { fontSize: 12, lineHeight: 17, fontWeight: "600" },
  progressRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressLabel: { fontSize: 10, lineHeight: 13, fontWeight: "800", letterSpacing: 0.8 },
  progressValue: { fontSize: 14, lineHeight: 18, fontWeight: "900" },
});
