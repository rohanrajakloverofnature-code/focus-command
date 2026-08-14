import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { CommandButton, CommandCard } from "@/components/focus-ui";
import { useColors } from "@/hooks/use-colors";
import { DISTRACTION_CATEGORY_LABELS } from "@/lib/distraction-log";
import { DISTRACTION_CATEGORIES, type DistractionCategory } from "@/lib/focus-command";

export function DistractionLogger({ count, onLog }: { count: number; onLog: (category: DistractionCategory, note?: string) => void }) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const [showOtherNote, setShowOtherNote] = useState(false);
  const [otherNote, setOtherNote] = useState("");
  const close = () => { setVisible(false); setShowOtherNote(false); setOtherNote(""); };
  const log = (category: DistractionCategory, note?: string) => { onLog(category, note); close(); };
  return <>
    <Pressable onPress={() => setVisible(true)} accessibilityRole="button" accessibilityLabel="Log a distraction" style={({ pressed }) => [styles.trigger, { borderColor: `${colors.warning}88`, backgroundColor: `${colors.warning}10`, opacity: pressed ? 0.76 : 1 }]}>
      <View style={styles.triggerCopy}>
        <Text style={[styles.triggerTitle, { color: colors.foreground }]}>Log distraction</Text>
        <Text style={[styles.triggerDetail, { color: colors.muted }]}>Quick private focus signal</Text>
      </View>
      <Text style={[styles.count, { color: colors.warning }]}>{count} logged</Text>
    </Pressable>
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close distraction choices" />
        <CommandCard accent={colors.warning} style={styles.sheet}>
          <Text style={[styles.sheetEyebrow, { color: colors.warning }]}>FOCUS FRICTION</Text>
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{showOtherNote ? "Add a brief note" : "What pulled you away?"}</Text>
          <Text style={[styles.sheetDetail, { color: colors.muted }]}>{showOtherNote ? "Optional. It stays on this device." : "Choose one signal. Your mission timer will keep running."}</Text>
          {showOtherNote ? <>
            <TextInput value={otherNote} onChangeText={setOtherNote} maxLength={140} placeholder="Optional note" placeholderTextColor={colors.muted} style={[styles.noteInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} returnKeyType="done" onSubmitEditing={() => log("other", otherNote)} />
            <View style={styles.sheetActions}><CommandButton label="Skip note" variant="secondary" onPress={() => log("other")} style={styles.sheetAction} /><CommandButton label="Save signal" onPress={() => log("other", otherNote)} style={styles.sheetAction} /></View>
          </> : <View style={styles.categoryGrid}>{DISTRACTION_CATEGORIES.map((category) => <Pressable key={category} onPress={() => category === "other" ? setShowOtherNote(true) : log(category)} style={({ pressed }) => [styles.category, { borderColor: colors.border, backgroundColor: colors.background, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.categoryText, { color: colors.foreground }]}>{DISTRACTION_CATEGORY_LABELS[category]}</Text></Pressable>)}</View>}
        </CommandCard>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  trigger: { minHeight: 52, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  triggerCopy: { flex: 1, gap: 1 }, triggerTitle: { fontSize: 13, lineHeight: 18, fontWeight: "900" }, triggerDetail: { fontSize: 10, lineHeight: 14, fontWeight: "600" }, count: { fontSize: 10, lineHeight: 14, fontWeight: "900", letterSpacing: 0.35 },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "#00000066", padding: 14 }, sheet: { gap: 11, maxHeight: "78%" }, sheetEyebrow: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.9 }, sheetTitle: { fontSize: 19, lineHeight: 24, fontWeight: "900" }, sheetDetail: { fontSize: 12, lineHeight: 17, fontWeight: "600", marginTop: -6 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, category: { width: "31%", minHeight: 45, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 8, alignItems: "center", justifyContent: "center" }, categoryText: { fontSize: 11, lineHeight: 15, fontWeight: "800", textAlign: "center" },
  noteInput: { minHeight: 48, borderWidth: StyleSheet.hairlineWidth, borderRadius: 13, paddingHorizontal: 12, fontSize: 13, lineHeight: 18, fontWeight: "600" }, sheetActions: { flexDirection: "row", gap: 8 }, sheetAction: { flex: 1 },
});
