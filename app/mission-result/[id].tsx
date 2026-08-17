import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { CelebrationKind, CelebrationOverlay } from "@/components/celebration-overlay";
import { CommandButton, CommandCard, LoadingScreen, MetricTile, ProgressBar, ScreenTitle, StatusPill } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { formatCompactNumber, formatHours, getMissionCompletionRecords, getMissionInvestedMilliseconds, getTotalPower, type FocusState, type MissionCompletionRecord, useFocusCommandReady, useFocusCommandSelector } from "@/lib/focus-command";
import { playFocusRole } from "@/lib/focus-audio";

type MissionResultSnapshot = {
  mission: FocusState["missions"][number] | undefined;
  completion: FocusState["missionCompletions"][number] | undefined;
  fallbackCompletion: MissionCompletionRecord | undefined;
  event: FocusState["progression"][number] | undefined;
  reflection: FocusState["reflections"][number] | undefined;
  totalPower: number;
  soundEnabled: boolean;
  soundRoles: FocusState["profile"]["soundRoles"];
  reduceMotion: boolean;
};

function hasSameMissionResultSnapshot(left: MissionResultSnapshot, right: MissionResultSnapshot) {
  return left.mission === right.mission
    && left.completion === right.completion
    && left.fallbackCompletion === right.fallbackCompletion
    && left.event === right.event
    && left.reflection === right.reflection
    && left.totalPower === right.totalPower
    && left.soundEnabled === right.soundEnabled
    && left.soundRoles === right.soundRoles
    && left.reduceMotion === right.reduceMotion;
}

function selectMissionResultSnapshot(state: FocusState, missionId: string | undefined, completionId: string | undefined): MissionResultSnapshot {
  const mission = state.missions.find((candidate) => candidate.id === missionId);
  const completion = completionId ? state.missionCompletions.find((candidate) => candidate.id === completionId) : undefined;
  // Current completions resolve directly by immutable identifiers. The cached
  // history fallback retains the existing legacy deep-link behavior without
  // putting an all-history assembly on the normal confirmation path.
  const fallbackCompletion = completionId && !completion
    ? getMissionCompletionRecords(state).find((candidate) => candidate.id === completionId)
    : undefined;
  const resolvedCompletion = fallbackCompletion ?? completion;
  const event = resolvedCompletion
    ? fallbackCompletion?.progression
      ?? state.progression.find((candidate) => candidate.completionId === resolvedCompletion.id)
      ?? state.progression.find((candidate) => candidate.id === resolvedCompletion.progressionEventId)
    : state.progression.filter((candidate) => candidate.missionId === missionId).at(-1);
  const reflection = resolvedCompletion
    ? fallbackCompletion?.reflection
      ?? state.reflections.find((candidate) => candidate.completionId === resolvedCompletion.id)
      ?? state.reflections.find((candidate) => candidate.id === resolvedCompletion.reflectionId)
    : state.reflections.filter((candidate) => candidate.missionId === missionId).at(-1);

  return {
    mission,
    completion,
    fallbackCompletion,
    event,
    reflection,
    totalPower: getTotalPower(state),
    soundEnabled: state.profile.soundEnabled,
    soundRoles: state.profile.soundRoles,
    reduceMotion: state.profile.reduceMotion,
  };
}

