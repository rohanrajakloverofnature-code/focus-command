import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { CommandCard, IconAction, LoadingScreen, ScreenTitle, StatusPill } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getSleepDurationMinutesFromBedWake,
  shallowEqual,
  toLocalDate,
  useFocusCommandActions,
  useFocusCommandReady,
  useFocusCommandSelector,
  type NapLog,
  type RecoveryActionType,
  type RecoveryStressorStatus,
  type ScreenTimeLog,
  type SleepLog,
} from "@/lib/focus-command";
import { formatMinutes, getRecoveryActionLabel, getRecoveryStressorLabel, getRecoverySummary } from "@/lib/recovery-rhythm";

type ViewKey = "stress" | "sleep" | "screen";
type RecoveryListRecord = { id: string; localDate: string } & (SleepLog | NapLog | ScreenTimeLog | { title: string; status: RecoveryStressorStatus; intensity: number; category: string; concern: string; controllability: "control" | "influence" | "cannot_control_today" | "unclear" });
const STRESS_STATUSES: RecoveryStressorStatus[] = ["identified", "understanding", "control", "action", "monitoring", "resolving", "resolved", "recurring"];

function today(timezone: string) { return toLocalDate(new Date().toISOString(), timezone); }
function numeric(value: string) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }

export default function RecoveryRhythmScreen() {
  const colors = useColors();
  const ready = useFocusCommandReady();
  const data = useFocusCommandSelector((state) => ({
    profile: state.profile,
    stressors: state.recoveryStressors ?? [],
    actions: state.recoveryActions ?? [],
    sleepLogs: state.sleepLogs ?? [],
    naps: state.napLogs ?? [],
    screenLogs: state.screenTimeLogs ?? [],
  }), shallowEqual);
  const actions = useFocusCommandActions();
  const [view, setView] = useState<ViewKey>("stress");
  const localDate = today(data.profile.timezone);
  const summary = useMemo(() => getRecoverySummary({ profile: data.profile, recoveryStressors: data.stressors, recoveryActions: data.actions, sleepLogs: data.sleepLogs, napLogs: data.naps, screenTimeLogs: data.screenLogs }, "week"), [data]);

  const [stressorTitle, setStressorTitle] = useState("");
  const [stressorIntensity, setStressorIntensity] = useState("5");
  const [stressorCategory, setStressorCategory] = useState("");
  const [stressorConcern, setStressorConcern] = useState("");
  const [stressorControl, setStressorControl] = useState<"control" | "influence" | "cannot_control_today" | "unclear">("unclear");
  const [actionType, setActionType] = useState<RecoveryActionType>("grounding");
  const [afterActionDrafts, setAfterActionDrafts] = useState<Record<string, string>>({});
  const [sleepMode, setSleepMode] = useState<"duration" | "bed_wake">("duration");
  const [sleepHours, setSleepHours] = useState("");
  const [sleepMinutes, setSleepMinutes] = useState("");
  const [bedTime, setBedTime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepDate, setSleepDate] = useState(localDate);
  const [sleepQuality, setSleepQuality] = useState("3");
  const [napMinutes, setNapMinutes] = useState("");
  const [screenHours, setScreenHours] = useState("");
  const [screenMinutes, setScreenMinutes] = useState("");
  const [screenLabel, setScreenLabel] = useState("");
  const [screenDate, setScreenDate] = useState(localDate);

  if (!ready) return <LoadingScreen label="Opening your private Recovery & Rhythm records…" />;

  const addStressor = () => {
    const id = actions.addRecoveryStressor({ title: stressorTitle, category: stressorCategory, intensity: numeric(stressorIntensity), concern: stressorConcern, controllability: stressorControl, localDate });
    if (!id) return;
    setStressorTitle(""); setStressorIntensity("5"); setStressorCategory(""); setStressorConcern(""); setStressorControl("unclear");
  };
  const addSleep = () => {
    const durationMinutes = numeric(sleepHours) * 60 + numeric(sleepMinutes);
    const id = actions.addSleepLog({
      localDate: sleepDate,
      entryMode: sleepMode,
      durationMinutes,
      bedTime,
      wakeTime,
      quality: sleepQuality ? numeric(sleepQuality) : null,
    });
    if (!id) return;
    setSleepHours(""); setSleepMinutes(""); setSleepQuality("3");
  };
  const addNap = () => {
    const id = actions.addNapLog({ localDate: sleepDate, durationMinutes: numeric(napMinutes) });
    if (id) setNapMinutes("");
  };
  const addScreen = () => {
    const id = actions.addScreenTimeLog({ localDate: screenDate, totalMinutes: numeric(screenHours) * 60 + numeric(screenMinutes), primaryLabel: screenLabel });
    if (!id) return;
    setScreenHours(""); setScreenMinutes(""); setScreenLabel("");
  };

  const remove = (label: string, onRemove: () => void) => Alert.alert(`Delete ${label}?`, "This removes only this private entry. Existing missions, reflections, and scores will not change.", [
    { text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: onRemove },
  ]);

  const tabs: { key: ViewKey; label: string }[] = [{ key: "stress", label: "Stress" }, { key: "sleep", label: "Sleep" }, { key: "screen", label: "Screen time" }];
  const listData: RecoveryListRecord[] = view === "stress"
    ? data.stressors
    : view === "sleep"
      ? [...data.sleepLogs, ...data.naps].sort((a, b) => b.localDate.localeCompare(a.localDate))
      : data.screenLogs;
  return <ScreenContainer className="px-4" containerClassName="bg-background" edges={["top", "bottom", "left", "right"]}>
    <FlatList<RecoveryListRecord>
      data={listData}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={<>
        <ScreenTitle eyebrow="Private · On device" title="Recovery & Rhythm" detail="Log → understand → act → recover. This is private self-reflection, not diagnosis." right={<IconAction icon="chart.xyaxis.line" label="Open Recovery history" onPress={() => router.push("/recovery-rhythm-history" as never)} />} />
        <CommandCard accent={colors.success} style={styles.summaryCard}>
          <Text style={[styles.summaryEyebrow, { color: colors.success }]}>THIS WEEK · RECORDED CONTEXT</Text>
          <View style={styles.summaryRow}>
            <Metric label="Stress" value={summary.averageStress === null ? "—" : `${summary.averageStress}/10`} />
            <Metric label="Sleep" value={formatMinutes(summary.averageSleepMinutes)} />
            <Metric label="Screen" value={formatMinutes(summary.averageScreenMinutes)} />
          </View>
          <Text style={[styles.summaryDetail, { color: colors.muted }]}>Only your manually recorded days are shown. These values do not change emotional forecast or wellbeing scores.</Text>
        </CommandCard>
        <View style={styles.tabRow}>{tabs.map((tab) => <Pressable key={tab.key} onPress={() => setView(tab.key)} style={[styles.tab, { borderColor: view === tab.key ? colors.primary : colors.border, backgroundColor: view === tab.key ? `${colors.primary}16` : colors.surface }]}><Text style={[styles.tabText, { color: view === tab.key ? colors.primary : colors.muted }]}>{tab.label}</Text></Pressable>)}</View>
        {view === "stress" ? <StressComposer colors={colors} title={stressorTitle} intensity={stressorIntensity} category={stressorCategory} concern={stressorConcern} control={stressorControl} onTitle={setStressorTitle} onIntensity={setStressorIntensity} onCategory={setStressorCategory} onConcern={setStressorConcern} onControl={setStressorControl} onAdd={addStressor} /> : null}
        {view === "sleep" ? <SleepComposer colors={colors} mode={sleepMode} onMode={setSleepMode} hours={sleepHours} minutes={sleepMinutes} bedTime={bedTime} wakeTime={wakeTime} date={sleepDate} quality={sleepQuality} napMinutes={napMinutes} onHours={setSleepHours} onMinutes={setSleepMinutes} onBed={setBedTime} onWake={setWakeTime} onDate={setSleepDate} onQuality={setSleepQuality} onNap={setNapMinutes} onAdd={addSleep} onAddNap={addNap} /> : null}
        {view === "screen" ? <ScreenComposer colors={colors} hours={screenHours} minutes={screenMinutes} label={screenLabel} date={screenDate} onHours={setScreenHours} onMinutes={setScreenMinutes} onLabel={setScreenLabel} onDate={setScreenDate} onAdd={addScreen} /> : null}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{view === "stress" ? "Your stressors" : view === "sleep" ? "Sleep and naps" : "Screen-time logs"}</Text>
      </>}
      renderItem={({ item }) => {
        if ("status" in item) {
          const stressor = item;
          const latestAction = data.actions.filter((entry) => entry.stressorId === stressor.id).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
          return <CommandCard accent={stressor.status === "resolved" ? colors.success : colors.warning} style={styles.recordCard}>
            <View style={styles.recordTop}><View style={styles.recordCopy}><Text style={[styles.recordTitle, { color: colors.foreground }]}>{stressor.title}</Text><Text style={[styles.recordDetail, { color: colors.muted }]}>{stressor.category || "Uncategorized"} · {stressor.localDate} · {stressor.intensity}/10</Text></View><IconAction icon="xmark" label={`Delete ${stressor.title}`} onPress={() => remove("stressor", () => actions.removeRecoveryStressor(stressor.id))} color={colors.error} /></View>
            <View style={styles.statusRow}>{STRESS_STATUSES.map((status) => <Pressable key={status} onPress={() => actions.updateRecoveryStressor(stressor.id, { status })} style={[styles.statusChip, { borderColor: stressor.status === status ? colors.primary : colors.border, backgroundColor: stressor.status === status ? `${colors.primary}18` : colors.background }]}><Text style={[styles.statusText, { color: stressor.status === status ? colors.primary : colors.muted }]}>{getRecoveryStressorLabel(status)}</Text></Pressable>)}</View>
            <Text style={[styles.recordDetail, { color: colors.muted }]}>Control: {stressor.controllability === "control" ? "I can control" : stressor.controllability === "influence" ? "I can influence" : stressor.controllability === "cannot_control_today" ? "I cannot control today" : "Not set"}</Text>
            {stressor.concern ? <Text style={[styles.recordDetail, { color: colors.muted }]}>{stressor.concern}</Text> : null}
            <View style={styles.actionTypes}>{(["grounding", "paced_breathing", "relaxation", "mindfulness", "acceptance", "problem_solving"] as RecoveryActionType[]).map((type) => <Pressable key={type} onPress={() => setActionType(type)} style={[styles.actionType, { borderColor: actionType === type ? colors.success : colors.border, backgroundColor: actionType === type ? `${colors.success}18` : colors.background }]}><Text style={[styles.statusText, { color: actionType === type ? colors.success : colors.muted }]}>{getRecoveryActionLabel(type)}</Text></Pressable>)}</View>
            <Pressable onPress={() => actions.addRecoveryAction(stressor.id, { type: actionType, beforeIntensity: stressor.intensity, afterIntensity: null, localDate })} style={[styles.actionButton, { borderColor: colors.success, backgroundColor: `${colors.success}12` }]}><Text style={[styles.actionText, { color: colors.success }]}>Record chosen action</Text></Pressable>
            {latestAction ? <><Text style={[styles.latestAction, { color: colors.muted }]}>Latest: {getRecoveryActionLabel(latestAction.type)} · before {latestAction.beforeIntensity ?? "—"}/10 · after {latestAction.afterIntensity ?? "—"}/10</Text>{latestAction.afterIntensity === null ? <View style={styles.afterActionRow}><TextInput value={afterActionDrafts[latestAction.id] ?? ""} onChangeText={(value) => setAfterActionDrafts((current) => ({ ...current, [latestAction.id]: value }))} placeholder="After 0–10" placeholderTextColor={colors.muted} keyboardType="numeric" style={[styles.afterActionInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]} /><Pressable onPress={() => { const value = numeric(afterActionDrafts[latestAction.id] ?? ""); if (value >= 0 && value <= 10) actions.updateRecoveryAction(latestAction.id, { afterIntensity: value }); }} style={[styles.secondaryButton, { borderColor: colors.success }]}><Text style={[styles.actionText, { color: colors.success }]}>Save after</Text></Pressable></View> : null}</> : null}
          </CommandCard>;
        }
        if (view === "sleep") {
          const sleep = item as SleepLog | NapLog;
          const isNap = "durationMinutes" in sleep && !("entryMode" in sleep);
          return <CommandCard accent={isNap ? colors.primary : colors.success} style={styles.recordCard}><View style={styles.recordTop}><View style={styles.recordCopy}><Text style={[styles.recordTitle, { color: colors.foreground }]}>{isNap ? "Nap" : "Overnight sleep"} · {formatMinutes(sleep.durationMinutes)}</Text><Text style={[styles.recordDetail, { color: colors.muted }]}>{sleep.localDate}{!isNap && "entryMode" in sleep ? ` · ${sleep.entryMode === "bed_wake" ? `${sleep.bedTime} → ${sleep.wakeTime}` : "duration entered"}` : ""}</Text></View><IconAction icon="xmark" label="Delete sleep record" onPress={() => remove(isNap ? "nap" : "sleep log", () => isNap ? actions.removeNapLog(sleep.id) : actions.removeSleepLog(sleep.id))} color={colors.error} /></View></CommandCard>;
        }
        const screen = item as ScreenTimeLog;
        return <CommandCard accent={colors.primary} style={styles.recordCard}><View style={styles.recordTop}><View style={styles.recordCopy}><Text style={[styles.recordTitle, { color: colors.foreground }]}>{formatMinutes(screen.totalMinutes)}</Text><Text style={[styles.recordDetail, { color: colors.muted }]}>{screen.localDate} · {screen.primaryLabel || "No primary app/site"}</Text></View><IconAction icon="xmark" label="Delete screen-time record" onPress={() => remove("screen-time log", () => actions.removeScreenTimeLog(screen.id))} color={colors.error} /></View></CommandCard>;
      }}
      ListEmptyComponent={<CommandCard accent={colors.primary} style={styles.empty}><Text style={[styles.emptyText, { color: colors.muted }]}>No {view === "screen" ? "screen-time" : view} records yet. Your entries stay private and local.</Text></CommandCard>}
    />
  </ScreenContainer>;
}

