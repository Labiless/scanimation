import { MediaQuery } from 'svelte/reactivity';

/** Phone-sized screens; matches the 640 px breakpoint used in the component styles. */
export const phone = new MediaQuery('max-width: 640px');
