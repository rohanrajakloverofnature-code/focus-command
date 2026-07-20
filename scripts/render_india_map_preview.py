#!/usr/bin/env python3
"""Render the downloaded India GeoJSON boundary for visual validation."""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/map-data/india.simplified.geo.json"
OUTPUT = ROOT / "assets/map-data/india-boundary-preview.png"


def exterior_rings(geometry: dict):
    if geometry.get("type") == "Polygon":
        if geometry.get("coordinates"):
            yield geometry["coordinates"][0]
    elif geometry.get("type") == "MultiPolygon":
        for polygon in geometry.get("coordinates", []):
            if polygon:
                yield polygon[0]


def main() -> None:
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    figure, axis = plt.subplots(figsize=(4, 5.3), dpi=160)
    figure.patch.set_facecolor("#F6F3FF")
    axis.set_facecolor("#F6F3FF")
    for feature in data.get("features", []):
        for ring in exterior_rings(feature.get("geometry", {})):
            xs = [point[0] for point in ring]
            ys = [point[1] for point in ring]
            axis.fill(xs, ys, color="#7C3AED", alpha=0.82, edgecolor="#24123B", linewidth=0.8)
    axis.set_aspect("equal")
    axis.axis("off")
    axis.margins(0.06)
    figure.savefig(OUTPUT, facecolor=figure.get_facecolor(), bbox_inches="tight", pad_inches=0.05)
    print(OUTPUT)


if __name__ == "__main__":
    main()
