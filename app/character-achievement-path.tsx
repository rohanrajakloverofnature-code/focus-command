import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Image, type ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

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

const PathConnector = memo(function PathConnector({ index, count, reduceMotion, animationRun }: { index: number; count: number; reduceMotion: boolean; animationRun: number }) {
  const lineHeight = useSharedValue(reduceMotion ? 56 : 0);
  useEffect(() => {
    lineHeight.value = reduceMotion ? 56 : 0;
    if (reduceMotion) return;
    const upwardOrder = Math.max(0, count - index - 2);
    lineHeight.value = withDelay(Math.min(upwardOrder * 80, 880), withTiming(56, { duration: 300, easing: Easing.out(Easing.cubic) }));
  }, [animationRun, count, index, lineHeight, reduceMotion]);
  const lineStyle = useAnimatedStyle(() => ({ height: lineHeight.value, opacity: lineHeight.value ? 1 : 0 }));
  return (
    <View style={styles.connectorArea} pointerEvents="none">
      <View style={styles.connectorGlow} />
      <Animated.View style={[styles.connector, lineStyle]} />
    </View>
  );
});

const AchievementNode = memo(function AchievementNode({
  entry,
  index,
  count,
  portrait,
  reduceMotion,
  animationRun,
  onPress,
}: {
  entry: CharacterAchievementPathEntry;
  index: number;
  count: number;
  portrait: ImageSourcePropType;
  reduceMotion: boolean;
  animationRun: number;
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
      {index < count - 1 ? <PathConnector index={index} count={count} reduceMotion={reduceMotion} animationRun={animationRun} /> : null}
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
  useFocusEffect(useCallback(() => {
    setPathAnimationRun((run) => run + 1);
  }, []));
  const entries = useMemo(
    () => getCharacterAchievementPath(state),
    [state],
  );
  const displayEntries = useMemo(() => entries.slice().reverse(), [entries]);
  const totalPower = useMemo(() => entries.reduce((total, entry) => total + entry.powerEarned, 0), [entries]);
  const equippedCharacterGear = useMemo(() => resolveEquippedCharacterGear(state), [state]);

  if (!ready) return <LoadingScreen label="Opening character path…" />;

  return (
    <ScreenContainer className="px-0" containerClassName="bg-background" edges={["top", "bottom", "left", "right"]}>
      <FlatList
        data={displayEntries}
        keyExtractor={(entry) => entry.id}
        renderItem={({ item, index }) => (
          <AchievementNode
            entry={item}
            index={index}
            count={displayEntries.length}
            portrait={resolvePortrait(item, state)}
            reduceMotion={state.profile.reduceMotion}
            animationRun={pathAnimationRun}
            onPress={() => setSelectedAchievement(item)}
          />
        )}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={16}
        windowSize={7}
        showsVerticalScrollIndicator={false}
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
  connectorArea: { alignItems: "center", justifyContent: "flex-end", height: 56, overflow: "hidden" },
  connectorGlow: { position: "absolute", top: 0, width: 11, height: 56, borderRadius: 99, backgroundColor: "#F4C95D10" },
  connector: { width: 2, borderRadius: 99, backgroundColor: "#F4C95D" },
});
