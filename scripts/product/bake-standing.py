"""
Put the standing phone's picture together (src/product/Standing.tsx) from three takes of the same view of
studio.html?scene=standing (shots/standing.js): the phone alone with nothing behind it, and the pool of light alone
and the shadow alone, both white on black.

The ground is Hyper Neon let through q = pool x (1 - shadow), worked out in full precision. Taken in one piece, the
shadow's faint parts came out up to a level darker than the page's Ink, in stripes (the colours of nearly clear pixels
are rounded to black when a take is saved); put together like this the light falls off with no bands, and where there
is no light the picture is clear, so the shadow is never darker than the page.

Written at the given widths as WebP, with a check view on Ink (and a brightened one) beside the takes.

usage: python -I bake-standing.py <phone.png> <pool.png> <shade.png> <out-dir> <name> <width> [<width> ...]
"""
import os
import sys

import numpy as np
from PIL import Image

NEON = np.array([204, 255, 0], dtype=np.float32) / 255
INK = 10 / 255


def shrink(a, size):
    """One channel, made smaller in full precision."""
    return np.asarray(Image.fromarray(np.ascontiguousarray(a, dtype=np.float32)).resize(size, Image.LANCZOS), dtype=np.float32)


phone_path, pool_path, shade_path, out_dir, name = sys.argv[1:6]
widths = [int(w) for w in sys.argv[6:]]
phone8 = np.asarray(Image.open(phone_path).convert('RGBA'))
pool8 = np.asarray(Image.open(pool_path).convert('L'))
shade8 = np.asarray(Image.open(shade_path).convert('L'))

# what is in the picture: the phone, and the ground wherever any light is let through
lit = pool8.astype(np.int32) * (255 - shade8.astype(np.int32)) > 127
seen = (phone8[..., 3] > 0) | lit
ys, xs = np.nonzero(seen)
pad = 6
y0, y1 = max(0, ys.min() - pad), min(seen.shape[0], ys.max() + 1 + pad)
x0, x1 = max(0, xs.min() - pad), min(seen.shape[1], xs.max() + 1 + pad)
del lit, seen, ys, xs
phone = phone8[y0:y1, x0:x1].astype(np.float32) / 255
pool = pool8[y0:y1, x0:x1].astype(np.float32) / 255
shade = shade8[y0:y1, x0:x1].astype(np.float32) / 255
del phone8, pool8, shade8
q = pool * (1 - shade)
alpha = phone[..., 3]
H, W = alpha.shape
print(name, 'box', (x0, y0, x1, y1), 'size', (W, H), 'aspect', round(W / H, 4))

for w in widths:
    size = (w, round(H * w / W))
    a = np.clip(shrink(alpha, size), 0, 1)
    pre = [shrink(phone[..., c] * alpha, size) for c in range(3)]
    g = np.clip(shrink(q, size), 0, 1)
    # the phone over the ground (the ground: Neon, let through g)
    out_a = a + g * (1 - a)
    out_pre = [pre[c] + NEON[c] * g * (1 - a) for c in range(3)]
    some = out_a > 1e-5
    rgb = np.stack([np.where(some, out_pre[c] / np.maximum(out_a, 1e-5), NEON[c]) for c in range(3)], axis=-1)
    A = np.clip(np.round(out_a * 255), 0, 255).astype(np.uint8)
    RGB = np.clip(np.round(rgb * 255), 0, 255).astype(np.uint8)
    # (a clear pixel keeps the Neon, so that the lossy colours of the WebP do not darken the light's faint edge)
    RGB[A == 0] = np.round(NEON * 255).astype(np.uint8)
    picture = Image.fromarray(np.dstack([RGB, A]))
    path = os.path.join(out_dir, '%s-%d.webp' % (name, w))
    picture.save(path, 'WEBP', quality=86, method=6)
    print(' ', w, size, os.path.getsize(path), 'bytes')
    # how far the picture takes the page below its Ink where there is only the ground (in green, the light's own
    # channel: the light has no blue, so it lowers the Ink's blue a little, as it should)
    ground = a < 0.5 / 255
    green = RGB[..., 1].astype(np.float32) * (A / 255.0) + 10 * (1 - A / 255.0)
    print('  darkest where there is only the ground:', round(float(green[ground].min()), 2), '(the Ink is 10)')

# the check views: the smallest on Ink, and the same brightened four times (bands and stray shapes show there)
back = Image.open(path).convert('RGBA')
ink = Image.new('RGBA', back.size, (10, 10, 10, 255))
ink.alpha_composite(back)
here = os.path.dirname(os.path.abspath(phone_path))
ink.convert('RGB').save(os.path.join(here, '%s-check.jpg' % name), quality=92)
bright = np.clip(np.asarray(ink.convert('RGB'), dtype=np.float32) * 4, 0, 255).astype(np.uint8)
Image.fromarray(bright).save(os.path.join(here, '%s-check-bright.jpg' % name), quality=92)
