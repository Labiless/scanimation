<!-- Frame thumbnails in strip order: move left/right, remove. -->
<script>
  import { media } from '../stores/state.svelte.js';
  import { moveFrame, removeFrame } from '../stores/sources.svelte.js';
  import { thumbnail } from '../lib/attachments.js';
</script>

<ul class="frames" id="frameList" aria-label="Frames in order">
  {#each media.frames as frame, i (frame)}
    <li>
      <span class="idx">{i + 1}</span>
      <canvas width="108" height="80" {@attach thumbnail(frame.src)}></canvas>
      <!-- the name stays in the DOM as a tooltip source; the thumbnail is enough on screen -->
      <span class="name" title={frame.name}>{frame.name}</span>
      <span class="acts">
        <button
          type="button"
          aria-label="Move frame {i + 1} left"
          disabled={i === 0}
          onclick={() => moveFrame(i, -1)}>←</button
        >
        <button
          type="button"
          aria-label="Move frame {i + 1} right"
          disabled={i === media.frames.length - 1}
          onclick={() => moveFrame(i, 1)}>→</button
        >
        <button type="button" aria-label="Remove frame {i + 1}" onclick={() => removeFrame(i)}>✕</button>
      </span>
    </li>
  {:else}
    <li class="empty">No frames yet: load images, a GIF or type some text.</li>
  {/each}
</ul>

<style>
  .frames {
    list-style: none;
    margin: 0;
    padding: 6px;
    display: flex;
    gap: 6px;
    overflow-x: auto;
    border: 1px solid var(--ink);
    min-height: 92px;
  }

  li {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: none;
  }

  li.empty {
    align-self: center;
    font-size: 12px;
    padding: 0 6px;
    position: static;
  }

  canvas {
    width: 76px;
    height: 56px;
    border: 1px solid var(--ink);
    background: #fff;
    display: block;
  }

  .name {
    display: none;
  }

  .idx {
    position: absolute;
    top: 1px;
    left: 1px;
    font-family: var(--font-mono);
    font-size: 10px;
    background: #000;
    color: #fff;
    padding: 0 3px;
  }

  .acts {
    display: flex;
  }

  .acts button {
    padding: 1px 0;
    font-size: 11px;
    flex: 1;
    justify-content: center;
  }

  .acts button + button {
    border-left: 0;
  }
</style>