export default function MissionResultScreen() {
  const colors = useColors();
  const { id, completionId } = useLocalSearchParams<{ id: string; completionId?: string }>();
  const ready = useFocusCommandReady();
  const result = useFocusCommandSelector((state) => selectMissionResultSnapshot(state, id, completionId), hasSameMissionResultSnapshot);
  const { mission, completion, fallbackCompletion, event, reflection, totalPower, soundEnabled, soundRoles, reduceMotion } = result;
  const [celebration, setCelebration] = useState<CelebrationKind | null>(null);
  const playedResultEventId = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !event) return;
    if (playedResultEventId.current === event.id) return;
    playedResultEventId.current = event.id;
    const kind: CelebrationKind = event.titleAfter && event.titleAfter !== event.titleBefore ? "title" : event.levelAfter && event.levelAfter > (event.levelBefore ?? event.levelAfter) ? "level" : event.comboAfter && event.comboAfter > (event.comboBefore ?? event.comboAfter) ? "combo" : "mission";
    setCelebration(kind);
    const role = kind === "title" ? "titleUnlock" : kind === "level" ? "levelUp" : kind === "combo" ? "comboTier" : "missionWin";
    void playFocusRole(role, soundEnabled, soundRoles[role]);
  }, [completionId, event, ready, soundEnabled, soundRoles]);

  if (!ready) return <LoadingScreen label="Calculating mission result…" />;

  if (!mission && !completion && !fallbackCompletion) {
    return (
      <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]}>
        <View style={styles.missing}>
          <Text style={[styles.missingTitle, { color: colors.foreground }]}>Mission result unavailable</Text>
          <CommandButton label="Return home" onPress={() => router.replace("/")} />
        </View>
      </ScreenContainer>
    );
  }

  const duration = completion?.durationMs ?? fallbackCompletion?.durationMs ?? (mission ? getMissionInvestedMilliseconds(mission) : 0);
  const title = fallbackCompletion?.title ?? completion?.missionTitle ?? mission?.title ?? "Mission";
  const baseXp = fallbackCompletion?.baseXp ?? completion?.missionBaseXp ?? mission?.baseXp ?? event?.baseXp ?? 0;

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenTitle eyebrow="Mission report" title="Objective secured" detail={title} />

        <CommandCard accent="#F4C95D" style={styles.hero}>
          <View style={[styles.medallion, { borderColor: "#F4C95D", backgroundColor: "#F4C95D18" }]}>
            <IconSymbol name="trophy.fill" size={36} color="#F4C95D" />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Focused work became progress.</Text>
          <Text style={[styles.heroDetail, { color: colors.muted }]}>Your ledger records this mission once, using the combo active when you completed it. Future streak changes will never rewrite this result.</Text>
          <View style={styles.heroPower}>
            <Text style={[styles.heroPowerValue, { color: "#F4C95D" }]}>{formatCompactNumber(event?.powerAwarded ?? 0)}</Text>
            <Text style={[styles.heroPowerLabel, { color: colors.muted }]}>POWER AWARDED</Text>
          </View>
          <ProgressBar value={Math.min(1, (event?.powerAwarded ?? 0) / 100)} color="#F4C95D" trackColor={colors.border} height={8} />
        </CommandCard>

        <View style={styles.metrics}>
          <MetricTile label="Active time" value={formatHours(duration)} detail="Paused time removed" icon="timer" accent={colors.primary} />
          <MetricTile label="Base XP" value={formatCompactNumber(event?.baseXp ?? baseXp)} detail={`${(event?.comboMultiplier ?? 1).toFixed(2)}× combo`} icon="bolt.fill" accent={colors.primary} />
          <MetricTile label="Gold earned" value={formatCompactNumber(event?.goldAwarded ?? 0)} detail={(event?.goldMultiplier ?? 1) > 1 ? `${event?.goldMultiplier}× cache applied` : "1 gold per 10 power"} icon="star.fill" accent="#F4C95D" />
          <MetricTile label="Total power" value={formatCompactNumber(totalPower)} detail="Lifetime earned" icon="shield.fill" accent={colors.success} />
        </View>

        {reflection?.miniAchievement ? (
          <CommandCard accent={colors.success} style={styles.achievementCard}>
            <StatusPill label={`MINI ACHIEVEMENT · ${reflection.miniAchievementRating ?? 0}/5`} tone="success" icon="star.fill" />
            <Text style={[styles.achievementTitle, { color: colors.foreground }]}>{reflection.miniAchievement}</Text>
            <Text style={[styles.achievementDetail, { color: colors.muted }]}>{(reflection.miniAchievementRating ?? 0) > 3 ? "This achievement is now eligible for the Wall of Fame for seven days." : "Keep recording small wins—they reinforce the campaign."}</Text>
          </CommandCard>
        ) : null}

        {reflection?.skills?.length ? (
          <CommandCard accent={colors.primary} style={styles.skillsCard}>
            <Text style={[styles.skillsLabel, { color: colors.muted }]}>SKILLS GAINED</Text>
            <View style={styles.skillsRow}>
              {reflection.skills.map((skill) => <StatusPill key={skill} label={skill} tone="primary" />)}
            </View>
          </CommandCard>
        ) : null}

        {mission?.revisionTopicIds.length ? (
          <CommandCard accent={colors.warning} style={styles.srsCard}>
            <View style={styles.srsIcon}><IconSymbol name="arrow.clockwise" size={19} color={colors.warning} /></View>
            <View style={styles.srsCopy}>
              <Text style={[styles.srsTitle, { color: colors.foreground }]}>Revision loop armed</Text>
              <Text style={[styles.srsDetail, { color: colors.muted }]}>{mission.revisionTopicIds.length} topic{mission.revisionTopicIds.length === 1 ? "" : "s"} will surface for Day 1 review in the command queue.</Text>
            </View>
          </CommandCard>
        ) : null}

        <View style={styles.actions}>
          <CommandButton label="Return home" icon="house.fill" onPress={() => router.replace("/")} style={styles.actionButton} />
          <CommandButton label="Mission board" icon="checklist" variant="secondary" onPress={() => router.replace("/missions" as never)} style={styles.actionButton} />
        </View>
      </ScrollView>
      {celebration ? <CelebrationOverlay kind={celebration} reduceMotion={reduceMotion} onDone={() => setCelebration(null)} /> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingTop: 10, paddingBottom: 28 },
  missing: { flex: 1, justifyContent: "center", gap: 14 },
  missingTitle: { fontSize: 20, lineHeight: 26, fontWeight: "900" },
  hero: { alignItems: "center", gap: 10, paddingVertical: 22 },
  medallion: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: 21, lineHeight: 27, fontWeight: "900", textAlign: "center", letterSpacing: -0.35 },
  heroDetail: { fontSize: 12, lineHeight: 18, fontWeight: "500", textAlign: "center", maxWidth: 320 },
  heroPower: { alignItems: "center", marginTop: 4 },
  heroPowerValue: { fontSize: 38, lineHeight: 44, fontWeight: "900", letterSpacing: -0.8 },
  heroPowerLabel: { fontSize: 10, lineHeight: 13, letterSpacing: 1, fontWeight: "800" },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  achievementCard: { gap: 8 },
  achievementTitle: { fontSize: 17, lineHeight: 23, fontWeight: "900" },
  achievementDetail: { fontSize: 12, lineHeight: 17, fontWeight: "500" },
  skillsCard: { gap: 9 },
  skillsLabel: { fontSize: 10, lineHeight: 13, letterSpacing: 0.85, fontWeight: "800" },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  srsCard: { flexDirection: "row", gap: 10, alignItems: "center" },
  srsIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#FFAA4C18", justifyContent: "center", alignItems: "center" },
  srsCopy: { flex: 1 },
  srsTitle: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
  srsDetail: { fontSize: 12, lineHeight: 17, marginTop: 1, fontWeight: "500" },
  actions: { flexDirection: "row", gap: 10 },
  actionButton: { flex: 1 },
});
