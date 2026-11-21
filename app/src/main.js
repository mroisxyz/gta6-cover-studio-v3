// Studio bootstrap: wires the editor controls, keeps the live preview in sync
// with the crop controller, handles pointer framing, and switches into the
// large cover view used for screenshots.

import { PanelCropController } from './panel-crop.js';
import { computePanelSpecs } from './panel-layout.js';
import { renderPosterCanvas } from './poster-render.js';
import { exportCoverPng, resolveSize } from './export.js';
import {
  BACKDROP_PALETTES,
  DEFAULT_BILLING,
  DEFAULT_CAPTION,
  DEFAULT_CAST,
  DEFAULT_TITLE,
  POSTER_SIZES,
  SAMPLE_PHOTOS,
  TITLE_TREATMENTS,
} from './presets.js';

const params = new URLSearchParams(window.location.search);
const demoMode = params.get('demo') || params.get('shot') || 'editor';

const state = {
  photos: [],
  title: params.get('title') || DEFAULT_TITLE,
  caption: params.get('caption') || DEFAULT_CAPTION,
  cast: DEFAULT_CAST.map((member) => ({ ...member })),
  billing: DEFAULT_BILLING,
  treatmentId: TITLE_TREATMENTS[params.get('treatment')] ? params.get('treatment') : 'neonMile',
  paletteId: BACKDROP_PALETTES[params.get('palette')] ? params.get('palette') : 'sunsetDrive',
  layoutId: ['showcase', 'mosaic', 'marquee'].includes(params.get('layout')) ? params.get('layout') : 'showcase',
  sizeKey: inferSizeKey(),
  activePanel: 0,
  cropController: new PanelCropController(7),
};

function inferSizeKey() {
  const requested = params.get('size');
  if (POSTER_SIZES[requested]) return requested;
  const w = Number(params.get('w'));
  const h = Number(params.get('h'));
  if (w > 0 && h > 0) {
    const match = Object.values(POSTER_SIZES).find((size) => Math.abs(size.width - w) < 40 && Math.abs(size.height - h) < 40);
    if (match) return match.id;
  }
  return demoMode === 'cover' ? 'wide' : 'square';
}

const el = (id) => document.getElementById(id);
const previewCanvas = el('previewCanvas');
const coverCanvas = el('coverCanvas');
const photoStrip = el('photoStrip');
const panelGrid = el('panelGrid');
const zoomRange = el('zoomRange');
const posXRange = el('posXRange');
const posYRange = el('posYRange');

let framePending = false;
let dragState = null;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not open image'));
    image.src = url;
  });
}

async function addPhoto(url, label, isObjectUrl = false) {
  const image = await loadImage(url);
  const photo = { id: `${state.photos.length}-${Date.now()}`, label, image, url, isObjectUrl };
  state.photos.push(photo);
  renderPhotoStrip();
  renderPanelGrid();
  scheduleRender();
  return photo;
}

async function loadSamplePhotos(preferredId) {
  const ordered = SAMPLE_PHOTOS.slice().sort((a, b) => {
    if (a.id === preferredId) return -1;
    if (b.id === preferredId) return 1;
    return 0;
  });
  await Promise.all(ordered.map((sample) => addPhoto(sample.path, sample.label)));
}

function renderPhotoStrip() {
  if (!photoStrip) return;
  photoStrip.innerHTML = '';
  state.photos.forEach((photo, index) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `photo-chip${state.cropController.assignmentAt(state.activePanel) === index ? ' is-used' : ''}`;
    chip.style.backgroundImage = `url("${photo.url}")`;
    chip.title = `Assign ${photo.label} to panel ${state.activePanel + 1}`;
    chip.innerHTML = `<span>${photo.label}</span>`;
    chip.addEventListener('click', () => {
      state.cropController.assign(state.activePanel, index);
      renderPhotoStrip();
      renderPanelGrid();
      scheduleRender();
    });
    photoStrip.appendChild(chip);
  });
}

function renderPanelGrid() {
  if (!panelGrid) return;
  panelGrid.innerHTML = '';
  const specs = computePanelSpecs(state.layoutId, 1000, 1000);
  specs.forEach((spec) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `panel-chip${spec.hero ? ' is-hero' : ''}${state.activePanel === spec.index ? ' is-active' : ''}`;
    const photo = state.photos[state.cropController.assignmentAt(spec.index)];
    if (photo) button.style.backgroundImage = `url("${photo.url}")`;
    button.innerHTML = `<span>${spec.index + 1}</span>`;
    button.addEventListener('click', () => selectPanel(spec.index));
    panelGrid.appendChild(button);
  });
}

function selectPanel(index) {
  state.activePanel = index;
  state.cropController.setActive(index);
  renderPanelGrid();
  renderPhotoStrip();
  syncCropControls();
}

