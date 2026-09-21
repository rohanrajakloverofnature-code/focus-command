#!/usr/bin/env python3
"""Generate a fictional, non-geographic battle-map silhouette and interior mask."""
from __future__ import annotations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOUNDARY_OUT = ROOT / "components/fictional-boundary.ts"
MASK_OUT = ROOT / "lib/fictional-interior-mask.ts"
WIDTH, HEIGHT, CELL = 320, 380, 6

# Original fictional coastline: bays, peninsulas, and a southern island chain.
OUTER = [
    (108, 20), (130, 27), (146, 23), (164, 34), (183, 30), (196, 43),
    (218, 42), (230, 58), (250, 65), (246, 82), (268, 92), (260, 108),
    (280, 119), (271, 134), (292, 148), (279, 161), (297, 178), (285, 190),
    (303, 207), (290, 218), (299, 236), (281, 242), (285, 260), (267, 264),
    (271, 284), (251, 281), (247, 301), (230, 294), (221, 318), (205, 310),
    (194, 338), (180, 330), (169, 357), (153, 347), (140, 366), (126, 348),
    (111, 356), (103, 335), (88, 342), (84, 319), (66, 323), (68, 301),
    (48, 297), (57, 278), (38, 266), (51, 247), (31, 232), (47, 215),
    (28, 197), (48, 184), (34, 164), (54, 154), (42, 136), (63, 129),
    (55, 108), (77, 105), (68, 85), (91, 83), (84, 63), (105, 66),
    (100, 45), (119, 48),
]
ISLANDS = [
    [(236, 326), (248, 318), (257, 327), (251, 340), (239, 342), (232, 334)],
    [(267, 354), (275, 348), (282, 356), (278, 366), (269, 365)],
    [(46, 343), (53, 337), (60, 342), (57, 351), (49, 352)],
]

def path_for(ring):
    return "M" + " ".join(f"{x:.2f} {y:.2f}" for x, y in ring) + " Z"

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
    rings = [OUTER, *ISLANDS]
    path = " ".join(path_for(ring) for ring in rings)
    BOUNDARY_OUT.write_text(
        "// Original fictional battle-map silhouette created for Focus Command.\n"
        "// It is not based on a real country or an existing game map.\n\n"
        f'export const FICTIONAL_BOUNDARY_VIEWBOX = "0 0 {WIDTH} {HEIGHT}";\n'
        f"export const FICTIONAL_BOUNDARY_PATH = `{path}`;\n"
        f"export const FICTIONAL_BOUNDARY_RING_COUNT = {len(rings)};\n",
        encoding="utf-8",
    )
    cells = []
    for y in range(0, HEIGHT, CELL):
        for x in range(0, WIDTH, CELL):
            center = (x + CELL / 2, y + CELL / 2)
            if any(point_in_ring(center, ring) for ring in rings):
                cells.extend((x, y))
    MASK_OUT.write_text(
        "// Generated from the original fictional Focus Command battle-map silhouette.\n"
        "// No real-world geographic boundary is used.\n\n"
        f"export const FICTIONAL_INTERIOR_CELL_SIZE = {CELL};\n"
        f"export const FICTIONAL_INTERIOR_CELLS = new Uint16Array([{', '.join(map(str, cells))}]);\n"
        f"export const FICTIONAL_INTERIOR_CELL_COUNT = {len(cells) // 2};\n",
        encoding="utf-8",
    )
    print(f"Generated {len(rings)} rings and {len(cells) // 2} interior cells.")

if __name__ == "__main__":
    main()
