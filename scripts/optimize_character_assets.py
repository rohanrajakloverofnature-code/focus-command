from pathlib import Path
from PIL import Image

SOURCE_DIR = Path("/home/ubuntu/webdev-static-assets")
DEST_DIR = Path("/home/ubuntu/rpg-focus-command/assets/images/characters")
DEST_DIR.mkdir(parents=True, exist_ok=True)

for tier in ("recruit", "officer", "vanguard", "ascendant"):
    source = SOURCE_DIR / f"focus-character-{tier}.png"
    destination = DEST_DIR / f"{tier}.jpg"
    image = Image.open(source).convert("RGB")
    image.thumbnail((560, 560), Image.Resampling.LANCZOS)
    image.save(destination, "JPEG", quality=84, optimize=True, progressive=True)
    print(f"{tier}: {destination.stat().st_size} bytes")
