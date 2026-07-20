#!/usr/bin/env python3
"""Project the MIT-licensed simplified India GeoJSON into a React Native SVG path.

This script preserves every exterior polygon (including islands where present), applies a
Web-Mercator projection, then uses Ramer-Douglas-Peucker simplification so the mobile SVG
remains responsive. It outputs a TypeScript constant used by IndiaSubjectMap.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/map-data/india.simplified.geo.json"
OUTPUT = ROOT / "components/india-boundary.ts"
VIEW_WIDTH = 320.0
VIEW_HEIGHT = 380.0
PADDING = 15.0
SIMPLIFY_TOLERANCE = 0.62


def project(lon: float, lat: float) -> tuple[float, float]:
    x = math.radians(lon)
    bounded_lat = max(min(lat, 85.0), -85.0)
    y = math.log(math.tan(math.pi / 4.0 + math.radians(bounded_lat) / 2.0))
    return x, y


def distance_from_segment(point: tuple[float, float], start: tuple[float, float], end: tuple[float, float]) -> float:
    px, py = point
    ax, ay = start
    bx, by = end
    dx = bx - ax
    dy = by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    factor = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + factor * dx), py - (ay + factor * dy))


def simplify(points: list[tuple[float, float]], tolerance: float) -> list[tuple[float, float]]:
    if len(points) < 4:
        return points
    anchor_start = points[0]
    anchor_end = points[-1]
    farthest_distance = 0.0
    farthest_index = 0
    for index in range(1, len(points) - 1):
        distance = distance_from_segment(points[index], anchor_start, anchor_end)
        if distance > farthest_distance:
            farthest_distance = distance
            farthest_index = index
    if farthest_distance > tolerance:
        left = simplify(points[: farthest_index + 1], tolerance)
        right = simplify(points[farthest_index:], tolerance)
        return left[:-1] + right
    return [anchor_start, anchor_end]


def exterior_rings(geometry: dict) -> Iterable[list[list[float]]]:
    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates", [])
    if geometry_type == "Polygon":
        if coordinates:
            yield coordinates[0]
    elif geometry_type == "MultiPolygon":
        for polygon in coordinates:
            if polygon:
                yield polygon[0]
    elif geometry_type == "GeometryCollection":
        for member in geometry.get("geometries", []):
            yield from exterior_rings(member)


def main() -> None:
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    geometries = []
    if data.get("type") == "FeatureCollection":
        geometries = [feature.get("geometry", {}) for feature in data.get("features", [])]
    elif data.get("type") == "Feature":
        geometries = [data.get("geometry", {})]
    else:
        geometries = [data]

    raw_rings = [ring for geometry in geometries for ring in exterior_rings(geometry) if len(ring) >= 3]
    projected = [[project(point[0], point[1]) for point in ring] for ring in raw_rings]
    all_points = [point for ring in projected for point in ring]
    min_x = min(point[0] for point in all_points)
    max_x = max(point[0] for point in all_points)
    min_y = min(point[1] for point in all_points)
    max_y = max(point[1] for point in all_points)
    usable_width = VIEW_WIDTH - PADDING * 2
    usable_height = VIEW_HEIGHT - PADDING * 2
    scale = min(usable_width / (max_x - min_x), usable_height / (max_y - min_y))
    x_offset = (VIEW_WIDTH - (max_x - min_x) * scale) / 2.0
    y_offset = (VIEW_HEIGHT - (max_y - min_y) * scale) / 2.0

    transformed_rings: list[list[tuple[float, float]]] = []
    for ring in projected:
        transformed = [(x_offset + (x - min_x) * scale, y_offset + (max_y - y) * scale) for x, y in ring]
        if transformed[0] != transformed[-1]:
            transformed.append(transformed[0])
        simplified = simplify(transformed, SIMPLIFY_TOLERANCE)
        if len(simplified) >= 4:
            transformed_rings.append(simplified)

    path_parts = []
    for ring in transformed_rings:
        commands = [f"M{ring[0][0]:.2f} {ring[0][1]:.2f}"]
        commands.extend(f"L{x:.2f} {y:.2f}" for x, y in ring[1:])
        commands.append("Z")
        path_parts.append(" ".join(commands))
    path = " ".join(path_parts)
    anchors = {
        "north": (76.6, 33.1),
        "northwest": (73.7, 28.6),
        "north_central": (78.5, 29.0),
        "central": (78.4, 24.0),
        "west": (72.6, 22.0),
        "midwest": (75.5, 19.0),
        "east": (85.4, 23.7),
        "northeast": (93.0, 26.8),
        "south_central": (78.7, 17.0),
        "southwest": (75.7, 14.0),
        "southeast": (79.7, 13.0),
        "south": (78.4, 10.1),
    }
    anchor_lines = []
    for name, (lon, lat) in anchors.items():
        x, y = project(lon, lat)
        anchor_lines.append(f'  {name}: {{ x: {x_offset + (x - min_x) * scale:.2f}, y: {y_offset + (max_y - y) * scale:.2f} }},')
    output = f'''// Generated by scripts/prepare_india_map.py from the MIT-licensed\n// nswamy14/geoJson india.simplified.geo.json source. See map-data-attribution.md.\n\nexport const INDIA_BOUNDARY_VIEWBOX = "0 0 {int(VIEW_WIDTH)} {int(VIEW_HEIGHT)}";\nexport const INDIA_BOUNDARY_PATH = `{path}`;\nexport const INDIA_BOUNDARY_RING_COUNT = {len(transformed_rings)};\nexport const INDIA_MAP_ANCHORS = {{\n{chr(10).join(anchor_lines)}\n}} as const;\n'''
    OUTPUT.write_text(output, encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)} with {len(transformed_rings)} polygon rings and {sum(len(ring) for ring in transformed_rings)} simplified points.")


if __name__ == "__main__":
    main()
