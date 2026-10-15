/**
 * Animations saved for printing: save, update, reopen in the editor, include, copies, delete.
 */
import { settings, media, pxToMm, settingsSnapshot } from './state.svelte.js';
import { baseCanvas, printGrid } from './render.svelte.js';
import { loadState } from './session.svelte.js';
import { infoSegments } from '../core/info.js';
import { toPngBlob } from '../lib/canvas.js';
import { animations } from '../lib/storage.js';
import { forgetRecord } from '../print/sheets.js';
import { framesFromGrid } from '../print/migrate.js';

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
let records = $state.raw([]);

export const library = {
  get records() {
    return records;
  },
};

/** `persistent` is false when this browser refuses to store the animations. */
export const libraryStatus = $state({ persistent: true, message: '' });

/** One more than the highest "Animation N" saved so far, so deleting one never repeats a number. */
const nextNumber = () =>
  Math.max(0, ...records.map((r) => +(r.name.match(/^Animation (\d+)$/)?.[1] ?? 0))) + 1;
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const sizeLabel = (r) => `${r.wMm.toFixed(1)} × ${r.hMm.toFixed(1)} mm`;

function persist(record) {
  animations.put(record).catch(() => (libraryStatus.persistent = false));
}

/** @param {{ id: string, name: string } | null} record */
export function setEditing(record) {
  settings.editingId = record?.id ?? null;
  settings.editingName = record?.name ?? '';
}

/** @param {boolean} asNew save a copy even while editing a saved animation */
export async function saveForPrint(asNew) {
  if (media.frames.length < 2) {
    libraryStatus.message = 'At least 2 frames are needed to save.';
    return;
  }
  const old = !asNew && settings.editingId ? records.find((r) => r.id === settings.editingId) : null;
  // animations are numbered in the order they are saved; an update keeps its name
  const name = old ? old.name : `Animation ${nextNumber()}`;
  const frames = [];
  for (const f of media.frames) frames.push({ name: f.name, blob: (f.blob ??= await toPngBlob(f.src)) });

  /** @type {SavedAnimation} */
  const record = {
    id: old ? old.id : newId(),
    name,
    created: old ? old.created : Date.now(),
    wMm: pxToMm(settings.outW),
    hMm: pxToMm(settings.outH),
    info: infoSegments(),
    base: await toPngBlob(baseCanvas),
    grid: await toPngBlob(printGrid()),
    checked: old ? old.checked : true,
    copies: old ? old.copies : 1,
    settings: settingsSnapshot(),
    frames,
    gif: media.gif ? { bytes: media.gif.bytes, name: media.gif.name } : null,
  };

  if (old) {
    forgetRecord(old.id);
    records = records.map((r) => (r === old ? record : r));
    setEditing(record);
  } else {
    records = [...records, record];
    setEditing(null);
  }
  persist(record);
  libraryStatus.message = old
    ? `Updated "${name}" (${sizeLabel(record)}).`
    : `Saved "${name}" (${sizeLabel(record)}). You'll find it under Print on A4 at the bottom of the page.`;
}

/**
 * Change a record's print options (included, copies).
 * @param {SavedAnimation} record
 * @param {Partial<Pick<SavedAnimation, 'checked' | 'copies'>>} patch
 */
export function updateRecord(record, patch) {
  const next = { ...record, ...patch };
  records = records.map((r) => (r === record ? next : r));
  persist(next);
}

/** @param {SavedAnimation} record */
export function removeRecord(record) {
  records = records.filter((r) => r !== record);
  forgetRecord(record.id);
  if (settings.editingId === record.id) setEditing(null);
  animations.delete(record.id).catch(() => {});
}

/** Reopen a saved animation in the editor, with its frames and every setting. */
export async function editRecord(record) {
  await loadState(record.settings, record.frames, record.gif);
  setEditing(record);
  libraryStatus.message = '';
}

/** Add the frame count to settings lines saved before it was included. */
async function migrate(list) {
  for (const record of list) {
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

export async function loadLibrary() {
  try {
    const list = (await animations.all()).sort((a, b) => a.created - b.created);
    await migrate(list);
    records = list;
  } catch {
    libraryStatus.persistent = false;
  }
}
