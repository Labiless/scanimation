/**
 * Minimal publish/subscribe bus, so modules can react to each other without importing each other.
 */

/** The frame list was replaced, reordered or emptied. */
export const FRAMES_CHANGED = 'frames:changed';
/** The interlaced image and the grids were rebuilt. */
export const RENDERED = 'render:done';
/** Something worth keeping across a reload changed. */
export const SESSION_DIRTY = 'session:dirty';

/** @type {Map<string, Set<(detail?: unknown) => void>>} */
const listeners = new Map();

/**
 * @param {string} type
 * @param {(detail?: unknown) => void} fn
 * @returns {() => void} unsubscribe
 */
export function on(type, fn) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(fn);
  return () => listeners.get(type).delete(fn);
}

/**
 * @param {string} type
 * @param {unknown} [detail]
 */
export function emit(type, detail) {
  listeners.get(type)?.forEach((fn) => fn(detail));
}
