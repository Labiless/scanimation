/**
 * The scanimation itself: colour treatment of each frame, interlacing into one image,
 * and drawing the barrier grids. Pure canvas work, no DOM or app state.
 */
import { createCanvas, drawContain } from '../lib/canvas.js';

/**
 * @typedef {object} ColourOptions
 * @property {'sil' | 'post' | 'orig'} mode
 * @property {number} thresh silhouette threshold, 0–255
 * @property {boolean} invert
 * @property {string} fill silhouette colour, #rrggbb
 * @property {number} blur edge blur in px
 * @property {number} levels posterize levels per channel
 * @property {boolean} gray posterize in greyscale
 * @property {number} figScale figure size inside the format, 0–1
 */

const luminance = (d, p) => 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];

/**
 * When the image is smaller than the format, paint the margins in the image's own background colour,
 * so the image doesn't show as a rectangle inside the animation. The background is read from the
 * pixels just inside the image's edges: the darker or the lighter ones, whichever are more,
 * averaged together. Runs after the colour treatment, so it already accounts for threshold and invert.
 * @param {Uint8ClampedArray} d RGBA pixels, W×H
 * @param {number} W
 * @param {number} H
 * @param {{ x: number, y: number, w: number, h: number }} rect where the image was drawn
 */
function fillMargins(d, W, H, rect) {
  // skip a pixel inside the edge: it may be blended with the margin by smoothing
  const x0 = Math.ceil(rect.x) + 1;
  const y0 = Math.ceil(rect.y) + 1;
  const x1 = Math.floor(rect.x + rect.w) - 2;
  const y1 = Math.floor(rect.y + rect.h) - 2;
  if (x0 <= 1 && y0 <= 1 && x1 >= W - 3 && y1 >= H - 3) return; // the image fills the format
  if (x1 <= x0 || y1 <= y0) return;

  const sums = { dark: [0, 0, 0, 0], light: [0, 0, 0, 0] };
  const sample = (x, y) => {
    const p = (y * W + x) * 4;
    const s = luminance(d, p) < 128 ? sums.dark : sums.light;
    s[0] += d[p];
    s[1] += d[p + 1];
    s[2] += d[p + 2];
    s[3]++;
  };
  for (let x = x0; x <= x1; x++) {
    sample(x, y0);
    sample(x, y1);
  }
  for (let y = y0 + 1; y < y1; y++) {
    sample(x0, y);
    sample(x1, y);
  }
  const s = sums.dark[3] > sums.light[3] ? sums.dark : sums.light;
  const [r, g, b] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]];

  const ix0 = Math.max(0, Math.ceil(rect.x));
  const iy0 = Math.max(0, Math.ceil(rect.y));
  const ix1 = Math.min(W, Math.floor(rect.x + rect.w));
  const iy1 = Math.min(H, Math.floor(rect.y + rect.h));
  for (let y = 0; y < H; y++) {
    const inside = y >= iy0 && y < iy1;
    for (let x = 0; x < W; x++) {
      if (inside && x >= ix0 && x < ix1) continue;
      const p = (y * W + x) * 4;
      d[p] = r;
      d[p + 1] = g;
      d[p + 2] = b;
    }
  }
}

/**
 * Build a function that fits a frame into W×H and applies the colour treatment.
 * Scratch canvases are shared between calls.
 * @param {number} W
 * @param {number} H
 * @param {ColourOptions} o
 * @returns {(src: HTMLCanvasElement) => Uint8ClampedArray} RGBA pixels
 */
