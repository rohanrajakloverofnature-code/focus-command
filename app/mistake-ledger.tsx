import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { CommandCard, LoadingScreen, ScreenTitle, SectionHeader } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getMistakeLedgerActivities, getMistakeLedgerSubjects, getMistakeLedgerSummary, MISTAKE_LEDGER_STATUS_LABELS, type MistakeLedgerRange } from "@/lib/mistake-ledger";
import { MISTAKE_LEDGER_STATUSES, shallowEqual, type FocusState, type MistakeLedgerEntry, type MistakeLedgerStatus, useFocusCommandActions, useFocusCommandReady, useFocusCommandSelector } from "@/lib/focus-command";

const PERIODS: { id: MistakeLedgerRange["kind"]; label: string }[] = [
  { id: "week", label: "Weekly" }, { id: "month", label: "Monthly" }, { id: "year", label: "Yearly" }, { id: "lifetime", label: "Lifetime" }, { id: "custom", label: "Custom" },
];

const selectLedger = (state: FocusState) => ({
  entries: state.mistakeLedgerEntries,
  activity: state.mistakeLedgerActivityLog,
  missions: state.missions,
  timezone: state.profile.timezone,
});

function statusColor(status: MistakeLedgerStatus) {
  if (status === "improved") return "#F4C95D";
  if (status === "improving") return "#49D17D";
  if (status === "needs_review") return "#FFAA4C";
  if (status === "working_on") return "#A78BFA";
  return "#8EA0B8";
}

