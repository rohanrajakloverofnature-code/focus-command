import React, { useState } from "react";
import { ScrollView, View, Text, Pressable, FlatList, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

interface Equipment {
  id: string;
  name: string;
  description: string | null;
  type: "FocusDevice" | "EnergyPack" | "AuraGenerator";
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  level: number;
  xpModifier: number;
  energyConsumptionModifier: number;
  imageUrl: string | null;
}

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

export default function EquipmentRewardsScreen() {
  const colors = useColors();
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const allEquipmentQuery = trpc.equipment.getAllEquipment.useQuery();
  const addToInventoryMutation = trpc.equipment.addToInventory.useMutation();

  const handleAddToInventory = async (equipment: Equipment) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await addToInventoryMutation.mutateAsync({
        equipmentId: equipment.id,
      });
      setSelectedEquipment(null);
      // Show success feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Failed to add equipment:", error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const isLoading = allEquipmentQuery.isLoading;

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  const allEquipment = allEquipmentQuery.data || [];

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Equipment Rewards</Text>
            <Text className="text-sm text-muted">Available equipment you can earn or acquire</Text>
          </View>

          {/* Equipment Grid */}
          {allEquipment.length === 0 ? (
            <Text className="text-sm text-muted italic">No equipment available</Text>
          ) : (
            <FlatList
              data={allEquipment}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              numColumns={2}
              columnWrapperStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <Animated.View entering={FadeIn} exiting={FadeOut} className="flex-1">
                  <Pressable
                    onPress={() => setSelectedEquipment(item)}
                    style={({ pressed }) => [
                      {
                        backgroundColor: colors.surface,
                        borderColor: rarityColors[item.rarity],
                        borderWidth: 2,
                        borderRadius: 12,
                        padding: 12,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <View className="gap-2">
                      <Text className="text-2xl">{typeEmojis[item.type]}</Text>
                      <Text
                        className="text-sm font-bold"
                        style={{ color: rarityColors[item.rarity] }}
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>
                      <Text className="text-xs text-muted">{item.type}</Text>
                      <View className="flex-row gap-1 mt-1">
                        <Text className="text-xs text-primary font-semibold">
                          +{((item.xpModifier - 100) * 100).toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              )}
            />
          )}
        </View>
      </ScrollView>

      {/* Equipment Detail Modal */}
      {selectedEquipment && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          className="absolute inset-0 bg-black/50 flex items-center justify-center"
        >
          <Pressable
            className="absolute inset-0"
            onPress={() => setSelectedEquipment(null)}
          />
          <View
            className="bg-surface rounded-2xl p-6 w-11/12 gap-4"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="gap-2">
              <Text className="text-4xl text-center">{typeEmojis[selectedEquipment.type]}</Text>
              <Text
                className="text-2xl font-bold text-center"
                style={{ color: rarityColors[selectedEquipment.rarity] }}
              >
                {selectedEquipment.name}
              </Text>
              <Text className="text-sm text-muted text-center">{selectedEquipment.description}</Text>
            </View>

            <View className="gap-2 border-t border-border pt-4">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Type:</Text>
                <Text className="text-sm font-semibold text-foreground">{selectedEquipment.type}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Rarity:</Text>
                <Text
                  className="text-sm font-semibold"
                  style={{ color: rarityColors[selectedEquipment.rarity] }}
                >
                  {selectedEquipment.rarity}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Level:</Text>
                <Text className="text-sm font-semibold text-foreground">{selectedEquipment.level}</Text>
              </View>
            </View>

            <View className="gap-2 border-t border-border pt-4">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">XP Bonus:</Text>
                <Text className="text-sm font-semibold text-primary">
                  +{((selectedEquipment.xpModifier - 100) * 100).toFixed(0)}%
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Energy Reduction:</Text>
                <Text className="text-sm font-semibold text-primary">
                  -{((100 - selectedEquipment.energyConsumptionModifier) * 100).toFixed(0)}%
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="gap-2 border-t border-border pt-4">
              <Pressable
                onPress={() => handleAddToInventory(selectedEquipment)}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                    padding: 12,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-center font-semibold text-white">Add to Inventory</Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedEquipment(null)}
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
