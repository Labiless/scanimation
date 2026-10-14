<!-- Strip, slit, bar and period in px and mm, brightness and format, under the preview. -->
<script>
  import { settings, media, frameCount, pxToMm } from '../stores/state.svelte.js';

  const mm = (px) => pxToMm(px).toFixed(2);

  const rows = $derived.by(() => {
    const s = settings;
    const N = frameCount();
    const loaded = media.frames.length;
    const frames = N === loaded ? `${N}` : `${N} in the loop (${loaded} loaded, back and forth)`;
    // share of the image that shows through the grid, and whether neighbouring frames mix
    const pct = Math.min(100, (s.aperture / Math.max(N, 1)) * 100);
    const brightness = `${pct.toFixed(0)}% of the image visible${s.aperture > 1 ? ' · frames overlap' : ''}`;
    const format = `${(pxToMm(s.outW) / 10).toFixed(1)} × ${(pxToMm(s.outH) / 10).toFixed(1)} cm`;

    if (s.radial) {
      const alpha = (Math.PI * 2) / (s.rays * Math.max(N, 1));
      const deg = (alpha * 180) / Math.PI;
      const rEdge = Math.min(s.outW, s.outH) / 2;
      return [
        ['Frames', frames],
        ['Rays', s.rays],
        ['Wedge', `${deg.toFixed(3)}°`],
        ['Slit', `${(deg * s.aperture).toFixed(3)}°`],
        ['Period', `${(deg * N).toFixed(3)}°`],
        ['At the edge', `${mm(rEdge * alpha * s.aperture)} mm slit`],
        ['At half radius', `${mm((rEdge / 2) * alpha * s.aperture)} mm slit`],
        ['Brightness', brightness],
        ['Format', format],
      ];
    }
    const P = N * s.w;
    const slit = s.w * s.aperture;
    const bar = Math.max(0, P - slit);
    return [
      ['Frames', frames],
      ['Strip', `${s.w} px = ${mm(s.w)} mm`],
      ['Slit', `${+slit.toFixed(2)} px = ${mm(slit)} mm`],
      ['Black bar', `${+bar.toFixed(2)} px = ${mm(bar)} mm`],
      ['Period', `${P} px = ${mm(P)} mm`],
      ['Brightness', brightness],
      ['Format', format],
    ];
  });
</script>

<dl class="spec" id="spec" aria-label="Measurements">
  {#each rows as [term, value] (term)}
    <dt>{term}</dt>
    <dd>{value}</dd>
  {/each}
</dl>

<style>
  .spec {
    font-family: var(--font-mono);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    display: flex;
    flex-wrap: wrap;
    gap: 2px 14px;
    margin: 0;
    padding-top: 6px;
    border-top: 1px solid var(--ink);
  }

  dt {
    font-weight: 400;
  }

  dt::after {
    content: ':';
  }

  dd {
    margin: 0 0 0 -10px;
    font-weight: 500;
  }
</style>
