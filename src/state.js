/**
 * Application state: the current animation and every setting, plus values derived from them.
 * Modules read and write `state` directly and announce changes through the event bus.
 */

/**
 * @typedef {object} Frame
 * @property {string} name
 * @property {HTMLCanvasElement} src
 * @property {Blob} [blob] PNG of `src`, cached once encoded for storage
 */

/**
 * @typedef {object} TextSettings
 * @property {string} str
 * @property {number} font index into FONTS (sources/text.js)
 * @property {'ry' | 'rx' | 'rz' | 'ltr' | 'rtl'} anim
 * @property {number} angle rotation range in degrees; 360 is a full turn
 * @property {number} persp perspective strength, 0–100
 * @property {number} n frames to generate
 */

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Grid settings restored by the reset button. */
export const GRID_DEFAULTS = Object.freeze({
  vertical: true,
  radial: false,
  w: 2, // strip width in px
  rays: 48,
  aperture: 0.75, // slit width as a share of the strip
  loop: true,
});

export const state = {
  /** @type {Frame[]} */
  frames: [],
  /** @type {'img' | 'gif' | 'txt'} */
  source: 'img',

  ...GRID_DEFAULTS,

  // print format
  outW: 800,
  outH: 800,
  dpi: 300,
  lockMm: false, // the last size edit was in mm, so a dpi change keeps the mm
  ratio: 1, // width / height, 0 when free
  figScale: 1,

  // colour treatment
  /** @type {'sil' | 'post' | 'orig'} */
  mode: 'sil',
  thresh: 140,
  invert: false,
  fill: '#000000',
  blur: 0,
  levels: 3,
  gray: true,

  // GIF source
  /** @type {import('./sources/gif.js').DecodedGif | null} */
  gif: null,
  gifN: 6,
  gifStart: 1,
  gifEnd: 1,

  /** @type {TextSettings} */
  text: { str: 'HELLO', font: 1, anim: 'ry', angle: 360, persp: 40, n: 6 },

  // preview
  speed: 30, // px/s for linear grids
  rspeed: 6, // °/s for the circular grid
  playing: !reducedMotion,
  offset: 0,
  angle: 0,
  showGrid: true,

  // saved animation being edited
  /** @type {string | null} */
  editingId: null,
  editingName: '',
};

/** Settings kept across reloads and inside saved animations. */
export const PERSISTED_KEYS = [
  'w',
  'vertical',
  'radial',
  'rays',
  'aperture',
  'loop',
  'outW',
  'outH',
  'dpi',
  'lockMm',
  'ratio',
  'figScale',
  'mode',
  'thresh',
  'invert',
  'fill',
  'blur',
  'levels',
  'gray',
  'gifN',
  'gifStart',
  'gifEnd',
  'text',
  'speed',
  'rspeed',
  'showGrid',
  'source',
  'editingId',
  'editingName',
];

/** Deep copy of the persisted settings, without the editing marker. */
export const settingsSnapshot = () =>
  structuredClone(
    Object.fromEntries(PERSISTED_KEYS.filter((k) => !k.startsWith('editing')).map((k) => [k, state[k]])),
  );

/** Frame order in the strips: 1..N for a loop, 1..N..2 for back-and-forth. */
export function frameOrder() {
  const n = state.frames.length;
  const idx = [...Array(n).keys()];
  return state.loop || n < 3 ? idx : idx.concat(idx.slice(1, -1).reverse());
}

/** Frames in one grid period (back-and-forth repeats the middle ones). */
export const frameCount = () => frameOrder().length;

export const pxToMm = (px) => (px / state.dpi) * 25.4;
export const mmToPx = (mm) => ((+mm || 0) / 25.4) * state.dpi;

/** Circular grid: K rays, each period split in N wedges of angle 2π / (K·N). */
export const wedgeAngle = () => (Math.PI * 2) / (state.rays * frameCount());

/** Side of a square that covers the image at any rotation. */
export const diagonal = () => Math.ceil(Math.hypot(state.outW, state.outH)) + 4;
