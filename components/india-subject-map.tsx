import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Stop, Text as SvgText } from "react-native-svg";

import { INDIA_BOUNDARY_PATH, INDIA_BOUNDARY_VIEWBOX, INDIA_MAP_ANCHORS } from "@/components/india-boundary";

export interface SubjectTerritory {
  subject: string;
  capture: number;
  completed: number;
  total: number;
  active: number;
  planned: number;
}

interface IndiaSubjectMapProps {
  subjects: SubjectTerritory[];
  accent: string;
  foreground: string;
  muted: string;
  surface: string;
  border: string;
  onOpenSubject: (subject: string) => void;
}

type AnchorName = keyof typeof INDIA_MAP_ANCHORS;
type TerritorySlot = { id: AnchorName; radius: number };

/**
 * One compact cell is reserved for each geographic anchor. Cells never share a
 * slot, and are clipped to the India boundary, so subject zones cannot overlap.
 */
const TERRITORY_SLOTS: TerritorySlot[] = [
  { id: "north", radius: 18 },
  { id: "northwest", radius: 16 },
  { id: "north_central", radius: 16 },
  { id: "central", radius: 17 },
  { id: "west", radius: 17 },
  { id: "midwest", radius: 14 },
  { id: "east", radius: 18 },
  { id: "northeast", radius: 17 },
  { id: "south_central", radius: 13 },
  { id: "southwest", radius: 13 },
  { id: "southeast", radius: 13 },
  { id: "south", radius: 11 },
];

const PALETTE = ["#8B5CF6", "#F4C95D", "#49D17D", "#C092FF", "#FF6B6B", "#FFAA4C", "#E879F9", "#9CCC65", "#FF8A80", "#BA8CFF", "#F59E0B", "#7DD3FC"];

function hashSubject(value: string) {
  return [...value.toLocaleLowerCase()].reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0) >>> 0;
}

function shortLabel(value: string) {
  return value.length > 7 ? `${value.slice(0, 6)}…` : value;
}

function hexagonPath(x: number, y: number, radius: number) {
  const points = Array.from({ length: 6 }, (_, index) => {
    const angle = Math.PI / 3 * index - Math.PI / 6;
    return [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius] as const;
  });
  return `M${points.map(([pointX, pointY]) => `${pointX.toFixed(2)} ${pointY.toFixed(2)}`).join(" L")} Z`;
}

