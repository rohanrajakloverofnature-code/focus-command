import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, FlatList, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

interface InventoryItem {
  id: number;
  equipmentId: string;
  userId: number;
  isEquipped: "head" | "body" | "accessory" | "false";
  createdAt: Date;
  updatedAt: Date;
  equipmentDetails: {
    id: string;
    name: string;
    description: string | null;
    type: "FocusDevice" | "EnergyPack" | "AuraGenerator";
    rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
    level: number;
    xpModifier: number;
    energyConsumptionModifier: number;
    imageUrl: string | null;
  };
}

const rarityColors: Record<string, string> = {
  Common: "#95a5a6",
  Uncommon: "#27ae60",
  Rare: "#3498db",
  Epic: "#9b59b6",
  Legendary: "#f39c12",
};

const slotNames: Record<string, string> = {
  head: "Focus Device",
  body: "Energy Pack",
  accessory: "Aura Generator",
};

export default function EquipmentInventoryScreen() {
  const colors = useColors();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<"head" | "body" | "accessory" | null>(null);

  const inventoryQuery = trpc.equipment.getInventory.useQuery();
  const equippedQuery = trpc.equipment.getEquipped.useQuery();
  const equipMutation = trpc.equipment.equip.useMutation();
  const unequipMutation = trpc.equipment.unequip.useMutation();
  const removeMutation = trpc.equipment.remove.useMutation();

  const handleEquip = async (item: InventoryItem, slot: "head" | "body" | "accessory") => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await equipMutation.mutateAsync({
        userEquipmentId: item.id,
        slot,
      });
      inventoryQuery.refetch();
      equippedQuery.refetch();
      setSelectedItem(null);
    } catch (error) {
      console.error("Failed to equip item:", error);
    }
  };

  const handleUnequip = async (item: InventoryItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await unequipMutation.mutateAsync({
        userEquipmentId: item.id,
      });
      inventoryQuery.refetch();
      equippedQuery.refetch();
      setSelectedItem(null);
    } catch (error) {
      console.error("Failed to unequip item:", error);
    }
  };

  const handleRemove = async (item: InventoryItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await removeMutation.mutateAsync({
        userEquipmentId: item.id,
      });
      inventoryQuery.refetch();
      setSelectedItem(null);
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  const isLoading = inventoryQuery.isLoading || equippedQuery.isLoading;

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  const inventory = inventoryQuery.data || [];

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Equipment Inventory</Text>
            <Text className="text-sm text-muted">Manage your gear and equip items to boost your stats</Text>
          </View>

          {/* Equipped Items Section */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Currently Equipped</Text>
            <View className="gap-2">
              {["head", "body", "accessory"].map((slot) => {
                const equipped = inventory.find((item) => item.isEquipped === slot);
                return (
                  <Pressable
                    key={slot}
                    onPress={() => {
                      if (equipped) {
                        setSelectedItem(equipped);
                        setSelectedSlot(slot as any);
                      }
                    }}
                    style={({ pressed }) => [
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <View className="gap-2">
                      <Text className="text-sm font-semibold text-muted">{slotNames[slot]}</Text>
                      {equipped ? (
                        <View>
                          <Text
                            className="text-base font-bold"
                            style={{ color: rarityColors[equipped.equipmentDetails.rarity] }}
                          >
                            {equipped.equipmentDetails.name}
                          </Text>
                          <Text className="text-xs text-muted mt-1">
                            XP: +{((equipped.equipmentDetails.xpModifier - 100) * 100).toFixed(0)}% | Energy:{" "}
                            {((100 - equipped.equipmentDetails.energyConsumptionModifier) * 100).toFixed(0)}%
                          </Text>
                        </View>
                      ) : (
                        <Text className="text-sm text-muted italic">No item equipped</Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Inventory Items Section */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Inventory</Text>
            {inventory.length === 0 ? (
              <Text className="text-sm text-muted italic">No items in inventory</Text>
            ) : (
              <FlatList
                data={inventory}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <Animated.View entering={FadeIn} exiting={FadeOut}>
                    <Pressable
                      onPress={() => {
                        setSelectedItem(item);
                        setSelectedSlot(null);
                      }}
                      style={({ pressed }) => [
                        {
                          backgroundColor: colors.surface,
                          borderColor:
                            item.isEquipped !== "false"
                              ? rarityColors[item.equipmentDetails.rarity]
                              : colors.border,
                          borderWidth: 2,
                          borderRadius: 12,
                          padding: 12,
                          marginBottom: 8,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <View className="gap-2">
                        <View className="flex-row justify-between items-start">
                          <View className="flex-1">
                            <Text
                              className="text-base font-bold"
                              style={{ color: rarityColors[item.equipmentDetails.rarity] }}
                            >
                              {item.equipmentDetails.name}
                            </Text>
                            <Text className="text-xs text-muted mt-1">{item.equipmentDetails.type}</Text>
                          </View>
                          {item.isEquipped !== "false" && (
                            <View
                              className="px-2 py-1 rounded-full"
                              style={{ backgroundColor: rarityColors[item.equipmentDetails.rarity] }}
                            >
                              <Text className="text-xs font-semibold text-white capitalize">
                                {item.isEquipped}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-xs text-muted">{item.equipmentDetails.description}</Text>
                        <View className="flex-row gap-4 mt-2">
                          <Text className="text-xs text-primary font-semibold">
                            XP: +{((item.equipmentDetails.xpModifier - 100) * 100).toFixed(0)}%
                          </Text>
                          <Text className="text-xs text-primary font-semibold">
                            Energy: -{((100 - item.equipmentDetails.energyConsumptionModifier) * 100).toFixed(0)}%
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                )}
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
          <Pressable
            className="absolute inset-0"
            onPress={() => {
              setSelectedItem(null);
              setSelectedSlot(null);
            }}
          />
          <View
            className="bg-surface rounded-2xl p-6 w-11/12 gap-4"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="gap-2">
              <Text
                className="text-2xl font-bold"
                style={{ color: rarityColors[selectedItem.equipmentDetails.rarity] }}
              >
                {selectedItem.equipmentDetails.name}
              </Text>
              <Text className="text-sm text-muted">{selectedItem.equipmentDetails.description}</Text>
            </View>

            <View className="gap-2 border-t border-border pt-4">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Type:</Text>
                <Text className="text-sm font-semibold text-foreground">{selectedItem.equipmentDetails.type}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Rarity:</Text>
                <Text
                  className="text-sm font-semibold"
                  style={{ color: rarityColors[selectedItem.equipmentDetails.rarity] }}
                >
                  {selectedItem.equipmentDetails.rarity}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Level:</Text>
                <Text className="text-sm font-semibold text-foreground">{selectedItem.equipmentDetails.level}</Text>
              </View>
            </View>

            <View className="gap-2 border-t border-border pt-4">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">XP Bonus:</Text>
                <Text className="text-sm font-semibold text-primary">
                  +{((selectedItem.equipmentDetails.xpModifier - 100) * 100).toFixed(0)}%
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Energy Reduction:</Text>
                <Text className="text-sm font-semibold text-primary">
                  -{((100 - selectedItem.equipmentDetails.energyConsumptionModifier) * 100).toFixed(0)}%
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="gap-2 border-t border-border pt-4">
              {selectedItem.isEquipped === "false" ? (
                <View className="gap-2">
                  <Pressable
                    onPress={() => handleEquip(selectedItem, "head")}
                    style={({ pressed }) => [
                      {
                        backgroundColor: colors.primary,
                        borderRadius: 8,
                        padding: 12,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text className="text-center font-semibold text-white">Equip as Focus Device</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleEquip(selectedItem, "body")}
                    style={({ pressed }) => [
                      {
                        backgroundColor: colors.primary,
                        borderRadius: 8,
                        padding: 12,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text className="text-center font-semibold text-white">Equip as Energy Pack</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleEquip(selectedItem, "accessory")}
                    style={({ pressed }) => [
                      {
                        backgroundColor: colors.primary,
                        borderRadius: 8,
                        padding: 12,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text className="text-center font-semibold text-white">Equip as Aura Generator</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => handleUnequip(selectedItem)}
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.warning,
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
                onPress={() => handleRemove(selectedItem)}
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
                onPress={() => {
                  setSelectedItem(null);
                  setSelectedSlot(null);
                }}
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
        </Animated.View>
      )}
    </ScreenContainer>
  );
}
