<!--
  Step-by-step guide. Each step dims the page, highlights one area (by its data-tour attribute)
  and explains it in a card placed beside it. Esc closes, the arrow keys move between steps.
-->
<script>
  import { tick } from 'svelte';
  import { tour, closeTour } from '../stores/tour.svelte.js';
  import { ui, reducedMotion } from '../stores/state.svelte.js';
  import { AUTHOR, LINKS } from '../lib/links.js';
  import SocialIcon from './SocialIcon.svelte';

  /**
   * @typedef {object} Step
   * @property {string} title
   * @property {string} [target] data-tour value of the area to highlight
   * @property {string} intro
   * @property {Array<[string, string]>} [points] term and explanation
   * @property {boolean} [support] show the author's links
   * @property {string} [outro] text after the links
   */

  /** @type {Step[]} */
  const STEPS = [
    {
      title: 'Welcome to Scanimation Studio',
      intro: `This tool was created by ${AUTHOR}. Follow along for new projects and updates:`,
      support: true,
      outro:
        'A scanimation is a printed image made of thin interleaved strips, plus a striped grid you slide over it: ' +
        'moving the grid brings the picture to life. Ready? Let’s start the step-by-step guide.',
    },
    {
      title: '1 · Choose a source',
      target: 'sources',
      intro: 'Start from the frames of your animation. 4–6 frames with bold shapes work best.',
      points: [
        ['Images', 'upload your frames; they are sorted by file name, and you can reorder them below.'],
        ['Animated GIF', 'paste a link or load a file, then choose how many frames to take and from where.'],
        ['Text', 'type a word and pick an animation: a 3D turn, a spin or letters appearing.'],
      ],
    },
    {
      title: '2 · Tune the grid',
      target: 'grid',
      intro: 'These settings decide how the animation reads once printed.',
      points: [
        ['Motion', 'vertical or horizontal lines, or a circular grid that rotates around a pin.'],
        ['Strip width', 'thinner strips give smoother motion but need a precise printer.'],
        [
          'Slit aperture',
          'below 100% the image is sharper but darker, above it brighter; 150% suits the default thin strips.',
        ],
        ['Loop', 'continuous for cycles, back and forth for swings. The ↺ button restores the defaults.'],
      ],
    },
    {
      title: '3 · Size and style',
      target: 'format',
      intro: 'Set the real printed size and how the frames are turned into ink.',
      points: [
        ['Size', 'width and height in millimetres, at the chosen resolution (dpi).'],
        [
          'Style',
          'silhouette for crisp black and white, posterize for a few tones, or the original colours.',
        ],
      ],
    },
    {
      title: '4 · Check the preview',
      target: 'preview',
      intro:
        'The grid slides over the image just as it will on paper. Drag it with the mouse or your finger, ' +
        'pause it, or step one frame at a time to check each one.',
    },
    {
      title: '5 · Export',
      target: 'export',
      intro: 'Everything comes out at its real size, ready to print at 100%.',
      points: [
        ['Download grid', 'a PNG with transparent slits: print it on acetate.'],
        ['Download base image', 'the interlaced image to print on paper.'],
        ['Save for printing', 'adds the animation to the A4 sheets below; you can reopen and edit it later.'],
      ],
    },
    {
      title: '6 · Print on A4',
      target: 'print',
      intro:
        'Saved animations are laid out automatically on two matching sets of A4 sheets: images and grids. ' +
        'Choose copies, margins and orientation, then download the two PDFs and print them at 100% ("Actual size").',
    },
  ];

  const step = $derived(STEPS[tour.step]);
  const last = $derived(tour.step === STEPS.length - 1);

  /** @type {{ top: number, left: number, width: number, height: number } | null} */
  let spot = $state(null);
  /** @type {{ top: number, left: number } | null} null: centred */
  let cardPos = $state(null);
  /** @type {HTMLElement} */
  let card = $state();
  /** @type {HTMLButtonElement} */
  let nextBtn = $state();

  const MARGIN = 16;
  const GAP = 12;
  const PAD = 6;

  /** The area to highlight; an element without a box of its own (display: contents) stands for its first child. */
  function targetEl() {
    const el = step.target ? document.querySelector(`[data-tour="${step.target}"]`) : null;
    if (el && getComputedStyle(el).display === 'contents') return el.firstElementChild;
    return el;
  }

  /** Highlight the target and put the card below, above, right or left of it, whichever fits first. */
  function measure() {
    const el = targetEl();
    if (!el || !card) {
      spot = null;
      cardPos = null;
      return;
    }
    const r = el.getBoundingClientRect();
    spot = { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    const clampX = (x) => Math.max(MARGIN, Math.min(vw - cw - MARGIN, x));
    const clampY = (y) => Math.max(MARGIN, Math.min(vh - ch - MARGIN, y));
    if (r.bottom + PAD + GAP + ch <= vh - MARGIN)
      cardPos = { top: r.bottom + PAD + GAP, left: clampX(r.left) };
    else if (r.top - PAD - GAP - ch >= MARGIN)
      cardPos = { top: r.top - PAD - GAP - ch, left: clampX(r.left) };
    else if (r.right + PAD + GAP + cw <= vw - MARGIN)
      cardPos = { top: clampY(r.top), left: r.right + PAD + GAP };
    else if (r.left - PAD - GAP - cw >= MARGIN)
      cardPos = { top: clampY(r.top), left: r.left - PAD - GAP - cw };
    else cardPos = { top: vh - ch - MARGIN, left: clampX((vw - cw) / 2) };
  }

  async function show() {
    if (step.target === 'print') ui.printOpen = true;
    await tick();
    const el = targetEl();
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
      if (!reducedMotion) await new Promise((r) => setTimeout(r, 350));
    }
    measure();
    nextBtn?.focus();
  }

  $effect(() => {
    if (!tour.open) return;
    tour.step; // re-place on every step
    show();
    const onChange = () => measure();
    window.addEventListener('resize', onChange);
    window.addEventListener('scroll', onChange, true);
    return () => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('scroll', onChange, true);
    };
  });

  const next = () => (last ? closeTour() : tour.step++);
  const back = () => tour.step > 0 && tour.step--;

  function onKey(e) {
    if (!tour.open) return;
    if (e.key === 'Escape') closeTour();
    else if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') back();
  }
