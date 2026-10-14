/**
 * The settings line printed above each piece, so a printed sheet can be matched to its
 * configuration later: size, strip and slit in mm, and the frame count.
 */
import { settings, pxToMm, wedgeAngle, frameCount } from '../stores/state.svelte.js';
import { createCanvas } from '../lib/canvas.js';

export const INFO_SEPARATOR = '   ·   ';

/** @returns {string[]} */
export function infoSegments() {
  const mm = (px) => pxToMm(px).toFixed(2);
  const segments = [`Size ${pxToMm(settings.outW).toFixed(1)} × ${pxToMm(settings.outH).toFixed(1)} mm`];
  if (settings.radial) {
    // wedges widen outwards, so quote them at the edge of the circle
    const strip = (Math.min(settings.outW, settings.outH) / 2) * wedgeAngle();
    segments.push(`Strip ${mm(strip)} mm at edge`, `Aperture ${mm(strip * settings.aperture)} mm at edge`);
  } else {
    segments.push(`Strip ${mm(settings.w)} mm`, `Aperture ${mm(settings.w * settings.aperture)} mm`);
  }
  segments.push(`${frameCount()}F`);
  return segments;
}

/**
 * Return a copy of `canvas` with the settings line added above it, about 1.8 mm tall once printed.
 * The image keeps its size; the band only adds height. Base and grid share the same text,
 * so their bands match.
 * @param {HTMLCanvasElement} canvas
 * @param {boolean} transparent keep the band see-through (grids printed on acetate)
 */
export function withInfoBand(canvas, transparent) {
  const W = canvas.width;
  const fs = Math.max(10, Math.round((1.8 / 25.4) * settings.dpi));
  const pad = Math.round(fs * 0.7);
  const lh = Math.round(fs * 1.35);
  const font = `500 ${fs}px Roboto, Arial, sans-serif`;
  const measure = createCanvas(1, 1).getContext('2d');
  measure.font = font;

  // wrap the segments greedily into lines that fit the width
  const [first, ...rest] = infoSegments();
  const lines = [];
  let line = first;
  for (const s of rest) {
    if (measure.measureText(line + INFO_SEPARATOR + s).width <= W - pad * 2) line += INFO_SEPARATOR + s;
    else {
      lines.push(line);
      line = s;
    }
  }
  lines.push(line);
  const band = pad * 2 + lh * lines.length;

  const out = createCanvas(W, canvas.height + band);
  const g = out.getContext('2d');
  if (!transparent) {
    g.fillStyle = '#fff';
    g.fillRect(0, 0, W, out.height);
  }
  g.fillStyle = '#000';
  g.textBaseline = 'top';
  g.font = font;
  lines.forEach((l, i) => g.fillText(l, pad, pad + i * lh, W - pad * 2));
  g.drawImage(canvas, 0, band);
  return out;
}
