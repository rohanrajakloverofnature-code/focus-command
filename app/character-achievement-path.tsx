import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Image, type ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { CommandCard, IconAction, LoadingScreen, ScreenTitle, TapFeedback } from "@/components/focus-ui";
import { RankCharacterAchievement, getRankProfile } from "@/components/rank-character";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getCharacterAchievementPath, type CharacterAchievementPathEntry } from "@/lib/character-achievement-path";
import { formatCompactNumber, formatHours, type FocusState, useFocusCommandReady, useFocusCommandSelector } from "@/lib/focus-command";

type AchievementPathDependencies = Pick<FocusState,
  "profile"
  | "characterMilestones"
  | "missions"
  | "missionCompletions"
  | "progression"
  | "reflections"
  | "allEquipment"
  | "userEquipment"
>;

const CONNECTOR_HEIGHT = 56;
const CONNECTOR_DRAW_DURATION_MS = 420;
const CONNECTOR_HANDOFF_MS = 120;
const CONNECTOR_STEP_INTERVAL_MS = CONNECTOR_DRAW_DURATION_MS + CONNECTOR_HANDOFF_MS;

function selectAchievementPathDependencies(state: FocusState): AchievementPathDependencies {
  return {
    profile: state.profile,
    characterMilestones: state.characterMilestones,
    missions: state.missions,
    missionCompletions: state.missionCompletions,
    progression: state.progression,
    reflections: state.reflections,
    allEquipment: state.allEquipment,
    userEquipment: state.userEquipment,
  };
}

function hasSameAchievementPathDependencies(left: AchievementPathDependencies, right: AchievementPathDependencies) {
  return left.profile === right.profile
    && left.characterMilestones === right.characterMilestones
    && left.missions === right.missions
    && left.missionCompletions === right.missionCompletions
    && left.progression === right.progression
    && left.reflections === right.reflections
    && left.allEquipment === right.allEquipment
    && left.userEquipment === right.userEquipment;
}

function formatAchievementDate(isoTimestamp: string) {
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(isoTimestamp));
}

function resolvePortrait(entry: CharacterAchievementPathEntry, state: AchievementPathDependencies): ImageSourcePropType {
  if (entry.portraitUri) return { uri: entry.portraitUri };
  return getRankProfile(entry.presentationTitle, entry.levelAtAchievement, state.profile.customCharacterForms).portrait;
}

function resolveEquippedCharacterGear(state: AchievementPathDependencies) {
  const equipped: { head?: FocusState["allEquipment"][number]; body?: FocusState["allEquipment"][number]; accessory?: FocusState["allEquipment"][number] } = {};
  for (const userEquipment of state.userEquipment) {
    if (userEquipment.isEquipped === "false") continue;
    const equipment = state.allEquipment.find((candidate) => candidate.id === userEquipment.equipmentId);
    if (equipment) equipped[userEquipment.isEquipped as "head" | "body" | "accessory"] = equipment;
  }
  return equipped;
}

const PathConnector = memo(function PathConnector({ index, activeConnectorIndex, reduceMotion }: { index: number; activeConnectorIndex: number | null; reduceMotion: boolean }) {
  const lineProgress = useSharedValue(reduceMotion ? 1 : 0);
  const glowStrength = useSharedValue(reduceMotion ? 0.3 : 0);
  const isCompleted = reduceMotion || (activeConnectorIndex !== null && index > activeConnectorIndex);
  const isActive = !reduceMotion && activeConnectorIndex === index;

  useEffect(() => {
    if (isCompleted) {
      lineProgress.value = 1;
      glowStrength.value = 0.3;
      return;
    }
    if (!isActive) {
      lineProgress.value = 0;
      glowStrength.value = 0;
      return;
    }
    lineProgress.value = 0;
    glowStrength.value = 0;
    lineProgress.value = withTiming(1, { duration: CONNECTOR_DRAW_DURATION_MS, easing: Easing.out(Easing.cubic) });
    glowStrength.value = withSequence(
      withTiming(0.92, { duration: 130, easing: Easing.out(Easing.quad) }),
      withTiming(0.3, { duration: CONNECTOR_DRAW_DURATION_MS - 130, easing: Easing.out(Easing.cubic) }),
    );
  }, [glowStrength, isActive, isCompleted, lineProgress]);

  const lineStyle = useAnimatedStyle(() => ({ height: lineProgress.value * CONNECTOR_HEIGHT, opacity: lineProgress.value ? 1 : 0 }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowStrength.value }));
  const headStyle = useAnimatedStyle(() => ({
    opacity: isActive ? 1 : 0,
    bottom: Math.max(0, lineProgress.value * CONNECTOR_HEIGHT - 3),
  }));
  return (
    <View style={styles.connectorArea} pointerEvents="none">
      <Animated.View style={[styles.connectorGlow, glowStyle]} />
      <Animated.View style={[styles.connector, lineStyle]} />
      <Animated.View style={[styles.connectorHead, headStyle]} />
    </View>
  );
});

