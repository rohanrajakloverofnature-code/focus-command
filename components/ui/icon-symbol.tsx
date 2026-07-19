// Fallback for using Material Icons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbol to Material Icons map. Keep every application icon listed here so
 * iOS, Android, and web present equivalent navigation and gameplay affordances.
 */
const MAPPING = {
  "house.fill": "home",
  "checklist": "checklist",
  "book.closed.fill": "auto-stories",
  "bag.fill": "shopping-bag",
  "chart.xyaxis.line": "insert-chart",
  "line.3.horizontal": "menu",
  "plus": "add",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "stop.fill": "stop",
  "bolt.fill": "bolt",
  "flame.fill": "local-fire-department",
  "timer": "timer",
  "shield.fill": "shield",
  "chevron.right": "chevron-right",
  "arrow.clockwise": "refresh",
  "xmark": "close",
  "star.fill": "star",
  "gift.fill": "card-giftcard",
  "gearshape.fill": "settings",
  "cloud.fill": "cloud",
  "figure.run": "directions-run",
  "target": "gps-fixed",
  "trophy.fill": "emoji-events",
  "circle.grid.cross.fill": "grid-view",
  "chevron.left.forwardslash.chevron.right": "code",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
