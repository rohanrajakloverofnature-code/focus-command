import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/use-colors";

interface ComboGuideProps {
  visible: boolean;
  currentStreak: number;
  currentMultiplier: number;
  onClose: () => void;
}

export function ComboGuide({ visible, currentStreak, currentMultiplier, onClose }: ComboGuideProps) {
  const colors = useColors();
  const streakLabel = `${currentStreak} ${currentStreak === 1 ? "day" : "days"}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close streak and combo guide">
        <Pressable
          onPress={(event) => event.stopPropagation()}
          accessibilityViewIsModal
          style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>STREAK & COMBO</Text>
              <Text style={[styles.title, { color: colors.foreground }]}>How it works</Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close streak and combo guide"
              hitSlop={8}
              style={({ pressed }) => [styles.closeButton, { borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}
            >
              <Text style={[styles.closeText, { color: colors.foreground }]}>×</Text>
            </Pressable>
          </View>

          <View style={[styles.currentCard, { backgroundColor: `${colors.primary}14`, borderColor: `${colors.primary}66` }]}>
            <Text style={[styles.currentLabel, { color: colors.muted }]}>CURRENT PROGRESS</Text>
            <Text style={[styles.currentValue, { color: colors.primary }]}>{streakLabel} · {currentMultiplier.toFixed(2)}×</Text>
          </View>

          <View style={styles.rules}>
            <Text style={[styles.rule, { color: colors.foreground }]}><Text style={{ color: colors.primary }}>• </Text>Complete at least one mission on each local calendar day to continue the streak.</Text>
            <Text style={[styles.rule, { color: colors.foreground }]}><Text style={{ color: colors.primary }}>• </Text>Multiple completed missions on the same day count as one streak day.</Text>
            <Text style={[styles.rule, { color: colors.foreground }]}><Text style={{ color: colors.primary }}>• </Text>After one missed day, the streak and combo temporarily reduce by one step.</Text>
            <Text style={[styles.rule, { color: colors.foreground }]}><Text style={{ color: colors.primary }}>• </Text>After two missed days, they temporarily reduce by two steps.</Text>
            <Text style={[styles.rule, { color: colors.foreground }]}><Text style={{ color: colors.primary }}>• </Text>Complete a mission on the next consecutive day to continue recovery toward your earned combo tier.</Text>
            <Text style={[styles.rule, { color: colors.foreground }]}><Text style={{ color: colors.primary }}>• </Text>Three or more missed days start a new streak at 1 day and 1.00×.</Text>
            <Text style={[styles.note, { color: colors.muted }]}>Starting a mission is not enough—its completion must be saved for that day to count.</Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", padding: 22, backgroundColor: "#000000A8" },
  sheet: { width: "100%", maxWidth: 520, alignSelf: "center", borderRadius: 24, borderWidth: 1, padding: 20, gap: 16, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 22, elevation: 12 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  headerCopy: { flex: 1, gap: 3 },
  eyebrow: { fontSize: 10, lineHeight: 13, letterSpacing: 1.2, fontWeight: "900" },
  title: { fontSize: 24, lineHeight: 29, fontWeight: "900" },
  closeButton: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  closeText: { fontSize: 25, lineHeight: 28, fontWeight: "400", marginTop: -2 },
  currentCard: { borderRadius: 16, borderWidth: 1, padding: 13, gap: 3 },
  currentLabel: { fontSize: 10, lineHeight: 13, letterSpacing: 1, fontWeight: "800" },
  currentValue: { fontSize: 20, lineHeight: 25, fontWeight: "900" },
  rules: { gap: 10 },
  rule: { fontSize: 13, lineHeight: 19, fontWeight: "600" },
  note: { fontSize: 12, lineHeight: 17, fontWeight: "600", marginTop: 2 },
});
