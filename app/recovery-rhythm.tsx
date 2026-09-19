import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { CommandCard, IconAction, LoadingScreen, ScreenTitle } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useKeyboardSafeFocus } from "@/hooks/use-keyboard-safe-focus";
import {
  getSleepDurationMinutesFromBedWake,
  shallowEqual,
  toLocalDate,
  useFocusCommandActions,
  useFocusCommandReady,
  useFocusCommandSelector,
  type NapLog,
  type IllnessContextRecord,
  type RecoveryActionType,
  type RecoveryStressorStatus,
  type ScreenTimeLog,
  type SleepLog,
} from "@/lib/focus-command";
import { formatMinutes, getPersonalSleepScore, getRecoveryActionLabel, getRecoveryStressorLabel, getRecoverySummary } from "@/lib/recovery-rhythm";

type ViewKey = "stress" | "sleep" | "screen" | "illness";
type RecoveryListRecord = SleepLog | NapLog | ScreenTimeLog | IllnessContextRecord | { id: string; localDate: string; title: string; status: RecoveryStressorStatus; intensity: number; category: string; concern: string; controllability: "control" | "influence" | "cannot_control_today" | "unclear" };
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
    illnessContexts: state.illnessContextRecords ?? [],
  }), shallowEqual);
  const actions = useFocusCommandActions();
  const { scrollRef, onInputFocus } = useKeyboardSafeFocus<FlatList<RecoveryListRecord>>();
  const [view, setView] = useState<ViewKey>("stress");
  const [savedKind, setSavedKind] = useState<ViewKey | "nap" | null>(null);
  const saveLockRef = useRef(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const [sleepDreams, setSleepDreams] = useState<"none_remembered" | "some_remembered" | "vivid_or_heavy" | null>(null);
  const [awakeningCount, setAwakeningCount] = useState("");
  const [restedRating, setRestedRating] = useState("3");
  const [napMinutes, setNapMinutes] = useState("");
  const [screenHours, setScreenHours] = useState("");
  const [screenMinutes, setScreenMinutes] = useState("");
  const [screenLabel, setScreenLabel] = useState("");
  const [screenDate, setScreenDate] = useState(localDate);
  const [illnessEditId, setIllnessEditId] = useState<string | null>(null);
  const [illnessStartDate, setIllnessStartDate] = useState(localDate);
  const [illnessEndDate, setIllnessEndDate] = useState("");
  const [illnessSeverity, setIllnessSeverity] = useState<"mild" | "moderate" | "severe" | null>(null);
  const [illnessSymptoms, setIllnessSymptoms] = useState(true);
  const [illnessFatigue, setIllnessFatigue] = useState(false);
  const [illnessSleepDisrupted, setIllnessSleepDisrupted] = useState(false);
  const [illnessStressElevated, setIllnessStressElevated] = useState(false);
  const [illnessNote, setIllnessNote] = useState("");

  useEffect(() => () => {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
  }, []);

  if (!ready) return <LoadingScreen label="Opening your private Recovery & Rhythm records…" />;

  const acknowledgeSave = (kind: ViewKey | "nap") => {
    setSavedKind(kind);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSavedKind((current) => current === kind ? null : current), 1_600);
  };
  const canSave = () => {
    if (saveLockRef.current) return false;
    saveLockRef.current = true;
    requestAnimationFrame(() => { saveLockRef.current = false; });
    return true;
  };
  const addStressor = () => {
    if (!canSave()) return;
    const id = actions.addRecoveryStressor({ title: stressorTitle, category: stressorCategory, intensity: numeric(stressorIntensity), concern: stressorConcern, controllability: stressorControl, localDate });
    if (!id) return;
    setStressorTitle(""); setStressorIntensity("5"); setStressorCategory(""); setStressorConcern(""); setStressorControl("unclear");
    acknowledgeSave("stress");
  };
  const addSleep = () => {
    if (!canSave()) return;
    const durationMinutes = numeric(sleepHours) * 60 + numeric(sleepMinutes);
    const id = actions.addSleepLog({
      localDate: sleepDate,
      entryMode: sleepMode,
      durationMinutes,
      bedTime,
      wakeTime,
      quality: sleepQuality ? numeric(sleepQuality) : null,
      dreams: sleepDreams,
      awakeningCount: awakeningCount === "" ? null : numeric(awakeningCount),
      restedRating: restedRating ? numeric(restedRating) : null,
    });
    if (!id) return;
    setSleepHours(""); setSleepMinutes(""); setSleepQuality("3"); setSleepDreams(null); setAwakeningCount(""); setRestedRating("3");
    acknowledgeSave("sleep");
  };
  const addNap = () => {
    if (!canSave()) return;
    const id = actions.addNapLog({ localDate: sleepDate, durationMinutes: numeric(napMinutes) });
    if (id) { setNapMinutes(""); acknowledgeSave("nap"); }
  };
  const addScreen = () => {
    if (!canSave()) return;
    const id = actions.addScreenTimeLog({ localDate: screenDate, totalMinutes: numeric(screenHours) * 60 + numeric(screenMinutes), primaryLabel: screenLabel });
    if (!id) return;
    setScreenHours(""); setScreenMinutes(""); setScreenLabel("");
    acknowledgeSave("screen");
  };
  const resetIllnessDraft = () => {
    setIllnessEditId(null); setIllnessStartDate(localDate); setIllnessEndDate(""); setIllnessSeverity(null); setIllnessSymptoms(true); setIllnessFatigue(false); setIllnessSleepDisrupted(false); setIllnessStressElevated(false); setIllnessNote("");
  };
  const saveIllnessContext = () => {
    if (!canSave()) return;
    const draft = { startDate: illnessStartDate, endDate: illnessEndDate || null, symptomsReported: illnessSymptoms, severity: illnessSeverity, fatigueReported: illnessFatigue, sleepDisrupted: illnessSleepDisrupted, stressElevated: illnessStressElevated, note: illnessNote };
    if (illnessEditId) {
      actions.updateIllnessContextRecord(illnessEditId, draft);
      resetIllnessDraft(); acknowledgeSave("illness");
      return;
    }
    if (!actions.addIllnessContextRecord(draft)) return;
    resetIllnessDraft(); acknowledgeSave("illness");
  };
  const editIllnessContext = (record: IllnessContextRecord) => {
    setIllnessEditId(record.id); setIllnessStartDate(record.startDate); setIllnessEndDate(record.endDate ?? ""); setIllnessSeverity(record.severity); setIllnessSymptoms(record.symptomsReported); setIllnessFatigue(record.fatigueReported); setIllnessSleepDisrupted(record.sleepDisrupted); setIllnessStressElevated(record.stressElevated); setIllnessNote(record.note); setView("illness");
  };

  const remove = (label: string, onRemove: () => void) => Alert.alert(`Delete ${label}?`, "This removes only this private entry. Existing missions, reflections, and scores will not change.", [
    { text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: onRemove },
  ]);

  const tabs: { key: ViewKey; label: string }[] = [{ key: "stress", label: "Stress" }, { key: "sleep", label: "Sleep" }, { key: "screen", label: "Screen time" }, { key: "illness", label: "Illness" }];
  const listData: RecoveryListRecord[] = view === "stress"
    ? data.stressors
    : view === "sleep"
      ? [...data.sleepLogs, ...data.naps].sort((a, b) => b.localDate.localeCompare(a.localDate))
      : view === "screen" ? data.screenLogs : [...data.illnessContexts].sort((a, b) => b.startDate.localeCompare(a.startDate));
  return <ScreenContainer className="px-4" containerClassName="bg-background" edges={["top", "bottom", "left", "right"]}>
    <FlatList<RecoveryListRecord>
      ref={scrollRef}
      data={listData}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<>
        <ScreenTitle eyebrow="Private · On device" title="Recovery & Rhythm" detail="Log → understand → act → recover. This is private self-reflection, not diagnosis." right={<IconAction icon="chart.xyaxis.line" label="Open Recovery history" onPress={() => router.push("/recovery-rhythm-history" as never)} />} />
        <CommandCard accent={colors.success} style={styles.summaryCard}>
          <Text style={[styles.summaryEyebrow, { color: colors.success }]}>THIS WEEK · RECORDED CONTEXT</Text>
          <View style={styles.summaryRow}>
            <Metric label="Stress" value={summary.averageStress === null ? "—" : `${summary.averageStress}/10`} />
            <Metric label="Sleep" value={formatMinutes(summary.averageSleepMinutes)} />
            <Metric label="Screen" value={formatMinutes(summary.averageScreenMinutes)} />
          </View>
          <Text style={[styles.summaryDetail, { color: colors.muted }]}>Only your manually recorded days are shown. Sleep score average: {summary.averageSleepScore === null ? "—" : `${summary.averageSleepScore}/100`} from {summary.scoredSleepCount} scored night{summary.scoredSleepCount === 1 ? "" : "s"}. These values do not change emotional forecast or wellbeing scores.</Text>
        </CommandCard>
        <View style={styles.tabRow}>{tabs.map((tab) => <Pressable key={tab.key} onPress={() => setView(tab.key)} style={[styles.tab, { borderColor: view === tab.key ? colors.primary : colors.border, backgroundColor: view === tab.key ? `${colors.primary}16` : colors.surface }]}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76} style={[styles.tabText, { color: view === tab.key ? colors.primary : colors.muted }]}>{tab.label}</Text></Pressable>)}</View>
        {view === "stress" ? <StressComposer colors={colors} title={stressorTitle} intensity={stressorIntensity} category={stressorCategory} concern={stressorConcern} control={stressorControl} onTitle={setStressorTitle} onIntensity={setStressorIntensity} onCategory={setStressorCategory} onConcern={setStressorConcern} onControl={setStressorControl} onAdd={addStressor} onInputFocus={onInputFocus} saved={savedKind === "stress"} /> : null}
        {view === "sleep" ? <SleepComposer colors={colors} mode={sleepMode} onMode={setSleepMode} hours={sleepHours} minutes={sleepMinutes} bedTime={bedTime} wakeTime={wakeTime} date={sleepDate} quality={sleepQuality} dreams={sleepDreams} awakeningCount={awakeningCount} restedRating={restedRating} napMinutes={napMinutes} onHours={setSleepHours} onMinutes={setSleepMinutes} onBed={setBedTime} onWake={setWakeTime} onDate={setSleepDate} onQuality={setSleepQuality} onDreams={setSleepDreams} onAwakeningCount={setAwakeningCount} onRestedRating={setRestedRating} onNap={setNapMinutes} onAdd={addSleep} onAddNap={addNap} onInputFocus={onInputFocus} saved={savedKind === "sleep"} napSaved={savedKind === "nap"} /> : null}
        {view === "screen" ? <ScreenComposer colors={colors} hours={screenHours} minutes={screenMinutes} label={screenLabel} date={screenDate} onHours={setScreenHours} onMinutes={setScreenMinutes} onLabel={setScreenLabel} onDate={setScreenDate} onAdd={addScreen} onInputFocus={onInputFocus} saved={savedKind === "screen"} /> : null}
        {view === "illness" ? <IllnessContextComposer colors={colors} editing={illnessEditId !== null} startDate={illnessStartDate} endDate={illnessEndDate} severity={illnessSeverity} symptomsReported={illnessSymptoms} fatigueReported={illnessFatigue} sleepDisrupted={illnessSleepDisrupted} stressElevated={illnessStressElevated} note={illnessNote} onStartDate={setIllnessStartDate} onEndDate={setIllnessEndDate} onSeverity={setIllnessSeverity} onSymptomsReported={setIllnessSymptoms} onFatigueReported={setIllnessFatigue} onSleepDisrupted={setIllnessSleepDisrupted} onStressElevated={setIllnessStressElevated} onNote={setIllnessNote} onSave={saveIllnessContext} onCancel={resetIllnessDraft} onInputFocus={onInputFocus} saved={savedKind === "illness"} /> : null}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{view === "stress" ? "Your stressors" : view === "sleep" ? "Sleep and naps" : view === "screen" ? "Screen-time logs" : "Your private context records"}</Text>
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
            {latestAction ? <><Text style={[styles.latestAction, { color: colors.muted }]}>Latest: {getRecoveryActionLabel(latestAction.type)} · before {latestAction.beforeIntensity ?? "—"}/10 · after {latestAction.afterIntensity ?? "—"}/10</Text>{latestAction.afterIntensity === null ? <View style={styles.afterActionRow}><TextInput value={afterActionDrafts[latestAction.id] ?? ""} onChangeText={(value) => setAfterActionDrafts((current) => ({ ...current, [latestAction.id]: value }))} onFocus={onInputFocus} placeholder="After 0–10" placeholderTextColor={colors.muted} keyboardType="numeric" style={[styles.afterActionInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]} /><Pressable onPress={() => { const value = numeric(afterActionDrafts[latestAction.id] ?? ""); if (value >= 0 && value <= 10) actions.updateRecoveryAction(latestAction.id, { afterIntensity: value }); }} style={[styles.secondaryButton, { borderColor: colors.success }]}><Text style={[styles.actionText, { color: colors.success }]}>Save after</Text></Pressable></View> : null}</> : null}
          </CommandCard>;
        }
        if (view === "sleep") {
          const sleep = item as SleepLog | NapLog;
          const isNap = "durationMinutes" in sleep && !("entryMode" in sleep);
          const score = !isNap ? getPersonalSleepScore(sleep as SleepLog) : null; return <CommandCard accent={isNap ? colors.primary : colors.success} style={styles.recordCard}><View style={styles.recordTop}><View style={styles.recordCopy}><Text style={[styles.recordTitle, { color: colors.foreground }]}>{isNap ? "Nap" : "Overnight sleep"} · {formatMinutes(sleep.durationMinutes)}</Text><Text style={[styles.recordDetail, { color: colors.muted }]}>{sleep.localDate}{!isNap && "entryMode" in sleep ? ` · ${sleep.entryMode === "bed_wake" ? `${sleep.bedTime} → ${sleep.wakeTime}` : "duration entered"}` : ""}</Text></View><IconAction icon="xmark" label="Delete sleep record" onPress={() => remove(isNap ? "nap" : "sleep log", () => isNap ? actions.removeNapLog(sleep.id) : actions.removeSleepLog(sleep.id))} color={colors.error} /></View>{score ? <><Text style={[styles.recordDetail, { color: colors.success }]}>Personal Sleep Score: {score.score}/100 · {score.completeness}% of signals recorded</Text><Text style={[styles.recordDetail, { color: colors.muted }]}>Continuity: {score.awakeningCount === null ? "not recorded" : `${score.awakeningCount} awakening${score.awakeningCount === 1 ? "" : "s"}`} · Rested: {(sleep as SleepLog).restedRating ?? "not recorded"}/5{score.dreamLabel ? ` · Dreams: ${score.dreamLabel}` : ""}</Text></> : null}</CommandCard>;
        }
        if (view === "illness") {
          const record = item as IllnessContextRecord;
          const tags = [record.symptomsReported ? "Symptoms reported" : null, record.severity ? `${record.severity[0].toUpperCase()}${record.severity.slice(1)} self-rating` : null, record.fatigueReported ? "Fatigue reported" : null, record.sleepDisrupted ? "Sleep disrupted" : null, record.stressElevated ? "Stress elevated" : null].filter(Boolean);
          return <CommandCard accent={record.endDate ? colors.primary : colors.warning} style={styles.recordCard}><View style={styles.recordTop}><View style={styles.recordCopy}><Text style={[styles.recordTitle, { color: colors.foreground }]}>{record.endDate ? `${record.startDate} → ${record.endDate}` : `${record.startDate} · ongoing`}</Text><Text style={[styles.recordDetail, { color: colors.muted }]}>{tags.length ? tags.join(" · ") : "Context recorded without optional details"}</Text></View><IconAction icon="xmark" label="Delete illness context record" onPress={() => remove("illness context", () => actions.removeIllnessContextRecord(record.id))} color={colors.error} /></View>{record.note ? <Text style={[styles.recordDetail, { color: colors.muted }]}>{record.note}</Text> : null}<View style={styles.recordActions}><Pressable onPress={() => editIllnessContext(record)} style={[styles.smallAction, { borderColor: colors.primary }]}><Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text></Pressable><Pressable onPress={() => actions.updateIllnessContextRecord(record.id, { endDate: record.endDate ? null : localDate })} style={[styles.smallAction, { borderColor: record.endDate ? colors.warning : colors.success }]}><Text style={[styles.actionText, { color: record.endDate ? colors.warning : colors.success }]}>{record.endDate ? "Reopen" : "End today"}</Text></Pressable></View></CommandCard>;
        }
        const screen = item as ScreenTimeLog;
        return <CommandCard accent={colors.primary} style={styles.recordCard}><View style={styles.recordTop}><View style={styles.recordCopy}><Text style={[styles.recordTitle, { color: colors.foreground }]}>{formatMinutes(screen.totalMinutes)}</Text><Text style={[styles.recordDetail, { color: colors.muted }]}>{screen.localDate} · {screen.primaryLabel || "No primary app/site"}</Text></View><IconAction icon="xmark" label="Delete screen-time record" onPress={() => remove("screen-time log", () => actions.removeScreenTimeLog(screen.id))} color={colors.error} /></View></CommandCard>;
      }}
      ListEmptyComponent={<CommandCard accent={colors.primary} style={styles.empty}><Text style={[styles.emptyText, { color: colors.muted }]}>No {view === "screen" ? "screen-time" : view === "illness" ? "illness-context" : view} records yet. Your entries stay private and local.</Text></CommandCard>}
    />
  </ScreenContainer>;
}

