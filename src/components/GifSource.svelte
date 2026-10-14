<!-- Animated GIF tab: load by link or file, then choose how many frames to use and from which range. -->
<script>
  import { settings, ui, media } from '../stores/state.svelte.js';
  import {
    gifStatus,
    loadGifFile,
    loadGifUrl,
    applyGifSample,
    clampGifRange,
  } from '../stores/sources.svelte.js';
  import { dropZone } from '../lib/attachments.js';

  const frameTotal = $derived(media.gif?.frames.length ?? 1);
  const maxSample = $derived(Math.max(2, Math.min(settings.gifEnd - settings.gifStart + 1, 24)));

  let sampleTimer;
  function setCount(n) {
    settings.gifN = n;
    clearTimeout(sampleTimer);
    sampleTimer = setTimeout(applyGifSample, 120);
  }

  function setRange(key, value) {
    settings[key] = value;
    clampGifRange();
    applyGifSample();
  }

  function onFile(e) {
    const input = e.currentTarget;
    if (input.files[0]) loadGifFile(input.files[0]);
    input.value = '';
  }
</script>

<div class="gifbox" id="gifBox" hidden={settings.source !== 'gif'}>
  <form
    class="row"
    id="gifForm"
    onsubmit={(e) => {
      e.preventDefault();
      loadGifUrl(ui.gifUrl);
    }}
  >
    <input
      id="gifUrl"
      type="url"
      placeholder="https://…/animation.gif"
      aria-label="GIF link"
      bind:value={ui.gifUrl}
    />
    <button type="submit" class="primary">Load link</button>
    <label class="btn" for="gifFile">Choose GIF…</label>
    <input id="gifFile" type="file" accept="image/gif" hidden onchange={onFile} />
  </form>
  <div class="drop" id="gifDrop" {@attach dropZone((files) => loadGifFile(files[0]))}>
    <span class="note">or drop a .gif file here</span>
  </div>
  <p class="note" class:error={gifStatus.error} id="gifStatus" role="status">{gifStatus.text}</p>

  {#if media.gif}
    <div class="gifctrl cols" id="gifCtrl">
      <div class="field">
        <label for="gifN">Frames: <b>{settings.gifN}</b></label>
        <input id="gifN" type="range" min="2" max={maxSample} bind:value={() => settings.gifN, setCount} />
      </div>
      <div class="field">
        <label for="gifStart">From frame</label>
        <input
          id="gifStart"
          type="number"
          min="1"
          max={frameTotal}
          value={settings.gifStart}
          onchange={(e) => setRange('gifStart', +e.currentTarget.value)}
        />
      </div>
      <div class="field">
        <label for="gifEnd">To frame</label>
        <input
          id="gifEnd"
          type="number"
          min="1"
          max={frameTotal}
          value={settings.gifEnd}
          onchange={(e) => setRange('gifEnd', +e.currentTarget.value)}
        />
      </div>
    </div>
  {/if}
</div>

<style>
  #gifUrl {
    flex: 1 1 180px;
    width: auto;
  }
</style>