const AchievementNode = memo(function AchievementNode({
  entry,
  index,
  count,
  portrait,
  reduceMotion,
  activeConnectorIndex,
  onPress,
}: {
  entry: CharacterAchievementPathEntry;
  index: number;
  count: number;
  portrait: ImageSourcePropType;
  reduceMotion: boolean;
  activeConnectorIndex: number | null;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.nodeGroup}>
      <TapFeedback onPress={onPress} accessibilityLabel={`Replay ${entry.formName} character achievement`}>
        <CommandCard accent="#F4C95D" style={styles.nodeCard}>
          <View style={styles.nodeTopline}>
            <View style={styles.portraitHalo}>
              <Image source={portrait} style={styles.portrait} />
            </View>
            <View style={styles.nodeCopy}>
              <Text numberOfLines={1} style={[styles.nodeEyebrow, { color: "#F4C95D" }]}>CHARACTER ACHIEVED</Text>
              <Text numberOfLines={2} style={[styles.nodeTitle, { color: colors.foreground }]}>{entry.formName}</Text>
              <Text style={[styles.nodeDate, { color: colors.muted }]}>{formatAchievementDate(entry.achievedAt)} · Level {entry.levelAtAchievement}</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#F4C95D" />
          </View>
          <View style={[styles.metrics, { borderColor: `${colors.border}A8` }]}>
            <PathMetric icon="star.fill" label="Radar" value={String(entry.radarAchievements)} accent={colors.success} />
            <PathMetric icon="timer" label="Focus" value={formatHours(entry.investedMs)} accent={colors.primary} />
            <PathMetric icon="shield.fill" label="Power" value={formatCompactNumber(entry.powerEarned)} accent="#F4C95D" />
          </View>
          <View style={[styles.periodMetrics, { borderColor: `${colors.border}78` }]}>
            <PathPeriodMetric label="Missions" value={String(entry.completedMissions)} />
            <PathPeriodMetric label="Gold earned" value={formatCompactNumber(entry.goldEarned)} accent="#F4C95D" />
            <PathPeriodMetric label="Level range" value={`L${entry.levelStart} → ${entry.levelEnd}`} />
          </View>
        </CommandCard>
      </TapFeedback>
      {index < count - 1 ? <PathConnector index={index} activeConnectorIndex={activeConnectorIndex} reduceMotion={reduceMotion} /> : null}
    </View>
  );
});

