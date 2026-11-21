"""Builds the PotClub logo files (original artwork) into public/brand/.

  python3 scripts/brand/build_logo.py

Outputs
  potclub-mark.svg            square badge: cartoon dog peeking out of a pot, in a retro tile
  potclub-logo.svg            horizontal lockup: mark + "PotClub" wordmark
  potclub-wordmark.svg        wordmark only
  potclub-icon.svg            full-bleed square for OS icons (rasterised by render_icons.py)
  potclub-icon-maskable.svg   same, art shrunk into the maskable safe zone

The artwork is smooth vector illustration (scales to any resolution). The wordmark is Fredoka
Bold (SIL Open Font License) converted to vector paths, so it renders identically everywhere
without the font installed. Requires: pip install fonttools brotli; npm install (@fontsource/fredoka).
"""

from __future__ import annotations

import io
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "brand"
FONT = ROOT / "node_modules/@fontsource/fredoka/files/fredoka-latin-700-normal.woff2"

INK = "#141414"
LAVENDER = "#E8DDFF"
MAGENTA = "#FF2BD6"

# Shared gradients. Each output SVG embeds this once (ids are file-local).
DEFS = """<defs>
<linearGradient id="potBody" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#A46BFF"/><stop offset=".55" stop-color="#7B2FF7"/><stop offset="1" stop-color="#4B0FB0"/>
</linearGradient>
<linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#FF7BE6"/><stop offset=".5" stop-color="#FF2BD6"/><stop offset="1" stop-color="#C4009F"/>
</linearGradient>
<radialGradient id="fur" cx=".42" cy=".35" r=".75">
  <stop offset="0" stop-color="#C98546"/><stop offset=".7" stop-color="#A0612F"/><stop offset="1" stop-color="#7E4520"/>
</radialGradient>
<linearGradient id="ear" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#7A4320"/><stop offset="1" stop-color="#55290F"/>
</linearGradient>
<linearGradient id="tongue" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#FF9DB6"/><stop offset="1" stop-color="#FF5E86"/>
</linearGradient>
<radialGradient id="glow" cx=".5" cy=".5" r=".5">
  <stop offset="0" stop-color="#FFFFFF" stop-opacity=".85"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
</radialGradient>
</defs>"""


def art() -> str:
    """Dog-in-pot illustration on a 100x100 canvas (painter's order: back to front)."""
    s = f'stroke="{INK}" stroke-linejoin="round" stroke-linecap="round"'
    return f"""
<ellipse cx="50" cy="40" rx="34" ry="26" fill="url(#glow)"/>
<!-- pot body + handles + feet -->
<path d="M14 58 h-5 a6 6 0 0 0 0 12 h6" fill="none" {s} stroke-width="3.2"/>
<path d="M86 58 h5 a6 6 0 0 1 0 12 h-6" fill="none" {s} stroke-width="3.2"/>
<rect x="29" y="84" width="11" height="8" rx="3" fill="{INK}"/>
<rect x="60" y="84" width="11" height="8" rx="3" fill="{INK}"/>
<path d="M14 52 C14 78 28 90 50 90 C72 90 86 78 86 52 Z" fill="url(#potBody)" {s} stroke-width="3.2"/>
<path d="M22 60 C22 72 28 80 36 84" fill="none" stroke="#FFFFFF" stroke-opacity=".75" stroke-width="3.5" stroke-linecap="round"/>
<circle cx="23" cy="56" r="1.8" fill="#FFFFFF" fill-opacity=".8"/>
<!-- dog: ears, head, face (rises out of the pot, cut off by the rim) -->
<path d="M33 16 C22 14 16 24 18 36 C19 44 23 50 28 49 C33 48 34 40 35 32 Z" fill="url(#ear)" {s} stroke-width="2.6"/>
<path d="M67 16 C78 14 84 24 82 36 C81 44 77 50 72 49 C67 48 66 40 65 32 Z" fill="url(#ear)" {s} stroke-width="2.6"/>
<path d="M28 50 C27 30 36 13 50 13 C64 13 73 30 72 50 Z" fill="url(#fur)" {s} stroke-width="2.6"/>
<path d="M45 14.5 C47 20 53 20 55 14.5" fill="#E9C29A" fill-opacity=".55"/>
<ellipse cx="50" cy="38" rx="12.5" ry="9" fill="#F3D3AE" {s} stroke-width="2"/>
<ellipse cx="40.5" cy="27" rx="3.1" ry="3.7" fill="{INK}"/>
<ellipse cx="59.5" cy="27" rx="3.1" ry="3.7" fill="{INK}"/>
<circle cx="41.6" cy="25.6" r="1.2" fill="#FFFFFF"/>
<circle cx="60.6" cy="25.6" r="1.2" fill="#FFFFFF"/>
<path d="M36.5 21 Q40.5 18.6 44 20.4" fill="none" stroke="#5A2E12" stroke-width="1.6" stroke-linecap="round"/>
<path d="M63.5 21 Q59.5 18.6 56 20.4" fill="none" stroke="#5A2E12" stroke-width="1.6" stroke-linecap="round"/>
<ellipse cx="34.5" cy="35" rx="3.2" ry="2" fill="#FF7FA0" fill-opacity=".55"/>
<ellipse cx="65.5" cy="35" rx="3.2" ry="2" fill="#FF7FA0" fill-opacity=".55"/>
<path d="M45 32.5 C45 30 55 30 55 32.5 C55 35.5 52 37 50 37 C48 37 45 35.5 45 32.5 Z" fill="{INK}"/>
<ellipse cx="48" cy="31.8" rx="1.8" ry=".9" fill="#FFFFFF" fill-opacity=".8"/>
<path d="M50 37 V40" {s} stroke-width="1.8" fill="none"/>
<path d="M42.5 40 Q46.5 44.5 50 40.5 Q53.5 44.5 57.5 40" {s} stroke-width="1.8" fill="none"/>
<!-- rim -->
<rect x="9" y="44" width="82" height="13" rx="6.5" fill="url(#rim)" {s} stroke-width="3.2"/>
<path d="M16 48 H38" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="2.2" stroke-linecap="round"/>
<!-- tongue hanging over the rim -->
<path d="M44.5 41.5 C44.5 41.5 55.5 41.5 55.5 41.5 L55.5 56 C55.5 61.5 52.5 64 50 64 C47.5 64 44.5 61.5 44.5 56 Z" fill="url(#tongue)" {s} stroke-width="2.2"/>
<path d="M50 44 V57" stroke="#D9416A" stroke-width="1.6" stroke-linecap="round"/>
<!-- paws on the rim -->
<g {s} stroke-width="2.2">
  <path d="M19 51 C19 44.5 23 42 27.5 42 C32 42 35 44.5 35 49 C35 52 33 53.5 27 53.5 C21 53.5 19 53 19 51 Z" fill="url(#fur)"/>
  <path d="M81 51 C81 44.5 77 42 72.5 42 C68 42 65 44.5 65 49 C65 52 67 53.5 73 53.5 C79 53.5 81 53 81 51 Z" fill="url(#fur)"/>
  <path d="M24.5 48.5 V52.5 M29.5 48.5 V52.5 M70.5 48.5 V52.5 M75.5 48.5 V52.5" fill="none" stroke-width="1.5"/>
</g>
<!-- sparkle -->
<path d="M86 10 Q87.4 16.6 94 18 Q87.4 19.4 86 26 Q84.6 19.4 78 18 Q84.6 16.6 86 10 Z" fill="#FFC233" {s} stroke-width="1.8"/>
<circle cx="13" cy="20" r="2.2" fill="#FFFFFF" {s} stroke-width="1.2"/>
"""


