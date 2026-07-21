import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { CelebrationKind, CelebrationOverlay } from "@/components/celebration-overlay";
import {
  CommandButton,
  CommandCard,
  EmptyCommandState,
  IconAction,
  LoadingScreen,
  MetricTile,
  ProgressBar,
  ScreenTitle,
  SectionHeader,
  StatusPill,
} from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { HomeFire } from "@/components/home-fire";
import { IndiaSubjectMap } from "@/components/india-subject-map";
import { RankCharacter, RankCharacterAchievement } from "@/components/rank-character";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { playFocusRole, playFocusSuccessCue } from "@/lib/focus-audio";
import { getForecastMotivationMessages } from "@/lib/home-motivation";
import {
  formatCompactNumber,
  formatHours,
  formatTimeUntil,
  getActiveGoldMultiplier as activeGoldMultiplier,
  getBossProgress,
  getCurrentCombo,
  getCurrentTitle,
  getDailyProgress,
  getEmotionalPatternForecast,
  getEnergy,
  getGoldBalance,
  getLevelInfo,
  getLifetimeGold,
  getPendingRevisions,
  getSubjectCapture,
  getTodayInvestedMilliseconds,
  getTotalPower,
  getTotalXp,
  useFocusCommand,
} from "@/lib/focus-command";

function syncLabel(phase: string, pending: number): string {
  if (phase === "needs_setup") return "Connect your sheet";
  if (phase === "synced") return "Sheet synced";
  if (pending > 0) return `${pending} local update${pending === 1 ? "" : "s"}`;
  if (phase === "error") return "Sync needs attention";
  return "Saved on this device";
}

