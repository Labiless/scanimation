<!-- Grid: motion, strip width or rays, slit aperture, loop, reset to defaults. -->
<script>
  import { settings, GRID_DEFAULTS, frameCount, pxToMm } from '../stores/state.svelte.js';

  const MOTIONS = [
    { id: 'oriV', value: 'v', label: 'Vertical' },
    { id: 'oriH', value: 'h', label: 'Horizontal' },
    { id: 'oriR', value: 'r', label: 'Circular' },
  ];
  const LOOPS = [
    { id: 'loopOn', value: true, label: 'Continuous' },
    { id: 'loopOff', value: false, label: 'Back and forth' },
  ];

  const motion = $derived(settings.radial ? 'r' : settings.vertical ? 'v' : 'h');

  function setMotion(mode) {
    settings.radial = mode === 'r';
    if (!settings.radial) settings.vertical = mode === 'v';
  }

  // the circular slit widens outwards, so its width is quoted at the edge of the circle
  const slitPx = $derived(
    settings.radial
      ? (Math.min(settings.outW, settings.outH) / 2) *
          ((Math.PI * 2) / (settings.rays * Math.max(frameCount(), 1))) *
          settings.aperture
      : settings.w * settings.aperture,
  );

  function reset() {
    const { w, rays, aperture, loop, vertical, radial } = GRID_DEFAULTS;
    Object.assign(settings, { w, rays, aperture, loop, vertical, radial });
  }
</script>

<section class="panel" aria-labelledby="h-grid" data-tour="grid">
  <div class="row between">
    <h2 id="h-grid">Grid</h2>
    <button
      type="button"
      id="gridReset"
      class="icon-btn"
      title="Reset grid to defaults"
      aria-label="Reset grid settings to defaults"
      onclick={reset}
    >
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path d="M3 8a5 5 0 1 0 1.6-3.7" fill="none" stroke="currentColor" stroke-width="1.6" />
        <path d="M2.5 1.8v3.4h3.4" fill="none" stroke="currentColor" stroke-width="1.6" />
      </svg>
    </button>
  </div>
  <div class="pair inner">
    <div class="stack">
      <div class="row">
        <span class="lbl">Motion</span>
        <div class="seg" role="group" aria-label="Grid motion">
          {#each MOTIONS as m (m.id)}
            <button
              type="button"
              id={m.id}
              aria-pressed={motion === m.value}
              onclick={() => setMotion(m.value)}>{m.label}</button
            >
          {/each}
        </div>
      </div>
      <div class="field" id="slitField" hidden={settings.radial}>
        <label for="slit">Strip width: <b>{settings.w} px ≈ {pxToMm(settings.w).toFixed(2)} mm</b></label>
        <input id="slit" type="range" min="1" max="24" bind:value={settings.w} />
      </div>
      <div class="field" id="raysField" hidden={!settings.radial}>
        <label for="rays">Number of rays: <b>{settings.rays}</b></label>
        <input id="rays" type="range" min="6" max="240" bind:value={settings.rays} />
      </div>
      <p class="note" hidden={!settings.radial}>
        Slits narrow towards the centre: keep subjects towards the outside.
      </p>
    </div>
    <div class="stack">
      <div class="row">
        <span class="lbl">Loop</span>
        <div class="seg" role="group" aria-label="Animation loop">
          {#each LOOPS as l (l.id)}
            <button
              type="button"
              id={l.id}
              aria-pressed={settings.loop === l.value}
              onclick={() => (settings.loop = l.value)}>{l.label}</button
            >
          {/each}
        </div>
      </div>
      <div
        class="field"
        title="Below 100% the image is sharper but darker; above 100% it is brighter but neighbouring frames blend."
      >
        <label for="aperture"
          >Slit aperture: <b id="apertureVal"
            >{Math.round(settings.aperture * 100)}% ≈ {pxToMm(slitPx).toFixed(2)} mm{settings.radial
              ? ' at edge'
              : ''}</b
          ></label
        >
        <input
          id="aperture"
          type="range"
          min="25"
          max="200"
          step="5"
          bind:value={() => Math.round(settings.aperture * 100), (v) => (settings.aperture = v / 100)}
        />
      </div>
    </div>
  </div>
</section>