function Metric({ label, value }: { label: string; value: string }) { const colors = useColors(); return <View style={styles.metric}><Text style={[styles.metricLabel, { color: colors.muted }]}>{label.toUpperCase()}</Text><Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text></View>; }

function Field({ label, value, onChangeText, placeholder, keyboardType = "default", multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: "default" | "numeric"; multiline?: boolean }) {
  const colors = useColors(); return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.muted }]}>{label.toUpperCase()}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} keyboardType={keyboardType} multiline={multiline} style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }, multiline && styles.multiline]} /></View>;
}

function StressComposer(props: { colors: ReturnType<typeof useColors>; title: string; intensity: string; category: string; concern: string; control: "control" | "influence" | "cannot_control_today" | "unclear"; onTitle: (v: string) => void; onIntensity: (v: string) => void; onCategory: (v: string) => void; onConcern: (v: string) => void; onControl: (value: "control" | "influence" | "cannot_control_today" | "unclear") => void; onAdd: () => void }) {
  const { colors } = props; const controls: Array<{ value: typeof props.control; label: string }> = [{ value: "control", label: "I control" }, { value: "influence", label: "I influence" }, { value: "cannot_control_today", label: "Not today" }]; return <CommandCard accent={colors.warning} style={styles.composer}><Text style={[styles.composerTitle, { color: colors.foreground }]}>Stress → Understand → Act</Text><Text style={[styles.composerDetail, { color: colors.muted }]}>Start small. You can refine status and record a response later.</Text><Field label="What is happening?" value={props.title} onChangeText={props.onTitle} placeholder="Example: Exam workload" /><View style={styles.twoFields}><View style={styles.flexField}><Field label="Intensity 0–10" value={props.intensity} onChangeText={props.onIntensity} placeholder="5" keyboardType="numeric" /></View><View style={styles.flexField}><Field label="Category" value={props.category} onChangeText={props.onCategory} placeholder="Study, family…" /></View></View><Field label="What worries you? Optional" value={props.concern} onChangeText={props.onConcern} placeholder="Write a short private note" multiline /><Text style={[styles.fieldLabel, { color: colors.muted }]}>WHAT CAN I DO?</Text><View style={styles.statusRow}>{controls.map((option) => <Pressable key={option.value} onPress={() => props.onControl(option.value)} style={[styles.statusChip, { borderColor: props.control === option.value ? colors.warning : colors.border, backgroundColor: props.control === option.value ? `${colors.warning}18` : colors.background }]}><Text style={[styles.statusText, { color: props.control === option.value ? colors.warning : colors.muted }]}>{option.label}</Text></Pressable>)}</View><Pressable onPress={props.onAdd} style={[styles.primaryButton, { backgroundColor: colors.warning }]}><Text style={[styles.primaryButtonText, { color: colors.background }]}>Add private stressor</Text></Pressable></CommandCard>;
}

