<!-- Live preview: the base image with the grid sliding (or turning) over it, the toolbar, and dragging by hand. -->
<script>
  import { onMount } from 'svelte';
  import { settings, ui, media, motion, frameCount, wedgeAngle } from '../stores/state.svelte.js';
  import { baseCanvas, previewGrid, rendered } from '../stores/render.svelte.js';
  import Measurements from './Measurements.svelte';
  import ExportBar from './ExportBar.svelte';

  /** @type {HTMLCanvasElement} */
  let view;
  /** @type {{ frame: number, total: number, label: string, value: string, period: string } | null} */
  let readout = $state(null);

  const motionClass = $derived(settings.radial ? 'radial' : settings.vertical ? '' : 'horiz');

  // the visible canvas follows the output size
  $effect(() => {
    rendered.version;
    if (view.width !== baseCanvas.width) view.width = baseCanvas.width;
    if (view.height !== baseCanvas.height) view.height = baseCanvas.height;
  });

  const toDegrees = (rad) => ((rad * 180) / Math.PI).toFixed(2);
  const wrap = (v, period) => ((v % period) + period) % period;

  function draw(ctx, N) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, view.width, view.height);
    if (N < 2) {
      ctx.fillStyle = '#000';
      ctx.font = `${Math.round(Math.min(view.width, view.height) / 28)}px Roboto, Arial, sans-serif`;
      ctx.textAlign = 'center';
      const message = media.frames.length
        ? 'At least 2 frames are needed'
        : 'Load images, a GIF or type some text';
      ctx.fillText(message, view.width / 2, view.height / 2);
      readout = null;
      return;
    }
    ctx.drawImage(baseCanvas, 0, 0);
    if (settings.radial) {
      const alpha = wedgeAngle();
      const period = N * alpha;
      const m = wrap(motion.angle, period);
      if (settings.showGrid) {
        ctx.save();
        ctx.translate(view.width / 2, view.height / 2);
        ctx.rotate(m);
        ctx.drawImage(previewGrid, -previewGrid.width / 2, -previewGrid.height / 2);
        ctx.restore();
      }
      const frame = (Math.floor(m / alpha + 1e-9) % N) + 1;
      readout = {
        frame,
        total: N,
        label: 'grid rotation',
        value: `${toDegrees(m)}°`,
        period: `${toDegrees(period)}°`,
      };
    } else {
      const P = N * settings.w;
      const m = wrap(motion.offset, P);
      if (settings.showGrid) {
        if (settings.vertical) ctx.drawImage(previewGrid, m - P, 0);
        else ctx.drawImage(previewGrid, 0, m - P);
      }
      const frame = (Math.floor(m / settings.w) % N) + 1;
      readout = { frame, total: N, label: 'grid offset', value: `${m.toFixed(1)} px`, period: `${P} px` };
    }
  }

  let dragging = false;
  let dragStart = 0;
  let dragFrom = 0;

  onMount(() => {
    const ctx = view.getContext('2d');
    let last = performance.now();
    let raf;
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const N = frameCount();
      if (settings.playing && !dragging && N >= 2) {
        if (settings.radial) motion.angle += ((settings.rspeed * Math.PI) / 180) * dt;
        else motion.offset += settings.speed * dt;
      }
      draw(ctx, N);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  });

  function nextFrame() {
    settings.playing = false;
    if (settings.radial) {
      const a = wedgeAngle();
      motion.angle = (Math.floor(motion.angle / a + 1e-6) + 1) * a;
    } else {
      motion.offset = (Math.floor(motion.offset / settings.w + 1e-6) + 1) * settings.w;
    }
  }

  function pointerAngle(e) {
    const r = view.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
  }

  function onPointerDown(e) {
    dragging = true;
    view.setPointerCapture(e.pointerId);
    if (settings.radial) {
      dragStart = pointerAngle(e);
      dragFrom = motion.angle;
    } else {
      dragStart = settings.vertical ? e.clientX : e.clientY;
      dragFrom = motion.offset;
    }
  }

  function onPointerMove(e) {
    if (!dragging) return;
    if (settings.radial) {
      motion.angle = dragFrom + pointerAngle(e) - dragStart;
      return;
    }
    const r = view.getBoundingClientRect();
    const scale = settings.vertical ? view.width / r.width : view.height / r.height;
    motion.offset = dragFrom + ((settings.vertical ? e.clientX : e.clientY) - dragStart) * scale;
  }

  // the speed slider works in px/s for linear grids and °/s for the circular one
  const speed = $derived(
    settings.radial
      ? { min: 1, max: 60, value: settings.rspeed, unit: '°/s' }
      : { min: 2, max: 200, value: settings.speed, unit: 'px/s' },
  );
  function setSpeed(v) {
    if (settings.radial) settings.rspeed = v;
    else settings.speed = v;
  }