function syncCropControls() {
  const crop = state.cropController.cropAt(state.activePanel);
  zoomRange.value = String(crop.zoom);
  posXRange.value = String(crop.ox);
  posYRange.value = String(crop.oy);
  const zoomLabel = el('zoomValue');
  const xLabel = el('xValue');
  const yLabel = el('yValue');
  if (zoomLabel) zoomLabel.textContent = `${Math.round(crop.zoom * 100)}%`;
  if (xLabel) xLabel.textContent = `${Math.round(crop.ox * 100)}`;
  if (yLabel) yLabel.textContent = `${Math.round(crop.oy * 100)}`;
  const activeLabel = el('activePanelLabel');
  if (activeLabel) activeLabel.textContent = `PANEL ${state.activePanel + 1}`;
}

function collectConfig(width, height) {
  return {
    width,
    height,
    images: state.photos.map((photo) => photo.image),
    cropController: state.cropController,
    title: state.title,
    caption: state.caption,
    cast: state.cast,
    billing: state.billing,
    treatmentId: state.treatmentId,
    paletteId: state.paletteId,
    layoutId: state.layoutId,
  };
}

function previewDimensions() {
  const size = resolveSize(state.sizeKey);
  const width = 960;
  const height = Math.round((width * size.height) / size.width);
  return { width, height };
}

function renderPreview() {
  const { width, height } = previewDimensions();
  renderPosterCanvas(previewCanvas, collectConfig(width, height));
  const meta = el('previewMeta');
  if (meta) meta.textContent = `${state.sizeKey.toUpperCase()} · ${state.layoutId.toUpperCase()} · ${state.photos.length} PHOTO${state.photos.length === 1 ? '' : 'S'}`;
}

function scheduleRender() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(() => {
    framePending = false;
    renderPreview();
  });
}

function setPreset(group, key, value) {
  document.querySelectorAll(`[data-${group}]`).forEach((button) => {
    button.classList.toggle('is-active', button.dataset[group] === value);
  });
  if (group === 'treatment') {
    state.treatmentId = value;
    const knownTitles = Object.keys(TITLE_TREATMENTS).map((id) => TITLE_TREATMENTS[id].label);
    if (knownTitles.includes(state.title.toUpperCase())) {
      state.title = TITLE_TREATMENTS[value].label;
      const titleInput = el('titleInput');
      if (titleInput) titleInput.value = state.title;
    }
    const captionInput = el('captionInput');
    if (captionInput && knownTitles.includes(state.title.toUpperCase()) && state.caption === DEFAULT_CAPTION) {
      state.caption = TITLE_TREATMENTS[value].captionHint;
      captionInput.value = state.caption;
    }
  } else if (group === 'palette') {
    state.paletteId = value;
  } else if (group === 'layout') {
    state.layoutId = value;
    renderPanelGrid();
  } else if (group === 'size') {
    state.sizeKey = value;
  }
  scheduleRender();
}

function wirePresetGroups() {
  ['treatment', 'palette', 'layout', 'size'].forEach((group) => {
    document.querySelectorAll(`[data-${group}]`).forEach((button) => {
      button.addEventListener('click', () => setPreset(group, group, button.dataset[group]));
    });
  });
}

function wireTextInputs() {
  const titleInput = el('titleInput');
  titleInput.value = state.title;
  titleInput.addEventListener('input', () => {
    state.title = titleInput.value;
    scheduleRender();
  });

  const captionInput = el('captionInput');
  captionInput.value = state.caption;
  captionInput.addEventListener('input', () => {
    state.caption = captionInput.value;
    scheduleRender();
  });

  state.cast.forEach((member, index) => {
    const nameInput = el(`castName${index + 1}`);
    const roleInput = el(`castRole${index + 1}`);
    if (nameInput) {
      nameInput.value = member.name;
      nameInput.addEventListener('input', () => {
        member.name = nameInput.value;
        scheduleRender();
      });
    }
    if (roleInput) {
      roleInput.value = member.role;
      roleInput.addEventListener('input', () => {
        member.role = roleInput.value;
        scheduleRender();
      });
    }
  });

  const billingInput = el('billingInput');
  billingInput.value = state.billing;
  billingInput.addEventListener('input', () => {
    state.billing = billingInput.value;
    scheduleRender();
  });
}

function wireCropControls() {
  zoomRange.addEventListener('input', () => {
    state.cropController.setZoom(state.activePanel, Number(zoomRange.value));
    syncCropControls();
    scheduleRender();
  });
  posXRange.addEventListener('input', () => {
    const crop = state.cropController.cropAt(state.activePanel);
    state.cropController.setOffset(state.activePanel, Number(posXRange.value), crop.oy);
    syncCropControls();
    scheduleRender();
  });
  posYRange.addEventListener('input', () => {
    const crop = state.cropController.cropAt(state.activePanel);
    state.cropController.setOffset(state.activePanel, crop.ox, Number(posYRange.value));
    syncCropControls();
    scheduleRender();
  });
  el('resetCropBtn').addEventListener('click', () => {
    state.cropController.resetPanel(state.activePanel);
    syncCropControls();
    scheduleRender();
  });
}

