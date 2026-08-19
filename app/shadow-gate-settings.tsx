import { router } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { CommandButton, CommandCard, IconAction, LoadingScreen, ScreenTitle } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { type ShadowGatePersonalDoorway, useFocusCommandActions, useFocusCommandReady, useFocusCommandSelector } from "@/lib/focus-command";

const DoorwayRow = memo(function DoorwayRow({ doorway, onEdit, onTogglePin, onRemove }: { doorway: ShadowGatePersonalDoorway; onEdit: (doorway: ShadowGatePersonalDoorway) => void; onTogglePin: (doorway: ShadowGatePersonalDoorway) => void; onRemove: (doorway: ShadowGatePersonalDoorway) => void }) {
  const colors = useColors();
  return (
    <CommandCard accent={doorway.pinned ? "#8B5CF9" : colors.primary} style={styles.doorwayCard}>
      <View style={styles.doorwayTopline}>
        <View style={styles.doorwayCopy}>
          <Text style={[styles.doorwayLabel, { color: colors.foreground }]}>{doorway.label}</Text>
          <Text style={[styles.doorwayMeta, { color: doorway.pinned ? "#C4B5FD" : colors.muted }]}>{doorway.pinned ? "PINNED PERSONAL DOORWAY" : "PERSONAL DOORWAY"}</Text>
        </View>
        <View style={styles.doorwayActions}>
          <ActionTextButton label={doorway.pinned ? "UNPIN" : "PIN"} color={doorway.pinned ? "#C4B5FD" : colors.primary} onPress={() => onTogglePin(doorway)} />
          <ActionTextButton label="EDIT" color={colors.primary} onPress={() => onEdit(doorway)} />
          <ActionTextButton label="REMOVE" color={colors.error} onPress={() => onRemove(doorway)} />
        </View>
      </View>
    </CommandCard>
  );
});

function ActionTextButton({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.actionTextButton, { opacity: pressed ? 0.62 : 1 }]}><Text style={[styles.actionText, { color }]}>{label}</Text></Pressable>;
}

