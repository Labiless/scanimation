/**
 * Text tab: the text and its animation settings.
 */
import { state } from '../state.js';
import { setFrames } from '../frames.js';
import { renderTextFrames } from '../sources/text.js';
import { $, debounce } from '../lib/dom.js';

let job = 0;

/** Render the text frames; a newer edit discards an older one still in progress. */
export async function regenerateText() {
  const mine = ++job;
  const frames = await renderTextFrames(state.text);
  if (mine === job) setFrames(frames);
}
const regenerateSoon = debounce(regenerateText, 150);

/** Show only the settings that apply to the chosen animation. */
function syncFieldVisibility() {
  const { anim } = state.text;
  const isTurn = anim === 'rx' || anim === 'ry' || anim === 'rz';
  $('txtAngleField').hidden = $('txtNote').hidden = !isTurn;
  $('txtPerspField').hidden = !(anim === 'rx' || anim === 'ry');
}

export function syncTextPanel() {
  const T = state.text;
  $('txt').value = T.str;
  $('txtFont').value = String(T.font);
  $('txtAnim').value = T.anim;
  $('txtAngle').value = T.angle;
  $('txtAngleVal').textContent = `${T.angle}°`;
  $('txtPersp').value = T.persp;
  $('txtPerspVal').textContent = `${T.persp}%`;
  $('txtN').value = T.n;
  $('txtNVal').textContent = T.n;
  syncFieldVisibility();
}

export function initTextPanel() {
  const T = state.text;
  $('txt').addEventListener('input', (e) => {
    T.str = e.target.value;
    regenerateSoon();
  });
  $('txtFont').addEventListener('change', (e) => {
    T.font = +e.target.value;
    regenerateText();
  });
  $('txtAnim').addEventListener('change', (e) => {
    T.anim = e.target.value;
    syncFieldVisibility();
    regenerateText();
  });
  $('txtAngle').addEventListener('input', (e) => {
    T.angle = +e.target.value;
    $('txtAngleVal').textContent = `${T.angle}°`;
    regenerateSoon();
  });
  $('txtPersp').addEventListener('input', (e) => {
    T.persp = +e.target.value;
    $('txtPerspVal').textContent = `${T.persp}%`;
    regenerateSoon();
  });
  $('txtN').addEventListener('input', (e) => {
    T.n = +e.target.value;
    $('txtNVal').textContent = T.n;
    regenerateSoon();
  });
  syncFieldVisibility();
}
