/**
 * Application state as Svelte 5 runes.
 * - `settings`: every editor setting, deeply reactive and persisted
 * - `ui`: page options outside the editor (zoom, print sheet options…), persisted
 * - `media`: the frames and the loaded GIF; held raw (not proxied), so replace them instead of mutating
 * - `motion`: grid position in the preview, changed every animation frame, deliberately not reactive
 */

/**
 * @typedef {object} Frame
 * @property {string} name
 * @property {HTMLCanvasElement} src
 * @property {Blob} [blob] PNG of `src`, cached once encoded for storage
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

export const settings = $state({
  /** @type {'img' | 'gif' | 'txt'} */
  source: 'img',

  ...GRID_DEFAULTS,

  // print format
  outW: 800,
  outH: 800,
  dpi: 300,
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

  // GIF sampling
  gifN: 6,
  gifStart: 1,
  gifEnd: 1,

  // text animation
  text: {
    str: 'HELLO',
    font: 1, // index into FONTS (sources/text.js)
    /** @type {'ry' | 'rx' | 'rz' | 'ltr' | 'rtl'} */
    anim: 'ry',
    angle: 360, // rotation range in degrees; 360 is a full turn
    persp: 40,
    n: 6,
  },

  // preview
  speed: 30, // px/s for linear grids
  rspeed: 6, // °/s for the circular grid
  showGrid: true,
  playing: !reducedMotion,

  // saved animation being edited
  /** @type {string | null} */
  editingId: null,
  editingName: '',
});

export const ui = $state({
  printOpen: true,
  zoom: 'fit',
  infoBand: true,
  gifUrl: '',
  sheet: { landscape: false, margin: 10, gap: 5, info: true, outline: true },
});

/** @type {Frame[]} */
let frames = $state.raw([]);
/** @type {import('../sources/gif.js').DecodedGif | null} */
let gif = $state.raw(null);

export const media = {
  get frames() {
    return frames;
  },
  set frames(value) {
    frames = value;
  },
  get gif() {
    return gif;
  },
  set gif(value) {
    gif = value;
  },
};

export const motion = { offset: 0, angle: 0 };

/** Settings stored inside a saved animation: everything except the editing marker and playback. */
export function settingsSnapshot() {
  const { editingId: _id, editingName: _name, playing: _playing, ...rest } = $state.snapshot(settings);
  return rest;
}

/** Frame order in the strips: 1..N for a loop, 1..N..2 for back-and-forth. */
export function frameOrder() {
  const n = frames.length;
  const idx = [...Array(n).keys()];
  return settings.loop || n < 3 ? idx : idx.concat(idx.slice(1, -1).reverse());
}

/** Frames in one grid period (back-and-forth repeats the middle ones). */
export const frameCount = () => frameOrder().length;

export const pxToMm = (px) => (px / settings.dpi) * 25.4;
export const mmToPx = (mm) => ((+mm || 0) / 25.4) * settings.dpi;

/** Circular grid: K rays, each period split in N wedges of angle 2π / (K·N). */
export const wedgeAngle = () => (Math.PI * 2) / (settings.rays * frameCount());

/** Side of a square that covers the image at any rotation. */
export const diagonal = () => Math.ceil(Math.hypot(settings.outW, settings.outH)) + 4;
