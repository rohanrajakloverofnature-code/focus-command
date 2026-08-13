import { router } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { CommandCard, IconAction, LoadingScreen, ScreenTitle, SectionHeader, StatusPill } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { type CharacterCinematicVariant } from "@/lib/character-development";
import { useFocusCommand } from "@/lib/focus-command";
import { pickAndPersistCinematicVideo, removePersistedCinematicVideo } from "@/lib/focus-cinematic-library";

type CinematicEntry = {
  variant: CharacterCinematicVariant;
  name: string;
  availability: string;
  portrait: number;
};

const CINEMATIC_ENTRIES: CinematicEntry[] = [
  { variant: "tactical", name: "Recruit", availability: "Tactical family · Levels 0–89", portrait: require("@/assets/images/characters/recruit.jpg") },
  { variant: "tacticalEvolution", name: "Tactical Evolution", availability: "Tactical family · Level 90+", portrait: require("@/assets/images/characters/evolution/tactical.png") },
  { variant: "command", name: "Officer", availability: "Command family · Levels 0–89", portrait: require("@/assets/images/characters/officer.jpg") },
  { variant: "commandEvolution", name: "Command Evolution", availability: "Command family · Level 90+", portrait: require("@/assets/images/characters/evolution/command.png") },
  { variant: "shadow", name: "Shadow", availability: "Shadow family · All levels", portrait: require("@/assets/images/characters/evolution/shadow.png") },
  { variant: "ascendant", name: "Vanguard", availability: "Ascendant family · Levels 0–29", portrait: require("@/assets/images/characters/vanguard.jpg") },
  { variant: "baseAscendant", name: "Base Ascendant", availability: "Ascendant family · Levels 30–179", portrait: require("@/assets/images/characters/ascendant.jpg") },
  { variant: "sovereignAscendant", name: "Sovereign Ascendant Evolution", availability: "Ascendant family · Level 180+", portrait: require("@/assets/images/characters/evolution/ascendant.png") },
];

export default function CinematicLibraryScreen() {
  const colors = useColors();
  const { state, ready, setCinematicOverride, removeCinematicOverride } = useFocusCommand();
  const [savingVariant, setSavingVariant] = useState<CharacterCinematicVariant | null>(null);

  if (!ready) return <LoadingScreen label="Opening cinematic library…" />;

  const chooseVideo = async (entry: CinematicEntry) => {
    if (savingVariant) return;
    setSavingVariant(entry.variant);
    try {
      const selected = await pickAndPersistCinematicVideo(entry.variant);
      if (!selected) return;
      const previous = state.profile.localCinematicOverrides[entry.variant];
      setCinematicOverride(entry.variant, selected);
      if (previous?.uri && previous.uri !== selected.uri) await removePersistedCinematicVideo(previous.uri);
      Alert.alert("Custom cinematic saved", `${selected.name} will play for ${entry.name} on your next character cinematic.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Choose a standard device video such as MP4, MOV, or M4V and try again.";
      Alert.alert("Video unavailable", message);
    } finally {
      setSavingVariant(null);
    }
  };

  const restoreDefault = (entry: CinematicEntry) => {
    const current = state.profile.localCinematicOverrides[entry.variant];
    if (!current) return;
    Alert.alert("Restore bundled cinematic?", `${entry.name} will use its original Focus Command video again.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Restore default",
        style: "destructive",
        onPress: () => {
          removeCinematicOverride(entry.variant);
          void removePersistedCinematicVideo(current.uri);
        },
      },
    ]);
  };

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]}>
      <FlatList
        data={CINEMATIC_ENTRIES}
        keyExtractor={(entry) => entry.variant}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={(
          <>
            <ScreenTitle
              eyebrow="Hamburger menu"
              title="Character cinematics"
              detail="Replace any character’s cinematic with a video stored only on this device."
              right={<IconAction icon="xmark" label="Close cinematic library" onPress={() => router.back()} />}
            />
            <CommandCard accent={colors.primary} style={[styles.introCard, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}55` }]}>
              <Text style={[styles.introTitle, { color: colors.foreground }]}>Offline cinematic library</Text>
              <Text style={[styles.introCopy, { color: colors.muted }]}>Choose an MP4, MOV, or M4V from your phone for a specific portrait. Focus Command copies it into private local storage. Removing a custom file restores the matching bundled default without changing the profile-logo interaction, audio cues, or timing.</Text>
            </CommandCard>
            <SectionHeader title="Eight character forms" />
          </>
        )}
        renderItem={({ item }) => {
          const override = state.profile.localCinematicOverrides[item.variant];
          const isSaving = savingVariant === item.variant;
          const isBusy = savingVariant !== null;
          return (
            <CommandCard accent={override ? colors.success : colors.primary} style={styles.card}>
              <View style={styles.cardHeader}>
                <Image source={item.portrait} style={[styles.portrait, { borderColor: override ? colors.success : colors.primary }]} resizeMode="cover" />
                <View style={styles.copyColumn}>
                  <View style={styles.nameLine}>
                    <Text numberOfLines={1} style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
                    <StatusPill label={override ? "CUSTOM" : "DEFAULT"} tone={override ? "success" : "neutral"} />
                  </View>
                  <Text style={[styles.availability, { color: colors.muted }]}>{item.availability}</Text>
                  <Text numberOfLines={1} style={[styles.videoName, { color: override ? colors.success : colors.muted }]}>{override ? `Custom: ${override.name}` : "Bundled Focus Command cinematic"}</Text>
                </View>
              </View>
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isBusy}
                  onPress={() => { void chooseVideo(item); }}
                  style={({ pressed }) => [styles.chooseButton, { borderColor: colors.primary, opacity: isBusy ? 0.5 : pressed ? 0.72 : 1, transform: [{ scale: pressed && !isBusy ? 0.97 : 1 }] }]}
                >
                  <Text style={[styles.chooseText, { color: colors.primary }]}>{isSaving ? "SAVING…" : override ? "REPLACE VIDEO" : "CHOOSE VIDEO"}</Text>
                </Pressable>
                {override ? <Pressable accessibilityRole="button" disabled={isBusy} onPress={() => restoreDefault(item)} style={({ pressed }) => [styles.restoreButton, { opacity: isBusy ? 0.5 : pressed ? 0.7 : 1 }]}><Text style={[styles.restoreText, { color: colors.muted }]}>Remove custom · use default</Text></Pressable> : null}
              </View>
            </CommandCard>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 28 },
  introCard: { gap: 8, marginBottom: 6 },
  introTitle: { fontSize: 16, fontWeight: "800", letterSpacing: 0.2 },
  introCopy: { fontSize: 13, lineHeight: 19 },
  card: { gap: 14 },
  cardHeader: { alignItems: "center", flexDirection: "row", gap: 12 },
  portrait: { borderRadius: 14, borderWidth: 1.5, height: 68, width: 68 },
  copyColumn: { flex: 1, gap: 4, minWidth: 0 },
  nameLine: { alignItems: "center", flexDirection: "row", gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: "800" },
  availability: { fontSize: 12, lineHeight: 16 },
  videoName: { fontSize: 12, fontWeight: "700" },
  actions: { gap: 8 },
  chooseButton: { alignItems: "center", borderRadius: 10, borderWidth: 1, minHeight: 40, justifyContent: "center", paddingHorizontal: 14 },
  chooseText: { fontSize: 12, fontWeight: "900", letterSpacing: 0.55 },
  restoreButton: { alignItems: "center", minHeight: 30, justifyContent: "center" },
  restoreText: { fontSize: 12, fontWeight: "700" },
});