function Metric({ label, value }: { label: string; value: string }) { const colors = useColors(); return <View style={styles.metric}><Text style={[styles.metricLabel, { color: colors.muted }]}>{label.toUpperCase()}</Text><Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text></View>; }

function Field({ label, value, onChangeText, placeholder, keyboardType = "default", multiline = false, onInputFocus }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: "default" | "numeric"; multiline?: boolean; onInputFocus?: NonNullable<TextInputProps["onFocus"]> }) {
  const colors = useColors(); return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.muted }]}>{label.toUpperCase()}</Text><TextInput value={value} onChangeText={onChangeText} onFocus={onInputFocus} placeholder={placeholder} placeholderTextColor={colors.muted} keyboardType={keyboardType} multiline={multiline} style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }, multiline && styles.multiline]} /></View>;
}

type InputFocusHandler = NonNullable<TextInputProps["onFocus"]>;

function SaveStatus({ visible, label, color }: { visible: boolean; label: string; color: string }) {
  if (!visible) return null;
  return <Text accessibilityLiveRegion="polite" style={[styles.savedNotice, { color }]}>✓ {label} saved locally</Text>;
}

function StressComposer(props: { colors: ReturnType<typeof useColors>; title: string; intensity: string; category: string; concern: string; control: "control" | "influence" | "cannot_control_today" | "unclear"; onTitle: (v: string) => void; onIntensity: (v: string) => void; onCategory: (v: string) => void; onConcern: (v: string) => void; onControl: (value: "control" | "influence" | "cannot_control_today" | "unclear") => void; onAdd: () => void; onInputFocus: InputFocusHandler; saved: boolean }) {
  const { colors } = props;
  const controls: { value: typeof props.control; label: string }[] = [
    { value: "control", label: "I control" },
    { value: "influence", label: "I influence" },
    { value: "cannot_control_today", label: "Not today" },
  ];
  return <CommandCard accent={colors.warning} style={styles.composer}>
    <Text style={[styles.composerTitle, { color: colors.foreground }]}>Stress → Understand → Act</Text>
    <Text style={[styles.composerDetail, { color: colors.muted }]}>Start small. You can refine status and record a response later.</Text>
    <Field label="What is happening?" value={props.title} onChangeText={props.onTitle} onInputFocus={props.onInputFocus} placeholder="Example: Exam workload" />
    <View style={styles.twoFields}>
      <View style={styles.flexField}><Field label="Intensity 0–10" value={props.intensity} onChangeText={props.onIntensity} onInputFocus={props.onInputFocus} placeholder="5" keyboardType="numeric" /></View>
      <View style={styles.flexField}><Field label="Category" value={props.category} onChangeText={props.onCategory} onInputFocus={props.onInputFocus} placeholder="Study, family…" /></View>
    </View>
    <Field label="What worries you? Optional" value={props.concern} onChangeText={props.onConcern} onInputFocus={props.onInputFocus} placeholder="Write a short private note" multiline />
    <Text style={[styles.fieldLabel, { color: colors.muted }]}>WHAT CAN I DO?</Text>
    <View style={styles.statusRow}>{controls.map((option) => <Pressable key={option.value} onPress={() => props.onControl(option.value)} style={({ pressed }) => [styles.statusChip, { borderColor: props.control === option.value ? colors.warning : colors.border, backgroundColor: props.control === option.value ? `${colors.warning}18` : colors.background, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.statusText, { color: props.control === option.value ? colors.warning : colors.muted }]}>{option.label}</Text></Pressable>)}</View>
    <Pressable onPress={props.onAdd} accessibilityRole="button" accessibilityLabel="Add private stressor" style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.warning, opacity: pressed ? 0.82 : 1 }]}><Text style={[styles.primaryButtonText, { color: colors.background }]}>{props.saved ? "Stressor saved ✓" : "Add private stressor"}</Text></Pressable>
    <SaveStatus visible={props.saved} label="Stressor" color={colors.success} />
  </CommandCard>;
}

