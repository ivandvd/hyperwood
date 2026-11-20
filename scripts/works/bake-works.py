"""
The three pictures of How it works (landing/soar/works/WorksBlock.tsx): each given picture cut to the card's 4 by 5
(the whole of an upright one; of a wide one, the part with its subject) and written as WebP, 1120 and 640 wide, in
src/assets/works. They are smooth, dark gradients, which a lossy picture breaks into blocks and bands: so they are
written at a high quality over a dither of one level (seeded, so the files are the same each time).

  python scripts/works/bake-works.py <the folder with the given pictures>
"""
import os
import sys

import numpy as np
from PIL import Image

SRC = os.path.join(sys.argv[1], '')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'src', 'assets', 'works', '')
# each: the given file, and where its subject stands across it (a share of its width; only a wide picture is cut)
PICTURES = {
    'chain': ('Lime-Tinted Rocket in Smoky Twilight-1.png', 0.474),
    'private': ('Lime-lit profile in soft shadow-2.png', 0.5),
    'markets': ('Lime glints on a midnight wave-3.png', 0.5),
}
QUALITY = 96
DITHER = 1.0  # levels of 255, one standard deviation

rng = np.random.default_rng(7)
for key, (name, at) in PICTURES.items():
    im = Image.open(SRC + name).convert('RGB')
    w, h = im.size
    if w / h > 0.8:
        cw = round(h * 0.8)
        left = max(0, min(w - cw, round(w * at) - cw // 2))
        im = im.crop((left, 0, left + cw, h))
    else:
        ch = round(w / 0.8)
        top = max(0, (h - ch) // 2)
        im = im.crop((0, top, w, top + ch))
    for width in (1120, 640):
        to = min(width, im.size[0]) if width == 1120 else width
        r = im.resize((to, round(to * 1.25)), Image.LANCZOS)
        x = np.asarray(r).astype(np.float32)
        x += rng.normal(0.0, DITHER, x.shape[:2])[..., None]
        r = Image.fromarray(np.clip(x + 0.5, 0, 255).astype(np.uint8))
        path = OUT + f'works-{key}-{width}.webp'
        r.save(path, 'WEBP', quality=QUALITY, method=6)
        print(os.path.basename(path), r.size, os.path.getsize(path))
