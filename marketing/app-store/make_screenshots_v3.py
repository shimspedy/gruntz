#!/usr/bin/env python3
"""App Store iPhone set v3 (1206x2622, "iPhone with Dynamic Island, medium display"):
real app screens (shots/) in a device frame beside Figma AI scene photos (art/; fictional
people in digital woodland or green PT gear, no emblems, tapes or text).

Usage: make_screenshots_v3.py  ->  iphone-6.3-v3/01.png .. 10.png + contact-sheet.png
"""
import os, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, 'shots')
ART = os.path.join(HERE, 'art')
OUT = os.path.join(HERE, 'iphone-6.3-v3')
FONTS = os.path.abspath(os.path.join(HERE, '..', '..', 'node_modules', '@expo-google-fonts', 'dm-sans'))
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
W, H = 1206, 2622
ACCENT = '#3d8bff'

# (file, plain line, highlighted line, app screen, photo, side the person stands on)
SLIDES = [
    ('02', 'One mission', 'every day', 'a_train', 'scene-pullup', 'left'),
    ('03', 'Earn your', 'rank', 'a_ranks', 'marine-male', 'right'),
    ('04', 'Log every', 'set', 'a_log', 'scene-deadlift', 'left'),
    ('05', 'Master every', 'movement', 'a_detail', 'scene-kettlebell', 'left'),
    ('06', 'Plan your', 'own workouts', 'a_routine', 'marine-female', 'left'),
    ('07', 'Ace your', 'PT test', 'a_test', 'scene-sprint', 'left'),
    ('08', 'Hundreds of', 'exercise videos', 'a_lib', None, None),
    ('09', 'Track every', 'ruck and run', 'a_track', 'scene-ruck', 'left'),
    ('10', 'Train as', 'a team', 'a_team', 'scene-team', 'left'),
]

BASE_CSS = f'''
@font-face {{ font-family: DM; font-weight: 800; src: url('file://{FONTS}/800ExtraBold/DMSans_800ExtraBold.ttf'); }}
html, body {{ margin: 0; width: {W}px; height: {H}px; background: #000; overflow: hidden; }}
h1 {{ position: absolute; top: 120px; left: 0; right: 0; margin: 0; text-align: center; color: #fff;
  font: 800 124px/1.04 DM, sans-serif; letter-spacing: -2px; z-index: 5; }}
h1 span {{ color: {ACCENT}; }}
.photo {{ position: absolute; inset: 0; background-size: cover; filter: contrast(1.05); }}
.shade {{ position: absolute; inset: 0; background: linear-gradient(to bottom, #000 0, #000 380px, rgba(0,0,0,0.15) 820px,
  rgba(0,0,0,0) 1700px, rgba(0,0,0,0.7) 2350px, #000 {H}px); }}
.glow {{ position: absolute; left: 50%; top: 1500px; width: 1500px; height: 1500px; transform: translate(-50%, -50%);
  background: radial-gradient(closest-side, rgba(45,140,255,0.30), rgba(45,140,255,0) 70%); }}
.phone {{ position: absolute; box-sizing: content-box; background: #070708; z-index: 4;
  box-shadow: 0 0 0 5px #2b2d31, 0 0 0 11px #c9ccd1, 0 0 0 14px #8d9097, 0 40px 120px rgba(0,0,0,0.85); }}
.screen {{ position: relative; width: 100%; height: 100%; overflow: hidden; background: #000; }}
.screen img {{ width: 100%; height: 100%; display: block; }}
.island {{ position: absolute; left: 50%; transform: translateX(-50%); border-radius: 999px; background: #000; }}
'''


def phone(shot, width, left, top, tilt=0):
    height = round(width * 2622 / 1206)
    scale = width / 402
    return f'''<div class="phone" style="left:{left}px;top:{top}px;width:{width}px;height:{height}px;padding:{round(width * 0.033)}px;
      border-radius:{round(width * 0.173)}px;transform:rotate({tilt}deg)">
      <div class="screen" style="border-radius:{round(width * 0.142)}px"><img src="file://{SHOTS}/{shot}.png">
      <div class="island" style="top:{round(11 * scale)}px;width:{round(125 * scale)}px;height:{round(37 * scale)}px"></div></div></div>'''


def slide(first, marked, shot, photo, side):
    width = 640 if photo else 800
    if not photo:
        back, left, tilt = '<div class="glow"></div>', round((W - width) / 2) - 23, 0
    else:
        # Person on one side of the frame, the phone on the other, overlapping a little.
        pos = '0%' if side == 'left' else '100%'
        if photo.startswith('marine-'):
            pos = '100%' if side == 'left' else '0%'
        back = f'<div class="photo" style="background-image:url(\'file://{ART}/{photo}.png\');background-position:{pos} center"></div><div class="shade"></div>'
        left = W - width - 46 - 96 if side == 'left' else 96
        tilt = 3 if side == 'left' else -3
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>{BASE_CSS}</style></head><body>
{back}
<h1>{first}<br><span>{marked}</span></h1>
{phone(shot, width, left, 640 if photo else 600, tilt)}
</body></html>'''


def hero():
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>{BASE_CSS}
.p {{ position: absolute; bottom: 0; height: 2240px; z-index: 2; }}
.p.f {{ left: -400px; -webkit-mask-image: linear-gradient(to right, #000 60%, transparent 92%); }}
.p.m {{ right: -400px; -webkit-mask-image: linear-gradient(to left, #000 60%, transparent 92%); }}
.foot {{ position: absolute; left: 0; right: 0; bottom: 0; height: 700px; z-index: 3; background: linear-gradient(to bottom, rgba(0,0,0,0), #000 80%); }}
h1 {{ font-size: 140px; }}
</style></head><body>
<div class="glow" style="top:1300px"></div>
<img class="p f" src="file://{ART}/marine-female.png">
<img class="p m" src="file://{ART}/marine-male.png">
<div class="foot"></div>
<h1>Train like a<br><span>devil dog</span></h1>
{phone('a_train', 500, round((W - 500) / 2) - 16, 1330)}
</body></html>'''


def render(markup, name):
    page = os.path.join(os.environ.get('TMPDIR', '/tmp'), f'gruntz-shot-{name}.html')
    with open(page, 'w') as f:
        f.write(markup)
    png = os.path.join(OUT, f'{name}.png')
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
                    f'--window-size={W},{H}', '--force-device-scale-factor=1', f'--screenshot={png}', f'file://{page}'],
                   check=True, capture_output=True)
    return png


def main():
    os.makedirs(OUT, exist_ok=True)
    render(hero(), '01')
    for name, first, marked, shot, photo, side in SLIDES:
        render(slide(first, marked, shot, photo, side), name)
    files = [os.path.join(OUT, f'{i:02d}.png') for i in range(1, 11)]
    args = []
    for f in files:
        args += ['-i', f]
    grid = ''.join(f'[{i}]scale=302:-1[s{i}];' for i in range(10)) + ''.join(f'[s{i}]' for i in range(10)) + 'xstack=inputs=10:layout=' + '|'.join(
        f'{(i % 5) * 302}_{(i // 5) * 656}' for i in range(10))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args, '-filter_complex', grid, '-update', '1', os.path.join(OUT, 'contact-sheet.png')], check=True)
    print('wrote', OUT)


if __name__ == '__main__':
    main()
