/**
 * Scanimation Studio entry point: global styles, then the Svelte app.
 */
import { mount } from 'svelte';
import { inject } from '@vercel/analytics';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/about.css';
import App from './App.svelte';

mount(App, { target: document.getElementById('app') });

// Vercel Web Analytics: page views on the deployed site; in `npm run dev` it only logs to the console
inject({ mode: import.meta.env.DEV ? 'development' : 'production' });
