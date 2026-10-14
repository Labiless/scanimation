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
    drawContain(tg, src, W, H, o.figScale);
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
