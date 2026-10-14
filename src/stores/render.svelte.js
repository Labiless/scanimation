/**
 * The interlaced base image and the preview grid, rebuilt from the state.
 */
import { settings, media, frameOrder, frameCount, wedgeAngle, diagonal } from './state.svelte.js';
import { createFrameProcessor, interlace, drawLinearGrid, drawRadialGrid } from '../core/interlace.js';
import { createCanvas } from '../lib/canvas.js';

/** The interlaced image, at output size. */
export const baseCanvas = createCanvas(1, 1);

/**
 * The grid used by the preview: one period longer than the image for linear grids
 * (so it can slide and wrap), a square as large as the diagonal for the circular one (so it can rotate).
 */
export const previewGrid = createCanvas(1, 1);

/** Bumped after every rebuild, so views that draw the canvases know to refresh. */
export const rendered = $state({ version: 0 });

const gridOptions = () => ({
  strip: settings.w,
  frames: frameCount(),
  aperture: settings.aperture,
  vertical: settings.vertical,
  rays: settings.rays,
});

/**
 * Every value the image depends on. Reading them inside an effect subscribes the effect to them.
 */
export function renderInputs() {
  const s = settings;
  return [
    media.frames,
    s.loop,
    s.w,
    s.vertical,
    s.radial,
    s.rays,
    s.aperture,
    s.outW,
    s.outH,
    s.mode,
    s.thresh,
    s.invert,
    s.fill,
    s.blur,
    s.levels,
    s.gray,
    s.figScale,
  ];
}

export function rebuild() {
  const N = frameCount();
  const W = settings.outW;
  const H = settings.outH;
  baseCanvas.width = W;
  baseCanvas.height = H;
  if (N >= 2) {
    const process = createFrameProcessor(W, H, settings);
    const processed = media.frames.map((f) => process(f.src));
    interlace(
      baseCanvas,
      frameOrder().map((i) => processed[i]),
      { strip: settings.w, vertical: settings.vertical, radial: settings.radial, wedge: wedgeAngle() },
    );
    const g = previewGrid.getContext('2d');
    if (settings.radial) {
      const D = diagonal();
      previewGrid.width = previewGrid.height = D;
      drawRadialGrid(g, D, D, D / 2, D / 2, D / 2, gridOptions());
    } else {
      const P = N * settings.w;
      previewGrid.width = settings.vertical ? W + P : W;
      previewGrid.height = settings.vertical ? H : H + P;
      drawLinearGrid(g, previewGrid.width, previewGrid.height, gridOptions());
    }
  } else {
    previewGrid.width = previewGrid.height = 1;
  }
  rendered.version++;
}

/** The grid at output size, as exported and printed on acetate. */
export function printGrid() {
  const W = settings.outW;
  const H = settings.outH;
  const canvas = createCanvas(W, H);
  const g = canvas.getContext('2d');
  if (settings.radial) drawRadialGrid(g, W, H, W / 2, H / 2, diagonal() / 2, gridOptions());
  else drawLinearGrid(g, W, H, gridOptions());
  return canvas;
}
