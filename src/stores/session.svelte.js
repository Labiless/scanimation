/**
 * The work in progress (frames, loaded GIF, every setting and page option) is kept in this browser
 * and comes back after a reload.
 */
import { settings, ui, media, motion } from './state.svelte.js';
import { session as store } from '../lib/storage.js';
import { canvasFromBlob, toPngBlob } from '../lib/canvas.js';
import { decodeGif } from '../sources/gif.js';
import { describeGif } from './sources.svelte.js';

const SAVE_DELAY = 700;
let ready = $state(false);

/**
 * Replace the editor state with stored settings and frames.
 * @param {object | undefined} stored settings
 * @param {Array<{ name: string, blob: Blob }> | undefined} frames
 * @param {{ bytes: Uint8Array, name: string } | null | undefined} gif
 */
export async function loadState(stored, frames, gif) {
  if (stored) {
    // lockMm: from versions that also offered pixel fields; the size is now always kept in mm
    const { text, playing: _playing, lockMm: _lockMm, ...rest } = stored;
    Object.assign(settings, rest);
    if (text) Object.assign(settings.text, text);
  }
  let decoded = null;
  if (gif?.bytes) {
    try {
      decoded = decodeGif(gif.bytes, gif.name);
    } catch {
      /* the stored GIF can't be read any more */
    }
  }
  const loaded = [];
  for (const f of frames || []) {
    try {
      loaded.push({ name: f.name, src: await canvasFromBlob(f.blob), blob: f.blob });
    } catch {
      /* skip an unreadable frame */
    }
  }
  media.gif = decoded;
  media.frames = loaded;
  motion.offset = 0;
  motion.angle = 0;
  describeGif();
}

/** Page options saved by the version before Svelte, keyed by element id. */
function migrateUi(saved) {
  if (!('pOrient' in saved)) return saved;
  return {
    printOpen: saved.printBox,
    zoom: saved.zoom,
    infoBand: saved.infoBand,
    gifUrl: saved.gifUrl,
    sheet: {
      landscape: saved.pOrient === 'l',
      margin: +saved.pMargin,
      gap: +saved.pGap,
      info: saved.pInfo,
      outline: saved.pOutline,
    },
  };
}

export async function restoreSession() {
  try {
    const stored = await store.get('settings');
    const frames = await store.get('frames');
    if (stored?.ui) {
      // animName: the name field was removed; saved animations are numbered instead
      const { sheet, animName: _animName, ...rest } = migrateUi(stored.ui);
      Object.assign(ui, rest);
      if (sheet) Object.assign(ui.sheet, sheet);
    }
    await loadState(stored?.settings, frames?.frames, frames?.gif);
  } catch {
    /* nothing stored, or storage unavailable */
  } finally {
    ready = true;
  }
}

/**
 * Save settings and page options shortly after they change, and the frames when they are replaced.
 * Call during component initialisation (it registers effects).
 */
export function persistSession() {
  $effect(() => {
    const { playing: _playing, ...stored } = $state.snapshot(settings);
    const page = $state.snapshot(ui);
    if (!ready) return;
    const timer = setTimeout(
      () => store.put('settings', { settings: stored, ui: page }).catch(() => {}),
      SAVE_DELAY,
    );
    return () => clearTimeout(timer);
  });

  $effect(() => {
    const frames = media.frames;
    const gif = media.gif;
    if (!ready) return;
    const timer = setTimeout(async () => {
      try {
        // each frame is encoded once and the PNG kept on the frame, so reordering doesn't re-encode
        const stored = [];
        for (const f of frames) stored.push({ name: f.name, blob: (f.blob ??= await toPngBlob(f.src)) });
        await store.put('frames', { frames: stored, gif: gif ? { bytes: gif.bytes, name: gif.name } : null });
      } catch {
        /* storage unavailable: the work just won't survive a reload */
      }
    }, SAVE_DELAY);
    return () => clearTimeout(timer);
  });
}
