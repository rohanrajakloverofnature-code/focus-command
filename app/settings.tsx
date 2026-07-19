import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Appearance, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { CommandButton, CommandCard, IconAction, LoadingScreen, ScreenTitle, SectionHeader, StatusPill } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useGoogleSheetsAuth } from "@/hooks/use-google-sheets-auth";
import { ComboTier, getComboTiers, useFocusCommand } from "@/lib/focus-command";
import { createFocusWorkbook, getGoogleAccessToken, getSpreadsheet, readFocusWorkbook, writeFocusWorkbook } from "@/lib/google-sheets";
import { enableFocusReminders } from "@/lib/focus-reminders";
import { useThemeContext } from "@/lib/theme-provider";

export default function SettingsScreen() {
  const colors = useColors();
  const { setColorScheme } = useThemeContext();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const {
    state,
    ready,
    updateProfile,
    updateComboTiers,
    setGoogleSheetConnection,
    importFromGoogleSheet,
    markSynced,
    resetLocalData,
  } = useFocusCommand();
  const [firstName, setFirstName] = useState(state.profile.firstName);
  const [newTierDays, setNewTierDays] = useState("");
  const [newTierMultiplier, setNewTierMultiplier] = useState("");
  const [sheetId, setSheetId] = useState(state.googleSheet.spreadsheetId ?? "");
  const [sheetName, setSheetName] = useState(state.googleSheet.spreadsheetName || "Focus Command Data");
  const onGoogleAuthorized = useCallback((_token: string, email: string | null) => {
    setGoogleSheetConnection({ phase: "authorized", connectedEmail: email ?? "", errorMessage: null });
  }, [setGoogleSheetConnection]);
  const googleAuth = useGoogleSheetsAuth(onGoogleAuthorized);

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

  const reset = () => {
    Alert.alert("Reset local command data?", "This clears local missions, history, and settings from this device. Your connected Google Sheet will not be deleted.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: () => resetLocalData() },
    ]);
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
      await writeFocusWorkbook(token, workbook, state);
      setSheetId(workbook.spreadsheetId);
      setSheetName(workbook.spreadsheetName);
      setGoogleSheetConnection({ ...workbook, phase: "synced", pendingOperations: 0, lastSyncedAt: new Date().toISOString(), errorMessage: null });
      markSynced();
      Alert.alert("Spreadsheet ready", "Focus Command created its data tabs and exported the current command log.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google Sheets could not create the spreadsheet.";
      setGoogleSheetConnection({ phase: "error", errorMessage: message });
      Alert.alert("Could not create spreadsheet", message);
    }
  };

  const syncSpreadsheet = async () => {
    const token = await requireGoogleToken();
    const cleanId = sheetId.trim() || state.googleSheet.spreadsheetId;
    if (!token || !cleanId) {
      Alert.alert("Select a spreadsheet", "Paste a spreadsheet ID or create a new Focus Command spreadsheet first.");
      return;
    }
    try {
      setGoogleSheetConnection({ phase: "syncing", errorMessage: null });
      const workbook = await getSpreadsheet(token, cleanId);
      await writeFocusWorkbook(token, workbook, state);
      setSheetId(workbook.spreadsheetId);
      setSheetName(workbook.spreadsheetName);
      setGoogleSheetConnection({ ...workbook, phase: "synced", pendingOperations: 0, lastSyncedAt: new Date().toISOString(), errorMessage: null });
      markSynced();
      Alert.alert("Sync complete", "The selected Google Sheet now contains the latest Focus Command snapshot and data tabs.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google Sheets could not sync the selected spreadsheet.";
      setGoogleSheetConnection({ phase: "error", errorMessage: message });
      Alert.alert("Sync failed", message);
    }
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
          <SwitchRow label="Game sound" detail="Enable sound feedback for major command events." value={state.profile.soundEnabled} onValueChange={(soundEnabled) => updateProfile({ soundEnabled })} />
          <Divider />
          <SwitchRow label="Haptic feedback" detail="Use subtle tactile confirmation for key actions." value={state.profile.hapticsEnabled} onValueChange={(hapticsEnabled) => updateProfile({ hapticsEnabled })} />
          <Divider />
          <SwitchRow label="Local reminders" detail="Schedule revision and next-day multiplier reminders on this device." value={state.profile.notificationsEnabled} onValueChange={async (notificationsEnabled) => {
            if (notificationsEnabled) {
              const allowed = await enableFocusReminders();
              if (!allowed) {
                Alert.alert("Reminder permission needed", "Focus Command cannot schedule reminders until notifications are allowed in device settings.");
                return;
              }
            }
            updateProfile({ notificationsEnabled });
          }} />
          <Divider />
          <SwitchRow label="Reduce motion" detail="Prefer still, immediate state changes over animation." value={state.profile.reduceMotion} onValueChange={(reduceMotion) => updateProfile({ reduceMotion })} />
          <Divider />
          <SwitchRow label="High contrast" detail="Strengthen visual separation between command surfaces." value={state.profile.highContrast} onValueChange={(highContrast) => updateProfile({ highContrast })} />
          <Divider />
          <View style={styles.themeSection}>
            <View style={styles.settingCopy}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>Theme</Text>
              <Text style={[styles.settingDetail, { color: colors.muted }]}>Choose how the command center appears on this device.</Text>
            </View>
            <View style={styles.themeChoices}>
              {(["dark", "light", "system"] as const).map((theme) => {
                const active = state.profile.theme === theme;
                return <Pressable key={theme} onPress={() => { updateProfile({ theme }); setColorScheme(theme === "system" ? Appearance.getColorScheme() ?? "light" : theme); }} style={({ pressed }) => [styles.themeChoice, { backgroundColor: active ? `${colors.primary}1C` : colors.background, borderColor: active ? colors.primary : colors.border, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.themeChoiceText, { color: active ? colors.primary : colors.muted }]}>{theme.toUpperCase()}</Text></Pressable>;
              })}
            </View>
          </View>
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
            <View key={tier.id} style={styles.tierRow}>
              <View style={styles.tierCopy}>
                <Text style={[styles.tierTitle, { color: colors.foreground }]}>{tier.days} qualifying {tier.days === 1 ? "day" : "days"}</Text>
                <Text style={[styles.tierDetail, { color: colors.muted }]}>{tier.enabled ? "Active tier" : "Disabled tier"}</Text>
              </View>
              <View style={styles.tierActions}>
                <StatusPill label={`${tier.multiplier.toFixed(2)}×`} tone="primary" icon="flame.fill" />
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
        </CommandCard>

        <SectionHeader title="Data controls" />
        <CommandCard style={styles.cardStack}>
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
  cardStack: { gap: 13 },
  fieldLabel: { fontSize: 10, lineHeight: 13, fontWeight: "800", letterSpacing: 0.9 },
  inputRow: { flexDirection: "row", gap: 9 },
  textInput: { flex: 1, minHeight: 46, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, fontSize: 14, lineHeight: 18, fontWeight: "600" },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 14 },
  settingCopy: { flex: 1, gap: 2 },
  settingTitle: { fontSize: 14, lineHeight: 19, fontWeight: "800" },
  settingDetail: { fontSize: 12, lineHeight: 17, fontWeight: "500" },
  stepperRow: { flexDirection: "row", gap: 7 },
  stepperButton: { minWidth: 40, paddingHorizontal: 0 },
  divider: { height: StyleSheet.hairlineWidth, width: "100%" },
  tierRow: { flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "space-between" },
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
});
