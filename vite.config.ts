import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const root = process.cwd();

function resolveAtlasBuildIdentity(): string {
  for (const candidate of [process.env.ATLAS_BUILD_SHA, process.env.GITHUB_SHA]) {
    if (!candidate) continue;
    if (!/^[0-9a-f]{40}$/i.test(candidate)) throw new Error('Atlas build identity must be a full 40-character Git commit SHA.');
    return candidate.toLowerCase();
  }

  try {
    const candidate = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
    if (/^[0-9a-f]{40}$/i.test(candidate)) return candidate.toLowerCase();
  } catch {
    // Source archives without Git metadata remain buildable for development.
  }
  return 'development';
}

const atlasBuildIdentity = resolveAtlasBuildIdentity();

function atlasBuildIdentityMetadata(): Plugin {
  return {
    name: 'atlas-build-identity',
    transformIndexHtml(html) {
      return html.replace('</head>', `  <meta name="atlas-build" content="${atlasBuildIdentity}">\n</head>`);
    },
  };
}

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

export default defineConfig(({ command }) => ({
  // GitHub Pages serves Atlas below /flag/. Relative build URLs keep the same
  // artifact deployable there and in production-artifact smoke tests without
  // coupling the router to a hosting path.
  base: './',
  publicDir: 'public',
  define: {
    __ATLAS_DEVELOPMENT_SANDBOX__: JSON.stringify(command === 'serve'),
    __ATLAS_BUILD_IDENTITY__: JSON.stringify(atlasBuildIdentity),
  },
  plugins: [
    resolveTypeScriptForJsSpecifiers(),
    atlasBuildIdentityMetadata(),
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
          // Issue #119: the spatial stack is the shell on this candidate, so the
          // renderer and the world LOD are precached like `app.js`. Continent
          // detail stays lazy and runtime-cached, exactly as the projected 2D
          // continent assets already do.
          'assets/stage-controller-*.js',
          'assets/world-*.js',
        ],
        globIgnores: [
          'assets/africa-*.js',
          'assets/south-america-*.js',
          'assets/europe-*.js',
          'assets/asia-*.js',
          'assets/north-america-*.js',
          'assets/oceania-*.js',
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
        spatial: resolve(root, 'src/styles/spatial.css'),
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
}));
