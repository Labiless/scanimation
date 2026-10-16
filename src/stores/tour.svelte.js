/**
 * The step-by-step guide: shown once on the first visit, reopened from the header's Guide button.
 * Whether it was seen is a per-browser convenience, so it lives in localStorage.
 */
const SEEN_KEY = 'scanimation:guide-seen';

export const tour = $state({ open: false, step: 0 });

/** True on the first visit. If storage is blocked, don't insist: the Guide button is always there. */
export function isFirstVisit() {
  try {
    return !localStorage.getItem(SEEN_KEY);
  } catch {
    return false;
  }
}

export function startTour() {
  tour.step = 0;
  tour.open = true;
}

export function closeTour() {
  tour.open = false;
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* storage unavailable: the guide may show again next time */
  }
}
