/**
 * Colour treatment: silhouette (threshold, fill colour), posterize (levels, greyscale) or original;
 * invert and edge blur apply to all.
 */
import { state } from '../state.js';
import { rebuild, rebuildSoon } from '../render.js';
import { $, setPressed } from '../lib/dom.js';

const MODES = [
  ['modeSil', 'sil'],
  ['modePost', 'post'],
  ['modeOrig', 'orig'],
];

/**
 * @param {'sil' | 'post' | 'orig'} mode
 * @param {{ render?: boolean }} [opts]
 */
export function setMode(mode, { render = true } = {}) {
  state.mode = mode;
  setPressed(MODES, mode);
  $('threshField').hidden = $('fillField').hidden = mode !== 'sil';
  $('postField').hidden = mode !== 'post';
  if (render) rebuild();
}

export function syncColourControls() {
  $('thresh').value = state.thresh;
  $('threshVal').textContent = state.thresh;
  $('levels').value = state.levels;
  $('levelsVal').textContent = state.levels;
  $('gray').checked = state.gray;
  $('invert').checked = state.invert;
  $('fill').value = state.fill;
  $('fillVal').textContent = state.fill;
  $('blur').value = state.blur;
  $('blurVal').textContent = `${state.blur} px`;
}

/** Slider bound to a numeric setting: shows its value and rebuilds once it stops moving. */
function bindSlider(id, key, format = (v) => v) {
  $(id).addEventListener('input', (e) => {
    state[key] = +e.target.value;
    $(`${id}Val`).textContent = format(state[key]);
    rebuildSoon();
  });
}

export function initColourControls() {
  for (const [id, mode] of MODES) $(id).addEventListener('click', () => setMode(mode));
  bindSlider('thresh', 'thresh');
  bindSlider('levels', 'levels');
  bindSlider('blur', 'blur', (v) => `${v} px`);
  $('gray').addEventListener('change', (e) => {
    state.gray = e.target.checked;
    rebuild();
  });
  $('invert').addEventListener('change', (e) => {
    state.invert = e.target.checked;
    rebuild();
  });
  $('fill').addEventListener('input', (e) => {
    state.fill = e.target.value;
    $('fillVal').textContent = state.fill;
    rebuildSoon();
  });
}
