import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { CommandCard, LoadingScreen, ScreenTitle, SectionHeader, StatusPill, TapFeedback } from "@/components/focus-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getCorePrinciplesSummary } from "@/lib/core-principles";
import {
  shallowEqual,
  toLocalDate,
  type CorePrincipleItem,
  type CorePrincipleList,
  type FocusState,
  useFocusCommandActions,
  useFocusCommandReady,
  useFocusCommandSelector,
} from "@/lib/focus-command";

type ChecklistRow =
  | { id: string; kind: "list"; list: CorePrincipleList; itemCount: number }
  | { id: string; kind: "item"; list: CorePrincipleList; item: CorePrincipleItem };

const selectCorePrinciples = (state: FocusState) => ({
  title: state.corePrinciplesTitle,
  lists: state.corePrincipleLists,
  items: state.corePrincipleItems,
  checkIns: state.corePrincipleDailyCheckIns,
  timezone: state.profile.timezone,
});

export default function CorePrinciplesScreen() {
  const colors = useColors();
  const ready = useFocusCommandReady();
  const actions = useFocusCommandActions();
  const { title, lists, items, checkIns, timezone } = useFocusCommandSelector(selectCorePrinciples, shallowEqual);
  const [titleEditorOpen, setTitleEditorOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);
  const [listDraft, setListDraft] = useState("");
  const [itemDraft, setItemDraft] = useState("");
  const [addingToListId, setAddingToListId] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListDraft, setEditingListDraft] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemDraft, setEditingItemDraft] = useState("");
  const [showPaused, setShowPaused] = useState(false);

  const today = toLocalDate(new Date().toISOString(), timezone);
  const todayCheckIn = useMemo(() => checkIns.find((checkIn) => checkIn.localDate === today), [checkIns, today]);
  const checkedById = useMemo(() => new Map(todayCheckIn?.items.map((item) => [item.itemId, item.checked]) ?? []), [todayCheckIn]);
  const todaySummary = useMemo(() => getCorePrinciplesSummary(todayCheckIn ? [todayCheckIn] : []), [todayCheckIn]);
  const activeCount = useMemo(
    () => items.filter((item) => item.active && lists.some((list) => list.id === item.listId)).length,
    [items, lists],
  );
  const rows = useMemo<ChecklistRow[]>(() => lists.flatMap((list) => {
    const listItems = items.filter((item) => item.listId === list.id && (item.active || showPaused));
    return [
      { id: `list_${list.id}`, kind: "list" as const, list, itemCount: listItems.length },
      ...listItems.map((item) => ({ id: `item_${item.id}`, kind: "item" as const, list, item })),
    ];
  }), [items, lists, showPaused]);

  const saveTitle = useCallback(() => {
    actions.updateCorePrinciplesTitle(titleDraft);
    setTitleEditorOpen(false);
  }, [actions, titleDraft]);
  const addList = useCallback(() => {
    if (!actions.addCorePrincipleList(listDraft)) return;
    setListDraft("");
  }, [actions, listDraft]);
  const addItem = useCallback(() => {
    if (!addingToListId || !actions.addCorePrincipleItem(addingToListId, itemDraft)) return;
    setItemDraft("");
    setAddingToListId(null);
  }, [actions, addingToListId, itemDraft]);
  const beginListEdit = useCallback((list: CorePrincipleList) => {
    setEditingListId(list.id);
    setEditingListDraft(list.title);
    setAddingToListId(null);
  }, []);
  const saveListEdit = useCallback(() => {
    if (!editingListId || !editingListDraft.trim()) return;
    actions.updateCorePrincipleList(editingListId, editingListDraft);
    setEditingListId(null);
    setEditingListDraft("");
  }, [actions, editingListDraft, editingListId]);
  const beginItemEdit = useCallback((item: CorePrincipleItem) => {
    setEditingItemId(item.id);
    setEditingItemDraft(item.text);
  }, []);
  const saveItemEdit = useCallback(() => {
    if (!editingItemId || !editingItemDraft.trim()) return;
    actions.updateCorePrincipleItem(editingItemId, editingItemDraft);
    setEditingItemId(null);
    setEditingItemDraft("");
  }, [actions, editingItemDraft, editingItemId]);
  const removeList = useCallback((list: CorePrincipleList) => Alert.alert(
    "Delete this list?",
    "Its current rules will be removed. Past daily check-ins remain unchanged.",
    [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => actions.removeCorePrincipleList(list.id) }],
  ), [actions]);
  const removeItem = useCallback((item: CorePrincipleItem) => Alert.alert(
    "Delete this principle?",
    "Its current rule will be removed. Past daily check-ins remain unchanged.",
    [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => actions.removeCorePrincipleItem(item.id) }],
  ), [actions]);

  if (!ready) return <LoadingScreen label="Opening core principles…" />;
  const ratio = todaySummary.successRatio === null ? null : Math.round(todaySummary.successRatio * 100);
  const header = <>
    <ScreenTitle
      eyebrow="PRIVATE DAILY PRACTICE"
      title={title}
      detail="Write your own rules, check today’s actions, and keep a truthful success record."
      right={<Pressable onPress={() => router.back()}><Text style={[styles.close, { color: colors.primary }]}>Close</Text></Pressable>}
    />
    <CommandCard accent={colors.success} style={styles.todayCard}>
      <View style={styles.todayTop}>
        <View>
          <Text style={[styles.todayLabel, { color: colors.success }]}>TODAY’S SUCCESS RATIO</Text>
          <Text style={[styles.todayRatio, { color: ratio === null ? colors.foreground : colors.success }]}>{ratio === null ? "—" : `${ratio}%`}</Text>
        </View>
        <StatusPill label={ratio === null ? "NOT RECORDED" : `${todaySummary.checked}/${todaySummary.applicable} DONE`} tone={ratio === null ? "neutral" : "success"} icon="checklist" />
      </View>
      <Text style={[styles.todayDetail, { color: colors.muted }]}>
        {ratio === null
          ? activeCount ? "Tap a principle when you begin. A day is not treated as zero until you record it." : "Create a list and add your first principle to begin."
          : "Checked principles divided by the rules recorded for today."}
      </Text>
    </CommandCard>
    <TapFeedback onPress={() => router.push("/core-principles-history" as never)} accessibilityLabel="Open Core Principles Success Ratio history">
      <CommandCard accent="#A78BFA" style={styles.historyLink}>
        <View style={styles.historyLinkRow}>
          <View style={styles.historyLinkCopy}>
            <Text style={[styles.historyLinkEyebrow, { color: "#A78BFA" }]}>SUCCESS RATIO HISTORY</Text>
            <Text style={[styles.historyLinkTitle, { color: colors.foreground }]}>Review your private consistency</Text>
            <Text style={[styles.historyLinkDetail, { color: colors.muted }]}>Week, month, lifetime, custom dates, and neutral attention insights.</Text>
          </View>
          <Text style={[styles.historyArrow, { color: "#A78BFA" }]}>›</Text>
        </View>
      </CommandCard>
    </TapFeedback>
    <SectionHeader title="Today’s principles" />
    <View style={styles.titleActions}>
      <Pressable onPress={() => { setTitleDraft(title); setTitleEditorOpen((open) => !open); }} style={({ pressed }) => [styles.smallButton, { borderColor: colors.primary, backgroundColor: `${colors.primary}18`, opacity: pressed ? 0.72 : 1 }]}>
        <Text style={[styles.smallButtonText, { color: colors.primary }]}>{titleEditorOpen ? "Close name" : "Rename title"}</Text>
      </Pressable>
      <Pressable onPress={() => setShowPaused((value) => !value)} style={({ pressed }) => [styles.smallButton, { borderColor: colors.border, backgroundColor: colors.background, opacity: pressed ? 0.72 : 1 }]}>
        <Text style={[styles.smallButtonText, { color: colors.foreground }]}>{showPaused ? "Hide paused" : "Show paused"}</Text>
      </Pressable>
    </View>
    {titleEditorOpen ? <CommandCard accent={colors.primary} style={styles.editor}>
      <Text style={[styles.editorLabel, { color: colors.muted }]}>FEATURE TITLE</Text>
      <TextInput value={titleDraft} onChangeText={setTitleDraft} placeholder="Core Principles" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} returnKeyType="done" onSubmitEditing={saveTitle} />
      <Pressable onPress={saveTitle} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}><Text style={[styles.primaryText, { color: colors.background }]}>Save title</Text></Pressable>
    </CommandCard> : null}
    <CommandCard accent={colors.success} style={styles.editor}>
      <Text style={[styles.editorLabel, { color: colors.muted }]}>ADD A LIST</Text>
      <View style={styles.inlineComposer}>
        <TextInput value={listDraft} onChangeText={setListDraft} placeholder="For example: Study standards" placeholderTextColor={colors.muted} style={[styles.input, styles.flexInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} returnKeyType="done" onSubmitEditing={addList} />
        <Pressable onPress={addList} style={({ pressed }) => [styles.addButton, { backgroundColor: colors.success, opacity: pressed ? 0.78 : 1 }]}><Text style={[styles.addButtonText, { color: colors.background }]}>Add</Text></Pressable>
      </View>
    </CommandCard>
  </>;

  return <ScreenContainer className="px-4" containerClassName="bg-background">
    <FlatList
      data={rows}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={header}
      ListEmptyComponent={<CommandCard accent="#8EA0B8"><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your principles begin here</Text><Text style={[styles.emptyCopy, { color: colors.muted }]}>Create a list, then write the positive rules you want to practise every day. This does not affect XP, rewards, missions, or revisions.</Text></CommandCard>}
      renderItem={({ item }) => item.kind === "list" ? <CommandCard accent={colors.primary} style={styles.listHeader}>
        <View style={styles.listTop}>
          <View style={styles.listCopy}>
            {editingListId === item.list.id
              ? <TextInput value={editingListDraft} onChangeText={setEditingListDraft} autoFocus placeholderTextColor={colors.muted} style={[styles.listInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} returnKeyType="done" onSubmitEditing={saveListEdit} />
              : <Text style={[styles.listTitle, { color: colors.foreground }]}>{item.list.title}</Text>}
            <Text style={[styles.listDetail, { color: colors.muted }]}>{item.itemCount} visible principle{item.itemCount === 1 ? "" : "s"}</Text>
          </View>
          <View style={styles.listActions}>
            {editingListId === item.list.id ? <><Pressable onPress={saveListEdit}><Text style={[styles.actionText, { color: colors.success }]}>Save</Text></Pressable><Pressable onPress={() => setEditingListId(null)}><Text style={[styles.actionText, { color: colors.muted }]}>Cancel</Text></Pressable></> : <><Pressable onPress={() => setAddingToListId(addingToListId === item.list.id ? null : item.list.id)}><Text style={[styles.actionText, { color: colors.success }]}>Add rule</Text></Pressable><Pressable onPress={() => beginListEdit(item.list)}><Text style={[styles.actionText, { color: colors.primary }]}>Rename</Text></Pressable><Pressable onPress={() => removeList(item.list)}><Text style={[styles.actionText, { color: "#FF6B6B" }]}>Delete</Text></Pressable></>}
          </View>
        </View>
        {addingToListId === item.list.id ? <View style={styles.itemComposer}>
          <TextInput value={itemDraft} onChangeText={setItemDraft} multiline placeholder="Write a positive rule or habit…" placeholderTextColor={colors.muted} style={[styles.textarea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
          <Pressable onPress={addItem} style={({ pressed }) => [styles.primary, { backgroundColor: colors.success, opacity: pressed ? 0.8 : 1 }]}><Text style={[styles.primaryText, { color: colors.background }]}>Save principle</Text></Pressable>
        </View> : null}
      </CommandCard> : <CommandCard accent={item.item.active ? colors.success : "#8EA0B8"} style={[styles.itemCard, !item.item.active && styles.pausedCard]}>
        <View style={styles.itemRow}>
          <Pressable disabled={!item.item.active} onPress={() => actions.setCorePrincipleItemChecked(item.item.id, !checkedById.get(item.item.id))} accessibilityRole="checkbox" accessibilityState={{ checked: Boolean(checkedById.get(item.item.id)), disabled: !item.item.active }} style={({ pressed }) => [styles.checkbox, { borderColor: checkedById.get(item.item.id) ? colors.success : colors.border, backgroundColor: checkedById.get(item.item.id) ? colors.success : colors.background, opacity: pressed && item.item.active ? 0.7 : 1 }]}><Text style={[styles.checkmark, { color: checkedById.get(item.item.id) ? colors.background : colors.muted }]}>{checkedById.get(item.item.id) ? "✓" : ""}</Text></Pressable>
          <View style={styles.itemCopy}>
            {editingItemId === item.item.id
              ? <TextInput value={editingItemDraft} onChangeText={setEditingItemDraft} multiline autoFocus placeholderTextColor={colors.muted} style={[styles.textarea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
              : <Text style={[styles.itemText, { color: item.item.active ? colors.foreground : colors.muted }, checkedById.get(item.item.id) && styles.checkedText]}>{item.item.text}</Text>}
            <Text style={[styles.itemList, { color: colors.muted }]}>{item.list.title}{item.item.active ? "" : " · PAUSED"}</Text>
          </View>
        </View>
        <View style={styles.itemActions}>
          {editingItemId === item.item.id ? <><Pressable onPress={saveItemEdit}><Text style={[styles.actionText, { color: colors.success }]}>Save</Text></Pressable><Pressable onPress={() => setEditingItemId(null)}><Text style={[styles.actionText, { color: colors.muted }]}>Cancel</Text></Pressable></> : <>{item.item.active ? <Pressable onPress={() => actions.setCorePrincipleItemActive(item.item.id, false)}><Text style={[styles.actionText, { color: colors.warning }]}>Pause</Text></Pressable> : <Pressable onPress={() => actions.setCorePrincipleItemActive(item.item.id, true)}><Text style={[styles.actionText, { color: colors.success }]}>Resume</Text></Pressable>}<Pressable onPress={() => beginItemEdit(item.item)}><Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text></Pressable><Pressable onPress={() => removeItem(item.item)}><Text style={[styles.actionText, { color: "#FF6B6B" }]}>Delete</Text></Pressable></>}
        </View>
      </CommandCard>}
    />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 48 }, close: { fontSize: 14, fontWeight: "900" },
  todayCard: { gap: 8 }, todayTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }, todayLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.1 }, todayRatio: { marginTop: 4, fontSize: 34, lineHeight: 38, fontWeight: "900" }, todayDetail: { fontSize: 13, lineHeight: 18, fontWeight: "700" },
  historyLink: { marginTop: 2 }, historyLinkRow: { flexDirection: "row", alignItems: "center", gap: 12 }, historyLinkCopy: { flex: 1, gap: 4 }, historyLinkEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.05 }, historyLinkTitle: { fontSize: 17, lineHeight: 22, fontWeight: "900" }, historyLinkDetail: { fontSize: 13, lineHeight: 18, fontWeight: "700" }, historyArrow: { fontSize: 31, lineHeight: 34, fontWeight: "500" },
  titleActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: -2 }, smallButton: { minHeight: 36, justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderRadius: 11, paddingHorizontal: 11 }, smallButtonText: { fontSize: 12, fontWeight: "900" },
  editor: { gap: 10 }, editorLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.05 }, inlineComposer: { flexDirection: "row", alignItems: "center", gap: 8 }, flexInput: { flex: 1 }, input: { minHeight: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 12, fontSize: 14, fontWeight: "700" }, textarea: { minHeight: 74, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12, fontSize: 14, lineHeight: 20, fontWeight: "700", textAlignVertical: "top" }, addButton: { minHeight: 44, justifyContent: "center", borderRadius: 12, paddingHorizontal: 14 }, addButtonText: { fontSize: 13, fontWeight: "900" }, primary: { minHeight: 44, justifyContent: "center", alignItems: "center", borderRadius: 12, paddingHorizontal: 14 }, primaryText: { fontSize: 13, fontWeight: "900" },
  listHeader: { gap: 10, marginTop: 2 }, listTop: { gap: 7 }, listCopy: { gap: 2 }, listTitle: { fontSize: 20, lineHeight: 25, fontWeight: "900" }, listInput: { minHeight: 42, borderWidth: StyleSheet.hairlineWidth, borderRadius: 11, paddingHorizontal: 10, fontSize: 17, fontWeight: "900" }, listDetail: { fontSize: 12, fontWeight: "800" }, listActions: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, actionText: { fontSize: 12, fontWeight: "900" }, itemComposer: { gap: 8 },
  itemCard: { gap: 10 }, pausedCard: { opacity: 0.78 }, itemRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 }, checkbox: { width: 30, height: 30, borderWidth: 2, borderRadius: 9, justifyContent: "center", alignItems: "center", marginTop: 1 }, checkmark: { fontSize: 18, lineHeight: 20, fontWeight: "900" }, itemCopy: { flex: 1, gap: 4 }, itemText: { fontSize: 16, lineHeight: 23, fontWeight: "800" }, checkedText: { textDecorationLine: "line-through", opacity: 0.72 }, itemList: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8 }, itemActions: { flexDirection: "row", justifyContent: "flex-end", flexWrap: "wrap", gap: 14 },
  emptyTitle: { fontSize: 18, fontWeight: "900" }, emptyCopy: { marginTop: 6, fontSize: 13, lineHeight: 18, fontWeight: "700" },
});
