/**
 * Bring every control in line with the state after it was replaced wholesale
 * (a restored session or a reopened saved animation), then render once.
 */
import { state } from '../state.js';
import { $ } from '../lib/dom.js';
import { applyZoom, syncSpeed, syncViewToggle } from './preview.js';
import { syncGridControls, setMotion, currentMotion } from './grid-controls.js';
import { syncFormatControls, setDims } from './format-controls.js';
import { syncColourControls, setMode } from './colour-controls.js';
import { syncTextPanel } from './text-panel.js';
import { syncGifPanel } from './gif-panel.js';
import { setSource } from './source-panel.js';
import { renderStrip } from './frame-strip.js';
import { syncEditing } from './editing.js';
import { refreshSheets } from '../print/sheets.js';

export function syncAll() {
  applyZoom();
  syncGridControls();
  syncFormatControls();
  syncColourControls();
  syncTextPanel();
  syncGifPanel();
  syncViewToggle();
  setSource(state.source || 'img', { generate: false });
  setMode(state.mode, { render: false });
  setMotion(currentMotion(), { render: false });
  syncSpeed();
  renderStrip();
  setDims(state.outW, state.outH); // renders
  syncEditing();
  if (state.editingName) $('animName').value = state.editingName;
  refreshSheets();
}
