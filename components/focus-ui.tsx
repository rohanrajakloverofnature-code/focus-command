import { ReactNode } from "react";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useFocusCommand } from "@/lib/focus-command";
import { playFocusTap } from "@/lib/focus-audio";

export type FocusIconName =
  | "house.fill"
  | "checklist"
  | "book.closed.fill"
  | "bag.fill"
  | "chart.xyaxis.line"
  | "line.3.horizontal"
  | "plus"
  | "play.fill"
  | "pause.fill"
  | "stop.fill"
  | "bolt.fill"
  | "flame.fill"
  | "timer"
  | "shield.fill"
  | "chevron.right"
  | "arrow.clockwise"
  | "xmark"
  | "star.fill"
  | "gift.fill"
  | "gearshape.fill"
  | "cloud.fill"
  | "figure.run"
  | "target"
  | "trophy.fill"
  | "circle.grid.cross.fill";

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: string;
  subdued?: boolean;
}

export function CommandCard({ children, style, accent, subdued = false }: CardProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: subdued ? colors.background : colors.surface,
          borderColor: accent ? `${accent}55` : colors.border,
          borderLeftWidth: accent ? 3 : StyleSheet.hairlineWidth,
          borderLeftColor: accent ?? colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function ScreenTitle({
  eyebrow,
  title,
  detail,
  right,
}: {
  eyebrow?: string;
  title: string;
  detail?: string;
  right?: ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.titleRow}>
      <View style={styles.titleCopy}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow.toUpperCase()}</Text> : null}
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>{title}</Text>
        {detail ? <Text style={[styles.screenDetail, { color: colors.muted }]}>{detail}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function FeedbackPressable({
  onPress,
  disabled = false,
  sound = true,
  haptic = true,
  accessibilityState,
  ...props
}: PressableProps & { sound?: boolean; haptic?: boolean }) {
  const { state } = useFocusCommand();
  const isDisabled = disabled === true;
  const handlePress: NonNullable<PressableProps["onPress"]> = (event) => {
    if (isDisabled) return;
    if (sound) playFocusTap(state.profile.soundEnabled, state.profile.soundRoles.tap);
    if (haptic && state.profile.hapticsEnabled && Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    onPress?.(event);
  };
  return <Pressable {...props} accessibilityState={{ ...accessibilityState, disabled: isDisabled }} disabled={isDisabled} onPress={handlePress} />;
}

export function IconAction({
  icon,
  label,
  onPress,
  color,
  disabled = false,
}: {
  icon: FocusIconName;
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}) {
  const colors = useColors();
  const { state } = useFocusCommand();
  const impact = useSharedValue(1);
  const impactStyle = useAnimatedStyle(() => ({ transform: [{ scale: impact.value }, { rotate: `${(impact.value - 1) * 4}deg` }] }));
  const handlePress = () => {
    impact.value = withSequence(withTiming(0.91, { duration: 55 }), withTiming(1.03, { duration: 100 }), withTiming(1, { duration: 110 }));
    playFocusTap(state.profile.soundEnabled, state.profile.soundRoles.tap);
    if (state.profile.hapticsEnabled && Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    onPress();
  };
  return (
    <Animated.View style={impactStyle}><Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.iconAction,
        { borderColor: colors.border, backgroundColor: colors.surface, opacity: disabled ? 0.45 : pressed ? 0.72 : 1 },
      ]}
    >
      <IconSymbol name={icon} size={19} color={color ?? colors.foreground} />
    </Pressable></Animated.View>
  );
}

export function CommandButton({
  label,
  onPress,
  icon,
  variant = "primary",
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: FocusIconName;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const { state } = useFocusCommand();
  const impact = useSharedValue(1);
  const impactStyle = useAnimatedStyle(() => ({ transform: [{ scale: impact.value }] }));
  const handlePress = () => {
    impact.value = withSequence(withTiming(0.955, { duration: 45 }), withTiming(1.02, { duration: 90 }), withTiming(1, { duration: 120 }));
    playFocusTap(state.profile.soundEnabled, state.profile.soundRoles.tap);
    if (state.profile.hapticsEnabled && Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    onPress();
  };
  const palette = {
    primary: { background: colors.primary, foreground: "#071018", border: colors.primary },
    secondary: { background: colors.surface, foreground: colors.foreground, border: colors.border },
    ghost: { background: "transparent", foreground: colors.primary, border: "transparent" },
    danger: { background: colors.error, foreground: "#FFFFFF", border: colors.error },
  }[variant];
  return (
    <Animated.View style={[impactStyle, style]}><Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.commandButton,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
          transform: [{ scale: pressed && !disabled ? 0.975 : 1 }],
        },
      ]}
    >
      {icon ? <IconSymbol name={icon} size={17} color={palette.foreground} /> : null}
      <Text style={[styles.commandButtonLabel, { color: palette.foreground }]}>{label}</Text>
    </Pressable></Animated.View>
  );
}

