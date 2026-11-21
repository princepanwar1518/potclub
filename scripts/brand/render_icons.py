"""Rasterise the cinematic logo into the app's PNG/WebP icons (needs Playwright + Chrome + Pillow).

Renders brand/source SVGs at 1024px (filters are crisp at this size) and downsamples with
Lanczos for each target. The 8K masters come from render_cinematic.py and are not committed.
"""
import io
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "brand/source"
ICONS = ROOT / "public/icons"
BRAND = ROOT / "public/brand"


def shot(page, name: str, px: int = 1024) -> Image.Image:
    svg = (SRC / name).read_text().replace('width="1000" height="1000"', f'width="{px}" height="{px}"', 1)
    page.set_viewport_size({"width": px, "height": px})
    page.set_content(f"<html><body style='margin:0'>{svg}</body></html>")
    page.wait_for_timeout(150)
    return Image.open(io.BytesIO(page.screenshot(type="png"))).convert("RGB")


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        page = browser.new_page()
        scene = shot(page, "potclub-cinematic.svg")
        maskable = shot(page, "potclub-cinematic-maskable.svg")
        browser.close()

    def save(img: Image.Image, size: int, path: Path, **kw) -> None:
        img.resize((size, size), Image.LANCZOS).save(path, **kw)

    save(scene, 512, ICONS / "icon-512.png", optimize=True)
    save(scene, 192, ICONS / "icon-192.png", optimize=True)
    save(scene, 180, ICONS / "apple-touch-icon.png", optimize=True)
    save(maskable, 512, ICONS / "maskable-512.png", optimize=True)
    # Favicon: tighter crop on the dog so it reads at tab size.
    scene.crop((150, 150, 874, 874)).resize((64, 64), Image.LANCZOS).save(ICONS / "favicon-64.png", optimize=True)
    # Header mark (shown at 36px; 144px covers 4x screens) + a share/hero size.
    save(scene, 144, BRAND / "potclub-mark.webp", quality=90)
    save(scene, 1024, BRAND / "potclub-cinematic-1024.webp", quality=88)
    print("wrote icons + brand/potclub-mark.webp + brand/potclub-cinematic-1024.webp")


if __name__ == "__main__":
    main()
