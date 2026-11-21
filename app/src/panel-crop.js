// Per-panel photo framing. The controller keeps one crop transform for every
// comic panel and converts a normalised crop into a concrete drawImage rect,
// so dragging a panel and moving a slider share exactly the same math.

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function naturalSize(image) {
  return {
    w: image.naturalWidth || image.width || 1,
    h: image.naturalHeight || image.height || 1,
  };
}

function freshCrop() {
  // Sample photos are portrait; a slight upward bias keeps faces in frame
  // inside the wide comic panels without any manual adjustment.
  return { zoom: 1, ox: 0, oy: 0.8 };
}

export class PanelCropController {
  constructor(panelCount) {
    this.crops = Array.from({ length: panelCount }, freshCrop);
    this.assignments = Array.from({ length: panelCount }, (_, i) => (i === 0 ? 0 : i % 2));
    this.activeIndex = 0;
  }

  setPanelCount(count) {
    while (this.crops.length < count) this.crops.push(freshCrop());
    while (this.assignments.length < count) this.assignments.push(0);
    this.crops.length = count;
    this.assignments.length = count;
    this.activeIndex = clamp(this.activeIndex, 0, count - 1);
  }

  setActive(index) {
    this.activeIndex = clamp(index, 0, this.crops.length - 1);
    return this.active();
  }

  active() {
    return this.crops[this.activeIndex];
  }

  cropAt(index) {
    return this.crops[index];
  }

  assignmentAt(index) {
    return this.assignments[index] ?? 0;
  }

  setZoom(index, zoom) {
    this.crops[index].zoom = clamp(zoom, 1, 3.2);
    return this.crops[index];
  }

  setOffset(index, ox, oy) {
    this.crops[index].ox = clamp(ox, -1, 1);
    this.crops[index].oy = clamp(oy, -1, 1);
    return this.crops[index];
  }

  nudge(index, dx, dy) {
    const crop = this.crops[index];
    return this.setOffset(index, crop.ox + dx, crop.oy + dy);
  }

  assign(index, imageIndex) {
    this.assignments[index] = Math.max(0, imageIndex);
  }

  offsetRanges(image, innerWidth, innerHeight, zoom) {
    const size = naturalSize(image);
    const base = Math.max(innerWidth / size.w, innerHeight / size.h);
    const scale = base * (zoom ?? 1);
    const dw = size.w * scale;
    const dh = size.h * scale;
    return {
      x: Math.max(0, (dw - innerWidth) / 2),
      y: Math.max(0, (dh - innerHeight) / 2),
    };
  }

  // Destination rectangle for drawImage, expressed relative to the panel's
  // inner (gutter-free) rectangle.
  computeImagePlacement(image, innerWidth, innerHeight, crop) {
    const size = naturalSize(image);
    const base = Math.max(innerWidth / size.w, innerHeight / size.h);
    const scale = base * crop.zoom;
    const dw = size.w * scale;
    const dh = size.h * scale;
    const rangeX = Math.max(0, (dw - innerWidth) / 2);
    const rangeY = Math.max(0, (dh - innerHeight) / 2);
    return {
      dx: (innerWidth - dw) / 2 + crop.ox * rangeX,
      dy: (innerHeight - dh) / 2 + crop.oy * rangeY,
      dw,
      dh,
    };
  }

  resetPanel(index) {
    this.crops[index] = freshCrop();
  }

  resetAll() {
    this.crops = this.crops.map(freshCrop);
  }

  serialize() {
    return {
      crops: this.crops.map((c) => ({ ...c })),
      assignments: this.assignments.slice(),
      activeIndex: this.activeIndex,
    };
  }

  restore(saved) {
    if (!saved) return;
    if (Array.isArray(saved.crops)) {
      saved.crops.forEach((c, i) => {
        if (this.crops[i]) this.crops[i] = { ...freshCrop(), ...c };
      });
    }
    if (Array.isArray(saved.assignments)) {
      saved.assignments.forEach((a, i) => {
        if (i < this.assignments.length) this.assignments[i] = a;
      });
    }
  }
}

export { clamp };
