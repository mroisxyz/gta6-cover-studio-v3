// Export helpers. The exporter renders the poster at the full target pixel
// size into an offscreen canvas and writes a PNG entirely on the user's
// machine; no image data ever leaves the browser.

import { POSTER_SIZES } from './presets.js';
import { renderPosterCanvas } from './poster-render.js';

export function resolveSize(sizeKey) {
  return POSTER_SIZES[sizeKey] || POSTER_SIZES.square;
}

export function composeExportCanvas(config, sizeKey) {
  const size = resolveSize(sizeKey);
  const canvas = document.createElement('canvas');
  return renderPosterCanvas(canvas, { ...config, width: size.width, height: size.height });
}

export function coverToBlob(config, sizeKey) {
  const canvas = composeExportCanvas(config, sizeKey);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG encoding failed'));
    }, 'image/png');
  });
}

function safeFileName(title, size) {
  const base = String(title || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${base || 'cover'}-${size.width}x${size.height}.png`;
}

export async function exportCoverPng(config, sizeKey) {
  const size = resolveSize(sizeKey);
  const blob = await coverToBlob(config, sizeKey);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFileName(config.title, size);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return { blob, filename: link.download };
}
