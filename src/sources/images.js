import { canvasFromBlob } from '../lib/canvas.js';

/**
 * Read image files into frames, ordered by file name (numbers sorted naturally).
 * Unreadable files are skipped.
 * @param {Iterable<File>} files
 * @returns {Promise<import('../stores/state.svelte.js').Frame[]>}
 */
export async function readImageFiles(files) {
  const images = [...files]
    .filter((f) => f.type.startsWith('image/'))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const frames = [];
  for (const file of images) {
    try {
      frames.push({ name: file.name, src: await canvasFromBlob(file) });
    } catch {
      /* unreadable image: skip it */
    }
  }
  return frames;
}
