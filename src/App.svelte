<!-- Scanimation Studio: controls on the left, live preview on the right, Print on A4 below. -->
<script>
  import { onMount } from 'svelte';
  import { renderInputs, rebuild } from './stores/render.svelte.js';
  import { persistSession, restoreSession } from './stores/session.svelte.js';
  import { loadLibrary } from './stores/library.svelte.js';
  import SourcePanel from './components/SourcePanel.svelte';
  import GridPanel from './components/GridPanel.svelte';
  import FormatPanel from './components/FormatPanel.svelte';
  import SizePanel from './components/SizePanel.svelte';
  import ColourPanel from './components/ColourPanel.svelte';
  import Preview from './components/Preview.svelte';
  import PrintSection from './components/PrintSection.svelte';

  // re-render the animation shortly after anything it depends on changes (sliders settle first)
  $effect(() => {
    renderInputs();
    const timer = setTimeout(rebuild, 60);
    return () => clearTimeout(timer);
  });

  persistSession();

  onMount(() => {
    restoreSession();
    loadLibrary();
  });
</script>

<div class="wrap">
  <header>
    <h1>Scanimation Studio</h1>
    <p>Drag the grid on the preview to move it by hand.</p>
  </header>

  <div class="editor">
    <div class="controls-col">
      <SourcePanel />
      <GridPanel />
      <div class="pair">
        <FormatPanel />
        <SizePanel />
      </div>
      <div class="pair">
        <ColourPanel />
      </div>
    </div>
    <Preview />
  </div>

  <PrintSection />
</div>

<style>
  .wrap {
    max-width: 1440px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 16px;
  }

  h1 {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.01em;
    margin: 0;
  }

  header p {
    margin: 0;
    font-size: 12px;
  }

  .editor {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
    gap: 8px;
    align-items: start;
  }

  .controls-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  /* the preview stays in view while the controls scroll */
  .editor > :global(.stage-panel) {
    position: sticky;
    top: calc(env(safe-area-inset-top, 0px) + 8px);
    max-height: calc(100vh - 16px);
    overflow-y: auto;
  }

  @media (max-width: 1000px) {
    .editor {
      grid-template-columns: minmax(0, 1fr);
    }

    .editor > :global(.stage-panel) {
      order: -1;
      top: env(safe-area-inset-top, 0px);
      max-height: 60vh;
      z-index: 2;
      background: var(--bg);
    }
  }
</style>
