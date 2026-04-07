import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'assets', 'animations', 'game');

function kfScalar(from, to, start = 0, end = 60) {
  return [
    {
      t: start,
      s: [from],
      e: [to],
      i: { x: [0.667], y: [1] },
      o: { x: [0.333], y: [0] },
    },
    { t: end, s: [to] },
  ];
}

function kfVector(from, to, start = 0, end = 60) {
  return [
    {
      t: start,
      s: [...from],
      e: [...to],
      i: { x: [0.667, 0.667, 0.667], y: [1, 1, 1] },
      o: { x: [0.333, 0.333, 0.333], y: [0, 0, 0] },
    },
    { t: end, s: [...to] },
  ];
}

function baseAnimation(layers) {
  return {
    v: '5.7.15',
    fr: 60,
    ip: 0,
    op: 60,
    w: 128,
    h: 128,
    nm: 'Gruntz HUD',
    ddd: 0,
    assets: [],
    layers,
  };
}

function ellipseStrokeLayer({
  name,
  size,
  strokeWidth,
  color = [1, 1, 1, 1],
  opacity = 100,
  scaleFrom = 85,
  scaleTo = 112,
  opacityFrom = opacity,
  opacityTo = 0,
  start = 0,
  end = 60,
}) {
  return {
    ddd: 0,
    ind: 1,
    ty: 4,
    nm: name,
    sr: 1,
    ks: {
      o: { a: 0, k: 100, ix: 11 },
      r: { a: 0, k: 0, ix: 10 },
      p: { a: 0, k: [64, 64, 0], ix: 2 },
      a: { a: 0, k: [0, 0, 0], ix: 1 },
      s: { a: 1, k: kfVector([scaleFrom, scaleFrom, 100], [scaleTo, scaleTo, 100], start, end), ix: 6 },
    },
    ao: 0,
    shapes: [
      {
        ty: 'gr',
        it: [
          {
            ty: 'el',
            p: { a: 0, k: [0, 0], ix: 3 },
            s: { a: 0, k: [size, size], ix: 2 },
            nm: 'Ellipse Path 1',
            mn: 'ADBE Vector Shape - Ellipse',
            hd: false,
          },
          {
            ty: 'st',
            c: { a: 0, k: color, ix: 3 },
            o: { a: 0, k: 100, ix: 4 },
            w: { a: 0, k: strokeWidth, ix: 5 },
            lc: 2,
            lj: 1,
            bm: 0,
            nm: 'Stroke 1',
            mn: 'ADBE Vector Graphic - Stroke',
            hd: false,
          },
          {
            ty: 'tr',
            p: { a: 0, k: [0, 0], ix: 2 },
            a: { a: 0, k: [0, 0], ix: 1 },
            s: { a: 0, k: [100, 100], ix: 3 },
            r: { a: 0, k: 0, ix: 6 },
            o: { a: 1, k: kfScalar(opacityFrom, opacityTo, start, end), ix: 7 },
            sk: { a: 0, k: 0, ix: 4 },
            sa: { a: 0, k: 0, ix: 5 },
            nm: 'Transform',
          },
        ],
        nm: `${name} Group`,
        np: 2,
        cix: 2,
        bm: 0,
        ix: 1,
        mn: 'ADBE Vector Group',
        hd: false,
      },
    ],
    ip: 0,
    op: 60,
    st: 0,
    bm: 0,
  };
}

