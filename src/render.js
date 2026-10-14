/**
 * Keeps the interlaced base image and the preview grid in step with the state.
 */
import { state, frameOrder, frameCount, wedgeAngle, diagonal } from './state.js';
import { createFrameProcessor, interlace, drawLinearGrid, drawRadialGrid } from './core/interlace.js';
import { createCanvas } from './lib/canvas.js';
import { debounce } from './lib/dom.js';
import { emit, RENDERED } from './lib/events.js';

/** The interlaced image, at output size. */
export const baseCanvas = createCanvas(1, 1);

/**
 * The grid used by the preview: one period longer than the image for linear grids
 * (so it can slide and wrap), a square as large as the diagonal for the circular one (so it can rotate).
 */
export const previewGrid = createCanvas(1, 1);

const gridOptions = () => ({
  strip: state.w,
  frames: frameCount(),
  aperture: state.aperture,
  vertical: state.vertical,
  rays: state.rays,
});

export function rebuild() {
  const N = frameCount();
  const W = state.outW;
  const H = state.outH;
  baseCanvas.width = W;
  baseCanvas.height = H;
  if (N < 2) {
    previewGrid.width = previewGrid.height = 1;
    emit(RENDERED);
    return;
  }

  const process = createFrameProcessor(W, H, state);
  const processed = state.frames.map((f) => process(f.src));
  interlace(
    baseCanvas,
    frameOrder().map((i) => processed[i]),
    { strip: state.w, vertical: state.vertical, radial: state.radial, wedge: wedgeAngle() },
  );

  const g = previewGrid.getContext('2d');
  if (state.radial) {
    const D = diagonal();
    previewGrid.width = previewGrid.height = D;
    drawRadialGrid(g, D, D, D / 2, D / 2, D / 2, gridOptions());
  } else {
    const P = N * state.w;
    previewGrid.width = state.vertical ? W + P : W;
    previewGrid.height = state.vertical ? H : H + P;
    drawLinearGrid(g, previewGrid.width, previewGrid.height, gridOptions());
  }
  emit(RENDERED);
}

/** Rebuild once a slider has stopped moving. */
export const rebuildSoon = debounce(rebuild, 120);

/** The grid at output size, as exported and printed on acetate. */
export function printGrid() {
  const W = state.outW;
  const H = state.outH;
  const canvas = createCanvas(W, H);
  const g = canvas.getContext('2d');
  if (state.radial) drawRadialGrid(g, W, H, W / 2, H / 2, diagonal() / 2, gridOptions());
  else drawLinearGrid(g, W, H, gridOptions());
  return canvas;
}
