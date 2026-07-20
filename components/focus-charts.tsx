import { useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Line, Path, Polygon, Rect } from "react-native-svg";

import { useColors } from "@/hooks/use-colors";

export interface ChartPoint {
  label: string;
  value: number;
  color?: string;
}

function displayValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function ChartFocus({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = useColors();
  return <View style={[styles.focusRow, { borderColor: `${color}66`, backgroundColor: `${color}12` }]}><View style={[styles.focusDot, { backgroundColor: color }]} /><Text numberOfLines={1} style={[styles.focusLabel, { color: colors.foreground }]}>{label}</Text><Text style={[styles.focusValue, { color }]}>{displayValue(value)}</Text></View>;
}

export function LineTrendChart({ points, color, secondaryPoints, secondaryColor, height = 132, accessibilityLabel }: { points: ChartPoint[]; color: string; secondaryPoints?: ChartPoint[]; secondaryColor?: string; height?: number; accessibilityLabel: string }) {
  const colors = useColors();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.max(240, windowWidth - 66);
  const padding = { top: 12, right: 10, bottom: 18, left: 6 };
  const chartHeight = height - padding.top - padding.bottom;
  const chartWidth = width - padding.left - padding.right;
  const allValues = [...points, ...(secondaryPoints ?? [])].map((point) => point.value);
  const maximum = Math.max(1, ...allValues);
  const minimum = Math.min(0, ...allValues);
  const range = Math.max(1, maximum - minimum);
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, points.length - 1));
  const clampedIndex = Math.min(selectedIndex, Math.max(0, points.length - 1));
  const selected = points[clampedIndex] ?? { label: "No data", value: 0 };

  const makePath = (series: ChartPoint[]) => series.map((point, index) => {
    const x = padding.left + (series.length <= 1 ? chartWidth / 2 : (index / (series.length - 1)) * chartWidth);
    const y = padding.top + chartHeight - ((point.value - minimum) / range) * chartHeight;
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
  const labelIndexes = points.length <= 4 ? points.map((_, index) => index) : [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return <View accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
    <Svg width={width} height={height}>
      {[0, 0.5, 1].map((fraction) => { const y = padding.top + chartHeight * fraction; return <Line key={fraction} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={colors.border} strokeWidth={1} opacity={0.65} />; })}
      {points.length > 1 ? <Path d={makePath(points)} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /> : null}
      {secondaryPoints && secondaryPoints.length > 1 ? <Path d={makePath(secondaryPoints)} fill="none" stroke={secondaryColor ?? colors.success} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} /> : null}
      {points.map((point, index) => {
        const x = padding.left + (points.length <= 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth);
        const y = padding.top + chartHeight - ((point.value - minimum) / range) * chartHeight;
        const active = index === clampedIndex;
        return <Circle key={`${point.label}-${index}`} onPress={() => setSelectedIndex(index)} cx={x} cy={y} r={active ? 6 : 3.6} fill={color} stroke={colors.surface} strokeWidth={active ? 3 : 2} />;
      })}
    </Svg>
    <ChartFocus label={selected.label} value={selected.value} color={color} />
    <View style={styles.lineLabels}>{labelIndexes.map((index) => <Text key={`${points[index].label}-${index}`} style={[styles.axisLabel, { color: colors.muted }]}>{points[index].label}</Text>)}</View>
  </View>;
}

export interface MultiLineSeries { id: string; label: string; color: string; points: ChartPoint[]; }

export function MultiLineTrendChart({ series, height = 144, accessibilityLabel }: { series: MultiLineSeries[]; height?: number; accessibilityLabel: string }) {
  const colors = useColors();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.max(240, windowWidth - 66);
  const padding = { top: 12, right: 10, bottom: 18, left: 6 };
  const chartHeight = height - padding.top - padding.bottom;
  const chartWidth = width - padding.left - padding.right;
  const allValues = series.flatMap((item) => item.points.map((point) => point.value));
  const maximum = Math.max(1, ...allValues);
  const minimum = Math.min(0, ...allValues);
  const range = Math.max(1, maximum - minimum);
  const [selectedSeries, setSelectedSeries] = useState(0);
  const selected = series[Math.min(selectedSeries, Math.max(0, series.length - 1))];
  const referencePoints = series[0]?.points ?? [];
  const makePath = (points: ChartPoint[]) => points.map((point, index) => {
    const x = padding.left + (points.length <= 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth);
    const y = padding.top + chartHeight - ((point.value - minimum) / range) * chartHeight;
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
  const latest = selected?.points.at(-1) ?? { label: "No data", value: 0 };

  return <View accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
    <Svg width={width} height={height}>
      {[0, 0.5, 1].map((fraction) => { const y = padding.top + chartHeight * fraction; return <Line key={fraction} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={colors.border} strokeWidth={1} opacity={0.65} />; })}
      {series.map((item, index) => item.points.length > 1 ? <Path key={item.id} onPress={() => setSelectedSeries(index)} d={makePath(item.points)} fill="none" stroke={item.color} strokeWidth={index === selectedSeries ? 3.6 : 2.25} strokeLinecap="round" strokeLinejoin="round" opacity={index === selectedSeries ? 1 : 0.52} /> : null)}
    </Svg>
    <View style={styles.multiLegend}>{series.map((item, index) => <Pressable key={item.id} accessibilityRole="button" onPress={() => setSelectedSeries(index)} style={({ pressed }) => [styles.multiLegendItem, { opacity: pressed ? 0.65 : index === selectedSeries ? 1 : 0.58 }]}><View style={[styles.legendDot, { backgroundColor: item.color }]} /><Text style={[styles.axisLabel, { color: colors.muted }]}>{item.label}</Text></Pressable>)}</View>
    <ChartFocus label={`${selected?.label ?? "Series"} · ${latest.label}`} value={latest.value} color={selected?.color ?? colors.primary} />
    <View style={styles.lineLabels}>{(referencePoints.length <= 4 ? referencePoints.map((_, index) => index) : [0, Math.floor((referencePoints.length - 1) / 2), referencePoints.length - 1]).map((index) => <Text key={`${referencePoints[index].label}-${index}`} style={[styles.axisLabel, { color: colors.muted }]}>{referencePoints[index].label}</Text>)}</View>
  </View>;
}

export function BarsChart({ points, color, height = 132, accessibilityLabel }: { points: ChartPoint[]; color: string; height?: number; accessibilityLabel: string }) {
  const colors = useColors();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.max(240, windowWidth - 66);
  const chartHeight = height - 25;
  const maximum = Math.max(1, ...points.map((point) => point.value));
  const gap = points.length > 18 ? 2 : 4;
  const barWidth = Math.max(3, (width - gap * (points.length + 1)) / Math.max(1, points.length));
  const labelIndexes = points.length <= 4 ? points.map((_, index) => index) : [0, Math.floor((points.length - 1) / 2), points.length - 1];
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, points.length - 1));
  const clampedIndex = Math.min(selectedIndex, Math.max(0, points.length - 1));
  const selected = points[clampedIndex] ?? { label: "No data", value: 0 };

  return <View accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
    <Svg width={width} height={height}>
      <Line x1={0} y1={chartHeight} x2={width} y2={chartHeight} stroke={colors.border} strokeWidth={1} />
      {points.map((point, index) => { const barHeight = Math.max(2, (point.value / maximum) * (chartHeight - 8)); const x = gap + index * (barWidth + gap); const active = index === clampedIndex; return <Rect key={`${point.label}-${index}`} onPress={() => setSelectedIndex(index)} x={x} y={chartHeight - barHeight} width={barWidth} height={barHeight} rx={Math.min(4, barWidth / 2)} fill={point.color ?? color} opacity={point.value ? active ? 1 : 0.62 : 0.28} stroke={active ? colors.foreground : "transparent"} strokeWidth={active ? 1.5 : 0} />; })}
    </Svg>
    <ChartFocus label={selected.label} value={selected.value} color={selected.color ?? color} />
    <View style={styles.lineLabels}>{labelIndexes.map((index) => <Text key={`${points[index].label}-${index}`} style={[styles.axisLabel, { color: colors.muted }]}>{points[index].label}</Text>)}</View>
  </View>;
}

function polarToCartesian(center: number, radius: number, angle: number) { const radians = ((angle - 90) * Math.PI) / 180; return { x: center + radius * Math.cos(radians), y: center + radius * Math.sin(radians) }; }
function describeArc(center: number, radius: number, startAngle: number, endAngle: number) { const start = polarToCartesian(center, radius, endAngle); const end = polarToCartesian(center, radius, startAngle); const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"; return [`M ${center} ${center}`, `L ${start.x} ${start.y}`, `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, "Z"].join(" "); }

export function DonutChart({ points, size = 146, centerLabel, centerValue, accessibilityLabel }: { points: ChartPoint[]; size?: number; centerLabel: string; centerValue: string; accessibilityLabel: string }) {
  const colors = useColors();
  const total = points.reduce((sum, point) => sum + Math.max(0, point.value), 0);
  const radius = size / 2 - 8;
  const center = size / 2;
  const defaultColors = ["#A78BFA", "#49D17D", "#F4C95D", "#FFAA4C", "#C092FF", "#FF6B6B"];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = points[Math.min(selectedIndex, Math.max(0, points.length - 1))];
  let cursor = 0;

  return <View style={styles.donutWrap} accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
    <Svg width={size} height={size}>
      <Circle cx={center} cy={center} r={radius} fill={colors.border} opacity={0.42} />
      {total > 0 ? points.map((point, index) => { const start = cursor; const span = (point.value / total) * 360; cursor += span; const active = index === selectedIndex; return <Path key={`${point.label}-${index}`} onPress={() => setSelectedIndex(index)} d={describeArc(center, active ? radius + 4 : radius, start + 1, start + Math.max(2, span - 1))} fill={point.color ?? defaultColors[index % defaultColors.length]} opacity={active ? 1 : 0.7} />; }) : null}
      <Circle cx={center} cy={center} r={radius * 0.58} fill={colors.surface} />
    </Svg>
    <View pointerEvents="none" style={styles.donutCenter}><Text style={[styles.donutValue, { color: selected?.color ?? colors.foreground }]}>{selected ? `${Math.round((selected.value / Math.max(1, total)) * 100)}%` : centerValue}</Text><Text numberOfLines={2} style={[styles.donutLabel, { color: colors.muted }]}>{selected?.label ?? centerLabel}</Text></View>
    {selected ? <ChartFocus label={selected.label} value={selected.value} color={selected.color ?? defaultColors[selectedIndex % defaultColors.length]} /> : null}
  </View>;
}

export function RadarChart({ points, color, size = 176, accessibilityLabel }: { points: ChartPoint[]; color: string; size?: number; accessibilityLabel: string }) {
  const colors = useColors();
  const maxValue = Math.max(1, ...points.map((point) => point.value));
  const center = size / 2;
  const radius = size / 2 - 24;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = points[Math.min(selectedIndex, Math.max(0, points.length - 1))] ?? { label: "No data", value: 0 };
  const coordinates = points.map((point, index) => { const angle = (Math.PI * 2 * index) / Math.max(1, points.length) - Math.PI / 2; const adjustedRadius = radius * (point.value / maxValue); return `${center + Math.cos(angle) * adjustedRadius},${center + Math.sin(angle) * adjustedRadius}`; }).join(" ");
  const fullCoordinates = points.map((_, index) => { const angle = (Math.PI * 2 * index) / Math.max(1, points.length) - Math.PI / 2; return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`; }).join(" ");

  return <View style={styles.radarWrap} accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
    <Svg width={size} height={size}>
      {[0.33, 0.66, 1].map((fraction) => <Polygon key={fraction} points={points.map((_, index) => { const angle = (Math.PI * 2 * index) / Math.max(1, points.length) - Math.PI / 2; return `${center + Math.cos(angle) * radius * fraction},${center + Math.sin(angle) * radius * fraction}`; }).join(" ")} fill="none" stroke={colors.border} strokeWidth={1} />)}
      {points.map((_, index) => { const angle = (Math.PI * 2 * index) / Math.max(1, points.length) - Math.PI / 2; return <Line key={index} onPress={() => setSelectedIndex(index)} x1={center} y1={center} x2={center + Math.cos(angle) * radius} y2={center + Math.sin(angle) * radius} stroke={index === selectedIndex ? color : colors.border} strokeWidth={index === selectedIndex ? 2.4 : 1} />; })}
      <Polygon points={fullCoordinates} fill="none" stroke={colors.border} strokeWidth={1} />
      <Polygon points={coordinates} fill={`${color}40`} stroke={color} strokeWidth={2} />
    </Svg>
    <View style={styles.radarLegend}>{points.map((point, index) => <Pressable key={`${point.label}-${index}`} onPress={() => setSelectedIndex(index)} style={({ pressed }) => [styles.radarLegendItem, { opacity: pressed ? 0.65 : index === selectedIndex ? 1 : 0.62, borderColor: index === selectedIndex ? color : colors.border }]}><Text style={[styles.radarLegendText, { color: index === selectedIndex ? color : colors.muted }]}>{point.label}: {Math.round(point.value)}</Text></Pressable>)}</View>
    <ChartFocus label={selected.label} value={selected.value} color={color} />
  </View>;
}

const styles = StyleSheet.create({
  lineLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: -3 },
  axisLabel: { fontSize: 9, lineHeight: 12, fontWeight: "700" },
  focusRow: { minHeight: 28, marginTop: 3, borderWidth: StyleSheet.hairlineWidth, borderRadius: 9, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 6 },
  focusDot: { width: 7, height: 7, borderRadius: 9 },
  focusLabel: { flex: 1, minWidth: 0, fontSize: 10, lineHeight: 13, fontWeight: "800" },
  focusValue: { fontSize: 11, lineHeight: 14, fontWeight: "900" },
  multiLegend: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 },
  multiLegendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 9 },
  donutWrap: { width: 146, minHeight: 176, position: "relative", alignItems: "center", justifyContent: "flex-start" },
  donutCenter: { position: "absolute", top: 45, alignItems: "center", justifyContent: "center", width: 86 },
  donutValue: { fontSize: 21, lineHeight: 25, fontWeight: "900" },
  donutLabel: { fontSize: 8, lineHeight: 11, letterSpacing: 0.6, fontWeight: "800", textAlign: "center" },
  radarWrap: { alignItems: "center", gap: 5 },
  radarLegend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, paddingHorizontal: 8 },
  radarLegendItem: { borderRadius: 7, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 6, paddingVertical: 3 },
  radarLegendText: { fontSize: 9, lineHeight: 12, fontWeight: "800" },
});
