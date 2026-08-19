import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { CommandButton, CommandCard } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useFocusCommandSelector, type FocusState } from "@/lib/focus-command";
import { getMostUsedShadowGateDoorway, getShadowGateEntriesForRange, getShadowGatePersonalProof, getShadowGateRangePresentation, type ShadowGateDateRange } from "@/lib/shadow-gate-analytics";

type CrossedGatesDependencies = Pick<FocusState, "shadowGateEntries"> & {
  timezone: string;
  showDashboardCard: boolean;
};

function selectCrossedGatesDependencies(state: FocusState): CrossedGatesDependencies {
  return {
    timezone: state.profile.timezone,
    showDashboardCard: state.profile.shadowGatePreferences.showDashboardCard,
    shadowGateEntries: state.shadowGateEntries,
  };
}

function hasSameCrossedGatesDependencies(left: CrossedGatesDependencies, right: CrossedGatesDependencies) {
  return left.timezone === right.timezone
    && left.showDashboardCard === right.showDashboardCard
    && left.shadowGateEntries === right.shadowGateEntries;
}

export function CrossedGatesCard() {
  const colors = useColors();
  const { timezone, showDashboardCard, shadowGateEntries } = useFocusCommandSelector(selectCrossedGatesDependencies, hasSameCrossedGatesDependencies);
  const [rangeKind, setRangeKind] = useState<ShadowGateDateRange["kind"]>("last30Days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [appliedCustomRange, setAppliedCustomRange] = useState<Extract<ShadowGateDateRange, { kind: "custom" }> | null>(null);
  const [rangeError, setRangeError] = useState("");

  const range = useMemo<ShadowGateDateRange>(() => rangeKind === "custom"
    ? appliedCustomRange ?? { kind: "custom", startDate: "", endDate: "" }
    : { kind: rangeKind }, [appliedCustomRange, rangeKind]);
  const rangePresentation = useMemo(() => getShadowGateRangePresentation(range, timezone), [timezone, range]);
  const periodEntries = useMemo(() => getShadowGateEntriesForRange(shadowGateEntries, timezone, range), [timezone, range, shadowGateEntries]);
  const mostUsed = useMemo(() => getMostUsedShadowGateDoorway(periodEntries), [periodEntries]);
  const proof = useMemo(() => getShadowGatePersonalProof(shadowGateEntries), [shadowGateEntries]);

  if (!showDashboardCard || shadowGateEntries.length === 0) return null;

  const applyCustomRange = () => {
    const next: ShadowGateDateRange = { kind: "custom", startDate: customStart.trim(), endDate: customEnd.trim() };
    if (!getShadowGateRangePresentation(next, timezone).valid) {
      setRangeError("Enter valid dates in YYYY-MM-DD order.");
      return;
    }
    setAppliedCustomRange(next);
    setRangeKind("custom");
    setRangeError("");
  };

  return (
    <CommandCard accent="#8B5CF9" style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={[styles.eyebrow, { color: "#A78BFA" }]}>CROSSED GATES</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>You made the move.</Text>
          <Text style={[styles.detail, { color: colors.muted }]}>A private record of the doorway you chose before entering a mission.</Text>
        </View>
        <Pressable onPress={() => router.push("/shadow-gate-ledger" as never)} accessibilityRole="link" accessibilityLabel="Open all-time Shadow Gate ledger" style={({ pressed }) => [styles.ledgerLink, { borderColor: `${colors.primary}74`, backgroundColor: `${colors.primary}10`, opacity: pressed ? 0.7 : 1 }]}>
          <IconSymbol name="chevron.right" size={18} color={colors.primary} />
          <Text style={[styles.ledgerText, { color: colors.primary }]}>LEDGER</Text>
        </Pressable>
      </View>

      <View style={styles.filters}>
        <RangeChip label="Last 7 days" selected={rangeKind === "last7Days"} onPress={() => { setRangeKind("last7Days"); setRangeError(""); }} accent={colors.primary} />
        <RangeChip label="Last 30 days" selected={rangeKind === "last30Days"} onPress={() => { setRangeKind("last30Days"); setRangeError(""); }} accent={colors.primary} />
        <RangeChip label="Custom" selected={rangeKind === "custom"} onPress={() => { setRangeKind("custom"); setRangeError(""); }} accent={colors.primary} />
      </View>

      {rangeKind === "custom" ? (
        <View style={styles.customRange}>
          <View style={styles.dateInputs}>
            <TextInput value={customStart} onChangeText={setCustomStart} placeholder="YYYY-MM-DD" autoCapitalize="none" placeholderTextColor={colors.muted} style={[styles.dateInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
            <Text style={[styles.dateArrow, { color: colors.muted }]}>→</Text>
            <TextInput value={customEnd} onChangeText={setCustomEnd} placeholder="YYYY-MM-DD" autoCapitalize="none" placeholderTextColor={colors.muted} style={[styles.dateInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
          </View>
          {rangeError ? <Text style={[styles.rangeError, { color: colors.error }]}>{rangeError}</Text> : null}
          <CommandButton label="Apply date range" variant="secondary" onPress={applyCustomRange} />
        </View>
      ) : null}

      <View style={[styles.summary, { borderColor: `${colors.border}B0`, backgroundColor: `${colors.primary}0A` }]}>
        <View style={styles.countBlock}>
          <Text style={[styles.count, { color: colors.foreground }]}>{rangePresentation.valid ? periodEntries.length : "—"}</Text>
          <Text style={[styles.countLabel, { color: colors.muted }]}>GATES CROSSED · {rangePresentation.label.toUpperCase()}</Text>
        </View>
        <View style={[styles.doorwayBlock, { borderLeftColor: `${colors.border}B0` }]}>
          <Text style={[styles.doorwayLabel, { color: colors.muted }]}>MOST-USED DOORWAY</Text>
          <Text numberOfLines={2} style={[styles.doorwayValue, { color: mostUsed ? colors.foreground : colors.muted }]}>{mostUsed ? mostUsed.doorwayLabel : "No Gate crossings in this period."}</Text>
        </View>
      </View>

      {proof ? <View style={[styles.proof, { borderColor: "#8B5CF95C", backgroundColor: "#8B5CF912" }]}><Text style={[styles.proofLabel, { color: "#C4B5FD" }]}>PERSONAL PROOF</Text><Text style={[styles.proofText, { color: colors.foreground }]}>{proof.line}</Text></View> : null}
    </CommandCard>
  );
}

function RangeChip({ label, selected, onPress, accent }: { label: string; selected: boolean; onPress: () => void; accent: string }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.filterChip, { borderColor: selected ? accent : colors.border, backgroundColor: selected ? `${accent}18` : colors.background, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.filterText, { color: selected ? accent : colors.muted }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  card: { gap: 13 },
  heading: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  headingCopy: { flex: 1, minWidth: 0, gap: 2 },
  eyebrow: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 1.1 },
  title: { fontSize: 18, lineHeight: 23, fontWeight: "900" },
  detail: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
  ledgerLink: { minHeight: 32, paddingHorizontal: 9, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 2 },
  ledgerText: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.7 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  filterChip: { minHeight: 31, paddingHorizontal: 10, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, justifyContent: "center" },
  filterText: { fontSize: 10, lineHeight: 13, fontWeight: "800" },
  customRange: { gap: 8 },
  dateInputs: { flexDirection: "row", alignItems: "center", gap: 7 },
  dateInput: { flex: 1, minHeight: 40, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, fontSize: 12, lineHeight: 16, fontWeight: "700" },
  dateArrow: { fontSize: 15, lineHeight: 18, fontWeight: "900" },
  rangeError: { fontSize: 10, lineHeight: 14, fontWeight: "700" },
  summary: { minHeight: 82, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", overflow: "hidden" },
  countBlock: { width: "35%", justifyContent: "center", alignItems: "center", padding: 10, gap: 2 },
  count: { fontSize: 28, lineHeight: 32, fontWeight: "900" },
  countLabel: { fontSize: 8, lineHeight: 11, textAlign: "center", fontWeight: "900", letterSpacing: 0.6 },
  doorwayBlock: { flex: 1, borderLeftWidth: StyleSheet.hairlineWidth, justifyContent: "center", paddingHorizontal: 12, gap: 4 },
  doorwayLabel: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.75 },
  doorwayValue: { fontSize: 12, lineHeight: 17, fontWeight: "800" },
  proof: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 10, gap: 3 },
  proofLabel: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.8 },
  proofText: { fontSize: 11, lineHeight: 16, fontWeight: "700" },
});
