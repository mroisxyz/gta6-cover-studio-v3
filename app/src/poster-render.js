// The poster compositor. Paints a Vice-flavoured sunset scene, lays the
// user's photos into a tilted comic-panel grid, grades every panel into the
// same palette, then finishes with original chrome lettering and print detail.

import { BACKDROP_PALETTES, TITLE_TREATMENTS } from './presets.js';
import { computePanelSpecs, compositionZones } from './panel-layout.js';
import { drawSunsetBackdrop, drawGrain, drawVignette, hexToRgba } from './backdrop-art.js';
import { drawChromeTitle, drawCaption, drawCastTags, drawBillingBlock, drawSeal, drawTitleRibbon } from './title-art.js';

function roundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Warms and cools each photograph so mixed sources read as one sunset set.
export function applySunsetGrade(ctx, x, y, w, h, palette, strength = 0.55) {
  ctx.save();
  roundedRectPath(ctx, x, y, w, h, Math.min(w, h) * 0.01);
  ctx.clip();

  const duotone = ctx.createLinearGradient(x, y, x, y + h);
  duotone.addColorStop(0, hexToRgba(palette.gradeTop, 0.92));
  duotone.addColorStop(0.5, hexToRgba(palette.haze, 0.12));
  duotone.addColorStop(1, hexToRgba(palette.gradeBottom, 0.95));
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = strength;
  ctx.fillStyle = duotone;
  ctx.fillRect(x, y, w, h);

  const warm = ctx.createLinearGradient(x, y, x + w, y + h);
  warm.addColorStop(0, hexToRgba('#ff7a3d', 0.35));
  warm.addColorStop(1, hexToRgba('#2b0b52', 0.35));
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = strength * 0.55;
  ctx.fillStyle = warm;
  ctx.fillRect(x, y, w, h);

  const glow = ctx.createRadialGradient(x + w * 0.3, y + h * 0.18, 0, x + w * 0.3, y + h * 0.18, Math.max(w, h) * 0.8);
  glow.addColorStop(0, hexToRgba(palette.sun[0], 0.22));
  glow.addColorStop(1, hexToRgba(palette.sun[0], 0));
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 1;
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function drawPanelRoleTag(ctx, x, y, width, label, treatment, unit) {
  const text = String(label || '').toUpperCase();
  if (!text) return;
  ctx.save();
  ctx.font = `800 ${Math.max(8, unit * 0.7)}px Arial, sans-serif`;
  setLetterSpacing(ctx, unit * 0.08);
  const pad = unit * 0.6;
  const tw = ctx.measureText(text).width;
  const boxW = tw + pad * 2;
  ctx.fillStyle = 'rgba(12,4,18,0.82)';
  ctx.fillRect(x, y, boxW, unit * 1.7);
  ctx.fillStyle = treatment.accent;
  ctx.fillRect(x, y, Math.max(2, unit * 0.16), unit * 1.7);
  ctx.fillStyle = '#fff4dc';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + pad, y + unit * 0.9);
  ctx.restore();
  setLetterSpacing(ctx, 0);
}

