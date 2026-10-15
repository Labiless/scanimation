/**
 * Output size rules. The size is chosen in millimetres; the pixels follow from the dpi and are
 * clamped to a range the browser can process comfortably.
 */
import { settings, pxToMm, mmToPx } from './state.svelte.js';

export const MIN_PX = 100;
export const MAX_PX = 5000;
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

/** A dpi change keeps the size in millimetres; the pixels are recalculated. */
export function setDpi(dpi) {
  const wMm = pxToMm(settings.outW);
  const hMm = pxToMm(settings.outH);
  settings.dpi = dpi;
  setDims(mmToPx(wMm), mmToPx(hMm));
}
