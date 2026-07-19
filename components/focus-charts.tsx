import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Line, Path, Polygon, Rect } from "react-native-svg";

import { useColors } from "@/hooks/use-colors";

export interface ChartPoint {
  label: string;
  value: number;
  color?: string;
}

export function LineTrendChart({
  points,
  color,
  secondaryPoints,
  secondaryColor,
  height = 132,
  accessibilityLabel,
}: {
  points: ChartPoint[];
  color: string;
  secondaryPoints?: ChartPoint[];
  secondaryColor?: string;
  height?: number;
  accessibilityLabel: string;
}) {
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

  const makePath = (series: ChartPoint[]) => series.map((point, index) => {
    const x = padding.left + (series.length <= 1 ? chartWidth / 2 : (index / (series.length - 1)) * chartWidth);
    const y = padding.top + chartHeight - ((point.value - minimum) / range) * chartHeight;
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");

  const labelIndexes = points.length <= 4 ? points.map((_, index) => index) : [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <View accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Svg width={width} height={height}>
        {[0, 0.5, 1].map((fraction) => {
          const y = padding.top + chartHeight * fraction;
          return <Line key={fraction} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={colors.border} strokeWidth={1} opacity={0.65} />;
        })}
        {points.length > 1 ? <Path d={makePath(points)} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /> : null}
        {secondaryPoints && secondaryPoints.length > 1 ? <Path d={makePath(secondaryPoints)} fill="none" stroke={secondaryColor ?? colors.success} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /> : null}
        {points.map((point, index) => {
          const x = padding.left + (points.length <= 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth);
          const y = padding.top + chartHeight - ((point.value - minimum) / range) * chartHeight;
          return <Circle key={`${point.label}-${index}`} cx={x} cy={y} r={3.5} fill={color} stroke={colors.surface} strokeWidth={2} />;
        })}
      </Svg>
      <View style={styles.lineLabels}>
        {labelIndexes.map((index) => <Text key={`${points[index].label}-${index}`} style={[styles.axisLabel, { color: colors.muted }]}>{points[index].label}</Text>)}
      </View>
    </View>
  );
}

export interface MultiLineSeries {
  id: string;
  label: string;
  color: string;
  points: ChartPoint[];
}

export function MultiLineTrendChart({
  series,
  height = 144,
  accessibilityLabel,
}: {
  series: MultiLineSeries[];
  height?: number;
  accessibilityLabel: string;
}) {
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
  const referencePoints = series[0]?.points ?? [];
  const makePath = (points: ChartPoint[]) => points.map((point, index) => {
    const x = padding.left + (points.length <= 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth);
    const y = padding.top + chartHeight - ((point.value - minimum) / range) * chartHeight;
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");

  return (
    <View accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Svg width={width} height={height}>
        {[0, 0.5, 1].map((fraction) => {
          const y = padding.top + chartHeight * fraction;
          return <Line key={fraction} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={colors.border} strokeWidth={1} opacity={0.65} />;
        })}
        {series.map((item) => item.points.length > 1 ? <Path key={item.id} d={makePath(item.points)} fill="none" stroke={item.color} strokeWidth={2.35} strokeLinecap="round" strokeLinejoin="round" /> : null)}
      </Svg>
      <View style={styles.multiLegend}>
        {series.map((item) => <View key={item.id} style={styles.multiLegendItem}><View style={[styles.legendDot, { backgroundColor: item.color }]} /><Text style={[styles.axisLabel, { color: colors.muted }]}>{item.label}</Text></View>)}
      </View>
      <View style={styles.lineLabels}>
        {(referencePoints.length <= 4 ? referencePoints.map((_, index) => index) : [0, Math.floor((referencePoints.length - 1) / 2), referencePoints.length - 1]).map((index) => <Text key={`${referencePoints[index].label}-${index}`} style={[styles.axisLabel, { color: colors.muted }]}>{referencePoints[index].label}</Text>)}
      </View>
    </View>
  );
}

export function BarsChart({
  points,
  color,
  height = 132,
  accessibilityLabel,
}: {
  points: ChartPoint[];
  color: string;
  height?: number;
  accessibilityLabel: string;
}) {
  const colors = useColors();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.max(240, windowWidth - 66);
  const chartHeight = height - 25;
  const maximum = Math.max(1, ...points.map((point) => point.value));
  const gap = points.length > 18 ? 2 : 4;
  const barWidth = Math.max(3, (width - gap * (points.length + 1)) / Math.max(1, points.length));
  const labelIndexes = points.length <= 4 ? points.map((_, index) => index) : [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <View accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Svg width={width} height={height}>
        <Line x1={0} y1={chartHeight} x2={width} y2={chartHeight} stroke={colors.border} strokeWidth={1} />
        {points.map((point, index) => {
          const barHeight = Math.max(2, (point.value / maximum) * (chartHeight - 8));
          const x = gap + index * (barWidth + gap);
          return <Rect key={`${point.label}-${index}`} x={x} y={chartHeight - barHeight} width={barWidth} height={barHeight} rx={Math.min(4, barWidth / 2)} fill={point.color ?? color} opacity={point.value ? 1 : 0.28} />;
        })}
      </Svg>
      <View style={styles.lineLabels}>
        {labelIndexes.map((index) => <Text key={`${points[index].label}-${index}`} style={[styles.axisLabel, { color: colors.muted }]}>{points[index].label}</Text>)}
      </View>
    </View>
  );
}

function polarToCartesian(center: number, radius: number, angle: number) {
  const angleInRadians = ((angle - 90) * Math.PI) / 180;
  return { x: center + radius * Math.cos(angleInRadians), y: center + radius * Math.sin(angleInRadians) };
}

function describeArc(center: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(center, radius, endAngle);
  const end = polarToCartesian(center, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [`M ${center} ${center}`, `L ${start.x} ${start.y}`, `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, "Z"].join(" ");
}

export function DonutChart({
  points,
  size = 146,
  centerLabel,
  centerValue,
  accessibilityLabel,
}: {
  points: ChartPoint[];
  size?: number;
  centerLabel: string;
  centerValue: string;
  accessibilityLabel: string;
}) {
  const colors = useColors();
  const total = points.reduce((sum, point) => sum + Math.max(0, point.value), 0);
  const radius = size / 2 - 8;
  const center = size / 2;
  let cursor = 0;
  const defaultColors = ["#39C6E8", "#49D17D", "#F4C95D", "#FFAA4C", "#C092FF", "#FF6B6B"];
  return (
    <View style={styles.donutWrap} accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} fill={colors.border} opacity={0.42} />
        {total > 0 ? points.map((point, index) => {
          const start = cursor;
          const span = (point.value / total) * 360;
          cursor += span;
          return <Path key={`${point.label}-${index}`} d={describeArc(center, radius, start + 1, start + Math.max(2, span - 1))} fill={point.color ?? defaultColors[index % defaultColors.length]} />;
        }) : null}
        <Circle cx={center} cy={center} r={radius * 0.6} fill={colors.surface} />
      </Svg>
      <View pointerEvents="none" style={styles.donutCenter}>
        <Text style={[styles.donutValue, { color: colors.foreground }]}>{centerValue}</Text>
        <Text style={[styles.donutLabel, { color: colors.muted }]}>{centerLabel}</Text>
      </View>
    </View>
  );
}

export function RadarChart({
  points,
  color,
  size = 176,
  accessibilityLabel,
}: {
  points: ChartPoint[];
  color: string;
  size?: number;
  accessibilityLabel: string;
}) {
  const colors = useColors();
  const maxValue = Math.max(1, ...points.map((point) => point.value));
  const center = size / 2;
  const radius = size / 2 - 24;
  const coordinates = points.map((point, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(1, points.length) - Math.PI / 2;
    const adjustedRadius = radius * (point.value / maxValue);
    return `${center + Math.cos(angle) * adjustedRadius},${center + Math.sin(angle) * adjustedRadius}`;
  }).join(" ");
  const fullCoordinates = points.map((_, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(1, points.length) - Math.PI / 2;
    return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
  }).join(" ");

  return (
    <View style={styles.radarWrap} accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Svg width={size} height={size}>
        {[0.33, 0.66, 1].map((fraction) => (
          <Polygon key={fraction} points={points.map((_, index) => {
            const angle = (Math.PI * 2 * index) / Math.max(1, points.length) - Math.PI / 2;
            return `${center + Math.cos(angle) * radius * fraction},${center + Math.sin(angle) * radius * fraction}`;
          }).join(" ")} fill="none" stroke={colors.border} strokeWidth={1} />
        ))}
        {points.map((_, index) => {
          const angle = (Math.PI * 2 * index) / Math.max(1, points.length) - Math.PI / 2;
          return <Line key={index} x1={center} y1={center} x2={center + Math.cos(angle) * radius} y2={center + Math.sin(angle) * radius} stroke={colors.border} strokeWidth={1} />;
        })}
        <Polygon points={fullCoordinates} fill="none" stroke={colors.border} strokeWidth={1} />
        <Polygon points={coordinates} fill={`${color}40`} stroke={color} strokeWidth={2} />
      </Svg>
      <View style={styles.radarLegend}>
        {points.slice(0, 4).map((point, index) => <Text key={`${point.label}-${index}`} style={[styles.radarLegendText, { color: colors.muted }]}>{point.label}: {Math.round(point.value)}</Text>)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lineLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: -4 },
  axisLabel: { fontSize: 9, lineHeight: 12, fontWeight: "700" },
  multiLegend: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 },
  multiLegendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 9 },
  donutWrap: { width: 146, height: 146, position: "relative", alignItems: "center", justifyContent: "center" },
  donutCenter: { position: "absolute", alignItems: "center", justifyContent: "center", width: 86 },
  donutValue: { fontSize: 21, lineHeight: 25, fontWeight: "900" },
  donutLabel: { fontSize: 8, lineHeight: 11, letterSpacing: 0.75, fontWeight: "800", textAlign: "center" },
  radarWrap: { alignItems: "center", gap: 4 },
  radarLegend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 7, paddingHorizontal: 8 },
  radarLegendText: { fontSize: 9, lineHeight: 12, fontWeight: "700" },
});
