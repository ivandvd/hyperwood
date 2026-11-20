"""
Make a phone shot (shot.html, rendered by shots.js) into the landing page's pictures: made smaller and written as
WebP at the given widths in src/assets/product. Smooth: no grain (GRAIN is 0; the pictures had film grain once, and
it read as a rough texture). A step of one level of noise, too small to be seen, keeps the dark grounds' gradients
from banding. A check view is written beside the take.

usage: python -I bake-shots.py <take.png> <out-dir> <name> <width> [<width> ...]
  python -I bake-shots.py takes/shot-trade.png src/assets/product shot-trade 1200 800   (and receipt, close)
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

GRAIN = 0.0  # film grain's strength in the middle tones (one standard deviation, of white): none
DITHER = 1.0 / 255  # (one level, unseen: no bands in the dark gradients)

take, out_dir, name = sys.argv[1:4]
widths = [int(w) for w in sys.argv[4:]]
im = Image.open(take).convert('RGB')
print(name, 'size', im.size)
for i, w in enumerate(widths):
    h = round(im.height * w / im.width)
    a = np.asarray(im.resize((w, h), Image.LANCZOS)).astype(np.float32) / 255
    noise = gaussian_filter(np.random.default_rng(7 + i).standard_normal((h, w)).astype(np.float32), 0.55)
    noise /= noise.std()
    tone = a @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    t = np.clip(tone / 0.35, 0, 1)
    much = GRAIN * (0.45 + 0.55 * t * t * (3 - 2 * t))
    out = np.clip(a + (noise * much)[..., None] + (np.random.default_rng(11 + i).random((h, w, 1)).astype(np.float32) - 0.5) * DITHER, 0, 1)
    pic = Image.fromarray((out * 255 + 0.5).astype(np.uint8))
    path = os.path.join(out_dir, '%s-%d.webp' % (name, w))
    pic.save(path, 'WEBP', quality=88, method=6)
    print(' ', path, os.path.getsize(path) // 1024, 'KB')
    if i == 0:
        pic.save(os.path.join(os.path.dirname(os.path.abspath(take)), '%s-check.jpg' % name), quality=92)