export default function MistakeLedgerScreen() {
  const colors = useColors();
  const ready = useFocusCommandReady();
  const { addMistakeLedgerEntry, updateMistakeLedgerEntry, setMistakeLedgerStatus, removeMistakeLedgerEntry } = useFocusCommandActions();
  const { entries, activity, missions, timezone } = useFocusCommandSelector(selectLedger, shallowEqual);
  const [rangeKind, setRangeKind] = useState<MistakeLedgerRange["kind"]>("week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [subject, setSubject] = useState("all");
  const [status, setStatus] = useState<MistakeLedgerStatus | "all">("all");
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mistake, setMistake] = useState("");
  const [entrySubject, setEntrySubject] = useState("");
  const [correction, setCorrection] = useState("");
  const [missionId, setMissionId] = useState<string | null>(null);

  const range = useMemo<MistakeLedgerRange>(() => (
    rangeKind === "custom" ? { kind: "custom", startDate: customStart.trim(), endDate: customEnd.trim() } : { kind: rangeKind }
  ), [customEnd, customStart, rangeKind]);
  const subjects = useMemo(() => getMistakeLedgerSubjects(entries), [entries]);
  const rows = useMemo(() => getMistakeLedgerActivities(entries, activity, range, subject, status, timezone), [activity, entries, range, status, subject, timezone]);
  const summary = useMemo(() => getMistakeLedgerSummary(rows), [rows]);

  const closeComposer = useCallback(() => {
    setComposerOpen(false); setEditingId(null); setMistake(""); setEntrySubject(""); setCorrection(""); setMissionId(null);
  }, []);
  const save = useCallback(() => {
    if (!mistake.trim() || !entrySubject.trim()) {
      Alert.alert("Add a mistake and subject", "Both are needed so the private review filters remain useful.");
      return;
    }
    if (editingId) updateMistakeLedgerEntry(editingId, { mistake, subject: entrySubject, correction, missionId });
    else addMistakeLedgerEntry({ mistake, subject: entrySubject, correction, missionId });
    closeComposer();
  }, [addMistakeLedgerEntry, closeComposer, correction, editingId, entrySubject, mistake, missionId, updateMistakeLedgerEntry]);
  const beginEdit = useCallback((entry: MistakeLedgerEntry) => {
    setEditingId(entry.id); setMistake(entry.mistake); setEntrySubject(entry.subject); setCorrection(entry.correction); setMissionId(entry.missionId); setComposerOpen(true);
  }, []);
  const chip = useCallback((label: string, active: boolean, onPress: () => void, accent = "#A78BFA") => (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, { borderColor: active ? accent : colors.border, backgroundColor: active ? `${accent}24` : colors.background, opacity: pressed ? 0.72 : 1 }]}>
      <Text style={[styles.chipText, { color: active ? accent : colors.foreground }]}>{label}</Text>
    </Pressable>
  ), [colors.background, colors.border, colors.foreground]);

  if (!ready) return <LoadingScreen label="Opening private ledger…" />;
  const header = <>
    <ScreenTitle eyebrow="Private improvement record" title="Mistake Ledger" detail="Record what went wrong, write the correction, and track only the progress you choose." right={<Pressable onPress={() => router.back()}><Text style={[styles.close, { color: colors.primary }]}>Close</Text></Pressable>} />
    <Pressable onPress={() => setComposerOpen(true)} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}><Text style={[styles.primaryText, { color: colors.background }]}>Add mistake</Text></Pressable>
    <SectionHeader title="Review activity" />
    <Text style={[styles.summary, { color: colors.muted }]}>{summary.noted} noted · {summary.improved} marked improved in this view</Text>
    <FlatList horizontal data={PERIODS} keyExtractor={(item) => item.id} renderItem={({ item }) => chip(item.label, rangeKind === item.id, () => setRangeKind(item.id))} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} />
    {rangeKind === "custom" ? <View style={styles.customDates}><TextInput value={customStart} onChangeText={setCustomStart} placeholder="Start YYYY-MM-DD" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><TextInput value={customEnd} onChangeText={setCustomEnd} placeholder="End YYYY-MM-DD" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /></View> : null}
    <Text style={[styles.filterLabel, { color: colors.muted }]}>SUBJECT</Text>
    <FlatList horizontal data={["all", ...subjects]} keyExtractor={(item) => item} renderItem={({ item }) => chip(item === "all" ? "All Subjects" : item, subject === item, () => setSubject(item), "#F4C95D")} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} />
    <Text style={[styles.filterLabel, { color: colors.muted }]}>STATUS</Text>
    <FlatList horizontal data={["all", ...MISTAKE_LEDGER_STATUSES]} keyExtractor={(item) => item} renderItem={({ item }) => chip(item === "all" ? "All Statuses" : MISTAKE_LEDGER_STATUS_LABELS[item as MistakeLedgerStatus], status === item, () => setStatus(item as MistakeLedgerStatus | "all"), item === "all" ? "#A78BFA" : statusColor(item as MistakeLedgerStatus))} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} />
    {composerOpen ? <CommandCard accent="#F4C95D" style={styles.composer}><Text style={[styles.composerTitle, { color: colors.foreground }]}>{editingId ? "Edit mistake" : "Add a mistake"}</Text><TextInput value={mistake} onChangeText={setMistake} placeholder="What happened?" multiline placeholderTextColor={colors.muted} style={[styles.textarea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><TextInput value={entrySubject} onChangeText={setEntrySubject} placeholder="Subject, for example Maths" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><TextInput value={correction} onChangeText={setCorrection} placeholder="Short correction or reminder (optional)" multiline placeholderTextColor={colors.muted} style={[styles.textarea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><Text style={[styles.filterLabel, { color: colors.muted }]}>OPTIONAL MISSION LINK</Text><FlatList horizontal data={[{ id: "none", title: "No mission" }, ...missions.map((mission) => ({ id: mission.id, title: mission.title }))]} keyExtractor={(item) => item.id} renderItem={({ item }) => chip(item.title, (missionId ?? "none") === item.id, () => setMissionId(item.id === "none" ? null : item.id))} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} /><Pressable onPress={save} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}><Text style={[styles.primaryText, { color: colors.background }]}>{editingId ? "Save changes" : "Save mistake"}</Text></Pressable><Pressable onPress={closeComposer}><Text style={[styles.cancel, { color: colors.muted }]}>Cancel</Text></Pressable></CommandCard> : null}
  </>;

  return <ScreenContainer className="px-4" containerClassName="bg-background"><FlatList data={rows} keyExtractor={(record) => record.id} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" ListHeaderComponent={header} ListEmptyComponent={<CommandCard accent="#8EA0B8"><Text style={[styles.emptyTitle, { color: colors.foreground }]}>No matching mistake activity</Text><Text style={[styles.emptyCopy, { color: colors.muted }]}>Add a real mistake when you notice one. It never changes XP, gold, combo, missions, or revisions.</Text></CommandCard>} renderItem={({ item }) => <CommandCard accent={statusColor(item.status)} style={styles.entryCard}><View style={styles.entryTop}><Text style={[styles.subject, { color: statusColor(item.status) }]}>{item.entry.subject.toUpperCase()} · {item.kind === "created" ? "NOTED" : "STATUS UPDATED"}</Text><Text style={[styles.date, { color: colors.muted }]}>{item.actionDate}</Text></View><Text style={[styles.mistake, { color: colors.foreground }]}>{item.entry.mistake}</Text>{item.entry.correction ? <Text style={[styles.correction, { color: colors.muted }]}>Correction: {item.entry.correction}</Text> : null}<View style={styles.statusRow}>{MISTAKE_LEDGER_STATUSES.map((candidate) => chip(MISTAKE_LEDGER_STATUS_LABELS[candidate], item.entry.status === candidate, () => setMistakeLedgerStatus(item.entry.id, candidate), statusColor(candidate)))}</View><View style={styles.actions}><Pressable onPress={() => beginEdit(item.entry)}><Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text></Pressable><Pressable onPress={() => Alert.alert("Delete this mistake?", "Only this ledger entry and its own status history will be removed.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => removeMistakeLedgerEntry(item.entry.id) }])}><Text style={[styles.actionText, { color: "#FF6B6B" }]}>Delete</Text></Pressable></View></CommandCard>} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 48 }, close: { fontSize: 14, fontWeight: "900" }, primary: { minHeight: 46, marginTop: 6, borderRadius: 14, justifyContent: "center", alignItems: "center" }, primaryText: { fontSize: 14, fontWeight: "900" }, summary: { marginTop: -4, fontSize: 13, fontWeight: "700" }, filterLabel: { marginTop: 8, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 }, filterRow: { gap: 8, paddingVertical: 8, paddingRight: 10 }, chip: { minHeight: 34, justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderRadius: 11, paddingHorizontal: 10 }, chipText: { fontSize: 12, fontWeight: "800" }, customDates: { flexDirection: "row", gap: 8 }, input: { minHeight: 44, flex: 1, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 12, fontSize: 14, fontWeight: "700" }, textarea: { minHeight: 70, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12, fontSize: 14, fontWeight: "700", textAlignVertical: "top" }, composer: { gap: 10, marginTop: 4 }, composerTitle: { fontSize: 18, fontWeight: "900" }, cancel: { textAlign: "center", fontSize: 13, fontWeight: "900" }, entryCard: { gap: 8 }, entryTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 }, subject: { flex: 1, fontSize: 10, fontWeight: "900", letterSpacing: 0.9 }, date: { fontSize: 11, fontWeight: "800" }, mistake: { fontSize: 17, lineHeight: 22, fontWeight: "900" }, correction: { fontSize: 13, lineHeight: 18, fontWeight: "700" }, statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 }, actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 }, actionText: { fontSize: 13, fontWeight: "900" }, emptyTitle: { fontSize: 18, fontWeight: "900" }, emptyCopy: { marginTop: 6, fontSize: 13, lineHeight: 18, fontWeight: "700" },
});
