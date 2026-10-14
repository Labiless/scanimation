/** Small DOM helpers shared by every UI module. */

/** @param {string} id */
export const $ = (id) => document.getElementById(id);

/**
 * Mark one button of a segmented group as pressed.
 * @param {Array<[string, unknown]>} buttons pairs of [element id, value]
 * @param {unknown} active the value whose button should be pressed
 */
export function setPressed(buttons, active) {
  for (const [id, value] of buttons) $(id).setAttribute('aria-pressed', String(value === active));
}

/**
 * Delay a call until `ms` have passed without a new one.
 * @template {(...args: any[]) => void} F
 * @param {F} fn
 * @param {number} ms
 */
export function debounce(fn, ms) {
  let timer;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

/**
 * Turn an element into a file drop zone that highlights while dragging.
 * @param {HTMLElement} el
 * @param {(files: FileList) => void} onFiles
 */
export function makeDropZone(el, onFiles) {
  const over = (on) => (e) => {
    e.preventDefault();
    el.classList.toggle('over', on);
  };
  el.addEventListener('dragenter', over(true));
  el.addEventListener('dragover', over(true));
  el.addEventListener('dragleave', over(false));
  el.addEventListener('drop', (e) => {
    over(false)(e);
    if (e.dataTransfer?.files.length) onFiles(e.dataTransfer.files);
  });
}
