// Canvas-painted Vice-style backdrop: a graded sunset sky, a striped sun,
// low skyline and palm silhouettes, then film grain and a soft vignette.
// Everything is drawn with paths and gradients; no image assets are used.

let cachedGrainTile = null;

function seededRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function paintSkyGradient(ctx, w, h, palette) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  palette.sky.forEach(([stop, color]) => sky.addColorStop(stop, color));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  return sky;
}

function paintSunDisc(ctx, w, h, palette, skyGradient) {
  const cx = w * 0.5;
  const cy = h * 0.125;
  const radius = Math.min(w, h) * 0.095;

  const glow = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 3.2);
  glow.addColorStop(0, hexToRgba(palette.sun[1], 0.55));
  glow.addColorStop(0.45, hexToRgba(palette.sun[2], 0.2));
  glow.addColorStop(1, hexToRgba(palette.sun[2], 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const disc = ctx.createLinearGradient(0, cy - radius, 0, cy + radius);
  disc.addColorStop(0, palette.sun[0]);
  disc.addColorStop(0.35, palette.sun[1]);
  disc.addColorStop(0.72, palette.sun[2]);
  disc.addColorStop(1, palette.sun[3]);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = disc;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

  // Retro scanline cuts: repaint slim bands with the sky gradient beneath.
  ctx.fillStyle = skyGradient;
  let y = cy - radius * 0.1;
  let gap = radius * 0.035;
  while (y < cy + radius) {
    ctx.fillRect(cx - radius - 2, y, radius * 2 + 4, gap);
    y += gap + radius * 0.085;
    gap *= 1.25;
  }
  ctx.restore();

  // Rim light around the disc.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
  ctx.strokeStyle = hexToRgba(palette.sun[0], 0.35);
  ctx.lineWidth = Math.max(2, radius * 0.012);
  ctx.stroke();
  ctx.restore();
}

function paintHorizonHaze(ctx, w, h, palette) {
  const haze = ctx.createLinearGradient(0, h * 0.5, 0, h * 0.8);
  haze.addColorStop(0, hexToRgba(palette.haze, 0));
  haze.addColorStop(0.7, hexToRgba(palette.haze, 0.28));
  haze.addColorStop(1, hexToRgba(palette.haze, 0));
  ctx.fillStyle = haze;
  ctx.fillRect(0, h * 0.5, w, h * 0.3);

  // A few stretched cloud wisps.
  const rand = seededRandom(8123);
  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = '#fff1d6';
  for (let i = 0; i < 9; i += 1) {
    const y = h * (0.2 + rand() * 0.32);
    const x = rand() * w;
    const cw = w * (0.08 + rand() * 0.22);
    const ch = Math.max(2, h * 0.006 * (0.5 + rand()));
    ctx.beginPath();
    ctx.ellipse(x, y, cw, ch, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function paintSkyline(ctx, w, h, palette) {
  const horizon = h * 0.665;
  const rand = seededRandom(44771);
  ctx.save();
  ctx.fillStyle = palette.silhouette;

  let x = -w * 0.02;
  while (x < w * 1.02) {
    const bw = w * (0.018 + rand() * 0.045);
    const bh = h * (0.035 + rand() * 0.16);
    ctx.fillRect(x, horizon - bh, bw, bh + h * 0.04);
    if (rand() > 0.78) {
      ctx.fillRect(x + bw * 0.4, horizon - bh - h * 0.035, bw * 0.2, h * 0.035);
    }
    x += bw + w * 0.005;
  }

  // Signature tower with a lit crown.
  const tx = w * 0.62;
  const tw = w * 0.035;
  const th = h * 0.26;
  ctx.fillRect(tx, horizon - th, tw, th);
  ctx.fillRect(tx + tw * 0.42, horizon - th - h * 0.07, tw * 0.16, h * 0.07);
  ctx.fillStyle = hexToRgba(palette.haze, 0.55);
  for (let yy = horizon - th + 8; yy < horizon - 12; yy += 14) {
    ctx.fillRect(tx + tw * 0.22, yy, tw * 0.16, 3);
    ctx.fillRect(tx + tw * 0.62, yy, tw * 0.16, 3);
  }

  // Sparse warm windows.
  ctx.fillStyle = hexToRgba('#ffd28a', 0.5);
  for (let i = 0; i < 130; i += 1) {
    const wx = rand() * w;
    const wy = horizon - h * 0.02 - rand() * h * 0.13;
    ctx.fillRect(wx, wy, 2.5, 2.5);
  }
  ctx.restore();
}

function paintPalm(ctx, w, h, baseX, baseY, scale, lean, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';

  const topX = baseX + lean * scale;
  const topY = baseY - 0.5 * h * scale;
  ctx.lineWidth = Math.max(3, 0.008 * w * scale);
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + lean * 0.2 * scale, baseY - 0.14 * h * scale, topX, topY);
  ctx.stroke();

  const frondLength = 0.075 * w * scale;
  for (let i = 0; i < 8; i += 1) {
    const angle = Math.PI + (i / 7) * Math.PI;
    const ex = topX + Math.cos(angle) * frondLength;
    const ey = topY + Math.sin(angle) * frondLength * 0.62 + frondLength * 0.18;
    ctx.lineWidth = Math.max(2, 0.0035 * w * scale);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo((topX + ex) / 2, (topY + ey) / 2 - frondLength * 0.22, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

function paintPalms(ctx, w, h, palette) {
  const ground = h * 0.7;
  paintPalm(ctx, w, h, w * 0.035, ground, 1.15, w * 0.055, palette.silhouette);
  paintPalm(ctx, w, h, w * 0.15, ground * 1.02, 0.72, -w * 0.03, palette.silhouette);
  paintPalm(ctx, w, h, w * 0.955, ground, 1.2, -w * 0.06, palette.silhouette);
  paintPalm(ctx, w, h, w * 0.86, ground * 1.01, 0.68, w * 0.035, palette.silhouette);
}

function paintGround(ctx, w, h, palette) {
  const horizon = h * 0.665;
  const ground = ctx.createLinearGradient(0, horizon, 0, h);
  ground.addColorStop(0, hexToRgba(palette.ground, 0.55));
  ground.addColorStop(1, palette.ground);
  ctx.fillStyle = ground;
  ctx.fillRect(0, horizon, w, h - horizon);

  ctx.save();
  ctx.strokeStyle = hexToRgba(palette.haze, 0.09);
  ctx.lineWidth = 1.5;
  for (let i = -6; i <= 6; i += 1) {
    ctx.beginPath();
    ctx.moveTo(w * 0.5 + i * w * 0.02, horizon);
    ctx.lineTo(w * 0.5 + i * w * 0.16, h);
    ctx.stroke();
  }
  ctx.restore();
}

function getGrainTile() {
  if (cachedGrainTile) return cachedGrainTile;
  const size = 160;
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const tctx = tile.getContext('2d');
  const data = tctx.createImageData(size, size);
  const rand = seededRandom(99117);
  for (let i = 0; i < data.data.length; i += 4) {
    const value = Math.floor(rand() * 255);
    data.data[i] = value;
    data.data[i + 1] = value;
    data.data[i + 2] = value;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  cachedGrainTile = tile;
  return tile;
}

export function drawGrain(ctx, w, h, amount = 0.07) {
  const pattern = ctx.createPattern(getGrainTile(), 'repeat');
  if (!pattern) return;
  ctx.save();
  ctx.globalAlpha = amount;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

export function drawVignette(ctx, w, h, strength = 0.72) {
  const gradient = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.78);
  gradient.addColorStop(0, 'rgba(8,3,18,0)');
  gradient.addColorStop(0.6, 'rgba(8,3,18,0.08)');
  gradient.addColorStop(1, `rgba(8,3,18,${strength})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

export function drawSunsetBackdrop(ctx, w, h, palette) {
  const sky = paintSkyGradient(ctx, w, h, palette);
  paintHorizonHaze(ctx, w, h, palette);
  paintSunDisc(ctx, w, h, palette, sky);
  paintSkyline(ctx, w, h, palette);
  paintPalms(ctx, w, h, palette);
  paintGround(ctx, w, h, palette);
}

export function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const number = parseInt(full, 16);
  const r = (number >> 16) & 255;
  const g = (number >> 8) & 255;
  const b = number & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
