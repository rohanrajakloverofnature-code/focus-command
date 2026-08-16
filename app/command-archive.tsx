import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { BarsChart, LineTrendChart, type ChartPoint } from "@/components/focus-charts";
import { CommandCard, IconAction, LoadingScreen, ScreenTitle, SectionHeader, TapFeedback } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFocusCommandActions, useFocusCommandReady, useFocusCommandSelector } from "@/lib/focus-command";
import {
  MONTHLY_ARCHIVE_METRICS,
  MONTHLY_ARCHIVE_REVISION_PROGRESS_FILTERS,
  filterMonthlyArchiveStudiedTopics,
  filterMonthlyArchiveStudiedTopicsByProgress,
  getMonthlyArchiveMonthComparison,
  getMonthlyArchiveMetricLabel,
  getMonthlyArchiveMetricSeries,
  getMonthlyArchiveMetricValue,
  getMonthlyArchiveSubjectLifetimeWindows,
  getMonthlyArchiveLifetimeWindows,
  getMonthlyArchiveStudiedTopics,
  getMonthlyCommandArchive,
  type ArchiveTopicPeriod,
  type MonthlyArchiveMetric,
  type MonthlyCommandArchiveMonth,
  type MonthlyCommandArchiveYear,
  type MonthlyArchiveRevisionProgressFilter,
  type MonthlyArchiveStudiedTopic,
} from "@/lib/monthly-command-archive";

const METRIC_ACCENTS: Record<MonthlyArchiveMetric, string> = {
  growth: "#A78BFA",
  xp: "#F4C95D",
  gold: "#FFAA4C",
  time: "#55B7FF",
  missions: "#49D17D",
  focus: "#5DD6C0",
  clarity: "#A78BFA",
  motivation: "#F27DAA",
  feeling: "#49D17D",
  subjects: "#55B7FF",
  distractions: "#FF6B6B",
};

function formatHours(milliseconds: number) {
  return `${(milliseconds / 3_600_000).toFixed(1)} h`;
}

