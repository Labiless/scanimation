/**
 * Print format and size: aspect ratio, dpi, width and height in px or mm, figure size.
 */
import { state, pxToMm, mmToPx } from '../state.js';
import { rebuild, rebuildSoon } from '../render.js';
import { $ } from '../lib/dom.js';
import { applyZoom } from './preview.js';
import { syncSlit } from './grid-controls.js';

const MIN_PX = 100;
const MAX_PX = 5000;
const clampPx = (v) => Math.max(MIN_PX, Math.min(MAX_PX, Math.round(+v || 0)));

/**
 * Set the output size in px, update both px and mm fields, and rebuild.
 * @param {number} wpx
 * @param {number} hpx
 */
export function setDims(wpx, hpx) {
  state.outW = clampPx(wpx);
  state.outH = clampPx(hpx);
  $('wPx').value = state.outW;
  $('wMm').value = pxToMm(state.outW).toFixed(2);
  $('hPx').value = state.outH;
  $('hMm').value = pxToMm(state.outH).toFixed(2);
  syncSlit();
  applyZoom();
  rebuild();
}

// with a fixed ratio, the side just edited drives the other one
const fromWidth = (wpx) => setDims(wpx, state.ratio ? wpx / state.ratio : state.outH);
const fromHeight = (hpx) => setDims(state.ratio ? hpx * state.ratio : state.outW, hpx);

export function syncFormatControls() {
  $('ratio').value = state.ratio ? String(state.ratio) : 'free';
  $('dpi').value = String(state.dpi);
  const pct = Math.round(state.figScale * 100);
  $('figScale').value = pct;
  $('figScaleVal').textContent = `${pct}%`;
}

export function initFormatControls() {
  $('wPx').addEventListener('change', (e) => {
    state.lockMm = false;
    fromWidth(e.target.value);
  });
  $('hPx').addEventListener('change', (e) => {
    state.lockMm = false;
    fromHeight(e.target.value);
  });
  $('wMm').addEventListener('change', (e) => {
    state.lockMm = true;
    fromWidth(mmToPx(e.target.value));
  });
  $('hMm').addEventListener('change', (e) => {
    state.lockMm = true;
    fromHeight(mmToPx(e.target.value));
  });
  $('ratio').addEventListener('change', (e) => {
    state.ratio = e.target.value === 'free' ? 0 : +e.target.value;
    if (state.ratio) fromWidth(state.outW);
  });
  // a dpi change keeps whichever the user set last: the millimetres or the pixels
  $('dpi').addEventListener('change', (e) => {
    const wMm = +$('wMm').value;
    const hMm = +$('hMm').value;
    state.dpi = +e.target.value;
    if (state.lockMm) setDims(mmToPx(wMm), mmToPx(hMm));
    else setDims(state.outW, state.outH);
  });
  $('figScale').addEventListener('input', (e) => {
    state.figScale = +e.target.value / 100;
    $('figScaleVal').textContent = `${e.target.value}%`;
    rebuildSoon();
  });
}
