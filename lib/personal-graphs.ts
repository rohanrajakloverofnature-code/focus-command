export const PERSONAL_GRAPH_MAX_LINES = 4;
export const PERSONAL_GRAPH_MAX_POINTS_PER_LINE = 2_400;
export const PERSONAL_GRAPH_CHART_POINT_LIMIT = 240;

export const PERSONAL_GRAPH_COLORS = ["#A78BFA", "#49D17D", "#F4C95D", "#FFAA4C"] as const;
export type PersonalGraphColor = (typeof PERSONAL_GRAPH_COLORS)[number];
export type PersonalGraphDatePrecision = "date" | "month" | "year";
export type PersonalGraphRange = "30d" | "90d" | "1y" | "5y" | "all";

export interface PersonalGraphLine {
  id: string;
  name: string;
  color: PersonalGraphColor;
}

export interface PersonalGraphPoint {
  id: string;
  lineId: string;
  /** Canonical sortable value: YYYY-MM-DD, YYYY-MM, or YYYY. */
  xValue: string;
  /** Human-readable, user-selected calendar precision. */
  xLabel: string;
  yValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalGraph {
  id: string;
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  datePrecision: PersonalGraphDatePrecision;
  enabled: boolean;
  lines: PersonalGraphLine[];
  points: PersonalGraphPoint[];
  createdAt: string;
  updatedAt: string;
}

export interface PersonalGraphPointDraft {
  lineId: string;
  xValue: string;
  yValue: number;
}

export function createDefaultPersonalGraphs(createdAt: string): PersonalGraph[] {
  return ["Growth Signals", "Focus Signals", "Custom Signals"].map((title, index) => ({
    id: `personal_graph_${index + 1}`,
    title,
    xAxisLabel: "Date",
    yAxisLabel: "Value",
    datePrecision: "date" as const,
    enabled: true,
    lines: [],
    points: [],
    createdAt,
    updatedAt: createdAt,
  }));
}

export function parsePersonalGraphDate(value: string, precision: PersonalGraphDatePrecision): { xValue: string; xLabel: string } | null {
  const trimmed = value.trim();
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const monthPattern = /^\d{4}-\d{2}$/;
  const yearPattern = /^\d{4}$/;
  if (precision === "date") {
    if (!datePattern.test(trimmed) || Number.isNaN(Date.parse(`${trimmed}T12:00:00Z`))) return null;
    return { xValue: trimmed, xLabel: trimmed };
  }
  if (precision === "month") {
    if (!monthPattern.test(trimmed)) return null;
    const month = Number(trimmed.slice(5));
    if (month < 1 || month > 12) return null;
    return { xValue: trimmed, xLabel: trimmed };
  }
  if (!yearPattern.test(trimmed)) return null;
  const year = Number(trimmed);
  if (year < 1 || year > 9999) return null;
  return { xValue: trimmed, xLabel: trimmed };
}

export function normalizePersonalGraphs(input: unknown, defaults: PersonalGraph[]): PersonalGraph[] {
  if (!Array.isArray(input)) return defaults;
  const normalized = input.slice(0, 3).flatMap((value, index) => {
    if (!value || typeof value !== "object") return [];
    const graph = value as Partial<PersonalGraph>;
    if (typeof graph.id !== "string" || !graph.id) return [];
    const precision: PersonalGraphDatePrecision = graph.datePrecision === "month" || graph.datePrecision === "year" ? graph.datePrecision : "date";
    const lines = Array.isArray(graph.lines) ? graph.lines.slice(0, PERSONAL_GRAPH_MAX_LINES).flatMap((line, lineIndex) => {
      if (!line || typeof line !== "object") return [];
      const candidate = line as Partial<PersonalGraphLine>;
      if (typeof candidate.id !== "string" || !candidate.id) return [];
      return [{
        id: candidate.id,
        name: typeof candidate.name === "string" && candidate.name.trim() ? candidate.name.trim().slice(0, 56) : `Line ${lineIndex + 1}`,
        color: PERSONAL_GRAPH_COLORS.includes(candidate.color as PersonalGraphColor) ? candidate.color as PersonalGraphColor : PERSONAL_GRAPH_COLORS[lineIndex % PERSONAL_GRAPH_COLORS.length],
      }];
    }) : [];
    const knownLineIds = new Set(lines.map((line) => line.id));
    const points = Array.isArray(graph.points) ? graph.points.slice(0, PERSONAL_GRAPH_MAX_POINTS_PER_LINE * PERSONAL_GRAPH_MAX_LINES).flatMap((point) => {
      if (!point || typeof point !== "object") return [];
      const candidate = point as Partial<PersonalGraphPoint>;
      if (typeof candidate.id !== "string" || !candidate.id || typeof candidate.lineId !== "string" || !knownLineIds.has(candidate.lineId) || !Number.isFinite(candidate.yValue)) return [];
      const parsed = typeof candidate.xValue === "string" ? parsePersonalGraphDate(candidate.xValue, precision) : null;
      if (!parsed) return [];
      return [{
        id: candidate.id,
        lineId: candidate.lineId,
        xValue: parsed.xValue,
        xLabel: typeof candidate.xLabel === "string" && candidate.xLabel ? candidate.xLabel.slice(0, 24) : parsed.xLabel,
        yValue: Number(candidate.yValue),
        createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : new Date(0).toISOString(),
        updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date(0).toISOString(),
      }];
    }) : [];
    const pointKeys = new Set<string>();
    const uniquePoints = points.filter((point) => {
      const key = `${point.lineId}:${point.xValue}`;
      if (pointKeys.has(key)) return false;
      pointKeys.add(key);
      return true;
    });
    const fallback = defaults[index] ?? defaults[0];
    return [{
      id: graph.id,
      title: typeof graph.title === "string" && graph.title.trim() ? graph.title.trim().slice(0, 64) : fallback.title,
      xAxisLabel: typeof graph.xAxisLabel === "string" && graph.xAxisLabel.trim() ? graph.xAxisLabel.trim().slice(0, 40) : "Date",
      yAxisLabel: typeof graph.yAxisLabel === "string" && graph.yAxisLabel.trim() ? graph.yAxisLabel.trim().slice(0, 40) : "Value",
      datePrecision: precision,
      enabled: graph.enabled !== false,
      lines,
      points: uniquePoints,
      createdAt: typeof graph.createdAt === "string" ? graph.createdAt : fallback.createdAt,
      updatedAt: typeof graph.updatedAt === "string" ? graph.updatedAt : fallback.updatedAt,
    }];
  });
  const byId = new Map(normalized.map((graph) => [graph.id, graph]));
  return defaults.map((fallback) => byId.get(fallback.id) ?? fallback);
}

function rangeStart(range: PersonalGraphRange, end: Date) {
  if (range === "all") return null;
  const date = new Date(end);
  if (range === "30d") date.setDate(date.getDate() - 30);
  if (range === "90d") date.setDate(date.getDate() - 90);
  if (range === "1y") date.setFullYear(date.getFullYear() - 1);
  if (range === "5y") date.setFullYear(date.getFullYear() - 5);
  return date;
}

function compareToRangeStart(xValue: string, precision: PersonalGraphDatePrecision, start: Date) {
  const comparable = precision === "date" ? `${xValue}T00:00:00Z` : precision === "month" ? `${xValue}-01T00:00:00Z` : `${xValue}-01-01T00:00:00Z`;
  return Date.parse(comparable) >= start.getTime();
}

export function getPersonalGraphPointsForRange(graph: PersonalGraph, range: PersonalGraphRange, now = new Date()): PersonalGraphPoint[] {
  const start = rangeStart(range, now);
  return graph.points
    .filter((point) => !start || compareToRangeStart(point.xValue, graph.datePrecision, start))
    .slice()
    .sort((left, right) => left.xValue.localeCompare(right.xValue) || left.lineId.localeCompare(right.lineId));
}

/** Keeps all stored points intact; only the rendered SVG path is bounded. */
export function downsamplePersonalGraphPoints(points: PersonalGraphPoint[], limit = PERSONAL_GRAPH_CHART_POINT_LIMIT): PersonalGraphPoint[] {
  if (points.length <= limit) return points;
  const result: PersonalGraphPoint[] = [];
  for (let index = 0; index < limit; index += 1) {
    const sourceIndex = Math.round((index * (points.length - 1)) / Math.max(1, limit - 1));
    result.push(points[sourceIndex]);
  }
  return result;
}
