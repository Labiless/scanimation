# Scanimation Studio

Make scanimations (barrier-grid animations) from images, an animated GIF or text, preview them live,
export the base image and the grid as PNGs at their real print size, and lay saved animations out on
A4 sheets as two matching PDFs (images, and grids to print on acetate).

## Getting started

Requires Node.js 20 or later.

```sh
npm install
npm run dev        # development server with hot reload, http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
npm run lint       # ESLint (JavaScript and Svelte)
npm run format     # Prettier (JavaScript, Svelte, CSS, HTML)
```

Open the app through `npm run dev` (or any static server serving `dist/`), not by double-clicking
`index.html`: browsers block ES modules loaded from `file://`.

`npm run build:artifact` also writes `dist/artifact.html`, the same page without the document
wrapper, for publishing as a claude.ai artifact together with `dist/assets/`.

## Stack

- [Svelte 5](https://svelte.dev) with runes (`$state`, `$derived`, `$effect`) for the interface
- [Vite](https://vite.dev) for the development server and the build
- [jsPDF](https://github.com/parallax/jsPDF) for the A4 PDFs (loaded on demand) and
  [omggif](https://github.com/deanm/omggif) to decode GIFs
- ESLint and Prettier

## Project structure

```
index.html                 page shell: fonts, favicon, <div id="app">
src/
  main.js                  mounts the app and loads the global styles
  App.svelte               layout; re-renders the animation and keeps the session saved
  components/              one component per panel
    SourcePanel.svelte     Images / Animated GIF / Text tabs, image loading, delete and reverse
    GifSource.svelte       GIF link or file, frame count and range
    TextSource.svelte      text and animation settings
    FrameStrip.svelte      frame thumbnails: reorder, remove
    GridPanel.svelte       motion, strip width or rays, aperture, loop, reset
    FormatPanel.svelte     aspect ratio and dpi
    SizePanel.svelte       size in px or mm, figure size
    ColourPanel.svelte     silhouette, posterize, original; invert, fill, blur
    Preview.svelte         live preview, toolbar, dragging the grid
    ExportBar.svelte       under the preview: PNG downloads, save for printing, editing state
    Measurements.svelte    strip, slit, bar, period, brightness, format
    PrintSection.svelte    Print on A4: saved animations, sheet options and previews, PDFs
  stores/                  reactive state and the actions on it (.svelte.js = uses runes)
    state.svelte.js        settings, page options, frames and GIF, derived values (px↔mm…)
    render.svelte.js       rebuilds the interlaced image and the preview grid
    sources.svelte.js      loading images, GIFs and text; reordering and deleting frames
    format.js              size rules: clamping, aspect ratio, dpi changes
    library.svelte.js      saved animations: save, update, edit, copies, delete
    session.svelte.js      keeps the work in progress across reloads
  core/                    pure image work, no DOM or framework
    interlace.js           colour treatment, interlacing, linear and circular grids
    png-dpi.js             writes the print resolution into PNG files
    info.js                the settings line printed above each piece
  sources/                 frame sources, framework-free
    images.js · gif.js · text.js
  print/                   A4 layout and PDFs, framework-free
    layout.js              shelf packing on A4 sheets
    sheets.js              sheet previews and PDFs
    migrate.js             adds the frame count to animations saved by early versions
  lib/                     small generic helpers
    attachments.js         Svelte attachments: drop zone, thumbnail, blob image, canvas mount
    canvas.js              canvas creation, PNG encoding, fit-inside drawing
    storage.js             IndexedDB stores (saved animations, session)
    download.js            file downloads (viewer save dialog or plain link)
  styles/                  global styles; component styles live in each .svelte file
    tokens.css             colours and fonts, light and dark
    base.css               reset, headings, form controls
    components.css         panels, layout helpers, buttons, toggles, drop zones
```

The interface reads and writes `settings` directly (`bind:value`), and the app re-renders whatever
depends on it. Image processing, GIF and text rendering, A4 layout and PDF generation are plain
JavaScript modules that know nothing about Svelte.

## Search engines and AI assistants

- `index.html` carries the title, description, canonical URL, Open Graph/X cards and JSON-LD
  (`WebApplication`, `Person`, `FAQPage`), plus an About/FAQ section in plain HTML that crawlers read
  without running JavaScript. Keep the FAQ text and the JSON-LD in step.
- `public/` holds `robots.txt` (all crawlers allowed, AI ones listed explicitly), `sitemap.xml`
  (update `lastmod` when the content changes), `llms.txt` (summary for AI assistants, llmstxt.org),
  `og-image.png`, icons and `site.webmanifest`.

## Printing

Exported PNGs carry their resolution, and the PDFs place every piece in millimetres, so print at
100% ("Actual size"), never "Fit to page". Print the grid on transparent acetate.
