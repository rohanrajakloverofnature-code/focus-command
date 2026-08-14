import { router } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { CommandCard, IconAction, LoadingScreen, ScreenTitle, SectionHeader, StatusPill } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { type CharacterCinematicVariant } from "@/lib/character-development";
import { pickAndPersistCharacterMusic, pickAndPersistCharacterPortrait, pickAndPersistCharacterVideo, removePersistedCharacterMedia, type CharacterMusicSlot } from "@/lib/character-form-media";
import { getResolvedRankTitles, type CharacterCinematicMusicPair, type CustomCharacterForm, useFocusCommand } from "@/lib/focus-command";
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

const EMPTY_MUSIC: CharacterCinematicMusicPair = { duringVideo: null, postVideo: null };

function MusicControl({ slot, current, isBusy, onChoose, onRemove, required = false }: {
  slot: CharacterMusicSlot;
  current: CharacterCinematicMusicPair[CharacterMusicSlot];
  isBusy: boolean;
  onChoose: () => void;
  onRemove: () => void;
  required?: boolean;
}) {
  const colors = useColors();
  const isDuringVideo = slot === "duringVideo";
  const duration = isDuringVideo ? "10.00–10.50 s" : "7.00–8.00 s";
  return (
    <View style={[styles.musicControl, { borderColor: current ? `${colors.success}66` : colors.border, backgroundColor: current ? `${colors.success}0D` : colors.background }]}>
      <View style={styles.musicCopy}>
        <Text style={[styles.musicLabel, { color: colors.foreground }]}>{isDuringVideo ? "DURING-VIDEO BGM" : "POST-VIDEO CUE"}</Text>
        <Text numberOfLines={2} style={[styles.musicDetail, { color: current ? colors.success : colors.muted }]}>{current ? `${current.name} · ${current.durationSeconds.toFixed(2)} s` : required ? `Required · ${duration}` : `Bundled default · ${duration}`}</Text>
      </View>
      <View style={styles.musicButtons}>
        <Pressable accessibilityRole="button" disabled={isBusy} onPress={onChoose} style={({ pressed }) => [styles.smallAction, { borderColor: colors.primary, opacity: isBusy ? 0.5 : pressed ? 0.72 : 1 }]}><Text style={[styles.smallActionText, { color: colors.primary }]}>{current ? "REPLACE" : "CHOOSE"}</Text></Pressable>
        {current ? <Pressable accessibilityRole="button" disabled={isBusy} onPress={onRemove} style={({ pressed }) => [styles.resetAction, { opacity: isBusy ? 0.5 : pressed ? 0.7 : 1 }]}><Text style={[styles.resetText, { color: colors.muted }]}>Reset</Text></Pressable> : null}
      </View>
    </View>
  );
}

