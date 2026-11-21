"""Rasterise the cinematic logo SVGs at 8K (7680x7680) without filter downsampling.

Chrome renders SVG filters into capped intermediate surfaces, so a single 7680px screenshot comes
out soft and seamed. Instead each SVG is rendered as a grid of overlapping tiles (viewBox crops at
full resolution) and stitched with Pillow. Filters use user-space coordinates, so noise and blurs
line up across tiles; the overlap margin hides edge effects.

  python3 scripts/brand/render_cinematic.py [outdir]
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "brand/source"
SIZE = 7680      # output pixels
GRID = 4         # 4x4 tiles of 1920px
MARGIN = 96      # overlap in pixels on each side of a tile


def render(page, svg_text: str, out: Path) -> None:
    vx, vy, vw, vh = map(float, re.search(r'viewBox="([^"]+)"', svg_text).group(1).split())
    tile = SIZE // GRID
    scale = vw / SIZE  # user units per pixel
    canvas = Image.new("RGB", (SIZE, SIZE))
    span = tile + 2 * MARGIN
    page.set_viewport_size({"width": span, "height": span})
    for row in range(GRID):
        for col in range(GRID):
            px0, py0 = col * tile - MARGIN, row * tile - MARGIN
            view = f"{vx + px0 * scale:g} {vy + py0 * scale:g} {span * scale:g} {span * scale:g}"
            doc = re.sub(r'viewBox="[^"]+"', f'viewBox="{view}"', svg_text, count=1)
            doc = re.sub(r'width="\d+" height="\d+"', f'width="{span}" height="{span}"', doc, count=1)
            page.set_content(f"<html><body style='margin:0;background:#000'>{doc}</body></html>")
            page.wait_for_timeout(50)
            shot = page.screenshot(type="png")
            img = Image.open(__import__("io").BytesIO(shot)).convert("RGB")
            canvas.paste(img.crop((MARGIN, MARGIN, MARGIN + tile, MARGIN + tile)), (col * tile, row * tile))
    canvas.save(out, optimize=True)
    print("wrote", out, canvas.size)


def main() -> None:
    outdir = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "brand-masters"
    outdir.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        page = browser.new_page()
        for name in ("potclub-cinematic", "potclub-cinematic-logo"):
            render(page, (SRC / f"{name}.svg").read_text(), outdir / f"{name}-8k.png")
        browser.close()


if __name__ == "__main__":
    main()
