"""
The mobile app on a real iPhone (&flow=soar's last screen): Apple's own picture of the phone, a product bezel from
Apple's Design Resources, with the app's screen laid into it, as Apple's marketing guidelines ask: the bezel as it is,
upright and straight on, nothing added to it (no shadow, no tilt, nothing cut), the app on its screen as it runs,
with a full status bar.

The bezel is not in this repository: Apple's licence lets it be used for mock-ups of an app's interface and their
pictures, and not passed on. Get it from https://developer.apple.com/design/resources/ (Product Bezels, iPhone 18:
Bezel-iPhone-18.dmg, "PNG/iPhone 18 Pro/iPhone 18 Pro - Silver - Portrait.png"; 7-Zip opens the disk image).

The screen is where the bezel is clear, found from its middle; the app's take (shots.js, "screen": 1206 by 2622) is
laid under the bezel there, so the bezel's border, its rounded corners and its Dynamic Island stand over it.

usage: python -I bake-bezel.py <bezel.png> <phone-screen.png> <out-dir> <name> <width> [<width> ...]
  python -I bake-bezel.py "iPhone 18 Pro - Silver - Portrait.png" takes/phone-screen.png src/assets/product iphone-real 1350 700
"""
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

bezel_path, screen_path, out_dir, name = sys.argv[1:5]
widths = [int(w) for w in sys.argv[5:]]
bezel = Image.open(bezel_path).convert('RGBA')
alpha = np.asarray(bezel)[..., 3]
H, W = alpha.shape

# the screen: what is clear about the middle, reached without crossing the bezel
seen = np.zeros((H, W), dtype=bool)
todo = deque([(H // 2, W // 2)])
seen[H // 2, W // 2] = True
while todo:
    y, x = todo.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < H and 0 <= nx < W and not seen[ny, nx] and alpha[ny, nx] < 250:
            seen[ny, nx] = True
            todo.append((ny, nx))
ys, xs = np.where(seen)
x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
print('screen', (x0, y0, x1, y1), 'size', (x1 - x0, y1 - y0))

screen = Image.open(screen_path).convert('RGBA')
if screen.size != (x1 - x0, y1 - y0):
    raise SystemExit('the take is %s, the screen %s' % (screen.size, (x1 - x0, y1 - y0)))
# (only within the screen's own shape: its corners are round, and beyond them the picture is clear, outside the
# phone, where a square take showed as four dark corners)
shape = Image.fromarray((seen[y0:y1, x0:x1] * 255).astype(np.uint8), 'L')
whole = Image.new('RGBA', bezel.size, (0, 0, 0, 0))
whole.paste(screen, (x0, y0), shape)
whole.alpha_composite(bezel)

for w in widths:
    h = round(H * w / W)
    small = whole.resize((w, h), Image.LANCZOS) if w != W else whole
    path = os.path.join(out_dir, '%s-%d.webp' % (name, w))
    small.save(path, 'WEBP', quality=92, method=6, alpha_quality=100)
    print(' ', w, small.size, os.path.getsize(path), 'bytes')
check = Image.new('RGBA', whole.size, (244, 245, 240, 255))
check.alpha_composite(whole)
check.convert('RGB').save(os.path.join(os.path.dirname(os.path.abspath(screen_path)), '%s-check.jpg' % name), quality=90)
