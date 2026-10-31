#!/usr/bin/env node
/* Deterministic typesetting/composition only. Artwork and app screens are placed as assets. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { createCanvas, loadImage, GlobalFonts } = require('/Users/johnhashim/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const ROOT = __dirname;
const REPO = path.resolve(ROOT, '../..');
const draft=process.argv.includes('--draft');
const creatives = require('./creative.json');
const C = { paper:'#F6F3EB', ink:'#111411', blue:'#2D8CFF', black:'#050607', gray:'#BEC2C8', white:'#FFFFFF' };
for (const [weight, name] of [[400,'400Regular'],[500,'500Medium'],[600,'600SemiBold'],[700,'700Bold'],[800,'800ExtraBold'],[900,'900Black']]) {
  GlobalFonts.registerFromPath(path.join(REPO,`node_modules/@expo-google-fonts/dm-sans/${name}/DMSans_${name}.ttf`),'DM Sans');
}
const outDir=path.join(ROOT,'exports'); fs.mkdirSync(outDir,{recursive:true});
const measurements=[];
function round(ctx,x,y,w,h,r,fill,stroke=null,lw=1){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.stroke();}}
function font(ctx,size=32,weight=600){ctx.font=`${weight} ${size}px "DM Sans"`;}
function txt(ctx,text,x,y,size=32,weight=600,color=C.ink,maxWidth=null){font(ctx,size,weight);ctx.fillStyle=color;ctx.textBaseline='top';const width=ctx.measureText(text).width;if(maxWidth && width>maxWidth+0.5) throw new Error(`Text overflow ${text}: ${width}>${maxWidth}`);ctx.fillText(text,x,y);}
function multiline(ctx,text,x,y,size,weight,color,maxWidth,lineHeight=1.08){text.split('\n').forEach((line,i)=>txt(ctx,line,x,y+i*size*lineHeight,size,weight,color,maxWidth));}
function fitted(ctx,text,x,y,size,weight,color,maxWidth){while(size>16){font(ctx,size,weight);if(ctx.measureText(text).width<=maxWidth)break;size-=0.5;}txt(ctx,text,x,y,size,weight,color,maxWidth);return size;}
function bubble(ctx,text,x,y,w,h,speaker){
  const tx=x+w*speaker, ty=y+h+28;
  ctx.beginPath();ctx.moveTo(tx-16,y+h-2);ctx.lineTo(tx,ty);ctx.lineTo(tx+10,y+h-2);ctx.fillStyle=C.white;ctx.fill();ctx.strokeStyle=C.ink;ctx.lineWidth=2;ctx.stroke();
  round(ctx,x,y,w,h,28,C.white,C.ink,2);
  let size=29; font(ctx,size,700);while(ctx.measureText(text).width>w-34){size-=0.5;font(ctx,size,700);}
  const width=ctx.measureText(text).width;txt(ctx,text,x+(w-width)/2,y+(h-size)/2-1,size,700,C.ink,w-34);
}
async function render(ad,format){
  const story=format==='story'; const W=1080,H=story?1920:1350;
  const canvas=createCanvas(W,H),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.fillStyle=C.paper;ctx.fillRect(0,0,W,H);
  const art=await loadImage(path.join(ROOT,`art/${ad.id}.png`));
  const shot=await loadImage(path.join(ROOT,'source-screens',ad.screen));
  const icon=await loadImage(path.join(REPO,'assets/icon.png'));
  const headY=story?150:34; const titleY=story?254:128;
  ctx.save();ctx.beginPath();ctx.roundRect(48,headY,62,62,14);ctx.clip();ctx.drawImage(icon,48,headY,62,62);ctx.restore();
  txt(ctx,'Gruntz',125,headY+2,48,800,C.ink);
  font(ctx,22,800);const tag=ad.branch.toUpperCase();const tagW=ctx.measureText(tag).width+36;
  round(ctx,1032-tagW,headY+12,tagW,39,19.5,null,'#8B8D86',1.4);txt(ctx,tag,1050-tagW,headY+20,22,800,C.ink);
  fitted(ctx,ad.headline,48,titleY,72,900,C.ink,984);
  const artX=44,artY=story?378:220,artW=992,artH=Math.round(artW*art.height/art.width);
  ctx.drawImage(art,artX,artY,artW,artH);
  const bw=447,bh=72,by=artY+18;
  bubble(ctx,ad.dialogue[0],artX+20,by,bw,bh,ad.speaker[0]);
  bubble(ctx,ad.dialogue[1],artX+artW/2+19,by,bw,bh,ad.speaker[1]);
  const heroTop=story?900:704;
  ctx.fillStyle=C.black;ctx.fillRect(0,heroTop,W,H-heroTop);
  ctx.fillStyle=C.blue;ctx.fillRect(48,heroTop+41,64,5);
  if(story){
    txt(ctx,'YOUR TRAINING. ON RECORD.',48,heroTop+74,22,800,C.gray);
    multiline(ctx,ad.hero,48,heroTop+133,58,800,C.white,580,1.04);
    multiline(ctx,ad.body,48,heroTop+300,32,500,C.gray,540,1.3);
    txt(ctx,ad.feature,48,heroTop+440,20,800,'#74B4FF',580);
    drawCTA(ctx,48,heroTop+548,360,82);
    drawPhone(ctx,shot,704,heroTop+148,294);
    txt(ctx,'Independent fitness app. No U.S. military endorsement.',48,1643,20,500,'#8C9299');
  } else {
    txt(ctx,'YOUR TRAINING. ON RECORD.',48,heroTop+76,20,800,C.gray);
    multiline(ctx,ad.hero,48,heroTop+126,55,800,C.white,630,1.04);
    multiline(ctx,ad.body,48,heroTop+279,29,500,C.gray,610,1.28);
    txt(ctx,ad.feature,48,heroTop+395,18,800,'#74B4FF',620);
    drawCTA(ctx,48,heroTop+465,338,78);
    drawPhone(ctx,shot,737,heroTop-11,266);
    txt(ctx,'Independent fitness app. No U.S. military endorsement.',48,1311,18,500,'#8C9299');
  }
  const base=`${ad.id}-${format}`;
  fs.writeFileSync(path.join(outDir,base+'.png'),canvas.toBuffer('image/png'));
  fs.writeFileSync(path.join(outDir,base+'.jpg'),canvas.toBuffer('image/jpeg',95));
  measurements.push({id:ad.id,format,width:W,height:H,artWidth:art.width,artHeight:art.height,screen:ad.screen,screenWidth:shot.width,screenHeight:shot.height});
  console.log(`wrote ${base} (${W}×${H})`);
}
function drawCTA(ctx,x,y,w,h){round(ctx,x,y,w,h,15,C.blue);txt(ctx,'GET GRUNTZ',x+25,y+24,30,900,C.white);txt(ctx,'↗',x+w-55,y+21,34,700,C.white);}
function drawPhone(ctx,shot,x,y,w){
  const h=w*shot.height/shot.width,pad=10;
  ctx.save();ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=30;ctx.shadowOffsetY=14;
  round(ctx,x-pad,y-pad,w+pad*2,h+pad*2,34,'#16191E','#6C7177',2);
  ctx.restore();
  // The complete original screenshot is scaled without redrawing, retouching or cropping its contents.
  ctx.drawImage(shot,x,y,w,h);
  measurements.push({screenInset:true,x,y,w,h,sourceRatio:shot.width/shot.height,insertRatio:w/h,fullSource:true});
}
async function contactSheet(){
  const available=creatives.filter(ad=>fs.existsSync(path.join(outDir,`${ad.id}-feed.png`)));
  const W=1440, cardW=440,cardH=550,pad=30,header=120,H=header+Math.ceil(available.length/3)*(cardH+64)+pad;
  const c=createCanvas(W,H),ctx=c.getContext('2d');ctx.fillStyle='#E7E5DF';ctx.fillRect(0,0,W,H);txt(ctx,'GRUNTZ  /  SIX BRANCHES',30,27,40,900);txt(ctx,'Original comic variations · actual app screens',30,77,22,500,'#555B55');
  for(let i=0;i<available.length;i++){const ad=available[i],x=pad+(i%3)*(cardW+pad),y=header+Math.floor(i/3)*(cardH+64);ctx.drawImage(await loadImage(path.join(outDir,`${ad.id}-feed.png`)),x,y,cardW,cardH);txt(ctx,ad.branch,x,y+cardH+13,23,800);}
  fs.writeFileSync(path.join(outDir,'all-branches-preview.jpg'),c.toBuffer('image/jpeg',93));
}
function archive(){
  const copyPath=path.join(outDir,'creative-copy.txt');
  fs.writeFileSync(copyPath,'GRUNTZ — SIX-BRANCH COMIC COLLECTION\n12 JPG placements: 1080×1350 feed and 1080×1920 story.\nAll local draft creative; not published.\n\n'+creatives.map(ad=>`${ad.branch}\nPrimary text: ${ad.caption}\nHeadline: ${ad.metaHeadline}\nCTA: Download\n`).join('\n'));
  const zipPath=path.join(outDir,'gruntz-six-branches-jpg.zip');
  fs.rmSync(zipPath,{force:true});
  const files=creatives.flatMap(ad=>['feed','story'].map(format=>path.join(outDir,`${ad.id}-${format}.jpg`)));
  execFileSync('/usr/bin/zip',['-j','-q',zipPath,...files,copyPath]);
  console.log('wrote JPG archive');
}
(async()=>{let rendered=0;for(const ad of creatives){if(!fs.existsSync(path.join(ROOT,`art/${ad.id}.png`))){console.log(`waiting for ${ad.id} art`);continue;}await render(ad,'feed');await render(ad,'story');rendered++;}await contactSheet();if(rendered===creatives.length&&!draft)archive();fs.writeFileSync(path.join(ROOT,'render-audit.json'),JSON.stringify({rendered,expected:6,draft,measurements},null,2));})().catch(e=>{console.error(e);process.exit(1);});
