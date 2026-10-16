/**
 * Where frames come from: image files, an animated GIF or text. Every action replaces `media.frames`.
 */
import { settings, media, motion } from './state.svelte.js';
import { readImageFiles } from '../sources/images.js';
import { decodeGif, sampleGif, directGifUrl, fetchGifBytes } from '../sources/gif.js';
import { renderTextFrames } from '../sources/text.js';
// the example animation shown on the first visit, bundled so it works offline and inside the viewer
import exampleGifUrl from '../assets/default.gif?url';

export const gifStatus = $state({
  text: 'Direct links to .gif files or Giphy pages. If the site blocks the link, download the GIF and load it as a file.',
  error: false,
});

const setGifStatus = (text, error = false) => Object.assign(gifStatus, { text, error });

/** Describe the loaded GIF in the status line. */
export function describeGif() {
  const gif = media.gif;
  if (!gif) return;
  const cut = gif.total > gif.frames.length ? ` (first ${gif.frames.length} used)` : '';
  setGifStatus(`${gif.name}: ${gif.total} frame${cut}, ${gif.W}×${gif.H} px.`);
}

let textJob = 0;

/** Render the text frames; a newer edit discards an older one still in progress. */
export async function regenerateText() {
  const mine = ++textJob;
  const frames = await renderTextFrames($state.snapshot(settings.text));
  if (mine === textJob) media.frames = frames;
}

/** @param {'img' | 'gif' | 'txt'} source */
export function setSource(source) {
  settings.source = source;
  if (source === 'txt') regenerateText();
}

/** Take the chosen frames from the GIF and make them the animation. */
export function applyGifSample() {
  if (media.gif) media.frames = sampleGif(media.gif, settings.gifStart, settings.gifEnd, settings.gifN);
}

/** Keep the GIF range valid: at least two frames, inside the file. */
export function clampGifRange() {
  const max = media.gif ? media.gif.frames.length : 1;
  settings.gifStart = Math.max(1, Math.min(max - 1, Math.round(settings.gifStart || 1)));
  settings.gifEnd = Math.max(settings.gifStart + 1, Math.min(max, Math.round(settings.gifEnd || max)));
}

/** @param {import('../sources/gif.js').DecodedGif} gif */
function useGif(gif) {
  media.gif = gif;
  settings.gifStart = 1;
  settings.gifEnd = gif.frames.length;
  settings.gifN = Math.min(6, gif.frames.length);
  describeGif();
  applyGifSample();
}

/** Load the bundled example GIF into the GIF tab (first visit). */
export async function loadExampleGif() {
  try {
    const res = await fetch(exampleGifUrl);
    const bytes = new Uint8Array(await res.arrayBuffer());
    settings.source = 'gif';
    useGif(decodeGif(bytes, 'example.gif'));
  } catch {
    /* no example: the app simply starts empty */
  }
}

/** @param {File} file */
export async function loadGifFile(file) {
  setGifStatus('Reading the GIF…');
  try {
    useGif(decodeGif(new Uint8Array(await file.arrayBuffer()), file.name));
  } catch (err) {
    setGifStatus(err.message, true);
  }
}

/** @param {string} raw a direct .gif link or a Giphy page */
export async function loadGifUrl(raw) {
  const url = directGifUrl(raw);
  if (!/^https?:\/\//i.test(url)) {
    setGifStatus('Enter a link starting with https://', true);
    return;
  }
  setGifStatus('Downloading the GIF…');
  let bytes;
  try {
    bytes = await fetchGifBytes(url);
  } catch (err) {
    setGifStatus(
      `Can't download the GIF from this link (${err.message || 'link blocked'}). ` +
        "Many sites don't allow downloads from other pages: save the GIF to your computer and load it as a file.",
      true,
    );
    return;
  }
  try {
    useGif(decodeGif(bytes, url.split('/').pop().split('?')[0] || 'GIF'));
  } catch (err) {
    setGifStatus(err.message, true);
  }
}

/** Images are appended in file-name order; a single GIF goes to the GIF tab instead. */
export async function addFiles(files) {
  const list = [...files];
  const gif = list.find((f) => f.type === 'image/gif');
  if (gif && list.length === 1) {
    settings.source = 'gif';
    loadGifFile(gif);
    return;
  }
  const loaded = await readImageFiles(list);
  if (loaded.length) media.frames = [...media.frames, ...loaded];
}

/** @param {number} i @param {number} delta */
export function moveFrame(i, delta) {
  const frames = [...media.frames];
  const [frame] = frames.splice(i, 1);
  frames.splice(i + delta, 0, frame);
  media.frames = frames;
}

export const removeFrame = (i) => (media.frames = media.frames.filter((_, k) => k !== i));
export const reverseFrames = () => (media.frames = [...media.frames].reverse());

export function clearFrames() {
  media.frames = [];
  motion.offset = 0;
  motion.angle = 0;
}
