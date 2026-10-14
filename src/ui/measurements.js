/**
 * The measurements line under the preview: strip, slit, bar and period in px and mm, brightness, format.
 */
import { state, frameCount, pxToMm } from '../state.js';
import { $ } from '../lib/dom.js';
import { on, RENDERED } from '../lib/events.js';

/** Share of the image that shows through the grid, and whether neighbouring frames mix. */
function brightness(N) {
  const pct = Math.min(100, (state.aperture / Math.max(N, 1)) * 100);
  return `${pct.toFixed(0)}% of the image visible${state.aperture > 1 ? ' · frames overlap' : ''}`;
}

const row = (term, value) => `<dt>${term}</dt><dd>${value}</dd>`;

function update() {
  const N = frameCount();
  const loaded = state.frames.length;
  const mm = (px) => pxToMm(px).toFixed(2);
  const frames = N === loaded ? `${N}` : `${N} in the loop (${loaded} loaded, back and forth)`;
  const format = `${(pxToMm(state.outW) / 10).toFixed(1)} × ${(pxToMm(state.outH) / 10).toFixed(1)} cm`;

  let rows;
  if (state.radial) {
    const alpha = (Math.PI * 2) / (state.rays * Math.max(N, 1));
    const deg = (alpha * 180) / Math.PI;
    const rEdge = Math.min(state.outW, state.outH) / 2;
    rows = [
      row('Frames', frames),
      row('Rays', state.rays),
      row('Wedge', `${deg.toFixed(3)}°`),
      row('Slit', `${(deg * state.aperture).toFixed(3)}°`),
      row('Period', `${(deg * N).toFixed(3)}°`),
      row('At the edge', `${mm(rEdge * alpha * state.aperture)} mm slit`),
      row('At half radius', `${mm((rEdge / 2) * alpha * state.aperture)} mm slit`),
    ];
  } else {
    const P = N * state.w;
    const slit = state.w * state.aperture;
    const bar = Math.max(0, P - slit);
    rows = [
      row('Frames', frames),
      row('Strip', `${state.w} px = ${mm(state.w)} mm`),
      row('Slit', `${+slit.toFixed(2)} px = ${mm(slit)} mm`),
      row('Black bar', `${+bar.toFixed(2)} px = ${mm(bar)} mm`),
      row('Period', `${P} px = ${mm(P)} mm`),
    ];
  }
  rows.push(row('Brightness', brightness(N)), row('Format', format));
  $('spec').innerHTML = rows.join('');
}

export function initMeasurements() {
  on(RENDERED, update);
}
