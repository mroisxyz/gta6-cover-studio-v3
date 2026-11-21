// Preset art direction for the cover studio. A title treatment bundles the
// chrome gradient, the neon stripes and the glow used by drawChromeTitle,
// while a backdrop palette drives the sky, the sun disc and the photo grade.
// All colours are original; nothing here is taken from a game's artwork.

export const TITLE_TREATMENTS = {
  neonMile: {
    id: 'neonMile',
    label: 'NEON MILE',
    captionHint: 'ONE NIGHT. NO RULES.',
    chrome: ['#eafcff', '#9ff6ff', '#25d6ee', '#0a6c92', '#0a2742', '#22c8ea', '#cdfaff'],
    stripes: ['#ff36bd', '#16e8ff'],
    extrusion: '#2f0843',
    outline: '#070b1c',
    glow: '#20e6ff',
    accent: '#ff36bd',
  },
  palmHeat: {
    id: 'palmHeat',
    label: 'PALM HEAT',
    captionHint: 'THE SUN SETS. THE HEAT RISES.',
    chrome: ['#fff6d8', '#ffc46b', '#ff7043', '#cf205e', '#610c34', '#ff5c3c', '#ffe2a0'],
    stripes: ['#ffe078', '#ff2d6f'],
    extrusion: '#38071f',
    outline: '#16050f',
    glow: '#ff6b3d',
    accent: '#ffcf4a',
  },
  goldenVice: {
    id: 'goldenVice',
    label: 'GOLDEN VICE',
    captionHint: 'EVERYTHING HAS A PRICE.',
    chrome: ['#fffbe8', '#ffe6a0', '#d9ae4a', '#8d6018', '#392307', '#e7c25f', '#fff4cd'],
    stripes: ['#fff4c2', '#c8901f'],
    extrusion: '#2a1906',
    outline: '#110b04',
    glow: '#ffd166',
    accent: '#ffd166',
  },
};

export const BACKDROP_PALETTES = {
  sunsetDrive: {
    id: 'sunsetDrive',
    label: 'SUNSET DRIVE',
    sky: [[0, '#170a2e'], [0.3, '#5b1566'], [0.52, '#bd2b73'], [0.66, '#ff6b4a'], [0.75, '#ffc46b'], [1, '#2a1030']],
    sun: ['#fff3b0', '#ffd166', '#ff6b6b', '#f72585'],
    silhouette: '#160922',
    ground: '#120718',
    gradeTop: '#ff2d95',
    gradeBottom: '#ffb03a',
    haze: '#ffb47a',
  },
  neonNights: {
    id: 'neonNights',
    label: 'NEON NIGHTS',
    sky: [[0, '#05051f'], [0.33, '#20145c'], [0.56, '#7a1fa2'], [0.7, '#ee2f8c'], [0.79, '#ff9a6b'], [1, '#0d0630']],
    sun: ['#ffe6fb', '#ff8bd8', '#f72585', '#4cc9f0'],
    silhouette: '#090522',
    ground: '#070418',
    gradeTop: '#7b2ff7',
    gradeBottom: '#ff2d95',
    haze: '#c06bff',
  },
  goldenHour: {
    id: 'goldenHour',
    label: 'GOLDEN HOUR',
    sky: [[0, '#2a1740'], [0.3, '#8a3a5c'], [0.52, '#e2685a'], [0.66, '#ffb35c'], [0.75, '#ffe3a3'], [1, '#3a1d2e']],
    sun: ['#fffce0', '#ffe08a', '#ffab4a', '#ff6b6b'],
    silhouette: '#2a1224',
    ground: '#1d0c1a',
    gradeTop: '#ff7a59',
    gradeBottom: '#ffd48a',
    haze: '#ffd6a0',
  },
};

export const PANEL_LAYOUT_IDS = ['showcase', 'mosaic', 'marquee'];
export const PANEL_LAYOUT_LABELS = {
  showcase: 'SHOWCASE',
  mosaic: 'MOSAIC',
  marquee: 'MARQUEE',
};

export const POSTER_SIZES = {
  square: { id: 'square', label: 'POST 1080 × 1080', width: 1080, height: 1080 },
  portrait: { id: 'portrait', label: 'STORY 1080 × 1350', width: 1080, height: 1350 },
  wide: { id: 'wide', label: 'WIDE 1920 × 1080', width: 1920, height: 1080 },
};

export const DEFAULT_CAST = [
  { name: 'M. SOLIS', role: 'THE DRIVER' },
  { name: 'R. VALE', role: 'THE FIXER' },
  { name: 'K. CRUZ', role: 'THE WILDCARD' },
];

export const DEFAULT_BILLING =
  'A NEON MILE PRODUCTION  ·  PRESENTED BY PALM HEAT PICTURES  ·  DIRECTED BY A. RIVERA  ·  PRODUCED BY S. MARQUEZ  ·  STARRING M. SOLIS, R. VALE, K. CRUZ  ·  MUSIC BY SUNSET FM  ·  COSTUME BY VICE CITY WARDROBE  ·  EDITED BY THE MIDNIGHT CREW';

export const SAMPLE_PHOTOS = [
  { id: 'boulevard', label: 'BOULEVARD', path: './samples/boulevard.jpg' },
  { id: 'pier', label: 'PIER', path: './samples/pier.jpg' },
];

export const DEFAULT_CAPTION = 'ONE NIGHT. NO RULES.';
export const DEFAULT_TITLE = 'NEON MILE';