def placed_art(x: float, y: float, size: float) -> str:
    return f'<g transform="translate({x:g} {y:g}) scale({size / 100:g})">{art()}</g>'


def badge(x: float, y: float, size: float) -> str:
    """Lavender tile with thick ink outline and hard offset shadow, illustration inside."""
    stroke = size * 0.06
    shadow = size * 0.07
    r = size * 0.16
    inner = size - stroke
    pad = size * 0.06
    return (
        f'<rect x="{x + shadow:g}" y="{y + shadow:g}" width="{size:g}" height="{size:g}" rx="{r:g}" fill="{INK}"/>'
        f'<rect x="{x + stroke / 2:g}" y="{y + stroke / 2:g}" width="{inner:g}" height="{inner:g}" rx="{r:g}" '
        f'fill="{LAVENDER}" stroke="{INK}" stroke-width="{stroke:g}"/>'
        + placed_art(x + pad, y + pad, size - 2 * pad)
    )


def app_icon(size: float, art_scale: float) -> str:
    """Full-bleed square for OS icons. art_scale = share of the canvas the art spans."""
    a = size * art_scale
    off = (size - a) / 2
    return f'<rect width="{size:g}" height="{size:g}" fill="{LAVENDER}"/>' + placed_art(off, off, a)


def wordmark_paths(text: str, size: float, x: float, baseline: float, fill: str, stroke: str | None = None) -> tuple[str, float]:
    """Returns (svg path markup, advance width) for text set in Fredoka Bold."""
    font = TTFont(io.BytesIO(FONT.read_bytes()))
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    scale = size / font["head"].unitsPerEm
    pen = SVGPathPen(glyphs)
    cursor = 0.0
    tracking = font["head"].unitsPerEm * 0.01
    for ch in text:
        name = cmap[ord(ch)]
        glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x + cursor * scale, baseline)))
        cursor += glyphs[name].width + tracking
    width = (cursor - tracking) * scale
    extra = f' stroke="{stroke}" stroke-width="{size * 0.06:g}" stroke-linejoin="round" paint-order="stroke"' if stroke else ""
    return f'<path d="{pen.getCommands()}" fill="{fill}"{extra}/>', width


def wordmark(x: float, baseline: float, size: float) -> tuple[str, float]:
    """Ink letters over a hard magenta offset shadow (matches the UI's offset-shadow style)."""
    off = size * 0.07
    shadow, w = wordmark_paths("PotClub", size, x + off, baseline + off, MAGENTA, MAGENTA)
    main, _ = wordmark_paths("PotClub", size, x, baseline, INK)
    return shadow + main, w + off


def svg(width: float, height: float, body: str, title: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:g} {height:g}" width="{width:g}" height="{height:g}" '
        f'role="img" aria-labelledby="t"><title id="t">{title}</title>{DEFS}{body}</svg>\n'
    )


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    (OUT / "potclub-mark.svg").write_text(svg(120, 120, badge(0, 0, 112), "PotClub"))

    size = 64
    body, w = wordmark(4, 56, size)
    (OUT / "potclub-wordmark.svg").write_text(svg(round(w + 12), 72, body, "PotClub"))

    gap = 22
    body, w = wordmark(120 + gap, 82, size)
    (OUT / "potclub-logo.svg").write_text(svg(round(120 + gap + w + 10), 120, badge(0, 0, 112) + body, "PotClub"))

    (OUT / "potclub-icon.svg").write_text(svg(512, 512, app_icon(512, 0.8), "PotClub"))
    (OUT / "potclub-icon-maskable.svg").write_text(svg(512, 512, app_icon(512, 0.66), "PotClub"))
    print("wrote", *sorted(p.name for p in OUT.glob("potclub-*.svg")))


if __name__ == "__main__":
    main()
