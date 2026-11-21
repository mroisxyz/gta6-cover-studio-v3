// Panel layout, crop control and the cover-fit draw routine.
// The draw routine always fills its rectangle: no letterboxing, no empty fills.

import { FALLBACK_FOCAL, photoManager } from './photos.js';

// Face panels use a wider crop so the head and shoulders both stay in frame.
const FACE_ZOOM = 1.06;
const SCENE_ZOOM = 1.0;
// Bias face focals into the upper part of the source image (where faces sit).
const FACE_FOCAL_Y_MAX = 0.32;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function finiteOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Turn a layout's fractional panel definitions into pixel rectangles.
 * A small uniform inset leaves the near-black gutters between panels.
 */
export function buildPanelSpecs(layout, W, H) {
  const panels = layout?.panels ?? [];
  const gap = Math.max(1, Math.round(Math.min(W, H) * 0.0045));
  return panels.map((panel, index) => {
    const x = panel.x * W + gap;
    const y = panel.y * H + gap;
    const w = Math.max(1, panel.w * W - gap * 2);
    const h = Math.max(1, panel.h * H - gap * 2);
    return {
      ...panel,
      index,
      // cropStyle is metadata only; the x/y/w/h geometry is unchanged.
      rect: { x, y, w, h, cropStyle: panel.cropStyle },
      zoom: panel.cropStyle === 'face' ? FACE_ZOOM : SCENE_ZOOM,
    };
  });
}

/**
 * CORRECT cover-fit crop, with an optional extra zoom (tighter crop).
 * scale/sw/sh/sx/sy follow the published recipe exactly; zoom only shrinks
 * the source window, so the destination rectangle is always completely covered.
 * Face panels (identified by the panel's cropStyle) bias the focal point toward
 * the top of the image and keep the crop wide enough to include head and shoulders.
 */
export function drawPhotoCover(ctx, image, rect, focal, zoom = 1, cropStyle) {
  if (!image || !rect || rect.w <= 0 || rect.h <= 0) return;
  const iw = image.width || 1;
  const ih = image.height || 1;
  const isFace = (cropStyle ?? rect?.cropStyle) === 'face';

  const scale = Math.max(rect.w / iw, rect.h / ih);
  let sw = rect.w / scale;
  let sh = rect.h / scale;

  const z = clamp(finiteOr(zoom, 1), 1, 4);
  // A face panel never zooms in tighter than the wider head-and-shoulders crop.
  const effectiveZoom = isFace ? Math.min(z, FACE_ZOOM) : z;
  sw = Math.max(1, sw / effectiveZoom);
  sh = Math.max(1, sh / effectiveZoom);
  sw = Math.min(iw, sw);
  sh = Math.min(ih, sh);

  const fx = clamp(finiteOr(focal?.fx, 0.5), 0, 1);
  const baseFy = clamp(finiteOr(focal?.fy, 0.42), 0, 1);
  const fy = isFace ? Math.min(baseFy, FACE_FOCAL_Y_MAX) : baseFy;

  const sx = clamp(fx * iw - sw / 2, 0, Math.max(0, iw - sw));
  const sy = clamp(fy * ih - sh / 2, 0, Math.max(0, ih - sh));

  ctx.drawImage(image, sx, sy, sw, sh, rect.x, rect.y, rect.w, rect.h);
}

/**
 * Holds per-panel focal/zoom overrides. Face panels start at the wider
 * head-and-shoulders crop (1.06x), scene panels start at 1x.
 */
export class PanelCropController {
  constructor(state, manager = photoManager) {
    this.state = state;
    this.manager = manager;
  }

  defaultZoom(spec) {
    return spec?.cropStyle === 'face' ? FACE_ZOOM : SCENE_ZOOM;
  }

  controlFor(panelId) {
    if (!this.state.controls) this.state.controls = {};
    if (!this.state.controls[panelId]) this.state.controls[panelId] = {};
    return this.state.controls[panelId];
  }

  resolve(spec) {
    const panelId = spec?.id;
    const stored = this.state.controls?.[panelId] ?? {};
    const image = this.manager.get(this.state.photos?.[panelId]);
    const focal = image
      ? (Number.isFinite(stored.fx) && Number.isFinite(stored.fy)
          ? { fx: clamp(stored.fx, 0, 1), fy: clamp(stored.fy, 0, 1) }
          : this.manager.findFocalPoint(image))
      : FALLBACK_FOCAL;
    const zoom = clamp(finiteOr(stored.zoom, this.defaultZoom(spec)), 1, 4);
    return { focal, zoom, image };
  }

  set(panelId, patch = {}) {
    const control = this.controlFor(panelId);
    if (Number.isFinite(patch.fx)) control.fx = clamp(patch.fx, 0, 1);
    if (Number.isFinite(patch.fy)) control.fy = clamp(patch.fy, 0, 1);
    if (Number.isFinite(patch.zoom)) control.zoom = clamp(patch.zoom, 1, 4);
    if (patch.manual) control.manual = true;
    return control;
  }

  /** Drag-to-pan: moving the pointer right moves the underlying photo right. */
  pan(panelId, dxPx, dyPx, rect, spec = { id: panelId, cropStyle: 'scene' }) {
    const current = this.resolve(spec);
    const control = this.controlFor(panelId);
    const rw = Math.max(1, rect?.w ?? 1);
    const rh = Math.max(1, rect?.h ?? 1);
    control.fx = clamp(current.focal.fx - (dxPx / rw) * 0.85, 0, 1);
    control.fy = clamp(current.focal.fy - (dyPx / rh) * 0.85, 0, 1);
    control.zoom = current.zoom;
    control.manual = true;
    return control;
  }

  reset(panelId) {
    if (this.state.controls) delete this.state.controls[panelId];
  }

  setPhoto(panelId, imageId) {
    if (!this.state.photos) this.state.photos = {};
    this.state.photos[panelId] = imageId;
    this.reset(panelId);
  }
}
