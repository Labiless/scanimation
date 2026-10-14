/**
 * Text animations: lay the text out once, then render it per frame
 * (3D turns around X or Y, a spin around Z, or letters appearing one group at a time).
 */
import { createCanvas } from '../lib/canvas.js';

/** Typefaces offered in the Text tab. */
export const FONTS = [
  { label: 'Anton', css: '"Anton", Impact, sans-serif', weight: 400 },
  { label: 'Archivo Black', css: '"Archivo Black", "Arial Black", sans-serif', weight: 400 },
  { label: 'Bebas Neue', css: '"Bebas Neue", Impact, sans-serif', weight: 400 },
  { label: 'Rubik Mono One', css: '"Rubik Mono One", "Arial Black", sans-serif', weight: 400 },
  { label: 'Bricolage Grotesque', css: '"Bricolage Grotesque", "Arial Black", sans-serif', weight: 800 },
  { label: 'Arial Black', css: '"Arial Black", Arial, sans-serif', weight: 900 },
];

/** Text frames are drawn on a square this size, then fitted to the output format. */
const SIZE = 1000;

/**
 * @param {typeof import('../stores/state.svelte.js').settings.text} T
 * @returns {Promise<import('../stores/state.svelte.js').Frame[]>}
 */
export async function renderTextFrames(T) {
  const F = FONTS[T.font];
  const font = (px) => `${F.weight} ${px}px ${F.css}`;
  try {
    await document.fonts.load(font(100), T.str || 'A');
  } catch {
    /* fall back to the font stack */
  }

  // layout: every character with its position, sized so the block fills about 84% of the square
  const lines = (T.str.trim() ? T.str : ' ').split('\n');
  const m = createCanvas(1, 1).getContext('2d');
  m.font = font(100);
  const widest = Math.max(1, ...lines.map((l) => m.measureText(l).width));
  const size = Math.min((100 * SIZE * 0.84) / widest, (SIZE * 0.84) / (lines.length * 1.1));
  m.font = font(size);
  const chars = [];
  lines.forEach((line, j) => {
    const y = SIZE / 2 + (j - (lines.length - 1) / 2) * size * 1.1;
    const x0 = SIZE / 2 - m.measureText(line).width / 2;
    [...line].forEach((ch, k) => chars.push({ ch, x: x0 + m.measureText(line.slice(0, k)).width, y }));
  });

  const drawChars = (g, list) => {
    g.font = font(size);
    g.textBaseline = 'middle';
    g.fillStyle = '#000';
    list.forEach((c) => g.fillText(c.ch, c.x, c.y));
  };
  const blank = () => {
    const c = createCanvas(SIZE, SIZE);
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, SIZE, SIZE);
    return [c, g];
  };

  if (T.anim === 'ltr' || T.anim === 'rtl') return revealFrames(T, chars, drawChars, blank);
  return turnFrames(T, chars, drawChars, blank);
}

/** Letters appear one group per frame; spaces don't count as a step. */
function revealFrames(T, chars, drawChars, blank) {
  const letters = chars.filter((c) => c.ch.trim());
  if (T.anim === 'rtl') letters.reverse();
  const frames = [];
  for (let i = 0; i < T.n; i++) {
    const k = Math.max(1, Math.round(((i + 1) * letters.length) / T.n));
    const [c, g] = blank();
    drawChars(g, letters.slice(0, k));
    frames.push({ name: `text ${i + 1}: ${k} letters`, src: c });
  }
  return frames;
}

/** A full turn (360°) or a swing between −range/2 and +range/2. */
function turnFrames(T, chars, drawChars, blank) {
  const [src, sg] = blank();
  drawChars(sg, chars);
  const n = T.n;
  const range = T.angle >= 360 ? null : T.angle;
  const angleOf = (i) =>
    range === null ? (i * Math.PI * 2) / n : ((-range / 2 + (i * range) / (n - 1)) * Math.PI) / 180;
  const focal = T.persp > 0 ? (SIZE * 0.9) / (T.persp / 100) : Infinity;
  const mid = SIZE / 2;

  const frames = [];
  for (let i = 0; i < n; i++) {
    const th = angleOf(i);
    const cos = Math.cos(th);
    const sin = Math.sin(th);
    const [c, g] = blank();
    if (T.anim === 'rz') {
      g.translate(mid, mid);
      g.rotate(th);
      g.drawImage(src, -mid, -mid);
    } else {
      // 3D turn drawn in 1 px slices: each column (Y) or row (X) gets its own perspective scale
      const project = (d) => {
        const s = Number.isFinite(focal) ? focal / (focal + d * sin) : 1;
        return [mid + d * cos * s, s];
      };
      for (let u = 0; u < SIZE; u++) {
        const [a, s] = project(u - mid);
        const [b] = project(u + 1 - mid);
        const lo = Math.min(a, b);
        const len = Math.abs(b - a) + 0.6;
        if (T.anim === 'ry') g.drawImage(src, u, 0, 1, SIZE, lo, mid - mid * s, len, SIZE * s);
        else g.drawImage(src, 0, u, SIZE, 1, mid - mid * s, lo, SIZE * s, len);
      }
    }
    frames.push({ name: `text ${i + 1}: ${Math.round((th * 180) / Math.PI)}°`, src: c });
  }
  return frames;
}
