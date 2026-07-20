import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";

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

const INDIA_OUTLINE = "M150 18 L168 34 L192 38 L205 56 L228 65 L220 85 L240 101 L224 119 L235 143 L218 163 L210 191 L193 208 L180 239 L167 268 L155 313 L142 329 L132 300 L116 278 L105 247 L91 225 L99 200 L84 179 L103 156 L93 132 L110 110 L112 83 L128 62 L137 38 Z";

const TERRITORIES = [
  "M138 44 L157 32 L177 43 L169 72 L143 76 L125 62 Z",
  "M170 75 L201 62 L220 82 L207 109 L176 105 Z",
  "M116 79 L145 78 L162 104 L144 128 L112 113 Z",
  "M163 108 L204 111 L216 139 L196 162 L164 147 Z",
  "M105 127 L143 132 L157 157 L136 181 L101 164 Z",
  "M157 153 L193 169 L187 199 L159 211 L139 184 Z",
  "M96 183 L135 185 L151 218 L128 241 L99 223 L86 202 Z",
  "M151 217 L182 205 L170 250 L156 278 L130 251 Z",
  "M113 244 L132 255 L148 287 L141 313 L124 281 Z",
  "M201 83 L225 96 L231 116 L214 127 L205 107 Z",
  "M111 111 L93 132 L100 153 L105 164 L93 150 L85 132 L97 111 Z",
  "M139 282 L155 286 L150 319 L141 329 L134 303 Z",
];

const PALETTE = ["#F59E0B", "#39C6E8", "#49D17D", "#C092FF", "#FF6B6B", "#F4C95D", "#4FC3F7", "#9CCC65", "#FFAA4C", "#BA8CFF", "#50E3C2", "#FF8A80"];

function hashSubject(value: string) {
  return [...value.toLocaleLowerCase()].reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0) >>> 0;
}

function shortLabel(value: string) {
  return value.length > 13 ? `${value.slice(0, 12)}…` : value;
}

function centroid(pathIndex: number) {
  const positions = [
    [150, 57], [193, 90], [135, 103], [188, 133], [127, 151], [166, 181],
    [115, 207], [153, 238], [128, 278], [218, 105], [99, 135], [145, 303],
  ];
  return positions[pathIndex] ?? [150, 180];
}

export function IndiaSubjectMap({ subjects, accent, foreground, muted, surface, border, onOpenSubject }: IndiaSubjectMapProps) {
  const [selected, setSelected] = useState<string | null>(subjects[0]?.subject ?? null);
  const positioned = useMemo(() => [...subjects]
    .sort((left, right) => hashSubject(left.subject) - hashSubject(right.subject))
    .map((subject, index) => ({ subject, index, slot: index % TERRITORIES.length, color: PALETTE[index % PALETTE.length] ?? accent })), [subjects, accent]);
  const selectedTerritory = positioned.find(({ subject }) => subject.subject === selected)?.subject ?? positioned[0]?.subject ?? null;

  if (!subjects.length) {
    return <View style={[styles.empty, { borderColor: border, backgroundColor: surface }]}>
      <Text style={[styles.emptyTitle, { color: foreground }]}>India subject territory awaits</Text>
      <Text style={[styles.emptyDetail, { color: muted }]}>Create a mission with a subject name. Focus Command will create a capture territory automatically from your mission and review logs.</Text>
    </View>;
  }

  return <View style={styles.wrap}>
    <View style={[styles.canvas, { borderColor: border, backgroundColor: surface }]}>
      <Svg viewBox="0 0 320 350" width="100%" height={310} accessibilityLabel="India-inspired subject territory map with capture percentages">
        <Path d={INDIA_OUTLINE} fill="#071321" stroke="#071321" strokeWidth={8} transform="translate(4 7)" />
        <Path d={INDIA_OUTLINE} fill="#102238" stroke={`${accent}AA`} strokeWidth={2.5} />
        <Path d="M72 95 L251 95 M73 170 L238 170 M89 244 L183 244 M150 28 L150 318" stroke="#FFFFFF18" strokeWidth={1} strokeDasharray="4 5" />
        {positioned.map(({ subject, index, slot, color }) => {
          const [x, y] = centroid(slot);
          const selectedNow = selectedTerritory?.subject === subject.subject;
          const percentage = Math.round(subject.capture * 100);
          const height = Math.max(2, Math.round(subject.capture * 8));
          return <G key={subject.subject} onPress={() => setSelected(subject.subject)}>
            <Path d={TERRITORIES[slot]} fill="#06101B" stroke="#06101B" strokeWidth={5} transform={`translate(2 ${4 + height})`} />
            <Path d={TERRITORIES[slot]} fill={`${color}${selectedNow ? "F5" : "B8"}`} stroke={selectedNow ? "#FFFFFF" : `${color}DD`} strokeWidth={selectedNow ? 2.3 : 1.2} />
            <SvgText x={x} y={y - 3} fill="#FFFFFF" fontSize="8" fontWeight="800" textAnchor="middle">{shortLabel(subject.subject)}</SvgText>
            <SvgText x={x} y={y + 8} fill="#06101B" fontSize="12" fontWeight="900" textAnchor="middle">{percentage}%</SvgText>
            {index < 5 ? <Path d={`M${x - 8} ${y + 14} H${x + 8}`} stroke="#FFFFFFAA" strokeWidth="1" /> : null}
          </G>;
        })}
      </Svg>
      <View style={styles.mapKey}>
        <View style={[styles.mapKeyDot, { backgroundColor: accent }]} />
        <Text style={[styles.mapKeyText, { color: muted }]}>3D territory capture visualisation · subjects are generated from mission and revision logs</Text>
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