function formatRating(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)} / 5`;
}

function formatMetricValue(month: MonthlyCommandArchiveMonth, metric: MonthlyArchiveMetric) {
  const value = getMonthlyArchiveMetricValue(month, metric);
  if (["focus", "clarity", "motivation", "feeling"].includes(metric) && value === 0) return "—";
  if (metric === "growth") return `${Math.round(value)} / 100`;
  if (metric === "xp") return `${Math.round(value)} XP`;
  if (metric === "gold") return `${Math.round(value)} gold`;
  if (metric === "time") return `${value.toFixed(1)} h`;
  return `${Math.round(value)}`;
}

function MonthMetric({ label, value, accent, onPress }: { label: string; value: string; accent: string; onPress?: () => void }) {
  const colors = useColors();
  const content = <View style={[styles.monthMetric, { borderColor: `${accent}66`, backgroundColor: colors.background }]}>
    <Text style={[styles.monthMetricValue, { color: accent }]}>{value}</Text>
    <Text style={[styles.monthMetricLabel, { color: colors.muted }]}>{label}</Text>
  </View>;
  return <View style={styles.monthMetricSlot}>{onPress ? <TapFeedback style={styles.monthMetricTap} onPress={onPress} accessibilityLabel={`Open ${label.toLowerCase()} activity history`}>{content}</TapFeedback> : content}</View>;
}

function YearSelector({ years, activeYear, onSelect }: { years: MonthlyCommandArchiveYear[]; activeYear: number; onSelect: (year: number) => void }) {
  const colors = useColors();
  return <FlatList
    horizontal
    data={years}
    keyExtractor={(item) => String(item.year)}
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.yearSelector}
    renderItem={({ item }) => {
      const active = item.year === activeYear;
      return <Pressable accessibilityRole="button" accessibilityLabel={`Show ${item.year} command archive`} onPress={() => onSelect(item.year)} style={({ pressed }) => [styles.yearChip, { borderColor: active ? "#A78BFA" : colors.border, backgroundColor: active ? "#A78BFA1F" : colors.background, opacity: pressed ? 0.7 : 1 }]}>
        <Text style={[styles.yearChipText, { color: active ? "#A78BFA" : colors.foreground }]}>{item.year}</Text>
      </Pressable>;
    }}
  />;
}

function ArchiveEmptyState() {
  const colors = useColors();
  return <CommandCard accent="#A78BFA" style={styles.emptyCard}>
    <Text style={[styles.cardTitle, { color: colors.foreground }]}>Your archive will begin automatically</Text>
    <Text style={[styles.detail, { color: colors.muted }]}>When the first mission, reflection, progression award, planned due date, or distraction record is saved in a real local month, that month and year will appear here. Nothing needs to be set up manually.</Text>
  </CommandCard>;
}

function MonthTile({ month, onOpen }: { month: MonthlyCommandArchiveMonth; onOpen: () => void }) {
  const colors = useColors();
  return <TapFeedback disabled={!month.hasData} onPress={onOpen} style={styles.monthTileTap} accessibilityLabel={month.hasData ? `Open ${month.label} command record` : `${month.label} has no command data`}>
    <View style={[styles.monthTile, { borderColor: month.hasData ? "#A78BFA66" : colors.border, backgroundColor: month.hasData ? "#A78BFA12" : colors.background }]}>
      <Text style={[styles.monthTileLabel, { color: month.hasData ? colors.foreground : colors.muted }]}>{month.shortLabel}</Text>
      <Text style={[styles.monthTileValue, { color: month.hasData ? "#A78BFA" : colors.muted }]}>{month.hasData ? `${month.growthScore}` : "—"}</Text>
      <Text style={[styles.monthTileCaption, { color: colors.muted }]}>{month.hasData ? "GROWTH" : "NO DATA"}</Text>
    </View>
  </TapFeedback>;
}

function ArchiveYearView({ year, years, onSelectYear, onOpenMonth, onOpenTopics, onOpenLifetimeTopics, onOpenComparison, lifetimeWindows, activeLifetimeWindow, onSelectLifetimeWindow, lifetimeSubjects, activeLifetimeSubject, onSelectLifetimeSubject }: { year: MonthlyCommandArchiveYear; years: MonthlyCommandArchiveYear[]; onSelectYear: (year: number) => void; onOpenMonth: (key: string) => void; onOpenTopics: () => void; onOpenLifetimeTopics: () => void; onOpenComparison: () => void; lifetimeWindows: ReturnType<typeof getMonthlyArchiveLifetimeWindows>; activeLifetimeWindow: number; onSelectLifetimeWindow: (index: number) => void; lifetimeSubjects: string[]; activeLifetimeSubject: string; onSelectLifetimeSubject: (subject: string) => void }) {
  const colors = useColors();
  const growthPoints = useMemo<ChartPoint[]>(() => year.months.map((month, index) => ({
    label: index === 0 || index === 5 || index === 11 ? month.shortLabel : "",
    value: month.growthScore,
  })), [year]);
  const completedMonths = year.months.filter((month) => month.hasData).length;
  const lifetimeWindow = lifetimeWindows[activeLifetimeWindow] ?? lifetimeWindows[lifetimeWindows.length - 1] ?? null;
  const lifetimePoints = useMemo<ChartPoint[]>(() => lifetimeWindow?.points.map((point) => ({ label: point.label, value: point.value })) ?? [], [lifetimeWindow]);
  const subjectLensOptions = useMemo(() => ["", ...lifetimeSubjects], [lifetimeSubjects]);
  const subjectFocused = Boolean(activeLifetimeSubject);

  return <FlatList
    data={year.months}
    numColumns={3}
    key={`months-${year.year}`}
    keyExtractor={(item) => item.key}
    renderItem={({ item }) => <MonthTile month={item} onOpen={() => onOpenMonth(item.key)} />}
    showsVerticalScrollIndicator={false}
    contentContainerStyle={styles.yearContent}
    ListHeaderComponent={<>
      <ScreenTitle eyebrow="Lifetime command record" title="Monthly command archive" detail="Read-only local history. A real new month or year appears automatically when its first saved record exists." />
      {lifetimeWindow ? <CommandCard accent="#F4C95D" style={styles.lifetimeCard}>
        <View style={styles.lifetimeHeading}>
          <View style={styles.growthCopy}>
            <Text style={[styles.eyebrow, { color: "#F4C95D" }]}>{subjectFocused ? "SUBJECT FOCUS TRAJECTORY" : "LIFETIME GROWTH TRAJECTORY"}</Text>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{subjectFocused ? activeLifetimeSubject : "Continuous command growth"}</Text>
            <Text style={[styles.detail, { color: colors.muted }]}>{subjectFocused ? "A transparent activity index from this subject’s real completed runs, earned XP, and invested time. Reflection and distraction data are not attributed to one subject." : `Every real calendar month from ${lifetimeWindow.points[0]?.key} to ${lifetimeWindow.points[lifetimeWindow.points.length - 1]?.key}. Months without records remain zero so the timeline never fabricates progress.`}</Text>
          </View>
          <View style={[styles.growthScore, { borderColor: "#F4C95D66", backgroundColor: "#F4C95D12" }]}>
            <Text style={[styles.growthScoreValue, { color: "#F4C95D" }]}>{lifetimeWindows.length}</Text>
            <Text style={[styles.growthScoreLabel, { color: colors.muted }]}>WINDOW{lifetimeWindows.length === 1 ? "" : "S"}</Text>
          </View>
        </View>
        <FlatList horizontal data={subjectLensOptions} keyExtractor={(item) => item || "all-subjects"} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectLensSelector} renderItem={({ item }) => {
          const active = item === activeLifetimeSubject;
          const label = item || "All subjects";
          return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={`Show ${label.toLowerCase()} lifetime trajectory`} onPress={() => onSelectLifetimeSubject(item)} style={({ pressed }) => [styles.subjectLensChip, { borderColor: active ? "#F4C95D" : colors.border, backgroundColor: active ? "#F4C95D1F" : colors.background, opacity: pressed ? 0.7 : 1 }]}><Text style={[styles.metricChipText, { color: active ? "#F4C95D" : colors.foreground }]}>{label}</Text></Pressable>;
        }} />
        {lifetimeWindows.length > 1 ? <FlatList horizontal data={lifetimeWindows} keyExtractor={(item) => item.key} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lifetimeSelector} renderItem={({ item, index }) => <Pressable accessibilityRole="button" accessibilityState={{ selected: index === activeLifetimeWindow }} accessibilityLabel={`Show lifetime trajectory ${item.label}`} onPress={() => onSelectLifetimeWindow(index)} style={({ pressed }) => [styles.lifetimeChip, { borderColor: index === activeLifetimeWindow ? "#F4C95D" : colors.border, backgroundColor: index === activeLifetimeWindow ? "#F4C95D1F" : colors.background, opacity: pressed ? 0.7 : 1 }]}><Text style={[styles.metricChipText, { color: index === activeLifetimeWindow ? "#F4C95D" : colors.foreground }]}>{item.label}</Text></Pressable>} /> : null}
        <LineTrendChart points={lifetimePoints} color="#F4C95D" height={146} accessibilityLabel={`${lifetimeWindow.label} ${subjectFocused ? `${activeLifetimeSubject} subject focus` : "continuous lifetime command growth"} line chart`} />
      </CommandCard> : null}
      <TapFeedback onPress={onOpenLifetimeTopics} accessibilityLabel="Open lifetime revision overview">
        <View style={[styles.reviewEntry, styles.lifetimeReviewEntry, { borderColor: "#F4C95D66", backgroundColor: "#F4C95D12" }]}> 
          <View style={styles.reviewEntryCopy}><Text style={[styles.subjectTitle, { color: colors.foreground }]}>Lifetime revision overview</Text><Text style={[styles.detail, { color: colors.muted }]}>Open every real revision topic across all years, with its current Day 1, Day 7, Day 30, or completed status.</Text></View>
          <Text style={[styles.reviewEntryAction, { color: "#F4C95D" }]}>OPEN</Text>
        </View>
      </TapFeedback>
      <CommandCard accent="#A78BFA" style={styles.growthCard}>
        <View style={styles.growthHeading}>
          <View style={styles.growthCopy}>
            <Text style={[styles.eyebrow, { color: "#A78BFA" }]}>{year.year} GROWTH TRAJECTORY</Text>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Month-by-month command growth</Text>
            <Text style={[styles.detail, { color: colors.muted }]}>{completedMonths} recorded month{completedMonths === 1 ? "" : "s"} · Score uses available XP, active focus time, reflection traits, subject breadth, and inverse logged distraction.</Text>
          </View>
          <View style={[styles.growthScore, { borderColor: "#A78BFA66", backgroundColor: "#A78BFA12" }]}>
            <Text style={[styles.growthScoreValue, { color: "#A78BFA" }]}>{Math.max(...year.months.map((month) => month.growthScore))}</Text>
            <Text style={[styles.growthScoreLabel, { color: colors.muted }]}>PEAK</Text>
          </View>
        </View>
        <LineTrendChart points={growthPoints} color="#A78BFA" height={146} accessibilityLabel={`${year.year} monthly command growth line chart`} />
      </CommandCard>
      <SectionHeader title="Select command year" />
      <YearSelector years={years} activeYear={year.year} onSelect={onSelectYear} />
      <SectionHeader title="Yearly revision overview" />
      <TapFeedback onPress={onOpenTopics} accessibilityLabel={`Open ${year.year} revision topics and cadence`}>
        <View style={[styles.reviewEntry, { borderColor: "#5DD6C066", backgroundColor: "#5DD6C012" }]}> 
          <View style={styles.reviewEntryCopy}><Text style={[styles.subjectTitle, { color: colors.foreground }]}>Revision topics and cadence</Text><Text style={[styles.detail, { color: colors.muted }]}>Open real revision topics logged in {year.year}, grouped by subject, with their current cadence progress.</Text></View>
          <Text style={[styles.reviewEntryAction, { color: "#5DD6C0" }]}>OPEN</Text>
        </View>
      </TapFeedback>
      <TapFeedback onPress={onOpenComparison} accessibilityLabel="Compare two recorded command months">
        <View style={[styles.reviewEntry, styles.comparisonReviewEntry, { borderColor: "#F4C95D66", backgroundColor: "#F4C95D12" }]}> 
          <View style={styles.reviewEntryCopy}><Text style={[styles.subjectTitle, { color: colors.foreground }]}>Compare recorded months</Text><Text style={[styles.detail, { color: colors.muted }]}>Choose any two real months for a read-only side-by-side view of command, reflection, subject, and revision context.</Text></View>
          <Text style={[styles.reviewEntryAction, { color: "#F4C95D" }]}>COMPARE</Text>
        </View>
      </TapFeedback>
      <SectionHeader title={`${year.year} monthly record`} />
      <Text style={[styles.gridIntro, { color: colors.muted }]}>Tap any recorded month to open its full command data. Empty months remain visible so each year is easy to scan.</Text>
    </>}
  />;
}

function MetricSelector({ selectedMetric, onSelect }: { selectedMetric: MonthlyArchiveMetric; onSelect: (metric: MonthlyArchiveMetric) => void }) {
  const colors = useColors();
  return <FlatList
    horizontal
    data={MONTHLY_ARCHIVE_METRICS}
    keyExtractor={(item) => item}
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.metricSelector}
    renderItem={({ item }) => {
      const active = selectedMetric === item;
      const accent = METRIC_ACCENTS[item];
      return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={`Show ${getMonthlyArchiveMetricLabel(item)} chart`} onPress={() => onSelect(item)} style={({ pressed }) => [styles.metricChip, { borderColor: active ? accent : colors.border, backgroundColor: active ? `${accent}1F` : colors.background, opacity: pressed ? 0.7 : 1 }]}>
        <Text style={[styles.metricChipText, { color: active ? accent : colors.foreground }]}>{getMonthlyArchiveMetricLabel(item)}</Text>
      </Pressable>;
    }}
  />;
}

function ArchiveMonthView({ month, selectedMetric, onSelectMetric, onBack, onOpenTopics }: { month: MonthlyCommandArchiveMonth; selectedMetric: MonthlyArchiveMetric; onSelectMetric: (metric: MonthlyArchiveMetric) => void; onBack: () => void; onOpenTopics: () => void }) {
  const colors = useColors();
  const router = useRouter();
  const accent = METRIC_ACCENTS[selectedMetric];
  const series = useMemo(() => getMonthlyArchiveMetricSeries(month, selectedMetric), [month, selectedMetric]);
  const useLine = ["growth", "focus", "clarity", "motivation", "feeling"].includes(selectedMetric);

  return <FlatList
    data={month.subjectBreakdown}
    keyExtractor={(item) => item.label}
    renderItem={({ item }) => <TapFeedback onPress={() => router.push({ pathname: "/missions", params: { filter: "completed", archiveMonth: month.key, archiveSubject: item.label } })} accessibilityLabel={`Open ${item.label} history for ${month.label}`}><View style={[styles.subjectRow, { borderColor: colors.border }]}>
      <View style={styles.subjectCopy}><Text style={[styles.subjectTitle, { color: colors.foreground }]} numberOfLines={1}>{item.label}</Text><Text style={[styles.detail, { color: colors.muted }]}>{item.completedMissions} completed mission{item.completedMissions === 1 ? "" : "s"}</Text></View>
      <Text style={[styles.subjectValue, { color: "#55B7FF" }]}>{formatHours(item.durationMs)}</Text>
    </View></TapFeedback>}
    showsVerticalScrollIndicator={false}
    contentContainerStyle={styles.monthContent}
    ListEmptyComponent={<CommandCard accent="#55B7FF" style={styles.emptySubjectCard}><Text style={[styles.detail, { color: colors.muted }]}>No completed subject time was recorded in this month.</Text></CommandCard>}
    ListHeaderComponent={<>
      <ScreenTitle eyebrow="Monthly command record" title={month.label} detail="Every value below is rebuilt from your existing local records. Switching a dimension changes only this view." right={<IconAction icon="xmark" label="Close command archive" onPress={onBack} />} />
      <TapFeedback onPress={onBack} accessibilityLabel={`Return to ${month.year} command archive`}>
        <View style={[styles.returnControl, { borderColor: colors.border, backgroundColor: colors.background }]}><Text style={[styles.returnControlText, { color: colors.primary }]}>Return to {month.year} command archive</Text></View>
      </TapFeedback>
      <CommandCard accent={accent} style={styles.metricChartCard}>
        <Text style={[styles.eyebrow, { color: accent }]}>{getMonthlyArchiveMetricLabel(selectedMetric).toUpperCase()} BY DAY</Text>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{formatMetricValue(month, selectedMetric)}</Text>
        <Text style={[styles.detail, { color: colors.muted }]}>Choose a dimension to inspect this month without modifying your history.</Text>
        <MetricSelector selectedMetric={selectedMetric} onSelect={onSelectMetric} />
        {useLine
          ? <LineTrendChart points={series} color={accent} height={150} accessibilityLabel={`${month.label} ${getMonthlyArchiveMetricLabel(selectedMetric)} daily line chart`} />
          : <BarsChart points={series} color={accent} height={150} accessibilityLabel={`${month.label} ${getMonthlyArchiveMetricLabel(selectedMetric)} daily bar chart`} />}
      </CommandCard>
      <SectionHeader title="Command summary" />
      <View style={styles.monthMetrics}>
        <MonthMetric label="XP EARNED" value={`${Math.round(month.xpEarned)}`} accent="#F4C95D" onPress={() => router.push({ pathname: "/missions", params: { filter: "completed", archiveMonth: month.key } })} />
        <MonthMetric label="GOLD EARNED" value={`${Math.round(month.goldEarned)}`} accent="#FFAA4C" onPress={() => router.push({ pathname: "/missions", params: { filter: "completed", archiveMonth: month.key } })} />
        <MonthMetric label="INVESTED" value={formatHours(month.investedMs)} accent="#55B7FF" onPress={() => router.push({ pathname: "/missions", params: { filter: "completed", archiveMonth: month.key } })} />
        <MonthMetric label="COMPLETED" value={`${month.completedMissions}`} accent="#49D17D" onPress={() => router.push({ pathname: "/missions", params: { filter: "completed", archiveMonth: month.key } })} />
      </View>
      <SectionHeader title="Reflection traits" />
      <TapFeedback onPress={() => router.push({ pathname: "/missions", params: { filter: "completed", archiveMonth: month.key } })} accessibilityLabel={`Open ${month.label} reflection activity history`}><CommandCard accent="#5DD6C0" style={styles.traitsCard}>
        <View style={styles.monthMetrics}>
          <MonthMetric label="FOCUS" value={formatRating(month.averageFocus)} accent="#5DD6C0" />
          <MonthMetric label="CLARITY" value={formatRating(month.averageClarity)} accent="#A78BFA" />
          <MonthMetric label="MOTIVATION" value={formatRating(month.averageMotivation)} accent="#F27DAA" />
          <MonthMetric label="DEBRIEFS" value={`${month.reflectionCount}`} accent="#49D17D" />
        </View>
        <Text style={[styles.detail, { color: colors.muted }]}>Feeling after: {month.mostCommonFeeling ?? "No pattern yet"} · Energy change: {month.energyShift === null ? "—" : `${month.energyShift >= 0 ? "+" : ""}${month.energyShift.toFixed(1)}`}</Text>
      </CommandCard></TapFeedback>
      <SectionHeader title="Subjects map" />
    </>}
    ListFooterComponent={<>
      <SectionHeader title="Focus friction" />
      <CommandCard accent="#FF6B6B" style={styles.frictionCard}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{month.distractionCount ? `${month.distractionCount} logged distraction${month.distractionCount === 1 ? "" : "s"}` : "No logged distractions"}</Text>
        <Text style={[styles.detail, { color: colors.muted }]}>{month.distractionCount ? `Most common: ${month.topDistractionCategory ?? "No category"}. The growth score only uses the inverse of logged disruptions; it never invents unlogged distraction.` : "No distraction data was recorded during this month."}</Text>
      </CommandCard>
      <CommandCard accent="#A78BFA" style={styles.transparencyCard}>
        <Text style={[styles.eyebrow, { color: "#A78BFA" }]}>LOCAL ARCHIVE GUARANTEE</Text>
        <Text style={[styles.detail, { color: colors.muted }]}>This archive stores no duplicate history. It rebuilds from existing mission completions, rewards, reflections, planned due dates, and distraction records already covered by the Offline Backup File. After a restore, the same recorded months reappear automatically.</Text>
      </CommandCard>
      <SectionHeader title="Monthly revision review" />
      <TapFeedback onPress={onOpenTopics} accessibilityLabel={`Open ${month.label} revision topics and cadence`}>
        <View style={[styles.reviewEntry, { borderColor: "#A78BFA66", backgroundColor: "#A78BFA12" }]}> 
          <View style={styles.reviewEntryCopy}><Text style={[styles.subjectTitle, { color: colors.foreground }]}>Revision activity this month</Text><Text style={[styles.detail, { color: colors.muted }]}>Open every real topic action completed in this month, with its exact revision phase and date.</Text></View>
          <Text style={[styles.reviewEntryAction, { color: "#A78BFA" }]}>OPEN</Text>
        </View>
      </TapFeedback>
    </>}
  />;
}

function ArchiveTopicListView({ topics, period, searchQuery, progressFilter, onSearchChange, onProgressFilterChange, onBack }: { topics: MonthlyArchiveStudiedTopic[]; period: ArchiveTopicPeriod; searchQuery: string; progressFilter: MonthlyArchiveRevisionProgressFilter; onSearchChange: (value: string) => void; onProgressFilterChange: (value: MonthlyArchiveRevisionProgressFilter) => void; onBack: () => void }) {
  const colors = useColors();
  const router = useRouter();
  const title = period.monthKey ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${period.monthKey}-01T12:00:00Z`)) : period.lifetime ? "Lifetime revision overview" : `${period.year} yearly revision overview`;
  const searchable = Boolean((period.year || period.lifetime) && !period.monthKey);
  const progressLabel = (phase: MonthlyArchiveStudiedTopic["revisionPhase"]) => MONTHLY_ARCHIVE_REVISION_PROGRESS_FILTERS.find((filter) => filter.id === phase)?.label ?? "Seed Sown";
  return <FlatList
    data={topics}
    keyExtractor={(item) => item.key}
    showsVerticalScrollIndicator={false}
    contentContainerStyle={styles.monthContent}
    renderItem={({ item }) => <TapFeedback onPress={() => router.push({ pathname: "/revisions", params: { topic: item.revisionTopicId! } })} accessibilityLabel={`Open revision for ${item.topic}`}>
      <View style={[styles.topicRow, { borderColor: colors.border, backgroundColor: colors.background }]}> 
        <View style={styles.subjectCopy}><Text style={[styles.eyebrow, { color: "#55B7FF" }]}>{item.subject.toUpperCase()}</Text><Text style={[styles.subjectTitle, { color: colors.foreground }]}>{item.topic}</Text><Text style={[styles.detail, { color: colors.muted }]}>{item.actionLabel} · {item.actionDate}</Text></View>
        <View style={styles.topicProgress}><Text style={[styles.topicProgressValue, { color: "#5DD6C0" }]}>{item.revisionCompletionPercent}%</Text><Text style={[styles.topicProgressLabel, { color: colors.muted }]}>{progressLabel(item.revisionPhase).toUpperCase()}</Text></View>
      </View>
    </TapFeedback>}
    ListEmptyComponent={<CommandCard accent="#A78BFA" style={styles.emptySubjectCard}><Text style={[styles.detail, { color: colors.muted }]}>{searchable && (searchQuery.trim() || progressFilter !== "all") ? "No revision activity matches this search or phase filter." : "No revision activity was recorded for this period."}</Text></CommandCard>}
    ListHeaderComponent={<><ScreenTitle eyebrow="Read-only revision view" title={title} detail="Each row is one real action: Seed Sown, Emerging, Developing, or Matured, preserved without changing the revision cadence." right={<IconAction icon="xmark" label="Close topic review" onPress={onBack} />} /><TapFeedback onPress={onBack} accessibilityLabel="Return to command archive"><View style={[styles.returnControl, { borderColor: colors.border, backgroundColor: colors.background }]}><Text style={[styles.returnControlText, { color: colors.primary }]}>Return to command archive</Text></View></TapFeedback>{searchable ? <><View style={[styles.topicSearch, { borderColor: colors.border, backgroundColor: colors.background }]}><Text style={[styles.eyebrow, { color: "#55B7FF" }]}>{period.lifetime ? "SEARCH LIFETIME" : "SEARCH THIS YEAR"}</Text><TextInput value={searchQuery} onChangeText={onSearchChange} placeholder="Topic or subject" placeholderTextColor={colors.muted} returnKeyType="done" accessibilityLabel={`Search ${period.lifetime ? "lifetime" : "yearly"} revision topics by topic or subject`} style={[styles.topicSearchInput, { color: colors.foreground }]} /></View><View style={styles.progressFilterBlock}><Text style={[styles.eyebrow, { color: "#5DD6C0" }]}>FILTER PHASE</Text><FlatList horizontal data={MONTHLY_ARCHIVE_REVISION_PROGRESS_FILTERS} keyExtractor={(item) => item.id} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.revisionProgressSelector} renderItem={({ item }) => { const active = item.id === progressFilter; return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={`Filter revision activity by ${item.label}`} onPress={() => onProgressFilterChange(item.id)} style={({ pressed }) => [styles.revisionProgressChip, { borderColor: active ? "#5DD6C0" : colors.border, backgroundColor: active ? "#5DD6C01F" : colors.background, opacity: pressed ? 0.7 : 1 }]}><Text style={[styles.metricChipText, { color: active ? "#5DD6C0" : colors.foreground }]}>{item.label}</Text></Pressable>; }} /></View></> : null}<SectionHeader title="Revision activity" /></>}
  />;
}