function PathMetric({ icon, label, value, accent }: { icon: "star.fill" | "timer" | "shield.fill"; label: string; value: string; accent: string }) {
  const colors = useColors();
  return (
    <View style={styles.metric}>
      <IconSymbol name={icon} size={14} color={accent} />
      <Text style={[styles.metricLabel, { color: colors.muted }]}>{label}</Text>
      <Text numberOfLines={1} style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function PathPeriodMetric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  const colors = useColors();
  return (
    <View style={styles.periodMetric}>
      <Text numberOfLines={1} style={[styles.periodMetricLabel, { color: colors.muted }]}>{label}</Text>
      <Text numberOfLines={1} style={[styles.periodMetricValue, { color: accent ?? colors.foreground }]}>{value}</Text>
    </View>
  );
}

export default function CharacterAchievementPathScreen() {
  const ready = useFocusCommandReady();
  const state = useFocusCommandSelector(selectAchievementPathDependencies, hasSameAchievementPathDependencies) as AchievementPathDependencies;
  const [selectedAchievement, setSelectedAchievement] = useState<CharacterAchievementPathEntry | null>(null);
  const [pathAnimationRun, setPathAnimationRun] = useState(0);
  const [activeConnectorIndex, setActiveConnectorIndex] = useState<number | null>(null);
  const listRef = useRef<FlatList<CharacterAchievementPathEntry>>(null);
  const journeyTimers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const autoFollowActive = useRef(false);
  const entries = useMemo(
    () => getCharacterAchievementPath(state),
    [state],
  );
  const displayEntries = useMemo(() => entries.slice().reverse(), [entries]);
  const totalPower = useMemo(() => entries.reduce((total, entry) => total + entry.powerEarned, 0), [entries]);
  const equippedCharacterGear = useMemo(() => resolveEquippedCharacterGear(state), [state]);

  const clearJourneyTimers = useCallback(() => {
    journeyTimers.current.forEach((timer) => clearTimeout(timer));
    journeyTimers.current.clear();
    autoFollowActive.current = false;
  }, []);

  const scheduleJourneyStep = useCallback((work: () => void, delay: number) => {
    const timer = setTimeout(() => {
      journeyTimers.current.delete(timer);
      work();
    }, delay);
    journeyTimers.current.add(timer);
  }, []);

  const cancelAutoFollow = useCallback(() => {
    autoFollowActive.current = false;
  }, []);

  useFocusEffect(useCallback(() => {
    setPathAnimationRun((run) => run + 1);
    return clearJourneyTimers;
  }, [clearJourneyTimers]));

  useEffect(() => {
    clearJourneyTimers();
    setActiveConnectorIndex(null);
    if (!displayEntries.length || state.profile.reduceMotion) {
      setActiveConnectorIndex(-1);
      return;
    }
    if (displayEntries.length < 2) return;

    autoFollowActive.current = true;
    const firstConnectorIndex = displayEntries.length - 2;
    scheduleJourneyStep(() => {
      listRef.current?.scrollToEnd({ animated: false });
      scheduleJourneyStep(() => setActiveConnectorIndex(firstConnectorIndex), 90);
      for (let step = 1; step < displayEntries.length - 1; step += 1) {
        scheduleJourneyStep(
          () => setActiveConnectorIndex(firstConnectorIndex - step),
          90 + (step * CONNECTOR_STEP_INTERVAL_MS),
        );
      }
      scheduleJourneyStep(
        () => setActiveConnectorIndex(-1),
        90 + ((displayEntries.length - 1) * CONNECTOR_STEP_INTERVAL_MS),
      );
      for (let step = 0; step < displayEntries.length - 2; step += 1) {
        scheduleJourneyStep(() => {
          if (!autoFollowActive.current) return;
          listRef.current?.scrollToIndex({
            index: firstConnectorIndex - step,
            animated: true,
            viewPosition: 0.7,
          });
        }, 90 + CONNECTOR_DRAW_DURATION_MS + (step * CONNECTOR_STEP_INTERVAL_MS));
      }
    }, 60);
    return clearJourneyTimers;
  }, [clearJourneyTimers, displayEntries.length, pathAnimationRun, scheduleJourneyStep, state.profile.reduceMotion]);

  if (!ready) return <LoadingScreen label="Opening character path…" />;

  return (
    <ScreenContainer className="px-0" containerClassName="bg-background" edges={["top", "bottom", "left", "right"]}>
      <FlatList
        ref={listRef}
        data={displayEntries}
        keyExtractor={(entry) => entry.id}
        renderItem={({ item, index }) => (
          <AchievementNode
            entry={item}
            index={index}
            count={displayEntries.length}
            portrait={resolvePortrait(item, state)}
            reduceMotion={state.profile.reduceMotion}
            activeConnectorIndex={activeConnectorIndex}
            onPress={() => setSelectedAchievement(item)}
          />
        )}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={16}
        windowSize={7}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={cancelAutoFollow}
        onScrollToIndexFailed={({ averageItemLength, index }) => {
          if (!autoFollowActive.current) return;
          listRef.current?.scrollToOffset({ offset: Math.max(0, averageItemLength * index), animated: true });
        }}
        contentContainerStyle={styles.content}
        ListHeaderComponent={(
          <View style={styles.header}>
            <ScreenTitle eyebrow="Lifetime progression" title="Character achievement path" detail="Each node is created automatically when earned XP, level, and Total Power activate a new character form." right={<IconAction icon="xmark" label="Close character achievement path" onPress={() => router.back()} />} />
            <CommandCard accent="#F4C95D" style={styles.summaryCard}>
              <View style={styles.summaryIcon}><IconSymbol name="shield.fill" size={25} color="#F4C95D" /></View>
              <View style={styles.summaryCopy}>
                <Text style={styles.summaryEyebrow}>AUTOMATIC RECORD</Text>
                <Text style={styles.summaryTitle}>{entries.length} earned form{entries.length === 1 ? "" : "s"}</Text>
                <Text style={styles.summaryDetail}>{formatCompactNumber(totalPower)} Total Power earned inside recorded character periods. Tap a form to replay its premium character presentation.</Text>
              </View>
            </CommandCard>
            {!entries.length ? <CommandCard accent="#F4C95D" style={styles.emptyCard}><Text style={styles.emptyTitle}>Your path is forming</Text><Text style={styles.emptyDetail}>Your first lifetime node will appear automatically when a future level or power upgrade changes your earned character form.</Text></CommandCard> : null}
          </View>
        )}
        ListEmptyComponent={null}
      />
      {selectedAchievement ? (
        <RankCharacterAchievement
          title={selectedAchievement.presentationTitle}
          level={selectedAchievement.levelAtAchievement}
          reduceMotion={state.profile.reduceMotion}
          soundEnabled={state.profile.soundEnabled && state.profile.soundRoles.achievement.enabled}
          equipment={equippedCharacterGear}
          mode="evolution"
          totalPower={selectedAchievement.totalPowerAtAchievement}
          goldBalance={selectedAchievement.goldEarned}
          historicPortraitUri={selectedAchievement.portraitUri}
          historicFormName={selectedAchievement.formName}
          visible
          onDismiss={() => setSelectedAchievement(null)}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32 },
  header: { gap: 15, paddingBottom: 18 },
  summaryCard: { flexDirection: "row", gap: 12, alignItems: "center" },
  summaryIcon: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#F4C95D18", borderWidth: StyleSheet.hairlineWidth, borderColor: "#F4C95D54" },
  summaryCopy: { flex: 1, gap: 3 },
  summaryEyebrow: { color: "#F4C95D", fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.9 },
  summaryTitle: { color: "#F5F5F5", fontSize: 17, lineHeight: 22, fontWeight: "900" },
  summaryDetail: { color: "#A7A7A7", fontSize: 11, lineHeight: 16, fontWeight: "600" },
  emptyCard: { alignItems: "center", gap: 5, paddingVertical: 20 },
  emptyTitle: { color: "#F5F5F5", fontSize: 16, lineHeight: 21, fontWeight: "900" },
  emptyDetail: { color: "#A7A7A7", fontSize: 12, lineHeight: 17, fontWeight: "600", textAlign: "center" },
  nodeGroup: { alignItems: "stretch" },
  nodeCard: { gap: 12 },
  nodeTopline: { flexDirection: "row", alignItems: "center", gap: 11 },
  portraitHalo: { width: 62, height: 62, borderRadius: 31, padding: 2, overflow: "hidden", borderWidth: 1, borderColor: "#F4C95DA8", backgroundColor: "#F4C95D1C" },
  portrait: { width: "100%", height: "100%", borderRadius: 29, backgroundColor: "#121212" },
  nodeCopy: { flex: 1, minWidth: 0, gap: 2 },
  nodeEyebrow: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.8 },
  nodeTitle: { fontSize: 15, lineHeight: 19, fontWeight: "900" },
  nodeDate: { fontSize: 10, lineHeight: 14, fontWeight: "600" },
  metrics: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, gap: 6 },
  metric: { flex: 1, minWidth: 0, gap: 2 },
  metricLabel: { fontSize: 8, lineHeight: 11, fontWeight: "800", letterSpacing: 0.35 },
  metricValue: { fontSize: 12, lineHeight: 16, fontWeight: "900" },
  periodMetrics: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 9, gap: 6 },
  periodMetric: { flex: 1, minWidth: 0, gap: 2 },
  periodMetricLabel: { fontSize: 8, lineHeight: 11, fontWeight: "800", letterSpacing: 0.3 },
  periodMetricValue: { fontSize: 11, lineHeight: 15, fontWeight: "900" },
  connectorArea: { alignItems: "center", justifyContent: "flex-end", height: CONNECTOR_HEIGHT, overflow: "hidden" },
  connectorGlow: { position: "absolute", top: 0, width: 16, height: CONNECTOR_HEIGHT, borderRadius: 99, backgroundColor: "#F4C95D24", shadowColor: "#F4C95D", shadowOpacity: 0.82, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  connector: { width: 2, borderRadius: 99, backgroundColor: "#F4C95D" },
  connectorHead: { position: "absolute", width: 7, height: 7, borderRadius: 4, backgroundColor: "#FFF4BF", shadowColor: "#F4C95D", shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
});
