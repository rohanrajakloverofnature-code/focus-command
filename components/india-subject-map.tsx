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
type TerritorySlot = { id: AnchorName; path: string };

/**
 * These stylized capture cells are clipped to the licensed geographic India boundary.
 * They are player-generated subject territories, never administrative or political areas.
 */
const TERRITORY_SLOTS: TerritorySlot[] = [
  { id: "north", path: "M57 35 L132 37 L151 80 L124 113 L69 108 L48 72 Z" },
  { id: "northwest", path: "M34 96 L95 89 L122 128 L100 163 L39 155 L25 123 Z" },
  { id: "north_central", path: "M90 93 L154 83 L175 130 L145 166 L94 150 L71 122 Z" },
  { id: "central", path: "M92 145 L165 140 L183 190 L143 220 L86 201 L70 172 Z" },
  { id: "west", path: "M28 164 L88 154 L108 198 L85 235 L35 231 L19 201 Z" },
  { id: "midwest", path: "M60 204 L133 194 L155 238 L120 270 L68 257 L47 228 Z" },
  { id: "east", path: "M143 144 L224 139 L240 190 L197 221 L150 205 L130 174 Z" },
  { id: "northeast", path: "M208 98 L306 103 L306 181 L244 198 L211 162 L190 129 Z" },
  { id: "south_central", path: "M92 241 L155 229 L173 274 L141 301 L98 285 L77 260 Z" },
  { id: "southwest", path: "M57 263 L117 257 L137 305 L111 336 L75 321 L58 288 Z" },
  { id: "southeast", path: "M117 269 L163 262 L179 310 L146 341 L114 318 Z" },
  { id: "south", path: "M93 302 L145 296 L156 350 L123 371 L99 343 Z" },
];

const PALETTE = ["#8B5CF6", "#F4C95D", "#49D17D", "#C092FF", "#FF6B6B", "#FFAA4C", "#E879F9", "#9CCC65", "#FF8A80", "#BA8CFF", "#F59E0B", "#7DD3FC"];

function hashSubject(value: string) {
  return [...value.toLocaleLowerCase()].reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0) >>> 0;
}

function shortLabel(value: string) {
  return value.length > 13 ? `${value.slice(0, 12)}…` : value;
}

export function IndiaSubjectMap({ subjects, accent, foreground, muted, surface, border, onOpenSubject }: IndiaSubjectMapProps) {
  const [selected, setSelected] = useState<string | null>(subjects[0]?.subject ?? null);
  const positioned = useMemo(() => [...subjects]
    .sort((left, right) => hashSubject(left.subject) - hashSubject(right.subject))
    .map((subject, index) => {
      const slot = TERRITORY_SLOTS[index % TERRITORY_SLOTS.length];
      return { subject, index, slot, color: PALETTE[index % PALETTE.length] ?? accent };
    }), [subjects, accent]);
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
            const depth = Math.max(3, Math.round(subject.capture * 10));
            return <G key={subject.subject} onPress={() => setSelected(subject.subject)}>
              <Path d={slot.path} fill="#060914" opacity={0.72} transform={`translate(2 ${depth + 3})`} />
              <Path d={slot.path} fill={`${color}${selectedNow ? "F2" : "B6"}`} stroke={selectedNow ? "#FFFFFF" : `${color}F2`} strokeWidth={selectedNow ? 2.25 : 1.15} />
              {selectedNow ? <Path d={slot.path} fill="none" stroke="#FFFFFF88" strokeWidth={0.8} transform="translate(-1 -1)" /> : null}
              <SvgText x={anchor.x} y={anchor.y - 4} fill="#FFFFFF" fontSize="8.2" fontWeight="800" textAnchor="middle">{shortLabel(subject.subject)}</SvgText>
              <SvgText x={anchor.x} y={anchor.y + 8} fill="#0B1221" fontSize="12" fontWeight="900" textAnchor="middle">{percentage}%</SvgText>
              {index < 6 ? <Path d={`M${anchor.x - 9} ${anchor.y + 14} H${anchor.x + 9}`} stroke="#FFFFFFAA" strokeWidth="1" /> : null}
            </G>;
          })}
        </G>
        <Path d={INDIA_BOUNDARY_PATH} fill="none" stroke="#FFF8" strokeWidth={0.7} pointerEvents="none" />
        <Path d={INDIA_BOUNDARY_PATH} fill="none" stroke={`${accent}99`} strokeWidth={2.2} pointerEvents="none" />
      </Svg>
      <View style={styles.mapKey}>
        <View style={[styles.mapKeyDot, { backgroundColor: accent }]} />
        <Text style={[styles.mapKeyText, { color: muted }]}>Geographic India boundary · stylized subject capture regions are generated from your missions and revision logs</Text>
      </View>
    </View>
    {selectedTerritory ? <Pressable onPress={() => onOpenSubject(selectedTerritory.subject)} style={({ pressed }) => [styles.detailCard, { borderColor: `${accent}66`, backgroundColor: `${accent}10`, opacity: pressed ? 0.76 : 1 }]}>
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
