import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Stop, Text as SvgText } from "react-native-svg";

import { INDIA_BOUNDARY_PATH, INDIA_BOUNDARY_VIEWBOX } from "@/components/india-boundary";
import { getDynamicTerritories, getTerritoryLabelLines, type DynamicTerritory } from "@/lib/territory-partition";

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

type PositionedTerritory = DynamicTerritory & { color: string };

const PALETTE = ["#8B5CF6", "#F4C95D", "#49D17D", "#C092FF", "#FF6B6B", "#FFAA4C", "#E879F9", "#9CCC65", "#FF8A80", "#BA8CFF", "#F59E0B", "#7DD3FC"];

function hashSubject(value: string) {
  return [...value.toLocaleLowerCase()].reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0) >>> 0;
}

function TerritoryLayer({
  territories,
  selectedSubject,
  interactive = false,
  onSelect,
}: {
  territories: PositionedTerritory[];
  selectedSubject: string | null;
  interactive?: boolean;
  onSelect?: (subject: string) => void;
}) {
  return (
    <>
      {territories.map(({ subject, capture, path, labelX, labelY, color }) => {
        const selectedNow = selectedSubject === subject;
        const depth = Math.max(2, Math.round(capture * 5));
        return (
          <G key={subject} onPress={interactive ? () => onSelect?.(subject) : undefined}>
            <Path d={path} fill="#060914" opacity={0.7} transform={`translate(1.5 ${depth + 2})`} />
            <Path d={path} fill={`${color}${selectedNow ? "F2" : "C4"}`} stroke={selectedNow ? "#FFFFFF" : `${color}F2`} strokeWidth={selectedNow ? 1.9 : 1.2} strokeLinejoin="round" strokeLinecap="round" />
            {selectedNow ? <Path d={path} fill="none" stroke="#FFFFFF88" strokeWidth={0.65} transform="translate(-0.8 -0.8)" /> : null}
          </G>
        );
      })}
    </>
  );
}

function TerritoryLabels({ territories }: { territories: PositionedTerritory[] }) {
  return <G pointerEvents="none">
    {territories.map(({ subject, capture, labelX, labelY, labelClearance }) => {
      const lines = getTerritoryLabelLines(subject);
      const longestLine = Math.max(...lines.map((line) => line.length));
      const maximumTitleFont = longestLine > 12 ? 5.1 : longestLine > 8 ? 5.8 : 6.6;
      const widthSafeTitleFont = Math.max(0, (labelClearance * 2) / Math.max(1, longestLine * 0.74));
      const widthSafePercentFont = Math.max(0, (labelClearance * 2) / (3 * 0.78));
      const unscaledTitleFont = Math.min(maximumTitleFont, widthSafeTitleFont);
      const unscaledPercentFont = Math.min(9.8, widthSafePercentFont);
      const unscaledHeight = lines.length * unscaledTitleFont * 1.2 + unscaledPercentFont * 1.2 + Math.max(1.4, unscaledTitleFont * 0.3);
      const verticalScale = unscaledHeight > 0 ? Math.min(1, (labelClearance * 2) / unscaledHeight) : 0;
      const titleFont = unscaledTitleFont * verticalScale;
      const percentFont = unscaledPercentFont * verticalScale;
      // A territory without enough geometric room shows no in-map text rather
      // than allowing a label to cross a border. Its full name remains in the
      // selected territory card directly below the map.
      if (titleFont < 3.4 || percentFont < 4.2) return null;
      const titleLineHeight = titleFont * 1.2;
      const gap = Math.max(1.4, titleFont * 0.3);
      const contentHeight = lines.length * titleLineHeight + gap + percentFont * 1.2;
      const firstLineY = labelY - contentHeight / 2 + titleFont;
      const percentY = firstLineY + (lines.length - 1) * titleLineHeight + gap + percentFont;
      return <G key={`label-${subject}`}>
        {lines.map((line, index) => <SvgText key={`${subject}-${index}`} x={labelX} y={firstLineY + index * titleLineHeight} fill="#FFFFFF" fontSize={titleFont} fontWeight="800" textAnchor="middle">{line}</SvgText>)}
        <SvgText x={labelX} y={percentY} fill="#0B1221" fontSize={percentFont} fontWeight="900" textAnchor="middle">{Math.round(capture * 100)}%</SvgText>
      </G>;
    })}
  </G>;
}

