// Original cover-studio configuration.
// Every colour below comes from the make.fun palette tokens in the brief.
// No external fonts, libraries or network resources are referenced anywhere.

export const TOKENS = Object.freeze({
  ink: '#111222',
  dusk: '#4c5fca',
  orchid: '#813dbb',
  flamingo: '#cc46a0',
  coral: '#f76685',
  tangerine: '#ff885f',
  amber: '#ffa948',
  cream: '#fff1dc',
});

// Three sunset "grades". They reuse the same eight tokens but reorder and
// rebalance them so each preset photographs differently.
export const PALETTES = Object.freeze({
  'dusk-drive': {
    id: 'dusk-drive',
    name: 'Dusk Drive',
    ...TOKENS,
    sky: [TOKENS.dusk, TOKENS.orchid, TOKENS.flamingo, TOKENS.coral, TOKENS.tangerine, TOKENS.amber],
    sun: [TOKENS.cream, TOKENS.amber, TOKENS.tangerine, TOKENS.coral],
    accent: TOKENS.coral,
    glow: TOKENS.tangerine,
  },
  'neon-vice': {
    id: 'neon-vice',
    name: 'Neon Vice',
    ...TOKENS,
    sky: [TOKENS.dusk, TOKENS.orchid, TOKENS.flamingo, TOKENS.coral, TOKENS.orchid, TOKENS.flamingo],
    sun: [TOKENS.cream, TOKENS.flamingo, TOKENS.orchid, TOKENS.coral],
    accent: TOKENS.flamingo,
    glow: TOKENS.orchid,
  },
  'golden-hour': {
    id: 'golden-hour',
    name: 'Golden Hour',
    ...TOKENS,
    sky: [TOKENS.dusk, TOKENS.coral, TOKENS.tangerine, TOKENS.amber, TOKENS.coral, TOKENS.cream],
    sun: [TOKENS.cream, TOKENS.amber, TOKENS.tangerine, TOKENS.coral],
    accent: TOKENS.amber,
    glow: TOKENS.amber,
  },
});

export const TITLE_PRESETS = Object.freeze({
  'neon-mile': {
    id: 'neon-mile',
    label: 'NEON MILE',
    kicker: 'THE CITY NEVER SLEEPS TWICE',
  },
  'palm-heat': {
    id: 'palm-heat',
    label: 'PALM HEAT',
    kicker: 'EVERY SHADOW HAS A PRICE',
  },
  'golden-vice': {
    id: 'golden-vice',
    label: 'GOLDEN VICE',
    kicker: 'SUNSET OVER THE FAST LANE',
  },
});

