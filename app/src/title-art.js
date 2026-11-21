// Poster lettering: an original extruded chrome display title with neon
// striping, plus the supporting cast tags, tagline, billing block and seal.
// The font stack uses only common system faces; no game font file is loaded.

import { hexToRgba } from './backdrop-art.js';

const DISPLAY_FONT = "'Arial Black', Impact, 'Segoe UI Black', sans-serif";
const LABEL_FONT = "Arial, 'Helvetica Neue', sans-serif";

const stripePatternCache = new Map();

function stripePattern(ctx, colors) {
  const key = colors.join('|');
  if (stripePatternCache.has(key)) return stripePatternCache.get(key);
  const tile = document.createElement('canvas');
  tile.width = 8;
  tile.height = 22;
  const tctx = tile.getContext('2d');
  tctx.fillStyle = colors[0];
  tctx.fillRect(0, 0, 8, 11);
  tctx.fillStyle = colors[1];
  tctx.fillRect(0, 11, 8, 11);
  const pattern = ctx.createPattern(tile, 'repeat');
  stripePatternCache.set(key, pattern);
  return pattern;
}

function fittedFont(ctx, text, maxWidth, startSize, family, weight = 900) {
  let size = startSize;
  while (size > 6) {
    ctx.font = `${weight} ${Math.round(size)}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  return Math.round(size);
}

function setTracking(ctx, value) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${value}px`;
}

export function drawTitleRibbon(ctx, box, treatment) {
  const { x, y, w, h } = box;
  const skew = h * 0.16;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + skew, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - skew, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();

  const ribbon = ctx.createLinearGradient(0, y, 0, y + h);
  ribbon.addColorStop(0, 'rgba(10,4,20,0.86)');
  ribbon.addColorStop(0.5, 'rgba(26,8,38,0.78)');
  ribbon.addColorStop(1, 'rgba(8,3,16,0.9)');
  ctx.fillStyle = ribbon;
  ctx.fill();

  ctx.lineWidth = Math.max(2, h * 0.018);
  ctx.strokeStyle = hexToRgba(treatment.accent, 0.8);
  ctx.stroke();
  ctx.lineWidth = Math.max(1, h * 0.007);
  ctx.strokeStyle = hexToRgba('#fff4d0', 0.5);
  ctx.stroke();
  ctx.restore();
}

// Draws the headline with a stepped extrusion, an outer glow, a chrome
// gradient body, diagonal neon stripes and a glossy top-light pass.
export function drawChromeTitle(ctx, text, box, treatment) {
  const { x, y, w, h } = box;
  const display = String(text || '').toUpperCase();
  if (!display.trim()) return;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  setTracking(ctx, -w * 0.002);
  const size = fittedFont(ctx, display, w * 0.94, h * 0.78, DISPLAY_FONT, 900);
  ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
  const cx = x + w / 2;
  const cy = y + h / 2 + size * 0.04;
  const depth = Math.max(3, size * 0.075);

  // Soft neon bloom behind the letterforms.
  ctx.save();
  ctx.shadowColor = treatment.glow;
  ctx.shadowBlur = size * 0.42;
  ctx.fillStyle = hexToRgba(treatment.glow, 0.42);
  ctx.fillText(display, cx, cy);
  ctx.restore();

  // Stepped extrusion towards the lower right.
  for (let step = Math.ceil(depth); step >= 1; step -= 1) {
    const t = step / Math.max(1, depth);
    ctx.fillStyle = step % 2 === 0 ? treatment.extrusion : treatment.outline;
    ctx.globalAlpha = 0.55 + 0.45 * (1 - t);
    ctx.fillText(display, cx + step * 0.85, cy + step * 0.8);
  }
  ctx.globalAlpha = 1;

  // Heavy dark keyline so the chrome reads against any photo behind it.
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size * 0.085);
  ctx.strokeStyle = treatment.outline;
  ctx.strokeText(display, cx, cy);

  // Chrome body.
  const chrome = ctx.createLinearGradient(0, cy - size * 0.62, 0, cy + size * 0.6);
  treatment.chrome.forEach((color, index) => {
    chrome.addColorStop(index / (treatment.chrome.length - 1), color);
  });
  ctx.fillStyle = chrome;
  ctx.fillText(display, cx, cy);

  // Neon stripes clipped to the glyphs by filling the text with a pattern.
  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = stripePattern(ctx, treatment.stripes);
  ctx.fillText(display, cx, cy);
  ctx.restore();

  // Glossy top highlight.
  const gloss = ctx.createLinearGradient(0, cy - size * 0.6, 0, cy + size * 0.08);
  gloss.addColorStop(0, 'rgba(255,255,255,0.78)');
  gloss.addColorStop(0.45, 'rgba(255,255,255,0.12)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gloss;
  ctx.fillText(display, cx, cy);

  // Fine inner rim.
  ctx.lineWidth = Math.max(1, size * 0.014);
  ctx.strokeStyle = hexToRgba('#ffffff', 0.72);
  ctx.strokeText(display, cx, cy);

  ctx.restore();
  setTracking(ctx, 0);
}

export function drawCaption(ctx, text, box, treatment) {
  const label = String(text || '').toUpperCase();
  if (!label) return;
  const { x, y, w, h } = box;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  setTracking(ctx, w * 0.004);
  const size = fittedFont(ctx, label, w * 0.8, h * 0.82, LABEL_FONT, 800);
  ctx.font = `800 ${size}px ${LABEL_FONT}`;
  const cy = y + h / 2;

  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = size * 0.5;
  ctx.fillStyle = '#fff6e2';
  ctx.fillText(label, x + w / 2, cy);
  ctx.shadowBlur = 0;

  const measured = ctx.measureText(label).width;
  const barW = Math.max(w * 0.04, (w - measured) * 0.28);
  const barY = cy;
  ctx.fillStyle = treatment.accent;
  ctx.fillRect(x + w / 2 - measured / 2 - barW * 1.25, barY - 1.5, barW, 3);
  ctx.fillRect(x + w / 2 + measured / 2 + barW * 0.25, barY - 1.5, barW, 3);
  ctx.restore();
  setTracking(ctx, 0);
}

export function drawCastTags(ctx, w, h, cast, treatment, headerY) {
  ctx.save();
  ctx.textBaseline = 'middle';
  const fontStack = LABEL_FONT;
  const size = Math.max(9, Math.min(w, h) * 0.014);
  ctx.font = `800 ${size}px ${fontStack}`;
  setTracking(ctx, size * 0.12);

  let px = w * 0.05;
  const py = h * headerY;
  const lead = String(cast[0]?.name || '').toUpperCase();
  const leadLabel = `STARRING  ${lead}`;
  const leadWidth = ctx.measureText(leadLabel).width + size * 2.4;
  ctx.fillStyle = treatment.accent;
  ctx.fillRect(px, py - size * 0.95, leadWidth, size * 1.9);
  ctx.fillStyle = '#16061c';
  ctx.textAlign = 'left';
  ctx.fillText(leadLabel, px + size * 1.1, py + size * 0.05);
  px += leadWidth + size * 1.2;

  const rest = cast.slice(1, 3).map((c) => c.name).join('  ·  ').toUpperCase();
  ctx.fillStyle = 'rgba(255,244,224,0.86)';
  ctx.fillText(rest, px, py + size * 0.05);

  ctx.textAlign = 'right';
  ctx.fillStyle = hexToRgba(treatment.accent, 0.95);
  ctx.fillText('ORIGINAL MOTION PICTURE', w * 0.95, py + size * 0.05);
  ctx.restore();
  setTracking(ctx, 0);
}

export function drawBillingBlock(ctx, text, box) {
  const { x, y, w, h } = box;
  const words = String(text).toUpperCase().split(/\s+/);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255,240,214,0.66)';
  setTracking(ctx, w * 0.0006);

  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    ctx.font = `600 ${Math.max(8, Math.min(w, h) * 0.55)}px Arial, sans-serif`;
    if (ctx.measureText(candidate).width > w * 0.9 && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);

  const lineHeight = Math.max(8, h / Math.max(1, lines.length));
  const fontSize = fittedFont(ctx, lines[0] || '', w, lineHeight * 0.82, 'Arial, sans-serif', 600);
  ctx.font = `600 ${fontSize}px Arial, sans-serif`;
  lines.slice(0, 3).forEach((value, index) => {
    ctx.fillText(value, x + w / 2, y + index * lineHeight);
  });
  ctx.restore();
  setTracking(ctx, 0);
}

