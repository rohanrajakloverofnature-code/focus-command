import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { CommandButton, CommandCard, EmptyCommandState, IconAction, LoadingScreen, ProgressBar, ScreenTitle, StatusPill } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { Boss, formatTimeUntil, getBossProgress, useFocusCommandActions, useFocusCommandReady, useFocusCommandSelector } from "@/lib/focus-command";

const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00`));

type BossForm = { title: string; objective: string; deadline: string; rewardXp: string; rewardGold: string };
const blankForm = (): BossForm => ({ title: "", objective: "", deadline: "", rewardXp: "50", rewardGold: "5" });

export default function BossesScreen() {
  const colors = useColors();
  const bosses = useFocusCommandSelector((state) => state.bosses);
  const missions = useFocusCommandSelector((state) => state.missions);
  const ready = useFocusCommandReady();
  const { createBoss, updateBoss, removeBoss, updateMission } = useFocusCommandActions();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<BossForm>(blankForm());
  const [editingBossId, setEditingBossId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<BossForm>(blankForm());

  const activeBosses = useMemo(() => bosses.filter((boss) => boss.status === "active"), [bosses]);
  if (!ready) return <LoadingScreen label="Loading campaign board…" />;

  const updateDraft = (field: keyof BossForm, value: string) => setDraft((current) => ({ ...current, [field]: value }));
  const updateEditDraft = (field: keyof BossForm, value: string) => setEditDraft((current) => ({ ...current, [field]: value }));

  const normalize = (form: BossForm) => {
    const deadline = form.deadline.trim();
    if (!form.title.trim()) {
      Alert.alert("Name your campaign", "A boss needs a clear campaign title.");
      return null;
    }
    if (!validDate(deadline)) {
      Alert.alert("Set a valid boss deadline", "Enter a required deadline in YYYY-MM-DD format.");
      return null;
    }
    return {
      title: form.title.trim(),
      objective: form.objective.trim() || "Complete the linked missions.",
      deadlineAt: new Date(`${deadline}T12:00:00`).toISOString(),
      rewardXp: Math.max(0, Math.round(Number(form.rewardXp) || 0)),
      rewardGold: Math.max(0, Math.round(Number(form.rewardGold) || 0)),
    };
  };

  const submitBoss = () => {
    const payload = normalize(draft);
    if (!payload) return;
    createBoss(payload);
    setDraft(blankForm());
    setCreating(false);
  };

  const beginEdit = (boss: Boss) => {
    setEditDraft({
      title: boss.title,
      objective: boss.objective,
      deadline: boss.deadlineAt?.slice(0, 10) ?? "",
      rewardXp: String(boss.rewardXp),
      rewardGold: String(boss.rewardGold),
    });
    setEditingBossId(boss.id);
  };

  const saveBoss = (bossId: string) => {
    const payload = normalize(editDraft);
    if (!payload) return;
    updateBoss(bossId, payload);
    setEditingBossId(null);
  };

  const confirmDeleteBoss = (boss: Boss) => {
    const linkedCount = missions.filter((mission) => mission.bossId === boss.id).length;
    Alert.alert("Delete this boss?", linkedCount ? `${linkedCount} linked mission${linkedCount === 1 ? "" : "s"} will remain on the board but become unlinked. This cannot be undone.` : "This campaign will be removed. This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete boss", style: "destructive", onPress: () => removeBoss(boss.id) },
    ]);
  };

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenTitle
          eyebrow="Campaigns"
          title="Active bosses"
          detail="Big objectives are cleared through linked missions before the deadline."
          right={<IconAction icon="xmark" label="Close boss board" onPress={() => router.back()} />}
        />

        <CommandButton label={creating ? "Cancel draft" : "Create boss"} icon={creating ? "xmark" : "plus"} variant={creating ? "secondary" : "primary"} onPress={() => { setCreating((value) => !value); if (creating) setDraft(blankForm()); }} />

        {creating ? <BossEditor title="Define the campaign" form={draft} onChange={updateDraft} onSave={submitBoss} saveLabel="Activate boss" /> : null}

        {activeBosses.length ? <View style={styles.stack}>
          {activeBosses.map((boss) => {
            const progress = getBossProgress({ missions }, boss.id);
            const linkedMissions = missions.filter((mission) => mission.bossId === boss.id);
            const editing = editingBossId === boss.id;
            return <CommandCard key={boss.id} accent="#F4C95D" style={styles.bossCard}>
              <View style={styles.bossHeader}>
                <View style={styles.bossIconWrap}><IconSymbol name="trophy.fill" size={23} color="#F4C95D" /></View>
                <View style={styles.bossCopy}>
                  <Text style={[styles.bossTitle, { color: colors.foreground }]}>{boss.title}</Text>
                  <Text style={[styles.bossObjective, { color: colors.muted }]}>{boss.objective}</Text>
                </View>
                <StatusPill label={formatTimeUntil(boss.deadlineAt)} tone="warning" />
              </View>
              <View style={styles.deadlineRow}>
                <Text style={[styles.deadlineLabel, { color: colors.muted }]}>DEADLINE</Text>
                <Text style={[styles.deadlineValue, { color: colors.warning }]}>{boss.deadlineAt?.slice(0, 10) ?? "Not set"}</Text>
                <Text style={[styles.deadlineReward, { color: colors.muted }]}>{boss.rewardXp} XP · {boss.rewardGold} gold</Text>
              </View>
              <View style={styles.progressRow}><Text style={[styles.progressLabel, { color: colors.muted }]}>MISSION CLEARANCE</Text><Text style={[styles.progressValue, { color: "#F4C95D" }]}>{Math.round(progress * 100)}%</Text></View>
              <ProgressBar value={progress} color="#F4C95D" height={9} />

              <View style={styles.linkedSection}>
                <Text style={[styles.linkedLabel, { color: colors.muted }]}>LINKED MISSIONS · {linkedMissions.length}</Text>
                {linkedMissions.length ? linkedMissions.map((mission) => <View key={mission.id} style={[styles.linkedMission, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.linkedMissionCopy}><Text numberOfLines={1} style={[styles.linkedMissionTitle, { color: colors.foreground }]}>{mission.title}</Text><Text style={[styles.linkedMissionDetail, { color: colors.muted }]}>{mission.status.toUpperCase()} · {mission.baseXp} XP</Text></View>
                  <CommandButton label="Unlink" variant="ghost" onPress={() => updateMission(mission.id, { bossId: null })} />
                </View>) : <Text style={[styles.noLinked, { color: colors.muted }]}>No missions are linked yet.</Text>}
              </View>

              <View style={styles.actionRow}>
                <CommandButton label="Add linked mission" icon="plus" variant="secondary" onPress={() => router.push({ pathname: "/missions" as never, params: { compose: "1", bossId: boss.id } })} style={styles.actionButton} />
                <CommandButton label={editing ? "Close editor" : "Edit"} variant="secondary" onPress={() => editing ? setEditingBossId(null) : beginEdit(boss)} style={styles.actionButton} />
                <CommandButton label="Delete" variant="danger" onPress={() => confirmDeleteBoss(boss)} style={styles.actionButton} />
              </View>
              {editing ? <BossEditor title="Edit boss" form={editDraft} onChange={updateEditDraft} onSave={() => saveBoss(boss.id)} saveLabel="Save boss changes" compact /> : null}
            </CommandCard>;
          })}
        </View> : <EmptyCommandState icon="trophy.fill" title="No campaign is active" detail="Turn your largest outcome into a deadline-bound boss, then connect each mission that advances it." />}
      </ScrollView>
    </ScreenContainer>
  );
}

function BossEditor({ title, form, onChange, onSave, saveLabel, compact = false }: { title: string; form: BossForm; onChange: (field: keyof BossForm, value: string) => void; onSave: () => void; saveLabel: string; compact?: boolean }) {
  const colors = useColors();
  return <CommandCard accent="#F4C95D" style={[styles.formCard, compact && styles.compactForm]}>
    <Text style={[styles.formTitle, { color: colors.foreground }]}>{title}</Text>
    <TextInput value={form.title} onChangeText={(value) => onChange("title", value)} placeholder="Boss campaign name" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} returnKeyType="next" />
    <TextInput value={form.objective} onChangeText={(value) => onChange("objective", value)} placeholder="What will victory look like?" placeholderTextColor={colors.muted} multiline style={[styles.input, styles.objectiveInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
    <Text style={[styles.fieldLabel, { color: colors.muted }]}>REQUIRED DEADLINE · YYYY-MM-DD</Text>
    <TextInput value={form.deadline} onChangeText={(value) => onChange("deadline", value)} placeholder="2026-12-31" autoCapitalize="none" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
    <View style={styles.rewardRow}>
      <TextInput value={form.rewardXp} onChangeText={(value) => onChange("rewardXp", value)} keyboardType="number-pad" placeholder="Boss XP" placeholderTextColor={colors.muted} style={[styles.input, styles.rewardInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
      <TextInput value={form.rewardGold} onChangeText={(value) => onChange("rewardGold", value)} keyboardType="number-pad" placeholder="Gold" placeholderTextColor={colors.muted} style={[styles.input, styles.rewardInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
    </View>
    <CommandButton label={saveLabel} icon="trophy.fill" onPress={onSave} />
  </CommandCard>;
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingTop: 10, paddingBottom: 24 },
  formCard: { gap: 11 },
  compactForm: { marginTop: 2 },
  formTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  fieldLabel: { fontSize: 10, lineHeight: 13, letterSpacing: 0.75, fontWeight: "900" },
  input: { minHeight: 48, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 13, fontSize: 14, lineHeight: 19, fontWeight: "600" },
  objectiveInput: { minHeight: 80, paddingTop: 12, textAlignVertical: "top" },
  rewardRow: { flexDirection: "row", gap: 8 },
  rewardInput: { flex: 1 },
  stack: { gap: 12 },
  bossCard: { gap: 13 },
  bossHeader: { flexDirection: "row", gap: 11, alignItems: "flex-start" },
  bossIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#F4C95D1E", alignItems: "center", justifyContent: "center" },
  bossCopy: { flex: 1, gap: 2 },
  bossTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  bossObjective: { fontSize: 12, lineHeight: 17, fontWeight: "600" },
  deadlineRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  deadlineLabel: { fontSize: 10, lineHeight: 13, fontWeight: "900", letterSpacing: 0.8 },
  deadlineValue: { fontSize: 11, lineHeight: 15, fontWeight: "900", fontVariant: ["tabular-nums"] },
  deadlineReward: { fontSize: 11, lineHeight: 15, fontWeight: "700" },
  progressRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressLabel: { fontSize: 10, lineHeight: 13, fontWeight: "800", letterSpacing: 0.8 },
  progressValue: { fontSize: 14, lineHeight: 18, fontWeight: "900" },
  linkedSection: { gap: 7 },
  linkedLabel: { fontSize: 10, lineHeight: 13, letterSpacing: 0.8, fontWeight: "900" },
  linkedMission: { flexDirection: "row", alignItems: "center", gap: 9, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 9 },
  linkedMissionCopy: { flex: 1, gap: 1 },
  linkedMissionTitle: { fontSize: 12, lineHeight: 16, fontWeight: "800" },
  linkedMissionDetail: { fontSize: 10, lineHeight: 13, fontWeight: "700" },
  noLinked: { fontSize: 12, lineHeight: 17, fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 7 },
  actionButton: { flex: 1 },
});
