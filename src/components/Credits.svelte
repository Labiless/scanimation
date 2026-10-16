<!-- Author credits, top right: "Made by" with links to Instagram, the website and GitHub. -->
<script>
  const AUTHOR = 'Labiles';
  const LINKS = [
    {
      label: 'Instagram',
      handle: '@_labiles',
      href: 'https://www.instagram.com/_labiles/',
      icon: 'instagram',
    },
    { label: 'Website', handle: 'alessandromiele.me', href: 'https://www.alessandromiele.me', icon: 'web' },
    { label: 'GitHub', handle: 'Labiless', href: 'https://github.com/Labiless', icon: 'github' },
  ];
</script>

<nav class="credits" aria-label="Made by {AUTHOR}">
  <span class="made">Made by <strong>{AUTHOR}</strong></span>
  <ul>
    {#each LINKS as link (link.href)}
      <li>
        <a href={link.href} target="_blank" rel="noopener noreferrer" title="{link.label}: {link.handle}">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            {#if link.icon === 'instagram'}
              <rect
                x="2.5"
                y="2.5"
                width="19"
                height="19"
                rx="5.5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />
              <circle cx="12" cy="12" r="4.3" fill="none" stroke="currentColor" stroke-width="2" />
              <circle cx="17.6" cy="6.4" r="1.3" fill="currentColor" />
            {:else if link.icon === 'web'}
              <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2" />
              <path
                d="M2.5 12h19M12 2.5c2.6 2.7 3.9 5.9 3.9 9.5s-1.3 6.8-3.9 9.5c-2.6-2.7-3.9-5.9-3.9-9.5s1.3-6.8 3.9-9.5z"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />
            {:else}
              <path
                fill="currentColor"
                transform="scale(1.5)"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
              />
            {/if}
          </svg>
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

  svg {
    flex: none;
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
