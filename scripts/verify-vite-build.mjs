import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = 'dist';
const CSS_FILES = ['styles.css', 'map.css', 'map-cartography.css', 'outline.css', 'neighbors.css', 'atlas-theme.css'];

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(path));
    else result.push(path);
  }
  return result;
}

for (const file of [
  'index.html',
  'app.js',
  'map-viewport.js',
  'neighbor-map-runtime.js',
  ...CSS_FILES,
  'manifest.webmanifest',
  'sw.js',
  'icons/app-icon.svg',
  'icons/app-icon-192.png',
  'icons/app-icon-512.png',
  'icons/app-icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  '.vite/manifest.json',
]) {
  assert.equal(await exists(join(DIST, file)), true, `Vite production artifact contains ${file}.`);
}

for (const file of CSS_FILES) {
  const source = await readFile(join('src/styles', file));
  const built = await readFile(join(DIST, file));
  assert.deepEqual(built, source, `${file} remains byte-identical during the build-tool migration.`);
}

const indexHtml = await readFile(join(DIST, 'index.html'), 'utf8');
assert.equal(indexHtml.includes('/src/'), false, 'Production HTML contains no source-module URLs.');
assert.equal(indexHtml.includes('src="/'), false, 'Production HTML does not assume a domain-root script path.');
assert.equal(indexHtml.includes('href="/'), false, 'Production HTML does not assume a domain-root asset path.');
for (const file of ['app.js', 'map-viewport.js', 'neighbor-map-runtime.js']) {
  assert.match(indexHtml, new RegExp(`(?:\\./)?${file.replace('.', '\\.')}`), `Production HTML references ${file}.`);
}
for (const file of CSS_FILES) {
  assert.match(indexHtml, new RegExp(`(?:\\./)?${file.replace('.', '\\.')}`), `Production HTML references ${file}.`);
}

const manifest = JSON.parse(await readFile(join(DIST, '.vite/manifest.json'), 'utf8'));
for (const source of ['src/main.tsx', 'src/map-viewport.ts', 'src/neighbor-map-runtime.ts']) {
  assert.ok(manifest[source], `Vite manifest contains browser entry ${source}.`);
  assert.equal(manifest[source].isEntry, true, `${source} remains a production entry.`);
}
assert.equal(manifest['src/main.tsx'].file, 'app.js', 'React application entry keeps a stable service-worker filename.');
assert.equal(manifest['src/map-viewport.ts'].file, 'map-viewport.js', 'Map viewport entry keeps its stable Phase 2 service-worker filename.');
assert.equal(manifest['src/neighbor-map-runtime.ts'].file, 'neighbor-map-runtime.js', 'Neighbour map runtime keeps its stable Phase 2 service-worker filename.');

const files = await walk(DIST);
const relativeFiles = files.map((file) => relative(DIST, file).replaceAll('\\', '/'));
for (const directory of ['data', 'domain', 'infrastructure', 'react', 'routing', 'state', 'ui']) {
  assert.equal(
    relativeFiles.some((file) => file.startsWith(`${directory}/`)),
    false,
    `Deployable output contains no verifier-only ${directory}/ tree.`,
  );
}
assert.equal(
  relativeFiles.some((file) => file.startsWith('ui/views/')),
  false,
  'Deployable output contains no legacy string-renderer fixtures.',
);
for (const continent of ['africa', 'south-america', 'europe', 'asia']) {
  const pattern = new RegExp(`^assets/${continent}-[^/]+\\.js$`);
  assert.ok(relativeFiles.some((file) => pattern.test(file)), `Vite keeps ${continent} geography in a lazy browser chunk.`);
}

const appBytes = (await stat(join(DIST, 'app.js'))).size;
const lazyChunkRows = [];
for (const continent of ['africa', 'south-america', 'europe', 'asia']) {
  const file = relativeFiles.find((candidate) => new RegExp(`^assets/${continent}-[^/]+\\.js$`).test(candidate));
  assert.ok(file);
  lazyChunkRows.push(`${file} ${(await stat(join(DIST, file))).size} B`);
}

const sw = await readFile(join(DIST, 'sw.js'), 'utf8');
assert.ok(sw.includes('flag-atlas-v30'), 'Build-aware service worker uses the current React/Vite cache generation.');
assert.equal(sw.includes('flag-atlas-spatial-preview-v1'), false, 'Classic Atlas service worker does not reuse the Spatial preview cache namespace.');
assert.ok(sw.includes('index.html'), 'Injected precache includes the offline navigation shell.');
for (const continent of ['africa', 'south-america', 'europe', 'asia']) {
  assert.equal(new RegExp(`${continent}-[A-Za-z0-9_-]+\\.js`).test(sw), false, `${continent} geography remains runtime-cached rather than precached.`);
}

console.log(`Verified Vite/Workbox-only production artifact: ${relativeFiles.length} files; app.js ${appBytes} B.`);
for (const row of lazyChunkRows) console.log(`  lazy ${row}`);
console.log('Vite build verification passed.');