function ellipseFillLayer({
  name,
  size,
  color = [1, 1, 1, 1],
  opacity = 18,
  scaleFrom = 100,
  scaleTo = 114,
  start = 0,
  end = 60,
}) {
  return {
    ddd: 0,
    ind: 2,
    ty: 4,
    nm: name,
    sr: 1,
    ks: {
      o: { a: 0, k: 100, ix: 11 },
      r: { a: 0, k: 0, ix: 10 },
      p: { a: 0, k: [64, 64, 0], ix: 2 },
      a: { a: 0, k: [0, 0, 0], ix: 1 },
      s: { a: 1, k: kfVector([scaleFrom, scaleFrom, 100], [scaleTo, scaleTo, 100], start, end), ix: 6 },
    },
    ao: 0,
    shapes: [
      {
        ty: 'gr',
        it: [
          {
            ty: 'el',
            p: { a: 0, k: [0, 0], ix: 3 },
            s: { a: 0, k: [size, size], ix: 2 },
            nm: 'Ellipse Path 1',
            mn: 'ADBE Vector Shape - Ellipse',
            hd: false,
          },
          {
            ty: 'fl',
            c: { a: 0, k: color, ix: 4 },
            o: { a: 0, k: opacity, ix: 5 },
            r: 1,
            bm: 0,
            nm: 'Fill 1',
            mn: 'ADBE Vector Graphic - Fill',
            hd: false,
          },
          {
            ty: 'tr',
            p: { a: 0, k: [0, 0], ix: 2 },
            a: { a: 0, k: [0, 0], ix: 1 },
            s: { a: 0, k: [100, 100], ix: 3 },
            r: { a: 0, k: 0, ix: 6 },
            o: { a: 0, k: 100, ix: 7 },
            sk: { a: 0, k: 0, ix: 4 },
            sa: { a: 0, k: 0, ix: 5 },
            nm: 'Transform',
          },
        ],
        nm: `${name} Group`,
        np: 2,
        cix: 2,
        bm: 0,
        ix: 1,
        mn: 'ADBE Vector Group',
        hd: false,
      },
    ],
    ip: 0,
    op: 60,
    st: 0,
    bm: 0,
  };
}

function sweepLayer() {
  return {
    ddd: 0,
    ind: 3,
    ty: 4,
    nm: 'Sweep',
    sr: 1,
    ks: {
      o: { a: 0, k: 100, ix: 11 },
      r: { a: 1, k: kfScalar(0, 360), ix: 10 },
      p: { a: 0, k: [64, 64, 0], ix: 2 },
      a: { a: 0, k: [0, 0, 0], ix: 1 },
      s: { a: 0, k: [100, 100, 100], ix: 6 },
    },
    ao: 0,
    shapes: [
      {
        ty: 'gr',
        it: [
          {
            ty: 'rc',
            d: 1,
            s: { a: 0, k: [4, 44], ix: 2 },
            p: { a: 0, k: [0, -24], ix: 3 },
            r: { a: 0, k: 2, ix: 4 },
            nm: 'Rectangle Path 1',
            mn: 'ADBE Vector Shape - Rect',
            hd: false,
          },
          {
            ty: 'fl',
            c: { a: 0, k: [1, 1, 1, 1], ix: 4 },
            o: { a: 0, k: 42, ix: 5 },
            r: 1,
            bm: 0,
            nm: 'Fill 1',
            mn: 'ADBE Vector Graphic - Fill',
            hd: false,
          },
          {
            ty: 'tr',
            p: { a: 0, k: [0, 0], ix: 2 },
            a: { a: 0, k: [0, 0], ix: 1 },
            s: { a: 0, k: [100, 100], ix: 3 },
            r: { a: 0, k: 0, ix: 6 },
            o: { a: 0, k: 100, ix: 7 },
            sk: { a: 0, k: 0, ix: 4 },
            sa: { a: 0, k: 0, ix: 5 },
            nm: 'Transform',
          },
        ],
        nm: 'Sweep Group',
        np: 2,
        cix: 2,
        bm: 0,
        ix: 1,
        mn: 'ADBE Vector Group',
        hd: false,
      },
    ],
    ip: 0,
    op: 60,
    st: 0,
    bm: 0,
  };
}

