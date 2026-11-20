"""
Make a take of the app (shots.js) into the landing page's pictures: WebP at the given widths, in src/assets/product.

A take with nothing behind it (the monitor, the phones) is trimmed to what is in it first, with a few pixels kept
round; a take on Ink (the cards) is only made smaller. A check view on Ink is written beside the take.

usage: python -I bake.py <take.png> <out-dir> <name> <width> [<width> ...]
  monitor:  python -I bake.py takes/monitor.png src/assets/product monitor 2600 1400
  phones:   python -I bake.py takes/phones.png src/assets/product phones 2400 1300
  cards:    python -I bake.py takes/card-ticket.png src/assets/product card-ticket 1050 700   (and request, payout)
"""
import os
import sys

from PIL import Image

take, out_dir, name = sys.argv[1:4]
widths = [int(w) for w in sys.argv[4:]]
im = Image.open(take)
clear = im.mode == 'RGBA' and im.getchannel('A').getextrema()[0] < 255
if clear:
    box = im.getchannel('A').point(lambda v: 255 if v > 3 else 0).getbbox()
    pad = 6
    box = (max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad))
    im = im.crop(box)
    print(name, 'box', box, 'size', im.size, 'aspect', round(im.width / im.height, 4))
else:
    im = im.convert('RGB')
    print(name, 'size', im.size)
for w in widths:
    r = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    path = os.path.join(out_dir, '%s-%d.webp' % (name, w))
    r.save(path, 'WEBP', quality=90 if clear else 88, method=6)
    print(' ', w, r.size, os.path.getsize(path), 'bytes')
check = r.convert('RGBA')
ink = Image.new('RGBA', check.size, (10, 10, 10, 255))
ink.alpha_composite(check)
ink.convert('RGB').save(os.path.join(os.path.dirname(os.path.abspath(take)), '%s-check.jpg' % name), quality=90)
