/**
 * Source tabs (Images / Animated GIF / Text) and loading image files.
 */
import { state } from '../state.js';
import { framesChanged } from '../frames.js';
import { readImageFiles } from '../sources/images.js';
import { $, setPressed, makeDropZone } from '../lib/dom.js';
import { loadGifFile } from './gif-panel.js';
import { regenerateText } from './text-panel.js';

const TABS = [
  ['srcImg', 'img'],
  ['srcGif', 'gif'],
  ['srcTxt', 'txt'],
];

/**
 * @param {'img' | 'gif' | 'txt'} source
 * @param {{ generate?: boolean }} [opts] generate: render the text frames when switching to Text
 */
export function setSource(source, { generate = true } = {}) {
  state.source = source;
  setPressed(TABS, source);
  $('drop').hidden = source !== 'img';
  $('gifBox').hidden = source !== 'gif';
  $('textBox').hidden = source !== 'txt';
  if (source === 'txt' && generate) regenerateText();
}

/** Images are appended in file-name order; a single GIF goes to the GIF tab instead. */
async function addFiles(files) {
  const list = [...files];
  const gif = list.find((f) => f.type === 'image/gif');
  if (gif && list.length === 1) {
    setSource('gif');
    loadGifFile(gif);
    return;
  }
  const frames = await readImageFiles(list);
  if (!frames.length) return;
  state.frames.push(...frames);
  framesChanged();
}

export function initSourcePanel() {
  for (const [id, source] of TABS) $(id).addEventListener('click', () => setSource(source));
  $('fileIn').addEventListener('change', (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  });
  makeDropZone($('drop'), addFiles);
}
