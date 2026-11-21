// Live studio wiring: uploads, per-panel focal/zoom controls, drag-to-pan,
// presets, gallery assignment and the preview canvas.

import {
  PALETTES,
  LAYOUTS,
  EXPORT_SIZES,
  TITLE_PRESETS,
  createDefaultState,
} from './config.js';
import { photoManager } from './photos.js';
import { buildPanelSpecs, drawPhotoCover, PanelCropController } from './panels.js';
import { renderPosterCanvas } from './render.js';
import { exportCoverPng } from './export.js';

function byId(id) {
  return document.getElementById(id);
}

function addOptions(select, entries) {
  if (!select) return;
  select.textContent = '';
  entries.forEach(({ value, label }) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  });
}

/** Fill any unassigned panels with the bundled samples in layout order. */
export function assignDefaultPhotos(state, specs) {
  if (!state.photos) state.photos = {};
  const ids = photoManager.ids();
  specs.forEach((spec) => {
    if (!ids.includes(state.photos[spec.id])) {
      state.photos[spec.id] = ids[spec.photoIndex ?? (spec.index % Math.max(1, ids.length))] ?? ids[0];
    }
  });
}

export async function startEditor(initialState) {
  const state = initialState ?? createDefaultState();
  const canvas = byId('editorCanvas');
  const status = byId('editorStatus');
  if (!canvas) return { state, render: () => {} };

  const titleInput = byId('titleInput');
  const titlePresetSelect = byId('titlePresetSelect');
  const captionInput = byId('captionInput');
  const paletteSelect = byId('paletteSelect');
  const layoutSelect = byId('layoutSelect');
  const sizeSelect = byId('sizeSelect');
  const panelSelect = byId('panelSelect');
  const focalX = byId('focalX');
  const focalY = byId('focalY');
  const zoomRange = byId('zoomRange');
  const zoomValue = byId('zoomValue');
  const photoInput = byId('photoInput');
  const gallery = byId('photoGallery');
  const exportButton = byId('exportBtn');
  const resetButton = byId('resetPanelBtn');

  let specs = buildPanelSpecs(LAYOUTS[state.layoutId], state.width, state.height);
  let selectedPanel = specs[0]?.id ?? 'hero';
  let controller = new PanelCropController(state, photoManager);
  let dragging = null;

  function setStatus(text) {
    if (status) status.textContent = text;
  }

  function specFor(id) {
    return specs.find((spec) => spec.id === id) ?? specs[0];
  }

  function render() {
    renderPosterCanvas(canvas, state);
  }

  function syncSliders() {
    const spec = specFor(selectedPanel);
    if (!spec) return;
    const { focal, zoom } = controller.resolve(spec);
    if (focalX) focalX.value = String(Math.round(focal.fx * 100));
    if (focalY) focalY.value = String(Math.round(focal.fy * 100));
    if (zoomRange) zoomRange.value = String(Math.round(zoom * 100));
    if (zoomValue) zoomValue.textContent = `${zoom.toFixed(2)}×`;
  }

  function markGallery() {
    if (!gallery) return;
    const active = state.photos?.[selectedPanel];
    [...gallery.querySelectorAll('.thumb')].forEach((button) => {
      button.classList.toggle('is-active', button.dataset.photoId === active);
    });
  }

  function buildGallery() {
    if (!gallery) return;
    gallery.textContent = '';
    photoManager.ids().forEach((id, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'thumb';
      button.dataset.photoId = id;
      button.title = photoManager.label(id);

      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 96;
      thumbCanvas.height = 72;
      const tctx = thumbCanvas.getContext('2d');
      const image = photoManager.get(id);
      if (tctx && image) {
        tctx.fillStyle = '#111222';
        tctx.fillRect(0, 0, 96, 72);
        drawPhotoCover(tctx, image, { x: 0, y: 0, w: 96, h: 72 }, photoManager.findFocalPoint(image), 1);
      }
      button.appendChild(thumbCanvas);

      const label = document.createElement('span');
      label.textContent = `${index + 1}. ${photoManager.label(id)}`;
      button.appendChild(label);

      button.addEventListener('click', () => {
        controller.setPhoto(selectedPanel, id);
        markGallery();
        syncSliders();
        render();
        setStatus(`Assigned ${photoManager.label(id)} to ${selectedPanel}.`);
      });
      gallery.appendChild(button);
    });
    markGallery();
  }

  function syncUI() {
    if (titleInput) titleInput.value = state.title ?? '';
    if (titlePresetSelect) {
      const match = Object.values(TITLE_PRESETS).find((preset) => preset.label === state.title);
      if (match) titlePresetSelect.value = match.id;
    }
    if (captionInput) captionInput.value = state.caption ?? '';
    if (paletteSelect) paletteSelect.value = state.paletteId;
    if (layoutSelect) layoutSelect.value = state.layoutId;
    if (sizeSelect) sizeSelect.value = state.sizeId;
    if (panelSelect) panelSelect.value = selectedPanel;
    syncSliders();
    markGallery();
  }

  function rebuildPanels() {
    specs = buildPanelSpecs(LAYOUTS[state.layoutId], state.width, state.height);
    controller = new PanelCropController(state, photoManager);
    if (!specs.some((spec) => spec.id === selectedPanel)) selectedPanel = specs[0]?.id ?? 'hero';
    assignDefaultPhotos(state, specs);
    if (panelSelect) {
      panelSelect.textContent = '';
      specs.forEach((spec) => {
        const option = document.createElement('option');
        option.value = spec.id;
        option.textContent = `${spec.id} · ${spec.kind} · ${spec.cropStyle}`;
        panelSelect.appendChild(option);
      });
      panelSelect.value = selectedPanel;
    }
  }

  function applySize(id) {
    const size = EXPORT_SIZES[id] ?? EXPORT_SIZES[state.sizeId];
    state.sizeId = size.id;
    state.width = size.w;
    state.height = size.h;
    canvas.width = size.w;
    canvas.height = size.h;
    rebuildPanels();
    syncUI();
    render();
    setStatus(`Preview set to ${size.label} ${size.w} × ${size.h}.`);
  }

  function pointFromEvent(event) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * state.width,
      y: ((event.clientY - bounds.top) / Math.max(1, bounds.height)) * state.height,
    };
  }

  function findPanelAt(point) {
    return [...specs].reverse().find((spec) => (
      point.x >= spec.rect.x && point.x <= spec.rect.x + spec.rect.w &&
      point.y >= spec.rect.y && point.y <= spec.rect.y + spec.rect.h
    ));
  }

  function wireEvents() {
    titleInput?.addEventListener('input', () => {
      state.title = titleInput.value;
      render();
    });
    captionInput?.addEventListener('input', () => {
      state.caption = captionInput.value;
      render();
    });
    titlePresetSelect?.addEventListener('change', () => {
      const preset = TITLE_PRESETS[titlePresetSelect.value];
      if (!preset) return;
      state.title = preset.label;
      state.caption = preset.kicker;
      syncUI();
      render();
      setStatus(`Title preset: ${preset.label}.`);
    });
    paletteSelect?.addEventListener('change', () => {
      state.paletteId = paletteSelect.value;
      render();
    });
    layoutSelect?.addEventListener('change', () => {
      state.layoutId = layoutSelect.value;
      rebuildPanels();
      syncUI();
      render();
      setStatus(`Layout changed to ${LAYOUTS[state.layoutId].name}.`);
    });
    sizeSelect?.addEventListener('change', () => applySize(sizeSelect.value));
    panelSelect?.addEventListener('change', () => {
      selectedPanel = panelSelect.value;
      syncSliders();
      markGallery();
    });

    focalX?.addEventListener('input', () => {
      controller.set(selectedPanel, { fx: Number(focalX.value) / 100, manual: true });
      syncSliders();
      render();
    });
    focalY?.addEventListener('input', () => {
      controller.set(selectedPanel, { fy: Number(focalY.value) / 100, manual: true });
      syncSliders();
      render();
    });
    zoomRange?.addEventListener('input', () => {
      controller.set(selectedPanel, { zoom: Number(zoomRange.value) / 100, manual: true });
      syncSliders();
      render();
    });
    resetButton?.addEventListener('click', () => {
      controller.reset(selectedPanel);
      syncSliders();
      render();
      setStatus(`${selectedPanel} crop reset.`);
    });

    photoInput?.addEventListener('change', async () => {
      const files = [...(photoInput.files ?? [])];
      for (const file of files) {
        try {
          const id = await photoManager.loadFile(file);
          controller.setPhoto(selectedPanel, id);
          setStatus(`Loaded ${photoManager.label(id)} locally.`);
        } catch (error) {
          setStatus(String(error?.message ?? error));
        }
      }
      if (files.length) {
        photoInput.value = '';
        buildGallery();
        syncUI();
        render();
      }
    });

    exportButton?.addEventListener('click', async () => {
      try {
        setStatus('Rendering full-resolution PNG…');
        await exportCoverPng(state, state.sizeId);
        setStatus(`Downloaded ${state.title || 'cover'} at ${state.width} × ${state.height}.`);
      } catch (error) {
        setStatus(`Export failed: ${String(error?.message ?? error)}`);
      }
    });

    canvas.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      const point = pointFromEvent(event);
      const spec = findPanelAt(point);
      if (!spec) return;
      selectedPanel = spec.id;
      dragging = { id: spec.id, spec, x: point.x, y: point.y };
      if (typeof canvas.setPointerCapture === 'function') canvas.setPointerCapture(event.pointerId);
      syncUI();
      setStatus(`Panning ${spec.id} — drag on the preview.`);
      event.preventDefault();
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const point = pointFromEvent(event);
      controller.pan(dragging.id, point.x - dragging.x, point.y - dragging.y, dragging.spec.rect, dragging.spec);
      dragging.x = point.x;
      dragging.y = point.y;
      syncSliders();
      render();
      event.preventDefault();
    });
    const endDrag = () => { dragging = null; };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('lostpointercapture', endDrag);
  }

  // Populate selectors once; layout-dependent panel choices come from rebuildPanels.
  addOptions(paletteSelect, Object.values(PALETTES).map((p) => ({ value: p.id, label: p.name })));
  addOptions(layoutSelect, Object.values(LAYOUTS).map((l) => ({ value: l.id, label: l.name })));
  addOptions(sizeSelect, Object.values(EXPORT_SIZES).map((s) => ({ value: s.id, label: `${s.label} · ${s.w}×${s.h}` })));
  addOptions(titlePresetSelect, Object.values(TITLE_PRESETS).map((t) => ({ value: t.id, label: t.label })));

  await photoManager.loadAllSamples();
  rebuildPanels();
  wireEvents();
  buildGallery();
  syncUI();
  canvas.width = state.width;
  canvas.height = state.height;
  render();
  setStatus(`Ready — ${photoManager.ids().length} local photos, ${specs.length} panels.`);

  return { state, render, rebuildPanels };
}
