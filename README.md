# Scanimation Studio

Make scanimations (barrier-grid animations) from images, an animated GIF or text, preview them live,
export the base image and the grid as PNGs at their real print size, and lay saved animations out on
A4 sheets as two matching PDFs (images, and grids to print on acetate).

## Getting started

Requires Node.js 20 or later.

```sh
npm install
npm run dev        # development server with live reload, http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
npm run lint       # ESLint
npm run format     # Prettier
```

The app uses ES modules, so open it through `npm run dev` (or any static server serving `dist/`),
not by double-clicking `index.html`: browsers block modules loaded from `file://`.

`npm run build:artifact` also writes `dist/artifact.html`, the same page without the document
wrapper, for publishing as a claude.ai artifact together with `dist/assets/`.

## Project structure

```
index.html                 page markup; loads src/main.js
public/favicon.svg
src/
  main.js                  entry point: imports the styles and initialises every module
  state.js                 application state, defaults and derived values (frame order, px↔mm…)
  frames.js                replace the frame list and announce the change
  render.js                rebuilds the interlaced image and the preview grid from the state
  session.js               keeps the work in progress across reloads (IndexedDB)
  core/                    pure image work, no DOM
    interlace.js           colour treatment, interlacing, linear and circular grids
    png-dpi.js             writes the print resolution into PNG files
    info.js                the settings line printed above each piece
  sources/                 where frames come from
    images.js              image files
    gif.js                 animated GIF decoding and frame sampling
    text.js                text animations (3D turns, spin, letters appearing)
  ui/                      one module per panel of the editor
    frame-strip.js         thumbnails: reorder, remove, reverse, delete all
    source-panel.js        Images / Animated GIF / Text tabs, image loading
    gif-panel.js           GIF link or file, frame count and range
    text-panel.js          text and animation settings
    grid-controls.js       motion, strip width or rays, aperture, loop, reset
    format-controls.js     aspect ratio, dpi, size in px or mm, figure size
    colour-controls.js     silhouette, posterize, original; invert, fill, blur
    preview.js             live preview, toolbar, dragging the grid
    measurements.js        strip, slit, bar, period, brightness, format
    export-panel.js        PNG downloads
    editing.js             which saved animation is being updated
    sync.js                refreshes every control after the state is replaced
  print/                   Print on A4
    library.js             saved animations: save, update, edit, copies, delete
    layout.js              shelf packing on A4 sheets
    sheets.js              sheet previews and the PDFs (jsPDF, loaded on demand)
    migrate.js             adds the frame count to animations saved by early versions
  lib/                     small generic helpers
    dom.js                 $, segmented toggles, debounce, drop zones
    events.js              publish/subscribe bus between modules
    canvas.js              canvas creation, PNG encoding, fit-inside drawing
    storage.js             IndexedDB stores (saved animations, session)
    download.js            file downloads (viewer save dialog or plain link)
  styles/
    tokens.css             colours and fonts, light and dark
    base.css               reset, page frame, typography, form controls
    components.css         panels, layout helpers, buttons, toggles, drop zones
    editor.css             editor layout, frame strip, preview, measurements
    print.css              Print on A4 section
```

Modules talk through direct imports where the dependency is natural (a panel calls the renderer)
and through the event bus in `lib/events.js` where it would otherwise loop: `frames:changed`,
`render:done` and `session:dirty`.

## Printing

Exported PNGs carry their resolution, and the PDFs place every piece in millimetres, so print at
100% ("Actual size"), never "Fit to page". Print the grid on transparent acetate.
