/**
 * Animated GIF tab: load a GIF by link or file, then choose how many frames to use and from which range.
 */
import { state } from '../state.js';
import { setFrames } from '../frames.js';
import { decodeGif, sampleGif, directGifUrl, fetchGifBytes } from '../sources/gif.js';
import { $, debounce, makeDropZone } from '../lib/dom.js';

function setStatus(message, isError = false) {
  const el = $('gifStatus');
  el.textContent = message;
  el.classList.toggle('error', isError);
}

/** Take the chosen frames from the GIF and make them the animation. */
function applySample() {
  const gif = state.gif;
  if (!gif) return;
  const frames = sampleGif(gif, state.gifStart, state.gifEnd, state.gifN);
  const span = state.gifEnd - state.gifStart + 1;
  $('gifN').max = Math.max(2, Math.min(span, 24));
  $('gifN').value = frames.length;
  $('gifNVal').textContent = frames.length;
  setFrames(frames);
}
const applySampleSoon = debounce(applySample, 120);

/** Controls reflect `state.gif` and the chosen range (also used when a session is restored). */
export function syncGifPanel() {
  const gif = state.gif;
  $('gifCtrl').hidden = !gif;
  if (!gif) return;
  const len = gif.frames.length;
  state.gifEnd = Math.min(state.gifEnd, len);
  state.gifStart = Math.min(state.gifStart, state.gifEnd - 1);
  $('gifStart').max = $('gifEnd').max = len;
  $('gifStart').value = state.gifStart;
  $('gifEnd').value = state.gifEnd;
  $('gifN').max = Math.max(2, Math.min(state.gifEnd - state.gifStart + 1, 24));
  $('gifN').value = state.gifN;
  $('gifNVal').textContent = state.gifN;
  const cut = gif.total > len ? ` (first ${len} used)` : '';
  setStatus(`${gif.name}: ${gif.total} frame${cut}, ${gif.W}×${gif.H} px.`);
}

/** @param {import('../sources/gif.js').DecodedGif} gif */
function useGif(gif) {
  state.gif = gif;
  state.gifStart = 1;
  state.gifEnd = gif.frames.length;
  state.gifN = Math.min(6, gif.frames.length);
  syncGifPanel();
  applySample();
}

/** @param {File} file */
export async function loadGifFile(file) {
  setStatus('Reading the GIF…');
  try {
    useGif(decodeGif(new Uint8Array(await file.arrayBuffer()), file.name));
  } catch (err) {
    setStatus(err.message, true);
  }
}

async function loadGifUrl(raw) {
  const url = directGifUrl(raw);
  if (!/^https?:\/\//i.test(url)) {
    setStatus('Enter a link starting with https://', true);
    return;
  }
  setStatus('Downloading the GIF…');
  let bytes;
  try {
    bytes = await fetchGifBytes(url);
  } catch (err) {
    setStatus(
      `Can't download the GIF from this link (${err.message || 'link blocked'}). ` +
        "Many sites don't allow downloads from other pages: save the GIF to your computer and load it as a file.",
      true,
    );
    return;
  }
  try {
    useGif(decodeGif(bytes, url.split('/').pop().split('?')[0] || 'GIF'));
  } catch (err) {
    setStatus(err.message, true);
  }
}

function clampRange() {
  const max = state.gif ? state.gif.frames.length : 1;
  state.gifStart = Math.max(1, Math.min(max - 1, Math.round(+$('gifStart').value || 1)));
  state.gifEnd = Math.max(state.gifStart + 1, Math.min(max, Math.round(+$('gifEnd').value || max)));
  $('gifStart').value = state.gifStart;
  $('gifEnd').value = state.gifEnd;
  applySample();
}

export function initGifPanel() {
  $('gifForm').addEventListener('submit', (e) => {
    e.preventDefault();
    loadGifUrl($('gifUrl').value);
  });
  $('gifFile').addEventListener('change', (e) => {
    if (e.target.files[0]) loadGifFile(e.target.files[0]);
    e.target.value = '';
  });
  makeDropZone($('gifDrop'), (files) => loadGifFile(files[0]));
  $('gifN').addEventListener('input', (e) => {
    state.gifN = +e.target.value;
    $('gifNVal').textContent = state.gifN;
    applySampleSoon();
  });
  $('gifStart').addEventListener('change', clampRange);
  $('gifEnd').addEventListener('change', clampRange);
}
