import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { CommandButton, CommandCard, EmptyCommandState, IconAction, LoadingScreen, ScreenTitle, SectionHeader, StatusPill } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFocusCommand } from "@/lib/focus-command";

export default function InventoryScreen() {
  const colors = useColors();
  const { state, ready } = useFocusCommand();
  if (!ready) return <LoadingScreen label="Opening active inventory…" />;

  const inventory = state.inventory
    .map((item) => ({ item, reward: state.rewards.find((reward) => reward.id === item.rewardId) }))
    .filter((entry): entry is { item: typeof state.inventory[number]; reward: typeof state.rewards[number] } => Boolean(entry.reward));
  const active = inventory.filter(({ item }) => item.active && !item.consumedAt);
  const history = inventory.filter(({ item }) => !item.active || Boolean(item.consumedAt));

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenTitle
          eyebrow="Command armory"
          title="Active inventory"
          detail="Rewards you earn or redeem remain here until their effect is consumed."
          right={<IconAction icon="xmark" label="Back to rewards" onPress={() => router.back()} />}
        />

        <CommandCard accent={colors.primary} style={styles.summaryCard}>
          <View style={styles.summaryIcon}><IconSymbol name="shield.fill" size={24} color={colors.primary} /></View>
          <View style={styles.summaryCopy}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>{active.length} active item{active.length === 1 ? "" : "s"}</Text>
            <Text style={[styles.summaryDetail, { color: colors.muted }]}>Open this armory from Rewards whenever you want to see equipped gear and scheduled gold boosts.</Text>
          </View>
        </CommandCard>

        <SectionHeader title="Equipped & queued" action="Rewards" onAction={() => router.push("/rewards")} />
        {active.length ? <View style={styles.stack}>
          {active.map(({ item, reward }) => <CommandCard key={item.id} accent={reward.category === "multiplier" ? "#F4C95D" : colors.primary} style={styles.itemCard}>
            <View style={[styles.itemIcon, { backgroundColor: reward.category === "multiplier" ? "#F4C95D1A" : `${colors.primary}18` }]}>
              <IconSymbol name={reward.category === "multiplier" ? "bolt.fill" : "shield.fill"} size={21} color={reward.category === "multiplier" ? "#F4C95D" : colors.primary} />
            </View>
            <View style={styles.itemCopy}>
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>{reward.title}</Text>
              <Text style={[styles.itemDetail, { color: colors.muted }]}>{reward.goldMultiplier ? `${reward.goldMultiplier}× gold conversion activates ${item.effectiveOn ?? "on your next command day"}.` : reward.description || "Stored in your command armory."}</Text>
            </View>
            <StatusPill label={reward.goldMultiplier ? "QUEUED" : "EQUIPPED"} tone={reward.goldMultiplier ? "gold" : "primary"} icon={reward.goldMultiplier ? "bolt.fill" : "shield.fill"} />
          </CommandCard>)}
        </View> : <EmptyCommandState icon="shield.fill" title="Armory is empty" detail="Redeem a vault reward or earn a loot drop after completing a mission." action="Open rewards" onAction={() => router.push("/rewards")} />}

        {history.length ? <>
          <SectionHeader title="Consumed history" />
          <View style={styles.stack}>
            {history.slice(0, 12).map(({ item, reward }) => <CommandCard key={item.id} subdued style={styles.historyCard}>
              <IconSymbol name="gift.fill" size={18} color={colors.muted} />
              <View style={styles.itemCopy}>
                <Text style={[styles.historyTitle, { color: colors.foreground }]}>{reward.title}</Text>
                <Text style={[styles.historyDetail, { color: colors.muted }]}>{item.consumedAt ? "Consumed after activation" : "Archived from active inventory"}</Text>
              </View>
            </CommandCard>)}
          </View>
        </> : null}

        <CommandButton label="Return to reward vault" icon="gift.fill" variant="secondary" onPress={() => router.push("/rewards")} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingTop: 12, paddingBottom: 28 },
  summaryCard: { flexDirection: "row", gap: 12, alignItems: "center" },
  summaryIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#39C6E81A" },
  summaryCopy: { flex: 1, gap: 2 },
  summaryTitle: { fontSize: 17, lineHeight: 22, fontWeight: "900" },
  summaryDetail: { fontSize: 12, lineHeight: 17, fontWeight: "500" },
  stack: { gap: 10 },
  itemCard: { flexDirection: "row", gap: 11, alignItems: "center" },
  itemIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  itemCopy: { flex: 1, gap: 2 },
  itemTitle: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
  itemDetail: { fontSize: 11, lineHeight: 16, fontWeight: "500" },
  historyCard: { flexDirection: "row", gap: 10, alignItems: "center", paddingVertical: 11 },
  historyTitle: { fontSize: 13, lineHeight: 18, fontWeight: "800" },
  historyDetail: { fontSize: 11, lineHeight: 15, fontWeight: "500" },
});
