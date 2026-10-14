import { defineConfig } from 'vite';

export default defineConfig({
  // relative asset paths, so the build works from any folder or host path
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
  },
});