function diamondBurstLayer(rotation = 0) {
  return {
    ddd: 0,
    ind: 4 + rotation,
    ty: 4,
    nm: `Burst ${rotation}`,
    sr: 1,
    ks: {
      o: { a: 1, k: kfScalar(0, 38, 0, 12).concat(kfScalar(38, 0, 12, 60).slice(1)), ix: 11 },
      r: { a: 0, k: rotation, ix: 10 },
      p: { a: 0, k: [64, 64, 0], ix: 2 },
      a: { a: 0, k: [0, 0, 0], ix: 1 },
      s: { a: 1, k: kfVector([70, 70, 100], [108, 108, 100], 0, 60), ix: 6 },
    },
    ao: 0,
    shapes: [
      {
        ty: 'gr',
        it: [
          {
            ty: 'rc',
            d: 1,
            s: { a: 0, k: [56, 4], ix: 2 },
            p: { a: 0, k: [0, 0], ix: 3 },
            r: { a: 0, k: 2, ix: 4 },
            nm: 'Rectangle Path 1',
            mn: 'ADBE Vector Shape - Rect',
            hd: false,
          },
          {
            ty: 'fl',
            c: { a: 0, k: [1, 1, 1, 1], ix: 4 },
            o: { a: 0, k: 36, ix: 5 },
            r: 1,
            bm: 0,
            nm: 'Fill 1',
            mn: 'ADBE Vector Graphic - Fill',
            hd: false,
          },
          {
            ty: 'tr',
            p: { a: 0, k: [0, 0], ix: 2 },
            a: { a: 0, k: [0, 0], ix: 1 },
            s: { a: 0, k: [100, 100], ix: 3 },
            r: { a: 0, k: 45, ix: 6 },
            o: { a: 0, k: 100, ix: 7 },
            sk: { a: 0, k: 0, ix: 4 },
            sa: { a: 0, k: 0, ix: 5 },
            nm: 'Transform',
          },
        ],
        nm: 'Burst Group',
        np: 2,
        cix: 2,
        bm: 0,
        ix: 1,
        mn: 'ADBE Vector Group',
        hd: false,
      },
    ],
    ip: 0,
    op: 60,
    st: 0,
    bm: 0,
  };
}

function makePulseAnimation() {
  return baseAnimation([
    ellipseFillLayer({ name: 'Core', size: 54, opacity: 10, scaleFrom: 96, scaleTo: 104 }),
    ellipseStrokeLayer({ name: 'Outer Ring', size: 68, strokeWidth: 4, opacity: 30, scaleFrom: 82, scaleTo: 118 }),
    ellipseStrokeLayer({ name: 'Echo Ring', size: 74, strokeWidth: 2, opacity: 18, scaleFrom: 70, scaleTo: 126, start: 10, end: 60 }),
  ]);
}

function makeScanAnimation() {
  return baseAnimation([
    ellipseFillLayer({ name: 'Core', size: 48, opacity: 8, scaleFrom: 96, scaleTo: 102 }),
    ellipseStrokeLayer({ name: 'Radar Ring', size: 72, strokeWidth: 3, opacity: 26, scaleFrom: 96, scaleTo: 104, opacityTo: 18 }),
    sweepLayer(),
  ]);
}

function makeBurstAnimation() {
  return baseAnimation([
    ellipseFillLayer({ name: 'Core', size: 52, opacity: 10, scaleFrom: 94, scaleTo: 108 }),
    ellipseStrokeLayer({ name: 'Reward Ring', size: 66, strokeWidth: 3, opacity: 32, scaleFrom: 78, scaleTo: 118 }),
    diamondBurstLayer(0),
    diamondBurstLayer(90),
  ]);
}

function writeDotLottie({ id, fileName, animation }) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gruntz-lottie-'));
  const animationDir = path.join(tempRoot, 'animations');
  fs.mkdirSync(animationDir, { recursive: true });
  fs.writeFileSync(
    path.join(tempRoot, 'manifest.json'),
    JSON.stringify(
      {
        version: '1',
        generator: 'gruntz-script',
        activeAnimationId: id,
        animations: [
          {
            id,
            autoplay: true,
            loop: true,
            speed: 1,
            direction: 1,
            playMode: 'normal',
          },
        ],
      },
      null,
      2
    )
  );
  fs.writeFileSync(path.join(animationDir, `${id}.json`), JSON.stringify(animation));
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, fileName);
  if (fs.existsSync(outFile)) {
    fs.rmSync(outFile);
  }
  execFileSync('zip', ['-qr', outFile, 'manifest.json', 'animations'], { cwd: tempRoot });
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

writeDotLottie({ id: 'hud-pulse', fileName: 'hud-pulse.lottie', animation: makePulseAnimation() });
writeDotLottie({ id: 'hud-scan', fileName: 'hud-scan.lottie', animation: makeScanAnimation() });
writeDotLottie({ id: 'hud-burst', fileName: 'hud-burst.lottie', animation: makeBurstAnimation() });

console.log('Generated dotLottie assets in assets/animations/game');
