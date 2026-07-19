import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { CommandButton, CommandCard, EmptyCommandState, IconAction, LoadingScreen, ScreenTitle, SectionHeader, StatusPill } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { formatCompactNumber, getGoldBalance, getLifetimeGold, RewardCategory, useFocusCommand } from "@/lib/focus-command";
import { scheduleMultiplierReminder } from "@/lib/focus-reminders";
import { playFocusSuccessCue } from "@/lib/focus-audio";

const categories: { value: RewardCategory | "all"; label: string; icon: "gift.fill" | "shield.fill" | "bolt.fill" | "star.fill" }[] = [
  { value: "all", label: "All", icon: "gift.fill" },
  { value: "life", label: "Life", icon: "star.fill" },
  { value: "gear", label: "Gear", icon: "shield.fill" },
  { value: "power", label: "Power", icon: "bolt.fill" },
  { value: "multiplier", label: "Gold", icon: "bolt.fill" },
];

export default function RewardsScreen() {
  const colors = useColors();
  const { state, ready, createReward, purchaseReward } = useFocusCommand();
  const [category, setCategory] = useState<RewardCategory | "all">("all");
  const [showComposer, setShowComposer] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("30");
  const [draftCategory, setDraftCategory] = useState<RewardCategory>("life");
  const [lootEnabled, setLootEnabled] = useState(true);

  if (!ready) return <LoadingScreen label="Opening reward vault…" />;

  const balance = getGoldBalance(state);
  const rewards = state.rewards.filter((reward) => reward.active && (category === "all" || reward.category === category));
  const inventory = state.inventory.filter((item) => item.active && !item.consumedAt).map((item) => ({ item, reward: state.rewards.find((reward) => reward.id === item.rewardId) })).filter((row) => row.reward);

  const submit = () => {
    if (!title.trim()) {
      Alert.alert("Name the reward", "A reward needs a clear name before it can enter the vault.");
      return;
    }
    createReward({
      title,
      description,
      category: draftCategory,
      goldCost: Math.max(0, Math.round(Number(cost) || 0)),
      lootEnabled,
      lootWeight: lootEnabled ? 1 : 0,
      goldMultiplier: null,
    });
    setTitle("");
    setDescription("");
    setCost("30");
    setDraftCategory("life");
    setLootEnabled(true);
    setShowComposer(false);
  };

  const buy = async (rewardId: string) => {
    const reward = state.rewards.find((candidate) => candidate.id === rewardId);
    const result = purchaseReward(rewardId);
    if (result.ok) await playFocusSuccessCue(state.profile.soundEnabled);
    if (result.ok && reward?.goldMultiplier && state.profile.notificationsEnabled) {
      await scheduleMultiplierReminder(reward.title);
    }
    Alert.alert(result.ok ? "Reward secured" : "Not enough gold", result.message);
  };

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenTitle
          eyebrow="Reward vault"
          title="Spend with intent"
          detail="Trade earned gold for real-life resets, gear, and next-day power-ups."
          right={<IconAction icon={showComposer ? "xmark" : "plus"} label={showComposer ? "Close reward creator" : "Create reward"} onPress={() => setShowComposer((value) => !value)} />}
        />

        <CommandCard accent="#F4C95D" style={styles.walletCard}>
          <View style={styles.walletTopline}>
            <StatusPill label="COMMAND WALLET" tone="gold" icon="star.fill" />
            <Text style={[styles.walletLifetime, { color: colors.muted }]}>{formatCompactNumber(getLifetimeGold(state))} lifetime gold</Text>
          </View>
          <Text style={[styles.walletValue, { color: "#F4C95D" }]}>{formatCompactNumber(balance)}</Text>
          <Text style={[styles.walletDetail, { color: colors.muted }]}>Available gold. Purchases cannot exceed this balance.</Text>
        </CommandCard>

        {inventory.length ? (
          <CommandCard accent={colors.primary} style={styles.inventoryCard}>
            <View style={styles.inventoryHeading}>
              <Text style={[styles.inventoryTitle, { color: colors.foreground }]}>Active inventory</Text>
              <StatusPill label={`${inventory.length} ACTIVE`} tone="primary" icon="shield.fill" />
            </View>
            {inventory.map(({ item, reward }) => reward ? (
              <View key={item.id} style={styles.inventoryItem}>
                <IconSymbol name={reward.category === "multiplier" ? "bolt.fill" : "shield.fill"} size={18} color={reward.category === "multiplier" ? "#F4C95D" : colors.primary} />
                <View style={styles.inventoryCopy}>
                  <Text style={[styles.inventoryName, { color: colors.foreground }]}>{reward.title}</Text>
                  <Text style={[styles.inventoryDetail, { color: colors.muted }]}>{reward.goldMultiplier ? `${reward.goldMultiplier}× gold conversion activates ${item.effectiveOn}.` : "Armory item preserved in your inventory."}</Text>
                </View>
              </View>
            ) : null)}
          </CommandCard>
        ) : null}

        {showComposer ? (
          <CommandCard accent={colors.primary} style={styles.composer}>
            <Text style={[styles.composerTitle, { color: colors.foreground }]}>Create custom reward</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="Reward name (e.g., 30 min YouTube)" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
            <TextInput value={description} onChangeText={setDescription} placeholder="Why this reward is worth it" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
            <View style={styles.composerCostRow}>
              <View style={styles.costCopy}>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>GOLD COST</Text>
                <Text style={[styles.costDetail, { color: colors.muted }]}>A reward will be disabled when this exceeds your balance.</Text>
              </View>
              <TextInput value={cost} onChangeText={setCost} keyboardType="number-pad" style={[styles.costInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
            </View>
            <View>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>CATEGORY</Text>
              <View style={styles.categoryChoices}>
                {(["life", "gear", "power"] as RewardCategory[]).map((value) => (
                  <Pressable key={value} onPress={() => setDraftCategory(value)} style={({ pressed }) => [styles.categoryChoice, { backgroundColor: draftCategory === value ? `${colors.primary}1B` : colors.background, borderColor: draftCategory === value ? colors.primary : colors.border, opacity: pressed ? 0.75 : 1 }]}>
                    <Text style={[styles.categoryChoiceText, { color: draftCategory === value ? colors.primary : colors.muted }]}>{value.toUpperCase()}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Pressable onPress={() => setLootEnabled((value) => !value)} style={({ pressed }) => [styles.lootToggle, { borderColor: lootEnabled ? "#F4C95D" : colors.border, backgroundColor: lootEnabled ? "#F4C95D16" : colors.background, opacity: pressed ? 0.75 : 1 }]}>
              <IconSymbol name="gift.fill" size={18} color={lootEnabled ? "#F4C95D" : colors.muted} />
              <View style={styles.lootToggleCopy}>
                <Text style={[styles.lootToggleTitle, { color: colors.foreground }]}>Eligible for loot drops</Text>
                <Text style={[styles.lootToggleDetail, { color: colors.muted }]}>Add this reward to your random post-mission loot pool.</Text>
              </View>
            </Pressable>
            <CommandButton label="Add to vault" icon="gift.fill" onPress={submit} />
          </CommandCard>
        ) : null}

        <View style={styles.categoryRow}>
          {categories.map((item) => (
            <Pressable key={item.value} onPress={() => setCategory(item.value)} style={({ pressed }) => [styles.categoryPill, { backgroundColor: category === item.value ? `${colors.primary}1B` : colors.surface, borderColor: category === item.value ? colors.primary : colors.border, opacity: pressed ? 0.75 : 1 }]}>
              <IconSymbol name={item.icon} size={14} color={category === item.value ? colors.primary : colors.muted} />
              <Text style={[styles.categoryLabel, { color: category === item.value ? colors.primary : colors.muted }]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <SectionHeader title="Available rewards" action="Create" onAction={() => setShowComposer(true)} />
        {rewards.length ? (
          <View style={styles.rewardStack}>
            {rewards.map((reward) => {
              const canAfford = balance >= reward.goldCost;
              const icon = reward.category === "gear" ? "shield.fill" : reward.category === "multiplier" ? "bolt.fill" : reward.category === "power" ? "flame.fill" : "gift.fill";
              const accent = reward.category === "multiplier" ? "#F4C95D" : reward.category === "gear" ? colors.primary : colors.success;
              return (
                <CommandCard key={reward.id} accent={accent} style={styles.rewardCard}>
                  <View style={styles.rewardHead}>
                    <View style={[styles.rewardIcon, { backgroundColor: `${accent}18` }]}><IconSymbol name={icon} size={22} color={accent} /></View>
                    <View style={styles.rewardCopy}>
                      <Text style={[styles.rewardTitle, { color: colors.foreground }]}>{reward.title}</Text>
                      <Text style={[styles.rewardDescription, { color: colors.muted }]}>{reward.description}</Text>
                    </View>
                    <StatusPill label={`${reward.goldCost} G`} tone="gold" icon="star.fill" />
                  </View>
                  <View style={styles.rewardFooter}>
                    <View style={styles.rewardTags}>
                      {reward.lootEnabled ? <StatusPill label="LOOT" tone="gold" icon="gift.fill" /> : null}
                      {reward.goldMultiplier ? <StatusPill label={`${reward.goldMultiplier}× TOMORROW`} tone="primary" icon="bolt.fill" /> : null}
                    </View>
                    <CommandButton label={canAfford ? "Redeem" : "Insufficient gold"} icon={canAfford ? "star.fill" : "xmark"} variant={canAfford ? "primary" : "secondary"} disabled={!canAfford} onPress={() => buy(reward.id)} />
                  </View>
                </CommandCard>
              );
            })}
          </View>
        ) : (
          <EmptyCommandState icon="gift.fill" title="No matching rewards" detail="Create a real-life reward or change the vault category." action="Create reward" onAction={() => setShowComposer(true)} />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingTop: 12, paddingBottom: 28 },
  walletCard: { gap: 5, paddingVertical: 18 },
  walletTopline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  walletLifetime: { fontSize: 11, lineHeight: 15, fontWeight: "600" },
  walletValue: { fontSize: 42, lineHeight: 48, letterSpacing: -1.1, fontWeight: "900" },
  walletDetail: { fontSize: 12, lineHeight: 17, fontWeight: "500" },
  inventoryCard: { gap: 11 },
  inventoryHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  inventoryTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  inventoryItem: { flexDirection: "row", gap: 10, alignItems: "center" },
  inventoryCopy: { flex: 1 },
  inventoryName: { fontSize: 13, lineHeight: 18, fontWeight: "800" },
  inventoryDetail: { fontSize: 11, lineHeight: 16, fontWeight: "500", marginTop: 1 },
  composer: { gap: 12 },
  composerTitle: { fontSize: 17, lineHeight: 22, fontWeight: "900" },
  input: { minHeight: 47, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  composerCostRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  costCopy: { flex: 1 },
  inputLabel: { fontSize: 10, lineHeight: 13, letterSpacing: 0.85, fontWeight: "800", marginBottom: 3 },
  costDetail: { fontSize: 11, lineHeight: 16, fontWeight: "500" },
  costInput: { width: 72, minHeight: 43, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, textAlign: "center", fontSize: 15, lineHeight: 18, fontWeight: "900" },
  categoryChoices: { flexDirection: "row", gap: 8 },
  categoryChoice: { flex: 1, minHeight: 36, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  categoryChoiceText: { fontSize: 10, lineHeight: 13, fontWeight: "900", letterSpacing: 0.7 },
  lootToggle: { minHeight: 57, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, padding: 11, flexDirection: "row", gap: 10, alignItems: "center" },
  lootToggleCopy: { flex: 1 },
  lootToggleTitle: { fontSize: 13, lineHeight: 18, fontWeight: "800" },
  lootToggleDetail: { fontSize: 11, lineHeight: 16, marginTop: 1, fontWeight: "500" },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  categoryPill: { minHeight: 35, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, flexDirection: "row", gap: 5, alignItems: "center" },
  categoryLabel: { fontSize: 11, lineHeight: 15, fontWeight: "800" },
  rewardStack: { gap: 11 },
  rewardCard: { gap: 12 },
  rewardHead: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  rewardIcon: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  rewardCopy: { flex: 1, gap: 2 },
  rewardTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  rewardDescription: { fontSize: 11, lineHeight: 16, fontWeight: "500" },
  rewardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 9 },
  rewardTags: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 5 },
});