function SleepComposer(props: { colors: ReturnType<typeof useColors>; mode: "duration" | "bed_wake"; onMode: (v: "duration" | "bed_wake") => void; hours: string; minutes: string; bedTime: string; wakeTime: string; date: string; quality: string; dreams: "none_remembered" | "some_remembered" | "vivid_or_heavy" | null; awakeningCount: string; restedRating: string; napMinutes: string; onHours: (v: string) => void; onMinutes: (v: string) => void; onBed: (v: string) => void; onWake: (v: string) => void; onDate: (v: string) => void; onQuality: (v: string) => void; onDreams: (v: "none_remembered" | "some_remembered" | "vivid_or_heavy" | null) => void; onAwakeningCount: (v: string) => void; onRestedRating: (v: string) => void; onNap: (v: string) => void; onAdd: () => void; onAddNap: () => void; onInputFocus: InputFocusHandler; saved: boolean; napSaved: boolean }) {
  const { colors } = props;
  const calculated = getSleepDurationMinutesFromBedWake(props.bedTime, props.wakeTime);
  return <CommandCard accent={colors.success} style={styles.composer}>
    <Text style={[styles.composerTitle, { color: colors.foreground }]}>Overnight sleep</Text>
    <Text style={[styles.composerDetail, { color: colors.muted }]}>Morning entries belong to the wake-up day. You can change the date for an older entry.</Text>
    <View style={styles.tabRow}>
      <Pressable onPress={() => props.onMode("duration")} style={({ pressed }) => [styles.tab, { borderColor: props.mode === "duration" ? colors.success : colors.border, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.statusText, { color: props.mode === "duration" ? colors.success : colors.muted }]}>Enter duration</Text></Pressable>
      <Pressable onPress={() => props.onMode("bed_wake")} style={({ pressed }) => [styles.tab, { borderColor: props.mode === "bed_wake" ? colors.success : colors.border, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.statusText, { color: props.mode === "bed_wake" ? colors.success : colors.muted }]}>Bed / wake</Text></Pressable>
    </View>
    {props.mode === "duration" ? <View style={styles.twoFields}>
      <View style={styles.flexField}><Field label="Hours" value={props.hours} onChangeText={props.onHours} onInputFocus={props.onInputFocus} placeholder="7" keyboardType="numeric" /></View>
      <View style={styles.flexField}><Field label="Minutes" value={props.minutes} onChangeText={props.onMinutes} onInputFocus={props.onInputFocus} placeholder="30" keyboardType="numeric" /></View>
    </View> : <>
      <View style={styles.twoFields}>
        <View style={styles.flexField}><Field label="Bed HH:MM" value={props.bedTime} onChangeText={props.onBed} onInputFocus={props.onInputFocus} placeholder="23:00" /></View>
        <View style={styles.flexField}><Field label="Wake HH:MM" value={props.wakeTime} onChangeText={props.onWake} onInputFocus={props.onInputFocus} placeholder="07:00" /></View>
      </View>
      <Text style={[styles.calculated, { color: colors.success }]}>Calculated: {formatMinutes(calculated)}</Text>
    </>}
    <View style={styles.twoFields}>
      <View style={styles.flexField}><Field label="Wake date" value={props.date} onChangeText={props.onDate} onInputFocus={props.onInputFocus} placeholder="YYYY-MM-DD" /></View>
      <View style={styles.flexField}><Field label="Quality 1–5" value={props.quality} onChangeText={props.onQuality} onInputFocus={props.onInputFocus} placeholder="3" keyboardType="numeric" /></View>
    </View>
    <Text style={[styles.fieldLabel, { color: colors.muted }]}>DREAM EXPERIENCE · CONTEXT ONLY</Text>
    <View style={styles.statusRow}>{([{ value: "none_remembered", label: "Not remembered" }, { value: "some_remembered", label: "A bit dreamy" }, { value: "vivid_or_heavy", label: "Vivid / heavy" }] as const).map((option) => <Pressable key={option.value} onPress={() => props.onDreams(props.dreams === option.value ? null : option.value)} style={({ pressed }) => [styles.statusChip, { borderColor: props.dreams === option.value ? colors.success : colors.border, backgroundColor: props.dreams === option.value ? `${colors.success}18` : colors.background, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.statusText, { color: props.dreams === option.value ? colors.success : colors.muted }]}>{option.label}</Text></Pressable>)}</View>
    <View style={styles.twoFields}>
      <View style={styles.flexField}><Field label="Night awakenings · exact count" value={props.awakeningCount} onChangeText={props.onAwakeningCount} onInputFocus={props.onInputFocus} placeholder="0" keyboardType="numeric" /></View>
      <View style={styles.flexField}><Field label="Rested feeling 1–5" value={props.restedRating} onChangeText={props.onRestedRating} onInputFocus={props.onInputFocus} placeholder="3" keyboardType="numeric" /></View>
    </View>
    <Text style={[styles.composerDetail, { color: colors.muted }]}>Personal Sleep Score: duration uses the 7-hour adult reference; continuity uses awakenings; quality and rested feeling use your ratings. Dream experience is context only. This index is evidence-informed, not clinically validated.</Text>
    <Pressable onPress={props.onAdd} accessibilityRole="button" accessibilityLabel="Save sleep" style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.success, opacity: pressed ? 0.82 : 1 }]}><Text style={[styles.primaryButtonText, { color: colors.background }]}>{props.saved ? "Sleep saved ✓" : "Save sleep"}</Text></Pressable>
    <SaveStatus visible={props.saved} label="Sleep" color={colors.success} />
    <View style={[styles.napRow, { borderColor: colors.border }]}>
      <View style={styles.flexField}><Field label="Optional nap minutes" value={props.napMinutes} onChangeText={props.onNap} onInputFocus={props.onInputFocus} placeholder="20" keyboardType="numeric" /></View>
      <Pressable onPress={props.onAddNap} accessibilityRole="button" accessibilityLabel="Add nap" style={({ pressed }) => [styles.secondaryButton, { borderColor: colors.success, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.actionText, { color: colors.success }]}>{props.napSaved ? "Nap saved ✓" : "Add nap"}</Text></Pressable>
    </View>
    <SaveStatus visible={props.napSaved} label="Nap" color={colors.success} />
  </CommandCard>;
}

function ScreenComposer(props: { colors: ReturnType<typeof useColors>; hours: string; minutes: string; label: string; date: string; onHours: (v: string) => void; onMinutes: (v: string) => void; onLabel: (v: string) => void; onDate: (v: string) => void; onAdd: () => void; onInputFocus: InputFocusHandler; saved: boolean }) {
  const { colors } = props;
  return <CommandCard accent={colors.primary} style={styles.composer}>
    <Text style={[styles.composerTitle, { color: colors.foreground }]}>Manual screen time</Text>
    <Text style={[styles.composerDetail, { color: colors.muted }]}>Enter what you choose to track. This app never reads device usage, apps, or browsing history.</Text>
    <View style={styles.twoFields}>
      <View style={styles.flexField}><Field label="Hours" value={props.hours} onChangeText={props.onHours} onInputFocus={props.onInputFocus} placeholder="3" keyboardType="numeric" /></View>
      <View style={styles.flexField}><Field label="Minutes" value={props.minutes} onChangeText={props.onMinutes} onInputFocus={props.onInputFocus} placeholder="15" keyboardType="numeric" /></View>
    </View>
    <Field label="Primary app, site, or category" value={props.label} onChangeText={props.onLabel} onInputFocus={props.onInputFocus} placeholder="Example: YouTube, study, social" />
    <Field label="Date" value={props.date} onChangeText={props.onDate} onInputFocus={props.onInputFocus} placeholder="YYYY-MM-DD" />
    <Pressable onPress={props.onAdd} accessibilityRole="button" accessibilityLabel="Save screen time" style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 }]}><Text style={[styles.primaryButtonText, { color: colors.background }]}>{props.saved ? "Screen time saved ✓" : "Save screen time"}</Text></Pressable>
    <SaveStatus visible={props.saved} label="Screen time" color={colors.success} />
  </CommandCard>;
}

