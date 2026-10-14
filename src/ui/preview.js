/**
 * The live preview: base image with the grid sliding (or turning) over it, the toolbar,
 * and dragging the grid by hand.
 */
import { state, frameCount, wedgeAngle } from '../state.js';
import { baseCanvas, previewGrid } from '../render.js';
import { $, setPressed } from '../lib/dom.js';
import { on, RENDERED } from '../lib/events.js';

const view = /** @type {HTMLCanvasElement} */ ($('view'));
const ctx = view.getContext('2d');
const VIEW_TOGGLE = [
  ['viewGrid', true],
  ['viewBase', false],
];

let dragging = false;
let dragStart = 0;
let dragFrom = 0;
let last = performance.now();

const toDegrees = (rad) => ((rad * 180) / Math.PI).toFixed(2);
const wrap = (v, period) => ((v % period) + period) % period;

function drawEmpty(N) {
  ctx.fillStyle = '#000';
  ctx.font = `${Math.round(Math.min(view.width, view.height) / 28)}px Roboto, Arial, sans-serif`;
  ctx.textAlign = 'center';
  const message = state.frames.length
    ? 'At least 2 frames are needed'
    : 'Load images, a GIF or type some text';
  ctx.fillText(message, view.width / 2, view.height / 2);
  $('readout').textContent = '';
  return N;
}

function drawRadial(N) {
  const alpha = wedgeAngle();
  const period = N * alpha;
  const m = wrap(state.angle, period);
  if (state.showGrid) {
    ctx.save();
    ctx.translate(view.width / 2, view.height / 2);
    ctx.rotate(m);
    ctx.drawImage(previewGrid, -previewGrid.width / 2, -previewGrid.height / 2);
    ctx.restore();
  }
  const visible = Math.floor(m / alpha + 1e-9) % N;
  $('readout').innerHTML =
    `Visible frame <b>${visible + 1}</b> / ${N} · grid rotation <b>${toDegrees(m)}°</b> ` +
    `over a period of ${toDegrees(period)}°`;
}

function drawLinear(N) {
  const P = N * state.w;
  const m = wrap(state.offset, P);
  if (state.showGrid) {
    if (state.vertical) ctx.drawImage(previewGrid, m - P, 0);
    else ctx.drawImage(previewGrid, 0, m - P);
  }
  const visible = Math.floor(m / state.w) % N;
  $('readout').innerHTML =
    `Visible frame <b>${visible + 1}</b> / ${N} · grid offset <b>${m.toFixed(1).padStart(5, ' ')}</b> px ` +
    `over a period of ${P} px`;
}

function tick(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const N = frameCount();
  if (state.playing && !dragging && N >= 2) {
    if (state.radial) state.angle += ((state.rspeed * Math.PI) / 180) * dt;
    else state.offset += state.speed * dt;
  }
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, view.width, view.height);
  if (N < 2) drawEmpty(N);
  else {
    ctx.drawImage(baseCanvas, 0, 0);
    if (state.radial) drawRadial(N);
    else drawLinear(N);
  }
  requestAnimationFrame(tick);
}

export const syncPlay = () => {
  $('playBtn').textContent = state.playing ? 'Pause' : 'Play';
};

/** The speed slider works in px/s for linear grids and °/s for the circular one. */
export function syncSpeed() {
  const slider = $('speed');
  if (state.radial) {
    Object.assign(slider, { min: 1, max: 60, value: state.rspeed });
    $('speedVal').textContent = `${state.rspeed} °/s`;
  } else {
    Object.assign(slider, { min: 2, max: 200, value: state.speed });
    $('speedVal').textContent = `${state.speed} px/s`;
  }
}

export function applyZoom() {
  const zoom = $('zoom').value;
  $('stage').classList.toggle('fit', zoom === 'fit');
  view.style.width = zoom === 'fit' ? '' : `${state.outW * +zoom}px`;
  view.style.imageRendering = zoom === 'fit' ? '' : 'pixelated';
}

export const syncViewToggle = () => setPressed(VIEW_TOGGLE, state.showGrid);

function nextFrame() {
  state.playing = false;
  syncPlay();
  if (state.radial) {
    const a = wedgeAngle();
    state.angle = (Math.floor(state.angle / a + 1e-6) + 1) * a;
  } else {
    state.offset = (Math.floor(state.offset / state.w + 1e-6) + 1) * state.w;
  }
}

function pointerAngle(e) {
  const r = view.getBoundingClientRect();
  return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
}

function initDrag() {
  view.addEventListener('pointerdown', (e) => {
    dragging = true;
    view.setPointerCapture(e.pointerId);
    if (state.radial) {
      dragStart = pointerAngle(e);
      dragFrom = state.angle;
    } else {
      dragStart = state.vertical ? e.clientX : e.clientY;
      dragFrom = state.offset;
    }
  });
  view.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    if (state.radial) {
      state.angle = dragFrom + pointerAngle(e) - dragStart;
      return;
    }
    const r = view.getBoundingClientRect();
    const scale = state.vertical ? view.width / r.width : view.height / r.height;
    state.offset = dragFrom + ((state.vertical ? e.clientX : e.clientY) - dragStart) * scale;
  });
  const end = () => (dragging = false);
  view.addEventListener('pointerup', end);
  view.addEventListener('pointercancel', end);
}

export function initPreview() {
  $('playBtn').addEventListener('click', () => {
    state.playing = !state.playing;
    syncPlay();
  });
  $('stepBtn').addEventListener('click', nextFrame);
  $('speed').addEventListener('input', (e) => {
    if (state.radial) state.rspeed = +e.target.value;
    else state.speed = +e.target.value;
    syncSpeed();
  });
  for (const [id, show] of VIEW_TOGGLE) {
    $(id).addEventListener('click', () => {
      state.showGrid = show;
      syncViewToggle();
    });
  }
  $('zoom').addEventListener('change', applyZoom);
  initDrag();

  // the visible canvas follows the output size
  on(RENDERED, () => {
    if (view.width !== baseCanvas.width) view.width = baseCanvas.width;
    if (view.height !== baseCanvas.height) view.height = baseCanvas.height;
  });

  syncPlay();
  requestAnimationFrame(tick);
}