export default function HomeScreen() {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const { state, ready } = useFocusCommand();
  const level = getLevelInfo(state);
  const title = getCurrentTitle(state);
  const combo = getCurrentCombo(state);
  const milestones = useRef({ level: level.level, title: title.title, combo: combo.multiplier });
  const [homeCelebration, setHomeCelebration] = useState<CelebrationKind | null>(null);
  const [showRankAchievement, setShowRankAchievement] = useState(false);
  const [motivationIndex, setMotivationIndex] = useState(0);

  useEffect(() => {
    if (!ready) return;
    const previous = milestones.current;
    const nextKind: CelebrationKind | null = title.title !== previous.title ? "title" : level.level > previous.level ? "level" : combo.multiplier > previous.combo ? "combo" : null;
    if (nextKind) {
      setHomeCelebration(nextKind);
      void playFocusRole("extended", state.profile.soundEnabled, state.profile.soundRoles.extended);
    }
    milestones.current = { level: level.level, title: title.title, combo: combo.multiplier };
  }, [combo.multiplier, level.level, ready, state.profile.soundEnabled, state.profile.soundRoles.extended, title.title]);

  const forecast = getEmotionalPatternForecast(state);
  const motivationMessages = getForecastMotivationMessages(forecast);

  useEffect(() => {
    setMotivationIndex(0);
  }, [forecast.available, forecast.outlook, forecast.sampleSize]);

  useEffect(() => {
    if (motivationMessages.length < 2) return;
    const rotation = setInterval(() => {
      setMotivationIndex((current) => (current + 1) % motivationMessages.length);
    }, 5_000);
    return () => clearInterval(rotation);
  }, [forecast.available, forecast.outlook, forecast.sampleSize, motivationMessages.length]);

  if (!ready) return <LoadingScreen />;
  const motivation = motivationMessages[motivationIndex % motivationMessages.length] ?? motivationMessages[0];
  const openRankAchievement = () => {
    setShowRankAchievement(true);
    void playFocusSuccessCue(state.profile.soundEnabled, state.profile.soundRoles.missionWin);
  };
  const energy = getEnergy(state);
  const daily = getDailyProgress(state);
  const pendingRevisions = getPendingRevisions(state);
  const activeBosses = state.bosses.filter((boss) => boss.status === "active");
  const subjectCapture = getSubjectCapture(state);
  const totalPower = getTotalPower(state);
  const totalXp = getTotalXp(state);
  const goldBalance = getGoldBalance(state);
  const lifetimeGold = getLifetimeGold(state);
  const goldMultiplier = activeGoldMultiplier(state);
  const operatorScale = Math.min(1.2, 0.9 + totalPower / 5_000);
  const journalByDate = new Map(state.journals.map((entry) => [entry.localDate, entry.points]));
  const journalBars = Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    const localDate = date.toISOString().slice(0, 10);
    return { localDate, points: journalByDate.get(localDate) ?? 0 };
  });
  const maxJournalPoints = Math.max(1, ...journalBars.map((bar) => bar.points));
  const metricColumns = width < 600 ? 2 : 3;
  const metrics = [
    { id: "xp", label: "Total XP", value: formatCompactNumber(totalXp), detail: combo.multiplier > 1 ? "Combo amplified" : "Base experience", icon: "bolt.fill" as const, accent: colors.primary },
    { id: "gold", label: "Gold Balance", value: formatCompactNumber(goldBalance), detail: `${formatCompactNumber(lifetimeGold)} earned`, icon: "star.fill" as const, accent: "#F4C95D", onPress: () => router.push("/rewards" as never) },
    { id: "target", label: "Mission Target", value: `${daily.earned}/${daily.target}`, detail: `${Math.round(daily.progress * 100)}% deployed`, icon: "target" as const, accent: colors.success, onPress: () => router.push("/missions" as never) },
    { id: "time", label: "Invested Today", value: formatHours(getTodayInvestedMilliseconds(state)), detail: goldMultiplier > 1 ? `${goldMultiplier}× gold cache active` : "Exact active time", icon: "timer" as const, accent: colors.warning },
    { id: "combo", label: "Next combo tier", value: combo.daysToNext ? `${combo.daysToNext}d` : "MAX", detail: `${combo.multiplier.toFixed(2)}× is live`, icon: "flame.fill" as const, accent: "#F4C95D" },
    { id: "level", label: "XP to level", value: formatCompactNumber(level.powerForNextLevel), detail: `${formatCompactNumber(level.currentLevelPower)} at current level`, icon: "shield.fill" as const, accent: colors.primary },
  ];
  const metricRows = Array.from({ length: Math.ceil(metrics.length / metricColumns) }, (_, rowIndex) => metrics.slice(rowIndex * metricColumns, (rowIndex + 1) * metricColumns));

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenTitle
          eyebrow="Focus Command"
          title={state.profile.firstName}
          detail={title.title}
          right={<IconAction icon="line.3.horizontal" label="Open command settings" onPress={() => router.push("/settings")} />}
        />

        <CommandCard accent={colors.primary} style={[styles.heroCard, { backgroundColor: "#0E1D2E", borderColor: "#234865" }]}>
          <View style={[styles.heroGrid, { pointerEvents: "none" }]}>
            <View style={[styles.gridLineVertical, { left: "20%" }]} />
            <View style={[styles.gridLineVertical, { left: "52%" }]} />
            <View style={[styles.gridLineVertical, { left: "81%" }]} />
            <View style={[styles.gridLineHorizontal, { top: "28%" }]} />
            <View style={[styles.gridLineHorizontal, { top: "61%" }]} />
          </View>
          <View style={styles.heroTopline}>
            <StatusPill label={`LEVEL ${level.level}`} tone="primary" icon="shield.fill" />
            <StatusPill label={`${Math.round(energy.remaining)}% ENERGY`} tone={energy.remaining > 50 ? "success" : energy.remaining > 20 ? "warning" : "danger"} icon="bolt.fill" />
          </View>
          <View style={styles.heroContent}>
            <View style={[styles.operatorColumn, { transform: [{ scale: operatorScale }] }]}>
              <RankCharacter title={title.title} level={level.level} reduceMotion={state.profile.reduceMotion} compact onPress={openRankAchievement} />
              <HomeFire reduceMotion={state.profile.reduceMotion} />
              <Text numberOfLines={1} style={styles.operatorPlayerName}>{state.profile.firstName.toUpperCase()}</Text>
              <Text numberOfLines={1} style={styles.operatorName}>{title.title.toUpperCase()}</Text>
            </View>
            <View style={styles.heroCopy}>
              <Text key={`motivation-headline-${forecast.outlook}-${motivationIndex}`} style={[styles.heroHeadline, { color: "#F5F9FF" }]}>{motivation.headline}</Text>
              <Text key={`motivation-detail-${forecast.outlook}-${motivationIndex}`} style={[styles.heroText, { color: "#A7B6C8" }]}>{motivation.detail}</Text>
              <View style={styles.heroStats}>
                <View>
                  <Text style={[styles.heroStatValue, { color: "#F4C95D" }]}>{formatCompactNumber(totalPower)}</Text>
                  <Text style={styles.heroStatLabel}>TOTAL POWER</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View>
                  <Text style={[styles.heroStatValue, { color: colors.primary }]}>{combo.multiplier.toFixed(2)}×</Text>
                  <Text style={styles.heroStatLabel}>ACTIVE COMBO</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.heroFooter}>
            <View style={styles.heroProgressCopy}>
              <Text style={styles.heroProgressLabel}>NEXT TITLE</Text>
              <Text style={styles.heroProgressValue}>{Math.round(title.progress * 100)}%</Text>
            </View>
            <View style={styles.heroProgressWrap}>
              <ProgressBar value={title.progress} color="#F4C95D" trackColor="#25445C" height={7} />
            </View>
          </View>
        </CommandCard>

        <View style={styles.primaryActions}>
          <CommandButton label="Deploy Mission" icon="play.fill" onPress={() => router.push("/missions?compose=1")} style={styles.deployButton} />
          <CommandButton label="Log Journal" icon="book.closed.fill" variant="secondary" onPress={() => router.push("/journal?compose=1" as never)} style={styles.journalButton} />
        </View>

        <View style={styles.metricsGrid}>
          {metricRows.map((row, rowIndex) => <View key={`metric-row-${rowIndex}`} style={styles.metricsRow}>
            {row.map((metric) => <MetricTile key={metric.id} style={styles.metricCell} label={metric.label} value={metric.value} detail={metric.detail} icon={metric.icon} accent={metric.accent} onPress={metric.onPress} />)}
          </View>)}
        </View>

        <CommandCard accent="#F4C95D" style={styles.lootCard}>
          <View style={styles.lootIconFrame}>
            <IconSymbol name="gift.fill" size={24} color="#F4C95D" />
          </View>
          <View style={styles.lootCopy}>
            <Text style={[styles.lootTitle, { color: colors.foreground }]}>Loot box protocol</Text>
            <Text style={[styles.lootDetail, { color: colors.muted }]}>Each completed mission rolls the loot chance you set in command settings for your reward vault.</Text>
          </View>
          <CommandButton label="Vault" icon="gift.fill" variant="ghost" onPress={() => router.push("/rewards" as never)} />
        </CommandCard>

        <CommandCard style={styles.progressCard} accent={colors.success}>
          <View style={styles.progressTopline}>
            <View>
              <Text style={[styles.progressTitle, { color: colors.foreground }]}>Daily mission progress</Text>
              <Text style={[styles.progressDetail, { color: colors.muted }]}>Base XP toward your command target.</Text>
            </View>
            <Text style={[styles.progressPercent, { color: colors.success }]}>{Math.round(daily.progress * 100)}%</Text>
          </View>
          <ProgressBar value={daily.progress} color={colors.success} height={10} />
        </CommandCard>

        <SectionHeader title="Territory capture" action="Mission board" onAction={() => router.push("/missions")} />
        <CommandCard accent={colors.primary} style={styles.mapCard}>
          <View style={styles.mapTopline}>
            <View>
              <Text style={[styles.mapTitle, { color: colors.foreground }]}>Subject map</Text>
              <Text style={[styles.mapDetail, { color: colors.muted }]}>Every completed mission and review captures a subject zone. Tap a zone to open its planned work.</Text>
            </View>
            <StatusPill label={`${subjectCapture.length} SUBJECT${subjectCapture.length === 1 ? "" : "S"}`} tone="primary" icon="circle.grid.cross.fill" />
          </View>
          <IndiaSubjectMap
            subjects={subjectCapture}
            accent={colors.primary}
            foreground={colors.foreground}
            muted={colors.muted}
            surface={colors.background}
            border={colors.border}
            onOpenSubject={() => router.push("/missions?filter=open" as never)}
          />
          <View style={styles.journalSignalHeader}>
            <Text style={[styles.mapDetail, { color: colors.muted }]}>JOURNAL SIGNAL · LAST 30 DAYS</Text>
            <Text style={[styles.mapSubjectValue, { color: colors.success }]}>{state.journals.length ? `${state.journals.length} logs` : "Awaiting log"}</Text>
          </View>
          <View style={styles.journalBars}>
            {journalBars.map((bar) => <View key={bar.localDate} style={[styles.journalBar, { height: Math.max(3, (bar.points / maxJournalPoints) * 28), backgroundColor: bar.points ? colors.success : colors.border }]} />)}
          </View>
        </CommandCard>

        <SectionHeader title="Pending revisions" action={pendingRevisions.length ? "Open queue" : undefined} onAction={pendingRevisions.length ? () => router.push("/revisions") : undefined} />
        {pendingRevisions.length ? (
          <View style={styles.stack}>
            {pendingRevisions.slice(0, 3).map((topic) => (
              <CommandCard key={topic.id} accent={topic.dueDate < new Date().toISOString().slice(0, 10) ? colors.error : colors.warning} style={styles.listCard}>
                <View style={styles.listLeading}>
                  <View style={[styles.listIcon, { backgroundColor: `${colors.warning}1A` }]}>
                    <IconSymbol name="arrow.clockwise" size={19} color={colors.warning} />
                  </View>
                  <View style={styles.listCopy}>
                    <Text style={[styles.listTitle, { color: colors.foreground }]} numberOfLines={1}>{topic.topic}</Text>
                    <Text style={[styles.listDetail, { color: colors.muted }]}>{topic.subject} · Day {[1, 7, 30][Math.min(topic.stage, 2)] ?? 30}</Text>
                  </View>
                </View>
                <CommandButton label="Review" variant="ghost" onPress={() => router.push(`/revisions?topic=${topic.id}`)} />
              </CommandCard>
            ))}
          </View>
        ) : (
          <EmptyCommandState icon="arrow.clockwise" title="Your revision queue is clear" detail="Log a topic in a mission to start the 1–7–30 day review cycle." action="Create mission" onAction={() => router.push("/missions?compose=1")} />
        )}

        <SectionHeader title="Active bosses" action={activeBosses.length ? "View all" : undefined} onAction={activeBosses.length ? () => router.push("/bosses") : undefined} />
        {activeBosses.length ? (
          <View style={styles.stack}>
            {activeBosses.slice(0, 2).map((boss) => {
              const progress = getBossProgress(state, boss.id);
              return (
                <CommandCard key={boss.id} accent="#F4C95D" style={styles.bossCard}>
                  <View style={styles.bossHeader}>
                    <View style={styles.listLeading}>
                      <View style={[styles.listIcon, { backgroundColor: "#F4C95D1F" }]}>
                        <IconSymbol name="trophy.fill" size={18} color="#F4C95D" />
                      </View>
                      <View style={styles.listCopy}>
                        <Text style={[styles.listTitle, { color: colors.foreground }]}>{boss.title}</Text>
                        <Text style={[styles.listDetail, { color: colors.muted }]}>{formatTimeUntil(boss.deadlineAt)}</Text>
                      </View>
                    </View>
                    <Text style={[styles.bossPercent, { color: "#F4C95D" }]}>{Math.round(progress * 100)}%</Text>
                  </View>
                  <ProgressBar value={progress} color="#F4C95D" height={7} />
                </CommandCard>
              );
            })}
          </View>
        ) : (
          <CommandCard subdued style={styles.bossEmpty}>
            <IconSymbol name="trophy.fill" size={18} color={colors.muted} />
            <Text style={[styles.bossEmptyText, { color: colors.muted }]}>No boss is active. Build a campaign from the Mission Board.</Text>
          </CommandCard>
        )}

        <CommandCard accent={state.googleSheet.phase === "synced" ? colors.success : colors.primary} style={styles.syncCard}>
          <View style={styles.listLeading}>
            <View style={[styles.listIcon, { backgroundColor: `${colors.primary}19` }]}>
              <IconSymbol name="cloud.fill" size={18} color={colors.primary} />
            </View>
            <View style={styles.listCopy}>
              <Text style={[styles.listTitle, { color: colors.foreground }]}>Google Sheet command log</Text>
              <Text style={[styles.listDetail, { color: colors.muted }]}>{syncLabel(state.googleSheet.phase, state.googleSheet.pendingOperations)}</Text>
            </View>
          </View>
          <CommandButton label={state.googleSheet.spreadsheetId ? "Status" : "Connect"} variant="ghost" onPress={() => router.push("/settings?section=sheet")} />
        </CommandCard>
      </ScrollView>
      {homeCelebration ? <CelebrationOverlay kind={homeCelebration} reduceMotion={state.profile.reduceMotion} onDone={() => setHomeCelebration(null)} /> : null}
      <RankCharacterAchievement title={title.title} level={level.level} reduceMotion={state.profile.reduceMotion} visible={showRankAchievement} onDismiss={() => setShowRankAchievement(false)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18, paddingTop: 12, paddingBottom: 30 },
  heroCard: { minHeight: 266, padding: 18, position: "relative" },
  heroGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.55 },
  gridLineVertical: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: "#2C526B" },
  gridLineHorizontal: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "#2C526B" },
  heroTopline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroContent: { flexDirection: "row", gap: 16, alignItems: "center", flex: 1, paddingVertical: 14 },
  operatorColumn: { alignItems: "center", width: 104, gap: 3 },
  operatorCore: { width: 82, height: 82, borderRadius: 41, borderWidth: 2, padding: 5, shadowOpacity: 0.45, shadowRadius: 16, elevation: 5 },
  operatorInner: { flex: 1, borderRadius: 35, alignItems: "center", justifyContent: "center" },
  operatorPlayerName: { fontSize: 13, lineHeight: 16, letterSpacing: 0.3, fontWeight: "900", color: "#F5F9FF", maxWidth: 106, textAlign: "center" },
  operatorName: { fontSize: 10, lineHeight: 13, letterSpacing: 0.85, fontWeight: "900", color: "#F4C95D", maxWidth: 108, textAlign: "center" },
  heroCopy: { flex: 1, gap: 6 },
  heroHeadline: { fontSize: 20, lineHeight: 25, fontWeight: "800", letterSpacing: -0.25 },
  heroText: { fontSize: 12, lineHeight: 17, fontWeight: "500" },
  heroStats: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 12 },
  heroStatValue: { fontSize: 22, lineHeight: 27, fontWeight: "900", letterSpacing: -0.4 },
  heroStatLabel: { fontSize: 8, lineHeight: 11, letterSpacing: 0.65, fontWeight: "800", color: "#A7B6C8" },
  heroStatDivider: { width: 1, height: 30, backgroundColor: "#31546C" },
  heroFooter: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroProgressCopy: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  heroProgressLabel: { fontSize: 9, lineHeight: 12, letterSpacing: 0.9, fontWeight: "800", color: "#A7B6C8" },
  heroProgressValue: { fontSize: 12, lineHeight: 15, fontWeight: "800", color: "#F5F9FF" },
  heroProgressWrap: { flex: 1 },
  primaryActions: { flexDirection: "row", gap: 10 },
  deployButton: { flex: 1.25 },
  journalButton: { flex: 1 },
  metricsGrid: { gap: 10, width: "100%" },
  metricsRow: { flexDirection: "row", gap: 10, width: "100%" },
  metricCell: { flex: 1, minWidth: 0, alignSelf: "stretch" },
  lootCard: { padding: 13, flexDirection: "row", alignItems: "center", gap: 10 },
  lootIconFrame: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#F4C95D1C" },
  lootCopy: { flex: 1 },
  lootTitle: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
  lootDetail: { fontSize: 11, lineHeight: 16, fontWeight: "500", marginTop: 1 },
  progressCard: { gap: 14 },
  progressTopline: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  progressTitle: { fontSize: 15, lineHeight: 20, fontWeight: "800" },
  progressDetail: { fontSize: 12, lineHeight: 16, marginTop: 2, fontWeight: "500" },
  progressPercent: { fontSize: 22, lineHeight: 27, fontWeight: "900" },
  mapCard: { gap: 12, overflow: "hidden" },
  mapTopline: { flexDirection: "row", justifyContent: "space-between", gap: 10, alignItems: "flex-start" },
  mapTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  mapDetail: { fontSize: 11, lineHeight: 15, marginTop: 2, fontWeight: "600" },
  mapTerrain: { minHeight: 118, borderRadius: 16, overflow: "hidden", backgroundColor: "#0E1D2E", padding: 14, justifyContent: "flex-end" },
  mapRing: { position: "absolute", borderWidth: 1, borderRadius: 999 },
  mapRingOne: { width: 190, height: 190, top: -96, right: -24 },
  mapRingTwo: { width: 132, height: 132, top: -72, left: -36 },
  mapNode: { borderRadius: 99, position: "absolute", shadowOpacity: 0.6, shadowRadius: 7, elevation: 4 },
  mapNodeDynamic: { shadowColor: "#A78BFA", borderWidth: 2, borderColor: "#FFFFFF55" },
  mapSubjects: { gap: 6 },
  mapSubjectPressable: { minHeight: 35, paddingVertical: 4, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  mapSubjectCopy: { flex: 1, minWidth: 0 },
  mapSubjectName: { fontSize: 12, lineHeight: 16, fontWeight: "800" },
  mapSubjectDetail: { fontSize: 10, lineHeight: 14, marginTop: 1, fontWeight: "600" },
  mapSubjectValue: { fontSize: 11, lineHeight: 15, fontWeight: "900" },
  journalSignalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  journalBars: { height: 30, flexDirection: "row", alignItems: "flex-end", gap: 2 },
  journalBar: { flex: 1, borderRadius: 3, minWidth: 2 },
  stack: { gap: 9 },
  listCard: { padding: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  listLeading: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10, minWidth: 0 },
  listIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  listCopy: { flex: 1, minWidth: 0 },
  listTitle: { fontSize: 14, lineHeight: 19, fontWeight: "800" },
  listDetail: { fontSize: 11, lineHeight: 15, fontWeight: "500", marginTop: 1 },
  bossCard: { padding: 13, gap: 10 },
  bossHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  bossPercent: { fontSize: 15, lineHeight: 18, fontWeight: "900" },
  bossEmpty: { padding: 14, flexDirection: "row", alignItems: "center", gap: 9 },
  bossEmptyText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  syncCard: { padding: 13, flexDirection: "row", alignItems: "center", gap: 10 },
});