function formatComparisonValue(metric: string, value: number, unavailable: boolean) {
  if (unavailable) return "—";
  if (metric === "time") return `${value.toFixed(1)} h`;
  if (metric === "xp") return `${Math.round(value)} XP`;
  if (metric === "gold") return `${Math.round(value)} gold`;
  if (["focus", "clarity", "motivation", "feeling"].includes(metric)) return `${value.toFixed(1)} / 5`;
  return `${Math.round(value)}`;
}

function ArchiveMonthComparisonView({ months, topics, firstKey, secondKey, onSelectFirst, onSelectSecond, onBack }: { months: MonthlyCommandArchiveMonth[]; topics: MonthlyArchiveStudiedTopic[]; firstKey: string; secondKey: string; onSelectFirst: (key: string) => void; onSelectSecond: (key: string) => void; onBack: () => void }) {
  const colors = useColors();
  const first = months.find((month) => month.key === firstKey) ?? months[0];
  const second = months.find((month) => month.key === secondKey) ?? months[0];
  const comparison = useMemo(() => getMonthlyArchiveMonthComparison(first, second), [first, second]);
  const firstTopics = useMemo(() => topics.filter((topic) => topic.firstMonthKey === first.key), [first.key, topics]);
  const secondTopics = useMemo(() => topics.filter((topic) => topic.firstMonthKey === second.key), [second.key, topics]);
  const topicSummary = (items: MonthlyArchiveStudiedTopic[]) => items.length ? `${items.slice(0, 3).map((item) => `${item.topic} (${item.revisionCompletionPercent === null ? "not enrolled" : `${item.revisionCompletionPercent}%`})`).join(" · ")}${items.length > 3 ? ` · +${items.length - 3} more` : ""}` : "No newly studied topics";
  const traitUnavailable = (metric: string, month: MonthlyCommandArchiveMonth) => metric === "focus" ? month.averageFocus === null : metric === "clarity" ? month.averageClarity === null : metric === "motivation" ? month.averageMotivation === null : metric === "feeling" ? month.mostCommonFeeling === null : false;

  return <FlatList
    data={comparison.metrics}
    keyExtractor={(item) => item.key}
    showsVerticalScrollIndicator={false}
    contentContainerStyle={styles.monthContent}
    renderItem={({ item }) => {
      const firstUnavailable = traitUnavailable(item.key, first);
      const secondUnavailable = traitUnavailable(item.key, second);
      const differenceUnavailable = firstUnavailable || secondUnavailable;
      return <View style={[styles.comparisonMetricRow, { borderColor: colors.border, backgroundColor: colors.background }]}><Text style={[styles.comparisonMetricLabel, { color: colors.muted }]}>{item.label.toUpperCase()}</Text><Text style={[styles.comparisonMetricValue, { color: colors.foreground }]}>{formatComparisonValue(item.key, item.firstValue, firstUnavailable)}</Text><Text style={[styles.comparisonMetricValue, { color: colors.foreground }]}>{formatComparisonValue(item.key, item.secondValue, secondUnavailable)}</Text><Text style={[styles.comparisonMetricDelta, { color: differenceUnavailable ? colors.muted : item.delta > 0 ? "#49D17D" : item.delta < 0 ? "#FF6B6B" : colors.muted }]}>{differenceUnavailable ? "—" : `${item.delta > 0 ? "+" : ""}${formatComparisonValue(item.key, item.delta, false)}`}</Text></View>;
    }}
    ListHeaderComponent={<><ScreenTitle eyebrow="Read-only command review" title="Compare recorded months" detail="Values are rebuilt from existing local records. Changing a selector never edits either month." right={<IconAction icon="xmark" label="Close month comparison" onPress={onBack} />} /><TapFeedback onPress={onBack} accessibilityLabel="Return to command archive"><View style={[styles.returnControl, { borderColor: colors.border, backgroundColor: colors.background }]}><Text style={[styles.returnControlText, { color: colors.primary }]}>Return to command archive</Text></View></TapFeedback><CommandCard accent="#F4C95D" style={styles.comparisonCard}><Text style={[styles.eyebrow, { color: "#F4C95D" }]}>SELECT TWO RECORDED MONTHS</Text><FlatList horizontal data={months} keyExtractor={(item) => `first-${item.key}`} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.comparisonSelector} renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityState={{ selected: item.key === first.key }} accessibilityLabel={`Use ${item.label} as the first comparison month`} onPress={() => onSelectFirst(item.key)} style={({ pressed }) => [styles.comparisonChip, { borderColor: item.key === first.key ? "#A78BFA" : colors.border, backgroundColor: item.key === first.key ? "#A78BFA1F" : colors.background, opacity: pressed ? 0.7 : 1 }]}><Text style={[styles.metricChipText, { color: item.key === first.key ? "#A78BFA" : colors.foreground }]}>{item.label}</Text></Pressable>} /><FlatList horizontal data={months} keyExtractor={(item) => `second-${item.key}`} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.comparisonSelector} renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityState={{ selected: item.key === second.key }} accessibilityLabel={`Use ${item.label} as the second comparison month`} onPress={() => onSelectSecond(item.key)} style={({ pressed }) => [styles.comparisonChip, { borderColor: item.key === second.key ? "#F4C95D" : colors.border, backgroundColor: item.key === second.key ? "#F4C95D1F" : colors.background, opacity: pressed ? 0.7 : 1 }]}><Text style={[styles.metricChipText, { color: item.key === second.key ? "#F4C95D" : colors.foreground }]}>{item.label}</Text></Pressable>} /></CommandCard><SectionHeader title="Command differences" /><View style={[styles.comparisonHeader, { borderColor: colors.border }]}><Text style={[styles.comparisonHeaderLabel, { color: colors.muted }]}>METRIC</Text><Text style={[styles.comparisonHeaderValue, { color: "#A78BFA" }]} numberOfLines={1}>{first.shortLabel}</Text><Text style={[styles.comparisonHeaderValue, { color: "#F4C95D" }]} numberOfLines={1}>{second.shortLabel}</Text><Text style={[styles.comparisonHeaderValue, { color: colors.muted }]}>CHANGE</Text></View></>}
    ListFooterComponent={<><SectionHeader title="Reflection context" /><CommandCard accent="#5DD6C0" style={styles.comparisonContextCard}><Text style={[styles.detail, { color: colors.muted }]}>{first.label}: Feeling {first.mostCommonFeeling ?? "unavailable"} · Energy {first.energyShift === null ? "unavailable" : `${first.energyShift >= 0 ? "+" : ""}${first.energyShift.toFixed(1)}`}</Text><Text style={[styles.detail, { color: colors.muted }]}>{second.label}: Feeling {second.mostCommonFeeling ?? "unavailable"} · Energy {second.energyShift === null ? "unavailable" : `${second.energyShift >= 0 ? "+" : ""}${second.energyShift.toFixed(1)}`}</Text></CommandCard><SectionHeader title="Subject distribution" /><View style={styles.comparisonSubjects}>{comparison.subjects.length ? comparison.subjects.map((subject) => <View key={subject.label} style={[styles.comparisonSubjectRow, { borderColor: colors.border, backgroundColor: colors.background }]}><View style={styles.subjectCopy}><Text style={[styles.subjectTitle, { color: colors.foreground }]}>{subject.label}</Text><Text style={[styles.detail, { color: colors.muted }]}>{subject.firstCompletedMissions} → {subject.secondCompletedMissions} completed run{subject.secondCompletedMissions === 1 ? "" : "s"}</Text></View><Text style={[styles.subjectValue, { color: "#55B7FF" }]}>{formatHours(subject.firstInvestedMs)} → {formatHours(subject.secondInvestedMs)}</Text></View>) : <CommandCard accent="#55B7FF" style={styles.emptySubjectCard}><Text style={[styles.detail, { color: colors.muted }]}>No subject activity was recorded in either selected month.</Text></CommandCard>}</View><SectionHeader title="Topics and revision context" /><CommandCard accent="#A78BFA" style={styles.comparisonContextCard}><Text style={[styles.detail, { color: colors.muted }]}>{first.label}: {topicSummary(firstTopics)}</Text><Text style={[styles.detail, { color: colors.muted }]}>{second.label}: {topicSummary(secondTopics)}</Text></CommandCard></>}
  />;
}

