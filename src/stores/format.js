/**
 * Output size rules: clamped pixels, fixed aspect ratio, dpi changes that keep the last unit edited.
 */
import { settings, pxToMm, mmToPx } from './state.svelte.js';

const MIN_PX = 100;
const MAX_PX = 5000;
const clampPx = (v) => Math.max(MIN_PX, Math.min(MAX_PX, Math.round(+v || 0)));

export function setDims(wpx, hpx) {
  settings.outW = clampPx(wpx);
  settings.outH = clampPx(hpx);
}

// with a fixed ratio, the side just edited drives the other one
export const fromWidth = (wpx) => setDims(wpx, settings.ratio ? wpx / settings.ratio : settings.outH);
export const fromHeight = (hpx) => setDims(settings.ratio ? hpx * settings.ratio : settings.outW, hpx);

/** @param {number | 0} ratio width / height, 0 for free */
export function setRatio(ratio) {
  settings.ratio = ratio;
  if (ratio) fromWidth(settings.outW);
}

/** A dpi change keeps whichever the user set last: the millimetres or the pixels. */
export function setDpi(dpi) {
  const wMm = pxToMm(settings.outW);
  const hMm = pxToMm(settings.outH);
  settings.dpi = dpi;
  if (settings.lockMm) setDims(mmToPx(wMm), mmToPx(hMm));
}