export default function CinematicLibraryScreen() {
  const colors = useColors();
  const { state, ready, setCinematicOverride, removeCinematicOverride, updateProfile } = useFocusCommand();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  if (!ready) return <LoadingScreen label="Opening cinematic library…" />;

  const chooseVideo = async (entry: CinematicEntry) => {
    if (busyKey) return;
    setBusyKey(`${entry.variant}-video`);
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
      setBusyKey(null);
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

  const replaceExistingMusic = async (entry: CinematicEntry, slot: CharacterMusicSlot) => {
    if (busyKey) return;
    setBusyKey(`${entry.variant}-${slot}`);
    try {
      const selected = await pickAndPersistCharacterMusic(entry.variant, slot);
      if (!selected) return;
      const previousPair = state.profile.localCinematicMusicOverrides[entry.variant] ?? EMPTY_MUSIC;
      const previous = previousPair[slot];
      updateProfile({ localCinematicMusicOverrides: { ...state.profile.localCinematicMusicOverrides, [entry.variant]: { ...previousPair, [slot]: selected } } });
      if (previous?.uri && previous.uri !== selected.uri) await removePersistedCharacterMedia(previous.uri);
      Alert.alert("Custom music saved", `${selected.name} will play for ${entry.name}.`);
    } catch (error) {
      Alert.alert("Music not saved", error instanceof Error ? error.message : "Choose a standard audio file and try again.");
    } finally {
      setBusyKey(null);
    }
  };

  const resetExistingMusic = (entry: CinematicEntry, slot: CharacterMusicSlot) => {
    const pair = state.profile.localCinematicMusicOverrides[entry.variant] ?? EMPTY_MUSIC;
    const current = pair[slot];
    if (!current) return;
    Alert.alert("Restore bundled music?", `${entry.name} will use its existing Focus Command ${slot === "duringVideo" ? "during-video soundtrack" : "ending cue"} again.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Restore default", style: "destructive", onPress: () => {
        updateProfile({ localCinematicMusicOverrides: { ...state.profile.localCinematicMusicOverrides, [entry.variant]: { ...pair, [slot]: null } } });
        void removePersistedCharacterMedia(current.uri);
      } },
    ]);
  };

  const updateCustomForm = (id: string, patch: Partial<CustomCharacterForm>) => {
    updateProfile({ customCharacterForms: state.profile.customCharacterForms.map((form) => form.id === id ? { ...form, ...patch } : form) });
  };

  const addCustomForm = () => {
    const highest = state.profile.customCharacterForms.reduce((level, form) => Math.max(level, form.activationLevel), 0);
    const activationLevel = Math.max(1, highest + Math.max(1, state.profile.titleChangeInterval));
    if (activationLevel > state.profile.maxLevel) {
      Alert.alert("Increase Maximum level first", `The next custom form would activate at level ${activationLevel}, beyond the current maximum level of ${state.profile.maxLevel}.`);
      return;
    }
    const form: CustomCharacterForm = {
      id: `custom_form_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: `Custom form ${state.profile.customCharacterForms.length + 1}`,
      activationLevel,
      portrait: null,
      video: null,
      music: { duringVideo: null, postVideo: null },
      createdAt: new Date().toISOString(),
    };
    updateProfile({ customCharacterForms: [...state.profile.customCharacterForms, form] });
  };

  const updateActivationLevel = (form: CustomCharacterForm, rawValue: string) => {
    const activationLevel = Math.floor(Number(rawValue));
    if (!Number.isInteger(activationLevel) || activationLevel < 1 || activationLevel > state.profile.maxLevel) {
      Alert.alert("Invalid activation level", `Use a whole-number level from 1 to ${state.profile.maxLevel}.`);
      return;
    }
    if (state.profile.customCharacterForms.some((candidate) => candidate.id !== form.id && candidate.activationLevel === activationLevel)) {
      Alert.alert("Activation level already used", "Each custom character form needs its own activation level.");
      return;
    }
    updateCustomForm(form.id, { activationLevel });
  };

  const chooseCustomMedia = async (form: CustomCharacterForm, slot: "portrait" | "video" | CharacterMusicSlot) => {
    if (busyKey) return;
    setBusyKey(`${form.id}-${slot}`);
    try {
      if (slot === "portrait") {
        const selected = await pickAndPersistCharacterPortrait(form.id);
        if (!selected) return;
        updateCustomForm(form.id, { portrait: selected });
        if (form.portrait?.uri !== selected.uri) await removePersistedCharacterMedia(form.portrait?.uri ?? "");
      } else if (slot === "video") {
        const selected = await pickAndPersistCharacterVideo(form.id);
        if (!selected) return;
        updateCustomForm(form.id, { video: selected });
        if (form.video?.uri !== selected.uri) await removePersistedCharacterMedia(form.video?.uri ?? "");
      } else {
        const selected = await pickAndPersistCharacterMusic(form.id, slot);
        if (!selected) return;
        const previous = form.music[slot];
        updateCustomForm(form.id, { music: { ...form.music, [slot]: selected } });
        if (previous?.uri !== selected.uri) await removePersistedCharacterMedia(previous?.uri ?? "");
      }
    } catch (error) {
      Alert.alert("Media not saved", error instanceof Error ? error.message : "The selected file could not be saved.");
    } finally {
      setBusyKey(null);
    }
  };

  const resetCustomMusic = (form: CustomCharacterForm, slot: CharacterMusicSlot) => {
    const current = form.music[slot];
    if (!current) return;
    updateCustomForm(form.id, { music: { ...form.music, [slot]: null } });
    void removePersistedCharacterMedia(current.uri);
  };

  const removeCustomForm = (form: CustomCharacterForm) => {
    Alert.alert("Remove custom character form?", `${form.name} and its local portrait, video, and music files will be removed. Focus Command will safely fall back to the next eligible form.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove form", style: "destructive", onPress: () => {
        updateProfile({ customCharacterForms: state.profile.customCharacterForms.filter((candidate) => candidate.id !== form.id) });
        [form.portrait, form.video, form.music.duringVideo, form.music.postVideo].forEach((media) => { if (media?.uri) void removePersistedCharacterMedia(media.uri); });
      } },
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
              detail="Choose device-local media for each character form. The profile-logo control itself remains unchanged."
              right={<IconAction icon="xmark" label="Close cinematic library" onPress={() => router.back()} />}
            />
            <CommandCard accent={colors.primary} style={[styles.introCard, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}55` }]}>
              <Text style={[styles.introTitle, { color: colors.foreground }]}>Offline cinematic library</Text>
              <Text style={[styles.introCopy, { color: colors.muted }]}>Each video keeps its embedded sound. A validated 10.00–10.50 second BGM starts with it, and a validated 7.00–8.00 second cue follows during the existing information reveal. Files remain only in private local storage.</Text>
            </CommandCard>
            <SectionHeader title="Eight character forms" />
          </>
        )}
        renderItem={({ item }) => {
          const override = state.profile.localCinematicOverrides[item.variant];
          const music = state.profile.localCinematicMusicOverrides[item.variant] ?? EMPTY_MUSIC;
          const isSaving = busyKey === `${item.variant}-video`;
          const isBusy = busyKey !== null;
          return (
            <CommandCard accent={override || music.duringVideo || music.postVideo ? colors.success : colors.primary} style={styles.card}>
              <View style={styles.cardHeader}>
                <Image source={item.portrait} style={[styles.portrait, { borderColor: override ? colors.success : colors.primary }]} resizeMode="cover" />
                <View style={styles.copyColumn}>
                  <View style={styles.nameLine}>
                    <Text numberOfLines={1} style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
                    <StatusPill label={override || music.duringVideo || music.postVideo ? "CUSTOM" : "DEFAULT"} tone={override || music.duringVideo || music.postVideo ? "success" : "neutral"} />
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
              <MusicControl slot="duringVideo" current={music.duringVideo} isBusy={isBusy} onChoose={() => { void replaceExistingMusic(item, "duringVideo"); }} onRemove={() => resetExistingMusic(item, "duringVideo")} />
              <MusicControl slot="postVideo" current={music.postVideo} isBusy={isBusy} onChoose={() => { void replaceExistingMusic(item, "postVideo"); }} onRemove={() => resetExistingMusic(item, "postVideo")} />
            </CommandCard>
          );
        }}
        ListFooterComponent={(
          <View style={styles.customSection}>
            <SectionHeader title="Custom character forms" action="Create form" onAction={addCustomForm} />
            <Text style={[styles.customIntro, { color: colors.muted }]}>A complete form takes over at its activation level. A draft stays hidden from the profile until its PNG, video, and both music tracks are present.</Text>
            {state.profile.customCharacterForms.slice().sort((left, right) => left.activationLevel - right.activationLevel || left.createdAt.localeCompare(right.createdAt)).map((form) => {
              const complete = Boolean(form.name.trim() && form.portrait && form.video && form.music.duringVideo && form.music.postVideo);
              const isBusy = busyKey !== null;
              const activeRankTitle = getResolvedRankTitles(state.profile).filter((rank) => rank.startLevel <= form.activationLevel).at(-1)?.name ?? "No rank title";
              return (
                <CommandCard key={form.id} accent={complete ? colors.success : colors.warning} style={styles.card}>
                  <View style={styles.cardHeader}>
                    {form.portrait ? <Image source={{ uri: form.portrait.uri }} style={[styles.portrait, { borderColor: complete ? colors.success : colors.warning }]} resizeMode="cover" /> : <View style={[styles.emptyPortrait, { backgroundColor: `${colors.warning}14`, borderColor: colors.warning }]}><Text style={[styles.emptyPortraitText, { color: colors.warning }]}>PNG</Text></View>}
                    <View style={styles.copyColumn}>
                      <View style={styles.nameLine}><Text numberOfLines={1} style={[styles.name, { color: colors.foreground }]}>{form.name || "Untitled custom form"}</Text><StatusPill label={complete ? "READY" : "DRAFT"} tone={complete ? "success" : "warning"} /></View>
                      <Text style={[styles.availability, { color: colors.muted }]}>Activates at level {form.activationLevel} · {activeRankTitle}</Text>
                      <Text numberOfLines={1} style={[styles.videoName, { color: form.video ? colors.success : colors.muted }]}>{form.video ? `Video: ${form.video.name}` : "Video required before activation"}</Text>
                    </View>
                  </View>
                  <TextInput value={form.name} onChangeText={(name) => updateCustomForm(form.id, { name })} placeholder="Character form name" placeholderTextColor={colors.muted} returnKeyType="done" style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} />
                  <View style={styles.levelEditor}><Text style={[styles.levelLabel, { color: colors.muted }]}>Activation level</Text><TextInput defaultValue={String(form.activationLevel)} onEndEditing={(event) => updateActivationLevel(form, event.nativeEvent.text)} keyboardType="number-pad" returnKeyType="done" style={[styles.levelInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} /></View>
                  <View style={styles.actions}>
                    <Pressable accessibilityRole="button" disabled={isBusy} onPress={() => { void chooseCustomMedia(form, "portrait"); }} style={({ pressed }) => [styles.chooseButton, { borderColor: colors.primary, opacity: isBusy ? 0.5 : pressed ? 0.72 : 1 }]}><Text style={[styles.chooseText, { color: colors.primary }]}>{form.portrait ? "REPLACE PNG PORTRAIT" : "CHOOSE PNG PORTRAIT"}</Text></Pressable>
                    <Pressable accessibilityRole="button" disabled={isBusy} onPress={() => { void chooseCustomMedia(form, "video"); }} style={({ pressed }) => [styles.chooseButton, { borderColor: colors.primary, opacity: isBusy ? 0.5 : pressed ? 0.72 : 1 }]}><Text style={[styles.chooseText, { color: colors.primary }]}>{form.video ? "REPLACE VIDEO" : "CHOOSE VIDEO"}</Text></Pressable>
                  </View>
                  <MusicControl slot="duringVideo" current={form.music.duringVideo} isBusy={isBusy} required onChoose={() => { void chooseCustomMedia(form, "duringVideo"); }} onRemove={() => resetCustomMusic(form, "duringVideo")} />
                  <MusicControl slot="postVideo" current={form.music.postVideo} isBusy={isBusy} required onChoose={() => { void chooseCustomMedia(form, "postVideo"); }} onRemove={() => resetCustomMusic(form, "postVideo")} />
                  <Pressable accessibilityRole="button" disabled={isBusy} onPress={() => removeCustomForm(form)} style={({ pressed }) => [styles.removeForm, { opacity: isBusy ? 0.5 : pressed ? 0.7 : 1 }]}><Text style={[styles.removeFormText, { color: colors.error }]}>Remove custom form</Text></Pressable>
                </CommandCard>
              );
            })}
          </View>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 28 },
  introCard: { gap: 8, marginBottom: 6 },
  introTitle: { fontSize: 16, fontWeight: "800", letterSpacing: 0.2 },
  introCopy: { fontSize: 13, lineHeight: 19 },
  customSection: { gap: 10, marginTop: 10 },
  customIntro: { fontSize: 12, lineHeight: 17 },
  card: { gap: 14 },
  cardHeader: { alignItems: "center", flexDirection: "row", gap: 12 },
  portrait: { borderRadius: 14, borderWidth: 1.5, height: 68, width: 68 },
  emptyPortrait: { alignItems: "center", borderRadius: 14, borderWidth: 1.5, height: 68, justifyContent: "center", width: 68 },
  emptyPortraitText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.6 },
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
  musicControl: { alignItems: "center", borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 10, minHeight: 64, padding: 10 },
  musicCopy: { flex: 1, gap: 3, minWidth: 0 },
  musicLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 0.55 },
  musicDetail: { fontSize: 11, fontWeight: "600", lineHeight: 15 },
  musicButtons: { alignItems: "flex-end", gap: 4 },
  smallAction: { alignItems: "center", borderRadius: 8, borderWidth: 1, justifyContent: "center", minHeight: 30, minWidth: 66, paddingHorizontal: 8 },
  smallActionText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.45 },
  resetAction: { alignItems: "center", justifyContent: "center", minHeight: 22 },
  resetText: { fontSize: 11, fontWeight: "700" },
  formInput: { borderRadius: 10, borderWidth: 1, fontSize: 14, minHeight: 42, paddingHorizontal: 12 },
  levelEditor: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  levelLabel: { fontSize: 12, fontWeight: "700" },
  levelInput: { borderRadius: 9, borderWidth: 1, fontSize: 13, fontWeight: "800", minHeight: 38, paddingHorizontal: 10, textAlign: "center", width: 96 },
  removeForm: { alignItems: "center", justifyContent: "center", minHeight: 34 },
  removeFormText: { fontSize: 12, fontWeight: "800" },
});
