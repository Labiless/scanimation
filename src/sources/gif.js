/**
 * Animated GIFs: decode every frame, then pick evenly spaced ones for the animation.
 */
import { GifReader } from 'omggif';
import { createCanvas } from '../lib/canvas.js';

/** Frames decoded at most, to keep memory in check. */
const MAX_FRAMES = 300;

/**
 * @typedef {object} DecodedGif
 * @property {string} name
 * @property {Uint8Array} bytes the original file, kept so the GIF can be stored and decoded again
 * @property {HTMLCanvasElement[]} frames every decoded frame, flattened onto white
 * @property {number} W
 * @property {number} H
 * @property {number} total frames in the file (may exceed `frames.length`)
 */

/**
 * @param {Uint8Array} bytes
 * @param {string} name
 * @returns {DecodedGif}
 */
export function decodeGif(bytes, name) {
  if (String.fromCharCode(...bytes.subarray(0, 4)) !== 'GIF8') {
    throw new Error(
      'This file is not a GIF. If the link points to a video or a web page, use the direct link to the .gif file.',
    );
  }
  const reader = new GifReader(bytes);
  const W = reader.width;
  const H = reader.height;
  const total = Math.min(reader.numFrames(), MAX_FRAMES);
  const pixels = new Uint8ClampedArray(W * H * 4);
  const tmp = createCanvas(W, H);
  const tg = tmp.getContext('2d');
  const frames = [];
  for (let i = 0; i < total; i++) {
    const info = reader.frameInfo(i);
    const before = info.disposal === 3 ? pixels.slice() : null;
    reader.decodeAndBlitFrameRGBA(i, pixels);
    // flatten onto white, since transparent areas print as paper
    tg.putImageData(new ImageData(pixels.slice(), W, H), 0, 0);
    const c = createCanvas(W, H);
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, W, H);
    g.drawImage(tmp, 0, 0);
    frames.push(c);
    // GIF disposal: 2 clears the frame's area, 3 restores what was there before it
    if (info.disposal === 2) {
      for (let y = info.y; y < info.y + info.height; y++) {
        pixels.fill(0, (y * W + info.x) * 4, (y * W + info.x + info.width) * 4);
      }
    } else if (before) pixels.set(before);
  }
  return { name, bytes, frames, W, H, total: reader.numFrames() };
}

/**
 * Evenly spaced frames from a 1-based range. The step skips the range end so the loop closes cleanly.
 * @param {DecodedGif} gif
 * @param {number} start
 * @param {number} end
 * @param {number} count
 * @returns {import('../state.js').Frame[]}
 */
export function sampleGif(gif, start, end, count) {
  const span = end - start + 1;
  const n = Math.max(2, Math.min(count, span));
  return [...Array(n).keys()].map((i) => {
    const k = start - 1 + Math.floor((i * span) / n);
    return { name: `frame ${k + 1} of ${gif.total}`, src: gif.frames[k] };
  });
}

/** A Giphy page link becomes the direct link to its .gif; anything else is returned trimmed. */
export function directGifUrl(raw) {
  const url = raw.trim();
  const m = url.match(/giphy\.com\/(?:gifs|stickers|embed)\/(?:[\w-]*-)?([A-Za-z0-9]+)\/?(?:[?#].*)?$/);
  return m ? `https://i.giphy.com/${m[1]}.gif` : url;
}

/**
 * @param {string} url
 * @returns {Promise<Uint8Array>}
 */
export async function fetchGifBytes(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`the site answered with error ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}
