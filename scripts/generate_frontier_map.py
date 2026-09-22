#!/usr/bin/env python3
"""Generate the fictional Focus Command frontier traced from the user's sketch."""
from __future__ import annotations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOUNDARY_OUT = ROOT / "components/fictional-boundary.ts"
MASK_OUT = ROOT / "lib/fictional-interior-mask.ts"
WIDTH, HEIGHT, CELL = 320, 380, 6

# A hand-traced fictional landform: broad upper basin, carved western inlets,
# a narrow waist, and a long southern peninsula. It is not geographic data.
OUTER = [
    (72, 22), (95, 10), (122, 8), (145, 15), (163, 28), (183, 34),
    (198, 46), (218, 48), (231, 60), (248, 58), (260, 72), (258, 91),
    (270, 106), (266, 125), (276, 143), (270, 160), (278, 178), (272, 194),
    (258, 207), (238, 216), (216, 225), (195, 232), (179, 240),
    (197, 237), (220, 230), (245, 226), (270, 224), (291, 231), (300, 242),
    (294, 253), (278, 257), (268, 269), (251, 275), (248, 291), (233, 300),
    (226, 316), (211, 323), (201, 339), (186, 346), (174, 360), (158, 353),
    (146, 365), (132, 357), (119, 360), (111, 346), (98, 338), (101, 322),
    (89, 311), (96, 296), (86, 282), (94, 267), (81, 255), (88, 240),
    (76, 229), (63, 224), (56, 211), (62, 198), (50, 190), (53, 176),
    (42, 165), (52, 153), (43, 140), (54, 129), (45, 116), (58, 106),
    (51, 93), (64, 84), (57, 70), (71, 64), (64, 50), (79, 45),
    (70, 34),
]


def smooth_path(points):
    """Create a soft, hand-drawn-looking SVG outline through polygon points."""
    midpoints = [((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) for a, b in zip(points, points[1:] + points[:1])]
    path = f"M{midpoints[-1][0]:.2f} {midpoints[-1][1]:.2f}"
    for point, midpoint in zip(points, midpoints):
        path += f" Q{point[0]:.2f} {point[1]:.2f} {midpoint[0]:.2f} {midpoint[1]:.2f}"
    return path + " Z"


def polygon_path(points):
    return "M" + " ".join(f"{x:.2f} {y:.2f}" for x, y in points) + " Z"


def point_in_ring(point, ring):
    x, y = point
    inside = False
    previous = len(ring) - 1
    for current, (cx, cy) in enumerate(ring):
        px, py = ring[previous]
        if ((cy > y) != (py > y)) and x < (px - cx) * (y - cy) / ((py - cy) or 1e-12) + cx:
            inside = not inside
        previous = current
    return inside


def main():
    boundary_path = smooth_path(OUTER)
    BOUNDARY_OUT.write_text(
        "// Original fictional battle-map silhouette traced from a user sketch.\n"
        "// It is not based on a real country or an existing game map.\n\n"
        f'export const FICTIONAL_BOUNDARY_VIEWBOX = "0 0 {WIDTH} {HEIGHT}";\n'
        f"export const FICTIONAL_BOUNDARY_PATH = `{boundary_path}`;\n"
        "export const FICTIONAL_BOUNDARY_RING_COUNT = 1;\n",
        encoding="utf-8",
    )
    cells = []
    for y in range(0, HEIGHT, CELL):
        for x in range(0, WIDTH, CELL):
            if point_in_ring((x + CELL / 2, y + CELL / 2), OUTER):
                cells.extend((x, y))
    MASK_OUT.write_text(
        "// Generated from the fictional Focus Command frontier silhouette.\n"
        "// No real-world geographic boundary is used.\n\n"
        f"export const FICTIONAL_INTERIOR_CELL_SIZE = {CELL};\n"
        f"export const FICTIONAL_INTERIOR_CELLS = new Uint16Array([{', '.join(map(str, cells))}]);\n"
        f"export const FICTIONAL_INTERIOR_CELL_COUNT = {len(cells) // 2};\n",
        encoding="utf-8",
    )
    print(f"Generated 1 ring and {len(cells) // 2} interior cells.")


if __name__ == "__main__":
    main()