</script>

<section class="panel stage-panel" aria-label="Preview">
  <div class="stage {motionClass}" data-tour="preview" class:fit={ui.zoom === 'fit'} id="stage">
    <canvas
      id="view"
      aria-label="Animation preview"
      bind:this={view}
      style:width={ui.zoom === 'fit' ? null : `${settings.outW * +ui.zoom}px`}
      style:image-rendering={ui.zoom === 'fit' ? null : 'pixelated'}
      onpointerdown={onPointerDown}
      onpointermove={onPointerMove}
      onpointerup={() => (dragging = false)}
      onpointercancel={() => (dragging = false)}
    ></canvas>
  </div>
  <div class="toolbar">
    <button id="playBtn" type="button" onclick={() => (settings.playing = !settings.playing)}>
      {settings.playing ? 'Pause' : 'Play'}
    </button>
    <button id="stepBtn" type="button" onclick={nextFrame}>Next frame</button>
    <div class="seg" role="group" aria-label="View">
      <button
        type="button"
        id="viewGrid"
        aria-pressed={settings.showGrid}
        onclick={() => (settings.showGrid = true)}>With grid</button
      >
      <button
        type="button"
        id="viewBase"
        aria-pressed={!settings.showGrid}
        onclick={() => (settings.showGrid = false)}>Base only</button
      >
    </div>
    <select id="zoom" aria-label="Zoom" bind:value={ui.zoom}>
      <option value="fit">Fit</option>
      <option value="1">100%</option>
      <option value="2">200%</option>
    </select>
    <div class="speed">
      <label for="speed">Grid speed: <b>{speed.value} {speed.unit}</b></label>
      <input
        id="speed"
        type="range"
        min={speed.min}
        max={speed.max}
        bind:value={() => speed.value, setSpeed}
      />
    </div>
  </div>
  <ExportBar />
  <div class="readout" id="readout">
    {#if readout}
      Visible frame <b>{readout.frame}</b> / {readout.total} · {readout.label} <b>{readout.value}</b> over a
      period of
      {readout.period}
    {/if}
  </div>
  <Measurements />
</section>

<style>
  .stage-panel {
    gap: 6px;
  }

  .stage {
    border: 1px solid var(--ink);
    overflow: auto;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 10px;
    touch-action: none;
  }

  canvas {
    display: block;
    background: #fff;
    outline: 1px solid var(--ink);
    cursor: ew-resize;
  }

  .fit canvas {
    max-width: 100%;
    max-height: max(260px, calc(100vh - 260px));
    width: auto;
    height: auto;
  }

  @media (max-width: 1000px) {
    .fit canvas {
      max-height: 34vh;
    }
  }

  .horiz canvas {
    cursor: ns-resize;
  }

  .radial canvas {
    cursor: grab;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 12px;
    align-items: center;
  }

  .toolbar select {
    width: auto;
  }

  .speed {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1 1 220px;
    min-width: 0;
  }

  .speed label {
    white-space: nowrap;
    font-size: 12px;
  }

  .readout {
    font-family: var(--font-mono);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    min-height: 1.4em;
  }

  .readout b {
    font-weight: 500;
  }
</style>
