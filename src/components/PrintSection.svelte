<!-- Print on A4: saved animations, sheet options, sheet previews and the two PDFs. Collapsible. -->
<script>
  import { settings, ui, reducedMotion } from '../stores/state.svelte.js';
  import {
    library,
    libraryStatus,
    sizeLabel,
    updateRecord,
    removeRecord,
    editRecord,
  } from '../stores/library.svelte.js';
  import { layoutSheets, drawSheet, summarize, buildPdf } from '../print/sheets.js';
  import { deliver } from '../lib/download.js';
  import { blobSrc, showCanvas } from '../lib/attachments.js';

  /** @type {Array<[HTMLCanvasElement, HTMLCanvasElement]>} preview canvases, images and grids, per sheet */
  let sheets = $state.raw([]);
  let summary = $state({ text: '', warn: false });
  /** @type {'base' | 'grid' | null} */
  let exporting = $state(null);

  // redraw the sheet previews shortly after the saved animations or the sheet options change
  $effect(() => {
    const records = library.records;
    const opts = $state.snapshot(ui.sheet);
    let cancelled = false;
    const timer = setTimeout(async () => {
      const L = await layoutSheets(records, opts);
      const drawn = [];
      for (let i = 0; i < L.pages.length; i++) {
        drawn.push([await drawSheet(L, i, 'base'), await drawSheet(L, i, 'grid')]);
      }
      if (cancelled) return;
      sheets = drawn;
      summary = summarize(L);
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  });

  async function exportPdf(kind) {
    exporting = kind;
    try {
      const blob = await buildPdf(library.records, $state.snapshot(ui.sheet), kind);
      await deliver(blob, kind === 'base' ? 'scanimation-sheets-images.pdf' : 'scanimation-sheets-grids.pdf');
    } catch (e) {
      summary = { text: `Couldn't create the PDF: ${e.message || e}`, warn: true };
    } finally {
      exporting = null;
    }
  }

  async function edit(record) {
    await editRecord(record);
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  const setCopies = (record, input) => {
    const copies = Math.max(1, Math.min(50, Math.round(+input.value || 1)));
    input.value = String(copies);
    updateRecord(record, { copies });
  };
</script>

<details class="panel print-box" id="printBox" bind:open={ui.printOpen} data-tour="print">
  <summary class="print-head">
    <h2 id="h-sheet">Print on A4</h2>
    <span class="note"
      >Saved animations are laid out automatically on two matching sets of sheets: one with the images, one
      with the grids to print on acetate. Every piece keeps its real size.</span
    >
  </summary>
  <div class="print-grid">
    <div class="print-side">
      <ul class="plist" id="printList">
        {#each library.records as record (record.id)}
          <li class:editing={record.id === settings.editingId}>
            <input
              type="checkbox"
              aria-label="Include {record.name} in the print"
              checked={record.checked}
              onchange={(e) => updateRecord(record, { checked: e.currentTarget.checked })}
            />
            <img alt="" {@attach blobSrc(record.base)} />
            <span class="pname"><b>{record.name}</b><small>{sizeLabel(record)}</small></span>
            <label class="copies"
              >Copies <input
                type="number"
                min="1"
                max="50"
                value={record.copies}
                onchange={(e) => setCopies(record, e.currentTarget)}
              /></label
            >
            {#if record.frames?.length}
              <button type="button" class="edit" aria-label="Edit {record.name}" onclick={() => edit(record)}
                >Edit</button
              >
            {:else}
              <button
                type="button"
                class="edit"
                disabled
                title="Saved with an earlier version: it has no frames, so it can't be reopened.">Edit</button
              >
            {/if}
            <button
              type="button"
              class="del"
              aria-label="Delete {record.name}"
              onclick={() => removeRecord(record)}>✕</button
            >
          </li>
        {/each}
      </ul>
      {#if !library.records.length}
        <p class="note" id="printEmpty">
          No saved animations yet. Set one up and press "Save for printing" at the top.
        </p>
      {/if}
      {#if !libraryStatus.persistent}
        <p class="note" id="storeNote">
          This browser can't keep animations: they stay available while the page is open.
        </p>
      {/if}
      <div class="cols3">
        <div class="field">
          <label for="pOrient">Sheet</label>
          <select
            id="pOrient"
            bind:value={() => (ui.sheet.landscape ? 'l' : 'p'), (v) => (ui.sheet.landscape = v === 'l')}
          >
            <option value="p">A4 portrait</option>
            <option value="l">A4 landscape</option>
          </select>
        </div>
        <div class="field">
          <label for="pMargin">Margin (mm)</label>
          <input id="pMargin" type="number" min="0" max="40" step="1" bind:value={ui.sheet.margin} />
        </div>
        <div class="field">
          <label for="pGap">Gap (mm)</label>
          <input id="pGap" type="number" min="0" max="30" step="1" bind:value={ui.sheet.gap} />
        </div>
      </div>
      <label class="lbl"
        ><input id="pInfo" type="checkbox" bind:checked={ui.sheet.info} />Print the settings above each piece</label
      >
      <label class="lbl"
        ><input id="pOutline" type="checkbox" bind:checked={ui.sheet.outline} />Thin cutting outline</label
      >
      <div class="row">
        <button
          id="pdfBase"
          type="button"
          class="primary"
          disabled={!sheets.length || exporting}
          onclick={() => exportPdf('base')}
        >
          {exporting === 'base' ? 'Preparing the PDF…' : 'Download images PDF'}
        </button>
        <button
          id="pdfGrid"
          type="button"
          class="primary"
          disabled={!sheets.length || exporting}
          onclick={() => exportPdf('grid')}
        >
          {exporting === 'grid' ? 'Preparing the PDF…' : 'Download grids PDF'}
        </button>
      </div>
      <p class="note" class:warn={summary.warn} id="printMsg" role="status">{summary.text}</p>
      <p class="note">Print the PDFs at 100% ("Actual size"), without fitting them to the page.</p>
    </div>

    <div class="sheets" id="sheets">
      {#each sheets as [base, grid], i (base)}
        <div class="sheet-pair">
          <figure>
            <div {@attach showCanvas(base)}></div>
            <figcaption>Sheet {i + 1} · images</figcaption>
          </figure>
          <figure>
            <div {@attach showCanvas(grid)}></div>
            <figcaption>Sheet {i + 1} · grids (acetate)</figcaption>
          </figure>
        </div>
      {/each}
    </div>
  </div>
</details>

<style>
  .print-box {
    display: block;
  }

  .print-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 2px 12px;
    cursor: pointer;
    list-style: none;
  }

  .print-head::-webkit-details-marker {
    display: none;
  }

  .print-head::after {
    content: '+ Show';
    grid-column: 2;
    grid-row: 1;
    font-size: 12px;
    font-weight: 700;
    border: 1px solid var(--ink);
    padding: 2px 8px;
  }

  .print-box[open] > .print-head::after {
    content: '− Hide';
  }

  .print-head .note {
    grid-column: 1;
  }

  .print-head:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
  }

  .print-grid {
    display: grid;
    grid-template-columns: 340px minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }

  .print-box[open] > .print-grid {
    margin-top: 12px;
  }

  @media (max-width: 860px) {
    .print-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .print-side {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }

  .cols3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  .plist {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .plist li {
    display: grid;
    grid-template-columns: auto 44px minmax(0, 1fr) auto auto auto;
    gap: 8px;
    align-items: center;
    padding: 4px;
    border: 1px solid var(--ink);
  }

  .plist li.editing {
    outline: 3px solid var(--cta);
    outline-offset: -1px;
  }

  .plist img {
    width: 44px;
    height: 44px;
    object-fit: contain;
    background: #fff;
    border: 1px solid var(--ink);
  }

  .plist li > button {
    padding: 2px 8px;
    font-size: 12px;
  }

  .pname {
    display: flex;
    flex-direction: column;
    min-width: 0;
    font-size: 12px;
  }

  .pname b {
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pname small {
    font-family: var(--font-mono);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }

  .copies {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
  }

  .copies input {
    width: 54px;
    padding: 3px 5px;
  }

  .sheets {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .sheet-pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  figure {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  /* the sheet canvases are drawn in JavaScript and inserted, so they are outside the scoped styles */
  figure :global(canvas) {
    display: block;
    width: 100%;
    height: auto;
    background: #fff;
    border: 1px solid var(--ink);
  }

  figcaption {
    font-size: 11px;
  }
</style>
