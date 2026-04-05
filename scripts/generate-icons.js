/**
 * Gruntz App Icon Generator
 * 
 * Generates military-cyberpunk branded app icons:
 * - icon.png (1024x1024) — iOS App Store icon
 * - adaptive-icon.png (1024x1024) — Android adaptive icon foreground
 * - splash-icon.png (512x512) — Splash screen logo
 * - favicon.png (48x48) — Web favicon
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const BRAND = {
  bg: '#0A0A0F',
  bgDark: '#050508',
  accent: '#00D9FF',
  accentGlow: '#00D9FF',
  accentDim: '#0088AA',
  green: '#00FF88',
  gold: '#FFD700',
  textLight: '#E8E8F0',
};

function generateIcon(size, outputName, options = {}) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const { isAdaptive = false, isSplash = false } = options;

  // Background
  if (isSplash) {
    ctx.fillStyle = BRAND.bg;
    ctx.fillRect(0, 0, size, size);
  } else {
    // Gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, size, size);
    bgGrad.addColorStop(0, '#0D0D15');
    bgGrad.addColorStop(0.5, '#0A0A0F');
    bgGrad.addColorStop(1, '#08081A');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);
  }

  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 1024;

  if (!isSplash) {
    // Subtle grid pattern (military tactical)
    ctx.strokeStyle = 'rgba(0, 217, 255, 0.03)';
    ctx.lineWidth = 1 * scale;
    const gridSize = 64 * scale;
    for (let x = 0; x < size; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y < size; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
  }

  // Outer glow ring
  const ringRadius = 380 * scale;
  const glowGrad = ctx.createRadialGradient(cx, cy, ringRadius - 40 * scale, cx, cy, ringRadius + 60 * scale);
  glowGrad.addColorStop(0, 'rgba(0, 217, 255, 0)');
  glowGrad.addColorStop(0.4, 'rgba(0, 217, 255, 0.08)');
  glowGrad.addColorStop(0.7, 'rgba(0, 217, 255, 0.15)');
  glowGrad.addColorStop(1, 'rgba(0, 217, 255, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, size, size);

  // Hexagonal shield shape
  const shieldRadius = 320 * scale;
  const hexPoints = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const r = i % 2 === 0 ? shieldRadius : shieldRadius * 0.92;
    hexPoints.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }

  // Shield border glow
  ctx.save();
  ctx.shadowColor = BRAND.accentGlow;
  ctx.shadowBlur = 30 * scale;
  ctx.beginPath();
  ctx.moveTo(hexPoints[0].x, hexPoints[0].y);
  for (let i = 1; i < hexPoints.length; i++) {
    ctx.lineTo(hexPoints[i].x, hexPoints[i].y);
  }
  ctx.closePath();
  ctx.strokeStyle = BRAND.accent;
  ctx.lineWidth = 3 * scale;
  ctx.stroke();
  ctx.restore();

  // Shield fill
  ctx.beginPath();
  ctx.moveTo(hexPoints[0].x, hexPoints[0].y);
  for (let i = 1; i < hexPoints.length; i++) {
    ctx.lineTo(hexPoints[i].x, hexPoints[i].y);
  }
  ctx.closePath();
  const shieldGrad = ctx.createLinearGradient(cx, cy - shieldRadius, cx, cy + shieldRadius);
  shieldGrad.addColorStop(0, 'rgba(0, 217, 255, 0.12)');
  shieldGrad.addColorStop(0.5, 'rgba(10, 10, 15, 0.95)');
  shieldGrad.addColorStop(1, 'rgba(0, 217, 255, 0.06)');
  ctx.fillStyle = shieldGrad;
  ctx.fill();

  // Inner accent lines (military chevron marks)
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 217, 255, 0.15)';
  ctx.lineWidth = 2 * scale;
  // Top chevron
  ctx.beginPath();
  ctx.moveTo(cx - 120 * scale, cy - 200 * scale);
  ctx.lineTo(cx, cy - 160 * scale);
  ctx.lineTo(cx + 120 * scale, cy - 200 * scale);
  ctx.stroke();
  // Bottom chevron
  ctx.beginPath();
  ctx.moveTo(cx - 120 * scale, cy + 200 * scale);
  ctx.lineTo(cx, cy + 160 * scale);
  ctx.lineTo(cx + 120 * scale, cy + 200 * scale);
  ctx.stroke();
  ctx.restore();

  // Big "G" letter
  ctx.save();
  ctx.shadowColor = BRAND.accentGlow;
  ctx.shadowBlur = 40 * scale;

  const fontSize = 420 * scale;
  ctx.font = `900 ${fontSize}px "Helvetica Neue", "Arial Black", Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // G gradient fill
  const textGrad = ctx.createLinearGradient(cx - 150 * scale, cy - 180 * scale, cx + 150 * scale, cy + 180 * scale);
  textGrad.addColorStop(0, '#FFFFFF');
  textGrad.addColorStop(0.3, '#E0F7FF');
  textGrad.addColorStop(0.6, BRAND.accent);
  textGrad.addColorStop(1, BRAND.accentDim);
  ctx.fillStyle = textGrad;
  ctx.fillText('G', cx + 8 * scale, cy + 15 * scale);

  // G outline for crispness
  ctx.strokeStyle = 'rgba(0, 217, 255, 0.4)';
  ctx.lineWidth = 2 * scale;
  ctx.strokeText('G', cx + 8 * scale, cy + 15 * scale);
  ctx.restore();

  // Small accent dot (bottom right, like a status indicator)
  ctx.save();
  ctx.shadowColor = BRAND.green;
  ctx.shadowBlur = 15 * scale;
  ctx.fillStyle = BRAND.green;
  ctx.beginPath();
  ctx.arc(cx + 180 * scale, cy + 180 * scale, 18 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Corner accent lines (tactical HUD feel)
  const cornerLen = 60 * scale;
  const cornerPad = 80 * scale;
  ctx.strokeStyle = 'rgba(0, 217, 255, 0.3)';
  ctx.lineWidth = 3 * scale;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(cornerPad, cornerPad);
  ctx.lineTo(cornerPad + cornerLen, cornerPad);
  ctx.moveTo(cornerPad, cornerPad);
  ctx.lineTo(cornerPad, cornerPad + cornerLen);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(size - cornerPad, cornerPad);
  ctx.lineTo(size - cornerPad - cornerLen, cornerPad);
  ctx.moveTo(size - cornerPad, cornerPad);
  ctx.lineTo(size - cornerPad, cornerPad + cornerLen);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(cornerPad, size - cornerPad);
  ctx.lineTo(cornerPad + cornerLen, size - cornerPad);
  ctx.moveTo(cornerPad, size - cornerPad);
  ctx.lineTo(cornerPad, size - cornerPad - cornerLen);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(size - cornerPad, size - cornerPad);
  ctx.lineTo(size - cornerPad - cornerLen, size - cornerPad);
  ctx.moveTo(size - cornerPad, size - cornerPad);
  ctx.lineTo(size - cornerPad, size - cornerPad - cornerLen);
  ctx.stroke();

  // Save file
  const outPath = path.join(__dirname, '..', 'assets', outputName);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outPath, buffer);
  console.log(`✓ Generated ${outputName} (${size}x${size})`);
}

// Generate all icon variants
generateIcon(1024, 'icon.png');
generateIcon(1024, 'adaptive-icon.png', { isAdaptive: true });
generateIcon(512, 'splash-icon.png', { isSplash: true });
generateIcon(48, 'favicon.png');

console.log('\n✅ All Gruntz icons generated!');
