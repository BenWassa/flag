import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  parentRoute,
  parseRoutePath,
  routeTitle,
  serializeRoutePath,
  stableRoute,
} from '../dist/routing/routes.js';

function route(path) {
  const parsed = parseRoutePath(path);
  assert.ok(parsed, `Expected route to parse: ${path}`);
  return parsed;
}

const flags = route('/flags');
const flagsAfrica = route('/flags/africa');
const flagsWest = route('/flags/africa/west-africa');
const locationsWest = route('/locations/africa/west-africa');
const locationsTest = route('/locations/africa/west-africa/test');

assert.equal(serializeRoutePath(flags), '/flags');
assert.equal(serializeRoutePath(flagsAfrica), '/flags/africa');
assert.equal(serializeRoutePath(flagsWest), '/flags/africa/west-africa');
assert.equal(serializeRoutePath(locationsWest), '/locations/africa/west-africa');
assert.equal(serializeRoutePath(locationsTest), '/locations/africa/west-africa/test');

assert.equal(serializeRoutePath(parentRoute(flagsWest)), '/flags/africa');
assert.equal(serializeRoutePath(parentRoute(flagsAfrica)), '/flags');
assert.equal(serializeRoutePath(parentRoute(flags)), '/');
assert.equal(serializeRoutePath(parentRoute(locationsTest)), '/locations/africa/west-africa');
assert.equal(serializeRoutePath(stableRoute(locationsTest)), '/locations/africa/west-africa');

assert.equal(routeTitle(flagsWest), 'West Africa flags · Flag Atlas');
assert.equal(routeTitle(locationsTest), 'Test West Africa locations · Flag Atlas');

assert.equal(parseRoutePath('/flags/asia/west-africa'), null, 'Region must belong to its route continent.');
assert.equal(parseRoutePath('/locations/africa/not-a-region'), null, 'Unknown region must be rejected.');
assert.equal(parseRoutePath('/flags/africa/west-africa/unknown'), null, 'Unknown activity must be rejected.');
assert.equal(parseRoutePath('/locations/learn'), null, 'World activity is not addressable for locations.');

assert.equal(serializeRoutePath(route('/outlines/africa/west-africa')), '/outlines/africa/west-africa');
assert.equal(serializeRoutePath(route('/neighbors/africa')), '/neighbors/africa');

const app = await readFile('dist/app.js', 'utf8');
assert.equal(app.includes('viewStack'), false, 'Legacy in-memory viewStack must not remain authoritative.');
assert.equal(app.includes('historyIndex'), false, 'Legacy numeric history index must be removed.');
assert.ok(app.includes('createHashRouter'), 'Application must compose through the hash router adapter.');
assert.ok(app.includes('stableRoute'), 'Active-round refresh fallback must use the stable route.');

const home = await readFile('dist/ui/views/home.js', 'utf8');
assert.ok(home.includes('Learning domains'), 'Home must present the domain hierarchy.');
assert.ok(home.includes('Flags') && home.includes('Locations'), 'Current domains must be peers on Home.');
assert.ok(home.includes('Outlines') && home.includes('Neighbors'), 'Planned domains must have explicit future homes.');

const flagScope = await readFile('dist/ui/views/scope.js', 'utf8');
const mapScope = await readFile('dist/ui/views/map-home.js', 'utf8');
assert.ok(flagScope.includes('data-action="route-parent"'), 'Flag scope Back must use conceptual parent routing.');
assert.ok(mapScope.includes('data-action="route-parent"'), 'Location scope Back must use conceptual parent routing.');

const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'));
assert.equal(manifest.start_url, './#/', 'Installed PWA must start at the canonical hash Home route.');

const serviceWorker = await readFile('dist/sw.js', 'utf8');
assert.ok(serviceWorker.includes("flag-atlas-v8"), 'Routing release must invalidate the old app-shell cache.');
assert.ok(serviceWorker.includes("request.mode === 'navigate'"), 'Offline navigation must retain index shell fallback.');

console.log('Routing verification passed: typed routes, hierarchy, invalid-route handling, refresh fallback contract, IA, and PWA shell.');
