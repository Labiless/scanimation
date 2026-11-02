import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const page = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [svelte()],
  // relative asset paths, so the build works from any folder or host path
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // the app, plus static content pages written for search engines and AI crawlers
      input: {
        main: page('./index.html'),
        guide: page('./diy-scanimation-guide/index.html'),
        kinegram: page('./what-is-a-kinegram/index.html'),
      },
    },
  },
});
