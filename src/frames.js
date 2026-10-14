import { state } from './state.js';
import { emit, FRAMES_CHANGED } from './lib/events.js';

/**
 * Replace the current frames and let the strip, the renderer and the session know.
 * @param {import('./state.js').Frame[]} frames
 */
export function setFrames(frames) {
  state.frames = frames;
  framesChanged();
}

/** Call after changing `state.frames` in place (reorder, remove). */
export const framesChanged = () => emit(FRAMES_CHANGED);
