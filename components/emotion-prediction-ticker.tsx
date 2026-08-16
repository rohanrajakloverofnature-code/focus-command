import { memo, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { CommandCard, TapFeedback } from "@/components/focus-ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  EMOTION_PREDICTION_LIBRARY_COUNT,
  EMOTION_PREDICTION_TRACK_COUNT,
  PREDICTION_LABEL_MAX_LENGTH,
  type EmotionPrediction,
} from "@/lib/emotion-predictions";

export const EMOTION_PREDICTION_CAPSULE_WIDTH = 132;

export const EmotionPredictionTicker = memo(function EmotionPredictionTicker({ predictions, reduceMotion }: { predictions: EmotionPrediction[]; reduceMotion: boolean }) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const opacity = useSharedValue(1);
  const key = useMemo(() => predictions.map((prediction) => prediction.id).join("|"), [predictions]);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const current = predictions[index % predictions.length] ?? predictions[0];

  useEffect(() => { setIndex(0); }, [key]);
  useEffect(() => {
    if (reduceMotion || predictions.length < 2) return;
    const rotation = setInterval(() => {
      opacity.value = withSequence(withTiming(0, { duration: 130 }), withTiming(1, { duration: 210 }));
      setIndex((currentIndex) => (currentIndex + 1) % predictions.length);
    }, 3_000);
    return () => clearInterval(rotation);
  }, [key, opacity, predictions.length, reduceMotion]);

  if (!current) return null;
  const close = () => setVisible(false);

  return <>
    <TapFeedback onPress={() => setVisible(true)} accessibilityLabel={`Open emotion prediction library. Current prediction: ${current.label}`} style={styles.capsulePressable}>
      <View style={[styles.capsule, { borderColor: `${current.accent}9A` }]}>
        <View pointerEvents="none" style={[styles.capsuleGlow, { backgroundColor: `${current.accent}14` }]} />
        <View pointerEvents="none" style={[styles.accentRail, { backgroundColor: current.accent }]} />
        <Animated.View style={[styles.capsuleReading, fadeStyle]}>
          <View style={[styles.predictionIcon, { backgroundColor: `${current.accent}22`, borderColor: `${current.accent}55` }]}>
            <View pointerEvents="none" style={[styles.iconHalo, { borderColor: `${current.accent}4A` }]} />
            <IconSymbol name={current.icon} size={14} color={current.accent} />
          </View>
          <Text numberOfLines={1} ellipsizeMode="clip" maxFontSizeMultiplier={1} style={styles.predictionLabel}>{current.label}</Text>
        </Animated.View>
        <View style={[styles.chevronFrame, { borderColor: `${current.accent}30` }]}>
          <IconSymbol name="chevron.right" size={12} color="#D9D1F7" />
        </View>
      </View>
    </TapFeedback>

    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close prediction library" />
        <CommandCard accent={current.accent} style={styles.sheet}>
          <View style={styles.sheetTopline}>
            <View style={styles.sheetHeadingCopy}>
              <Text style={[styles.sheetEyebrow, { color: current.accent }]}>EMOTION PREDICTION LIBRARY</Text>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{current.label}</Text>
            </View>
            <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close prediction library" hitSlop={8} style={({ pressed }) => [styles.closeButton, { borderColor: colors.border, backgroundColor: colors.background, opacity: pressed ? 0.72 : 1 }]}>
              <IconSymbol name="xmark" size={16} color={colors.foreground} />
            </Pressable>
          </View>
          <Text style={[styles.sheetDetail, { color: colors.muted }]}>A private next-session reflection cue from your emotional pattern. It is guidance, not a guarantee or diagnosis.</Text>

          <View style={[styles.activeLibrary, { borderColor: `${current.accent}55`, backgroundColor: `${current.accent}10` }]}>
            <Text style={[styles.libraryLabel, { color: current.accent }]}>CURRENT THREE-READING SET</Text>
            <View style={styles.predictionChips}>
              {predictions.map((prediction) => <View key={prediction.id} style={[styles.predictionChip, { borderColor: `${prediction.accent}66` }]}>
                <IconSymbol name={prediction.icon} size={15} color={prediction.accent} />
                <Text numberOfLines={1} maxFontSizeMultiplier={1} style={styles.chipText}>{prediction.label}</Text>
              </View>)}
            </View>
            <View style={styles.rotationDots} accessibilityLabel="Predictions rotate every three seconds">
              {predictions.map((prediction, predictionIndex) => <View key={prediction.id} style={[styles.rotationDot, { backgroundColor: predictionIndex === index ? current.accent : "#5A6680" }]} />)}
              <Text style={[styles.rotationText, { color: colors.muted }]}>3-second rotation</Text>
            </View>
          </View>

          <View style={styles.readingSection}>
            <Text style={[styles.sectionLabel, { color: current.accent }]}>HOW IT IS READ</Text>
            <Text style={[styles.sectionText, { color: colors.foreground }]}>The on-device reading compares logged start and end feelings, energy, focus, clarity, drive, stress, distraction, friction, and optional reflection answers. It never uses XP, level, missions, streaks, or Dashboard figures.</Text>
          </View>

          <View style={[styles.libraryInfo, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>LIBRARY DESIGN</Text>
            <Text style={[styles.librarySummary, { color: colors.foreground }]}>{EMOTION_PREDICTION_TRACK_COUNT} emotional pattern tracks · {EMOTION_PREDICTION_LIBRARY_COUNT} compact readings · 3 matching readings shown at once.</Text>
            <Text style={[styles.libraryDetail, { color: colors.muted }]}>When your reflection pattern changes, a new matching trio is selected from this fixed offline library. Every capsule label is capped at {PREDICTION_LABEL_MAX_LENGTH} characters so it remains fully visible.</Text>
          </View>
        </CommandCard>
      </View>
    </Modal>
  </>;
});

const styles = StyleSheet.create({
  capsulePressable: { width: EMOTION_PREDICTION_CAPSULE_WIDTH, flexShrink: 0 },
  capsule: { width: EMOTION_PREDICTION_CAPSULE_WIDTH, minHeight: 42, borderWidth: 1, borderRadius: 13, paddingHorizontal: 5, flexDirection: "row", alignItems: "center", gap: 3, overflow: "hidden", backgroundColor: "#14122C" },
  capsuleGlow: { position: "absolute", width: 62, height: 62, borderRadius: 31, right: -25, top: -20 },
  accentRail: { position: "absolute", left: 0, top: 10, bottom: 10, width: 2, borderRadius: 99 },
  capsuleReading: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 2 },
  predictionIcon: { width: 20, height: 20, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" },
  iconHalo: { position: "absolute", width: 14, height: 14, borderRadius: 7, borderWidth: 1 },
  predictionLabel: { flex: 1, minWidth: 0, color: "#F8F7FF", fontSize: 8, lineHeight: 11, letterSpacing: 0.28, fontWeight: "900" },
  chevronFrame: { width: 19, height: 22, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", backgroundColor: "#0F1022A8", flexShrink: 0 },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "#020617B8", padding: 14 },
  sheet: { gap: 13, maxHeight: "84%", backgroundColor: "#111A2B" },
  sheetTopline: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  sheetHeadingCopy: { flex: 1, minWidth: 0, gap: 2 },
  sheetEyebrow: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 1.1 },
  sheetTitle: { fontSize: 24, lineHeight: 29, fontWeight: "900", letterSpacing: -0.35 },
  closeButton: { width: 36, height: 36, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sheetDetail: { fontSize: 12, lineHeight: 17, fontWeight: "600", marginTop: -6 },
  activeLibrary: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 10 },
  libraryLabel: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.9 },
  predictionChips: { gap: 7 },
  predictionChip: { minHeight: 36, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, backgroundColor: "#101C2C", flexDirection: "row", alignItems: "center", gap: 8 },
  chipText: { flex: 1, minWidth: 0, color: "#EEF2FF", fontSize: 11, lineHeight: 15, fontWeight: "900", letterSpacing: 0.5 },
  rotationDots: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 },
  rotationDot: { width: 5, height: 5, borderRadius: 3 },
  rotationText: { marginLeft: 2, fontSize: 10, lineHeight: 14, fontWeight: "700" },
  readingSection: { gap: 4 },
  sectionLabel: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.9 },
  sectionText: { fontSize: 12, lineHeight: 17, fontWeight: "600" },
  libraryInfo: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 11, gap: 4 },
  librarySummary: { fontSize: 12, lineHeight: 17, fontWeight: "800" },
  libraryDetail: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
});
