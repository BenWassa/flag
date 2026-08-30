import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

const files = await walk(DIST);
const relativeFiles = files.map((file) => relative(DIST, file).replaceAll('\\', '/')).sort();
const required = [
  'index.html',
  'manifest.webmanifest',
  'app.js',
  'map-viewport.js',
  'neighbor-map-runtime.js',
  'styles.css',
  'map.css',
  'map-cartography.css',
  'outline.css',
  'neighbors.css',
  'atlas-theme.css',
  'spatial.css',
  'sw.js',
];
for (const file of required) assert.ok(relativeFiles.includes(file), `Production artifact includes ${file}.`);

const index = await readFile(join(DIST, 'index.html'), 'utf8');
assert.match(index, /app\.js/, 'Built HTML points at stable app.js.');
assert.match(index, /styles\.css/, 'Built HTML points at generated styles.css.');
assert.equal(index.includes('/src/'), false, 'Built HTML contains no source-tree module/style references.');
assert.equal(index.includes('legacy.js'), false, 'Built HTML does not load the retired legacy bundle.');
assert.equal(index.includes('data-legacy-ui'), false, 'Built HTML contains no legacy UI marker.');

const app = await readFile(join(DIST, 'app.js'), 'utf8');
assert.equal(app.includes('renderLegacy'), false, 'Production app bundle does not contain the retired legacy renderer.');
assert.equal(app.includes('src/ui/views'), false, 'Production app bundle does not reference legacy view modules.');
assert.ok(app.includes('createRoot'), 'Production app bundle contains the React root.');

assert.equal(
  relativeFiles.some((file) => file === 'legacy.js' || file.startsWith('legacy-')),
  false,
  'Deployable output contains no legacy application bundle.',
);
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
assert.ok(sw.includes('index.html'), 'Injected precache includes the offline navigation shell.');
for (const continent of ['africa', 'south-america', 'europe', 'asia']) {
  assert.equal(new RegExp(`${continent}-[A-Za-z0-9_-]+\\.js`).test(sw), false, `${continent} geography remains runtime-cached rather than precached.`);
}

console.log(`Verified Vite/Workbox-only production artifact: ${relativeFiles.length} files; app.js ${appBytes} B.`);
for (const row of lazyChunkRows) console.log(`  lazy ${row}`);
console.log('Vite build verification passed.');
