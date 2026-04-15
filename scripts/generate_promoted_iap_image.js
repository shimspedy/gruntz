/**
 * Gruntz promoted subscription image generator.
 *
 * Creates a 1024x1024 App Store promotional image for Gruntz Pro that:
 * - is not a screenshot
 * - avoids price text
 * - visually represents premium tactical training access
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SIZE = 1024;
const OUTPUT_DIR = path.join(__dirname, '..', 'app-store-assets', 'promoted-iap');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'gruntz-pro-subscription-image.png');

const BRAND = {
  bg0: '#05070A',
  bg1: '#0B1117',
  bg2: '#111B24',
  lime: '#AAFF00',
  limeSoft: '#D6FF7A',
  cyan: '#00D9FF',
  gold: '#FFD700',
  white: '#F6FAFF',
  steel: '#1E2A33',
  steelLight: '#2E3B46',
  steelDark: '#10161C',
  shadow: 'rgba(0, 0, 0, 0.45)',
};

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function hexagonPath(ctx, cx, cy, radius, verticalScale = 1) {
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = (-Math.PI / 2) + (Math.PI / 3) * i;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius * verticalScale;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

function drawBackground(ctx) {
  const background = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  background.addColorStop(0, BRAND.bg0);
  background.addColorStop(0.55, BRAND.bg1);
  background.addColorStop(1, BRAND.bg2);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const radialGlow = ctx.createRadialGradient(SIZE * 0.52, SIZE * 0.42, 60, SIZE * 0.52, SIZE * 0.42, 560);
  radialGlow.addColorStop(0, 'rgba(0, 217, 255, 0.24)');
  radialGlow.addColorStop(0.4, 'rgba(170, 255, 0, 0.08)');
  radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = 40; x < SIZE; x += 56) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, SIZE);
    ctx.stroke();
  }
  for (let y = 40; y < SIZE; y += 56) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SIZE, y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(0, 217, 255, 0.12)';
  ctx.lineWidth = 2;
  for (const radius of [240, 310, 380]) {
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, radius, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }
  ctx.restore();

  const vignette = ctx.createRadialGradient(SIZE / 2, SIZE / 2, 320, SIZE / 2, SIZE / 2, 740);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.46)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, SIZE, SIZE);
}

function drawOrbitMarkers(ctx) {
  const points = [
    [170, 260, BRAND.cyan],
    [834, 206, BRAND.lime],
    [158, 726, BRAND.gold],
    [858, 772, BRAND.cyan],
  ];

  points.forEach(([x, y, color]) => {
    ctx.save();
    ctx.strokeStyle = `${color}55`;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawShield(ctx, cx, cy, scale) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.shadowColor = 'rgba(170, 255, 0, 0.38)';
  ctx.shadowBlur = 32;

  hexagonPath(ctx, 0, 0, 112 * scale, 1.06);
  const shell = ctx.createLinearGradient(0, -120 * scale, 0, 120 * scale);
  shell.addColorStop(0, 'rgba(255, 215, 0, 0.98)');
  shell.addColorStop(0.5, 'rgba(170, 255, 0, 0.96)');
  shell.addColorStop(1, 'rgba(0, 217, 255, 0.92)');
  ctx.fillStyle = shell;
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.lineWidth = 6 * scale;
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.stroke();

  hexagonPath(ctx, 0, 0, 84 * scale, 1.02);
  const inner = ctx.createLinearGradient(0, -100 * scale, 0, 100 * scale);
  inner.addColorStop(0, 'rgba(8, 16, 20, 0.2)');
  inner.addColorStop(1, 'rgba(5, 9, 14, 0.85)');
  ctx.fillStyle = inner;
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2 * scale;
  ctx.stroke();

  ctx.strokeStyle = BRAND.white;
  ctx.lineWidth = 10 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-34 * scale, 0);
  ctx.lineTo(-6 * scale, 28 * scale);
  ctx.lineTo(42 * scale, -24 * scale);
  ctx.stroke();

  ctx.restore();
}

function drawPass(ctx) {
  const cardX = 256;
  const cardY = 240;
  const cardW = 512;
  const cardH = 566;

  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2 + 8);
  ctx.rotate((-8 * Math.PI) / 180);
  ctx.translate(-SIZE / 2, -SIZE / 2);

  ctx.shadowColor = BRAND.shadow;
  ctx.shadowBlur = 46;
  ctx.shadowOffsetY = 28;

  roundRect(ctx, cardX, cardY, cardW, cardH, 56);
  const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  cardGradient.addColorStop(0, 'rgba(18, 28, 35, 0.98)');
  cardGradient.addColorStop(0.55, 'rgba(13, 20, 26, 0.98)');
  cardGradient.addColorStop(1, 'rgba(34, 48, 58, 0.98)');
  ctx.fillStyle = cardGradient;
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.stroke();

  roundRect(ctx, cardX + 18, cardY + 18, cardW - 36, cardH - 36, 42);
  ctx.strokeStyle = 'rgba(170,255,0,0.24)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const band = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
  band.addColorStop(0, BRAND.gold);
  band.addColorStop(0.52, BRAND.lime);
  band.addColorStop(1, BRAND.cyan);
  ctx.fillStyle = band;
  roundRect(ctx, cardX, cardY, cardW, 92, 56);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.24)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + 36, cardY + 130);
  ctx.lineTo(cardX + cardW - 36, cardY + 130);
  ctx.stroke();

  const rowY = [620, 684, 748];
  rowY.forEach((y, index) => {
    ctx.fillStyle = index === 0 ? BRAND.lime : index === 1 ? BRAND.cyan : BRAND.gold;
    roundRect(ctx, 334, y, 54, 20, 10);
    ctx.fill();

    const line = ctx.createLinearGradient(0, y, 0, y + 22);
    line.addColorStop(0, 'rgba(246,250,255,0.92)');
    line.addColorStop(1, 'rgba(246,250,255,0.42)');
    ctx.fillStyle = line;
    roundRect(ctx, 410, y - 6, 244, 18, 9);
    ctx.fill();

    ctx.fillStyle = 'rgba(246,250,255,0.2)';
    roundRect(ctx, 410, y + 20, 164, 12, 6);
    ctx.fill();
  });

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = BRAND.white;
  ctx.lineWidth = 2;
  for (let x = cardX + 28; x < cardX + cardW; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, cardY + 146);
    ctx.lineTo(x, cardY + cardH - 28);
    ctx.stroke();
  }
  ctx.restore();

  drawShield(ctx, SIZE / 2, 468, 1);

  ctx.save();
  ctx.strokeStyle = 'rgba(246,250,255,0.18)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(294, 814);
  ctx.lineTo(728, 814);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

function drawCornerAccents(ctx) {
  const corners = [
    [80, 86, 1, 1],
    [SIZE - 80, 86, -1, 1],
    [80, SIZE - 86, 1, -1],
    [SIZE - 80, SIZE - 86, -1, -1],
  ];

  corners.forEach(([x, y, sx, sy]) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);
    ctx.strokeStyle = 'rgba(170,255,0,0.34)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(54, 0);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 54);
    ctx.stroke();
    ctx.restore();
  });
}

function generate() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');

  drawBackground(ctx);
  drawOrbitMarkers(ctx);
  drawCornerAccents(ctx);
  drawPass(ctx);

  const halo = ctx.createRadialGradient(SIZE / 2, SIZE / 2 + 18, 40, SIZE / 2, SIZE / 2 + 18, 320);
  halo.addColorStop(0, 'rgba(255,255,255,0.2)');
  halo.addColorStop(0.5, 'rgba(170,255,0,0.05)');
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, SIZE, SIZE);

  fs.writeFileSync(OUTPUT_PATH, canvas.toBuffer('image/png'));
  console.log(`Generated ${OUTPUT_PATH}`);
}

generate();
