<!-- Print format: aspect ratio and resolution. -->
<script>
  import { settings } from '../stores/state.svelte.js';
  import { setRatio, setDpi } from '../stores/format.js';

  const RATIOS = [
    ['1', '1:1 square'],
    ['1.3333', '4:3 landscape'],
    ['1.5', '3:2 landscape'],
    ['1.7778', '16:9 landscape'],
    ['2', '2:1 landscape'],
    ['3', '3:1 strip'],
    ['0.75', '3:4 portrait'],
    ['0.6667', '2:3 portrait'],
    ['0.5', '1:2 portrait'],
    ['free', 'Free'],
  ];
  const DPIS = [150, 300, 600, 1200];
</script>

<section class="panel" aria-labelledby="h-size">
  <h2 id="h-size">Print format</h2>
  <div class="cols2">
    <div class="field">
      <label for="ratio">Aspect ratio</label>
      <select
        id="ratio"
        bind:value={
          () => (settings.ratio ? String(settings.ratio) : 'free'), (v) => setRatio(v === 'free' ? 0 : +v)
        }
      >
        {#each RATIOS as [value, label] (value)}
          <option {value}>{label}</option>
        {/each}
      </select>
    </div>
    <div class="field">
      <label for="dpi">Resolution (dpi)</label>
      <select id="dpi" bind:value={() => settings.dpi, setDpi}>
        {#each DPIS as dpi (dpi)}
          <option value={dpi}>{dpi}</option>
        {/each}
      </select>
    </div>
  </div>
  <p class="note">PNGs carry the dpi: printed at 100% they come out at the size shown.</p>
</section>