function activePanelGeometry() {
  const { width, height } = previewDimensions();
  const specs = computePanelSpecs(state.layoutId, width, height);
  const spec = specs.find((entry) => entry.index === state.activePanel) || specs[0];
  const unit = Math.min(width, height);
  const gutter = Math.max(4, unit * (spec.hero ? 0.013 : 0.009));
  return {
    spec,
    width,
    height,
    innerWidth: spec.w * width - gutter * 2,
    innerHeight: spec.h * height - gutter * 2,
  };
}

function hitTestPanel(clientX, clientY) {
  const rect = previewCanvas.getBoundingClientRect();
  const u = ((clientX - rect.left) / rect.width) * previewCanvas.width;
  const v = ((clientY - rect.top) / rect.height) * previewCanvas.height;
  const { width, height } = previewDimensions();
  const specs = computePanelSpecs(state.layoutId, width, height);
  for (let i = specs.length - 1; i >= 0; i -= 1) {
    const s = specs[i];
    if (u >= s.x * width && u <= (s.x + s.w) * width && v >= s.y * height && v <= (s.y + s.h) * height) {
      return s.index;
    }
  }
  return null;
}

function wirePreviewPointer() {
  previewCanvas.addEventListener('pointerdown', (event) => {
    const hit = hitTestPanel(event.clientX, event.clientY);
    if (hit !== null && hit !== state.activePanel) selectPanel(hit);
    const geometry = activePanelGeometry();
    const crop = state.cropController.cropAt(state.activePanel);
    const image = state.photos[state.cropController.assignmentAt(state.activePanel)]?.image;
    if (!image) return;
    const ranges = state.cropController.offsetRanges(image, geometry.innerWidth, geometry.innerHeight, crop.zoom);
    dragState = {
      startX: event.clientX,
      startY: event.clientY,
      ox: crop.ox,
      oy: crop.oy,
      ranges,
      scaleX: previewCanvas.width / previewCanvas.getBoundingClientRect().width,
      scaleY: previewCanvas.height / previewCanvas.getBoundingClientRect().height,
    };
    previewCanvas.setPointerCapture(event.pointerId);
    previewCanvas.classList.add('is-dragging');
  });

  previewCanvas.addEventListener('pointermove', (event) => {
    if (!dragState) return;
    const dx = (event.clientX - dragState.startX) * dragState.scaleX;
    const dy = (event.clientY - dragState.startY) * dragState.scaleY;
    const ox = dragState.ox + dx / Math.max(1, dragState.ranges.x * 2);
    const oy = dragState.oy + dy / Math.max(1, dragState.ranges.y * 2);
    state.cropController.setOffset(state.activePanel, ox, oy);
    syncCropControls();
    scheduleRender();
  });

  const finish = () => {
    dragState = null;
    previewCanvas.classList.remove('is-dragging');
  };
  previewCanvas.addEventListener('pointerup', finish);
  previewCanvas.addEventListener('pointercancel', finish);
}

function wireUpload() {
  const input = el('addPhotoInput');
  input.addEventListener('change', async () => {
    const files = Array.from(input.files || []);
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      await addPhoto(URL.createObjectURL(file), file.name.replace(/\.[^.]+$/, '').slice(0, 14).toUpperCase(), true);
    }
    input.value = '';
  });
  el('addPhotoBtn').addEventListener('click', () => input.click());
}

function wireExport() {
  el('exportBtn').addEventListener('click', async () => {
    const button = el('exportBtn');
    button.disabled = true;
    button.textContent = 'RENDERING…';
    try {
      await exportCoverPng(collectConfig(1080, 1080), state.sizeKey);
      button.textContent = 'PNG SAVED ✓';
    } catch (error) {
      button.textContent = 'EXPORT FAILED';
      console.error(error);
    } finally {
      setTimeout(() => {
        button.disabled = false;
        button.textContent = 'EXPORT PNG';
      }, 1600);
    }
  });
}

function showCoverStage() {
  document.body.classList.add('cover-mode');
  const size = resolveSize(state.sizeKey);
  renderPosterCanvas(coverCanvas, collectConfig(size.width, size.height));
  const label = el('coverLabel');
  if (label) label.textContent = `EXPORTED PNG · ${size.width} × ${size.height}`;
}

async function boot() {
  const preferred = params.get('photo');
  await loadSamplePhotos(preferred === 'pier' || preferred === 'boulevard' ? preferred : 'boulevard');
  setPreset('treatment', 'treatment', state.treatmentId);
  setPreset('palette', 'palette', state.paletteId);
  setPreset('layout', 'layout', state.layoutId);
  setPreset('size', 'size', state.sizeKey);

  if (demoMode === 'cover') {
    showCoverStage();
    return;
  }

  wirePresetGroups();
  wireTextInputs();
  wireCropControls();
  wirePreviewPointer();
  wireUpload();
  wireExport();
  selectPanel(0);
  renderPhotoStrip();
  renderPanelGrid();
  renderPreview();
}

boot().catch((error) => {
  console.error(error);
  const note = el('bootError');
  if (note) note.textContent = 'Could not start the studio.';
});
