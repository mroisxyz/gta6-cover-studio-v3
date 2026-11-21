// Full-resolution PNG export. Rendering is done on a detached canvas, so the
// on-screen editor preview is never resized or disturbed.

import { EXPORT_SIZES, DEFAULT_SIZE } from './config.js';
import { renderPosterCanvas } from './render.js';

function resolveSize(size) {
  if (typeof size === 'string') return EXPORT_SIZES[size] ?? EXPORT_SIZES[DEFAULT_SIZE];
  if (size && Number.isFinite(size.w) && Number.isFinite(size.h)) {
    return { id: size.id ?? 'custom', w: Math.round(size.w), h: Math.round(size.h) };
  }
  return EXPORT_SIZES[DEFAULT_SIZE];
}

function slug(text) {
  return String(text ?? 'cover')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'cover';
}

function toBlob(canvas) {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encode failed'))), 'image/png');
      return;
    }
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const binary = atob(dataUrl.split(',')[1]);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      resolve(new Blob([bytes], { type: 'image/png' }));
    } catch (error) {
      reject(error);
    }
  });
}

/** Render at the chosen preset size and download the PNG locally. */
export async function exportCoverPng(state, size = state?.sizeId ?? DEFAULT_SIZE) {
  const target = resolveSize(size);
  const canvas = document.createElement('canvas');
  canvas.width = target.w;
  canvas.height = target.h;

  renderPosterCanvas(canvas, {
    ...state,
    width: target.w,
    height: target.h,
    sizeId: target.id,
  });

  const blob = await toBlob(canvas);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slug(state?.title)}-${target.w}x${target.h}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return blob;
}
