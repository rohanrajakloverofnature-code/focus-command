import { useMemo } from "react";
import { Text, View, StyleSheet } from "react-native";
import { router } from "expo-router";

import { CommandCard, TapFeedback } from "@/components/focus-ui";
import { useColors } from "@/hooks/use-colors";
import { shallowEqual, toLocalDate, type FocusState, useFocusCommandSelector } from "@/lib/focus-command";

const selectMistakeLedgerCard = (state: FocusState) => ({
  entries: state.mistakeLedgerEntries,
  activity: state.mistakeLedgerActivityLog,
  timezone: state.profile.timezone,
});

export function MistakeLedgerCard() {
  const colors = useColors();
  const { entries, activity, timezone } = useFocusCommandSelector(selectMistakeLedgerCard, shallowEqual);
  const summary = useMemo(() => {
    const month = toLocalDate(new Date().toISOString(), timezone).slice(0, 7);
    const working = entries.filter((entry) => ["working_on", "improving", "needs_review"].includes(entry.status)).length;
    const improved = activity.filter((record) => record.kind === "status" && record.status === "improved" && record.actionDate.slice(0, 7) === month).length;
    return { working, improved };
  }, [activity, entries, timezone]);

  return (
    <TapFeedback onPress={() => router.push("/mistake-ledger" as never)} accessibilityLabel="Open Mistake Ledger">
      <CommandCard accent="#F4C95D" style={styles.card}>
        <Text style={[styles.eyebrow, { color: "#F4C95D" }]}>PRIVATE IMPROVEMENT RECORD</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Mistake Ledger</Text>
        <View style={styles.row}>
          <Text style={[styles.detail, { color: colors.muted }]}>{entries.length ? `${summary.working} currently working on · ${summary.improved} improved this month` : "Record a real mistake, its correction, and your own progress."}</Text>
          <Text style={[styles.arrow, { color: "#F4C95D" }]}>›</Text>
        </View>
      </CommandCard>
    </TapFeedback>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 2 },
  eyebrow: { fontSize: 10, lineHeight: 14, fontWeight: "900", letterSpacing: 1.2 },
  title: { marginTop: 4, fontSize: 19, lineHeight: 24, fontWeight: "900" },
  row: { marginTop: 5, flexDirection: "row", alignItems: "center", gap: 10 },
  detail: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  arrow: { fontSize: 28, lineHeight: 28, fontWeight: "500" },
});
