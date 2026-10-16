<!-- Author credits, top right: "Made by" with links to Instagram, the website and GitHub. -->
<script>
  import { AUTHOR, LINKS } from '../lib/links.js';
  import { startTour } from '../stores/tour.svelte.js';
  import SocialIcon from './SocialIcon.svelte';
</script>

<nav class="credits" aria-label="Made by {AUTHOR}">
  <button type="button" class="guide" onclick={startTour}>? Guide</button>
  <span class="made">Made by <strong>{AUTHOR}</strong></span>
  <ul>
    {#each Object.entries(LINKS) as [icon, link] (icon)}
      <li>
        <a href={link.href} target="_blank" rel="noopener noreferrer" title="{link.label}: {link.handle}">
          <SocialIcon name={icon} />
          <span>{link.handle}</span>
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .credits {
    margin-left: auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
  }

  .made {
    font-size: 13px;
    font-weight: 500;
  }

  /* the name carries the same yellow as the panel titles */
  .made strong {
    font-weight: 700;
    color: var(--title-fg);
    background: var(--title-bg);
    padding: 1px 5px;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 9px;
    border: 1px solid var(--ink);
    color: var(--ink);
    font-size: 12px;
    font-weight: 500;
    text-decoration: none;
  }

  a:hover {
    background: var(--cta);
    border-color: var(--cta);
    color: #000;
  }

  a:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
  }

  .guide {
    font-weight: 700;
  }

  /* phones: a smaller row, aligned left under the title */
  @media (max-width: 640px) {
    .credits {
      margin-left: 0;
      width: 100%;
      gap: 6px 8px;
    }

    .made {
      font-size: 11px;
    }

    ul {
      gap: 4px;
    }

    a,
    .guide {
      padding: 3px 6px;
      font-size: 11px;
    }

    a :global(svg) {
      width: 14px;
      height: 14px;
    }
  }

  /* on narrow screens the icons alone are enough; the title still names each link */
  @media (max-width: 560px) {
    a span {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  }
</style>
