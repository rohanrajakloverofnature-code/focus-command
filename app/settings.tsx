import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Appearance, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { CommandButton, CommandCard, IconAction, LoadingScreen, ScreenTitle, SectionHeader, StatusPill } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useGoogleSheetsAuth } from "@/hooks/use-google-sheets-auth";
import { ComboTier, getComboTiers, PaletteToken, SoundRoleId, SoundStyle, type TickerColorPreference, type TickerColorSource, useFocusCommandActions, useFocusCommandReady, useFocusCommandSelector } from "@/lib/focus-command";
import { clearSelectedFocusWorkbook, createFocusWorkbook, getFocusWorkbookMetadata, getGoogleAccessToken, getSelectedFocusWorkbook, getSpreadsheet, readFocusWorkbook, saveSelectedFocusWorkbook, writeFocusWorkbook } from "@/lib/google-sheets";
import { configureDailyMissionReminder, enableFocusReminders, refreshScheduledReminderSounds } from "@/lib/focus-reminders";
import { chooseAndValidateOfflineBackup, createAndShareOfflineBackup, discardMaterializedOfflineBackup, materializeOfflineBackupMedia } from "@/lib/offline-backup";
import { useThemeContext } from "@/lib/theme-provider";
import { playFocusRole, releaseFocusCustomSound } from "@/lib/focus-audio";
import { pickAndPersistFocusSound, removePersistedFocusSound } from "@/lib/focus-sound-library";

