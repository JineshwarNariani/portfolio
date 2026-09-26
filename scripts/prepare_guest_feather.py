"""
Prepare the guestbook feather image for the web.

    .venv/bin/pip install pillow
    .venv/bin/python scripts/prepare_guest_feather.py [source.png]

Reads  feather.png (transparent PNG artwork; default: repo root)
Writes public/guestbook/feather.webp — cropped to its visible bounds and
       scaled for crisp display at ~100px tall on 3× screens.
Prints the aspect ratio to paste into components/guestbook/GuestFeather.tsx.
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
src = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "feather.png"
out = ROOT / "public" / "guestbook" / "feather.webp"

im = Image.open(src).convert("RGBA")
# Crop to where the artwork is actually visible (ignores near-invisible glow).
bbox = im.getchannel("A").point(lambda v: 255 if v > 6 else 0).getbbox()
im = im.crop(bbox)
h = 320
im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
out.parent.mkdir(parents=True, exist_ok=True)
im.save(out, "WEBP", quality=88, method=6)
print(f"wrote {out.relative_to(ROOT)}: {im.width}x{im.height}, {out.stat().st_size // 1024} KB, aspect {im.width / im.height:.4f}")
