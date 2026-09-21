#!/usr/bin/env python3
"""Renders App Store screenshots (1320x2868, 6.9") in the Symmetry style: black canvas,
bold two-line headline, silver iPhone frame, optional dimmed stock photo behind the phone."""
import os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
# Raw simulator captures and stock photos live outside the repo; point these at your working copies.
SHOTS = os.environ.get('SHOTS_DIR', os.path.join(HERE, 'shots'))
STOCK = os.environ.get('STOCK_DIR', os.path.join(HERE, 'stock'))
IPAD = os.environ.get('DEVICE') == 'ipad'
OUT = os.path.join(HERE, 'ipad-13' if IPAD else 'iphone-6.9')
FONTS = '/Users/johnhashim/Desktop/MVPapp/gruntz/node_modules/@expo-google-fonts/dm-sans'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
# App Store sizes: iPhone 6.9\" 1320x2868, iPad 13\" 2064x2752.
W, H = (2064, 2752) if IPAD else (1320, 2868)

SLIDES = [
    ('01', 'Train like<br>a soldier', 'a_train', '01', 'center 35%'),
    ('02', 'Earn your<br>rank', 'a_ranks', None, None),
    ('03', 'Log every<br>set', 'a_log', '84', 'center 30%'),
    ('04', 'Master every<br>movement', 'a_detail', '68', 'center 40%'),
    ('05', 'Plan your<br>own workouts', 'a_routine', '64', 'center 45%'),
    ('06', 'Ace your<br>PT test', 'a_test', '08', 'center 40%'),
    ('07', '412 exercise<br>videos', 'a_lib', '39', 'center 35%'),
]

SCREEN_W = 860 if IPAD else 900
SCREEN_H = round(SCREEN_W * 2622 / 1206)
BEZEL = 30
SCALE = SCREEN_W / 402  # points -> px inside the frame


def html(title, shot, photo, pos):
    photo_layer = ''
    if photo:
        photo_layer = f'''
        <div class="photo" style="background-image:url('file://{STOCK}/{photo}.jpg');background-position:{pos}"></div>
        <div class="shade"></div>'''
    else:
        photo_layer = '<div class="glow"></div>'
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face {{ font-family: DM; font-weight: 800; src: url('file://{FONTS}/800ExtraBold/DMSans_800ExtraBold.ttf'); }}
html, body {{ margin: 0; width: {W}px; height: {H}px; background: #000; overflow: hidden; }}
.photo {{ position: absolute; left: 0; right: 0; top: 520px; bottom: 0; background-size: cover;
  filter: grayscale(0.2) brightness(0.8) contrast(1.1); }}
.shade {{ position: absolute; inset: 0; background: linear-gradient(to bottom, #000 0px, #000 520px, rgba(0,0,0,0.25) 1000px,
  rgba(0,0,0,0.1) 1900px, rgba(0,0,0,0.55) 2600px, #000 {H}px); }}
.glow {{ position: absolute; left: 50%; top: 1250px; width: 1400px; height: 1400px; transform: translate(-50%, -50%);
  background: radial-gradient(closest-side, rgba(45,140,255,0.28), rgba(45,140,255,0) 70%); }}
h1 {{ position: absolute; top: 150px; left: 0; right: 0; margin: 0; text-align: center; color: #fff;
  font: 800 {150 if IPAD else 132}px/1.04 DM, sans-serif; letter-spacing: -2px; }}
.phone {{ position: absolute; left: 50%; top: {560 if IPAD else 610}px; transform: translateX(-50%);
  width: {SCREEN_W}px; height: {SCREEN_H}px; padding: {BEZEL}px; border-radius: 156px; background: #070708;
  box-shadow: 0 0 0 6px #2b2d31, 0 0 0 13px #c9ccd1, 0 0 0 16px #8d9097, 0 50px 140px rgba(0,0,0,0.75); }}
.btn {{ position: absolute; width: 12px; background: linear-gradient(to right, #9ea1a7, #d7d9dd); border-radius: 6px; }}
.screen {{ position: relative; width: {SCREEN_W}px; height: {SCREEN_H}px; border-radius: 128px; overflow: hidden; background: #000; }}
.screen img {{ width: 100%; height: 100%; display: block; }}
.island {{ position: absolute; left: 50%; top: {round(11 * SCALE)}px; transform: translateX(-50%);
  width: {round(125 * SCALE)}px; height: {round(37 * SCALE)}px; border-radius: 999px; background: #000; }}
</style></head><body>
{photo_layer}
<h1>{title}</h1>
<div class="phone">
  <div class="btn" style="left:-28px;top:330px;height:110px"></div>
  <div class="btn" style="left:-28px;top:500px;height:190px"></div>
  <div class="btn" style="left:-28px;top:720px;height:190px"></div>
  <div class="btn" style="right:-28px;top:560px;height:290px"></div>
  <div class="screen"><img src="file://{SHOTS}/{shot}.png"><div class="island"></div></div>
</div>
</body></html>'''


def main():
    os.makedirs(OUT, exist_ok=True)
    only = set(sys.argv[1:])
    for n, title, shot, photo, pos in SLIDES:
        if only and n not in only:
            continue
        page = os.path.join('/tmp' if not os.environ.get('TMPDIR') else os.environ['TMPDIR'], f'gruntz-slide-{n}.html')
        with open(page, 'w') as f:
            f.write(html(title, shot, photo, pos))
        png = os.path.join(OUT, f'{n}.png')
        subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
                        f'--window-size={W},{H}', '--force-device-scale-factor=1', f'--screenshot={png}', f'file://{page}'],
                       check=True, capture_output=True)
        print('wrote', png)


if __name__ == '__main__':
    main()
