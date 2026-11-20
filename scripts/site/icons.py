"""
The site's icons, made from the mark as the SVG icon has it (public/favicon.svg: the symbol in Hyper Neon on a square
of Ink). Written into public/, beside it:

  favicon.ico             16, 32 and 48 px, for browsers that do not take the SVG
  apple-touch-icon.png    180 px, Ink to its corners (the phone rounds them itself), nothing clear in it
  icon-192.png, -512.png  for the manifest (site.webmanifest), corners rounded as the SVG icon's
  icon-maskable-512.png   for the manifest: Ink to its corners, the mark inside the part that is never cut away

Each is drawn at four times its size and made smaller, so the mark's edge is clean at 16 px too.

usage, from the project's root: python -I scripts/site/icons.py     (needs PyMuPDF and Pillow)
"""
import os
import re

import fitz
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUBLIC = os.path.join(ROOT, 'public')
INK, NEON = '#0A0A0A', '#CCFF00'
# the mark's own box (the path is the master's, src/assets/brand/hyperwood-symbol-neon.svg)
MARK = (428.0, 191.0)

with open(os.path.join(PUBLIC, 'favicon.svg'), encoding='utf-8') as f:
    path = re.search(r'<path d="([^"]+)"', f.read()).group(1)


def picture(size, share, rounded):
    """The mark on Ink: a square of `size` px, the mark `share` of its width, its corners rounded by `rounded` of its
    side (0: Ink to the corners)."""
    k = size * share / MARK[0]
    x = (size - MARK[0] * k) / 2
    y = (size - MARK[1] * k) / 2
    doc = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">'
        f'<rect width="{size}" height="{size}" rx="{size * rounded}" fill="{INK}"/>'
        f'<path d="{path}" fill="{NEON}" transform="translate({x:.3f} {y:.3f}) scale({k:.5f})"/></svg>'
    )
    page = fitz.open(stream=doc.encode('utf-8'), filetype='svg')[0]
    pix = page.get_pixmap(alpha=True, matrix=fitz.Matrix(4, 4))
    big = Image.frombytes('RGBA', (pix.width, pix.height), pix.samples)
    return big.resize((size, size), Image.LANCZOS)


def save(name, image):
    out = os.path.join(PUBLIC, name)
    image.save(out)
    print(name, image.size, os.path.getsize(out), 'bytes')


# (at 16 px the mark is a little larger in its square, to stay a mark)
small = [picture(16, 0.8, 0.1875), picture(32, 0.72, 0.1875), picture(48, 0.7, 0.1875)]
ico = os.path.join(PUBLIC, 'favicon.ico')
small[-1].save(ico, format='ICO', append_images=small[:-1], sizes=[(48, 48), (16, 16), (32, 32)])
print('favicon.ico', os.path.getsize(ico), 'bytes')

save('apple-touch-icon.png', picture(180, 0.62, 0).convert('RGB'))
save('icon-192.png', picture(192, 0.68, 0.1875))
save('icon-512.png', picture(512, 0.68, 0.1875))
save('icon-maskable-512.png', picture(512, 0.5, 0).convert('RGB'))