function drawCurvedText(ctx, text, cx, cy, radius, startAngle, endAngle, size, color) {
  ctx.save();
  ctx.font = `800 ${size}px ${LABEL_FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const chars = text.split('');
  const step = (endAngle - startAngle) / Math.max(1, chars.length - 1);
  chars.forEach((char, index) => {
    const angle = startAngle + step * index;
    ctx.save();
    ctx.translate(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(char, 0, 0);
    ctx.restore();
  });
  ctx.restore();
}

export function drawSeal(ctx, cx, cy, radius, label, treatment) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(18,6,26,0.86)';
  ctx.fill();
  ctx.lineWidth = radius * 0.09;
  ctx.strokeStyle = treatment.accent;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.82, 0, Math.PI * 2);
  ctx.lineWidth = radius * 0.03;
  ctx.strokeStyle = 'rgba(255,244,214,0.7)';
  ctx.stroke();

  const size = radius * 0.16;
  drawCurvedText(ctx, label, cx, cy, radius * 0.64, Math.PI * 1.16, Math.PI * 1.84, size, '#fff4d8');
  drawCurvedText(ctx, '★  ★  ★', cx, cy, radius * 0.64, Math.PI * 0.16, Math.PI * 0.84, size, treatment.accent);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${radius * 0.44}px ${DISPLAY_FONT}`;
  ctx.fillStyle = '#fff4d8';
  ctx.fillText('VC', cx, cy - radius * 0.02);
  ctx.font = `700 ${radius * 0.16}px ${LABEL_FONT}`;
  ctx.fillStyle = treatment.accent;
  ctx.fillText('ORIGINAL', cx, cy + radius * 0.36);
  ctx.restore();
}