// Each layout is a 9-panel mosaic: one large hero (~44% of the width), two
// medium panels and six small panels. All coordinates are fractions of the
// canvas; drawPanelSpecs turns them into pixel rectangles.
export const LAYOUTS = Object.freeze({
  mosaic: {
    id: 'mosaic',
    name: 'Mosaic',
    panels: [
      { id: 'hero',   kind: 'hero',   x: 0.035, y: 0.035, w: 0.420, h: 0.500, cropStyle: 'face',  photoIndex: 0, role: 'THE DRIVER' },
      { id: 'mid-1',  kind: 'medium', x: 0.465, y: 0.035, w: 0.280, h: 0.300, cropStyle: 'scene', photoIndex: 1, role: 'THE SKYLINE' },
      { id: 'mid-2',  kind: 'medium', x: 0.755, y: 0.035, w: 0.210, h: 0.300, cropStyle: 'face',  photoIndex: 1, role: 'THE FIXER' },
      { id: 'small-1', kind: 'small', x: 0.465, y: 0.345, w: 0.500, h: 0.105, cropStyle: 'scene', photoIndex: 1, role: 'THE CHASE' },
      { id: 'small-2', kind: 'small', x: 0.465, y: 0.460, w: 0.160, h: 0.340, cropStyle: 'face',  photoIndex: 0, role: 'THE WITNESS' },
      { id: 'small-3', kind: 'small', x: 0.635, y: 0.460, w: 0.330, h: 0.340, cropStyle: 'scene', photoIndex: 1, role: 'THE GETAWAY' },
      { id: 'small-4', kind: 'small', x: 0.035, y: 0.545, w: 0.420, h: 0.115, cropStyle: 'scene', photoIndex: 1, role: 'THE BOULEVARD' },
      { id: 'small-5', kind: 'small', x: 0.035, y: 0.670, w: 0.200, h: 0.130, cropStyle: 'face',  photoIndex: 0, role: 'THE PARTNER' },
      { id: 'small-6', kind: 'small', x: 0.245, y: 0.670, w: 0.210, h: 0.130, cropStyle: 'scene', photoIndex: 0, role: 'THE PIER' },
    ],
  },
  duo: {
    id: 'duo',
    name: 'Duo',
    panels: [
      { id: 'hero',   kind: 'hero',   x: 0.285, y: 0.035, w: 0.420, h: 0.460, cropStyle: 'face',  photoIndex: 0, role: 'THE PAIR' },
      { id: 'mid-1',  kind: 'medium', x: 0.035, y: 0.035, w: 0.240, h: 0.320, cropStyle: 'scene', photoIndex: 1, role: 'THE STREETS' },
      { id: 'mid-2',  kind: 'medium', x: 0.715, y: 0.035, w: 0.250, h: 0.320, cropStyle: 'face',  photoIndex: 1, role: 'THE RIVAL' },
      { id: 'small-1', kind: 'small', x: 0.035, y: 0.365, w: 0.240, h: 0.200, cropStyle: 'face',  photoIndex: 0, role: 'THE LOOKOUT' },
      { id: 'small-2', kind: 'small', x: 0.285, y: 0.505, w: 0.420, h: 0.120, cropStyle: 'scene', photoIndex: 1, role: 'THE LONG ROAD' },
      { id: 'small-3', kind: 'small', x: 0.715, y: 0.365, w: 0.250, h: 0.435, cropStyle: 'scene', photoIndex: 1, role: 'THE NIGHT' },
      { id: 'small-4', kind: 'small', x: 0.035, y: 0.575, w: 0.240, h: 0.225, cropStyle: 'scene', photoIndex: 1, role: 'THE MARKET' },
      { id: 'small-5', kind: 'small', x: 0.285, y: 0.635, w: 0.200, h: 0.165, cropStyle: 'face',  photoIndex: 0, role: 'THE DRIVER' },
      { id: 'small-6', kind: 'small', x: 0.495, y: 0.635, w: 0.210, h: 0.165, cropStyle: 'scene', photoIndex: 0, role: 'THE PIER' },
    ],
  },
  street: {
    id: 'street',
    name: 'Street',
    panels: [
      { id: 'hero',   kind: 'hero',   x: 0.035, y: 0.035, w: 0.440, h: 0.340, cropStyle: 'scene', photoIndex: 1, role: 'THE BOULEVARD' },
      { id: 'mid-1',  kind: 'medium', x: 0.485, y: 0.035, w: 0.240, h: 0.340, cropStyle: 'face',  photoIndex: 0, role: 'THE FACE' },
      { id: 'mid-2',  kind: 'medium', x: 0.735, y: 0.035, w: 0.230, h: 0.340, cropStyle: 'face',  photoIndex: 1, role: 'THE SHADOW' },
      { id: 'small-1', kind: 'small', x: 0.035, y: 0.385, w: 0.200, h: 0.220, cropStyle: 'face',  photoIndex: 0, role: 'THE WITNESS' },
      { id: 'small-2', kind: 'small', x: 0.245, y: 0.385, w: 0.280, h: 0.220, cropStyle: 'scene', photoIndex: 1, role: 'THE TRAFFIC' },
      { id: 'small-3', kind: 'small', x: 0.535, y: 0.385, w: 0.430, h: 0.220, cropStyle: 'scene', photoIndex: 1, role: 'THE HORIZON' },
      { id: 'small-4', kind: 'small', x: 0.035, y: 0.615, w: 0.300, h: 0.185, cropStyle: 'scene', photoIndex: 1, role: 'THE CROSSTOWN' },
      { id: 'small-5', kind: 'small', x: 0.345, y: 0.615, w: 0.300, h: 0.185, cropStyle: 'face',  photoIndex: 0, role: 'THE PARTNER' },
      { id: 'small-6', kind: 'small', x: 0.655, y: 0.615, w: 0.310, h: 0.185, cropStyle: 'scene', photoIndex: 0, role: 'THE WATERFRONT' },
    ],
  },
});

export const EXPORT_SIZES = Object.freeze({
  square:   { id: 'square',   label: 'Square',   w: 1080, h: 1080 },
  portrait: { id: 'portrait', label: 'Portrait', w: 1080, h: 1350 },
  wide:     { id: 'wide',     label: 'Wide',     w: 1920, h: 1080 },
});

export const BILLING = Object.freeze([
  'MAKE FUN PICTURES PRESENTS  A COVER STUDIO PRODUCTION',
  'DIRECTED BY AFTERGLOW  PHOTOGRAPHED BY SUNSET  EDITED BY LAST FRAME',
  'ORIGINAL MUSIC BY THE NEON ORCHESTRA  PRODUCED BY MROISXYZ',
  'AN ORIGINAL MAKE.FUN COVER  ALL PANELS DRAWN LOCALLY  NO PHOTO LEAVES YOUR MACHINE',
]);

export const CAST_ROLES = Object.freeze([
  { tag: '01', role: 'THE DRIVER',   name: 'RIO VALE' },
  { tag: '02', role: 'THE FIXER',    name: 'NOVA KANE' },
  { tag: '03', role: 'THE WILDCARD', name: 'JUNO REY' },
]);

export const DEFAULT_PALETTE = 'dusk-drive';
export const DEFAULT_TITLE_PRESET = 'neon-mile';
export const DEFAULT_LAYOUT = 'mosaic';
export const DEFAULT_SIZE = 'wide';

export function createDefaultState() {
  const size = EXPORT_SIZES[DEFAULT_SIZE];
  const preset = TITLE_PRESETS[DEFAULT_TITLE_PRESET];
  return {
    width: size.w,
    height: size.h,
    sizeId: size.id,
    paletteId: DEFAULT_PALETTE,
    layoutId: DEFAULT_LAYOUT,
    title: preset.label,
    caption: preset.kicker,
    photos: {},
    controls: {},
    showSeal: true,
  };
}