function SleepComposer(props: { colors: ReturnType<typeof useColors>; mode: "duration" | "bed_wake"; onMode: (v: "duration" | "bed_wake") => void; hours: string; minutes: string; bedTime: string; wakeTime: string; date: string; quality: string; napMinutes: string; onHours: (v: string) => void; onMinutes: (v: string) => void; onBed: (v: string) => void; onWake: (v: string) => void; onDate: (v: string) => void; onQuality: (v: string) => void; onNap: (v: string) => void; onAdd: () => void; onAddNap: () => void }) {
  const { colors } = props; const calculated = getSleepDurationMinutesFromBedWake(props.bedTime, props.wakeTime); return <CommandCard accent={colors.success} style={styles.composer}><Text style={[styles.composerTitle, { color: colors.foreground }]}>Overnight sleep</Text><Text style={[styles.composerDetail, { color: colors.muted }]}>Morning entries belong to the wake-up day. You can change the date for an older entry.</Text><View style={styles.tabRow}><Pressable onPress={() => props.onMode("duration")} style={[styles.tab, { borderColor: props.mode === "duration" ? colors.success : colors.border }]}><Text style={[styles.statusText, { color: props.mode === "duration" ? colors.success : colors.muted }]}>Enter duration</Text></Pressable><Pressable onPress={() => props.onMode("bed_wake")} style={[styles.tab, { borderColor: props.mode === "bed_wake" ? colors.success : colors.border }]}><Text style={[styles.statusText, { color: props.mode === "bed_wake" ? colors.success : colors.muted }]}>Bed / wake</Text></Pressable></View>{props.mode === "duration" ? <View style={styles.twoFields}><View style={styles.flexField}><Field label="Hours" value={props.hours} onChangeText={props.onHours} placeholder="7" keyboardType="numeric" /></View><View style={styles.flexField}><Field label="Minutes" value={props.minutes} onChangeText={props.onMinutes} placeholder="30" keyboardType="numeric" /></View></View> : <><View style={styles.twoFields}><View style={styles.flexField}><Field label="Bed HH:MM" value={props.bedTime} onChangeText={props.onBed} placeholder="23:00" /></View><View style={styles.flexField}><Field label="Wake HH:MM" value={props.wakeTime} onChangeText={props.onWake} placeholder="07:00" /></View></View><Text style={[styles.calculated, { color: colors.success }]}>Calculated: {formatMinutes(calculated)}</Text></>}<View style={styles.twoFields}><View style={styles.flexField}><Field label="Wake date" value={props.date} onChangeText={props.onDate} placeholder="YYYY-MM-DD" /></View><View style={styles.flexField}><Field label="Quality 1–5" value={props.quality} onChangeText={props.onQuality} placeholder="3" keyboardType="numeric" /></View></View><Pressable onPress={props.onAdd} style={[styles.primaryButton, { backgroundColor: colors.success }]}><Text style={[styles.primaryButtonText, { color: colors.background }]}>Save sleep</Text></Pressable><View style={[styles.napRow, { borderColor: colors.border }]}><View style={styles.flexField}><Field label="Optional nap minutes" value={props.napMinutes} onChangeText={props.onNap} placeholder="20" keyboardType="numeric" /></View><Pressable onPress={props.onAddNap} style={[styles.secondaryButton, { borderColor: colors.success }]}><Text style={[styles.actionText, { color: colors.success }]}>Add nap</Text></Pressable></View></CommandCard>;
}

