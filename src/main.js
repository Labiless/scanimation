/**
 * Scanimation Studio entry point: global styles, then the Svelte app.
 */
import { mount } from 'svelte';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import App from './App.svelte';

mount(App, { target: document.getElementById('app') });
