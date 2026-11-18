#!/usr/bin/env python3
"""App Store header v2 (3840x1646): two generated soldier portraits (art/, Figma AI, fictional
people in plain camo with no insignia) framing three real app screens under the headline.
App screens come from shots/, cut out of the iphone-6.9 renders."""
import os, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, 'shots')
ART = os.path.join(HERE, 'art')
OUT = os.path.join(HERE, 'header')
FONTS = os.path.abspath(os.path.join(HERE, '..', '..', 'node_modules', '@expo-google-fonts', 'dm-sans'))
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
W, H = 3840, 1646
# LOOK=marine uses the digital woodland portraits (art/marine-*.png); default is plain camo.
LOOK = os.environ.get('LOOK', 'soldier')


def phone(shot, width, left, top, dim, tilt=0):
    height = round(width * 2622 / 1206)
    scale = width / 402
    return f'''<div class="phone" style="left:{left}px;top:{top}px;width:{width}px;height:{height}px;padding:{round(width * 0.033)}px;
      border-radius:{round(width * 0.173)}px;filter:brightness({dim});transform:rotate({tilt}deg)">
      <div class="screen" style="border-radius:{round(width * 0.142)}px"><img src="file://{SHOTS}/{shot}.png">
      <div class="island" style="top:{round(11 * scale)}px;width:{round(125 * scale)}px;height:{round(37 * scale)}px"></div></div></div>'''


def html():
    centre, side, gap = 640, 540, 70
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face {{ font-family: DM; font-weight: 800; src: url('file://{FONTS}/800ExtraBold/DMSans_800ExtraBold.ttf'); }}
@font-face {{ font-family: DM; font-weight: 500; src: url('file://{FONTS}/500Medium/DMSans_500Medium.ttf'); }}
html, body {{ margin: 0; width: {W}px; height: {H}px; background: #000; overflow: hidden; }}
.glow {{ position: absolute; left: 50%; top: 1150px; width: 2600px; height: 1700px; transform: translate(-50%, -50%);
  background: radial-gradient(closest-side, rgba(45,140,255,0.30), rgba(45,140,255,0) 70%); }}
.soldier {{ position: absolute; bottom: -40px; height: 1780px; }}
.soldier.f {{ left: 40px; -webkit-mask-image: linear-gradient(to right, #000 55%, transparent 98%), linear-gradient(to top, transparent 0, #000 22%);
  -webkit-mask-composite: source-in; }}
.soldier.m {{ right: 40px; -webkit-mask-image: linear-gradient(to left, #000 55%, transparent 98%), linear-gradient(to top, transparent 0, #000 22%);
  -webkit-mask-composite: source-in; }}
h1 {{ position: absolute; top: 96px; left: 0; right: 0; margin: 0; text-align: center; color: #fff;
  font: 800 176px/1 DM, sans-serif; letter-spacing: -4px; }}
h1 mark {{ background: none; color: #3d8bff; }}
.phone {{ position: absolute; box-sizing: content-box; background: #070708;
  box-shadow: 0 0 0 6px #2b2d31, 0 0 0 13px #c9ccd1, 0 0 0 16px #8d9097, 0 50px 140px rgba(0,0,0,0.85); }}
.screen {{ position: relative; width: 100%; height: 100%; overflow: hidden; background: #000; }}
.screen img {{ width: 100%; height: 100%; display: block; }}
.island {{ position: absolute; left: 50%; transform: translateX(-50%); border-radius: 999px; background: #000; }}
.fade {{ position: absolute; left: 0; right: 0; bottom: 0; height: 300px; background: linear-gradient(to bottom, rgba(0,0,0,0), #000); }}
.tag {{ position: absolute; bottom: 44px; left: 0; right: 0; text-align: center; color: rgba(255,255,255,0.62);
  font: 500 44px/1 DM, sans-serif; letter-spacing: 0.5px; }}
</style></head><body>
<div class="glow"></div>
<img class="soldier f" src="file://{ART}/{LOOK}-female.png">
<img class="soldier m" src="file://{ART}/{LOOK}-male.png">
<h1>Train like a <mark>{'devil dog' if LOOK == 'marine' else 'soldier'}</mark></h1>
{phone('a_ranks', side, round(W / 2 - centre / 2 - gap - side), 470, 0.8, -4)}
{phone('a_track', side, round(W / 2 + centre / 2 + gap), 470, 0.8, 4)}
{phone('a_train', centre, round(W / 2 - centre / 2), 360, 1)}
<div class="fade"></div>
</body></html>'''


def main():
    os.makedirs(OUT, exist_ok=True)
    page = os.path.join(os.environ.get('TMPDIR', '/tmp'), 'gruntz-header-v2.html')
    with open(page, 'w') as f:
        f.write(html())
    png = os.path.join(OUT, f"header-v2{'' if LOOK == 'soldier' else '-' + LOOK}-{W}x{H}.png")
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
                    f'--window-size={W},{H}', '--force-device-scale-factor=1', f'--screenshot={png}', f'file://{page}'],
                   check=True, capture_output=True)
    print('wrote', png)


if __name__ == '__main__':
    main()
