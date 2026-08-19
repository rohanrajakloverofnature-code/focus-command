import { router } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { CommandCard, IconAction, LoadingScreen, ScreenTitle, StatusPill } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { type ShadowGateEntry, useFocusCommandReady, useFocusCommandSelector } from "@/lib/focus-command";
import { getShadowGatePersonalProof } from "@/lib/shadow-gate-analytics";
import { getShadowGateSection } from "@/lib/shadow-gate-library";

const ledgerDateFormatters = new Map<string, Intl.DateTimeFormat>();

function formatLedgerDate(occurredAt: string, timezone: string) {
  let formatter = ledgerDateFormatters.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: timezone });
    ledgerDateFormatters.set(timezone, formatter);
  }
  return formatter.format(new Date(occurredAt));
}

const LedgerEntryCard = memo(function LedgerEntryCard({ entry, timezone }: { entry: ShadowGateEntry; timezone: string }) {
  const colors = useColors();
  const section = getShadowGateSection(entry.resistanceState);
  return (
    <CommandCard accent="#8B5CF9" style={styles.entryCard}>
      <View style={styles.entryTopline}>
        <View style={styles.entryCopy}>
          <Text style={[styles.entryState, { color: "#C4B5FD" }]}>{section.title.toUpperCase()}</Text>
          <Text style={[styles.entryDoorway, { color: colors.foreground }]}>{entry.doorwayLabel}</Text>
        </View>
        <StatusPill label={formatLedgerDate(entry.occurredAt, timezone)} tone="primary" />
      </View>
      <Text style={[styles.entryDetail, { color: colors.muted }]}>You chose this doorway, then entered the linked mission.</Text>
    </CommandCard>
  );
});

export default function ShadowGateLedgerScreen() {
  const colors = useColors();
  const ready = useFocusCommandReady();
  const timezone = useFocusCommandSelector((state) => state.profile.timezone);
  const entries = useFocusCommandSelector((state) => state.shadowGateEntries);
  const sortedEntries = useMemo(() => entries.slice().sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)), [entries]);
  const proof = useMemo(() => getShadowGatePersonalProof(entries), [entries]);
  const renderEntry = useCallback(({ item }: { item: ShadowGateEntry }) => <LedgerEntryCard entry={item} timezone={timezone} />, [timezone]);

  if (!ready) return <LoadingScreen label="Opening Shadow Gate ledger…" />;

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]}>
      <FlatList
        data={sortedEntries}
        keyExtractor={(entry) => entry.id}
        renderItem={renderEntry}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        updateCellsBatchingPeriod={16}
        windowSize={7}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={(
          <View style={styles.header}>
            <ScreenTitle eyebrow="Private record" title="All-time Gate ledger" detail="Only completed Gate-to-mission entries appear here. Browsing, closing, or choosing a doorway without starting a mission creates no record." right={<IconAction icon="xmark" label="Close Shadow Gate ledger" onPress={() => router.back()} />} />
            <CommandCard accent="#8B5CF9" style={styles.summary}>
              <View style={styles.summaryIcon}><IconSymbol name="shield.fill" size={23} color="#C4B5FD" /></View>
              <View style={styles.summaryCopy}>
                <Text style={[styles.summaryCount, { color: colors.foreground }]}>{entries.length} GATE{entries.length === 1 ? "" : "S"} CROSSED</Text>
                <Text style={[styles.summaryDetail, { color: colors.muted }]}>This is a factual initiation record, not a score, streak, or penalty.</Text>
              </View>
            </CommandCard>
            {proof ? <CommandCard accent="#8B5CF9" style={styles.proof}><Text style={[styles.proofLabel, { color: "#C4B5FD" }]}>PERSONAL PROOF</Text><Text style={[styles.proofText, { color: colors.foreground }]}>{proof.line}</Text></CommandCard> : null}
          </View>
        )}
        ListEmptyComponent={<CommandCard accent="#8B5CF9" style={styles.empty}><Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Gates crossed yet</Text><Text style={[styles.emptyDetail, { color: colors.muted }]}>When you choose a Shadow Gate doorway and then start a planned mission, that completed handoff will appear here.</Text></CommandCard>}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36, gap: 10 },
  header: { gap: 12, paddingBottom: 14 },
  summary: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryIcon: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#8B5CF91A", borderWidth: StyleSheet.hairlineWidth, borderColor: "#8B5CF95C" },
  summaryCopy: { flex: 1, minWidth: 0, gap: 3 },
  summaryCount: { fontSize: 16, lineHeight: 21, fontWeight: "900", letterSpacing: 0.2 },
  summaryDetail: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  proof: { gap: 3, backgroundColor: "#8B5CF910" },
  proofLabel: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.9 },
  proofText: { fontSize: 11, lineHeight: 16, fontWeight: "700" },
  entryCard: { gap: 6 },
  entryTopline: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  entryCopy: { flex: 1, minWidth: 0, gap: 2 },
  entryState: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 1 },
  entryDoorway: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
  entryDetail: { fontSize: 10, lineHeight: 14, fontWeight: "600" },
  empty: { alignItems: "center", paddingVertical: 24, gap: 5 },
  emptyTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  emptyDetail: { maxWidth: 290, fontSize: 11, lineHeight: 16, fontWeight: "600", textAlign: "center" },
});
