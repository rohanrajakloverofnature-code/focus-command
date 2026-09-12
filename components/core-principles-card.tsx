import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { CommandCard, StatusPill, TapFeedback } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getCorePrinciplesSummary } from "@/lib/core-principles";
import { shallowEqual, toLocalDate, type FocusState, useFocusCommandReady, useFocusCommandSelector } from "@/lib/focus-command";

const selectCorePrinciplesCard = (state: FocusState) => ({
  title: state.corePrinciplesTitle,
  lists: state.corePrincipleLists,
  items: state.corePrincipleItems,
  checkIns: state.corePrincipleDailyCheckIns,
  timezone: state.profile.timezone,
});

export function CorePrinciplesCard() {
  const colors = useColors();
  const ready = useFocusCommandReady();
  const { title, lists, items, checkIns, timezone } = useFocusCommandSelector(selectCorePrinciplesCard, shallowEqual);
  const today = toLocalDate(new Date().toISOString(), timezone);
  const todayCheckIn = useMemo(() => checkIns.find((checkIn) => checkIn.localDate === today), [checkIns, today]);
  const todaySummary = useMemo(() => getCorePrinciplesSummary(todayCheckIn ? [todayCheckIn] : []), [todayCheckIn]);
  const activeItems = useMemo(() => items.filter((item) => item.active && lists.some((list) => list.id === item.listId)).length, [items, lists]);

  if (!ready) return null;
  const ratio = todaySummary.successRatio === null ? null : Math.round(todaySummary.successRatio * 100);
  const detail = !activeItems
    ? "Create your first private daily rule."
    : ratio === null
      ? `${activeItems} active principle${activeItems === 1 ? "" : "s"} · no check-in recorded yet`
      : `${todaySummary.checked}/${todaySummary.applicable} completed today`;

  return <TapFeedback onPress={() => router.push("/core-principles" as never)} accessibilityLabel={`Open ${title}`}>
    <CommandCard accent={colors.success} style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: colors.success }]}>DAILY PRIVATE PRACTICE</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.detail, { color: colors.muted }]}>{detail}</Text>
        </View>
        <View style={styles.right}>
          <StatusPill label={ratio === null ? "CHECK IN" : `${ratio}% SUCCESS`} tone={ratio === null ? "neutral" : "success"} icon="checklist" />
          <IconSymbol name="chevron.right" size={22} color={colors.success} />
        </View>
      </View>
    </CommandCard>
  </TapFeedback>;
}

const styles = StyleSheet.create({
  card: { marginTop: 2 },
  heading: { flexDirection: "row", alignItems: "center", gap: 12 },
  copy: { flex: 1, gap: 4 },
  eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.05 },
  title: { fontSize: 19, lineHeight: 24, fontWeight: "900" },
  detail: { fontSize: 13, lineHeight: 18, fontWeight: "700" },
  right: { alignItems: "flex-end", gap: 10 },
});