export default function ShadowGateSettingsScreen() {
  const colors = useColors();
  const ready = useFocusCommandReady();
  const doorways = useFocusCommandSelector((state) => state.shadowGatePersonalDoorways);
  const { addShadowGatePersonalDoorway, updateShadowGatePersonalDoorway, removeShadowGatePersonalDoorway } = useFocusCommandActions();
  const [newDoorway, setNewDoorway] = useState("");
  const [editingDoorway, setEditingDoorway] = useState<ShadowGatePersonalDoorway | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const sortedDoorways = useMemo(() => doorways.slice().sort((left, right) => Number(right.pinned) - Number(left.pinned) || right.updatedAt.localeCompare(left.updatedAt)), [doorways]);

  const addDoorway = useCallback(() => {
    const id = addShadowGatePersonalDoorway(newDoorway);
    if (id) setNewDoorway("");
  }, [addShadowGatePersonalDoorway, newDoorway]);
  const startEditing = useCallback((doorway: ShadowGatePersonalDoorway) => {
    setEditingDoorway(doorway);
    setEditingLabel(doorway.label);
  }, []);
  const saveEditing = useCallback(() => {
    if (!editingDoorway || !editingLabel.trim()) return;
    updateShadowGatePersonalDoorway(editingDoorway.id, { label: editingLabel });
    setEditingDoorway(null);
    setEditingLabel("");
  }, [editingDoorway, editingLabel, updateShadowGatePersonalDoorway]);
  const removeDoorway = useCallback((doorway: ShadowGatePersonalDoorway) => {
    Alert.alert("Remove personal doorway?", `“${doorway.label}” will be removed from your available personal doorways. Existing Gate ledger records remain unchanged.`, [
      { text: "Keep", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeShadowGatePersonalDoorway(doorway.id) },
    ]);
  }, [removeShadowGatePersonalDoorway]);
  const toggleDoorwayPin = useCallback((doorway: ShadowGatePersonalDoorway) => {
    updateShadowGatePersonalDoorway(doorway.id, { pinned: !doorway.pinned });
  }, [updateShadowGatePersonalDoorway]);
  const renderDoorway = useCallback(({ item }: { item: ShadowGatePersonalDoorway }) => (
    <DoorwayRow doorway={item} onEdit={startEditing} onTogglePin={toggleDoorwayPin} onRemove={removeDoorway} />
  ), [removeDoorway, startEditing, toggleDoorwayPin]);

  if (!ready) return <LoadingScreen label="Opening Shadow Gate settings…" />;

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]}>
      <FlatList
        data={sortedDoorways}
        keyExtractor={(doorway) => doorway.id}
        renderItem={renderDoorway}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        updateCellsBatchingPeriod={16}
        windowSize={7}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={(
          <View style={styles.header}>
            <ScreenTitle eyebrow="Local-only tools" title="Personal Doorways" detail="Write one short action that helps you cross a Shadow Gate. These stay private, can be pinned for quick reuse, and are never sent anywhere." right={<IconAction icon="xmark" label="Close Shadow Gate settings" onPress={() => router.back()} />} />
            <CommandCard accent="#8B5CF9" style={styles.addCard}>
              <Text style={[styles.addLabel, { color: "#C4B5FD" }]}>NEW PERSONAL DOORWAY</Text>
              <TextInput value={newDoorway} onChangeText={setNewDoorway} maxLength={90} placeholder="For example: Open the marked Chemistry page" placeholderTextColor={colors.muted} style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} returnKeyType="done" onSubmitEditing={addDoorway} />
              <View style={styles.addFooter}><Text style={[styles.limit, { color: colors.muted }]}>{newDoorway.length}/90</Text><CommandButton label="Save doorway" disabled={!newDoorway.trim()} onPress={addDoorway} /></View>
            </CommandCard>
            {editingDoorway ? <CommandCard accent="#8B5CF9" style={styles.editCard}><Text style={[styles.addLabel, { color: "#C4B5FD" }]}>EDIT PERSONAL DOORWAY</Text><TextInput value={editingLabel} onChangeText={setEditingLabel} maxLength={90} autoFocus placeholderTextColor={colors.muted} style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} returnKeyType="done" onSubmitEditing={saveEditing} /><View style={styles.editActions}><CommandButton label="Cancel" variant="ghost" onPress={() => { setEditingDoorway(null); setEditingLabel(""); }} /><CommandButton label="Save changes" disabled={!editingLabel.trim()} onPress={saveEditing} /></View></CommandCard> : null}
            <Text style={[styles.listTitle, { color: colors.muted }]}>{sortedDoorways.length ? "SAVED DOORWAYS" : "NO PERSONAL DOORWAYS YET"}</Text>
          </View>
        )}
        ListEmptyComponent={<CommandCard accent="#8B5CF9" style={styles.empty}><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Keep the first move close.</Text><Text style={[styles.emptyDetail, { color: colors.muted }]}>Save a small action you already know helps you begin. It will appear as “MY OWN DOORWAY” inside the optional mission-entry sheet.</Text></CommandCard>}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36, gap: 10 },
  header: { gap: 12, paddingBottom: 14 },
  addCard: { gap: 9 },
  addLabel: { fontSize: 9, lineHeight: 12, letterSpacing: 0.9, fontWeight: "900" },
  textInput: { minHeight: 45, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, fontSize: 13, lineHeight: 18, fontWeight: "700" },
  addFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  limit: { fontSize: 10, lineHeight: 14, fontWeight: "800" },
  editCard: { gap: 9, backgroundColor: "#8B5CF90E" },
  editActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  listTitle: { fontSize: 9, lineHeight: 12, letterSpacing: 0.9, fontWeight: "900", paddingHorizontal: 2 },
  doorwayCard: { gap: 7 },
  doorwayTopline: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  doorwayCopy: { flex: 1, minWidth: 0, gap: 3 },
  doorwayLabel: { fontSize: 13, lineHeight: 18, fontWeight: "900" },
  doorwayMeta: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.75 },
  doorwayActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", columnGap: 9, rowGap: 3, maxWidth: 132 },
  actionTextButton: { minHeight: 20, justifyContent: "center" },
  actionText: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.55 },
  empty: { alignItems: "center", paddingVertical: 24, gap: 5 },
  emptyTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  emptyDetail: { maxWidth: 300, fontSize: 11, lineHeight: 16, fontWeight: "600", textAlign: "center" },
});
