<!-- Frames panel: source tabs (Images / Animated GIF / Text), image loading and the frame strip. -->
<script>
  import { settings, media } from '../stores/state.svelte.js';
  import { setSource, addFiles, reverseFrames, clearFrames } from '../stores/sources.svelte.js';
  import { dropZone } from '../lib/attachments.js';
  import FrameStrip from './FrameStrip.svelte';
  import GifSource from './GifSource.svelte';
  import TextSource from './TextSource.svelte';

  const TABS = [
    { id: 'srcImg', value: 'img', label: 'Images' },
    { id: 'srcGif', value: 'gif', label: 'Animated GIF' },
    { id: 'srcTxt', value: 'txt', label: 'Text' },
  ];

  // two-step delete: the first click arms the button, a second click within 3 s clears the frames
  let armed = $state(false);
  let disarmTimer;
  function deleteAll() {
    if (!armed) {
      armed = true;
      disarmTimer = setTimeout(() => (armed = false), 3000);
      return;
    }
    clearTimeout(disarmTimer);
    armed = false;
    clearFrames();
  }

  function onFiles(e) {
    const input = e.currentTarget;
    addFiles(input.files);
    input.value = '';
  }
</script>

<section class="panel" aria-label="Frames">
  <div class="row between">
    <div class="seg" role="group" aria-label="Frame source">
      {#each TABS as tab (tab.id)}
        <button
          type="button"
          id={tab.id}
          aria-pressed={settings.source === tab.value}
          onclick={() => setSource(tab.value)}>{tab.label}</button
        >
      {/each}
    </div>
    <div class="row">
      <button id="reverseBtn" type="button" disabled={media.frames.length < 2} onclick={reverseFrames}
        >Reverse order</button
      >
      <button
        id="clearBtn"
        type="button"
        class:primary={armed}
        disabled={!media.frames.length}
        onclick={deleteAll}
      >
        {armed ? 'Click again to delete' : 'Delete all frames'}
      </button>
    </div>
  </div>

  <div class="drop" id="drop" hidden={settings.source !== 'img'} {@attach dropZone(addFiles)}>
    <label class="btn primary" for="fileIn">Choose images…</label>
    <span class="note">or drop them here, in order</span>
    <input id="fileIn" type="file" accept="image/*" multiple hidden onchange={onFiles} />
  </div>

  <GifSource />
  <TextSource />
  <FrameStrip />
</section>
