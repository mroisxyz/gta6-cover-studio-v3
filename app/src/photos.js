// Local-only photo loading. Files are read with FileReader in the browser and
// bundled samples are fetched from the app's own samples/ folder. Nothing is
// ever uploaded, posted, or requested from a third party.

export const SAMPLE_IDS = Object.freeze(['pier', 'boulevard']);

export const FALLBACK_FOCAL = Object.freeze({ fx: 0.5, fy: 0.42 });

const focalCache = new WeakMap();
let scratchCanvas = null;
let scratchContext = null;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function safeSampleName(name) {
  return typeof name === 'string' && /^[a-z0-9_-]+$/i.test(name) ? name : null;
}

async function bitmapFromBlob(blob) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(blob);
  }
  // Older browsers: an Image is still fine for canvas drawImage.
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = (event) => {
      URL.revokeObjectURL(url);
      reject(event);
    };
    image.src = url;
  });
}

function getScratch() {
  if (!scratchCanvas) {
    scratchCanvas = document.createElement('canvas');
    scratchCanvas.width = 32;
    scratchCanvas.height = 32;
    scratchContext = scratchCanvas.getContext('2d', { willReadFrequently: true });
  }
  return scratchContext;
}

/**
 * Content-aware focal point.
 * Draws a 32x32 thumbnail, scores skin-like pixels and returns the weighted
 * centroid as normalised fx/fy. Skin in the upper half gets a 1.5x weight.
 * Results are cached per image object. Falls back to (0.5, 0.42).
 */
export function findFocalPoint(image) {
  if (!image) return { ...FALLBACK_FOCAL };
  const cached = focalCache.get(image);
  if (cached) return cached;

  let result = { ...FALLBACK_FOCAL };
  try {
    const ctx = getScratch();
    if (ctx) {
      ctx.clearRect(0, 0, 32, 32);
      ctx.drawImage(image, 0, 0, 32, 32);
      const { data } = ctx.getImageData(0, 0, 32, 32);
      let weightX = 0;
      let weightY = 0;
      let total = 0;

      for (let y = 0; y < 32; y += 1) {
        for (let x = 0; x < 32; x += 1) {
          const i = (y * 32 + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 128) continue;

          const isSkin =
            r > 95 && g > 40 && b > 20 &&
            r > g && r > b &&
            Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
            Math.abs(r - g) > 15;
          if (!isSkin) continue;

          const weight = y < 16 ? 1.5 : 1;
          weightX += (x + 0.5) * weight;
          weightY += (y + 0.5) * weight;
          total += weight;
        }
      }

      if (total > 0) {
        result = {
          fx: clamp(weightX / total / 32, 0, 1),
          fy: clamp(weightY / total / 32, 0, 1),
        };
      }
    }
  } catch {
    result = { ...FALLBACK_FOCAL };
  }

  focalCache.set(image, result);
  return result;
}

export class PhotoManager {
  constructor() {
    this.images = new Map();
    this.labels = new Map();
    this.sequence = 0;
    this.samplesLoaded = false;
  }

  get(id) {
    return typeof id === 'string' ? this.images.get(id) : undefined;
  }

  has(id) {
    return this.images.has(id);
  }

  ids() {
    return [...this.images.keys()];
  }

  label(id) {
    return this.labels.get(id) ?? String(id ?? 'untitled');
  }

  /** Register an already-decoded image (used by tests and internal helpers). */
  register(id, image, label = id) {
    this.images.set(id, image);
    this.labels.set(id, String(label));
    return id;
  }

  /** Bundled sample, fetched from this app's own samples/ directory. */
  async loadSample(name) {
    const safe = safeSampleName(name);
    if (!safe) throw new Error(`Unknown sample: ${String(name)}`);
    if (this.images.has(safe)) return safe;

    const url = new URL(`../samples/${safe}.jpg`, import.meta.url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not load sample ${safe}: ${response.status}`);
    const blob = await response.blob();
    const image = await bitmapFromBlob(blob);
    this.register(safe, image, `${safe}.jpg`);
    return safe;
  }

  async loadAllSamples() {
    const loaded = [];
    for (const id of SAMPLE_IDS) {
      try {
        loaded.push(await this.loadSample(id));
      } catch (error) {
        // The studio still works with uploads if a sample cannot be decoded.
        console.warn(`[photos] ${String(error)}`);
      }
    }
    this.samplesLoaded = true;
    return loaded;
  }

  /** Local file only: FileReader -> Blob -> createImageBitmap. No upload. */
  async loadFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('Choose an image file.');
    }
    const buffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
      reader.readAsArrayBuffer(file);
    });
    const blob = new Blob([buffer], { type: file.type });
    const image = await bitmapFromBlob(blob);
    const id = `file:${Date.now().toString(36)}:${(this.sequence += 1)}`;
    this.register(id, image, file.name);
    return id;
  }

  /** Cached content-aware focal point for an image id or decoded image. */
  focal(idOrImage) {
    const image = typeof idOrImage === 'string' ? this.get(idOrImage) : idOrImage;
    return findFocalPoint(image);
  }

  // Same named API as the module-level helper, for callers that reach the
  // manager instance directly.
  findFocalPoint(idOrImage) {
    return this.focal(idOrImage);
  }
}

// One shared instance keeps thumbnails, preview and export in sync.
export const photoManager = new PhotoManager();
