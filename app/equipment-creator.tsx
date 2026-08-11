import React, { useState } from "react";
import { ScrollView, View, Text, TextInput, Pressable, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFocusCommand } from "@/lib/focus-command";
import { formatEquipmentModifierDelta } from "@/lib/equipment-modifiers";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary"] as const;
const types = ["FocusDevice", "EnergyPack", "AuraGenerator"] as const;

export default function EquipmentCreatorScreen() {
  const colors = useColors();
  const router = useRouter();
  const { addEquipment, state } = useFocusCommand();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<typeof types[number]>("FocusDevice");
  const [rarity, setRarity] = useState<typeof rarities[number]>("Common");
  const [level, setLevel] = useState("1");
  const [xpModifier, setXpModifier] = useState("100");
  const [energyModifier, setEnergyModifier] = useState("100");

  const handleCreate = () => {
    if (!name.trim()) {
      alert("Please enter equipment name");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    addEquipment({
      name: name.trim(),
      description: description.trim() || null,
      type,
      rarity,
      level: parseInt(level) || 1,
      xpModifier: parseInt(xpModifier) || 100,
      energyConsumptionModifier: parseInt(energyModifier) || 100,
      imageUrl: null,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setName("");
    setDescription("");
    setType("FocusDevice");
    setRarity("Common");
    setLevel("1");
    setXpModifier("100");
    setEnergyModifier("100");
    alert("Equipment created and added to your Inventory. Open Equipment to equip it in its matching slot.");
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Create Equipment</Text>
            <Text className="text-sm text-muted">Create gear and add it directly to your inventory</Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            {/* Name */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Equipment Name *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., Cognitive Amplifier"
                placeholderTextColor={colors.muted}
                className="border border-border rounded-lg p-3 text-foreground"
                style={{ borderColor: colors.border, color: colors.foreground }}
              />
            </View>

            {/* Description */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Optional description"
                placeholderTextColor={colors.muted}
                className="border border-border rounded-lg p-3 text-foreground"
                style={{ borderColor: colors.border, color: colors.foreground }}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Type */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Type</Text>
              <View className="flex-row gap-2">
                {types.map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setType(t)}
                    style={({ pressed }) => [
                      {
                        backgroundColor: type === t ? colors.primary : colors.surface,
                        borderColor: type === t ? colors.primary : colors.border,
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: 10,
                        opacity: pressed ? 0.8 : 1,
                        flex: 1,
                      },
                    ]}
                  >
                    <Text
                      className="text-xs font-semibold text-center"
                      style={{ color: type === t ? "white" : colors.foreground }}
                    >
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Rarity */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Rarity</Text>
              <FlatList
                data={rarities}
                keyExtractor={(item) => item}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => setRarity(item)}
                    style={({ pressed }) => [
                      {
                        backgroundColor: rarity === item ? colors.primary : colors.surface,
                        borderColor: rarity === item ? colors.primary : colors.border,
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: 10,
                        marginBottom: 8,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: rarity === item ? "white" : colors.foreground }}
                    >
                      {item}
                    </Text>
                  </Pressable>
                )}
              />
            </View>

            {/* Level */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Level</Text>
              <TextInput
                value={level}
                onChangeText={setLevel}
                placeholder="1"
                placeholderTextColor={colors.muted}
                className="border border-border rounded-lg p-3 text-foreground"
                style={{ borderColor: colors.border, color: colors.foreground }}
                keyboardType="number-pad"
              />
            </View>

            {/* XP Modifier */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">XP Modifier (%)</Text>
              <Text className="text-xs text-muted">100 = no change, 110 = +10%, 90 = -10%</Text>
              <TextInput
                value={xpModifier}
                onChangeText={setXpModifier}
                placeholder="100"
                placeholderTextColor={colors.muted}
                className="border border-border rounded-lg p-3 text-foreground"
                style={{ borderColor: colors.border, color: colors.foreground }}
                keyboardType="number-pad"
              />
            </View>

            {/* Energy Modifier */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Energy Consumption Modifier (%)</Text>
              <Text className="text-xs text-muted">100 = no change, 95 = -5%, 110 = +10%</Text>
              <TextInput
                value={energyModifier}
                onChangeText={setEnergyModifier}
                placeholder="100"
                placeholderTextColor={colors.muted}
                className="border border-border rounded-lg p-3 text-foreground"
                style={{ borderColor: colors.border, color: colors.foreground }}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Buttons */}
          <View className="gap-2">
            <Pressable
              onPress={handleCreate}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  padding: 14,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text className="text-center font-semibold text-white">Create Equipment</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.muted,
                  borderRadius: 8,
                  padding: 14,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text className="text-center font-semibold text-foreground">Cancel</Text>
            </Pressable>
          </View>

          {/* All Equipment List */}
          <View className="gap-3 border-t border-border pt-6">
            <Text className="text-lg font-semibold text-foreground">All Equipment ({state.allEquipment.length})</Text>
            <Text className="text-xs text-muted">Every item created here is already owned and ready to equip.</Text>
            {state.allEquipment.length === 0 ? (
              <Text className="text-sm text-muted italic">No equipment created yet</Text>
            ) : (
              <FlatList
                data={state.allEquipment}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View
                    className="bg-surface rounded-lg p-3 border border-border"
                    style={{ borderColor: colors.border }}
                  >
                    <Text className="text-sm font-semibold text-foreground">{item.name}</Text>
                    <Text className="text-xs text-muted">{item.type} • {item.rarity}</Text>
                    <Text className="text-xs text-primary mt-1">
                      XP: {formatEquipmentModifierDelta(item.xpModifier)} • Energy use: {formatEquipmentModifierDelta(item.energyConsumptionModifier)}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
