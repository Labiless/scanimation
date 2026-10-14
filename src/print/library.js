/**
 * Animations saved for printing: save, update, reopen in the editor, include, copies, delete.
 */
import { state, pxToMm, settingsSnapshot, reducedMotion } from '../state.js';
import { baseCanvas, printGrid } from '../render.js';
import { infoSegments } from '../core/info.js';
import { toPngBlob } from '../lib/canvas.js';
import { animations } from '../lib/storage.js';
import { $ } from '../lib/dom.js';
import { setEditing } from '../ui/editing.js';
import { loadState, markFramesDirty } from '../session.js';
import { showRecords, forgetRecord } from './sheets.js';
import { framesFromGrid } from './migrate.js';

/**
 * @typedef {object} SavedAnimation
 * @property {string} id
 * @property {string} name
 * @property {number} created
 * @property {number} wMm
 * @property {number} hMm
 * @property {string[]} info settings line segments
 * @property {Blob} base interlaced image, PNG
 * @property {Blob} grid grid at print size, PNG with transparent slits
 * @property {boolean} checked included in the print
 * @property {number} copies
 * @property {object} [settings] editor settings, to reopen it (missing in early saves)
 * @property {Array<{ name: string, blob: Blob }>} [frames]
 * @property {{ bytes: Uint8Array, name: string } | null} [gif]
 */

/** @type {SavedAnimation[]} */
let saved = [];
let persistent = true;
/** @type {Map<string, string>} object URLs of the thumbnails */
const thumbs = new Map();

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const size = (r) => `${r.wMm.toFixed(1)} × ${r.hMm.toFixed(1)} mm`;

function persist(record) {
  animations.put(record).catch(() => {
    persistent = false;
    $('storeNote').hidden = false;
  });
}

function dropCache(id) {
  if (thumbs.has(id)) URL.revokeObjectURL(thumbs.get(id));
  thumbs.delete(id);
  forgetRecord(id);
}

/** @param {boolean} asNew save a copy even while editing a saved animation */
async function saveForPrint(asNew) {
  if (state.frames.length < 2) {
    $('saveMsg').textContent = 'At least 2 frames are needed to save.';
    return;
  }
  const old = !asNew && state.editingId ? saved.find((r) => r.id === state.editingId) : null;
  const name = $('animName').value.trim() || `Animation ${saved.length + 1}`;
  const frames = [];
  for (const f of state.frames) frames.push({ name: f.name, blob: (f.blob ??= await toPngBlob(f.src)) });

  /** @type {SavedAnimation} */
  const record = {
    id: old ? old.id : newId(),
    name,
    created: old ? old.created : Date.now(),
    wMm: pxToMm(state.outW),
    hMm: pxToMm(state.outH),
    info: infoSegments(),
    base: await toPngBlob(baseCanvas),
    grid: await toPngBlob(printGrid()),
    checked: old ? old.checked : true,
    copies: old ? old.copies : 1,
    settings: settingsSnapshot(),
    frames,
    gif: state.gif ? { bytes: state.gif.bytes, name: state.gif.name } : null,
  };

  if (old) {
    dropCache(old.id);
    saved[saved.indexOf(old)] = record;
    setEditing(record);
  } else {
    saved.push(record);
    setEditing(null);
  }
  persist(record);
  $('saveMsg').textContent = old
    ? `Updated "${name}" (${size(record)}).`
    : `Saved "${name}" (${size(record)}). You'll find it under Print on A4 at the bottom of the page.`;
  renderList();
}

/** Reopen a saved animation in the editor, with its frames and every setting. */
async function edit(record) {
  await loadState(record.settings, record.frames, record.gif);
  markFramesDirty();
  setEditing(record);
  $('saveMsg').textContent = '';
  renderList();
  window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
}

function remove(record) {
  saved = saved.filter((r) => r !== record);
  dropCache(record.id);
  if (state.editingId === record.id) setEditing(null);
  animations.delete(record.id).catch(() => {});
  renderList();
}

function listItem(record) {
  if (!thumbs.has(record.id)) thumbs.set(record.id, URL.createObjectURL(record.base));
  const li = document.createElement('li');
  li.innerHTML = `<input type="checkbox"><img alt=""><span class="pname"><b></b><small></small></span>
    <label class="copies">Copies <input type="number" min="1" max="50"></label>
    <button type="button" class="edit">Edit</button><button type="button" class="del">✕</button>`;
  li.classList.toggle('editing', record.id === state.editingId);

  const [include, copies] = li.querySelectorAll('input');
  include.checked = record.checked;
  include.setAttribute('aria-label', `Include ${record.name} in the print`);
  include.addEventListener('change', () => {
    record.checked = include.checked;
    persist(record);
    showRecords(saved);
  });
  copies.value = record.copies;
  copies.addEventListener('change', () => {
    record.copies = Math.max(1, Math.min(50, Math.round(+copies.value || 1)));
    copies.value = record.copies;
    persist(record);
    showRecords(saved);
  });

  li.querySelector('img').src = thumbs.get(record.id);
  li.querySelector('b').textContent = record.name;
  li.querySelector('small').textContent = size(record);

  const editBtn = li.querySelector('.edit');
  editBtn.setAttribute('aria-label', `Edit ${record.name}`);
  if (record.frames?.length) editBtn.addEventListener('click', () => edit(record));
  else {
    editBtn.disabled = true;
    editBtn.title = "Saved with an earlier version: it has no frames, so it can't be reopened.";
  }
  const delBtn = li.querySelector('.del');
  delBtn.setAttribute('aria-label', `Delete ${record.name}`);
  delBtn.addEventListener('click', () => remove(record));
  return li;
}

function renderList() {
  $('printEmpty').hidden = saved.length > 0;
  $('storeNote').hidden = persistent;
  $('printList').replaceChildren(...saved.map(listItem));
  showRecords(saved);
}

/** Add the frame count to settings lines saved before it was included. */
async function migrate() {
  for (const record of saved) {
    if (/^\d+F$/.test(record.info.at(-1) || '')) continue;
    try {
      const n = await framesFromGrid(record);
      if (n >= 2) {
        record.info = [...record.info, `${n}F`];
        persist(record);
      }
    } catch {
      /* leave this record as it is */
    }
  }
}

export async function initLibrary() {
  $('saveAnim').addEventListener('click', () => saveForPrint(false));
  $('saveAsNew').addEventListener('click', () => saveForPrint(true));
  $('stopEdit').addEventListener('click', () => {
    setEditing(null);
    renderList();
  });
  try {
    saved = (await animations.all()).sort((a, b) => a.created - b.created);
  } catch {
    persistent = false;
  }
  await migrate();
  renderList();
}
