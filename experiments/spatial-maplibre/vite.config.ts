import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: resolve(process.cwd(), 'experiments/spatial-maplibre'),
  base: './',
  plugins: [react()],
  build: {
    outDir: resolve(process.cwd(), 'dist-spike-maplibre'),
    emptyOutDir: true,
    rollupOptions: { output: { chunkFileNames: 'assets/[name]-[hash].js', entryFileNames: 'assets/[name]-[hash].js' } },
  },
});
