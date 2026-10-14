<!-- Text tab: the text and its animation settings. -->
<script>
  import { settings } from '../stores/state.svelte.js';
  import { regenerateText } from '../stores/sources.svelte.js';
  import { FONTS } from '../sources/text.js';

  const T = settings.text;
  const isTurn = $derived(['rx', 'ry', 'rz'].includes(T.anim));
  const hasPerspective = $derived(T.anim === 'rx' || T.anim === 'ry');

  let timer;
  const regenerateSoon = () => {
    clearTimeout(timer);
    timer = setTimeout(regenerateText, 150);
  };

  /** Update a text setting and re-render: immediately for selects, debounced for typing and sliders. */
  function set(key, value, soon = true) {
    T[key] = value;
    if (soon) regenerateSoon();
    else regenerateText();
  }
</script>

<div class="gifbox" id="textBox" hidden={settings.source !== 'txt'}>
  <div class="cols">
    <div class="field wide">
      <label for="txt">Text (Enter for a new line)</label>
      <textarea id="txt" rows="1" bind:value={() => T.str, (v) => set('str', v)}></textarea>
    </div>
    <div class="field">
      <label for="txtFont">Typeface</label>
      <select id="txtFont" bind:value={() => T.font, (v) => set('font', v, false)}>
        {#each FONTS as f, i (f.label)}
          <option value={i}>{f.label}</option>
        {/each}
      </select>
    </div>
    <div class="field">
      <label for="txtAnim">Animation</label>
      <select id="txtAnim" bind:value={() => T.anim, (v) => set('anim', v, false)}>
        <option value="ry">Rotate Y (door)</option>
        <option value="rx">Rotate X (flip)</option>
        <option value="rz">Rotate Z (spin)</option>
        <option value="ltr">Letters from the left</option>
        <option value="rtl">Letters from the right</option>
      </select>
    </div>
    <div class="field" hidden={!isTurn}>
      <label for="txtAngle">Range: <b>{T.angle}°</b></label>
      <input
        id="txtAngle"
        type="range"
        min="15"
        max="360"
        step="15"
        bind:value={() => T.angle, (v) => set('angle', v)}
      />
    </div>
    <div class="field" hidden={!hasPerspective}>
      <label for="txtPersp">Perspective: <b>{T.persp}%</b></label>
      <input
        id="txtPersp"
        type="range"
        min="0"
        max="100"
        step="5"
        bind:value={() => T.persp, (v) => set('persp', v)}
      />
    </div>
    <div class="field">
      <label for="txtN">Frames: <b>{T.n}</b></label>
      <input id="txtN" type="range" min="2" max="12" bind:value={() => T.n, (v) => set('n', v)} />
    </div>
  </div>
  <p class="note" hidden={!isTurn}>Below 360°, use the "Back and forth" loop to make it swing.</p>
</div>

<style>
  .wide {
    grid-column: span 2;
  }
</style>
