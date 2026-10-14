/**
 * Animations saved before the frame count was part of the settings line: measure it from the saved grid.
 * Linear: period / strip width. Circular: 2π / (rays × wedge angle), with the wedge from the edge strip.
 * Reads both the current English line and the earlier Italian one.
 */
import { createCanvas } from '../lib/canvas.js';

const STRIP = /(?:Striscia|Strip) ([\d.]+) mm/;
const AT_EDGE = /al bordo|at edge/;

/**
 * @param {import('../stores/library.svelte.js').SavedAnimation} record
 * @returns {Promise<number>} the frame count, or 0 when it can't be measured
 */
export async function framesFromGrid(record) {
  const img = await createImageBitmap(record.grid);
  const W = img.width;
  const H = img.height;
  const g = createCanvas(W, H).getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, W, H).data;
  const open = (x, y) => d[(y * W + x) * 4 + 3] < 128;
  const info = record.info.join(' ');
  const stripMm = +(info.match(STRIP)?.[1] ?? 0);

  if (AT_EDGE.test(info)) {
    const cx = W / 2;
    const cy = H / 2;
    const r = (Math.min(W, H) / 2) * 0.9;
    let rays = 0;
    let prev = null;
    for (let i = 0; i <= 7200; i++) {
      const a = (i / 7200) * Math.PI * 2;
      const o = open(Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a)));
      if (prev === false && o) rays++;
      prev = o;
    }
    const alpha = stripMm / (Math.min(record.wMm, record.hMm) / 2);
    return rays && alpha ? Math.round((Math.PI * 2) / (rays * alpha)) : 0;
  }

  const strip = stripMm * (W / record.wMm);
  const slitStarts = (len, at) => {
    const s = [];
    for (let i = 1; i < len; i++) if (!at(i - 1) && at(i)) s.push(i);
    return s;
  };
  let starts = slitStarts(W, (x) => open(x, H >> 1));
  if (starts.length < 2) starts = slitStarts(H, (y) => open(W >> 1, y));
  if (starts.length < 2 || !strip) return 0;
  const period = (starts[starts.length - 1] - starts[0]) / (starts.length - 1);
  return Math.round(period / strip);
}