export const IndiaSubjectMap = memo(function IndiaSubjectMap({ subjects, accent, foreground, muted, surface, border, onOpenSubject }: IndiaSubjectMapProps) {
  const [selected, setSelected] = useState<string | null>(subjects[0]?.subject ?? null);
  const [previousTerritories, setPreviousTerritories] = useState<PositionedTerritory[]>([]);
  const reflowOpacity = useRef(new Animated.Value(0)).current;
  const previousRef = useRef<PositionedTerritory[]>([]);
  const partitionKey = subjects
    .map((subject) => `${subject.subject.trim().toLocaleLowerCase()}:${Math.max(0, Math.min(1, subject.capture)).toFixed(4)}`)
    .sort()
    .join("|");
  const positioned = useMemo(() => getDynamicTerritories(subjects).map((territory) => ({
    ...territory,
    color: PALETTE[hashSubject(territory.subject) % PALETTE.length] ?? accent,
  })), [subjects, accent]);
  const selectedTerritory = positioned.find((territory) => territory.subject === selected) ?? positioned[0] ?? null;
  const selectedSubject = subjects.find((subject) => subject.subject === selectedTerritory?.subject) ?? null;

  useEffect(() => {
    const prior = previousRef.current;
    if (!prior.length) {
      previousRef.current = positioned;
      return;
    }
    if (partitionKey === prior.map((territory) => `${territory.subject.trim().toLocaleLowerCase()}:${territory.capture.toFixed(4)}`).sort().join("|")) return;
    setPreviousTerritories(prior);
    reflowOpacity.stopAnimation();
    reflowOpacity.setValue(1);
    Animated.timing(reflowOpacity, {
      toValue: 0,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setPreviousTerritories([]);
    });
    previousRef.current = positioned;
  }, [partitionKey, positioned, reflowOpacity]);

  if (!subjects.length) {
    return <View style={[styles.empty, { borderColor: border, backgroundColor: surface }]}>
      <Text style={[styles.emptyTitle, { color: foreground }]}>India subject territory awaits</Text>
      <Text style={[styles.emptyDetail, { color: muted }]}>Create a mission with a subject name. Focus Command will dynamically partition the geographic India boundary from your mission and revision logs.</Text>
    </View>;
  }

  return <View style={styles.wrap}>
    <View style={[styles.canvas, { borderColor: border, backgroundColor: surface }]}>
      <Svg viewBox={INDIA_BOUNDARY_VIEWBOX} width="100%" height={348} accessibilityLabel="Dynamic geographic India subject territory map with completion-weighted capture percentages">
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
          <TerritoryLayer territories={positioned} selectedSubject={selectedTerritory?.subject ?? null} interactive onSelect={setSelected} />
        </G>
        <TerritoryLabels territories={positioned} />
        <Path d={INDIA_BOUNDARY_PATH} fill="none" stroke="#FFF8" strokeWidth={0.7} pointerEvents="none" />
        <Path d={INDIA_BOUNDARY_PATH} fill="none" stroke={`${accent}99`} strokeWidth={2.2} pointerEvents="none" />
      </Svg>
      {previousTerritories.length ? <Animated.View pointerEvents="none" style={[styles.reflowOverlay, { opacity: reflowOpacity }]}>
        <Svg viewBox={INDIA_BOUNDARY_VIEWBOX} width="100%" height={348}>
          <Defs><ClipPath id="india-geographic-boundary-previous"><Path d={INDIA_BOUNDARY_PATH} /></ClipPath></Defs>
          <G clipPath="url(#india-geographic-boundary-previous)">
            <TerritoryLayer territories={previousTerritories} selectedSubject={null} />
          </G>
        </Svg>
      </Animated.View> : null}
      <View style={styles.mapKey}>
        <View style={[styles.mapKeyDot, { backgroundColor: accent }]} />
        <Text style={[styles.mapKeyText, { color: muted }]}>Geographic India boundary · every visible subject territory is dynamically reflowed from your current mission and revision progress</Text>
      </View>
    </View>
    {selectedTerritory ? <Pressable onPress={() => onOpenSubject(selectedTerritory.subject)} style={({ pressed }) => [styles.detailCard, { borderColor: `${accent}66`, backgroundColor: `${accent}10`, opacity: pressed ? 0.76 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
      <View style={styles.detailCopy}>
        <Text style={[styles.detailTitle, { color: foreground }]}>{selectedTerritory.subject}</Text>
        <Text style={[styles.detailText, { color: muted }]}>{selectedSubject?.completed ?? 0}/{selectedSubject?.total ?? 0} captured · {selectedSubject?.active ?? 0} live · {selectedSubject?.planned ?? 0} planned</Text>
      </View>
      <Text style={[styles.detailPercent, { color: accent }]}>{Math.round(selectedTerritory.capture * 100)}%</Text>
    </Pressable> : null}
  </View>;
});

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  canvas: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, overflow: "hidden", paddingTop: 4, position: "relative" },
  reflowOverlay: { position: "absolute", top: 4, left: 0, right: 0, height: 348 },
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
