import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";

import { IconSymbol } from "@/components/ui/icon-symbol";

export type CelebrationKind = "mission" | "combo" | "level" | "title" | "journal";

const details: Record<CelebrationKind, { icon: "trophy.fill" | "flame.fill" | "bolt.fill" | "star.fill" | "book.closed.fill"; accent: string; title: string; subtitle: string }> = {
  mission: { icon: "trophy.fill", accent: "#F4C95D", title: "OBJECTIVE SECURED", subtitle: "Mission rewards recorded" },
  combo: { icon: "flame.fill", accent: "#FFAA4C", title: "COMBO ASCENDED", subtitle: "Your multiplier is stronger" },
  level: { icon: "bolt.fill", accent: "#39C6E8", title: "LEVEL ASCENDED", subtitle: "New command power unlocked" },
  title: { icon: "star.fill", accent: "#C092FF", title: "TITLE UNLOCKED", subtitle: "Your operative has evolved" },
  journal: { icon: "book.closed.fill", accent: "#49D17D", title: "DAILY SIGNAL LOGGED", subtitle: "Your Lifeline gained momentum" },
};

export function CelebrationOverlay({ kind, reduceMotion, onDone }: { kind: CelebrationKind; reduceMotion: boolean; onDone?: () => void }) {
  const copy = details[kind];
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.84);
  const burst = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(withTiming(1, { duration: reduceMotion ? 0 : 180 }), withDelay(reduceMotion ? 850 : 2050, withTiming(0, { duration: reduceMotion ? 0 : 260 })));
    scale.value = withSequence(withTiming(1, { duration: reduceMotion ? 0 : 230, easing: Easing.out(Easing.cubic) }), withDelay(reduceMotion ? 850 : 1800, withTiming(0.94, { duration: 220 })));
    burst.value = withSequence(withTiming(1, { duration: reduceMotion ? 0 : 380, easing: Easing.out(Easing.quad) }), withDelay(reduceMotion ? 820 : 1700, withTiming(0, { duration: 250 })));
    const timer = setTimeout(() => onDone?.(), reduceMotion ? 900 : 2480);
    return () => clearTimeout(timer);
  }, [burst, onDone, opacity, reduceMotion, scale]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  const sparkStyle = useAnimatedStyle(() => ({ opacity: burst.value, transform: [{ scale: 0.45 + burst.value * 1.15 }] }));

  return (
    <View pointerEvents="none" style={styles.stage}>
      <Animated.View style={[styles.sparkField, sparkStyle]}>
        {[0, 1, 2, 3, 4, 5].map((index) => <View key={index} style={[styles.spark, { backgroundColor: index % 2 ? copy.accent : "#F5F9FF", transform: [{ rotate: `${index * 60}deg` }, { translateY: -42 }] }]} />)}
      </Animated.View>
      <Animated.View style={[styles.card, { borderColor: `${copy.accent}DD`, shadowColor: copy.accent }, containerStyle]}>
        <View style={[styles.iconFrame, { backgroundColor: `${copy.accent}24`, borderColor: `${copy.accent}A6` }]}><IconSymbol name={copy.icon} size={28} color={copy.accent} /></View>
        <Text style={[styles.title, { color: copy.accent }]}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { ...StyleSheet.absoluteFillObject, zIndex: 100, alignItems: "center", justifyContent: "center" },
  card: { minWidth: 226, alignItems: "center", gap: 6, borderWidth: 1.5, borderRadius: 22, paddingHorizontal: 24, paddingVertical: 20, backgroundColor: "#0B1627F2", shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  iconFrame: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  title: { fontSize: 16, lineHeight: 20, fontWeight: "900", letterSpacing: 1.05, marginTop: 2 },
  subtitle: { color: "#C7D3E2", fontSize: 12, lineHeight: 16, fontWeight: "700" },
  sparkField: { position: "absolute", width: 140, height: 140, alignItems: "center", justifyContent: "center" },
  spark: { position: "absolute", width: 8, height: 18, borderRadius: 4 },
});
