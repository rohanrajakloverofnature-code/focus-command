from pathlib import Path
from PIL import Image

ROOT = Path("/home/ubuntu/rpg-focus-command")
ICON_FILES = [
    "assets/images/icon.png",
    "assets/images/splash-icon.png",
    "assets/images/favicon.png",
    "assets/images/android-icon-foreground.png",
]

for relative_path in ICON_FILES:
    path = ROOT / relative_path
    with Image.open(path) as source:
        image = source.convert("RGBA")
        target = 768 if path.name != "favicon.png" else 512
        image.thumbnail((target, target), Image.Resampling.LANCZOS)
        alpha = image.getchannel("A")
        rgb = Image.new("RGB", image.size, "#071018")
        rgb.paste(image, mask=alpha)
        rgb = rgb.quantize(colors=128, method=Image.Quantize.MEDIANCUT)
        alpha = alpha.resize(image.size, Image.Resampling.LANCZOS)
        optimized = rgb.convert("RGBA")
        optimized.putalpha(alpha)
        optimized.save(path, format="PNG", optimize=True, compress_level=9)
        print(f"{relative_path}: {path.stat().st_size} bytes, {optimized.size[0]}x{optimized.size[1]}")
