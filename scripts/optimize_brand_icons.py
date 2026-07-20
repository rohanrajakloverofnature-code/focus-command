#!/usr/bin/env python3
"""Create compact native icon derivatives from the approved Focus Command crest."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path("/home/ubuntu/webdev-static-assets/focus-command-violet-command-crest.png")
TARGETS = {
    ROOT / "assets/images/icon.png": 1024,
    ROOT / "assets/images/splash-icon.png": 1024,
    ROOT / "assets/images/android-icon-foreground.png": 1024,
    ROOT / "assets/images/favicon.png": 512,
}


def main() -> None:
    original = Image.open(SOURCE).convert("RGB")
    for target, pixels in TARGETS.items():
        resized = original.resize((pixels, pixels), Image.Resampling.LANCZOS)
        # A 256-color optimized PNG retains the violet/gold crest detail while staying well
        # under mobile-project media limits.
        compact = resized.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
        compact.save(target, format="PNG", optimize=True)
        print(f"{target.relative_to(ROOT)}: {target.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