function ScreenComposer(props: { colors: ReturnType<typeof useColors>; hours: string; minutes: string; label: string; date: string; onHours: (v: string) => void; onMinutes: (v: string) => void; onLabel: (v: string) => void; onDate: (v: string) => void; onAdd: () => void }) { const { colors } = props; return <CommandCard accent={colors.primary} style={styles.composer}><Text style={[styles.composerTitle, { color: colors.foreground }]}>Manual screen time</Text><Text style={[styles.composerDetail, { color: colors.muted }]}>Enter what you choose to track. This app never reads device usage, apps, or browsing history.</Text><View style={styles.twoFields}><View style={styles.flexField}><Field label="Hours" value={props.hours} onChangeText={props.onHours} placeholder="3" keyboardType="numeric" /></View><View style={styles.flexField}><Field label="Minutes" value={props.minutes} onChangeText={props.onMinutes} placeholder="15" keyboardType="numeric" /></View></View><Field label="Primary app, site, or category" value={props.label} onChangeText={props.onLabel} placeholder="Example: YouTube, study, social" /><Field label="Date" value={props.date} onChangeText={props.onDate} placeholder="YYYY-MM-DD" /><Pressable onPress={props.onAdd} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={[styles.primaryButtonText, { color: colors.background }]}>Save screen time</Text></Pressable></CommandCard>; }

