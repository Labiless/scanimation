/**
 * Svelte attachments ({@attach ...}) shared by the components.
 */
import { drawContain } from './canvas.js';

/**
 * Make an element a file drop zone that highlights while dragging.
 * @param {(files: FileList) => void} onFiles
 */
export const dropZone = (onFiles) => (node) => {
  const over = (on) => (e) => {
    e.preventDefault();
    node.classList.toggle('over', on);
  };
  const enter = over(true);
  const leave = over(false);
  const drop = (e) => {
    leave(e);
    if (e.dataTransfer?.files.length) onFiles(e.dataTransfer.files);
  };
  node.addEventListener('dragenter', enter);
  node.addEventListener('dragover', enter);
  node.addEventListener('dragleave', leave);
  node.addEventListener('drop', drop);
  return () => {
    node.removeEventListener('dragenter', enter);
    node.removeEventListener('dragover', enter);
    node.removeEventListener('dragleave', leave);
    node.removeEventListener('drop', drop);
  };
};

/**
 * Draw `src` on a white background, fitted inside the canvas.
 * @param {HTMLCanvasElement} src
 */
export const thumbnail = (src) => (/** @type {HTMLCanvasElement} */ canvas) => {
  const g = canvas.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, canvas.width, canvas.height);
  drawContain(g, src, canvas.width, canvas.height);
};

/**
 * Show a blob in an <img>, releasing its object URL when the element goes away.
 * @param {Blob} blob
 */
export const blobSrc = (blob) => (/** @type {HTMLImageElement} */ img) => {
  const url = URL.createObjectURL(blob);
  img.src = url;
  return () => URL.revokeObjectURL(url);
};

/**
 * Put an already drawn canvas inside the element.
 * @param {HTMLCanvasElement} canvas
 */
export const showCanvas = (canvas) => (node) => {
  node.replaceChildren(canvas);
};
