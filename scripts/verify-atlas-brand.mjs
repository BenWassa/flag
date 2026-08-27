import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseRoutePath, routeTitle } from '../.verify-dist/routing/routes.js';

const index = await readFile('dist/index.html', 'utf8');
const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'));
const app = await readFile('src/react/AtlasApp.tsx', 'utf8');
const appSource = await readFile('src/react/AtlasApp.tsx', 'utf8');
const serviceWorker = await readFile('dist/sw.js', 'utf8');

assert.match(index, /<title>Atlas<\/title>/, 'The initial browser title uses the learner-facing Atlas brand.');
assert.equal(index.includes('<title>Flag Atlas</title>'), false, 'Legacy branding is absent from initial document metadata.');
assert.equal(manifest.name, 'Atlas', 'Installed PWA name uses Atlas.');
assert.equal(manifest.short_name, 'Atlas', 'Installed PWA short name uses Atlas.');

const titleCases = [
  ['/', 'Atlas'],
  ['/flags', 'Flags · Atlas'],
  ['/neighbors', 'Neighbours · Atlas'],
  ['/flags/africa', 'Africa flags · Atlas'],
  ['/flags/africa/west-africa', 'West Africa flags · Atlas'],
  ['/locations/africa/west-africa/test', 'Play West Africa locations · Atlas'],
  ['/outlines/africa/west-africa/learn', 'Learn West Africa outlines · Atlas'],
  ['/neighbors/africa/west-africa/test', 'Play West Africa neighbours · Atlas'],
];

for (const [path, expected] of titleCases) {
  const route = parseRoutePath(path);
  assert.ok(route, `Brand verifier route parses: ${path}`);
  assert.equal(routeTitle(route), expected);
}

assert.equal(app.includes(' · Flag Atlas'), false, 'Built learner-facing document titles contain no legacy brand suffix.');
assert.equal(
  [...appSource.matchAll(/return `Round complete · \$\{store\.view\.result\.session\.scope\.label\} .* · Atlas`;/g)].length,
  4,
  'All four result-state document-title branches use the Atlas suffix.',
);

assert.ok(serviceWorker.includes('flag-atlas-v29'), 'The React/Vite app-shell cache version is asserted explicitly.');
assert.ok(serviceWorker.includes('manifest.webmanifest'), 'Updated install metadata remains in the offline shell.');

const storageSources = await Promise.all([
  '.verify-dist/infrastructure/storage.js',
  '.verify-dist/infrastructure/map-storage.js',
  '.verify-dist/infrastructure/outline-storage.js',
  '.verify-dist/infrastructure/neighbor-storage.js',
].map((path) => readFile(path, 'utf8')));
assert.ok(storageSources.every((source) => source.includes('flag-atlas:')), 'Legacy storage namespaces remain compatible.');

console.log('Atlas brand verification passed: UI titles, install metadata, result titles, cache invalidation, and stable storage compatibility.');