const styles = StyleSheet.create({
  content: { gap: 13, paddingTop: 12, paddingBottom: 32 }, summaryCard: { gap: 8 }, summaryEyebrow: { fontSize: 9, fontWeight: "900", letterSpacing: 0.9 }, summaryRow: { flexDirection: "row", gap: 8 }, metric: { flex: 1, gap: 2 }, metricLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 0.6 }, metricValue: { fontSize: 15, fontWeight: "900" }, summaryDetail: { fontSize: 10, lineHeight: 15, fontWeight: "600" }, tabRow: { flexDirection: "row", gap: 7 }, tab: { flex: 1, minHeight: 37, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 }, tabText: { fontSize: 11, fontWeight: "900" }, composer: { gap: 9 }, composerTitle: { fontSize: 17, lineHeight: 22, fontWeight: "900" }, composerDetail: { fontSize: 11, lineHeight: 16, fontWeight: "600" }, field: { gap: 3 }, fieldLabel: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.7 }, input: { borderWidth: StyleSheet.hairlineWidth, minHeight: 42, borderRadius: 11, paddingHorizontal: 11, fontSize: 13, fontWeight: "700" }, multiline: { minHeight: 72, paddingTop: 10, textAlignVertical: "top" }, twoFields: { flexDirection: "row", gap: 8 }, flexField: { flex: 1 }, primaryButton: { minHeight: 43, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 }, primaryButtonText: { fontSize: 12, fontWeight: "900" }, secondaryButton: { alignSelf: "flex-end", minHeight: 42, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, borderRadius: 11, alignItems: "center", justifyContent: "center" }, actionText: { fontSize: 10, fontWeight: "900" }, napRow: { flexDirection: "row", gap: 8, alignItems: "flex-end", borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 9 }, calculated: { fontSize: 11, fontWeight: "900" }, sectionTitle: { fontSize: 17, lineHeight: 22, fontWeight: "900", marginTop: 2 }, recordCard: { gap: 8 }, recordTop: { flexDirection: "row", justifyContent: "space-between", gap: 9, alignItems: "flex-start" }, recordCopy: { flex: 1, gap: 2 }, recordTitle: { fontSize: 14, lineHeight: 19, fontWeight: "900" }, recordDetail: { fontSize: 10, lineHeight: 15, fontWeight: "600" }, statusRow: { flexDirection: "row", gap: 5, flexWrap: "wrap" }, statusChip: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 9, paddingHorizontal: 7, paddingVertical: 5 }, statusText: { fontSize: 9, fontWeight: "900" }, actionTypes: { flexDirection: "row", gap: 5, flexWrap: "wrap" }, actionType: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 9, paddingHorizontal: 7, paddingVertical: 5 }, actionButton: { minHeight: 36, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" }, latestAction: { fontSize: 10, lineHeight: 14, fontWeight: "700" }, afterActionRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 }, afterActionInput: { flex: 1, minHeight: 42, borderWidth: StyleSheet.hairlineWidth, borderRadius: 11, paddingHorizontal: 11, fontSize: 12, fontWeight: "700" }, empty: { paddingVertical: 20 }, emptyText: { fontSize: 12, lineHeight: 18, fontWeight: "700", textAlign: "center" },
});
