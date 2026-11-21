"""Rasterise public/brand SVGs into the PNG icons in public/icons (needs Playwright + Chrome)."""
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
BRAND = ROOT / "public/brand"
ICONS = ROOT / "public/icons"
JOBS = [  # (source svg, output png, pixel size)
    ("potclub-icon.svg", "icon-192.png", 192),
    ("potclub-icon.svg", "icon-512.png", 512),
    ("potclub-icon.svg", "apple-touch-icon.png", 180),
    ("potclub-icon-maskable.svg", "maskable-512.png", 512),
    ("potclub-mark.svg", "favicon-64.png", 64),
]


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        page = browser.new_page()
        for src, out, size in JOBS:
            page.set_viewport_size({"width": size, "height": size})
            svg = (BRAND / src).read_text()
            page.set_content(
                f"<html><body style='margin:0;background:transparent'>"
                f"<img style='display:block;width:{size}px;height:{size}px' src='data:image/svg+xml;base64,"
                f"{__import__('base64').b64encode(svg.encode()).decode()}'></body></html>"
            )
            page.wait_for_timeout(100)
            page.screenshot(path=str(ICONS / out), omit_background=True)
        browser.close()
    print("wrote", *[j[1] for j in JOBS])


if __name__ == "__main__":
    main()
