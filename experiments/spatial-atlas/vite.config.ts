import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

/**
 * Issue #119 prototype build — EXPERIMENT ONLY.
 *
 * Exists to measure what the spatial prototype actually costs to ship, so the
 * reserved F2 renderer decision can be made against a real number rather than
 * the stale historical figures in the planning docs. This never emits into the
 * production `dist/`.
 */
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  build: {
    outDir: fileURLToPath(new URL('../../.experiments-dist/spatial-atlas/', import.meta.url)),
    emptyOutDir: true,
    reportCompressedSize: true,
  },
});