export function createFrameProcessor(W, H, o) {
  const tmp = createCanvas(W, H);
  const tg = tmp.getContext('2d', { willReadFrequently: true });
  const soft = createCanvas(W, H);
  const sg = soft.getContext('2d', { willReadFrequently: true });
  const [fr, fgc, fb] = [1, 3, 5].map((i) => parseInt(o.fill.slice(i, i + 2), 16));
  const step = 255 / (o.levels - 1);
  const q = (v) => Math.round(v / step) * step;

  return (src) => {
    tg.fillStyle = '#fff';
    tg.fillRect(0, 0, W, H);
    const rect = drawContain(tg, src, W, H, o.figScale);
    const img = tg.getImageData(0, 0, W, H);
    const d = img.data;
    for (let p = 0; p < d.length; p += 4) {
      if (o.mode === 'sil') {
        // ink where the pixel is darker than the threshold (or lighter, when inverted)
        const ink = luminance(d, p) < o.thresh !== o.invert;
        if (ink) {
          d[p] = fr;
          d[p + 1] = fgc;
          d[p + 2] = fb;
        } else d[p] = d[p + 1] = d[p + 2] = 255;
        continue;
      }
      if (o.mode === 'post') {
        if (o.gray) d[p] = d[p + 1] = d[p + 2] = q(luminance(d, p));
        else {
          d[p] = q(d[p]);
          d[p + 1] = q(d[p + 1]);
          d[p + 2] = q(d[p + 2]);
        }
      }
      if (o.invert) {
        d[p] = 255 - d[p];
        d[p + 1] = 255 - d[p + 1];
        d[p + 2] = 255 - d[p + 2];
      }
    }
    fillMargins(d, W, H, rect);
    if (!o.blur) return d;
    tg.putImageData(img, 0, 0);
    sg.filter = 'none';
    sg.fillStyle = '#fff';
    sg.fillRect(0, 0, W, H);
    sg.filter = `blur(${o.blur}px)`;
    sg.drawImage(tmp, 0, 0);
    sg.filter = 'none';
    return sg.getImageData(0, 0, W, H).data;
  };
}

/**
 * Weave frames into one image.
 * Linear: the pixel at column x (or row y) comes from frame floor(x / strip) mod N.
 * Radial: the pixel at angle θ around the centre comes from frame floor(θ / wedge) mod N.
 * @param {HTMLCanvasElement} target sized to the output
 * @param {Uint8ClampedArray[]} frames pixels in strip order, each the size of `target`
 * @param {{ strip: number, vertical: boolean, radial: boolean, wedge: number }} o
 */
export function interlace(target, frames, o) {
  const W = target.width;
  const H = target.height;
  const N = frames.length;
  const g = target.getContext('2d');
  const out = g.createImageData(W, H);
  const px = out.data;
  const cx = W / 2;
  const cy = H / 2;
  const TAU = Math.PI * 2;
  for (let y = 0; y < H; y++) {
    const rowIdx = Math.floor(y / o.strip) % N;
    for (let x = 0; x < W; x++) {
      let fi;
      if (o.radial) {
        let t = Math.atan2(y + 0.5 - cy, x + 0.5 - cx);
        if (t < 0) t += TAU;
        fi = Math.floor(t / o.wedge) % N;
      } else fi = o.vertical ? Math.floor(x / o.strip) % N : rowIdx;
      const p = (y * W + x) * 4;
      const src = frames[fi];
      px[p] = src[p];
      px[p + 1] = src[p + 1];
      px[p + 2] = src[p + 2];
      px[p + 3] = 255;
    }
  }
  g.putImageData(out, 0, 0);
}

/**
 * Black grid with transparent slits, one per period of N strips.
 * The slit is centred on its strip, so changing the aperture never shifts the frame it shows.
 * @param {CanvasRenderingContext2D} g
 * @param {number} GW
 * @param {number} GH
 * @param {{ strip: number, frames: number, aperture: number, vertical: boolean }} o
 */
export function drawLinearGrid(g, GW, GH, o) {
  const P = o.frames * o.strip;
  const sw = o.strip * o.aperture;
  const pad = (o.strip - sw) / 2;
  const len = o.vertical ? GW : GH;
  g.clearRect(0, 0, GW, GH);
  g.fillStyle = '#000';
  g.fillRect(0, 0, GW, GH);
  for (let k = -P; k < len + P; k += P) {
    if (o.vertical) g.clearRect(k + pad, 0, sw, GH);
    else g.clearRect(0, k + pad, GW, sw);
  }
}

/**
 * Black disc of rays with transparent wedges around (cx, cy).
 * @param {CanvasRenderingContext2D} g
 * @param {number} GW
 * @param {number} GH
 * @param {number} cx
 * @param {number} cy
 * @param {number} R radius covering the area to fill
 * @param {{ rays: number, frames: number, aperture: number }} o
 */
export function drawRadialGrid(g, GW, GH, cx, cy, R, o) {
  const alpha = (Math.PI * 2) / (o.rays * o.frames);
  const sa = alpha * o.aperture;
  const pad = (alpha - sa) / 2;
  g.clearRect(0, 0, GW, GH);
  g.fillStyle = '#000';
  g.fillRect(0, 0, GW, GH);
  g.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < o.rays; k++) {
    const a = k * o.frames * alpha + pad;
    g.beginPath();
    g.moveTo(cx, cy);
    g.arc(cx, cy, R, a, a + sa);
    g.closePath();
    g.fill();
  }
  g.globalCompositeOperation = 'source-over';
}
