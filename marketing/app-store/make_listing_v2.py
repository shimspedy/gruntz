#!/usr/bin/env python3
"""Second pass over the 6.9" App Store set (1320x2868), on top of make_screenshots.py.

Two things change, and nothing else about the look:

1. Headlines carry one highlighted phrase, set as the app's own white button (white box,
   black text). The raw simulator captures and stock photos behind the first set are not
   in the repo, so the existing renders are kept and only the pure-black headline band
   above the phone is redrawn.
2. A hero tile opens the set: the headline over the app's muscle map and three figures
   taken from the app's own screens, with no device frame.

Usage:
  make_listing_v2.py                 # headline pass, writes iphone-6.9-v2/02.png .. 10.png
  make_listing_v2.py hero            # hero tile, muscle map taken from iphone-6.9/02.png
"""
import os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'iphone-6.9')
OUT = os.path.join(HERE, 'iphone-6.9-v2')
FONTS = os.path.join(HERE, '..', '..', 'node_modules', '@expo-google-fonts', 'dm-sans')
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
TMP = os.environ.get('TMPDIR', '/tmp')
W, H = 1320, 2868
# The first set draws its headline on pure black; the photo and phone start below this.
BAND = 500

# (source slide, output slide, plain first line, highlighted phrase)
SLIDES = [
    ('01', '02', 'One mission', 'every day'),
    ('02', '03', 'Earn your', 'rank'),
    ('03', '04', 'Log every', 'set'),
    ('04', '05', 'Master every', 'movement'),
    ('05', '06', 'Plan your', 'own workouts'),
    ('06', '07', 'Ace your', 'PT test'),
    ('07', '08', 'Hundreds of', 'exercise videos'),
    ('08', '09', 'Track every', 'ruck and run'),
    ('09', '10', 'Train as', 'a team'),
]
HERO = ('Train like', 'a soldier')

FONT_FACE = f'''
@font-face {{ font-family: DM; font-weight: 800; src: url('file://{os.path.abspath(FONTS)}/800ExtraBold/DMSans_800ExtraBold.ttf'); }}
@font-face {{ font-family: DM; font-weight: 500; src: url('file://{os.path.abspath(FONTS)}/500Medium/DMSans_500Medium.ttf'); }}
'''
HEADLINE_CSS = '''
h1 { position: absolute; top: 132px; left: 0; right: 0; margin: 0; text-align: center; color: #fff;
  font: 800 132px/1.04 DM, sans-serif; letter-spacing: -2px; }
/* The app's primary button: white, black text. One per headline. */
h1 mark { display: inline-block; margin-top: 20px; padding: 4px 36px 14px; border-radius: 32px;
  background: #f4f5f4; color: #050506; }
'''


def headline(first, marked):
    return f'<h1>{first}<br><mark>{marked}</mark></h1>'


def render(name, body, css):
    page = os.path.join(TMP, f'gruntz-v2-{name}.html')
    with open(page, 'w') as f:
        f.write(f'''<!doctype html><html><head><meta charset="utf-8"><style>{FONT_FACE}
html, body {{ margin: 0; width: {W}px; height: {H}px; background: #000; overflow: hidden; }}
{HEADLINE_CSS}{css}</style></head><body>{body}</body></html>''')
    os.makedirs(OUT, exist_ok=True)
    png = os.path.join(OUT, f'{name}.png')
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
                    f'--window-size={W},{H}', '--force-device-scale-factor=1', f'--screenshot={png}', f'file://{page}'],
                   check=True, capture_output=True)
    print('wrote', png)


def headline_pass(only):
    for src, out, first, marked in SLIDES:
        if only and out not in only:
            continue
        css = f'''
.old {{ position: absolute; inset: 0; background: url('file://{SRC}/{src}.png') top left / {W}px {H}px no-repeat; }}
.band {{ position: absolute; left: 0; right: 0; top: 0; height: {BAND}px; background: #000; }}'''
        render(out, f'<div class="old"></div><div class="band"></div>{headline(first, marked)}', css)


def hero(source_png=None):
    # The muscle map, taken from the Ranks screenshot of the first set (the phone screen
    # there is 900px wide at 210,640) and shown 1.9x so both figures span the tile. The
    # device frame, card above and tab bar below are masked out.
    source = os.path.abspath(source_png) if source_png else os.path.join(SRC, '02.png')
    css = f'''
.map {{ position: absolute; left: 0; top: 580px; width: 1320px; height: 1150px;
  background: url('file://{source}') no-repeat; background-size: 2500px auto; background-position: -590px -3394px;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 70px, #000 860px, transparent 1070px),
    linear-gradient(to right, transparent 0, #000 60px, #000 1260px, transparent 1320px); -webkit-mask-composite: source-in; }}
.facts {{ position: absolute; left: 80px; right: 80px; top: 1880px; display: flex; gap: 24px; }}
.fact {{ flex: 1; padding: 44px 36px 48px; border-radius: 44px; background: #121214; box-shadow: inset 0 0 0 2px rgba(255,255,255,0.08); }}
.fact b {{ display: block; color: #fff; font: 800 104px/1 DM, sans-serif; letter-spacing: -2px; font-variant-numeric: tabular-nums; }}
.fact span {{ display: block; margin-top: 20px; color: #9a9ca3; font: 500 40px/1.2 DM, sans-serif; }}
.by {{ position: absolute; left: 0; right: 0; top: 2400px; text-align: center; color: #c9ccd1; font: 500 52px/1.2 DM, sans-serif; }}
.sub {{ position: absolute; left: 0; right: 0; top: 2496px; text-align: center; color: #7d8088; font: 500 40px/1.2 DM, sans-serif; }}'''
    body = f'''<div class="map"></div>{headline(*HERO)}
<div class="facts">
  <div class="fact"><b>78%</b><span>test ready</span></div>
  <div class="fact"><b>12</b><span>day streak</span></div>
  <div class="fact"><b>582</b><span>exercise videos</span></div>
</div>
<div class="by">Built by a former U.S. Marine</div>
<div class="sub">Army AFT · Marine PFT and CFT · Navy PRT · Air Force PT</div>'''
    render('01', body, css)


if __name__ == '__main__':
    args = sys.argv[1:]
    if args and args[0] == 'hero':
        hero(args[1] if len(args) > 1 else None)
    else:
        headline_pass(set(args))