export function MetricTile({
  label,
  value,
  icon,
  accent,
  detail,
  onPress,
  style,
}: {
  label: string;
  value: string;
  icon?: FocusIconName;
  accent: string;
  detail?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const { state } = useFocusCommand();
  const impact = useSharedValue(1);
  const impactStyle = useAnimatedStyle(() => ({ transform: [{ scale: impact.value }] }));
  const handleMetricPress = () => {
    if (!onPress) return;
    impact.value = withSequence(withTiming(0.97, { duration: 45 }), withTiming(1.01, { duration: 100 }), withTiming(1, { duration: 110 }));
    playFocusTap(state.profile.soundEnabled, state.profile.soundRoles.tap);
    if (state.profile.hapticsEnabled && Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    onPress();
  };
  const body = (
    <>
      <View style={styles.metricTopline}>
        <Text style={[styles.metricLabel, { color: colors.muted }]}>{label.toUpperCase()}</Text>
        {icon ? <IconSymbol name={icon} size={16} color={accent} /> : null}
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
      {detail ? <Text numberOfLines={2} style={[styles.metricDetail, { color: colors.muted }]}>{detail}</Text> : <View style={styles.metricSpacer} />}
    </>
  );
  if (!onPress) {
    return <View style={[styles.metricTile, { backgroundColor: colors.surface, borderColor: `${accent}55` }, style]}>{body}</View>;
  }
  return (
    <Animated.View style={[impactStyle, style]}><Pressable
      accessibilityRole="button"
      onPress={handleMetricPress}
      style={({ pressed }) => [
        styles.metricTile,
        { backgroundColor: colors.surface, borderColor: `${accent}55`, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      {body}
    </Pressable></Animated.View>
  );
}

export function ProgressBar({
  value,
  color,
  trackColor,
  height = 8,
  label,
}: {
  value: number;
  color: string;
  trackColor?: string;
  height?: number;
  label?: string;
}) {
  const colors = useColors();
  const safeValue = Math.min(1, Math.max(0, value));
  return (
    <View>
      {label ? <Text style={[styles.progressLabel, { color: colors.muted }]}>{label}</Text> : null}
      <View style={[styles.progressTrack, { backgroundColor: trackColor ?? colors.border, height }]}> 
        <View style={[styles.progressFill, { backgroundColor: color, width: `${safeValue * 100}%`, height }]} />
      </View>
    </View>
  );
}

export function StatusPill({
  label,
  tone = "neutral",
  icon,
}: {
  label: string;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger" | "gold";
  icon?: FocusIconName;
}) {
  const colors = useColors();
  const palette = {
    neutral: { background: colors.border, foreground: colors.muted },
    primary: { background: `${colors.primary}20`, foreground: colors.primary },
    success: { background: `${colors.success}20`, foreground: colors.success },
    warning: { background: `${colors.warning}20`, foreground: colors.warning },
    danger: { background: `${colors.error}20`, foreground: colors.error },
    gold: { background: "#F4C95D22", foreground: "#F4C95D" },
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette.background }]}> 
      {icon ? <IconSymbol name={icon} size={12} color={palette.foreground} /> : null}
      <Text style={[styles.pillLabel, { color: palette.foreground }]}>{label}</Text>
    </View>
  );
}

export function TapFeedback({
  children,
  onPress,
  style,
  disabled = false,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const { state } = useFocusCommand();
  const scale = useSharedValue(1);
  const tapStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const handlePress = () => {
    if (disabled) return;
    if (!state.profile.reduceMotion) scale.value = withSequence(withTiming(0.972, { duration: 45 }), withTiming(1.012, { duration: 90 }), withTiming(1, { duration: 110 }));
    playFocusTap(state.profile.soundEnabled, state.profile.soundRoles.tap);
    if (state.profile.hapticsEnabled && Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    onPress();
  };
  return (
    <Animated.View style={[tapStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={handlePress}
        style={({ pressed }) => ({ opacity: disabled ? 0.45 : pressed ? 0.76 : 1 })}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {action && onAction ? (
        <TapFeedback onPress={onAction} accessibilityLabel={action}>
          <Text style={[styles.sectionAction, { color: colors.primary }]}>{action}</Text>
        </TapFeedback>
      ) : null}
    </View>
  );
}

export function EmptyCommandState({
  icon,
  title,
  detail,
  action,
  onAction,
}: {
  icon: FocusIconName;
  title: string;
  detail: string;
  action?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <CommandCard style={styles.emptyCard} subdued>
      <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}18` }]}>
        <IconSymbol name={icon} size={25} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyDetail, { color: colors.muted }]}>{detail}</Text>
      {action && onAction ? <CommandButton label={action} icon="plus" onPress={onAction} style={styles.emptyAction} /> : null}
    </CommandCard>
  );
}

export function LoadingScreen({ label = "Preparing command center…" }: { label?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.loading, { backgroundColor: colors.background }]}> 
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.loadingLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

export const typography = StyleSheet.create({
  heading: { fontSize: 20, lineHeight: 26, fontWeight: "700" } as TextStyle,
  body: { fontSize: 14, lineHeight: 20 } as TextStyle,
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "500" } as TextStyle,
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    overflow: "hidden",
  },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  titleCopy: { flex: 1, gap: 3 },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.2, fontWeight: "800" },
  screenTitle: { fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -0.45 },
  screenDetail: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
  iconAction: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  commandButton: {
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  commandButtonLabel: { fontSize: 14, lineHeight: 18, fontWeight: "800" },
  metricTile: { minHeight: 120, flex: 1, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 13, gap: 5 },
  metricTopline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 6 },
  metricLabel: { flex: 1, fontSize: 9, lineHeight: 12, letterSpacing: 0.75, fontWeight: "800" },
  metricValue: { fontSize: 22, lineHeight: 27, fontWeight: "800", letterSpacing: -0.35 },
  metricDetail: { fontSize: 11, lineHeight: 14, fontWeight: "600" },
  metricSpacer: { height: 28 },
  progressLabel: { fontSize: 11, lineHeight: 15, marginBottom: 6, fontWeight: "600" },
  progressTrack: { borderRadius: 99, overflow: "hidden", width: "100%" },
  progressFill: { borderRadius: 99 },
  pill: { paddingHorizontal: 9, minHeight: 24, borderRadius: 99, flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start" },
  pillLabel: { fontSize: 10, lineHeight: 13, fontWeight: "800" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionTitle: { fontSize: 17, lineHeight: 22, fontWeight: "800", letterSpacing: -0.15 },
  sectionAction: { fontSize: 13, lineHeight: 18, fontWeight: "800" },
  emptyCard: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 20 },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 16, lineHeight: 21, fontWeight: "800", textAlign: "center" },
  emptyDetail: { fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 5, maxWidth: 300 },
  emptyAction: { marginTop: 16, alignSelf: "stretch" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingLabel: { fontSize: 13, lineHeight: 18, fontWeight: "600" },
});
