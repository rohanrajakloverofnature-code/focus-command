import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { CommandButton, CommandCard, IconAction, LoadingScreen, ScreenTitle, SectionHeader, StatusPill } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { pickAndPersistLaunchAnimationAudio, pickAndPersistLaunchAnimationVisual, removePersistedLaunchAnimationMedia } from "@/lib/launch-animation-media";
import { useFocusCommand } from "@/lib/focus-command";
import { useRouter } from "expo-router";

export default function LaunchAnimationScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, ready, updateProfile } = useFocusCommand();
  const [busy, setBusy] = useState(false);
  const config = state.profile.launchAnimation;

  if (!ready) return <LoadingScreen label="Opening launch animation…" />;

  const setEnabled = (enabled: boolean) => updateProfile({ launchAnimation: { ...config, enabled } });

  const chooseVisual = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const selected = await pickAndPersistLaunchAnimationVisual();
      if (!selected) return;
      const previous = config.visual;
      updateProfile({ launchAnimation: { ...config, visual: selected } });
      if (previous?.uri && previous.uri !== selected.uri) await removePersistedLaunchAnimationMedia(previous.uri);
      Alert.alert("Launch visual saved", `${selected.name} is ready. Add a valid launch audio file to activate the custom pair.`);
    } catch (error) {
      Alert.alert("Launch visual not saved", error instanceof Error ? error.message : "Choose a transparent animated GIF or animated WebP and try again.");
    } finally {
      setBusy(false);
    }
  };

  const chooseAudio = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const selected = await pickAndPersistLaunchAnimationAudio();
      if (!selected) return;
      const previous = config.audio;
      updateProfile({ launchAnimation: { ...config, audio: selected } });
      if (previous?.uri && previous.uri !== selected.uri) await removePersistedLaunchAnimationMedia(previous.uri);
      Alert.alert("Launch audio saved", `${selected.name} (${selected.durationSeconds.toFixed(2)}s) will start with your custom visual.`);
    } catch (error) {
      Alert.alert("Launch audio not saved", error instanceof Error ? error.message : "Choose a readable 5–10 second audio file and try again.");
    } finally {
      setBusy(false);
    }
  };

  const resetVisual = () => {
    if (!config.visual) return;
    Alert.alert("Remove custom visual?", "The original transparent fire and crackle remain active unless a complete new visual and audio pair is saved.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => {
        const previous = config.visual;
        if (!previous) return;
        updateProfile({ launchAnimation: { ...config, visual: null } });
        void removePersistedLaunchAnimationMedia(previous.uri);
      } },
    ]);
  };

  const resetAudio = () => {
    if (!config.audio) return;
    Alert.alert("Remove custom audio?", "The original fire animation and crackle remain active unless a complete new visual and audio pair is saved.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => {
        const previous = config.audio;
        if (!previous) return;
        updateProfile({ launchAnimation: { ...config, audio: null } });
        void removePersistedLaunchAnimationMedia(previous.uri);
      } },
    ]);
  };

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenTitle eyebrow="Character presentation" title="Launch animation" detail="Control the complete opening sequence without changing the rest of Focus Command." right={<IconAction icon="xmark" label="Close launch animation" onPress={() => router.back()} />} />

        <CommandCard accent={colors.primary} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.copy}>
              <Text style={[styles.title, { color: colors.foreground }]}>Launch animation</Text>
              <Text style={[styles.detail, { color: colors.muted }]}>Turn the fire/video, motivational quote, and glaze on or off together.</Text>
            </View>
            <Switch value={config.enabled} onValueChange={setEnabled} trackColor={{ false: colors.border, true: colors.primary }} accessibilityLabel="Turn complete launch sequence on or off" />
          </View>
          <View style={[styles.statusLine, { borderTopColor: colors.border }]}>
            <StatusPill label={config.enabled ? "ON" : "OFF"} tone={config.enabled ? "success" : "neutral"} />
            <Text style={[styles.statusCopy, { color: colors.muted }]}>{config.enabled ? "Runs once each fresh app launch." : "Home opens directly; your chosen files are kept."}</Text>
          </View>
        </CommandCard>

        <SectionHeader title="Custom launch media" />
        <CommandCard accent={colors.primary} style={styles.card}>
          <Text style={[styles.title, { color: colors.foreground }]}>{config.visual && config.audio ? "Custom launch pair ready" : "Default fire animation active"}</Text>
          <Text style={[styles.detail, { color: colors.muted }]}>{config.visual && config.audio ? "Your transparent visual and audio start together once at launch." : "Both a visual and 5–10 second audio file are required; the original transparent fire and crackle remain the fallback."}</Text>
          <Text style={[styles.helper, { color: colors.muted }]}>Transparent visual: animated GIF or animated WebP. Both files stay only on this device and are included in Offline Backup File.</Text>
          <View style={styles.actions}>
            <CommandButton label={config.visual ? "Replace GIF / WebP" : "Choose GIF / WebP"} onPress={() => void chooseVisual()} disabled={busy} />
            {config.visual ? <Pressable accessibilityRole="button" disabled={busy} onPress={resetVisual} style={({ pressed }) => [styles.reset, { borderColor: colors.border, opacity: busy ? 0.5 : pressed ? 0.7 : 1 }]}><Text style={[styles.resetText, { color: colors.muted }]}>Remove visual</Text></Pressable> : null}
          </View>
          {config.visual ? <Text style={[styles.selected, { color: colors.muted }]}>{config.visual.name}</Text> : null}
          <View style={styles.actions}>
            <CommandButton label={config.audio ? "Replace audio" : "Choose audio"} onPress={() => void chooseAudio()} disabled={busy} />
            {config.audio ? <Pressable accessibilityRole="button" disabled={busy} onPress={resetAudio} style={({ pressed }) => [styles.reset, { borderColor: colors.border, opacity: busy ? 0.5 : pressed ? 0.7 : 1 }]}><Text style={[styles.resetText, { color: colors.muted }]}>Remove audio</Text></Pressable> : null}
          </View>
          {config.audio ? <Text style={[styles.selected, { color: colors.muted }]}>{config.audio.name} · {config.audio.durationSeconds.toFixed(2)}s</Text> : null}
        </CommandCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 18, gap: 14 },
  card: { gap: 12 },
  row: { flexDirection: "row", gap: 16, alignItems: "center", justifyContent: "space-between" },
  copy: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontWeight: "800", letterSpacing: 0.2 },
  detail: { fontSize: 13, lineHeight: 19 },
  helper: { fontSize: 12, lineHeight: 18 },
  selected: { fontSize: 12, marginTop: -4 },
  statusLine: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  statusCopy: { fontSize: 12, flex: 1 },
  actions: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 4 },
  reset: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12 },
  resetText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.35, textTransform: "uppercase" },
});