export default function CommandArchiveScreen() {
  const router = useRouter();
  const ready = useFocusCommandReady();
  const { getCurrentState } = useFocusCommandActions();
  useFocusCommandSelector((state) => ({
    profile: state.profile,
    missions: state.missions,
    missionCompletions: state.missionCompletions,
    reflections: state.reflections,
    progression: state.progression,
    transactions: state.transactions,
    distractionLogs: state.distractionLogs,
    srsTopics: state.srsTopics,
  }), (left, right) => left.profile === right.profile
    && left.missions === right.missions
    && left.missionCompletions === right.missionCompletions
    && left.reflections === right.reflections
    && left.progression === right.progression
    && left.transactions === right.transactions
    && left.distractionLogs === right.distractionLogs
    && left.srsTopics === right.srsTopics);
  const state = getCurrentState();
  const archive = useMemo(() => getMonthlyCommandArchive(state), [state]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MonthlyArchiveMetric>("growth");
  const [lifetimeWindowIndex, setLifetimeWindowIndex] = useState(0);
  const [lifetimeSubject, setLifetimeSubject] = useState("");
  const [topicPeriod, setTopicPeriod] = useState<ArchiveTopicPeriod | null>(null);
  const [topicSearchQuery, setTopicSearchQuery] = useState("");
  const [topicProgressFilter, setTopicProgressFilter] = useState<MonthlyArchiveRevisionProgressFilter>("all");
  const [comparisonSelection, setComparisonSelection] = useState<{ firstKey: string; secondKey: string } | null>(null);
  const activeYear = archive.years.find((year) => year.year === selectedYear) ?? archive.years[0] ?? null;
  const selectedMonth = activeYear?.months.find((month) => month.key === selectedMonthKey) ?? null;
  const recordedMonths = useMemo(() => archive.years.flatMap((year) => year.months).filter((month) => month.hasData).sort((left, right) => left.key.localeCompare(right.key)), [archive]);
  const lifetimeSubjects = useMemo(() => Array.from(new Set(recordedMonths.flatMap((month) => month.subjectBreakdown.map((subject) => subject.label)))).sort((left, right) => left.localeCompare(right)), [recordedMonths]);
  const activeLifetimeSubject = lifetimeSubjects.includes(lifetimeSubject) ? lifetimeSubject : "";
  const lifetimeWindows = useMemo(() => activeLifetimeSubject ? getMonthlyArchiveSubjectLifetimeWindows(archive, activeLifetimeSubject) : getMonthlyArchiveLifetimeWindows(archive), [activeLifetimeSubject, archive]);
  const archiveTopics = useMemo(() => topicPeriod ? getMonthlyArchiveStudiedTopics(state, topicPeriod) : [], [state, topicPeriod]);
  const filteredArchiveTopics = useMemo(() => filterMonthlyArchiveStudiedTopicsByProgress(filterMonthlyArchiveStudiedTopics(archiveTopics, topicSearchQuery), topicProgressFilter), [archiveTopics, topicProgressFilter, topicSearchQuery]);
  const allArchiveTopics = useMemo(() => getMonthlyArchiveStudiedTopics(state), [state]);
  const openComparison = useCallback(() => {
    const selected = activeYear?.months.filter((month) => month.hasData).at(-1) ?? recordedMonths.at(-1);
    if (!selected) return;
    const selectedIndex = recordedMonths.findIndex((month) => month.key === selected.key);
    const previous = selectedIndex > 0 ? recordedMonths[selectedIndex - 1] : null;
    setComparisonSelection({ firstKey: previous?.key ?? selected.key, secondKey: selected.key });
  }, [activeYear, recordedMonths]);

  if (!ready) return <LoadingScreen label="Preparing lifetime command archive…" />;

  return <ScreenContainer className="px-4" containerClassName="bg-background">
    {!activeYear ? <FlatList
      data={[]}
      renderItem={() => null}
      contentContainerStyle={styles.emptyContent}
      ListHeaderComponent={<>
        <ScreenTitle eyebrow="Lifetime command record" title="Monthly command archive" detail="A read-only view of your existing local history." right={<IconAction icon="xmark" label="Close command archive" onPress={() => router.back()} />} />
        <ArchiveEmptyState />
      </>}
    /> : topicPeriod ? <ArchiveTopicListView topics={filteredArchiveTopics} period={topicPeriod} searchQuery={topicSearchQuery} progressFilter={topicProgressFilter} onSearchChange={setTopicSearchQuery} onProgressFilterChange={setTopicProgressFilter} onBack={() => setTopicPeriod(null)} /> : comparisonSelection ? <ArchiveMonthComparisonView months={recordedMonths} topics={allArchiveTopics} firstKey={comparisonSelection.firstKey} secondKey={comparisonSelection.secondKey} onSelectFirst={(firstKey) => setComparisonSelection((current) => current ? { ...current, firstKey } : current)} onSelectSecond={(secondKey) => setComparisonSelection((current) => current ? { ...current, secondKey } : current)} onBack={() => setComparisonSelection(null)} /> : selectedMonth ? <ArchiveMonthView month={selectedMonth} selectedMetric={selectedMetric} onSelectMetric={setSelectedMetric} onBack={() => setSelectedMonthKey(null)} onOpenTopics={() => { setTopicSearchQuery(""); setTopicProgressFilter("all"); setTopicPeriod({ monthKey: selectedMonth.key }); }} /> : <ArchiveYearView year={activeYear} years={archive.years} onSelectYear={setSelectedYear} onOpenMonth={setSelectedMonthKey} onOpenTopics={() => { setTopicSearchQuery(""); setTopicProgressFilter("all"); setTopicPeriod({ year: activeYear.year }); }} onOpenLifetimeTopics={() => { setTopicSearchQuery(""); setTopicProgressFilter("all"); setTopicPeriod({ lifetime: true }); }} onOpenComparison={openComparison} lifetimeWindows={lifetimeWindows} activeLifetimeWindow={lifetimeWindowIndex} onSelectLifetimeWindow={setLifetimeWindowIndex} lifetimeSubjects={lifetimeSubjects} activeLifetimeSubject={activeLifetimeSubject} onSelectLifetimeSubject={(subject) => { setLifetimeSubject(subject); setLifetimeWindowIndex(0); }} />}
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  yearContent: { gap: 14, paddingTop: 12, paddingBottom: 32 },
  monthContent: { gap: 14, paddingTop: 12, paddingBottom: 32 },
  emptyContent: { gap: 14, paddingTop: 12, paddingBottom: 32, flexGrow: 1 },
  growthCard: { gap: 12 },
  lifetimeCard: { gap: 12, marginBottom: 14 },
  lifetimeReviewEntry: { marginBottom: 14 },
  growthHeading: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  lifetimeHeading: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  growthCopy: { flex: 1, gap: 3 },
  growthScore: { width: 62, height: 62, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  growthScoreValue: { fontSize: 22, lineHeight: 26, fontWeight: "900" },
  growthScoreLabel: { fontSize: 7, lineHeight: 10, fontWeight: "900", letterSpacing: 0.7 },
  eyebrow: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.85 },
  cardTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  detail: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  yearSelector: { gap: 8, paddingRight: 4 },
  yearChip: { minHeight: 38, minWidth: 72, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  yearChipText: { fontSize: 13, lineHeight: 17, fontWeight: "900" },
  lifetimeSelector: { gap: 7, paddingRight: 4 },
  lifetimeChip: { minHeight: 32, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  gridIntro: { fontSize: 11, lineHeight: 16, fontWeight: "600", marginTop: -6 },
  monthTileTap: { flex: 1 / 3, padding: 5 },
  monthTile: { minHeight: 94, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, paddingVertical: 10, gap: 2, justifyContent: "space-between" },
  monthTileLabel: { fontSize: 12, lineHeight: 16, fontWeight: "900" },
  monthTileValue: { fontSize: 22, lineHeight: 26, fontWeight: "900" },
  monthTileCaption: { fontSize: 7, lineHeight: 10, fontWeight: "900", letterSpacing: 0.7 },
  emptyCard: { gap: 8, minHeight: 132, justifyContent: "center" },
  returnControl: { minHeight: 42, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, justifyContent: "center", paddingHorizontal: 13 },
  returnControlText: { fontSize: 12, lineHeight: 16, fontWeight: "900" },
  metricChartCard: { gap: 10 },
  metricSelector: { gap: 7, paddingVertical: 2, paddingRight: 4 },
  metricChip: { minHeight: 34, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", paddingHorizontal: 11 },
  metricChipText: { fontSize: 10, lineHeight: 13, fontWeight: "900" },
  monthMetrics: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  monthMetricSlot: { width: "48.8%" },
  monthMetricTap: { width: "100%" },
  monthMetric: { width: "100%", minHeight: 68, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, paddingVertical: 9, justifyContent: "center", gap: 2 },
  monthMetricValue: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  monthMetricLabel: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.6 },
  traitsCard: { gap: 10 },
  subjectRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 9 },
  subjectCopy: { flex: 1, gap: 2 },
  subjectTitle: { fontSize: 13, lineHeight: 17, fontWeight: "900" },
  subjectValue: { fontSize: 12, lineHeight: 16, fontWeight: "900" },
  emptySubjectCard: { minHeight: 68, justifyContent: "center" },
  frictionCard: { gap: 5 },
  transparencyCard: { gap: 6, marginTop: 2 },
  reviewEntry: { minHeight: 74, borderWidth: StyleSheet.hairlineWidth, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 11, flexDirection: "row", gap: 10, alignItems: "center" },
  reviewEntryCopy: { flex: 1, gap: 3 },
  reviewEntryAction: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.8 },
  comparisonReviewEntry: { marginTop: 14 },
  topicRow: { minHeight: 78, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 10 },
  topicProgress: { minWidth: 62, alignItems: "flex-end", gap: 2 },
  topicProgressValue: { fontSize: 17, lineHeight: 21, fontWeight: "900" },
  topicProgressLabel: { fontSize: 7, lineHeight: 10, fontWeight: "900", letterSpacing: 0.45 },
  subjectLensSelector: { gap: 7, paddingRight: 4 },
  subjectLensChip: { minHeight: 32, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  topicSearch: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  topicSearchInput: { minHeight: 34, fontSize: 14, lineHeight: 18, fontWeight: "700", paddingVertical: 4 },
  progressFilterBlock: { gap: 6 },
  revisionProgressSelector: { gap: 7, paddingRight: 4 },
  revisionProgressChip: { minHeight: 32, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  comparisonCard: { gap: 10 },
  comparisonSelector: { gap: 7, paddingRight: 4 },
  comparisonChip: { minHeight: 32, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  comparisonHeader: { minHeight: 30, flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth },
  comparisonHeaderLabel: { flex: 1.05, fontSize: 7, lineHeight: 10, fontWeight: "900", letterSpacing: 0.5 },
  comparisonHeaderValue: { flex: 0.8, fontSize: 8, lineHeight: 11, fontWeight: "900", textAlign: "right" },
  comparisonMetricRow: { minHeight: 48, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", marginTop: 7 },
  comparisonMetricLabel: { flex: 1.05, fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.45 },
  comparisonMetricValue: { flex: 0.8, fontSize: 11, lineHeight: 15, fontWeight: "900", textAlign: "right" },
  comparisonMetricDelta: { flex: 0.8, fontSize: 10, lineHeight: 14, fontWeight: "900", textAlign: "right" },
  comparisonContextCard: { gap: 5 },
  comparisonSubjects: { gap: 7 },
  comparisonSubjectRow: { minHeight: 58, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 10 },
});
