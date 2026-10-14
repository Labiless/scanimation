<!-- Colour treatment (silhouette, posterize, original) and the fill and blur panel beside it. -->
<script>
  import { settings } from '../stores/state.svelte.js';

  const MODES = [
    { id: 'modeSil', value: 'sil', label: 'Silhouette' },
    { id: 'modePost', value: 'post', label: 'Posterize' },
    { id: 'modeOrig', value: 'orig', label: 'Original' },
  ];
</script>

<section class="panel" aria-label="Colour">
  <div class="row">
    <span class="lbl">Colour</span>
    <div class="seg" role="group" aria-label="Colour">
      {#each MODES as m (m.id)}
        <button
          type="button"
          id={m.id}
          aria-pressed={settings.mode === m.value}
          onclick={() => (settings.mode = m.value)}>{m.label}</button
        >
      {/each}
    </div>
  </div>
  {#if settings.mode === 'sil'}
    <div class="field">
      <label for="thresh">Silhouette threshold: <b>{settings.thresh}</b></label>
      <input id="thresh" type="range" min="10" max="245" bind:value={settings.thresh} />
    </div>
  {:else if settings.mode === 'post'}
    <div class="field">
      <label for="levels">Levels per channel: <b>{settings.levels}</b></label>
      <input id="levels" type="range" min="2" max="8" bind:value={settings.levels} />
      <label class="lbl"><input id="gray" type="checkbox" bind:checked={settings.gray} />Greyscale</label>
    </div>
  {/if}
  <label class="lbl"
    ><input id="invert" type="checkbox" bind:checked={settings.invert} />Invert black and white</label
  >
</section>

<section class="panel" aria-label="Fill and blur">
  {#if settings.mode === 'sil'}
    <div class="row">
      <input id="fill" type="color" aria-label="Fill colour" bind:value={settings.fill} />
      <label class="lbl" for="fill">Fill colour <b>{settings.fill}</b></label>
    </div>
  {/if}
  <div class="field">
    <label for="blur">Edge blur: <b>{settings.blur} px</b></label>
    <input id="blur" type="range" min="0" max="12" step="0.5" bind:value={settings.blur} />
  </div>
</section>
