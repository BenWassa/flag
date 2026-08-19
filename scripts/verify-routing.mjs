import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHashRouter } from '../dist/routing/router.js';
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

class FakeBrowserWindow {
  constructor(initialUrl) {
    this.entries = [new URL(initialUrl, 'https://example.test').href];
    this.index = 0;
    this.listeners = new Map();
    this.history = {
      pushState: (_state, _title, url) => {
        const next = new URL(url, this.location.href).href;
        this.entries.splice(this.index + 1);
        this.entries.push(next);
        this.index = this.entries.length - 1;
      },
      replaceState: (_state, _title, url) => {
        this.entries[this.index] = new URL(url, this.location.href).href;
      },
      back: () => this.move(-1),
      forward: () => this.move(1),
    };
  }

  get location() {
    return new URL(this.entries[this.index]);
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  move(delta) {
    const next = this.index + delta;
    if (next < 0 || next >= this.entries.length) return;
    this.index = next;
    this.dispatch('popstate');
    this.dispatch('hashchange');
  }

  dispatch(type) {
    for (const listener of this.listeners.get(type) ?? []) listener({ type });
  }
}

const flags = route('/flags');
const flagsAfrica = route('/flags/africa');
const flagsWest = route('/flags/africa/west-africa');
const locationsWest = route('/locations/africa/west-africa');
const locationsTest = route('/locations/africa/west-africa/test');
const outlinesWest = route('/outlines/africa/west-africa');
const outlinesLearn = route('/outlines/africa/west-africa/learn');
const neighborsWest = route('/neighbors/africa/west-africa');
const neighborsTest = route('/neighbors/africa/west-africa/test');

assert.equal(serializeRoutePath(flags), '/flags');
assert.equal(serializeRoutePath(flagsAfrica), '/flags/africa');
assert.equal(serializeRoutePath(flagsWest), '/flags/africa/west-africa');
assert.equal(serializeRoutePath(locationsWest), '/locations/africa/west-africa');
assert.equal(serializeRoutePath(locationsTest), '/locations/africa/west-africa/test');
assert.equal(serializeRoutePath(outlinesWest), '/outlines/africa/west-africa');
assert.equal(serializeRoutePath(outlinesLearn), '/outlines/africa/west-africa/learn');
assert.equal(serializeRoutePath(neighborsWest), '/neighbors/africa/west-africa');
assert.equal(serializeRoutePath(neighborsTest), '/neighbors/africa/west-africa/test');

assert.equal(serializeRoutePath(parentRoute(flagsWest)), '/flags/africa');
assert.equal(serializeRoutePath(parentRoute(flagsAfrica)), '/flags');
assert.equal(serializeRoutePath(parentRoute(flags)), '/');
assert.equal(serializeRoutePath(parentRoute(locationsTest)), '/locations/africa/west-africa');
assert.equal(serializeRoutePath(stableRoute(locationsTest)), '/locations/africa/west-africa');
assert.equal(serializeRoutePath(parentRoute(outlinesLearn)), '/outlines/africa/west-africa');
assert.equal(serializeRoutePath(parentRoute(outlinesWest)), '/outlines/africa');
assert.equal(serializeRoutePath(parentRoute(neighborsTest)), '/neighbors/africa/west-africa');
assert.equal(serializeRoutePath(parentRoute(neighborsWest)), '/neighbors/africa');

assert.equal(routeTitle(flagsWest), 'West Africa flags · Flag Atlas');
assert.equal(routeTitle(locationsTest), 'Test West Africa locations · Flag Atlas');
assert.equal(routeTitle(outlinesLearn), 'Learn West Africa outlines · Flag Atlas');
assert.equal(routeTitle(neighborsTest), 'Test West Africa neighbours · Flag Atlas');

assert.equal(parseRoutePath('/flags/asia/west-africa'), null, 'Region must belong to its route continent.');
assert.equal(parseRoutePath('/locations/africa/not-a-region'), null, 'Unknown region must be rejected.');
assert.equal(parseRoutePath('/flags/africa/west-africa/unknown'), null, 'Unknown activity must be rejected.');
assert.equal(parseRoutePath('/locations/learn'), null, 'World activity is not addressable for locations.');
assert.equal(parseRoutePath('/outlines/learn'), null, 'World activity is not addressable for outlines.');
assert.equal(parseRoutePath('/neighbors/learn'), null, 'World activity is not addressable for neighbours.');

const fakeWindow = new FakeBrowserWindow('https://example.test/flag/#/locations/africa/west-africa');
const hashRouter = createHashRouter(fakeWindow);
assert.equal(serializeRoutePath(hashRouter.current()), '/locations/africa/west-africa', 'Cold hash deep link parses directly.');
assert.equal(fakeWindow.location.pathname, '/flag/', 'Hash routing keeps the GitHub Pages project path server-visible and stable.');

const observed = [];
hashRouter.subscribe((nextRoute) => observed.push(nextRoute ? serializeRoutePath(nextRoute) : null));
hashRouter.navigate(flags);
hashRouter.navigate(flagsAfrica);
assert.deepEqual(observed, ['/flags', '/flags/africa'], 'Typed navigation writes addressable hash entries.');
assert.equal(fakeWindow.location.hash, '#/flags/africa');
assert.equal(fakeWindow.location.pathname, '/flag/');

fakeWindow.history.back();
assert.equal(fakeWindow.location.hash, '#/flags');
assert.equal(observed.at(-1), '/flags', 'Browser Back reparses the previous URL.');
fakeWindow.history.forward();
assert.equal(fakeWindow.location.hash, '#/flags/africa');
assert.equal(observed.at(-1), '/flags/africa', 'Browser Forward reparses the next URL.');

hashRouter.navigate(flagsWest, { replace: true });
assert.equal(fakeWindow.location.hash, '#/flags/africa/west-africa', 'Replace navigation canonicalises without growing history.');
fakeWindow.history.back();
assert.equal(fakeWindow.location.hash, '#/flags', 'Back skips the replaced entry and reaches the prior conceptual URL.');

const app = await readFile('dist/app.js', 'utf8');
assert.equal(app.includes('viewStack'), false, 'Legacy in-memory viewStack must not remain authoritative.');
assert.equal(app.includes('historyIndex'), false, 'Legacy numeric history index must be removed.');
assert.ok(app.includes('createHashRouter'), 'Application must compose through the hash router adapter.');
assert.ok(app.includes('stableRoute'), 'Active-round refresh fallback must use the stable route.');
assert.ok(
  app.includes('review-mistakes')
    && app.includes('review-map-mistakes')
    && app.includes('review-outline-mistakes')
    && app.includes('review-neighbors'),
  'Flags, locations, outlines, and neighbours share the typed review activity route layer.',
);
assert.ok(app.includes("route.domain === 'outlines'"), 'Outlines must be interpreted through the shared learning route state.');
assert.ok(app.includes("route.domain === 'neighbors'"), 'Neighbours must be interpreted through the shared learning route state.');

const home = await readFile('dist/ui/views/home.js', 'utf8');
assert.ok(home.includes('Learning domains'), 'Home must present the domain hierarchy.');
assert.ok(
  home.includes("domainDisplayName('flags')")
    && home.includes("domainDisplayName('locations')")
    && home.includes("domainDisplayName('outlines')")
    && home.includes("domainDisplayName('neighbors')"),
  'All four available domains must use the canonical display-name contract on Home.',
);
assert.ok(home.includes('4 available'), 'Home availability summary must reflect the four shipped learning domains.');

const flagScope = await readFile('dist/ui/views/scope.js', 'utf8');
const mapScope = await readFile('dist/ui/views/map-home.js', 'utf8');
const outlineScope = await readFile('dist/ui/views/outline-home.js', 'utf8');
const neighborScope = await readFile('dist/ui/views/neighbor-home.js', 'utf8');
assert.ok(flagScope.includes('data-action="route-parent"'), 'Flag scope Back must use conceptual parent routing.');
assert.ok(mapScope.includes('data-action="route-parent"'), 'Location scope Back must use conceptual parent routing.');
assert.ok(outlineScope.includes('data-action="route-parent"'), 'Outline scope Back must use conceptual parent routing.');
assert.ok(neighborScope.includes('data-action="route-parent"'), 'Neighbour scope Back must use conceptual parent routing.');

const flagResults = await readFile('dist/ui/views/results.js', 'utf8');
const mapResults = await readFile('dist/ui/views/map-results.js', 'utf8');
const outlineResults = await readFile('dist/ui/views/outline-results.js', 'utf8');
const neighborResults = await readFile('dist/ui/views/neighbor-results.js', 'utf8');
assert.ok(flagResults.includes('data-action="exit-round"'), 'Flag results exit through the unified round route contract.');
assert.ok(mapResults.includes('data-action="exit-round"'), 'Location results exit through the unified round route contract.');
assert.ok(outlineResults.includes('data-action="exit-round"'), 'Outline results exit through the unified round route contract.');
assert.ok(neighborResults.includes('data-action="exit-round"'), 'Neighbour results exit through the unified round route contract.');
assert.ok(flagResults.includes('review-mistakes') && flagResults.includes('repeat-scope'), 'Flag results expose review and repeat paths.');
assert.ok(mapResults.includes('review-map-mistakes') && mapResults.includes('repeat-map'), 'Location results expose review and repeat paths.');
assert.ok(outlineResults.includes('review-outline-mistakes') && outlineResults.includes('repeat-outline'), 'Outline results expose review and repeat paths.');
assert.ok(neighborResults.includes('review-neighbors') && neighborResults.includes('repeat-neighbors'), 'Neighbour results expose review and repeat paths.');

const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'));
assert.equal(manifest.start_url, './#/', 'Installed PWA must start at the canonical hash Home route.');
assert.equal(manifest.lang, 'en-GB', 'Installed PWA declares the British-English product language.');

const serviceWorker = await readFile('dist/sw.js', 'utf8');
assert.ok(serviceWorker.includes("const VERSION = 'flag-atlas-v13'"), 'British-English shell change must invalidate the previous app-shell cache.');
assert.ok(serviceWorker.includes("request.mode === 'navigate'"), 'Offline navigation must retain index shell fallback.');
assert.ok(serviceWorker.includes("'./outline.css'"), 'Outline presentation CSS must be part of the offline shell.');
assert.ok(serviceWorker.includes("'./neighbors.css'"), 'Neighbour presentation CSS must be part of the offline shell.');
assert.ok(serviceWorker.includes("'./neighbor-map-runtime.js'"), 'Neighbour map runtime must be part of the offline shell.');

console.log('Routing verification passed: typed routes, cold links, Back/Forward, invalid-route handling, refresh fallback contract, four-domain IA, result navigation, and v13 PWA shell.');
