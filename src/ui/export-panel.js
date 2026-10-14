/**
 * Download the base image and the grid as PNGs carrying their print resolution,
 * optionally with the settings line above the image.
 */
import { state, pxToMm } from '../state.js';
import { baseCanvas, printGrid } from '../render.js';
import { withDpi } from '../core/png-dpi.js';
import { withInfoBand } from '../core/info.js';
import { toPngBlob } from '../lib/canvas.js';
import { deliver } from '../lib/download.js';
import { $ } from '../lib/dom.js';

const sizeTag = () => `${pxToMm(state.outW).toFixed(0)}x${pxToMm(state.outH).toFixed(0)}mm-${state.dpi}dpi`;

/**
 * Inside a sandboxed frame a plain download link may do nothing, so show the image
 * to be saved by hand, with a button to close it.
 */
function showFallback(blob, filename, caption) {
  const box = $('exports');
  box.hidden = false;
  let fig = box.querySelector(`[data-file="${filename}"]`);
  if (!fig) {
    fig = document.createElement('figure');
    fig.dataset.file = filename;
    box.append(fig);
  }
  if (fig.dataset.url) URL.revokeObjectURL(fig.dataset.url);
  const url = URL.createObjectURL(blob);
  fig.dataset.url = url;
  fig.innerHTML = `<div class="fig-head"><span>${caption}</span>
      <button type="button" class="fig-close" aria-label="Close the ${caption} preview">✕ Close</button></div>
    <img alt="${caption}" src="${url}">
    <figcaption>If the download doesn't start, right-click (or long-press) the image to save it.</figcaption>`;
  fig.querySelector('.fig-close').addEventListener('click', () => {
    URL.revokeObjectURL(url);
    fig.remove();
    box.hidden = !box.children.length;
  });
}

async function savePng(canvas, filename, caption) {
  const blob = await withDpi(await toPngBlob(canvas), state.dpi);
  const how = await deliver(blob, filename);
  if (how === 'link' && window.top !== window) showFallback(blob, filename, caption);
}

const withSettingsLine = (canvas, transparent) =>
  $('infoBand').checked ? withInfoBand(canvas, transparent) : canvas;

export function initExportPanel() {
  $('saveBase').addEventListener('click', () => {
    if (state.frames.length < 2) return;
    savePng(withSettingsLine(baseCanvas, false), `scanimation-base-${sizeTag()}.png`, 'Base image');
  });
  $('saveGrid').addEventListener('click', () => {
    if (state.frames.length < 2) return;
    savePng(withSettingsLine(printGrid(), true), `scanimation-grid-${sizeTag()}.png`, 'Grid');
  });
}
