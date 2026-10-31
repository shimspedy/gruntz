"""Reproducible 21-second motion-comic ad. Original art + unaltered app captures.
Run with the bundled Python (Pillow, NumPy) from the repository root.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
import argparse, json, math, subprocess

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
ASSETS, OUT, QA = HERE / 'assets', HERE / 'exports', HERE / 'qa'
W, H, FPS, DURATION = 1080, 1920, 30, 21
PAPER, INK, BLUE, RED = '#f4f1e8', '#171b19', '#3569d5', '#be3d31'
font_cache = {}
def font(name, size):
    key = (name, size)
    if key not in font_cache:
        p = {'head':'Bangers-Regular.ttf', 'comic':'ComicNeue-Bold.ttf', 'body':'DM-Sans.ttf'}[name]
        font_cache[key] = ImageFont.truetype(str(ASSETS / p), size)
    return font_cache[key]

def text(draw, xy, value, size=48, kind='body', fill=INK, spacing=6, anchor=None):
    draw.multiline_text(xy, value, font=font(kind,size), fill=fill, spacing=spacing, anchor=anchor, stroke_width=0)

def ease(x):
    x = max(0, min(1, x))
    return 1 - (1-x)**3

strip = Image.open(ROOT / 'marketing/comics-2026-10-29/art/marines.png').convert('RGB')
sw, sh = strip.size
panels = [strip.crop((10,10,sw//2-8,sh-10)), strip.crop((sw//2+8,10,sw-10,sh-10))]
icon = Image.open(ROOT / 'assets/icon.png').convert('RGBA')
screen_dir = ROOT / 'marketing/comics-2026-10-29/source-screens'
screens = {k: Image.open(screen_dir/p).convert('RGB') for k,p in [('plan','train-current.png'),('log','workout-log.jpg')]}

def brand(im, light=False):
    d = ImageDraw.Draw(im)
    mark = icon.resize((56,56),Image.Resampling.LANCZOS)
    im.paste(mark,(92,112),mark)
    text(d,(166,112),'Gruntz',43,fill=PAPER if light else INK)
    text(d,(92,184),'MILITARY FITNESS',23,fill='#667067')

def bubble(im, words, male, progress):
    layer=Image.new('RGBA',(W,H))
    d=ImageDraw.Draw(layer)
    if male:
        box=(274,493,890,674); tip=(790,760); tails=((708,666),(790,760),(757,663))
    else:
        box=(111,490,803,671); tip=(340,722); tails=((302,660),(340,722),(364,658))
    d.polygon(tails,fill='white',outline=INK,width=5)
    d.rounded_rectangle(box,radius=42,fill='white',outline=INK,width=5)
    d.polygon((tails[0],tails[2],(tails[2][0],tails[2][1]-10),(tails[0][0],tails[0][1]-10)),fill='white')
    mid=((box[0]+box[2])/2,(box[1]+box[3])/2-3)
    text(d,mid,words,54,'comic',anchor='mm',spacing=0)
    scale=.90+.10*ease(progress/.18)
    if scale<1:
        layer=layer.resize((round(W*scale),round(H*scale)),Image.Resampling.LANCZOS)
        im.paste(layer,(round(W*(1-scale)/2),round(H*(1-scale)*.36)),layer)
    else: im.paste(layer,(0,0),layer)

def panel(im, index, u):
    d=ImageDraw.Draw(im)
    d.rectangle((73,459,977,1304),fill=INK)
    art=ImageOps.fit(panels[index],(892,833),method=Image.Resampling.LANCZOS)
    zoom=1+.028*u
    rw,rh=round(892*zoom),round(833*zoom)
    art=art.resize((rw,rh),Image.Resampling.LANCZOS)
    # Tiny camera move; text and frame remain stable.
    cx=int((rw-892)*(.35+.2*u)); cy=int((rh-833)*.3)
    art=art.crop((cx,cy,cx+892,cy+833))
    im.paste(art,(79,465))

def comic_frame(scene, t, local, span):
    im=Image.new('RGB',(W,H),PAPER); brand(im)
    d=ImageDraw.Draw(im)
    if scene==0:
        text(d,(94,270),'30 MINUTES IN.',100,'head')
        d.rectangle((91,379,680,486),fill=RED)
        text(d,(117,375),'ZERO REPS.',99,'head',fill='white')
        panel(im,1,.3+local*.15)
        # Title stays in front of the panel border.
        d=ImageDraw.Draw(im); d.rectangle((91,379,680,486),fill=RED)
        text(d,(117,375),'ZERO REPS.',99,'head',fill='white')
    else:
        text(d,(94,281),'THE LONGEST',84,'head')
        text(d,(94,365),'REST TIMER.',84,'head',fill=BLUE)
        panel(im,0 if scene in (1,2) else 1,local/span)
        dialogue={1:("What’s the\nworkout?",False),2:('Waiting for\nmotivation.',True),3:("How long’s the\nrest timer?",False),4:('Since Monday.',True)}
        words,male=dialogue[scene]
        # A quiet held reaction before the punchline lands.
        delay=0
        if local>=delay: bubble(im,words,male,local-delay)
    return im

def device(im, screen, x,y,width):
    h=round(width*screen.height/screen.width)
    d=ImageDraw.Draw(im)
    d.rounded_rectangle((x-12,y-12,x+width+12,y+h+12),radius=44,fill=INK)
    img=screen.resize((width,h),Image.Resampling.LANCZOS)
    mask=Image.new('L',img.size,0); ImageDraw.Draw(mask).rounded_rectangle((0,0,width-1,h-1),radius=32,fill=255)
    im.paste(img,(x,y),mask)
    return h

def product_frame(scene,local,span):
    im=Image.new('RGB',(W,H),PAPER); brand(im);d=ImageDraw.Draw(im)
    if scene==5:
        text(d,(94,275),'YOUR WORKOUT.',94,'head')
        text(d,(94,371),'ALREADY PLANNED.',94,'head',fill=BLUE)
        shift=round(80*(1-ease(local/.38)))
        device(im,screens['plan'],148+shift,542,440)
        text(d,(660,715),'OPEN\nYOUR\nPLAN.',65,'head',spacing=5)
        d.line((660,963,850,963),fill=BLUE,width=6)
        text(d,(660,1016),'Get to\nwork.',44,'body',spacing=6)
    else:
        text(d,(94,275),'LOG THE SETS.',94,'head')
        text(d,(94,371),'MAKE IT COUNT.',94,'head',fill=BLUE)
        shift=round(70*(1-ease(local/.32)))
        device(im,screens['log'],205+shift,500,340)
        text(d,(635,650),'SETS.\nREPS.\nREST.',65,'head',spacing=8)
        d.line((635,928,825,928),fill=BLUE,width=6)
        text(d,(635,975),'Keep your\nrecord.',39,'body',spacing=6)
    text(d,(149,1536),'Actual Gruntz app screen',25,fill='#6a7068')
    return im

def end_frame(local,span):
    im=Image.new('RGB',(W,H),INK);d=ImageDraw.Draw(im)
    # A restrained final card, with every essential element above platform UI.
    mark=icon.resize((154,154),Image.Resampling.LANCZOS);im.paste(mark,(463,293),mark)
    text(d,(540,490),'Gruntz',87,'body',fill=PAPER,anchor='mt')
    text(d,(540,668),'REST TIMER’S OVER.',82,'head',fill=PAPER,anchor='mt')
    text(d,(540,769),'Your workout. Already planned.',43,'comic',fill=PAPER,anchor='mt')
    d.rounded_rectangle((187,942,893,1060),radius=12,fill=BLUE)
    text(d,(540,997),'Download Gruntz',49,'body',fill='white',anchor='mm')
    text(d,(540,1100),'For iPhone · gruntzfit.com',35,'body',fill=PAPER,anchor='mt')
    text(d,(540,1172),'15 days included. Subscription afterwards.',30,'body',fill='#b9c0b9',anchor='mt')
    return im

BOUNDS=[0,1.2,3.4,5.8,8.3,11,14.5,17.5,21]
def frame(t):
    scene=next((i for i in range(8) if BOUNDS[i]<=t<BOUNDS[i+1]),7)
    local=t-BOUNDS[scene];span=BOUNDS[scene+1]-BOUNDS[scene]
    if scene<5:return comic_frame(scene,t,local,span)
    if scene<7:return product_frame(scene,local,span)
    return end_frame(local,span)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--proof-only',action='store_true');args=parser.parse_args()
    OUT.mkdir(exist_ok=True);QA.mkdir(exist_ok=True)
    times=[.6,2,4.5,6.8,9.3,12.8,15.8,19]
    sheet=Image.new('RGB',(4*270,2*480),'white')
    for i,t in enumerate(times):
        im=frame(t);im.save(QA/f'frame-{t:04.1f}.jpg',quality=93)
        sheet.paste(im.resize((270,480),Image.Resampling.LANCZOS),((i%4)*270,(i//4)*480))
    sheet.save(QA/'storyboard.jpg',quality=94)
    cover=Image.new('RGB',(W,H),PAPER); brand(cover);cd=ImageDraw.Draw(cover)
    cd.rectangle((73,686,977,1515),fill=INK)
    cover_art=ImageOps.fit(panels[1],(892,817),method=Image.Resampling.LANCZOS)
    cover.paste(cover_art,(79,692))
    # Center the cover headline for 4:5 / square profile-grid crops.
    text(cd,(104,449),'30 MINUTES IN.',101,'head')
    cd.rectangle((100,560,800,681),fill=RED)
    text(cd,(123,561),'ZERO REPS.',106,'head',fill='white')
    cover.save(OUT/'since-monday-cover.jpg',quality=95)
    if args.proof_only:return
    cmd=['ffmpeg','-hide_banner','-loglevel','warning','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','pipe:0','-i',str(ASSETS/'since-monday-original.wav'),'-c:v','libx264','-preset','fast','-crf','18','-profile:v','high','-pix_fmt','yuv420p','-af','loudnorm=I=-18:TP=-1.5:LRA=8','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-movflags','+faststart','-t',str(DURATION),str(OUT/'gruntz-since-monday-1080x1920.mp4')]
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
    for i in range(FPS*DURATION):
        proc.stdin.write(frame(i/FPS).tobytes())
        if i%90==0:print(f'Rendered {i}/{FPS*DURATION} frames',flush=True)
    proc.stdin.close();rc=proc.wait()
    if rc:raise SystemExit(rc)
    print('Master exported.',flush=True)

if __name__=='__main__':main()
