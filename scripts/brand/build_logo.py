"""Builds the PotClub logo files (original artwork) into public/brand/.

  python3 scripts/brand/build_logo.py

Outputs
  potclub-mark.svg      square badge: pixel-art pot with coins in a retro window tile
  potclub-logo.svg      horizontal lockup: mark + "PotClub" wordmark
  potclub-wordmark.svg  wordmark only

The wordmark is Press Start 2P (SIL Open Font License) converted to vector paths, so the logo
renders identically everywhere without the font installed. Requires: pip install fonttools brotli; npm install (for @fontsource/press-start-2p)
"""

from __future__ import annotations

import io
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "brand"
FONT = ROOT / "node_modules/@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff2"

INK = "#141414"
PALETTE = {
    "K": INK,  # outline
    "M": "#FF2BD6",  # magenta rim
    "V": "#7B2FF7",  # violet pot
    "W": "#FFFFFF",  # highlight
    "Y": "#FFC233",  # coin face
    "O": "#FFA62B",  # coin edge
    "S": "#FFFFFF",  # sparkle
    "B": "#A0612F",  # dog fur
    "D": "#6B3A1A",  # dog ears
    "L": "#E9C29A",  # dog muzzle
    "T": "#FF7FA0",  # tongue
    "R": "#E0526F",  # tongue shade
}

# 24x24 pixel art. "." = transparent.
POT = [
    "........................",
    "........KKKKKKKK.....S..",
    "......KKBBBBBBBBKK..SSS.",
    ".....KDDBBBBBBBBDDK..S..",
    "....KDDDBKBBBBKBDDDK....",
    "....KDDDBBBLLBBBDDDK....",
    "....KDDKBBLKKLBBKDDK....",
    ".KBBKKKKBLLLLLLBKKKKBBK.",
    "..KKKKKKKKKTTKKKKKKKKK..",
    ".KMMMMMMMMKTTKMMMMMMMMK.",
    ".KMMMMMMMMKRTKMMMMMMMMK.",
    "..KKKKKKKKKKKKKKKKKKKK..",
    "..KVVWVVVVVVVVVVVVVVVK..",
    "KKKVVWVVVVVVVVVVVVVVVKKK",
    "K.KVVWVVVVVVVVVVVVVVVK.K",
    "KKKVVWVVVVVVVVVVVVVVVKKK",
    "..KVVVVVVVVVVVVVVVVVVK..",
    "..KVVVVVVVVVVVVVVVVVVK..",
    "...KVVVVVVVVVVVVVVVVK...",
    "....KVVVVVVVVVVVVVVK....",
    ".....KKKKKKKKKKKKKK.....",
    "......KK........KK......",
    "........................",
    "........................",
]


def pixel_rects(art: list[str], ox: float, oy: float, px: float) -> str:
    """Row-run-length rects (fewer nodes than one rect per pixel)."""
    out: list[str] = []
    for y, row in enumerate(art):
        x = 0
        while x < len(row):
            ch = row[x]
            if ch == ".":
                x += 1
                continue
            run = 1
            while x + run < len(row) and row[x + run] == ch:
                run += 1
            out.append(
                f'<rect x="{ox + x * px:g}" y="{oy + y * px:g}" width="{run * px:g}" height="{px:g}" fill="{PALETTE[ch]}"/>'
            )
            x += run
    return "".join(out)


def badge(x: float, y: float, size: float) -> str:
    """Lavender tile with thick ink outline and hard offset shadow, pot centred inside."""
    stroke = size * 0.06
    shadow = size * 0.07
    r = size * 0.16
    inner = size - stroke
    art_px = (size * 0.78) / 24
    art_off = (size - 24 * art_px) / 2
    return (
        f'<rect x="{x + shadow:g}" y="{y + shadow:g}" width="{size:g}" height="{size:g}" rx="{r:g}" fill="{INK}"/>'
        f'<rect x="{x + stroke / 2:g}" y="{y + stroke / 2:g}" width="{inner:g}" height="{inner:g}" rx="{r:g}" '
        f'fill="#E8DDFF" stroke="{INK}" stroke-width="{stroke:g}"/>'
        f'<g shape-rendering="crispEdges">{pixel_rects(POT, x + art_off, y + art_off, art_px)}</g>'
    )


def app_icon(size: float, art_scale: float) -> str:
    """Full-bleed square for OS icons: lavender field, pot centred. art_scale = share of the
    canvas the 24px art spans (smaller for maskable so it stays inside the safe zone)."""
    art_px = size * art_scale / 24
    off = (size - 24 * art_px) / 2
    return (
        f'<rect width="{size:g}" height="{size:g}" fill="#E8DDFF"/>'
        f'<g shape-rendering="crispEdges">{pixel_rects(POT, off, off, art_px)}</g>'
    )


def wordmark_paths(text: str, size: float, x: float, baseline: float, fill: str) -> tuple[str, float]:
    """Returns (svg path markup, advance width) for text set in Press Start 2P."""
    font = TTFont(io.BytesIO(FONT.read_bytes()))
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    scale = size / font["head"].unitsPerEm
    pen = SVGPathPen(glyphs)
    cursor = 0.0
    tracking = font["head"].unitsPerEm * 0.04
    for ch in text:
        name = cmap[ord(ch)]
        tpen = TransformPen(pen, (scale, 0, 0, -scale, x + cursor * scale, baseline))
        glyphs[name].draw(tpen)
        cursor += glyphs[name].width + tracking
    width = (cursor - tracking) * scale
    return f'<path d="{pen.getCommands()}" fill="{fill}"/>', width


def svg(width: float, height: float, body: str, title: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:g} {height:g}" width="{width:g}" height="{height:g}" '
        f'role="img" aria-labelledby="t"><title id="t">{title}</title>{body}</svg>\n'
    )


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    # Mark: 112 + shadow room
    (OUT / "potclub-mark.svg").write_text(svg(120, 120, badge(0, 0, 112), "PotClub"))

    # Wordmark with magenta offset shadow
    size = 56
    shadow_paths, w = wordmark_paths("PotClub", size, 6, 66, "#FF2BD6")
    main_paths, _ = wordmark_paths("PotClub", size, 0, 60, INK)
    (OUT / "potclub-wordmark.svg").write_text(svg(round(w + 10), 72, shadow_paths + main_paths, "PotClub"))

    # Horizontal lockup: mark + wordmark
    gap = 22
    shadow_paths, w = wordmark_paths("PotClub", size, 120 + gap + 6, 90, "#FF2BD6")
    main_paths, _ = wordmark_paths("PotClub", size, 120 + gap, 84, INK)
    body = badge(0, 0, 112) + shadow_paths + main_paths
    (OUT / "potclub-logo.svg").write_text(svg(round(120 + gap + w + 10), 120, body, "PotClub"))
    # OS icons (rasterised by scripts/brand/render_icons.py)
    (OUT / "potclub-icon.svg").write_text(svg(512, 512, app_icon(512, 0.78), "PotClub"))
    (OUT / "potclub-icon-maskable.svg").write_text(svg(512, 512, app_icon(512, 0.62), "PotClub"))
    print("wrote", *sorted(p.name for p in OUT.glob("potclub-*.svg")))


if __name__ == "__main__":
    main()
