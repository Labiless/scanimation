/**
 * Scanimation Studio entry point: styles, then every module wired up in dependency order.
 */
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/editor.css';
import './styles/print.css';

import { rebuild } from './render.js';
import { on, FRAMES_CHANGED } from './lib/events.js';
import { initFrameStrip, renderStrip } from './ui/frame-strip.js';
import { initSourcePanel } from './ui/source-panel.js';
import { initGifPanel } from './ui/gif-panel.js';
import { initTextPanel } from './ui/text-panel.js';
import { initGridControls } from './ui/grid-controls.js';
import { initFormatControls } from './ui/format-controls.js';
import { initColourControls } from './ui/colour-controls.js';
import { initPreview } from './ui/preview.js';
import { initMeasurements } from './ui/measurements.js';
import { initExportPanel } from './ui/export-panel.js';
import { initSheets } from './print/sheets.js';
import { initLibrary } from './print/library.js';
import { initSession } from './session.js';

// a new frame list redraws the strip and re-renders the animation
on(FRAMES_CHANGED, renderStrip);
on(FRAMES_CHANGED, rebuild);

initFrameStrip();
initSourcePanel();
initGifPanel();
initTextPanel();
initGridControls();
initFormatControls();
initColourControls();
initPreview();
initMeasurements();
initExportPanel();
initSheets();
initLibrary();
initSession();