</script>

<svelte:window onkeydown={onKey} />

{#if tour.open}
  <!-- clicks outside the card are swallowed, so the page can't change under the guide -->
  <div class="blocker" class:dim={!spot}></div>
  {#if spot}
    <div
      class="spot"
      style:top="{spot.top}px"
      style:left="{spot.left}px"
      style:width="{spot.width}px"
      style:height="{spot.height}px"
    ></div>
  {/if}

  <div
    class="card panel"
    class:centred={!cardPos}
    style:top={cardPos ? `${cardPos.top}px` : null}
    style:left={cardPos ? `${cardPos.left}px` : null}
    role="dialog"
    aria-modal="true"
    aria-labelledby="tour-title"
    bind:this={card}
  >
    <div class="row between">
      <h2 id="tour-title">{step.title}</h2>
      <span class="count">{tour.step + 1} / {STEPS.length}</span>
    </div>
    <p>{step.intro}</p>
    {#if step.points}
      <ul>
        {#each step.points as [term, text] (term)}
          <li><b>{term}</b>: {text}</li>
        {/each}
      </ul>
    {/if}
    {#if step.support}
      <div class="support">
        {#each Object.entries(LINKS) as [key, link] (key)}
          <a class="btn" href={link.href} target="_blank" rel="noopener noreferrer" title={link.label}>
            <SocialIcon name={key} size={16} />
            {link.handle}
          </a>
        {/each}
      </div>
    {/if}
    {#if step.outro}
      <p>{step.outro}</p>
    {/if}
    <div class="row between actions">
      <button type="button" class="skip" onclick={closeTour}>{last ? 'Close' : 'Skip guide'}</button>
      <div class="row">
        {#if tour.step > 0}
          <button type="button" onclick={back}>Back</button>
        {/if}
        <button type="button" class="primary" bind:this={nextBtn} onclick={next}>
          {last ? 'Start creating' : tour.step === 0 ? 'Start the guide' : 'Next'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .blocker {
    position: fixed;
    inset: 0;
    z-index: 1000;
  }

  .blocker.dim {
    background: rgba(0, 0, 0, 0.6);
  }

  /* the highlighted area: a frame whose huge shadow dims everything around it */
  .spot {
    position: fixed;
    z-index: 1001;
    border: 2px solid var(--cta);
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
    pointer-events: none;
    transition:
      top 0.25s,
      left 0.25s,
      width 0.25s,
      height 0.25s;
  }

  .card {
    position: fixed;
    z-index: 1002;
    width: min(380px, calc(100vw - 32px));
    background: var(--bg);
    border: 2px solid var(--ink);
    gap: 10px;
    font-size: 13px;
  }

  .card.centred {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .count {
    font-family: var(--font-mono);
    font-size: 11px;
  }

  p,
  ul {
    margin: 0;
  }

  ul {
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .support {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  /* the author's links: framed in yellow so they stand out on the first card */
  .support a {
    text-decoration: none;
    font-weight: 700;
    border: 2px solid var(--cta);
  }

  .actions {
    padding-top: 6px;
    border-top: 1px solid var(--ink);
  }

  .skip {
    border-color: transparent;
    text-decoration: underline;
  }

  @media (prefers-reduced-motion: reduce) {
    .spot {
      transition: none;
    }
  }
</style>
