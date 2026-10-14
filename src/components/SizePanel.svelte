<!-- Output size in px or mm, and the figure size inside it. -->
<script>
  import { settings, pxToMm, mmToPx } from '../stores/state.svelte.js';
  import { fromWidth, fromHeight } from '../stores/format.js';

  /**
   * Apply a size edit. The field is rewritten afterwards, because a clamped or ratio-adjusted value
   * may equal the previous one and would otherwise leave the typed text on screen.
   */
  function edit(e, inMm, apply) {
    const input = e.currentTarget;
    settings.lockMm = inMm;
    apply(inMm ? mmToPx(input.value) : +input.value);
    input.value = input.dataset.side === 'w' ? fieldValue('w', inMm) : fieldValue('h', inMm);
  }
  const fieldValue = (side, inMm) => {
    const px = side === 'w' ? settings.outW : settings.outH;
    return inMm ? pxToMm(px).toFixed(2) : String(px);
  };
</script>

<section class="panel" aria-label="Size">
  <div class="cols2">
    <div class="field">
      <label for="wPx">Width (px)</label>
      <input
        id="wPx"
        data-side="w"
        type="number"
        min="100"
        max="5000"
        value={settings.outW}
        onchange={(e) => edit(e, false, fromWidth)}
      />
    </div>
    <div class="field">
      <label for="wMm">Width (mm)</label>
      <input
        id="wMm"
        data-side="w"
        type="number"
        min="5"
        max="1000"
        step="0.1"
        value={pxToMm(settings.outW).toFixed(2)}
        onchange={(e) => edit(e, true, fromWidth)}
      />
    </div>
    <div class="field">
      <label for="hPx">Height (px)</label>
      <input
        id="hPx"
        data-side="h"
        type="number"
        min="100"
        max="5000"
        value={settings.outH}
        onchange={(e) => edit(e, false, fromHeight)}
      />
    </div>
    <div class="field">
      <label for="hMm">Height (mm)</label>
      <input
        id="hMm"
        data-side="h"
        type="number"
        min="5"
        max="1000"
        step="0.1"
        value={pxToMm(settings.outH).toFixed(2)}
        onchange={(e) => edit(e, true, fromHeight)}
      />
    </div>
  </div>
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
