<!-- Under the preview: PNG downloads (with their print resolution) and saving the animation for printing. -->
<script>
  import { settings, ui, media, pxToMm } from '../stores/state.svelte.js';
  import { baseCanvas, printGrid } from '../stores/render.svelte.js';
  import { saveForPrint, setEditing, libraryStatus } from '../stores/library.svelte.js';
  import { withDpi } from '../core/png-dpi.js';
  import { withInfoBand } from '../core/info.js';
  import { toPngBlob } from '../lib/canvas.js';
  import { deliver } from '../lib/download.js';

  /** Images shown when a sandboxed frame ignores the download link, so they can be saved by hand. */
  let fallbacks = $state([]);

  const sizeTag = () =>
    `${pxToMm(settings.outW).toFixed(0)}x${pxToMm(settings.outH).toFixed(0)}mm-${settings.dpi}dpi`;
  const withSettingsLine = (canvas, transparent) =>
    ui.infoBand ? withInfoBand(canvas, transparent) : canvas;

  async function savePng(canvas, file, caption) {
    const blob = await withDpi(await toPngBlob(canvas), settings.dpi);
    const how = await deliver(blob, file);
    if (how !== 'link' || window.top === window) return;
    closeFallback(file);
    fallbacks = [...fallbacks, { file, caption, url: URL.createObjectURL(blob) }];
  }

  function closeFallback(file) {
    const old = fallbacks.find((f) => f.file === file);
    if (!old) return;
    URL.revokeObjectURL(old.url);
    fallbacks = fallbacks.filter((f) => f !== old);
  }

  function downloadBase() {
    if (media.frames.length < 2) return;
    savePng(withSettingsLine(baseCanvas, false), `scanimation-base-${sizeTag()}.png`, 'Base image');
  }

  function downloadGrid() {
    if (media.frames.length < 2) return;
    savePng(withSettingsLine(printGrid(), true), `scanimation-grid-${sizeTag()}.png`, 'Grid');
  }
</script>

<div class="export-bar" aria-label="Export and save" role="group" data-tour="export">
  <div class="row">
    <button id="saveGrid" type="button" class="primary" onclick={downloadGrid}
      >Download grid (transparent PNG)</button
    >
    <button id="saveBase" type="button" class="primary" onclick={downloadBase}
      >Download base image (PNG)</button
    >
    <button id="saveAnim" type="button" class="primary" onclick={() => saveForPrint(false)}>
      {settings.editingId ? 'Update saved animation' : 'Save for printing'}
    </button>
  </div>
  <label class="lbl"
    ><input id="infoBand" type="checkbox" bind:checked={ui.infoBand} />Add a line with the settings above the
    image</label
  >
  {#if settings.editingId}
    <div class="row" id="editNote">
      <span class="note">Editing <b>"{settings.editingName}"</b>: "Update" overwrites the saved one.</span>
      <button id="saveAsNew" type="button" onclick={() => saveForPrint(true)}>Save as new</button>
      <button id="stopEdit" type="button" onclick={() => setEditing(null)}>Stop editing</button>
    </div>
  {/if}
  {#if libraryStatus.message}
    <p class="note" id="saveMsg" role="status">{libraryStatus.message}</p>
  {/if}

  {#if fallbacks.length}
    <div class="exports" id="exports">
      {#each fallbacks as f (f.file)}
        <figure>
          <div class="fig-head">
            <span>{f.caption}</span>
            <button
              type="button"
              class="fig-close"
              aria-label="Close the {f.caption} preview"
              onclick={() => closeFallback(f.file)}>✕ Close</button
            >
          </div>
          <img alt={f.caption} src={f.url} />
          <figcaption>
            If the download doesn't start, right-click (or long-press) the image to save it.
          </figcaption>
        </figure>
      {/each}
    </div>
  {/if}
</div>

<style>
  .row:first-child button {
    flex: 1 1 auto;
    justify-content: center;
  }

  .export-bar {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 6px;
    border-top: 1px solid var(--ink);
  }

  .exports {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  figure {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1 1 180px;
    min-width: 0;
  }

  img {
    border: 1px solid var(--ink);
    background: repeating-conic-gradient(#000 0 25%, #fff 0 50%) 0 0 / 12px 12px;
    max-width: 100%;
  }

  figcaption {
    font-size: 11px;
  }

  .fig-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 700;
  }

  .fig-close {
    padding: 2px 8px;
    font-size: 11px;
    flex: none;
  }
</style>
