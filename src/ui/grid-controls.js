/**
 * Grid panel: motion (vertical, horizontal, circular), strip width or rays, slit aperture, loop, reset.
 */
import { state, GRID_DEFAULTS, frameCount, pxToMm } from '../state.js';
import { rebuild, rebuildSoon } from '../render.js';
import { $, setPressed } from '../lib/dom.js';
import { on, RENDERED } from '../lib/events.js';
import { syncSpeed } from './preview.js';

const MOTION = [
  ['oriV', 'v'],
  ['oriH', 'h'],
  ['oriR', 'r'],
];
const LOOP = [
  ['loopOn', true],
  ['loopOff', false],
];

export const syncSlit = () => {
  $('slitVal').textContent = `${state.w} px ≈ ${pxToMm(state.w).toFixed(2)} mm`;
};

/** The circular slit widens outwards, so its width is quoted at the edge of the circle. */
export function syncAperture() {
  const pct = Math.round(state.aperture * 100);
  const n = Math.max(frameCount(), 1);
  const px = state.radial
    ? (Math.min(state.outW, state.outH) / 2) * ((Math.PI * 2) / (state.rays * n)) * state.aperture
    : state.w * state.aperture;
  $('apertureVal').textContent = `${pct}% ≈ ${pxToMm(px).toFixed(2)} mm${state.radial ? ' at edge' : ''}`;
}

/**
 * @param {'v' | 'h' | 'r'} mode
 * @param {{ render?: boolean }} [opts]
 */
export function setMotion(mode, { render = true } = {}) {
  state.radial = mode === 'r';
  if (!state.radial) state.vertical = mode === 'v';
  setPressed(MOTION, mode);
  $('stage').classList.toggle('horiz', mode === 'h');
  $('stage').classList.toggle('radial', mode === 'r');
  $('slitField').hidden = state.radial;
  $('raysField').hidden = $('radialNote').hidden = !state.radial;
  syncSpeed();
  if (render) rebuild();
}

export const currentMotion = () => (state.radial ? 'r' : state.vertical ? 'v' : 'h');

/** Put the sliders and toggles in line with the state. */
export function syncGridControls() {
  $('slit').value = state.w;
  $('rays').value = state.rays;
  $('raysVal').textContent = state.rays;
  $('aperture').value = Math.round(state.aperture * 100);
  setPressed(LOOP, state.loop);
  syncSlit();
}

function reset() {
  Object.assign(state, {
    w: GRID_DEFAULTS.w,
    rays: GRID_DEFAULTS.rays,
    aperture: GRID_DEFAULTS.aperture,
    loop: GRID_DEFAULTS.loop,
  });
  syncGridControls();
  setMotion('v');
}

export function initGridControls() {
  for (const [id, mode] of MOTION) $(id).addEventListener('click', () => setMotion(mode));
  for (const [id, loop] of LOOP) {
    $(id).addEventListener('click', () => {
      state.loop = loop;
      setPressed(LOOP, loop);
      rebuild();
    });
  }
  $('slit').addEventListener('input', (e) => {
    state.w = +e.target.value;
    syncSlit();
    syncAperture();
    rebuildSoon();
  });
  $('rays').addEventListener('input', (e) => {
    state.rays = +e.target.value;
    $('raysVal').textContent = state.rays;
    rebuildSoon();
  });
  $('aperture').addEventListener('input', (e) => {
    state.aperture = +e.target.value / 100;
    syncAperture();
    rebuildSoon();
  });
  $('gridReset').addEventListener('click', reset);
  on(RENDERED, syncAperture);
}
