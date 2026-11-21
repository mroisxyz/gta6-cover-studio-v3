// Chrome-edge title art. The headline is deliberately drawn as ONE fill and
// ONE stroke: the dark extrusion is that fill's shadow, and the sunset gradient
// plus horizontal striping live in a generated pattern, so there is no echo.

import { TOKENS } from './config.js';

const FONT_STACK = 'Impact, "Arial Black", "Segoe UI Black", system-ui, sans-serif';

function font(size) {
  return `900 ${Math.max(1, size)}px ${FONT_STACK}`;
}

/** Pick the largest headline size that still fits the available width. */
export function fitTitleSize(ctx, text, maxWidth, maxSize, minSize = 20) {
  let size = Math.max(minSize, maxSize);
  ctx.save();
  ctx.font = font(size);
  let width = ctx.measureText(text).width;
  while (width > maxWidth && size > minSize) {
    size = Math.max(minSize, size * 0.96);
    ctx.font = font(size);
    width = ctx.measureText(text).width;
  }
  ctx.restore();
  return size;
}

function makeChromeTexture(ctx, size, y) {
  const texture = document.createElement('canvas');
  texture.width = 16;
  texture.height = Math.max(64, Math.ceil(size * 1.6));
  const tctx = texture.getContext('2d');
  if (!tctx) return null;

  const grad = tctx.createLinearGradient(0, 0, 0, texture.height);
  grad.addColorStop(0, TOKENS.cream);
  grad.addColorStop(0.28, TOKENS.amber);
  grad.addColorStop(0.64, TOKENS.flamingo);
  grad.addColorStop(1, TOKENS.orchid);
  tctx.fillStyle = grad;
  tctx.fillRect(0, 0, texture.width, texture.height);

  const step = Math.max(3, size * 0.055);
  const line = Math.max(1, size * 0.012);
  for (let sy = step * 0.5; sy < texture.height; sy += step) {
    tctx.fillStyle = TOKENS.cream;
    tctx.globalAlpha = 0.30;
    tctx.fillRect(0, sy, texture.width, line);
    tctx.fillStyle = TOKENS.ink;
    tctx.globalAlpha = 0.18;
    tctx.fillRect(0, sy + line, texture.width, Math.max(1, line * 0.6));
  }
  tctx.globalAlpha = 1;

  const pattern = ctx.createPattern(texture, 'repeat');
  if (pattern && typeof DOMMatrix !== 'undefined' && typeof pattern.setTransform === 'function') {
    const matrix = new DOMMatrix();
    matrix.m42 = y - size * 0.8;
    pattern.setTransform(matrix);
  }
  return pattern;
}

/**
 * Draw a chrome-edged, sunset-gradient headline exactly once.
 * x/y are the centre of the text; size is its font size in canvas pixels.
 */
export function drawChromeTitle(ctx, text, x, y, size) {
  const label = String(text ?? '').toUpperCase();
  if (!label) return;

  ctx.save();
  ctx.font = font(size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  const pattern = makeChromeTexture(ctx, size, y);
  if (pattern) {
    ctx.fillStyle = pattern;
  } else {
    const fallback = ctx.createLinearGradient(0, y - size * 0.6, 0, y + size * 0.6);
    fallback.addColorStop(0, TOKENS.cream);
    fallback.addColorStop(0.35, TOKENS.amber);
    fallback.addColorStop(0.7, TOKENS.flamingo);
    fallback.addColorStop(1, TOKENS.orchid);
    ctx.fillStyle = fallback;
  }

  // One dark extrusion: a hard shadow offset down and right from the one fill.
  ctx.shadowColor = TOKENS.ink;
  ctx.shadowOffsetX = size * 0.055;
  ctx.shadowOffsetY = size * 0.070;
  ctx.shadowBlur = Math.max(0, size * 0.010);
  ctx.fillText(label, x, y);

  ctx.shadowColor = 'transparent';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 0;

  // Thin cream stroke sits on top of the gradient.
  ctx.strokeStyle = TOKENS.cream;
  ctx.lineWidth = Math.max(1.5, size * 0.016);
  ctx.strokeText(label, x, y);

  ctx.restore();
}
