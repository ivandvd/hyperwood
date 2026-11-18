"""Builds the horizontal lockup the site shows (src/assets/brand/hyperwood-lockup-neon.svg).

The brand kit's lockup files carry a wordmark traced from a picture: its letters wobble and are unevenly spaced
(the w touches the o). This lockup keeps the kit's symbol as it is and outlines the word from the kit's
typeface, Manrope ExtraBold: shaped by HarfBuzz (the font's own kerning) with the letters drawn 0.02 em closer
together, and placed as the kit places its word: capitals 80.8 of the lockup's 113.8 tall, the baseline 84.1
down, the first letter 0.49 of the symbol's height clear of the symbol. Every curve is the font's own.

    python scripts/brand/lockup.py <brand kit folder> [out.svg] [tracking in em] [colour]

The kit folder is the brand kit's site (the hbrand repository): its assets/fonts/Manrope-ExtraBold.ttf and
assets/logos/svg/hyperwood-symbol-neon.svg are read. Needs fontTools and uharfbuzz (pip install fonttools
uharfbuzz)."""
import re
import sys
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

kit = Path(sys.argv[1])
out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parents[2] / 'src/assets/brand/hyperwood-lockup-neon.svg'
track = float(sys.argv[3]) if len(sys.argv) > 3 else -0.02
fill = sys.argv[4] if len(sys.argv) > 4 else '#CCFF00'
FONT = kit / 'assets/fonts/Manrope-ExtraBold.ttf'
SYMBOL = kit / 'assets/logos/svg/hyperwood-symbol-neon.svg'
WORD = 'Hyperwood'

# the kit's lockup (hyperwood-horizontal-*.svg): its height is the symbol's, at this scale of the symbol's file
HEIGHT = 113.79672897196262
SYMBOL_SCALE = 0.5957943925233645
CAP = 80.8
BASELINE = 84.1
GAP = 0.49 * HEIGHT


def number(v: float) -> str:
    return ('%.2f' % v).rstrip('0').rstrip('.')


font = TTFont(FONT)
glyphs = font.getGlyphSet()
order = font.getGlyphOrder()
upm = font['head'].unitsPerEm
scale = CAP / font['OS/2'].sCapHeight

buf = hb.Buffer()
buf.add_str(WORD)
buf.guess_segment_properties()
hb.shape(hb.Font(hb.Face(hb.Blob.from_file_path(str(FONT)))), buf, {'kern': True, 'liga': False})

# each glyph at its pen position (font units), and the ink's left and right edges
placed = []
pen = 0.0
left = right = None
for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
    name = order[info.codepoint]
    bounds = BoundsPen(glyphs)
    glyphs[name].draw(bounds)
    x = pen + pos.x_offset
    left = x + bounds.bounds[0] if left is None else left
    right = x + bounds.bounds[2]
    placed.append((name, x))
    pen += pos.x_advance + track * upm

# the symbol, as the kit has it, and its right edge in the lockup
symbol = re.search(r' d="([^"]+)"', SYMBOL.read_text(encoding='utf8')).group(1)
symbol_right = max(float(v) for v in re.findall(r'-?\d+(?:\.\d+)?', symbol)[0::2]) * SYMBOL_SCALE

shift = symbol_right + GAP - left * scale
word = SVGPathPen(glyphs, ntos=number)
for name, x in placed:
    glyphs[name].draw(TransformPen(word, (scale, 0, 0, -scale, shift + x * scale, BASELINE)))
width = shift + right * scale

out.write_text(
    '<svg xmlns="http://www.w3.org/2000/svg" width="%s" height="%s" viewBox="0 0 %s %s">\n'
    '<!-- Hyperwood horizontal lockup: the kit\'s symbol, and the word outlined from Manrope ExtraBold (SIL Open'
    ' Font License), tracking %s em. Built by scripts/brand/lockup.py. -->\n'
    '<path fill="%s" transform="scale(%r)" d="%s"/>\n'
    '<path fill="%s" d="%s"/>\n'
    '</svg>\n' % (number(width), number(HEIGHT), number(width), number(HEIGHT), number(track), fill, SYMBOL_SCALE, symbol, fill, word.getCommands()),
    encoding='utf8',
)
print('%s: %s by %s (%.3f to 1)' % (out, number(width), number(HEIGHT), width / HEIGHT))
