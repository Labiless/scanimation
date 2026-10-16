<!-- Under the preview: PNG downloads (with their print resolution) and saving the animation for printing. -->
<script>
  import { settings, ui, media, pxToMm } from '../stores/state.svelte.js';
  import { baseCanvas, printGrid } from '../stores/render.svelte.js';
  import { saveForPrint, setEditing, libraryStatus } from '../stores/library.svelte.js';
  import { withDpi } from '../core/png-dpi.js';
  import { withInfoBand } from '../core/info.js';
  import { toPngBlob } from '../lib/canvas.js';
  import { deliver } from '../lib/download.js';
  import { phone } from '../lib/media.js';

  /** Images shown when a sandboxed frame ignores the download link, so they can be saved by hand. */
  let fallbacks = $state([]);

  /** There is something to export: at least two frames. */
  const ready = $derived(media.frames.length >= 2);

  // on phones the bar pinned to the bottom appears only with an animation to export;
  // the page keeps room for it only while it is there
  $effect(() => {
    document.body.classList.toggle('with-export-bar', phone.current && ready);
    return () => document.body.classList.remove('with-export-bar');
  });

  const sizeTag = () =>
    `${pxToMm(settings.outW).toFixed(0)}x${pxToMm(settings.outH).toFixed(0)}mm-${settings.dpi}dpi`;
  // on phones the option is hidden and the settings line is always added
  const withSettingsLine = (canvas, transparent) =>
    ui.infoBand || phone.current ? withInfoBand(canvas, transparent) : canvas;

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
  <!-- on phones this row is pinned to the bottom of the screen, with short labels -->
  <div class="row buttons" class:waiting={!ready}>
    <button id="saveGrid" type="button" class="primary" onclick={downloadGrid}>
      <span class="long">Download grid (transparent PNG)</span><span class="short" aria-hidden="true"
        >Export grid</span
      >
    </button>
    <button id="saveBase" type="button" class="primary" onclick={downloadBase}>
      <span class="long">Download base image (PNG)</span><span class="short" aria-hidden="true"
        >Export base</span
      >
    </button>
    <button id="saveAnim" type="button" class="primary" onclick={() => saveForPrint(false)}>
      <span class="long">{settings.editingId ? 'Update saved animation' : 'Save for printing'}</span><span
        class="short"
        aria-hidden="true">{settings.editingId ? 'Update' : 'Save'}</span
      >
    </button>
  </div>
  {#if !phone.current}
    <label class="lbl"
      ><input id="infoBand" type="checkbox" bind:checked={ui.infoBand} />Add a line with the settings above
      the image</label
    >
  {/if}
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
  .buttons button {
    flex: 1 1 auto;
    justify-content: center;
  }

  .short {
    display: none;
  }

  @media (max-width: 640px) {
    /* the buttons live in the bar pinned to the bottom, so the section under the preview takes no room */
    /* no box of its own: the pinned buttons leave the flow, and the editing note or message
       (when there is one) sits directly in the preview panel */
    div.export-bar {
      display: contents;
    }

    .buttons {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 50;
      flex-wrap: nowrap;
      gap: 6px;
      padding: 6px 16px calc(6px + env(safe-area-inset-bottom, 0px));
      background: var(--bg);
      border-top: 1px solid var(--ink);
    }

    .buttons button {
      flex: 1 1 0;
      min-width: 0;
      padding: 5px 4px;
      font-size: 11px;
    }

    /* the full text stays for screen readers; the short one is what fits on screen */
    .long {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    .short {
      display: inline;
    }

    /* keep the end of the page clear of the pinned bar */
    .buttons.waiting {
      display: none;
    }

    :global(body.with-export-bar) {
      padding-bottom: calc(48px + env(safe-area-inset-bottom, 0px));
    }
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
