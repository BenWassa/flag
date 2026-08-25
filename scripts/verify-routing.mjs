import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHashRouter } from '../dist/routing/router.js';
import {
  normalizeAvailableRoute,
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
const locations = route('/locations');
const locationsAfrica = route('/locations/africa');
const locationsWest = route('/locations/africa/west-africa');
const locationsEast = route('/locations/africa/east-africa');
const locationsTest = route('/locations/africa/west-africa/test');
const outlines = route('/outlines');
const outlinesAfrica = route('/outlines/africa');
const outlinesWest = route('/outlines/africa/west-africa');
const outlinesLearn = route('/outlines/africa/west-africa/learn');
const neighbors = route('/neighbors');
const neighborsAfrica = route('/neighbors/africa');
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

// A bare domain route is now a real screen — that domain's continent index —
// so it must survive normalisation instead of being redirected into Africa.
assert.equal(serializeRoutePath(normalizeAvailableRoute(locations)), '/locations', 'Bare Locations is its own continent index.');
assert.equal(serializeRoutePath(normalizeAvailableRoute(outlines)), '/outlines', 'Bare Outlines is its own continent index.');
assert.equal(serializeRoutePath(normalizeAvailableRoute(neighbors)), '/neighbors', 'Bare Neighbours is its own continent index.');
assert.equal(serializeRoutePath(normalizeAvailableRoute(locationsAfrica)), '/locations/africa', 'A shipped continent survives normalisation.');
// Unshipped curriculum falls back to the domain index, which states the
// coverage honestly, rather than silently substituting a different continent.
assert.equal(
  serializeRoutePath(normalizeAvailableRoute(route('/locations/oceania'))),
  '/locations',
  'An unshipped continent falls back to the domain index rather than a substituted scope.',
);
assert.equal(
  serializeRoutePath(normalizeAvailableRoute(route('/neighbors/oceania/melanesia'))),
  '/neighbors',
  'An unshipped region falls back to the domain index too.',
);

// Mode-first Back chain: Home picks a domain, the domain route lists that
// domain's continents, and a scoped launcher is one of those continents. A
// selected region is the same continent screen, so it shares that parent —
// clearing the region is the launcher's own All-continent control, not Back.
assert.equal(serializeRoutePath(parentRoute(flagsWest)), '/flags');
assert.equal(serializeRoutePath(parentRoute(flagsAfrica)), '/flags');
assert.equal(serializeRoutePath(parentRoute(flags)), '/');
assert.equal(serializeRoutePath(parentRoute(locationsTest)), '/locations/africa/west-africa');
assert.equal(serializeRoutePath(stableRoute(locationsTest)), '/locations/africa/west-africa');
assert.equal(serializeRoutePath(parentRoute(outlinesLearn)), '/outlines/africa/west-africa');
assert.equal(serializeRoutePath(parentRoute(neighborsTest)), '/neighbors/africa/west-africa');
for (const [launcherRoute, expectedParent] of [
  [locationsAfrica, '/locations'],
  [locationsWest, '/locations'],
  [outlinesAfrica, '/outlines'],
  [outlinesWest, '/outlines'],
  [neighborsAfrica, '/neighbors'],
  [neighborsWest, '/neighbors'],
]) {
  assert.equal(
    serializeRoutePath(parentRoute(launcherRoute)),
    expectedParent,
    `${serializeRoutePath(launcherRoute)} launcher Back must return to its domain's continent index.`,
  );
}

// The scope-first /atlas/* surface is retired. Its links no longer parse, so
// the application replaces them with Home rather than rendering a dead screen.
for (const retired of ['/atlas', '/atlas/africa', '/atlas/africa/west-africa', '/atlas/europe']) {
  assert.equal(parseRoutePath(retired), null, `The retired ${retired} surface must not parse.`);
}
assert.equal(routeTitle(flags), 'Flags · Atlas', 'A domain index is titled by its domain.');
assert.equal(routeTitle(locations), 'Locations · Atlas');
assert.equal(routeTitle(neighbors), 'Neighbours · Atlas', 'The domain index uses learner-facing British English.');

assert.equal(routeTitle(flagsWest), 'West Africa flags · Atlas');
assert.equal(routeTitle(locationsTest), 'Play West Africa locations · Atlas');
assert.equal(routeTitle(outlinesLearn), 'Learn West Africa outlines · Atlas');
assert.equal(routeTitle(neighborsTest), 'Play West Africa neighbours · Atlas');
assert.equal(serializeRoutePath(locationsTest), '/locations/africa/west-africa/test', 'Learner-facing Play keeps the stable /test route segment.');
assert.equal(serializeRoutePath(neighborsTest), '/neighbors/africa/west-africa/test', 'Neighbours Play also keeps the stable /test route segment.');

assert.equal(parseRoutePath('/flags/asia/west-africa'), null, 'Region must belong to its route continent.');
assert.equal(parseRoutePath('/locations/africa/not-a-region'), null, 'Unknown region must be rejected.');
assert.equal(parseRoutePath('/locations/nowhere'), null, 'Unknown continent must be rejected.');
assert.equal(parseRoutePath('/locations/africa/east-asia'), null, 'A region must belong to its route continent.');
// Availability is no longer a parse error: an unshipped continent is a valid
// URL that normalisation resolves, so the parser stays a pure grammar.
assert.ok(parseRoutePath('/locations/asia'), 'An unshipped but well-formed scope parses.');
assert.ok(parseRoutePath('/outlines/asia'), 'An unshipped but well-formed scope parses for every domain.');
assert.equal(parseRoutePath('/flags/africa/west-africa/unknown'), null, 'Unknown activity must be rejected.');
assert.equal(parseRoutePath('/locations/learn'), null, 'World activity is not addressable for locations.');
assert.equal(parseRoutePath('/outlines/learn'), null, 'World activity is not addressable for outlines.');
assert.equal(parseRoutePath('/neighbors/learn'), null, 'World activity is not addressable for neighbours.');

const coldWindow = new FakeBrowserWindow('https://example.test/flag/#/locations/africa/west-africa');
const coldRouter = createHashRouter(coldWindow);
assert.equal(serializeRoutePath(coldRouter.current()), '/locations/africa/west-africa', 'Cold hash deep link parses directly.');
assert.equal(coldWindow.location.pathname, '/flag/', 'Hash routing keeps the GitHub Pages project path server-visible and stable.');

const fakeWindow = new FakeBrowserWindow('https://example.test/flag/#/');
const hashRouter = createHashRouter(fakeWindow);
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

const selectionWindow = new FakeBrowserWindow('https://example.test/flag/#/');
const selectionRouter = createHashRouter(selectionWindow);
selectionRouter.navigate(locationsAfrica);
const launcherHistoryLength = selectionWindow.entries.length;
selectionRouter.navigate(locationsWest, { replace: true });
selectionRouter.navigate(locationsEast, { replace: true });
assert.equal(selectionWindow.location.hash, '#/locations/africa/east-africa', 'The latest region selection owns the launcher URL.');
assert.equal(selectionWindow.entries.length, launcherHistoryLength, 'Region selection replaces the launcher entry instead of growing history.');
selectionWindow.history.back();
assert.equal(selectionWindow.location.hash, '#/', 'One Back after multiple region selections returns to the launcher parent.');

const roundWindow = new FakeBrowserWindow('https://example.test/flag/#/');
const roundRouter = createHashRouter(roundWindow);
roundRouter.navigate(locationsAfrica);
roundRouter.navigate(locationsWest, { replace: true });
roundRouter.navigate(locationsTest);
assert.equal(roundWindow.location.hash, '#/locations/africa/west-africa/test', 'Starting a round pushes its stable internal activity route.');
roundWindow.history.back();
assert.equal(roundWindow.location.hash, '#/locations/africa/west-africa', 'Back from a round returns to the exact selected launcher scope.');

const app = await readFile('src/app.ts', 'utf8');
assert.equal(app.includes('viewStack'), false, 'Legacy in-memory viewStack must not remain authoritative.');
assert.equal(app.includes('historyIndex'), false, 'Legacy numeric history index must be removed.');
assert.ok(app.includes('createHashRouter'), 'Application must compose through the hash router adapter.');
assert.ok(app.includes('stableRoute'), 'Active-round refresh fallback must use the stable route.');
assert.ok(app.includes('normalizeAvailableRoute'), 'Application must canonicalise availability through the exported pure route helper.');
assert.ok(app.includes('select-region') && app.includes('select-continent'), 'Launcher selection must use explicit replace-only actions.');
assert.equal(app.includes('quick-play'), false, 'Application has no dead row-level Quick Play dispatch.');
assert.ok(
  app.includes('review-mistakes')
    && app.includes('review-map-mistakes')
    && app.includes('review-outline-mistakes')
    && app.includes('review-neighbors'),
  'Flags, locations, outlines, and neighbours share the typed review activity route layer.',
);
assert.ok(app.includes("route.domain === 'outlines'"), 'Outlines must be interpreted through the shared learning route state.');
assert.ok(app.includes("route.domain === 'neighbors'"), 'Neighbours must be interpreted through the shared learning route state.');
assert.ok(app.includes('installNavigationGestures'), 'The app installs the shared edge-swipe navigation contract.');
const navigationGestures = await readFile('dist/navigation-gestures.js', 'utf8');
assert.ok(navigationGestures.includes('EDGE_GUTTER_PX'), 'Back swipe is restricted to an edge gesture.');
assert.ok(navigationGestures.includes('getParentRoute() !== null'), 'Back swipe cannot leave the app from Home.');
assert.ok(navigationGestures.includes('[data-map-viewport'), 'Back swipe yields to map pan and pinch gestures.');

const home = await readFile('dist/ui/views/home.js', 'utf8');
assert.ok(home.includes('data-action="open-domain"'), 'Home selects a learning domain first.');
assert.equal(
  (home.match(/data-action="quick-play"/g) ?? []).length,
  0,
  'Home starts no round before a domain and a geographic scope are chosen.',
);
assert.equal(home.includes('data-action="open-atlas"'), false, 'The retired scope-first atlas action must not return.');
assert.equal(home.includes('data-action="open-scope"'), false, 'Home does not select geography directly.');

const domainIndex = await readFile('dist/ui/views/domain.js', 'utf8');
assert.ok(domainIndex.includes('data-action="route-parent"'), 'The domain index exposes the shared Back contract.');
assert.ok(domainIndex.includes('data-action="open-scope"'), 'The domain index opens a continent within its own domain.');
assert.equal(domainIndex.includes('data-action="quick-play"'), false, 'A continent row navigates to its deliberate launcher instead of starting a round.');
assert.ok(domainIndex.includes('continent-row--shell'), 'Unshipped continents render as inert shells, not launchers.');

const flagScope = await readFile('dist/ui/views/scope.js', 'utf8');
const mapScope = await readFile('dist/ui/views/map-home.js', 'utf8');
const outlineScope = await readFile('dist/ui/views/outline-home.js', 'utf8');
const neighborScope = await readFile('dist/ui/views/neighbor-home.js', 'utf8');
for (const [name, scopeSource] of [
  ['Flags', flagScope],
  ['Locations', mapScope],
  ['Outlines', outlineScope],
  ['Neighbours', neighborScope],
]) {
  assert.ok(scopeSource.includes('renderLauncher'), `${name} pre-round scope must adapt into the shared launcher.`);
  assert.equal(scopeSource.includes('mini-ledger'), false, `${name} launcher adapter must not retain a region country ledger.`);
}

const launcher = await readFile('dist/ui/views/launcher.js', 'utf8');
for (const action of ['launcher-parent', 'select-region', 'select-continent']) {
  assert.ok(launcher.includes(`data-action="${action}"`), `Shared launcher must expose ${action}.`);
}
assert.equal(launcher.includes('data-action="quick-play"'), false, 'Region rows select scope and expose no inline Play shortcut.');
assert.ok(launcher.includes('region-row__progress'), 'Every launcher region exposes its shared progress strip.');
assert.ok(launcher.includes('aria-pressed'), 'Region selection must be programmatic as well as visual.');
assert.ok(launcher.includes('Play ${scopeLabel}') && launcher.includes('Learn ${scopeLabel}'), 'Launcher Play and Learn actions must both name the active scope.');
assert.equal(launcher.includes('stat-legend'), false, 'Shared launcher must not restore the deleted learning-state legend.');
assert.equal(launcher.includes('mini-ledger'), false, 'Shared launcher must not restore the deleted country ledger.');

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
assert.ok(serviceWorker.includes('flag-atlas-v29'), 'React/Vite rollout invalidates the previous app-shell cache.');
assert.ok(serviceWorker.includes('atlas-theme.css'), 'The Tactile Atlas stylesheet must be part of the offline shell.');
assert.match(serviceWorker, /mode===.?navigate/, 'Offline navigation must retain index shell fallback.');
assert.ok(serviceWorker.includes('outline.css'), 'Outline presentation CSS must be part of the offline shell.');
assert.ok(serviceWorker.includes('neighbors.css'), 'Neighbour presentation CSS must be part of the offline shell.');
assert.ok(serviceWorker.includes('neighbor-map-runtime.js'), 'Neighbour map runtime must be part of the offline shell.');

console.log('Routing verification passed: simplified launchers, canonical Africa routes, replace-only selection history, Play titles with stable /test routes, result navigation, and v29 Atlas PWA shell.');
