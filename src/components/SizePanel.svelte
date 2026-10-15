<!-- Output size in millimetres, and the figure size inside it. -->
<script>
  import { settings, pxToMm, mmToPx } from '../stores/state.svelte.js';
  import { fromWidth, fromHeight, MIN_PX, MAX_PX } from '../stores/format.js';

  // the pixel limits, expressed in mm at the current resolution
  const minMm = $derived(Math.ceil(pxToMm(MIN_PX) * 10) / 10);
  const maxMm = $derived(Math.floor(pxToMm(MAX_PX) * 10) / 10);
  const shown = (px) => pxToMm(px).toFixed(1);

  /**
   * Apply a size edit. The field is rewritten afterwards, because a clamped or ratio-adjusted value
   * may equal the previous one and would otherwise leave the typed text on screen.
   */
  function edit(input, apply, side) {
    apply(mmToPx(input.value));
    input.value = shown(side === 'w' ? settings.outW : settings.outH);
  }
</script>

<section class="panel" aria-labelledby="h-dims">
  <h2 id="h-dims">Size</h2>
  <div class="cols2">
    <div class="field">
      <label for="wMm">Width (mm)</label>
      <input
        id="wMm"
        type="number"
        min={minMm}
        max={maxMm}
        step="0.1"
        value={shown(settings.outW)}
        onchange={(e) => edit(e.currentTarget, fromWidth, 'w')}
      />
    </div>
    <div class="field">
      <label for="hMm">Height (mm)</label>
      <input
        id="hMm"
        type="number"
        min={minMm}
        max={maxMm}
        step="0.1"
        value={shown(settings.outH)}
        onchange={(e) => edit(e.currentTarget, fromHeight, 'h')}
      />
    </div>
  </div>
  <p class="note">From {minMm} to {maxMm} mm at {settings.dpi} dpi.</p>
  <div class="field">
    <label for="figScale">Figure size: <b>{Math.round(settings.figScale * 100)}%</b></label>
    <input
      id="figScale"
      type="range"
      min="10"
      max="100"
      step="5"
      bind:value={() => Math.round(settings.figScale * 100), (v) => (settings.figScale = v / 100)}
    />
  </div>
</section>