function setLetterSpacing(ctx, value) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${value}px`;
}

function drawComicPanel(ctx, spec, w, h, images, cropController, palette, treatment, cast) {
  const px = spec.x * w;
  const py = spec.y * h;
  const pw = spec.w * w;
  const ph = spec.h * h;
  const unit = Math.min(w, h);
  const gutter = Math.max(4, unit * (spec.hero ? 0.013 : 0.009));
  const radius = Math.max(3, unit * 0.006);

  ctx.save();
  ctx.translate(px + pw / 2, py + ph / 2);
  ctx.rotate((spec.rot * Math.PI) / 180);

  ctx.save();
  ctx.shadowColor = 'rgba(6,2,14,0.6)';
  ctx.shadowBlur = gutter * 3.5;
  ctx.shadowOffsetY = gutter * 0.9;
  roundedRectPath(ctx, -pw / 2, -ph / 2, pw, ph, radius);
  const rim = ctx.createLinearGradient(-pw / 2, -ph / 2, pw / 2, ph / 2);
  rim.addColorStop(0, '#fff6df');
  rim.addColorStop(0.45, '#e7c47d');
  rim.addColorStop(0.7, '#fff4d6');
  rim.addColorStop(1, '#c99a4e');
  ctx.fillStyle = rim;
  ctx.fill();
  ctx.restore();

  const ix = -pw / 2 + gutter;
  const iy = -ph / 2 + gutter;
  const iw = pw - gutter * 2;
  const ih = ph - gutter * 2;

  ctx.save();
  roundedRectPath(ctx, ix, iy, iw, ih, Math.max(2, radius * 0.65));
  ctx.clip();
  const imageIndex = Math.min(images.length - 1, Math.max(0, cropController.assignmentAt(spec.index)));
  const image = images[imageIndex];
  if (image) {
    const crop = cropController.cropAt(spec.index);
    const place = cropController.computeImagePlacement(image, iw, ih, crop);
    ctx.drawImage(image, ix + place.dx, iy + place.dy, place.dw, place.dh);
  } else {
    const fallback = ctx.createLinearGradient(ix, iy, ix, iy + ih);
    fallback.addColorStop(0, palette.gradeTop);
    fallback.addColorStop(1, palette.gradeBottom);
    ctx.fillStyle = fallback;
    ctx.fillRect(ix, iy, iw, ih);
  }
  applySunsetGrade(ctx, ix, iy, iw, ih, palette, spec.hero ? 0.68 : 0.6);
  ctx.restore();

  roundedRectPath(ctx, ix, iy, iw, ih, Math.max(2, radius * 0.65));
  ctx.lineWidth = Math.max(1, unit * 0.0018);
  ctx.strokeStyle = 'rgba(18,6,24,0.85)';
  ctx.stroke();

  if (spec.hero) {
    ctx.fillStyle = treatment.accent;
    ctx.fillRect(-pw / 2 + gutter, ph / 2 - gutter * 1.6, pw - gutter * 2, gutter * 0.55);
    drawPanelRoleTag(ctx, ix + unit * 0.012, iy + ih - unit * 0.032, iw, cast[0]?.role, treatment, unit * 0.018);
  } else if (spec.index === 2 || spec.index === 5) {
    const role = cast[(spec.index === 2 ? 1 : 2)]?.role;
    drawPanelRoleTag(ctx, ix + unit * 0.008, iy + ih - unit * 0.027, iw, role, treatment, unit * 0.013);
  }

  ctx.restore();
}

// Main entry point used by both the live preview and the PNG exporter.
export function renderPosterCanvas(canvas, config) {
  const {
    width,
    height,
    images = [],
    cropController,
    title = 'NEON MILE',
    caption = 'ONE NIGHT. NO RULES.',
    cast = [],
    billing = '',
    treatmentId = 'neonMile',
    paletteId = 'sunsetDrive',
    layoutId = 'showcase',
    withSeal = true,
  } = config;

  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext('2d');
  const treatment = TITLE_TREATMENTS[treatmentId] || TITLE_TREATMENTS.neonMile;
  const palette = BACKDROP_PALETTES[paletteId] || BACKDROP_PALETTES.sunsetDrive;
  const zones = compositionZones(width, height);
  const unit = Math.min(width, height);

  drawSunsetBackdrop(ctx, width, height, palette);

  const specs = computePanelSpecs(layoutId, width, height);
  cropController?.setPanelCount(specs.length);
  specs.forEach((spec) => drawComicPanel(ctx, spec, width, height, images, cropController, palette, treatment, cast));

  drawGrain(ctx, width, height, 0.065);
  drawVignette(ctx, width, height, 0.5);

  const captionBottom = zones.titleTop * height - unit * 0.006;
  const captionTop = captionBottom - unit * 0.052;
  drawCaption(ctx, caption, { x: width * 0.05, y: captionTop, w: width * 0.9, h: captionBottom - captionTop }, treatment);

  const titleY = zones.titleTop * height;
  const titleH = (zones.titleBottom - zones.titleTop) * height;
  drawTitleRibbon(ctx, { x: width * 0.04, y: titleY, w: width * 0.92, h: titleH }, treatment);
  drawChromeTitle(ctx, title, { x: width * 0.045, y: titleY + titleH * 0.02, w: width * 0.91, h: titleH * 0.9 }, treatment);

  drawCastTags(ctx, width, height, cast, treatment, zones.headerY);
  drawBillingBlock(ctx, billing, { x: width * 0.18, y: zones.billingTop * height, w: width * 0.64, h: height * 0.035 });

  if (withSeal) {
    const sealRadius = unit * 0.052;
    drawSeal(ctx, width * 0.9, height * zones.headerY + sealRadius * 1.3, sealRadius, 'OFFICIAL SELECTION', treatment);
  }

  drawGrain(ctx, width, height, 0.022);
  return canvas;
}
