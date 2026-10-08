#!/usr/bin/env python3
"""Renders the App Store product page header (3840x1646) and, with KIND=search, the search
results asset (3840x2560): one idea, centred, in the same style as the screenshots. Raw
simulator captures live outside the repo; set SHOTS_DIR."""
import os, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.environ.get('SHOTS_DIR', os.path.join(HERE, 'shots'))
OUT = os.path.join(HERE, 'header')
FONTS = os.path.join(HERE, '..', '..', 'node_modules', '@expo-google-fonts', 'dm-sans')
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
SEARCH = os.environ.get('KIND') == 'search'
W, H = (3840, 2560) if SEARCH else (3840, 1646)


def phone(shot, width, left, top, dim):
    height = round(width * 2622 / 1206)
    scale = width / 402
    return f'''<div class="phone" style="left:{left}px;top:{top}px;width:{width}px;height:{height}px;padding:{round(width * 0.033)}px;
      border-radius:{round(width * 0.173)}px;filter:brightness({dim})">
      <div class="screen" style="border-radius:{round(width * 0.142)}px"><img src="file://{SHOTS}/{shot}.png">
      <div class="island" style="top:{round(11 * scale)}px;width:{round(125 * scale)}px;height:{round(37 * scale)}px"></div></div></div>'''


def html():
    centre, side = (960, 800) if SEARCH else (720, 600)
    centre_top, side_top = (640, 880) if SEARCH else (430, 600)
    title_top, title_size, gap = (210, 230, 190) if SEARCH else (120, 190, 150)
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face {{ font-family: DM; font-weight: 800; src: url('file://{os.path.abspath(FONTS)}/800ExtraBold/DMSans_800ExtraBold.ttf'); }}
html, body {{ margin: 0; width: {W}px; height: {H}px; background: #000; overflow: hidden; }}
.glow {{ position: absolute; left: 50%; top: {round(H * 0.7)}px; width: 3000px; height: 2200px; transform: translate(-50%, -50%);
  background: radial-gradient(closest-side, rgba(45,140,255,0.34), rgba(45,140,255,0) 70%); }}
h1 {{ position: absolute; top: {title_top}px; left: 0; right: 0; margin: 0; text-align: center; color: #fff;
  font: 800 {title_size}px/1 DM, sans-serif; letter-spacing: -4px; }}
.phone {{ position: absolute; box-sizing: content-box; background: #070708;
  box-shadow: 0 0 0 6px #2b2d31, 0 0 0 13px #c9ccd1, 0 0 0 16px #8d9097, 0 50px 140px rgba(0,0,0,0.75); }}
.screen {{ position: relative; width: 100%; height: 100%; overflow: hidden; background: #000; }}
.screen img {{ width: 100%; height: 100%; display: block; }}
.island {{ position: absolute; left: 50%; transform: translateX(-50%); border-radius: 999px; background: #000; }}
.fade {{ position: absolute; left: 0; right: 0; bottom: 0; height: 260px; background: linear-gradient(to bottom, rgba(0,0,0,0), #000); }}
</style></head><body>
<div class="glow"></div>
<h1>Train like a soldier</h1>
{phone('a_ranks', side, round(W / 2 - centre / 2 - gap - side), side_top, 0.72)}
{phone('a_track', side, round(W / 2 + centre / 2 + gap), side_top, 0.72)}
{phone('a_train', centre, round(W / 2 - centre / 2), centre_top, 1)}
<div class="fade"></div>
</body></html>'''


def main():
    os.makedirs(OUT, exist_ok=True)
    page = os.path.join(os.environ.get('TMPDIR', '/tmp'), 'gruntz-header.html')
    with open(page, 'w') as f:
        f.write(html())
    png = os.path.join(OUT, f"{'search' if SEARCH else 'header'}-{W}x{H}.png")
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
                    f'--window-size={W},{H}', '--force-device-scale-factor=1', f'--screenshot={png}', f'file://{page}'],
                   check=True, capture_output=True)
    print('wrote', png)


if __name__ == '__main__':
    main()
