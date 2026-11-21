// All of the poster's non-photo artwork: graded sky, striped retro sun,
// layered skyline, palms, grain and vignette. Drawn with paths and gradients.

import { PALETTES, DEFAULT_PALETTE } from './config.js';

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function drawSun(ctx, W, H, p) {
  const u = Math.min(W, H);
  const cx = W * 0.52;
  const cy = H * 0.31;
  const r = u * 0.31;

  //soft halo
  const halo = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.75);
  halo.addColorStop(0, p.glow + '66');
  halo.addColorStop(1, p.glow + '00');
  ctx.fillStyle = halo;
  ctx.fillRect(cx - r * 1.8, cy - r * 1.8, r * 3.6, r * 3.6);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  const disc = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  const colors = p.sun ?? [p.cream, p.amber, p.coral];
  colors.forEach((color, i) => disc.addColorStop(i / Math.max(1, colors.length - 1), color));
  ctx.fillStyle = disc;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // Ink stripes get thicker toward the bottom of the disc.
  ctx.fillStyle = p.ink;
  let y = cy - r * 0.06;
  let thickness = Math.max(1, u * 0.003);
  while (y < cy + r) {
    ctx.globalAlpha = 0.55 + ((y - cy + r) / (r * 2)) * 0.35;
    ctx.fillRect(cx - r, y, r * 2, thickness);
    y += thickness + Math.max(2, u * 0.011);
    thickness *= 1.16;
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = p.cream;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = Math.max(1, u * 0.0025);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawRays(ctx, W, H, p) {
  const u = Math.min(W, H);
  const cx = W * 0.52;
  const cy = H * 0.31;
  const rand = seededRandom(0xA11CE);
  ctx.save();
  ctx.globalAlpha = 0.055;
  ctx.strokeStyle = p.cream;
  ctx.lineWidth = u * 0.006;
  for (let i = 0; i < 16; i += 1) {
    const angle = rand() * Math.PI * 2;
    const length = u * (0.45 + rand() * 0.55);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * u * 0.32, cy + Math.sin(angle) * u * 0.32);
    ctx.lineTo(cx + Math.cos(angle) * length, cy + Math.sin(angle) * length);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSkyline(ctx, W, H, p) {
  const u = Math.min(W, H);
  const rand = seededRandom(0x5F17E);
  const layers = [
    { base: H * 0.60, minH: u * 0.05, maxH: u * 0.16, alpha: 0.24, width: W / 26 },
    { base: H * 0.68, minH: u * 0.06, maxH: u * 0.20, alpha: 0.40, width: W / 19 },
    { base: H * 0.78, minH: u * 0.05, maxH: u * 0.17, alpha: 0.66, width: W / 14 },
  ];

  layers.forEach((layer) => {
    ctx.save();
    ctx.globalAlpha = layer.alpha;
    ctx.fillStyle = p.ink;
    let x = -layer.width;
    while (x < W + layer.width) {
      const bw = layer.width * (0.65 + rand() * 0.8);
      const bh = layer.minH + rand() * (layer.maxH - layer.minH);
      ctx.fillRect(x, layer.base - bh, bw, bh + u * 0.2);

      //tiny lit windows
      ctx.save();
      ctx.globalAlpha = layer.alpha * 0.28;
      ctx.fillStyle = p.cream;
      for (let wy = layer.base - bh + u * 0.012; wy < layer.base - u * 0.01; wy += u * 0.02) {
        for (let wx = x + u * 0.008; wx < x + bw - u * 0.006; wx += u * 0.018) {
          if (rand() > 0.62) ctx.fillRect(wx, wy, u * 0.004, u * 0.006);
        }
      }
      ctx.restore();
      x += bw + layer.width * 0.08;
    }
    ctx.restore();
  });
}

function drawPalm(ctx, x, baseY, scale, p, flip) {
  const topX = x + (flip ? scale * 0.16 : -scale * 0.16);
  const topY = baseY - scale * 1.05;

  ctx.save();
  ctx.strokeStyle = p.ink;
  ctx.lineCap = 'round';

  ctx.lineWidth = Math.max(1, scale * 0.07);
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + (flip ? scale * 0.18 : -scale * 0.18), baseY - scale * 0.55, topX, topY);
  ctx.stroke();

  ctx.lineWidth = Math.max(1, scale * 0.045);
  const fronds = 7;
  for (let i = 0; i < fronds; i += 1) {
    const angle = Math.PI + (i / (fronds - 1)) * Math.PI;
    const len = scale * (0.36 + (i % 2 === 0 ? 0.10 : 0.02));
    const ex = topX + Math.cos(angle) * len;
    const ey = topY + Math.sin(angle) * len * 0.62 + scale * 0.10;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(angle) * len * 0.55, topY - scale * 0.10, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPalms(ctx, W, H, p) {
  const u = Math.min(W, H);
  const s = u * 0.16;
  drawPalm(ctx, W * 0.035, H * 0.74, s * 0.95, p, false);
  drawPalm(ctx, W * 0.145, H * 0.70, s * 0.72, p, true);
  drawPalm(ctx, W * 0.965, H * 0.76, s * 1.05, p, true);
  drawPalm(ctx, W * 0.875, H * 0.70, s * 0.70, p, false);
}

function drawGrain(ctx, W, H, p) {
  const rand = seededRandom(0x6A11 ^ (Math.round(W) * 31 + Math.round(H)));
  ctx.save();
  for (let i = 0; i < 1800; i += 1) {
    ctx.globalAlpha = 0.025 + rand() * 0.045;
    ctx.fillStyle = rand() > 0.45 ? p.cream : p.ink;
    ctx.fillRect(rand() * W, rand() * H, 1 + rand() * 1.5, 1 + rand() * 1.5);
  }
  ctx.restore();
}

function drawVignette(ctx, W, H, p) {
  const outer = Math.hypot(W, H) * 0.62;
  const vignette = ctx.createRadialGradient(W / 2, H * 0.46, outer * 0.22, W / 2, H * 0.46, outer);
  vignette.addColorStop(0, p.ink + '00');
  vignette.addColorStop(0.62, p.ink + '18');
  vignette.addColorStop(1, p.ink + 'CC');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}

/** Paint the full sunset backdrop before any photo panels are drawn. */
export function drawBackdrop(ctx, W, H, palette) {
  const p = palette ?? PALETTES[DEFAULT_PALETTE];
  ctx.save();

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  const stops = p.sky ?? [p.dusk, p.orchid, p.flamingo, p.coral, p.tangerine, p.amber];
  stops.forEach((color, i) => sky.addColorStop(i / Math.max(1, stops.length - 1), color));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  drawRays(ctx, W, H, p);
  drawSun(ctx, W, H, p);
  drawSkyline(ctx, W, H, p);
  drawPalms(ctx, W, H, p);
  drawGrain(ctx, W, H, p);
  drawVignette(ctx, W, H, p);

  ctx.restore();
}
