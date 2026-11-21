// Entry point. Cover mode paints a finished poster on the demo stage; the
// default view is the live studio. All query parameters are local conveniences.

import { EXPORT_SIZES, LAYOUTS, createDefaultState } from './config.js';
import { photoManager } from './photos.js';
import { renderPosterCanvas } from './render.js';
import { startEditor } from './editor.js';

const params = new URLSearchParams(window.location.search);

function modeFromParams() {
  if (params.get('demo') === 'cover' || params.get('shot') === 'cover') return 'cover';
  return 'editor'; // demo=editor, demo=1, shot=editor, or no params
}

function sizeFromParams() {
  const requested = params.get('size');
  return EXPORT_SIZES[requested] ? requested : 'wide';
}

function assignPhotoToAllPanels(state, imageId) {
  const layout = LAYOUTS[state.layoutId];
  if (!layout || !imageId) return;
  if (!state.photos) state.photos = {};
  layout.panels.forEach((panel) => {
    state.photos[panel.id] = imageId;
  });
}

async function loadRequestedPhoto(state) {
  const requested = params.get('photo');
  if (!requested || !/^[a-z0-9_-]+$/i.test(requested)) return;
  try {
    const id = await photoManager.loadSample(requested);
    assignPhotoToAllPanels(state, id);
  } catch (error) {
    console.warn(`[app] ${String(error)}`);
  }
}

function applyTextParams(state) {
  const caption = params.get('caption');
  if (caption) {
    state.caption = caption;
    state.title = caption.toUpperCase();
  }
  const title = params.get('title');
  if (title) state.title = title;
}

async function showCover(state) {
  document.body.classList.remove('mode-editor');
  document.body.classList.add('mode-cover');
  const stage = document.getElementById('stageCanvas');
  const note = document.getElementById('demoNote');
  const size = EXPORT_SIZES[state.sizeId];
  if (!stage) return;

  stage.width = size.w;
  stage.height = size.h;
  state.width = size.w;
  state.height = size.h;

  try {
    renderPosterCanvas(stage, state);
    if (note) {
      note.textContent = `${size.label.toUpperCase()} EXPORT · ${size.w} × ${size.h} · ${state.title} · ORIGINAL COVER ART`;
    }
  } catch (error) {
    if (note) note.textContent = `Render failed: ${String(error?.message ?? error)}`;
  }
}

async function showEditor(state) {
  document.body.classList.remove('mode-cover');
  document.body.classList.add('mode-editor');
  try {
    await startEditor(state);
  } catch (error) {
    const status = document.getElementById('editorStatus');
    if (status) status.textContent = `Studio failed to start: ${String(error?.message ?? error)}`;
    console.error(error);
  }
}

async function main() {
  const state = createDefaultState();
  state.sizeId = sizeFromParams();
  const size = EXPORT_SIZES[state.sizeId];
  state.width = size.w;
  state.height = size.h;
  applyTextParams(state);

  await photoManager.loadAllSamples();
  await loadRequestedPhoto(state);

  if (modeFromParams() === 'cover') await showCover(state);
  else await showEditor(state);
}

main().catch((error) => {
  console.error(error);
  const note = document.getElementById('demoNote');
  if (note) note.textContent = `Startup failed: ${String(error?.message ?? error)}`;
});
