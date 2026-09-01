import { describe, expect, it } from "vitest";

import {
  PERSONAL_GRAPH_CHART_POINT_LIMIT,
  createDefaultPersonalGraphs,
  downsamplePersonalGraphPoints,
  getPersonalGraphPointsForRange,
  normalizePersonalGraphs,
  parsePersonalGraphDate,
  type PersonalGraph,
  type PersonalGraphPoint,
} from "../lib/personal-graphs";

const CREATED = "2026-09-02T09:00:00.000Z";

function graphWithPoints(): PersonalGraph {
  const graph = createDefaultPersonalGraphs(CREATED)[0];
  return {
    ...graph,
    title: "Exam preparation",
    xAxisLabel: "Practice month",
    yAxisLabel: "Score",
    datePrecision: "month",
    lines: [
      { id: "score", name: "Mock score", color: "#A78BFA" },
      { id: "mistakes", name: "Silly mistakes", color: "#49D17D" },
    ],
    points: [
      { id: "score_old", lineId: "score", xValue: "2021-08", xLabel: "2021-08", yValue: 40, createdAt: CREATED, updatedAt: CREATED },
      { id: "score_cross", lineId: "score", xValue: "2026-08", xLabel: "2026-08", yValue: 8, createdAt: CREATED, updatedAt: CREATED },
      { id: "mistakes_cross", lineId: "mistakes", xValue: "2026-08", xLabel: "2026-08", yValue: 8, createdAt: CREATED, updatedAt: CREATED },
      { id: "mistakes_recent", lineId: "mistakes", xValue: "2026-09", xLabel: "2026-09", yValue: 3, createdAt: CREATED, updatedAt: CREATED },
    ],
  };
}

describe("Personal Graphs", () => {
  it("accepts the selected exact date, month, or year format and rejects incompatible values", () => {
    expect(parsePersonalGraphDate("2026-09-02", "date")).toEqual({ xValue: "2026-09-02", xLabel: "2026-09-02" });
    expect(parsePersonalGraphDate("2026-09", "month")).toEqual({ xValue: "2026-09", xLabel: "2026-09" });
    expect(parsePersonalGraphDate("2026", "year")).toEqual({ xValue: "2026", xLabel: "2026" });
    expect(parsePersonalGraphDate("2026-09", "date")).toBeNull();
    expect(parsePersonalGraphDate("2026-13", "month")).toBeNull();
  });

  it("keeps three independent editable graph slots, up to four named lines, and valid user-entered points", () => {
    const defaults = createDefaultPersonalGraphs(CREATED);
    const graph = graphWithPoints();
    const normalized = normalizePersonalGraphs([{
      ...graph,
      lines: [...graph.lines, { id: "confidence", name: "Confidence", color: "#F4C95D" }, { id: "hours", name: "Revision hours", color: "#FFAA4C" }, { id: "extra", name: "Ignored", color: "#A78BFA" }],
    }], defaults);

    expect(normalized).toHaveLength(3);
    expect(normalized[0]).toMatchObject({ title: "Exam preparation", xAxisLabel: "Practice month", yAxisLabel: "Score", datePrecision: "month" });
    expect(normalized[0].lines.map((line) => line.name)).toEqual(["Mock score", "Silly mistakes", "Confidence", "Revision hours"]);
    expect(normalized[0].points.filter((point) => point.xValue === "2026-08")).toHaveLength(2);
    expect(normalized[1].points).toEqual([]);
  });

  it("keeps every saved five-year point while only filtering the displayed time range", () => {
    const graph = graphWithPoints();
    const fiveYearPoints = getPersonalGraphPointsForRange(graph, "5y", new Date("2026-09-02T12:00:00.000Z"));

    expect(fiveYearPoints.map((point) => point.id)).toEqual(["mistakes_cross", "score_cross", "mistakes_recent"]);
    expect(graph.points).toHaveLength(4);
    expect(getPersonalGraphPointsForRange(graph, "all")).toHaveLength(4);
  });

  it("keeps line intersections truthful and bounds only the render path for dense histories", () => {
    const graph = graphWithPoints();
    const crossing = graph.points.filter((point) => point.xValue === "2026-08");
    expect(crossing.map((point) => point.yValue)).toEqual([8, 8]);

    const dense = Array.from({ length: PERSONAL_GRAPH_CHART_POINT_LIMIT + 50 }, (_, index): PersonalGraphPoint => ({
      id: `point_${index}`,
      lineId: "score",
      xValue: `2026-09-${String((index % 28) + 1).padStart(2, "0")}`,
      xLabel: `2026-09-${String((index % 28) + 1).padStart(2, "0")}`,
      yValue: index,
      createdAt: CREATED,
      updatedAt: CREATED,
    }));
    const rendered = downsamplePersonalGraphPoints(dense);

    expect(rendered).toHaveLength(PERSONAL_GRAPH_CHART_POINT_LIMIT);
    expect(rendered[0]).toEqual(dense[0]);
    expect(rendered.at(-1)).toEqual(dense.at(-1));
    expect(dense).toHaveLength(PERSONAL_GRAPH_CHART_POINT_LIMIT + 50);
  });
});
