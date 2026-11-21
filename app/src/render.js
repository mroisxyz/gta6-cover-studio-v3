// The poster compositor. The paint order here is part of the design contract:
// backdrop -> panels + gutters -> cast/billing strip -> title -> seal.

import {
  PALETTES,
  LAYOUTS,
  TITLE_PRESETS,
  BILLING,
  CAST_ROLES,
  DEFAULT_PALETTE,
  DEFAULT_LAYOUT,
  DEFAULT_TITLE_PRESET,
} from './config.js';
import { photoManager } from './photos.js';
import { buildPanelSpecs, drawPhotoCover, PanelCropController } from './panels.js';
import { drawBackdrop } from './backdrop.js';
import { drawChromeTitle, fitTitleSize } from './title.js';

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function defaultPhotoFor(spec, ids) {
  if (!ids.length) return undefined;
  return ids[spec.photoIndex ?? (spec.index % ids.length)] ?? ids[spec.index % ids.length] ?? ids[0];
}

function drawInfoStrip(ctx, W, H, p, state) {
  const u = Math.min(W, H);

  // Caption / kicker sits just above the title block.
  const caption = String(state.caption ?? '').trim();
  if (caption) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.max(10, u * 0.021)}px system-ui, sans-serif`;
    ctx.fillStyle = p.flamingo;
    ctx.shadowColor = p.ink;
    ctx.shadowOffsetY = Math.max(1, u * 0.003);
    ctx.fillText(caption.toUpperCase(), W * 0.5, H * 0.712);
    ctx.restore();
  }

  const x = u * 0.03;
  const h = u * 0.085;
  const y = H - h - u * 0.03;
  const w = W - x * 2;

  ctx.save();
  roundRectPath(ctx, x, y, w, h, u * 0.012);
  ctx.globalAlpha = 0.93;
  ctx.fillStyle = p.ink;
  ctx.fill();
  ctx.globalAlpha = 0.30;
  ctx.strokeStyle = p.cream;
  ctx.lineWidth = Math.max(1, u * 0.0018);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Cast role tag chips.
  const chipFont = Math.max(8, u * 0.0135);
  ctx.font = `800 ${chipFont}px system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  const chipH = h * 0.30;
  const chipY = y + h * 0.13;
  let chipX = x + u * 0.018;
  CAST_ROLES.forEach((person) => {
    const label = `${person.tag}  ${person.role}`;
    const chipW = ctx.measureText(label).width + u * 0.026;
    roundRectPath(ctx, chipX, chipY, chipW, chipH, chipH * 0.5);
    ctx.fillStyle = p.accent;
    ctx.fill();
    ctx.fillStyle = p.cream;
    ctx.fillText(label, chipX + u * 0.013, chipY + chipH * 0.52);
    chipX += chipW + u * 0.010;
  });

  // Billing block under the chips.
  ctx.fillStyle = p.cream;
  ctx.globalAlpha = 0.82;
  ctx.font = `600 ${Math.max(8, u * 0.0115)}px system-ui, sans-serif`;
  BILLING.slice(0, 4).forEach((line, i) => {
    ctx.fillText(line, x + u * 0.018, y + h * (0.60 + i * 0.11));
  });
  ctx.restore();
}

function drawSeal(ctx, W, H, p) {
  const u = Math.min(W, H);
  const r = u * 0.052;
  const x = W - u * 0.095;
  const y = u * 0.095;

  ctx.save();
  const glow = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 1.5);
  glow.addColorStop(0, p.accent + '55');
  glow.addColorStop(1, p.accent + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(x - r * 1.6, y - r * 1.6, r * 3.2, r * 3.2);

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = p.ink;
  ctx.fill();
  ctx.lineWidth = Math.max(1, r * 0.09);
  ctx.strokeStyle = p.cream;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1, r * 0.035);
  ctx.strokeStyle = p.accent;
  ctx.stroke();

  // Four-point original-art star.
  ctx.beginPath();
  ctx.moveTo(x, y - r * 0.42);
  ctx.lineTo(x + r * 0.12, y - r * 0.10);
  ctx.lineTo(x + r * 0.44, y);
  ctx.lineTo(x + r * 0.12, y + r * 0.10);
  ctx.lineTo(x, y + r * 0.42);
  ctx.lineTo(x - r * 0.12, y + r * 0.10);
  ctx.lineTo(x - r * 0.44, y);
  ctx.lineTo(x - r * 0.12, y - r * 0.10);
  ctx.closePath();
  ctx.fillStyle = p.amber;
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = p.cream;
  ctx.font = `900 ${Math.max(8, r * 0.36)}px system-ui, sans-serif`;
  ctx.fillText('MF', x, y + r * 0.01);
  ctx.font = `700 ${Math.max(6, r * 0.15)}px system-ui, sans-serif`;
  ctx.fillText('ORIGINAL', x, y + r * 0.61);
  ctx.restore();
}

/** Render the complete cover into any 2D canvas. */
export function renderPosterCanvas(canvas, state) {
  if (!canvas) return;
  const W = Math.max(1, Math.round(state.width ?? canvas.width ?? 1080));
  const H = Math.max(1, Math.round(state.height ?? canvas.height ?? 1080));
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const palette = PALETTES[state.paletteId] ?? PALETTES[DEFAULT_PALETTE];
  const layout = LAYOUTS[state.layoutId] ?? LAYOUTS[DEFAULT_LAYOUT];
  const u = Math.min(W, H);
  const specs = buildPanelSpecs(layout, W, H);

  if (!state.photos) state.photos = {};
  if (!state.controls) state.controls = {};
  const ids = photoManager.ids();
  specs.forEach((spec) => {
    if (!ids.includes(state.photos[spec.id])) {
      state.photos[spec.id] = defaultPhotoFor(spec, ids);
    }
  });

  // 1. Clear and sunset backdrop.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  drawBackdrop(ctx, W, H, palette);

  // 2. Photos, then gutters. Strokes only: never an empty rectangle over a photo.
  const controller = new PanelCropController(state, photoManager);
  specs.forEach((spec) => {
    const { focal, zoom } = controller.resolve(spec);
    drawPhotoCover(ctx, photoManager.get(state.photos[spec.id]), spec.rect, focal, zoom);

    const { x, y, w, h } = spec.rect;
    ctx.save();
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = Math.max(2, u * 0.004);
    ctx.strokeRect(x + 0.5, y + 0.5, Math.max(0, w - 1), Math.max(0, h - 1));
    const inset = ctx.lineWidth + 0.5;
    ctx.globalAlpha = 0.38;
    ctx.strokeStyle = palette.cream;
    ctx.lineWidth = Math.max(1, u * 0.0015);
    ctx.strokeRect(x + inset, y + inset, Math.max(0, w - inset * 2), Math.max(0, h - inset * 2));
    ctx.restore();
  });

  // 3. Cast chips and billing strip (plus the kicker caption).
  drawInfoStrip(ctx, W, H, palette, state);

  // 4. One chrome headline.
  const titleText = String(state.title ?? TITLE_PRESETS[DEFAULT_TITLE_PRESET].label).trim() || TITLE_PRESETS[DEFAULT_TITLE_PRESET].label;
  const titleSize = fitTitleSize(ctx, titleText, W * 0.91, Math.min(W * 0.135, H * 0.175), Math.max(18, u * 0.035));
  drawChromeTitle(ctx, titleText, W * 0.5, H * 0.828, titleSize);

  // 5. Original-art seal.
  if (state.showSeal !== false) drawSeal(ctx, W, H, palette);
}