function IllnessContextComposer(props: {
  colors: ReturnType<typeof useColors>; editing: boolean; startDate: string; endDate: string; severity: "mild" | "moderate" | "severe" | null; symptomsReported: boolean; fatigueReported: boolean; sleepDisrupted: boolean; stressElevated: boolean; note: string;
  onStartDate: (value: string) => void; onEndDate: (value: string) => void; onSeverity: (value: "mild" | "moderate" | "severe" | null) => void; onSymptomsReported: (value: boolean) => void; onFatigueReported: (value: boolean) => void; onSleepDisrupted: (value: boolean) => void; onStressElevated: (value: boolean) => void; onNote: (value: string) => void; onSave: () => void; onCancel: () => void; onInputFocus: InputFocusHandler; saved: boolean;
}) {
  const { colors } = props;
  const Toggle = ({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) => <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: active }} style={({ pressed }) => [styles.statusChip, { borderColor: active ? colors.warning : colors.border, backgroundColor: active ? `${colors.warning}18` : colors.background, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.statusText, { color: active ? colors.warning : colors.muted }]}>{active ? "✓ " : ""}{label}</Text></Pressable>;
  return <CommandCard accent={colors.warning} style={styles.composer}>
    <Text style={[styles.composerTitle, { color: colors.foreground }]}>Illness Context</Text>
    <Text style={[styles.composerDetail, { color: colors.muted }]}>A private, optional note for days you felt unwell. It is not a diagnosis and never changes your forecast, wellbeing score, missions, or rewards.</Text>
    <View style={styles.twoFields}>
      <View style={styles.flexField}><Field label="Start date" value={props.startDate} onChangeText={props.onStartDate} onInputFocus={props.onInputFocus} placeholder="YYYY-MM-DD" /></View>
      <View style={styles.flexField}><Field label="End date · optional" value={props.endDate} onChangeText={props.onEndDate} onInputFocus={props.onInputFocus} placeholder="Leave blank if ongoing" /></View>
    </View>
    <Text style={[styles.fieldLabel, { color: colors.muted }]}>OPTIONAL SELF-REPORTED CONTEXT</Text>
    <View style={styles.statusRow}><Toggle active={props.symptomsReported} label="Symptoms reported" onPress={() => props.onSymptomsReported(!props.symptomsReported)} /><Toggle active={props.fatigueReported} label="Fatigue" onPress={() => props.onFatigueReported(!props.fatigueReported)} /><Toggle active={props.sleepDisrupted} label="Sleep disrupted" onPress={() => props.onSleepDisrupted(!props.sleepDisrupted)} /><Toggle active={props.stressElevated} label="Higher stress" onPress={() => props.onStressElevated(!props.stressElevated)} /></View>
    <Text style={[styles.fieldLabel, { color: colors.muted }]}>YOUR OWN SEVERITY RATING · OPTIONAL</Text>
    <View style={styles.statusRow}>{(["mild", "moderate", "severe"] as const).map((value) => <Pressable key={value} onPress={() => props.onSeverity(props.severity === value ? null : value)} style={({ pressed }) => [styles.statusChip, { borderColor: props.severity === value ? colors.warning : colors.border, backgroundColor: props.severity === value ? `${colors.warning}18` : colors.background, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.statusText, { color: props.severity === value ? colors.warning : colors.muted }]}>{value[0].toUpperCase()}{value.slice(1)}</Text></Pressable>)}</View>
    <Field label="Private note · optional" value={props.note} onChangeText={props.onNote} onInputFocus={props.onInputFocus} placeholder="What you want to remember, without naming a diagnosis" multiline />
    <CommandCard accent={colors.error} style={styles.contextSafety}><Text style={[styles.contextSafetyTitle, { color: colors.foreground }]}>Do not wait for this app in an emergency</Text><Text style={[styles.contextSafetyText, { color: colors.muted }]}>Call local emergency services for severe breathing difficulty, severe chest pain or pressure, fainting, sudden confusion or speech trouble, sudden one-sided weakness, uncontrolled bleeding, or other severe/sudden symptoms. This app does not monitor you or give medical advice.</Text></CommandCard>
    <Pressable onPress={props.onSave} accessibilityRole="button" accessibilityLabel={props.editing ? "Save illness context changes" : "Save illness context"} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.warning, opacity: pressed ? 0.82 : 1 }]}><Text style={[styles.primaryButtonText, { color: colors.background }]}>{props.saved ? "Context saved ✓" : props.editing ? "Save context changes" : "Save private context"}</Text></Pressable>
    {props.editing ? <Pressable onPress={props.onCancel} style={({ pressed }) => [styles.secondaryButton, { borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.actionText, { color: colors.muted }]}>Cancel edit</Text></Pressable> : null}
    <SaveStatus visible={props.saved} label="Illness context" color={colors.success} />
  </CommandCard>;
}
const styles = StyleSheet.create({
  content: { gap: 13, paddingTop: 12, paddingBottom: 32 }, summaryCard: { gap: 8 }, summaryEyebrow: { fontSize: 9, fontWeight: "900", letterSpacing: 0.9 }, summaryRow: { flexDirection: "row", gap: 8 }, metric: { flex: 1, gap: 2 }, metricLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 0.6 }, metricValue: { fontSize: 15, fontWeight: "900" }, summaryDetail: { fontSize: 10, lineHeight: 15, fontWeight: "600" }, tabRow: { flexDirection: "row", gap: 7 }, tab: { flex: 1, minWidth: 0, minHeight: 37, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 }, tabText: { alignSelf: "stretch", textAlign: "center", fontSize: 10, fontWeight: "900" }, composer: { gap: 9 }, composerTitle: { fontSize: 17, lineHeight: 22, fontWeight: "900" }, composerDetail: { fontSize: 11, lineHeight: 16, fontWeight: "600" }, field: { gap: 3 }, fieldLabel: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.7 }, input: { borderWidth: StyleSheet.hairlineWidth, minHeight: 42, borderRadius: 11, paddingHorizontal: 11, fontSize: 13, fontWeight: "700" }, multiline: { minHeight: 72, paddingTop: 10, textAlignVertical: "top" }, twoFields: { flexDirection: "row", gap: 8 }, flexField: { flex: 1 }, primaryButton: { minHeight: 43, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 }, primaryButtonText: { fontSize: 12, fontWeight: "900" }, savedNotice: { fontSize: 10, lineHeight: 14, fontWeight: "900", textAlign: "center" }, secondaryButton: { alignSelf: "flex-end", minHeight: 42, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, borderRadius: 11, alignItems: "center", justifyContent: "center" }, actionText: { fontSize: 10, fontWeight: "900" }, napRow: { flexDirection: "row", gap: 8, alignItems: "flex-end", borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 9 }, calculated: { fontSize: 11, fontWeight: "900" }, sectionTitle: { fontSize: 17, lineHeight: 22, fontWeight: "900", marginTop: 2 }, recordCard: { gap: 8 }, recordTop: { flexDirection: "row", justifyContent: "space-between", gap: 9, alignItems: "flex-start" }, recordCopy: { flex: 1, gap: 2 }, recordTitle: { fontSize: 14, lineHeight: 19, fontWeight: "900" }, recordDetail: { fontSize: 10, lineHeight: 15, fontWeight: "600" }, statusRow: { flexDirection: "row", gap: 5, flexWrap: "wrap" }, statusChip: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 9, paddingHorizontal: 7, paddingVertical: 5 }, statusText: { fontSize: 9, fontWeight: "900" }, actionTypes: { flexDirection: "row", gap: 5, flexWrap: "wrap" }, actionType: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 9, paddingHorizontal: 7, paddingVertical: 5 }, actionButton: { minHeight: 36, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" }, latestAction: { fontSize: 10, lineHeight: 14, fontWeight: "700" }, afterActionRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 }, afterActionInput: { flex: 1, minHeight: 42, borderWidth: StyleSheet.hairlineWidth, borderRadius: 11, paddingHorizontal: 11, fontSize: 12, fontWeight: "700" }, recordActions: { flexDirection: "row", gap: 7, flexWrap: "wrap" }, smallAction: { minHeight: 32, borderWidth: StyleSheet.hairlineWidth, borderRadius: 9, paddingHorizontal: 10, alignItems: "center", justifyContent: "center" }, contextSafety: { gap: 4, paddingVertical: 10 }, contextSafetyTitle: { fontSize: 11, lineHeight: 15, fontWeight: "900" }, contextSafetyText: { fontSize: 9, lineHeight: 13, fontWeight: "600" }, empty: { paddingVertical: 20 }, emptyText: { fontSize: 12, lineHeight: 18, fontWeight: "700", textAlign: "center" },
});