export default function SettingsScreen() {
  const colors = useColors();
  const { setColorScheme } = useThemeContext();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const ready = useFocusCommandReady();
  const {
    updateProfile,
    updateComboTiers,
    setGoogleSheetConnection,
    importFromGoogleSheet,
    markSynced,
    restoreOfflineBackup,
    resetLocalData,
    getCurrentState,
  } = useFocusCommandActions();
  const profile = useFocusCommandSelector((snapshot) => snapshot.profile);
  const googleSheet = useFocusCommandSelector((snapshot) => snapshot.googleSheet);
  const customQuestions = useFocusCommandSelector((snapshot) => snapshot.customQuestions);
  const state = useMemo(() => ({ profile, googleSheet, customQuestions }), [customQuestions, googleSheet, profile]);
  const [firstName, setFirstName] = useState(state.profile.firstName);
  const [newTierDays, setNewTierDays] = useState("");
  const [newTierMultiplier, setNewTierMultiplier] = useState("");
  const [sheetId, setSheetId] = useState(state.googleSheet.spreadsheetId ?? "");
  const [sheetName, setSheetName] = useState(state.googleSheet.spreadsheetName || "Focus Command Data");
  const [savingSoundRole, setSavingSoundRole] = useState<SoundRoleId | null>(null);
  const [backupBusy, setBackupBusy] = useState<"export" | "restore" | null>(null);
  const onGoogleAuthorized = useCallback((_token: string, email: string | null) => {
    setGoogleSheetConnection({ phase: "authorized", connectedEmail: email ?? "", errorMessage: null });
  }, [setGoogleSheetConnection]);
  const googleAuth = useGoogleSheetsAuth(onGoogleAuthorized);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    void (async () => {
      const saved = await getSelectedFocusWorkbook();
      if (!active) return;
      if (saved) {
        setSheetId(saved.spreadsheetId);
        setSheetName(saved.spreadsheetName);
        if (state.googleSheet.spreadsheetId !== saved.spreadsheetId || state.googleSheet.spreadsheetName !== saved.spreadsheetName) {
          setGoogleSheetConnection({ ...saved, phase: state.googleSheet.connectedEmail ? "authorized" : state.googleSheet.phase, errorMessage: null });
        }
      } else if (state.googleSheet.spreadsheetId && state.googleSheet.spreadsheetName) {
        await saveSelectedFocusWorkbook({ spreadsheetId: state.googleSheet.spreadsheetId, spreadsheetName: state.googleSheet.spreadsheetName });
      }
    })();
    return () => { active = false; };
  }, [ready, setGoogleSheetConnection, state.googleSheet.connectedEmail, state.googleSheet.phase, state.googleSheet.spreadsheetId, state.googleSheet.spreadsheetName]);

  if (!ready) return <LoadingScreen label="Opening command settings…" />;

  const tiers = getComboTiers(state);
  const updateName = () => {
    const clean = firstName.trim();
    if (!clean) return;
    updateProfile({ firstName: clean });
  };

  const addTier = () => {
    const days = Math.max(1, Math.round(Number(newTierDays)));
    const multiplier = Math.max(1, Number(newTierMultiplier));
    if (!Number.isFinite(days) || !Number.isFinite(multiplier)) {
      Alert.alert("Use valid values", "Enter a positive day threshold and a multiplier of 1 or higher.");
      return;
    }
    const next: ComboTier[] = [...tiers, { id: `combo_custom_${Date.now()}`, days, multiplier, enabled: true }].sort((a, b) => a.days - b.days);
    updateComboTiers(next);
    setNewTierDays("");
    setNewTierMultiplier("");
  };

  const patchTier = (tierId: string, patch: Partial<ComboTier>) => {
    const next = tiers.map((tier) => tier.id === tierId ? { ...tier, ...patch } : tier)
      .map((tier) => ({ ...tier, days: Math.max(1, Math.round(tier.days)), multiplier: Math.max(1, tier.multiplier) }))
      .sort((left, right) => left.days - right.days);
    updateComboTiers(next);
  };

  const paletteTokens: { token: PaletteToken; label: string }[] = [
    { token: "primary", label: "Command accent" },
    { token: "background", label: "Screen background" },
    { token: "surface", label: "Card surface" },
    { token: "foreground", label: "Primary text" },
    { token: "muted", label: "Secondary text" },
    { token: "border", label: "Borders" },
    { token: "success", label: "Success" },
    { token: "warning", label: "Warning" },
    { token: "error", label: "Error" },
  ];
  const updatePaletteToken = (token: PaletteToken, value: string) => {
    const next = { ...state.profile.palette };
    const normalized = value.trim();
    if (normalized) next[token] = normalized;
    else delete next[token];
    updateProfile({ palette: next });
  };
  const tickerSources: { source: TickerColorSource; label: string }[] = [
    { source: "global", label: "Global palette" },
    { source: "character", label: "Active character" },
    { source: "custom", label: "Custom" },
  ];
  const updateTickerPreference = (ticker: "miniAchievement" | "prediction", patch: Partial<TickerColorPreference>) => {
    updateProfile({
      tickerColorPreferences: {
        ...state.profile.tickerColorPreferences,
        [ticker]: { ...state.profile.tickerColorPreferences[ticker], ...patch },
      },
    });
  };

  const patchNotificationRules = async (patch: Partial<typeof state.profile.notificationRules>) => {
    const notificationRules = { ...state.profile.notificationRules, ...patch };
    updateProfile({ notificationRules });
    if (state.profile.notificationsEnabled && ("dailyMissionEnabled" in patch || "dailyMissionTime" in patch)) {
      await configureDailyMissionReminder(notificationRules.dailyMissionEnabled, notificationRules.dailyMissionTime, state.profile.soundRoles.dailyMissionReminder);
    }
  };

  const soundRoles: { id: SoundRoleId; title: string; detail: string }[] = [
    { id: "missionWin", title: "Mission win", detail: "Plays after a standard mission completion." },
    { id: "titleUnlock", title: "Title unlock", detail: "Plays when a new command title is earned or revealed." },
    { id: "levelUp", title: "Level-up", detail: "Plays when your command level increases." },
    { id: "achievement", title: "Achievement", detail: "Plays for journal, rank, and achievement celebrations." },
    { id: "comboTier", title: "Combo tier", detail: "Plays when a new streak multiplier tier is reached." },
    { id: "reward", title: "Reward / vault", detail: "Plays when a reward is redeemed or an armory item is activated." },
    { id: "tap", title: "Tap / click", detail: "Short feedback for buttons, controls, and navigation." },
    { id: "system", title: "System confirmation", detail: "Plays after import, sync, and other successful system actions." },
    { id: "dailyMissionReminder", title: "Daily mission reminder", detail: "Dedicated sound for your daily mission notification." },
    { id: "revisionReminder", title: "Revision reminder", detail: "Dedicated sound for scheduled revision notifications." },
    { id: "multiplierReminder", title: "Multiplier reminder", detail: "Dedicated sound for next-day multiplier notifications." },
    { id: "achievementRecap", title: "Achievement recap", detail: "Dedicated sound for post-mission achievement recap notifications." },
    { id: "notification", title: "General notification fallback", detail: "Fallback cue for generic alert-style notifications." },
    { id: "extended", title: "Extended feedback fallback", detail: "Fallback cue for legacy or uncategorized longer feedback." },
  ];
  const soundStyles: { value: SoundStyle; label: string }[] = [
    { value: "crisp", label: "Crisp" },
    { value: "soft", label: "Soft" },
    { value: "ceremonial", label: "Ceremonial" },
  ];
  const patchSoundRole = (role: SoundRoleId, patch: Partial<typeof state.profile.soundRoles[SoundRoleId]>) => {
    const nextRole = { ...state.profile.soundRoles[role], ...patch };
    const nextRoles = { ...state.profile.soundRoles, [role]: nextRole };
    updateProfile({
      soundRoles: {
        [role]: nextRole,
      } as typeof state.profile.soundRoles,
    });
    if (role === "dailyMissionReminder" || role === "revisionReminder" || role === "multiplierReminder" || role === "achievementRecap") {
      void refreshScheduledReminderSounds({
        dailyMissionReminder: nextRoles.dailyMissionReminder,
        revisionReminder: nextRoles.revisionReminder,
        multiplierReminder: nextRoles.multiplierReminder,
        achievementRecap: nextRoles.achievementRecap,
      });
    }
  };

  const selectSoundFile = async (role: SoundRoleId) => {
    if (savingSoundRole) return;
    setSavingSoundRole(role);
    try {
      const selected = await pickAndPersistFocusSound(role);
      if (!selected) return;
      const previousUri = state.profile.soundRoles[role].customUri;
      patchSoundRole(role, { customUri: selected.uri, customName: selected.name });
      if (previousUri && previousUri !== selected.uri) {
        releaseFocusCustomSound(previousUri);
        await removePersistedFocusSound(previousUri);
      }
      Alert.alert("Custom sound saved", `${selected.name} is now assigned to this sound category and will remain selected until you replace or remove it.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Choose a standard audio file such as MP3, M4A, AAC, or WAV and try again.";
      Alert.alert("Sound file unavailable", message);
    } finally {
      setSavingSoundRole(null);
    }
  };

  const removeSoundFile = async (role: SoundRoleId) => {
    const currentUri = state.profile.soundRoles[role].customUri;
    patchSoundRole(role, { customUri: null, customName: null });
    if (currentUri) {
      releaseFocusCustomSound(currentUri);
      await removePersistedFocusSound(currentUri);
    }
  };

  const reset = () => {
    Alert.alert("Reset local command data?", "This clears local missions, history, and settings from this device. Your connected Google Sheet will not be deleted.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: () => resetLocalData() },
    ]);
  };

  const createOfflineBackup = async () => {
    if (backupBusy) return;
    setBackupBusy("export");
    try {
      const result = await createAndShareOfflineBackup(getCurrentState());
      Alert.alert("Backup file ready", `${result.fileName} was prepared. Save it in a private location so it is available when you change phones or reinstall Focus Command.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Focus Command could not create the backup file.";
      Alert.alert("Backup not created", message);
    } finally {
      setBackupBusy(null);
    }
  };

  const restoreValidatedOfflineBackup = async () => {
    if (backupBusy) return;
    setBackupBusy("restore");
    try {
      const preview = await chooseAndValidateOfflineBackup();
      if (!preview) {
        setBackupBusy(null);
        return;
      }
      const { manifest } = preview.backup;
      const { summary } = manifest;
      Alert.alert(
        "Restore all Focus Command data?",
        `${preview.fileName}\nCreated ${new Date(manifest.createdAt).toLocaleString()}\n\n${summary.missions} missions · ${summary.completions} completed runs · ${summary.reflections} reflections · ${summary.journals} journals · ${summary.mediaFiles} media files\n\nThis validated backup will replace the current local command log on this device. Google Sheets credentials are not included and may need authorization again. This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel", onPress: () => setBackupBusy(null) },
          {
            text: "Restore all data",
            style: "destructive",
            onPress: () => {
              void (async () => {
                let materialized: ReturnType<typeof materializeOfflineBackupMedia> | null = null;
                try {
                  materialized = materializeOfflineBackupMedia(preview.backup);
                  await restoreOfflineBackup(materialized.state);
                  void playFocusRole("system", materialized.state.profile.soundEnabled, materialized.state.profile.soundRoles.system);
                  Alert.alert("Restore complete", "Focus Command replaced this device’s local data with the validated backup file.");
                } catch (error) {
                  if (materialized) discardMaterializedOfflineBackup(materialized);
                  const message = error instanceof Error ? error.message : "Focus Command could not restore the selected backup. Your current data was kept.";
                  Alert.alert("Restore not completed", message);
                } finally {
                  setBackupBusy(null);
                }
              })();
            },
          },
        ],
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Focus Command could not validate the selected backup.";
      Alert.alert("Backup file unavailable", `${message} Your current data was kept.`);
      setBackupBusy(null);
    }
  };

  const requireGoogleToken = async () => {
    const token = googleAuth.accessToken ?? await getGoogleAccessToken();
    if (!token) {
      Alert.alert("Authorize Google first", "Connect Google in a development build before creating, importing, or syncing a spreadsheet.");
      return null;
    }
    return token;
  };

  const createSpreadsheet = async () => {
    const token = await requireGoogleToken();
    if (!token) return;
    try {
      setGoogleSheetConnection({ phase: "syncing", errorMessage: null });
      const workbook = await createFocusWorkbook(token, sheetName.trim() || "Focus Command Data");
      const currentState = getCurrentState();
      await writeFocusWorkbook(token, workbook, currentState);
      setSheetId(workbook.spreadsheetId);
      setSheetName(workbook.spreadsheetName);
      await saveSelectedFocusWorkbook(workbook);
      setGoogleSheetConnection({ ...workbook, phase: "synced", pendingOperations: 0, lastSyncedAt: new Date().toISOString(), errorMessage: null });
      markSynced();
      void playFocusRole("system", currentState.profile.soundEnabled, currentState.profile.soundRoles.system);
      Alert.alert("Spreadsheet ready", "Focus Command created its data tabs and exported the current command log.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google Sheets could not create the spreadsheet.";
      setGoogleSheetConnection({ phase: "error", errorMessage: message });
      Alert.alert("Could not create spreadsheet", message);
    }
  };

  const syncSpreadsheet = async (forceLocal = false) => {
    const token = await requireGoogleToken();
    const cleanId = sheetId.trim() || state.googleSheet.spreadsheetId;
    if (!token || !cleanId) {
      Alert.alert("Select a spreadsheet", "Paste a spreadsheet ID or create a new Focus Command spreadsheet first.");
      return;
    }
    try {
      setGoogleSheetConnection({ phase: "syncing", errorMessage: null });
      const workbook = await getSpreadsheet(token, cleanId);
      const remoteMetadata = await getFocusWorkbookMetadata(token, cleanId);
      const remoteChangedAfterLastSync = Boolean(
        remoteMetadata.payload && (
          !state.googleSheet.lastSyncedAt ||
          (remoteMetadata.updatedAt && Date.parse(remoteMetadata.updatedAt) > Date.parse(state.googleSheet.lastSyncedAt))
        ),
      );
      if (!forceLocal && state.googleSheet.pendingOperations > 0 && remoteChangedAfterLastSync) {
        const message = "This sheet has a newer Focus Command snapshot while this device has unsynced local changes. Choose which copy should win before continuing.";
        setGoogleSheetConnection({ phase: "error", errorMessage: message });
        Alert.alert("Sheet conflict detected", message, [
          { text: "Cancel", style: "cancel" },
          { text: "Use sheet copy", style: "destructive", onPress: () => { void importSpreadsheet(); } },
          { text: "Keep local copy", onPress: () => { void syncSpreadsheet(true); } },
        ]);
        return;
      }
      const currentState = getCurrentState();
      await writeFocusWorkbook(token, workbook, currentState);
      setSheetId(workbook.spreadsheetId);
      setSheetName(workbook.spreadsheetName);
      await saveSelectedFocusWorkbook(workbook);
      setGoogleSheetConnection({ ...workbook, phase: "synced", pendingOperations: 0, lastSyncedAt: new Date().toISOString(), errorMessage: null });
      markSynced();
      void playFocusRole("system", currentState.profile.soundEnabled, currentState.profile.soundRoles.system);
      Alert.alert("Sync complete", "The selected Google Sheet now contains the latest Focus Command snapshot and data tabs.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google Sheets could not sync the selected spreadsheet.";
      setGoogleSheetConnection({ phase: "error", errorMessage: message });
      Alert.alert("Sync failed", message);
    }
  };

  const removeSavedSpreadsheet = () => {
    Alert.alert("Remove saved spreadsheet?", "This only disconnects the remembered workbook from this device. It does not delete the Google Sheet, Google account, or unrelated Focus Command data.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          void (async () => {
            await clearSelectedFocusWorkbook();
            setSheetId("");
            setSheetName("Focus Command Data");
            setGoogleSheetConnection({
              spreadsheetId: "",
              spreadsheetName: "",
              phase: googleAuth.status === "authorized" ? "authorized" : "needs_setup",
              pendingOperations: 0,
              lastSyncedAt: null,
              errorMessage: null,
            });
          })();
        },
      },
    ]);
  };

  const importSpreadsheet = async () => {
    const token = await requireGoogleToken();
    const cleanId = sheetId.trim() || state.googleSheet.spreadsheetId;
    if (!token || !cleanId) {
      Alert.alert("Select a spreadsheet", "Paste a spreadsheet ID before importing Focus Command data.");
      return;
    }
    try {
      setGoogleSheetConnection({ phase: "syncing", errorMessage: null });
      const workbook = await getSpreadsheet(token, cleanId);
      const remote = await readFocusWorkbook(token, cleanId);
      importFromGoogleSheet(remote, { ...workbook });
      setSheetId(workbook.spreadsheetId);
      setSheetName(workbook.spreadsheetName);
      await saveSelectedFocusWorkbook(workbook);
      void playFocusRole("system", state.profile.soundEnabled, state.profile.soundRoles.system);
      Alert.alert("Import complete", "The local command system has been refreshed from the selected Google Sheet snapshot.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google Sheets could not import this spreadsheet.";
      setGoogleSheetConnection({ phase: "error", errorMessage: message });
      Alert.alert("Import failed", message);
    }
  };

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenTitle
          eyebrow="Hamburger menu"
          title="Command settings"
          detail={section === "sheet" ? "Sheet connection & synchronization" : "Tune your command system without leaving the mission."}
          right={<IconAction icon="xmark" label="Close settings" onPress={() => router.back()} />}
        />

        <SectionHeader title="Character presentation" />
        <CommandCard accent={colors.primary} style={styles.cardStack}>
          <Pressable accessibilityRole="link" onPress={() => router.push("/cinematic-library")} style={({ pressed }) => [styles.settingRow, { opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
            <View style={styles.settingCopy}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>Character cinematics</Text>
              <Text style={[styles.settingDetail, { color: colors.muted }]}>Assign an offline video to any of the eight character forms.</Text>
            </View>
            <Text style={[styles.menuLinkText, { color: colors.primary }]}>OPEN</Text>
          </Pressable>
          <Divider />
          <Pressable accessibilityRole="link" onPress={() => router.push("/launch-animation")} style={({ pressed }) => [styles.settingRow, { opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
            <View style={styles.settingCopy}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>Launch animation</Text>
              <Text style={[styles.settingDetail, { color: colors.muted }]}>
                {state.profile.launchAnimation.enabled ? (state.profile.launchAnimation.visual && state.profile.launchAnimation.audio ? "Custom launch media active" : "Default fire sequence active") : "Fire, quote, and glaze are off"}
              </Text>
            </View>
            <View style={styles.settingAction}>
              <Switch
                value={state.profile.launchAnimation.enabled}
                onValueChange={(enabled) => updateProfile({ launchAnimation: { ...state.profile.launchAnimation, enabled } })}
                trackColor={{ false: colors.border, true: colors.primary }}
                accessibilityLabel="Turn the complete launch animation sequence on or off"
              />
              <Text style={[styles.menuLinkText, { color: colors.primary }]}>OPEN</Text>
            </View>
          </Pressable>
        </CommandCard>

        <SectionHeader title="Player profile" />
        <CommandCard accent={colors.primary} style={styles.cardStack}>
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>COMMANDER NAME</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              onBlur={updateName}
              placeholder="Your first name"
              placeholderTextColor={colors.muted}
              style={[styles.textInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              returnKeyType="done"
              onSubmitEditing={updateName}
            />
            <CommandButton label="Save" onPress={updateName} />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>Daily target</Text>
              <Text style={[styles.settingDetail, { color: colors.muted }]}>{state.profile.dailyTargetXp} base XP per day</Text>
            </View>
            <View style={styles.stepperRow}>
              <CommandButton label="−" variant="secondary" onPress={() => updateProfile({ dailyTargetXp: Math.max(10, state.profile.dailyTargetXp - 10) })} style={styles.stepperButton} />
              <CommandButton label="+" variant="secondary" onPress={() => updateProfile({ dailyTargetXp: state.profile.dailyTargetXp + 10 })} style={styles.stepperButton} />
            </View>
          </View>
          <Divider />
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>Energy capacity</Text>
              <Text style={[styles.settingDetail, { color: colors.muted }]}>{state.profile.energyMaximum} daily energy units</Text>
            </View>
            <View style={styles.stepperRow}>
              <CommandButton label="−" variant="secondary" onPress={() => updateProfile({ energyMaximum: Math.max(10, state.profile.energyMaximum - 10) })} style={styles.stepperButton} />
              <CommandButton label="+" variant="secondary" onPress={() => updateProfile({ energyMaximum: state.profile.energyMaximum + 10 })} style={styles.stepperButton} />
            </View>
          </View>
        </CommandCard>

        <SectionHeader title="Feedback & accessibility" />
        <CommandCard style={styles.cardStack}>
          <SwitchRow label="Game sound" detail="Master switch for every command sound role below." value={state.profile.soundEnabled} onValueChange={(soundEnabled) => updateProfile({ soundEnabled })} />
          {state.profile.soundEnabled ? <View style={styles.soundRoleList}>
            {soundRoles.map((role, index) => {
              const setting = state.profile.soundRoles[role.id];
              return <View key={role.id} style={[styles.soundRole, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <View style={styles.settingRow}>
                  <View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: colors.foreground }]}>{role.title}</Text><Text style={[styles.settingDetail, { color: colors.muted }]}>{role.detail}</Text></View>
                  <Switch value={setting.enabled} onValueChange={(enabled) => patchSoundRole(role.id, { enabled })} trackColor={{ false: colors.border, true: `${colors.primary}88` }} thumbColor={setting.enabled ? colors.primary : colors.surface} />
                </View>
                <View style={styles.soundRoleActions}>
                  <View style={styles.soundStyleChoices}>{soundStyles.map((option) => <Pressable key={option.value} onPress={() => patchSoundRole(role.id, { style: option.value, customUri: null, customName: null })} style={({ pressed }) => [styles.soundStyleChoice, { backgroundColor: !setting.customUri && setting.style === option.value ? `${colors.primary}1B` : colors.surface, borderColor: !setting.customUri && setting.style === option.value ? colors.primary : colors.border, opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}><Text style={[styles.soundStyleText, { color: !setting.customUri && setting.style === option.value ? colors.primary : colors.muted }]}>{option.label}</Text></Pressable>)}</View>
                  <View style={styles.soundFileRow}>
                    <View style={styles.soundFileCopy}><Text numberOfLines={1} style={[styles.soundFileName, { color: setting.customUri ? colors.success : colors.muted }]}>{setting.customName ? `Custom: ${setting.customName}` : "Bundled cue selected"}</Text><Text style={[styles.soundFileHint, { color: colors.muted }]}>Pick an MP3, M4A, AAC, or WAV from your device.</Text></View>
                    <Pressable accessibilityRole="button" disabled={savingSoundRole !== null} onPress={() => { void selectSoundFile(role.id); }} style={({ pressed }) => [styles.soundFileButton, { borderColor: colors.primary, opacity: savingSoundRole !== null ? 0.5 : pressed ? 0.72 : 1, transform: [{ scale: pressed && savingSoundRole === null ? 0.97 : 1 }] }]}><Text style={[styles.soundFileButtonText, { color: colors.primary }]}>{savingSoundRole === role.id ? "SAVING…" : "CHOOSE"}</Text></Pressable>
                  </View>
                  {setting.customUri ? <Pressable accessibilityRole="button" disabled={savingSoundRole !== null} onPress={() => { void removeSoundFile(role.id); }} style={({ pressed }) => [styles.restoreCue, { opacity: savingSoundRole !== null ? 0.5 : pressed ? 0.7 : 1 }]}><Text style={[styles.restoreCueText, { color: colors.muted }]}>Remove custom sound · use bundled cue</Text></Pressable> : null}
                  <Pressable accessibilityRole="button" onPress={() => { void playFocusRole(role.id, state.profile.soundEnabled, setting); }} style={({ pressed }) => [styles.soundPreview, { backgroundColor: `${colors.primary}18`, borderColor: colors.primary, opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}><IconSymbol name="play.fill" size={14} color={colors.primary} /><Text style={[styles.soundPreviewText, { color: colors.primary }]}>Preview selected sound</Text></Pressable>
                </View>
                {index < soundRoles.length - 1 ? <View style={[styles.soundRoleDivider, { backgroundColor: colors.border }]} /> : null}
              </View>;
            })}
          </View> : null}
          {state.profile.soundEnabled ? <Pressable accessibilityRole="link" onPress={() => { void WebBrowser.openBrowserAsync("https://pixabay.com/sound-effects/search/ui/"); }} style={({ pressed }) => [styles.pixabayLink, { borderColor: `${colors.primary}66`, backgroundColor: `${colors.primary}0F`, opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}><IconSymbol name="arrow.up.right.square" size={14} color={colors.primary} /><Text style={[styles.pixabayLinkText, { color: colors.primary }]}>Browse free Pixabay UI sounds, then assign a file above</Text></Pressable> : null}
          <Divider />
          <SwitchRow label="Haptic feedback" detail="Use subtle tactile confirmation for key actions." value={state.profile.hapticsEnabled} onValueChange={(hapticsEnabled) => updateProfile({ hapticsEnabled })} />
          <Divider />
          <SwitchRow label="Local reminders" detail="Allow the notification categories and times configured below." value={state.profile.notificationsEnabled} onValueChange={async (notificationsEnabled) => {
            if (notificationsEnabled) {
              const allowed = await enableFocusReminders();
              if (!allowed) {
                Alert.alert("Reminder permission needed", "Focus Command cannot schedule reminders until notifications are allowed in device settings.");
                return;
              }
            }
            updateProfile({ notificationsEnabled });
            await configureDailyMissionReminder(notificationsEnabled && state.profile.notificationRules.dailyMissionEnabled, state.profile.notificationRules.dailyMissionTime, state.profile.soundRoles.dailyMissionReminder);
          }} />
          <Divider />
          <SwitchRow label="Reduce motion" detail="Prefer still, immediate state changes over animation." value={state.profile.reduceMotion} onValueChange={(reduceMotion) => updateProfile({ reduceMotion })} />
          <Divider />
          <SwitchRow label="High contrast" detail="Strengthen visual separation between command surfaces." value={state.profile.highContrast} onValueChange={(highContrast) => updateProfile({ highContrast })} />
          <Divider />
          <SwitchRow label="Pattern forecast" detail="Show a free, on-device summary of your recent self-reported focus and emotional signals. It is not a medical assessment." value={state.profile.forecastEnabled} onValueChange={(forecastEnabled) => updateProfile({ forecastEnabled })} />
          {state.profile.forecastEnabled ? <>
            <Divider />
            <SwitchRow label="Forecast signal details" detail="Show the focus, motivation, clarity, stress, and distraction inputs behind the forecast." value={state.profile.forecastShowSignals} onValueChange={(forecastShowSignals) => updateProfile({ forecastShowSignals })} />
          </> : null}
          <Divider />
          <View style={styles.themeSection}>
            <View style={styles.settingCopy}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>Theme</Text>
              <Text style={[styles.settingDetail, { color: colors.muted }]}>Choose how the command center appears on this device.</Text>
            </View>
            <View style={styles.themeChoices}>
              {(["dark", "light", "system"] as const).map((theme) => {
                const active = state.profile.theme === theme;
                return <Pressable key={theme} onPress={() => { updateProfile({ theme }); setColorScheme(theme === "system" ? Appearance.getColorScheme() ?? "light" : theme); }} style={({ pressed }) => [styles.themeChoice, { backgroundColor: active ? `${colors.primary}1C` : colors.background, borderColor: active ? colors.primary : colors.border, opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}><Text style={[styles.themeChoiceText, { color: active ? colors.primary : colors.muted }]}>{theme.toUpperCase()}</Text></Pressable>;
              })}
            </View>
          </View>
        </CommandCard>

        <SectionHeader title="Notification rules" />
        <CommandCard accent={colors.success} style={styles.cardStack}>
          <Text style={[styles.settingDetail, { color: colors.muted }]}>Choose which command events can alert you. Scheduled alerts stay on this device and can be changed whenever you want.</Text>
          <SwitchRow label="Daily mission briefing" detail="A recurring reminder to deploy one clear mission." value={state.profile.notificationRules.dailyMissionEnabled} onValueChange={(dailyMissionEnabled) => { void patchNotificationRules({ dailyMissionEnabled }); }} />
          {state.profile.notificationRules.dailyMissionEnabled ? <View style={styles.notificationTimeRow}>
            <View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: colors.foreground }]}>Daily briefing time</Text><Text style={[styles.settingDetail, { color: colors.muted }]}>Use 24-hour HH:MM format.</Text></View>
            <TextInput value={state.profile.notificationRules.dailyMissionTime} onChangeText={(dailyMissionTime) => { void patchNotificationRules({ dailyMissionTime }); }} placeholder="09:00" placeholderTextColor={colors.muted} style={[styles.timeInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
          </View> : null}
          <Divider />
          <SwitchRow label="Revision reminders" detail="Alert when a Day 1, Day 7, or Day 30 review is due." value={state.profile.notificationRules.revisionEnabled} onValueChange={(revisionEnabled) => { void patchNotificationRules({ revisionEnabled }); }} />
          {state.profile.notificationRules.revisionEnabled ? <View style={styles.notificationTimeRow}>
            <View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: colors.foreground }]}>Revision alert time</Text><Text style={[styles.settingDetail, { color: colors.muted }]}>Used on the scheduled review day.</Text></View>
            <TextInput value={state.profile.notificationRules.revisionTime} onChangeText={(revisionTime) => { void patchNotificationRules({ revisionTime }); }} placeholder="09:00" placeholderTextColor={colors.muted} style={[styles.timeInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
          </View> : null}
          <Divider />
          <SwitchRow label="Multiplier activation" detail="Confirm that a next-day gold multiplier is now live." value={state.profile.notificationRules.multiplierEnabled} onValueChange={(multiplierEnabled) => { void patchNotificationRules({ multiplierEnabled }); }} />
          <Divider />
          <SwitchRow label="Achievement recap" detail="Show a brief command notification after a completed mission." value={state.profile.notificationRules.achievementEnabled} onValueChange={(achievementEnabled) => { void patchNotificationRules({ achievementEnabled }); }} />
        </CommandCard>

        <SectionHeader title="Color system" />
        <CommandCard accent={colors.primary} style={styles.cardStack}>
          <Text style={[styles.settingDetail, { color: colors.muted }]}>Customize every command color with six-digit hex values. Invalid or low-contrast text combinations automatically fall back to a readable theme token.</Text>
          <View style={styles.paletteGrid}>
            {paletteTokens.map(({ token, label }) => {
              const custom = state.profile.palette[token] ?? "";
              const preview = /^#[0-9a-fA-F]{6}$/.test(custom) ? custom : colors[token];
              return <View key={token} style={[styles.paletteEditor, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <View style={styles.paletteLabelRow}>
                  <View style={[styles.paletteSwatch, { backgroundColor: preview }]} />
                  <Text style={[styles.paletteLabel, { color: colors.foreground }]}>{label}</Text>
                </View>
                <TextInput value={custom} onChangeText={(value) => updatePaletteToken(token, value)} autoCapitalize="characters" placeholder={colors[token]} placeholderTextColor={colors.muted} style={[styles.paletteInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} />
                <CommandButton label="Reset" variant="ghost" onPress={() => updatePaletteToken(token, "")} />
              </View>;
            })}
          </View>
          <Divider />
          <View style={styles.tickerAppearanceHeader}>
            <Text style={[styles.settingTitle, { color: colors.foreground }]}>Home ticker appearance</Text>
            <Text style={[styles.settingDetail, { color: colors.muted }]}>Each ticker keeps its current position, content, timing, and interaction. These controls change only its visual surface and accent.</Text>
          </View>
          {([
            { id: "miniAchievement" as const, title: "Mini Achievement Ticker" },
            { id: "prediction" as const, title: "Prediction Ticker" },
          ]).map(({ id, title }) => {
            const preference = state.profile.tickerColorPreferences[id];
            return <View key={id} style={[styles.tickerAppearanceCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.paletteLabel, { color: colors.foreground }]}>{title}</Text>
              <View style={styles.tickerSourceChoices}>
                {tickerSources.map(({ source, label }) => {
                  const active = preference.source === source;
                  return <Pressable key={source} accessibilityRole="button" onPress={() => updateTickerPreference(id, { source })} style={({ pressed }) => [styles.tickerSourceChoice, { backgroundColor: active ? `${colors.primary}1C` : colors.surface, borderColor: active ? colors.primary : colors.border, opacity: pressed ? 0.72 : 1 }]}>
                    <Text style={[styles.tickerSourceText, { color: active ? colors.primary : colors.muted }]}>{label.toUpperCase()}</Text>
                  </Pressable>;
                })}
              </View>
              {preference.source === "custom" ? <View style={styles.tickerCustomInputs}>
                <TextInput value={preference.surface ?? ""} onChangeText={(surface) => updateTickerPreference(id, { surface: surface.trim() || null })} autoCapitalize="characters" placeholder="Surface #101827" placeholderTextColor={colors.muted} style={[styles.paletteInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} />
                <TextInput value={preference.accent ?? ""} onChangeText={(accent) => updateTickerPreference(id, { accent: accent.trim() || null })} autoCapitalize="characters" placeholder="Accent #8B5CF6" placeholderTextColor={colors.muted} style={[styles.paletteInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} />
              </View> : null}
            </View>;
          })}
        </CommandCard>

        <SectionHeader title="Loot box probability" />
        <CommandCard accent="#F4C95D" style={styles.cardStack}>
          <Text style={[styles.settingDetail, { color: colors.muted }]}>Set the chance that a completed mission opens a weighted loot-box draw from rewards you mark as loot eligible.</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>Current chance</Text>
              <Text style={[styles.settingDetail, { color: colors.muted }]}>{state.profile.lootChancePercent}% per completed mission</Text>
            </View>
            <View style={styles.stepperRow}>
              <CommandButton label="−" variant="secondary" onPress={() => updateProfile({ lootChancePercent: Math.max(0, state.profile.lootChancePercent - 1) })} style={styles.stepperButton} />
              <CommandButton label="+" variant="secondary" onPress={() => updateProfile({ lootChancePercent: Math.min(100, state.profile.lootChancePercent + 1) })} style={styles.stepperButton} />
            </View>
          </View>
        </CommandCard>

        <SectionHeader title="Combo multiplier rules" />
        <CommandCard accent={colors.primary} style={styles.cardStack}>
          <Text style={[styles.settingDetail, { color: colors.muted }]}>A missed day drops one tier; three consecutive missed days reset your combo to 1.00×.</Text>
          {tiers.map((tier) => (
            <View key={tier.id} style={styles.tierEditor}>
              <View style={styles.tierHeading}>
                <View style={styles.tierCopy}>
                  <Text style={[styles.tierTitle, { color: colors.foreground }]}>{tier.id === "combo_base" ? "Base combo tier" : "Custom combo tier"}</Text>
                  <Text style={[styles.tierDetail, { color: colors.muted }]}>{tier.enabled ? "Active after its required qualifying days." : "Disabled until you re-enable it."}</Text>
                </View>
                <StatusPill label={`${tier.multiplier.toFixed(2)}×`} tone={tier.enabled ? "primary" : "neutral"} icon="flame.fill" />
              </View>
              <View style={styles.tierInputs}>
                <TextInput value={String(tier.days)} onChangeText={(value) => patchTier(tier.id, { days: Number(value) || 1 })} keyboardType="number-pad" placeholder="Days" placeholderTextColor={colors.muted} style={[styles.smallInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
                <TextInput value={String(tier.multiplier)} onChangeText={(value) => patchTier(tier.id, { multiplier: Number(value) || 1 })} keyboardType="decimal-pad" placeholder="Multiplier" placeholderTextColor={colors.muted} style={[styles.smallInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
              </View>
              <View style={styles.tierActions}>
                <CommandButton label={tier.enabled ? "Disable" : "Enable"} variant="secondary" onPress={() => patchTier(tier.id, { enabled: !tier.enabled })} />
                {tier.id !== "combo_base" ? <CommandButton label="Remove" variant="ghost" onPress={() => updateComboTiers(tiers.filter((candidate) => candidate.id !== tier.id))} /> : null}
              </View>
            </View>
          ))}
          <View style={styles.addTierRow}>
            <TextInput value={newTierDays} onChangeText={setNewTierDays} placeholder="Days" placeholderTextColor={colors.muted} keyboardType="number-pad" style={[styles.smallInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
            <TextInput value={newTierMultiplier} onChangeText={setNewTierMultiplier} placeholder="Multiplier" placeholderTextColor={colors.muted} keyboardType="decimal-pad" style={[styles.smallInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
            <CommandButton label="Add" icon="plus" onPress={addTier} style={styles.addTierButton} />
          </View>
        </CommandCard>

        <SectionHeader title="History & records" />
        <CommandCard accent={colors.success} style={styles.cardStack}>
          <Text style={[styles.settingDetail, { color: colors.muted }]}>Review completed missions, timed investment, reflections, and their linked achievements in one preserved command log.</Text>
          <CommandButton label="Open completed history" icon="checklist" variant="secondary" onPress={() => router.push("/missions?filter=completed")} />
        </CommandCard>

        <SectionHeader title="RPG rules & dashboards" />
        <CommandCard accent={colors.primary} style={styles.cardStack}>
          <Text style={[styles.settingDetail, { color: colors.muted }]}>Edit the rank ladder, level thresholds, reflection prompts, and all three custom dashboard graph slots.</Text>
          <CommandButton label="Customize RPG system" icon="gearshape.fill" variant="secondary" onPress={() => router.push("/customize")} />
        </CommandCard>

        <SectionHeader title="Google Sheet & Sync" />
        <CommandCard accent={state.googleSheet.phase === "synced" ? colors.success : colors.primary} style={styles.cardStack}>
          <View style={styles.sheetTopline}>
            <View style={[styles.sheetIcon, { backgroundColor: `${colors.primary}1A` }]}>
              <IconSymbol name="cloud.fill" size={22} color={colors.primary} />
            </View>
            <View style={styles.sheetCopy}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>{state.googleSheet.spreadsheetName || "No spreadsheet selected"}</Text>
              <Text style={[styles.settingDetail, { color: colors.muted }]}>{googleAuth.status === "unsupported_in_expo_go" ? "OAuth is prepared, but Expo Go cannot safely complete the native Google redirect." : state.googleSheet.phase === "needs_setup" ? "The local command log is ready for secure Google authorization." : state.googleSheet.connectedEmail || "Connection requires attention"}</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <StatusPill label={state.googleSheet.phase === "synced" ? "Synced" : `${state.googleSheet.pendingOperations} queued`} tone={state.googleSheet.phase === "synced" ? "success" : "primary"} icon="cloud.fill" />
            <StatusPill label={googleAuth.status.replaceAll("_", " ").toUpperCase()} tone={googleAuth.status === "authorized" ? "success" : googleAuth.status === "error" ? "danger" : "neutral"} />
            {state.googleSheet.lastSyncedAt ? <Text style={[styles.lastSync, { color: colors.muted }]}>Last sync {new Date(state.googleSheet.lastSyncedAt).toLocaleString()}</Text> : null}
          </View>
          <Text style={[styles.sheetExplainer, { color: colors.muted }]}>{googleAuth.message || "Focus Command creates its data tabs only inside one selected Google Spreadsheet. On a native build, a Google OAuth token is encrypted on-device and used only for this sheet connection."}</Text>
          <CommandButton label={googleAuth.status === "authorized" ? "Google authorized" : "Authorize Google"} icon="cloud.fill" variant={googleAuth.status === "authorized" ? "secondary" : "primary"} disabled={googleAuth.status === "authorized" || !googleAuth.canAuthorize} onPress={googleAuth.beginAuthorization} />
          <TextInput value={sheetName} onChangeText={setSheetName} placeholder="New spreadsheet title" placeholderTextColor={colors.muted} style={[styles.textInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
          <CommandButton label="Create Focus Command sheet" icon="plus" variant="secondary" onPress={createSpreadsheet} />
          <TextInput value={sheetId} onChangeText={setSheetId} placeholder="Existing spreadsheet ID" placeholderTextColor={colors.muted} autoCapitalize="none" style={[styles.textInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
          <View style={styles.sheetActionRow}>
            <CommandButton label="Import" icon="arrow.clockwise" variant="secondary" onPress={importSpreadsheet} style={styles.sheetActionButton} />
            <CommandButton label="Sync now" icon="cloud.fill" onPress={syncSpreadsheet} style={styles.sheetActionButton} />
          </View>
          {state.googleSheet.spreadsheetId ? <CommandButton label="Remove saved spreadsheet" icon="xmark" variant="danger" onPress={removeSavedSpreadsheet} /> : null}
        </CommandCard>

        <SectionHeader title="Data controls" />
        <CommandCard style={styles.cardStack}>
          <View style={styles.settingCopy}>
            <Text style={[styles.settingTitle, { color: colors.foreground }]}>Offline Backup File</Text>
            <Text style={[styles.settingDetail, { color: colors.muted }]}>Create one portable copy of your complete local command log and app-private custom media. It is separate from Google Sheets and should be saved privately.</Text>
          </View>
          <View style={styles.sheetActionRow}>
            <CommandButton label={backupBusy === "export" ? "Preparing…" : "Create backup"} variant="secondary" disabled={backupBusy !== null} onPress={() => { void createOfflineBackup(); }} style={styles.sheetActionButton} />
            <CommandButton label={backupBusy === "restore" ? "Checking…" : "Restore backup"} disabled={backupBusy !== null} onPress={() => { void restoreValidatedOfflineBackup(); }} style={styles.sheetActionButton} />
          </View>
          <Text style={[styles.settingDetail, { color: colors.muted }]}>Restore validates the entire file before asking for final confirmation. Cancelling, choosing an invalid file, or a failed check leaves current data unchanged.</Text>
          <Divider />
          <Text style={[styles.settingDetail, { color: colors.muted }]}>The selected Google Sheet is never deleted from this screen. Reset only clears the local cache and queued changes on this device.</Text>
          <CommandButton label="Reset local data" icon="arrow.clockwise" variant="danger" onPress={reset} />
        </CommandCard>
      </ScrollView>
    </ScreenContainer>
  );
}

function SwitchRow({ label, detail, value, onValueChange }: { label: string; detail: string; value: boolean; onValueChange: (value: boolean) => void }) {
  const colors = useColors();
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.settingDetail, { color: colors.muted }]}>{detail}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.border, true: `${colors.primary}88` }} thumbColor={value ? colors.primary : colors.surface} />
    </View>
  );
}

function Divider() {
  const colors = useColors();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingTop: 10, paddingBottom: 28 },
  cardStack: { gap: 14 },
  settingAction: { flexDirection: "row", alignItems: "center", gap: 10 },
  fieldLabel: { fontSize: 10, lineHeight: 13, fontWeight: "800", letterSpacing: 0.9 },
  inputRow: { flexDirection: "row", gap: 9 },
  textInput: { flex: 1, minHeight: 46, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, fontSize: 14, lineHeight: 18, fontWeight: "600" },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 14 },
  settingCopy: { flex: 1, gap: 2 },
  settingTitle: { fontSize: 14, lineHeight: 19, fontWeight: "800" },
  settingDetail: { fontSize: 12, lineHeight: 17, fontWeight: "500" },
  menuLinkText: { fontSize: 10, lineHeight: 13, fontWeight: "900", letterSpacing: 0.7 },
  stepperRow: { flexDirection: "row", gap: 7 },
  stepperButton: { minWidth: 40, paddingHorizontal: 0 },
  divider: { height: StyleSheet.hairlineWidth, width: "100%" },
  tierEditor: { gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "transparent", paddingBottom: 10 },
  tierHeading: { flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "space-between" },
  tierInputs: { flexDirection: "row", gap: 8 },
  tierCopy: { flex: 1 },
  tierTitle: { fontSize: 14, lineHeight: 19, fontWeight: "800" },
  tierDetail: { fontSize: 11, lineHeight: 15, marginTop: 1, fontWeight: "600" },
  tierActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  addTierRow: { flexDirection: "row", gap: 8 },
  smallInput: { flex: 1, minHeight: 44, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  addTierButton: { minWidth: 78 },
  sheetTopline: { flexDirection: "row", alignItems: "center", gap: 11 },
  sheetIcon: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  sheetCopy: { flex: 1 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  lastSync: { fontSize: 11, lineHeight: 15, fontWeight: "500" },
  sheetExplainer: { fontSize: 12, lineHeight: 18, fontWeight: "500" },
  sheetActionRow: { flexDirection: "row", gap: 9 },
  sheetActionButton: { flex: 1 },
  themeSection: { gap: 8 },
  themeChoices: { flexDirection: "row", gap: 7 },
  themeChoice: { flex: 1, minHeight: 34, alignItems: "center", justifyContent: "center", borderRadius: 11, borderWidth: StyleSheet.hairlineWidth },
  themeChoiceText: { fontSize: 10, lineHeight: 13, fontWeight: "900", letterSpacing: 0.6 },
  paletteGrid: { gap: 9 },
  paletteEditor: { gap: 7, borderWidth: StyleSheet.hairlineWidth, borderRadius: 13, padding: 10 },
  paletteLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  paletteSwatch: { width: 18, height: 18, borderRadius: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: "#FFFFFF55" },
  paletteLabel: { fontSize: 12, lineHeight: 16, fontWeight: "800" },
  paletteInput: { minHeight: 40, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, fontSize: 12, lineHeight: 16, fontWeight: "800", fontVariant: ["tabular-nums"] },
  tickerAppearanceHeader: { gap: 3 },
  tickerAppearanceCard: { gap: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 13, padding: 10 },
  tickerSourceChoices: { flexDirection: "row", gap: 6 },
  tickerSourceChoice: { flex: 1, minHeight: 33, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  tickerSourceText: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.4, textAlign: "center" },
  tickerCustomInputs: { gap: 7 },
  soundRoleList: { gap: 9 },
  soundRole: { gap: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 10 },
  soundRoleActions: { gap: 8 },
  soundStyleChoices: { flexDirection: "row", gap: 6 },
  soundStyleChoice: { flex: 1, minHeight: 31, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  soundStyleText: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.35 },
  soundPreview: { minHeight: 34, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  soundPreviewText: { fontSize: 11, lineHeight: 14, fontWeight: "900" },
  soundFileRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  soundFileCopy: { flex: 1, minWidth: 0, gap: 1 },
  soundFileName: { fontSize: 10, lineHeight: 14, fontWeight: "800" },
  soundFileHint: { fontSize: 9, lineHeight: 13, fontWeight: "500" },
  soundFileButton: { minHeight: 30, borderRadius: 9, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 8, justifyContent: "center" },
  soundFileButtonText: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.7 },
  restoreCue: { alignSelf: "flex-start", minHeight: 22, justifyContent: "center" },
  restoreCueText: { fontSize: 10, lineHeight: 13, fontWeight: "700", textDecorationLine: "underline" },
  soundRoleDivider: { height: StyleSheet.hairlineWidth, width: "100%", marginTop: 1 },
  pixabayLink: { minHeight: 42, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  pixabayLinkText: { flex: 1, fontSize: 11, lineHeight: 15, fontWeight: "800" },
  notificationTimeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  timeInput: { width: 78, minHeight: 42, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, textAlign: "center", fontSize: 13, lineHeight: 17, fontWeight: "900", fontVariant: ["tabular-nums"] },
});
