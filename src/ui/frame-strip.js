/**
 * The strip of frame thumbnails: reorder, remove, reverse, delete all.
 */
import { state } from '../state.js';
import { framesChanged } from '../frames.js';
import { $ } from '../lib/dom.js';
import { createCanvas, drawContain } from '../lib/canvas.js';

const THUMB_W = 108;
const THUMB_H = 80;
const CLEAR_LABEL = 'Delete all frames';

function actionButton(text, label, disabled, onClick) {
  const b = Object.assign(document.createElement('button'), { type: 'button', textContent: text, disabled });
  b.setAttribute('aria-label', label);
  b.addEventListener('click', onClick);
  return b;
}

function move(i, delta) {
  const [frame] = state.frames.splice(i, 1);
  state.frames.splice(i + delta, 0, frame);
  framesChanged();
}

export function renderStrip() {
  const ul = $('frameList');
  ul.replaceChildren();
  const last = state.frames.length - 1;
  state.frames.forEach((frame, i) => {
    const li = document.createElement('li');
    const idx = Object.assign(document.createElement('span'), { className: 'idx', textContent: i + 1 });
    const thumb = createCanvas(THUMB_W, THUMB_H);
    const g = thumb.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, THUMB_W, THUMB_H);
    drawContain(g, frame.src, THUMB_W, THUMB_H);
    const name = Object.assign(document.createElement('span'), {
      className: 'name',
      textContent: frame.name,
      title: frame.name,
    });
    const actions = Object.assign(document.createElement('span'), { className: 'acts' });
    actions.append(
      actionButton('←', `Move frame ${i + 1} left`, i === 0, () => move(i, -1)),
      actionButton('→', `Move frame ${i + 1} right`, i === last, () => move(i, 1)),
      actionButton('✕', `Remove frame ${i + 1}`, false, () => {
        state.frames.splice(i, 1);
        framesChanged();
      }),
    );
    li.append(idx, thumb, name, actions);
    ul.append(li);
  });

  $('clearBtn').disabled = !state.frames.length;
  $('reverseBtn').disabled = state.frames.length < 2;
  if (!state.frames.length) {
    const li = Object.assign(document.createElement('li'), {
      className: 'empty',
      textContent: 'No frames yet: load images, a GIF or type some text.',
    });
    ul.append(li);
  }
}

export function initFrameStrip() {
  $('reverseBtn').addEventListener('click', () => {
    state.frames.reverse();
    framesChanged();
  });

  // two-step delete: the first click arms the button, a second click within 3 s clears the frames
  const clearBtn = $('clearBtn');
  let armed = null;
  const disarm = () => {
    clearTimeout(armed);
    armed = null;
    clearBtn.textContent = CLEAR_LABEL;
    clearBtn.classList.remove('primary');
  };
  clearBtn.addEventListener('click', () => {
    if (!armed) {
      clearBtn.textContent = 'Click again to delete';
      clearBtn.classList.add('primary');
      armed = setTimeout(disarm, 3000);
      return;
    }
    disarm();
    state.frames = [];
    state.offset = 0;
    state.angle = 0;
    framesChanged();
  });
}
