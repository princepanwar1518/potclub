"""Visual QA helper: screenshots routes at several viewports with system Chrome and
reports console errors, horizontal overflow and page height.

Usage: python3 scripts/shoot.py <base_url> <out_dir> <path> [<path> ...]
"""
import json
import sys
from playwright.sync_api import sync_playwright

VIEWPORTS = {"mobile": (390, 844), "tablet": (768, 1024), "laptop": (1280, 800), "desktop": (1512, 900)}


def main() -> None:
    base, out, *paths = sys.argv[1:]
    report = []
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        for path in paths:
            for name, (w, h) in VIEWPORTS.items():
                page = browser.new_page(viewport={"width": w, "height": h})
                errors: list[str] = []
                page.on("console", lambda m, e=errors: e.append(m.text) if m.type in ("error", "warning") else None)
                page.on("pageerror", lambda exc, e=errors: e.append(str(exc)))
                page.goto(base + path, wait_until="networkidle")
                page.wait_for_timeout(900)
                metrics = page.evaluate(
                    "() => ({h: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, vw: innerWidth})"
                )
                slug = path.strip("/").replace("/", "_").replace("?", "_").replace("=", "-") or "home"
                page.screenshot(path=f"{out}/{slug}-{name}.png", full_page=True)
                report.append({"path": path, "viewport": name, "height": metrics["h"],
                               "overflowX": metrics["sw"] > metrics["vw"], "console": errors})
                page.close()
        browser.close()
    print(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