export function IndiaSubjectMap({ subjects, accent, foreground, muted, surface, border, onOpenSubject }: IndiaSubjectMapProps) {
  const [selected, setSelected] = useState<string | null>(subjects[0]?.subject ?? null);
  const { positioned, overflowCount } = useMemo(() => {
    const ranked = [...subjects].sort((left, right) => right.capture - left.capture || hashSubject(left.subject) - hashSubject(right.subject));
    return {
      positioned: ranked.slice(0, TERRITORY_SLOTS.length).map((subject, index) => {
        const slot = TERRITORY_SLOTS[index];
        return { subject, index, slot, color: PALETTE[index % PALETTE.length] ?? accent };
      }),
      overflowCount: Math.max(0, ranked.length - TERRITORY_SLOTS.length),
    };
  }, [subjects, accent]);
  const selectedTerritory = positioned.find(({ subject }) => subject.subject === selected)?.subject ?? positioned[0]?.subject ?? null;

  if (!subjects.length) {
    return <View style={[styles.empty, { borderColor: border, backgroundColor: surface }]}>
      <Text style={[styles.emptyTitle, { color: foreground }]}>India subject territory awaits</Text>
      <Text style={[styles.emptyDetail, { color: muted }]}>Create a mission with a subject name. Focus Command will generate a capture region within the geographic India boundary from your mission and revision logs.</Text>
    </View>;
  }

  return <View style={styles.wrap}>
    <View style={[styles.canvas, { borderColor: border, backgroundColor: surface }]}>
      <Svg viewBox={INDIA_BOUNDARY_VIEWBOX} width="100%" height={348} accessibilityLabel="Geographic India subject territory map with capture percentages">
        <Defs>
          <ClipPath id="india-geographic-boundary"><Path d={INDIA_BOUNDARY_PATH} /></ClipPath>
          <LinearGradient id="india-terrain" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#261141" />
            <Stop offset="0.62" stopColor="#15112B" />
            <Stop offset="1" stopColor="#0C1427" />
          </LinearGradient>
        </Defs>
        <Path d={INDIA_BOUNDARY_PATH} fill="#090D18" opacity={0.55} transform="translate(4 7)" />
        <Path d={INDIA_BOUNDARY_PATH} fill="url(#india-terrain)" stroke={`${accent}99`} strokeWidth={2.2} />
        <G clipPath="url(#india-geographic-boundary)">
          <Path d="M0 72 H320 M0 145 H320 M0 218 H320 M0 291 H320 M64 0 V380 M128 0 V380 M192 0 V380 M256 0 V380" stroke="#FFFFFF12" strokeWidth={0.8} strokeDasharray="3 6" />
          {positioned.map(({ subject, index, slot, color }) => {
            const anchor = INDIA_MAP_ANCHORS[slot.id];
            const selectedNow = selectedTerritory?.subject === subject.subject;
            const percentage = Math.round(subject.capture * 100);
            const depth = Math.max(2, Math.round(subject.capture * 5));
            const cellPath = hexagonPath(anchor.x, anchor.y, slot.radius);
            return <G key={subject.subject} onPress={() => setSelected(subject.subject)}>
              <Path d={cellPath} fill="#060914" opacity={0.7} transform={`translate(1.5 ${depth + 2})`} />
              <Path d={cellPath} fill={`${color}${selectedNow ? "F2" : "C4"}`} stroke={selectedNow ? "#FFFFFF" : `${color}F2`} strokeWidth={selectedNow ? 1.9 : 1.05} />
              {selectedNow ? <Path d={cellPath} fill="none" stroke="#FFFFFF88" strokeWidth={0.65} transform="translate(-0.8 -0.8)" /> : null}
              <SvgText x={anchor.x} y={anchor.y - 3} fill="#FFFFFF" fontSize="6.6" fontWeight="800" textAnchor="middle">{shortLabel(subject.subject)}</SvgText>
              <SvgText x={anchor.x} y={anchor.y + 8} fill="#0B1221" fontSize="9.8" fontWeight="900" textAnchor="middle">{percentage}%</SvgText>
              {index < 6 ? <Path d={`M${anchor.x - 6} ${anchor.y + 12} H${anchor.x + 6}`} stroke="#FFFFFFAA" strokeWidth="0.75" /> : null}
            </G>;
          })}
        </G>
        <Path d={INDIA_BOUNDARY_PATH} fill="none" stroke="#FFF8" strokeWidth={0.7} pointerEvents="none" />
        <Path d={INDIA_BOUNDARY_PATH} fill="none" stroke={`${accent}99`} strokeWidth={2.2} pointerEvents="none" />
      </Svg>
      <View style={styles.mapKey}>
        <View style={[styles.mapKeyDot, { backgroundColor: accent }]} />
        <Text style={[styles.mapKeyText, { color: muted }]}>Geographic India boundary · non-overlapping subject capture cells are generated from your missions and revision logs{overflowCount ? ` · ${overflowCount} additional subject${overflowCount === 1 ? "" : "s"} in registry` : ""}</Text>
      </View>
    </View>
    {selectedTerritory ? <Pressable onPress={() => onOpenSubject(selectedTerritory.subject)} style={({ pressed }) => [styles.detailCard, { borderColor: `${accent}66`, backgroundColor: `${accent}10`, opacity: pressed ? 0.76 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
      <View style={styles.detailCopy}>
        <Text style={[styles.detailTitle, { color: foreground }]}>{selectedTerritory.subject}</Text>
        <Text style={[styles.detailText, { color: muted }]}>{selectedTerritory.completed}/{selectedTerritory.total} captured · {selectedTerritory.active} live · {selectedTerritory.planned} planned</Text>
      </View>
      <Text style={[styles.detailPercent, { color: accent }]}>{Math.round(selectedTerritory.capture * 100)}%</Text>
    </Pressable> : null}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  canvas: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, overflow: "hidden", paddingTop: 4 },
  mapKey: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingBottom: 10 },
  mapKeyDot: { width: 8, height: 8, borderRadius: 99 },
  mapKeyText: { flex: 1, fontSize: 10, lineHeight: 14, fontWeight: "600" },
  detailCard: { minHeight: 62, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  detailCopy: { flex: 1, minWidth: 0 },
  detailTitle: { fontSize: 14, lineHeight: 18, fontWeight: "900" },
  detailText: { fontSize: 11, lineHeight: 16, fontWeight: "600", marginTop: 1 },
  detailPercent: { fontSize: 23, lineHeight: 28, fontWeight: "900" },
  empty: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 17, padding: 15, gap: 5 },
  emptyTitle: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
  emptyDetail: { fontSize: 12, lineHeight: 18, fontWeight: "500" },
});
