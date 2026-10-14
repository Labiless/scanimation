/**
 * The work in progress (frames, loaded GIF, every setting and page option) is kept in this browser
 * and comes back after a reload.
 */
import { state, PERSISTED_KEYS } from './state.js';
import { session as store } from './lib/storage.js';
import { canvasFromBlob, toPngBlob } from './lib/canvas.js';
import { $, debounce } from './lib/dom.js';
import { on, FRAMES_CHANGED, SESSION_DIRTY } from './lib/events.js';
import { decodeGif } from './sources/gif.js';
import { syncAll } from './ui/sync.js';

/** Page options outside the editor state, stored as they are shown. */
const UI_IDS = [
  'printBox',
  'zoom',
  'infoBand',
  'pOrient',
  'pMargin',
  'pGap',
  'pInfo',
  'pOutline',
  'gifUrl',
  'animName',
];

let restoring = true;
let framesDirty = false;

function readUi() {
  return Object.fromEntries(
    UI_IDS.map((id) => {
      const el = $(id);
      if (el.tagName === 'DETAILS') return [id, el.open];
      return [id, el.type === 'checkbox' ? el.checked : el.value];
    }),
  );
}

function applyUi(ui) {
  for (const [id, value] of Object.entries(ui)) {
    const el = $(id);
    if (!el) continue;
    if (el.tagName === 'DETAILS') el.open = Boolean(value);
    else if (el.type === 'checkbox') el.checked = Boolean(value);
    else el.value = value;
  }
}

async function save() {
  const settings = Object.fromEntries(PERSISTED_KEYS.map((k) => [k, state[k]]));
  try {
    await store.put('settings', { settings, ui: readUi() });
    if (!framesDirty) return;
    framesDirty = false;
    // each frame is encoded once and the PNG kept on the frame, so reordering doesn't re-encode
    const frames = [];
    for (const f of state.frames) frames.push({ name: f.name, blob: (f.blob ??= await toPngBlob(f.src)) });
    const gif = state.gif ? { bytes: state.gif.bytes, name: state.gif.name } : null;
    await store.put('frames', { frames, gif });
  } catch {
    /* storage unavailable: the work just won't survive a reload */
  }
}

const saveSoon = debounce(save, 700);
const scheduleSave = () => {
  if (!restoring) saveSoon();
};

/** The frames must be written again on the next save (they were replaced). */
export const markFramesDirty = () => {
  framesDirty = true;
  scheduleSave();
};

/**
 * Replace the editor state with stored settings and frames, then refresh every control.
 * @param {object | undefined} settings
 * @param {Array<{ name: string, blob: Blob }> | undefined} frames
 * @param {{ bytes: Uint8Array, name: string } | null | undefined} gif
 * @param {object} [ui] page options to restore
 */
export async function loadState(settings, frames, gif, ui = {}) {
  if (settings) {
    const text = { ...state.text, ...(settings.text || {}) };
    Object.assign(state, settings, { text });
  }
  state.gif = null;
  if (gif?.bytes) {
    try {
      state.gif = decodeGif(gif.bytes, gif.name);
    } catch {
      state.gif = null;
    }
  }
  state.frames = [];
  for (const f of frames || []) {
    try {
      state.frames.push({ name: f.name, src: await canvasFromBlob(f.blob), blob: f.blob });
    } catch {
      /* skip an unreadable frame */
    }
  }
  state.offset = 0;
  state.angle = 0;
  applyUi(ui);
  syncAll();
}

export async function initSession() {
  on(FRAMES_CHANGED, markFramesDirty);
  on(SESSION_DIRTY, scheduleSave);
  for (const type of ['input', 'change']) document.addEventListener(type, scheduleSave);
  document.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.closest('button')) scheduleSave();
  });
  $('printBox').addEventListener('toggle', scheduleSave);

  try {
    const stored = await store.get('settings');
    const frames = await store.get('frames');
    await loadState(stored?.settings, frames?.frames, frames?.gif, stored?.ui);
  } catch {
    await loadState(undefined, undefined, undefined);
  } finally {
    restoring = false;
  }
}
