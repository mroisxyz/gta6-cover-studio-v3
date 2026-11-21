// Comic-panel geometry. Every rectangle is stored in normalised poster space
// (0..1 on both axes) so the same art direction scales to a square post, a
// story and a wide banner. Slot zero is the hero panel.

function slot(x, y, w, h, rot) {
  return { x, y, w, h, rot };
}

const WIDE_SLOTS = [
  slot(0.04, 0.21, 0.36, 0.475, -1.6),
  slot(0.43, 0.21, 0.245, 0.15, 1.8),
  slot(0.71, 0.225, 0.245, 0.145, -2.2),
  slot(0.43, 0.385, 0.245, 0.15, -1.4),
  slot(0.71, 0.395, 0.245, 0.15, 2.4),
  slot(0.43, 0.56, 0.245, 0.125, 1.2),
  slot(0.71, 0.56, 0.245, 0.125, -1.7),
];

const SQUARE_SLOTS = [
  slot(0.05, 0.21, 0.54, 0.34, -1.6),
  slot(0.62, 0.21, 0.33, 0.10, 2.1),
  slot(0.62, 0.32, 0.33, 0.105, -2.4),
  slot(0.62, 0.435, 0.33, 0.115, 1.5),
  slot(0.05, 0.58, 0.28, 0.14, -1.3),
  slot(0.35, 0.58, 0.28, 0.14, 1.8),
  slot(0.65, 0.58, 0.30, 0.14, -1.1),
];

const PORTRAIT_SLOTS = [
  slot(0.05, 0.19, 0.90, 0.30, -1.2),
  slot(0.05, 0.515, 0.28, 0.13, 1.9),
  slot(0.36, 0.515, 0.28, 0.13, -2.2),
  slot(0.67, 0.515, 0.28, 0.13, 1.4),
  slot(0.05, 0.665, 0.28, 0.115, -1.6),
  slot(0.36, 0.665, 0.28, 0.115, 2.0),
  slot(0.67, 0.665, 0.28, 0.115, -1.3),
];

export const COMPOSITION_ZONES = {
  wide: { titleTop: 0.735, titleBottom: 0.925, billingTop: 0.955, headerY: 0.045 },
  square: { titleTop: 0.75, titleBottom: 0.935, billingTop: 0.96, headerY: 0.04 },
  portrait: { titleTop: 0.80, titleBottom: 0.95, billingTop: 0.972, headerY: 0.035 },
};

export function aspectClass(width, height) {
  const ratio = width / height;
  if (ratio >= 1.45) return 'wide';
  if (ratio >= 0.92) return 'square';
  return 'portrait';
}

function mirrorSlot(s) {
  return slot(1 - s.x - s.w, s.y, s.w, s.h, -s.rot);
}

// Returns hero-first panel specs with layout flavour applied. `layoutId`
// reshuffles the composition: SHOWCASE is the base, MARQUEE mirrors it and
// makes the last slot the hero, MOSAIC promotes a mid-grid slot to the hero.
export function computePanelSpecs(layoutId, width, height) {
  const kind = aspectClass(width, height);
  const base = kind === 'wide' ? WIDE_SLOTS : kind === 'square' ? SQUARE_SLOTS : PORTRAIT_SLOTS;
  let rects = base.slice();
  let heroIndex = 0;

  if (layoutId === 'marquee') {
    rects = base.map(mirrorSlot);
    heroIndex = 6;
  } else if (layoutId === 'mosaic') {
    heroIndex = 3;
  }

  const specs = rects.map((r, index) => ({
    x: r.x,
    y: r.y,
    w: r.w,
    h: r.h,
    rot: r.rot * (layoutId === 'mosaic' ? 1.35 : 1),
    imageIndex: index === heroIndex ? 0 : (index % 2),
    hero: index === heroIndex,
    index,
  }));

  // Move the chosen hero to the front so slot zero always draws last (on top).
  const hero = specs.splice(heroIndex, 1)[0];
  specs.unshift(hero);
  return specs;
}

export function compositionZones(width, height) {
  return COMPOSITION_ZONES[aspectClass(width, height)];
}
