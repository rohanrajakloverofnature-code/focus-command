import React, { useState } from "react";
import { ScrollView, View, Text, Pressable, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFocusCommand, Equipment, UserEquipment } from "@/lib/focus-command";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const rarityColors: Record<string, string> = {
  Common: "#95a5a6",
  Uncommon: "#27ae60",
  Rare: "#3498db",
  Epic: "#9b59b6",
  Legendary: "#f39c12",
};

const typeEmojis: Record<string, string> = {
  FocusDevice: "🧠",
  EnergyPack: "⚡",
  AuraGenerator: "✨",
};

export default function EquipmentScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, equipItem, unequipItem, removeFromInventory, getEquippedItems } = useFocusCommand();
  const [selectedItem, setSelectedItem] = useState<UserEquipment | null>(null);

  const equippedItems = getEquippedItems();
  const inventoryItems = state.userEquipment.filter((ue) => ue.isEquipped === "false");

  const getEquipmentDetails = (equipmentId: string): Equipment | undefined => {
    return state.allEquipment.find((eq) => eq.id === equipmentId);
  };

  const handleEquip = (userEquipmentId: string, slot: "head" | "body" | "accessory") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    equipItem(userEquipmentId, slot);
    setSelectedItem(null);
  };

  const handleUnequip = (userEquipmentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    unequipItem(userEquipmentId);
    setSelectedItem(null);
  };

  const handleRemove = (userEquipmentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeFromInventory(userEquipmentId);
    setSelectedItem(null);
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-3xl font-bold text-foreground">Equipment</Text>
                <Text className="text-sm text-muted">Manage your gear and inventory</Text>
              </View>
              <Pressable
                onPress={() => router.push("/equipment-creator")}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <Text className="text-2xl">➕</Text>
              </Pressable>
            </View>
          </View>

          {/* Equipped Items */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Equipped</Text>
            <View className="gap-2">
              {["head", "body", "accessory"].map((slot) => {
                const equipment = equippedItems[slot as keyof typeof equippedItems];
                return (
                  <Pressable
                    key={slot}
                    onPress={() => equipment && setSelectedItem(state.userEquipment.find((ue) => ue.equipmentId === equipment.id) || null)}
                    style={({ pressed }) => [
                      {
                        backgroundColor: colors.surface,
                        borderColor: equipment ? rarityColors[equipment.rarity] : colors.border,
                        borderWidth: 2,
                        borderRadius: 12,
                        padding: 12,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3 flex-1">
                        <Text className="text-2xl">{equipment ? typeEmojis[equipment.type] : "❌"}</Text>
                        <View className="flex-1">
                          <Text className="text-xs text-muted capitalize">{slot}</Text>
                          <Text className="text-sm font-semibold text-foreground">
                            {equipment ? equipment.name : "Empty"}
                          </Text>
                        </View>
                      </View>
                      {equipment && (
                        <Text
                          className="text-xs font-bold"
                          style={{ color: rarityColors[equipment.rarity] }}
                        >
                          {equipment.rarity}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Inventory */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">Inventory</Text>
              <Text className="text-sm text-muted">{inventoryItems.length} items</Text>
            </View>
            {inventoryItems.length === 0 ? (
              <Text className="text-sm text-muted italic">No items in inventory</Text>
            ) : (
              <FlatList
                data={inventoryItems}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => {
                  const equipment = getEquipmentDetails(item.equipmentId);
                  if (!equipment) return null;
                  return (
                    <Animated.View entering={FadeIn} exiting={FadeOut}>
                      <Pressable
                        onPress={() => setSelectedItem(item)}
                        style={({ pressed }) => [
                          {
                            backgroundColor: colors.surface,
                            borderColor: rarityColors[equipment.rarity],
                            borderWidth: 1,
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 8,
                            opacity: pressed ? 0.7 : 1,
                          },
                        ]}
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-3 flex-1">
                            <Text className="text-xl">{typeEmojis[equipment.type]}</Text>
                            <View className="flex-1">
                              <Text className="text-sm font-semibold text-foreground">{equipment.name}</Text>
                              <Text className="text-xs text-muted">+{((equipment.xpModifier - 100) * 100).toFixed(0)}% XP</Text>
                            </View>
                          </View>
                          <Text
                            className="text-xs font-bold"
                            style={{ color: rarityColors[equipment.rarity] }}
                          >
                            {equipment.rarity}
                          </Text>
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                }}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Item Detail Modal */}
      {selectedItem && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          className="absolute inset-0 bg-black/50 flex items-center justify-center"
        >
          <Pressable className="absolute inset-0" onPress={() => setSelectedItem(null)} />
          {(() => {
            const equipment = getEquipmentDetails(selectedItem.equipmentId);
            if (!equipment) return null;
            return (
              <View
                className="bg-surface rounded-2xl p-6 w-11/12 gap-4"
                style={{ backgroundColor: colors.surface }}
              >
                <View className="gap-2">
                  <Text className="text-4xl text-center">{typeEmojis[equipment.type]}</Text>
                  <Text
                    className="text-2xl font-bold text-center"
                    style={{ color: rarityColors[equipment.rarity] }}
                  >
                    {equipment.name}
                  </Text>
                  <Text className="text-sm text-muted text-center">{equipment.description}</Text>
                </View>

                <View className="gap-2 border-t border-border pt-4">
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Type:</Text>
                    <Text className="text-sm font-semibold text-foreground">{equipment.type}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Rarity:</Text>
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: rarityColors[equipment.rarity] }}
                    >
                      {equipment.rarity}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Level:</Text>
                    <Text className="text-sm font-semibold text-foreground">{equipment.level}</Text>
                  </View>
                </View>

                <View className="gap-2 border-t border-border pt-4">
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">XP Bonus:</Text>
                    <Text className="text-sm font-semibold text-primary">
                      +{((equipment.xpModifier - 100) * 100).toFixed(0)}%
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Energy Reduction:</Text>
                    <Text className="text-sm font-semibold text-primary">
                      -{((100 - equipment.energyConsumptionModifier) * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="gap-2 border-t border-border pt-4">
                  {selectedItem.isEquipped === "false" ? (
                    <>
                      <Pressable
                        onPress={() => handleEquip(selectedItem.id, "head")}
                        style={({ pressed }) => [
                          {
                            backgroundColor: colors.primary,
                            borderRadius: 8,
                            padding: 12,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                      >
                        <Text className="text-center font-semibold text-white">Equip to Head</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleEquip(selectedItem.id, "body")}
                        style={({ pressed }) => [
                          {
                            backgroundColor: colors.primary,
                            borderRadius: 8,
                            padding: 12,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                      >
                        <Text className="text-center font-semibold text-white">Equip to Body</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleEquip(selectedItem.id, "accessory")}
                        style={({ pressed }) => [
                          {
                            backgroundColor: colors.primary,
                            borderRadius: 8,
                            padding: 12,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                      >
                        <Text className="text-center font-semibold text-white">Equip to Accessory</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      onPress={() => handleUnequip(selectedItem.id)}
                      style={({ pressed }) => [
                        {
                          backgroundColor: colors.primary,
                          borderRadius: 8,
                          padding: 12,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Text className="text-center font-semibold text-white">Unequip</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => handleRemove(selectedItem.id)}
                    style={({ pressed }) => [
                      {
                        backgroundColor: colors.error,
                        borderRadius: 8,
                        padding: 12,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text className="text-center font-semibold text-white">Remove from Inventory</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setSelectedItem(null)}
                    style={({ pressed }) => [
                      {
                        backgroundColor: colors.muted,
                        borderRadius: 8,
                        padding: 12,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text className="text-center font-semibold text-foreground">Close</Text>
                  </Pressable>
                </View>
              </View>
            );
          })()}
        </Animated.View>
      )}
    </ScreenContainer>
  );
}
