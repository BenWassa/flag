import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const root = process.cwd();

const stableEntries = new Map<string, string>([
  ['app', 'app.js'],
  ['map-viewport', 'map-viewport.js'],
  ['neighbor-map-runtime', 'neighbor-map-runtime.js'],
]);

/**
 * Atlas intentionally keeps explicit `.js` specifiers in TypeScript source so
 * the same modules remain valid when emitted for the plain-Node invariant
 * suite. TypeScript's bundler resolver understands those specifiers; this
 * small Vite adapter mirrors that contract rather than forcing a repository-
 * wide import rewrite during the build-tool phase.
 */
function resolveTypeScriptForJsSpecifiers(): Plugin {
  return {
    name: 'atlas-resolve-typescript-js-specifiers',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || !source.startsWith('.') || !source.endsWith('.js')) return null;

      const stem = source.slice(0, -3);
      for (const extension of ['.ts', '.tsx']) {
        const candidate = resolve(dirname(importer), `${stem}${extension}`);
        if (existsSync(candidate)) return candidate;
      }
      return null;
    },
  };
}

export default defineConfig({
  // GitHub Pages serves Atlas below /flag/. Relative build URLs keep the same
  // artifact deployable there and in production-artifact smoke tests without
  // coupling the router to a hosting path.
  base: './',
  publicDir: 'public',
  plugins: [
    resolveTypeScriptForJsSpecifiers(),
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: false,
      manifest: false,
      injectManifest: {
        globPatterns: [
          'index.html',
          'app.js',
          'map-viewport.js',
          'neighbor-map-runtime.js',
          '*.css',
          'manifest.webmanifest',
          'icons/**/*.{svg,png}',
          'assets/index-*.js',
        ],
        globIgnores: [
          'assets/africa-*.js',
          'assets/south-america-*.js',
          'assets/europe-*.js',
          'assets/asia-*.js',
        ],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    manifest: true,
    // CSS is deliberately not optimised in the build-tool phase. Existing
    // stylesheets are a product/design compatibility boundary and several
    // invariant checks intentionally assert their semantic token text. CSS
    // rationalisation belongs to Phase 10 after React owns the markup.
    cssMinify: false,
    rollupOptions: {
      input: {
        index: resolve(root, 'index.html'),
        app: resolve(root, 'src/main.tsx'),
        'map-viewport': resolve(root, 'src/map-viewport.ts'),
        'neighbor-map-runtime': resolve(root, 'src/neighbor-map-runtime.ts'),
        styles: resolve(root, 'src/styles/styles.css'),
        map: resolve(root, 'src/styles/map.css'),
        'map-cartography': resolve(root, 'src/styles/map-cartography.css'),
        outline: resolve(root, 'src/styles/outline.css'),
        neighbors: resolve(root, 'src/styles/neighbors.css'),
        'atlas-theme': resolve(root, 'src/styles/atlas-theme.css'),
      },
      output: {
        entryFileNames(chunk) {
          return stableEntries.get(chunk.name) ?? 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames(asset) {
          const originalName = asset.names?.[0] ?? asset.name ?? '';
          if (originalName.endsWith('.css')) return '[name][extname]';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
