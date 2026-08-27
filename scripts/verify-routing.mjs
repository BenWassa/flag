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
// A launcher row now starts its round directly, so the continent launcher the
// learner came from stays the history entry Back returns to.
roundRouter.navigate(locationsAfrica);
roundRouter.navigate(locationsTest);
assert.equal(roundWindow.location.hash, '#/locations/africa/west-africa/test', 'Starting a round pushes its stable internal activity route.');
roundWindow.history.back();
assert.equal(roundWindow.location.hash, '#/locations/africa', 'Back from a region round returns to the continent launcher it was started from.');
roundRouter.navigate(locationsWest);
roundRouter.navigate(locationsTest);
roundWindow.history.back();
assert.equal(roundWindow.location.hash, '#/locations/africa/west-africa', 'A round started from a region route still returns to that region launcher.');

const app = await readFile('src/react/AtlasApp.tsx', 'utf8');
assert.equal(app.includes('viewStack'), false, 'Legacy in-memory viewStack must not remain authoritative.');
assert.equal(app.includes('historyIndex'), false, 'Legacy numeric history index must be removed.');
assert.ok(app.includes('createHashRouter'), 'Application must compose through the hash router adapter.');
assert.ok(app.includes('stableRoute'), 'Active-round refresh fallback must use the stable route.');
assert.ok(app.includes('normalizeAvailableRoute'), 'Application must canonicalise availability through the exported pure route helper.');
assert.equal(app.includes('select-region') || app.includes('select-continent'), false, 'The retired two-step launcher selection must not return.');
const launcherSource = await readFile('src/react/components/Launcher.tsx', 'utf8');
assert.ok(launcherSource.includes('playScope'), 'Launcher rows resolve their own scope through the production action context.');
assert.ok(launcherSource.includes('scope.id'), 'A launcher row plays the scope it names.');
assert.equal(app.includes('quick-play'), false, 'Application has no dead row-level Quick Play dispatch.');
assert.ok(app.includes("review: (domain)") && app.includes("rounds.neighbors.reviewMistakes()"), 'All four domains share the typed review action layer.');
assert.ok(app.includes("route.domain === 'outlines'"), 'Outlines must be interpreted through the shared learning route state.');
assert.ok(app.includes("route.domain === 'neighbors'"), 'Neighbours must be interpreted through the shared learning route state.');
assert.ok(app.includes('installNavigationGestures'), 'The app installs the shared edge-swipe navigation contract.');
const navigationGestures = await readFile('dist/navigation-gestures.js', 'utf8');
assert.ok(navigationGestures.includes('EDGE_GUTTER_PX'), 'Back swipe is restricted to an edge gesture.');
assert.ok(navigationGestures.includes('getParentRoute() !== null'), 'Back swipe cannot leave the app from Home.');
assert.ok(navigationGestures.includes('[data-map-viewport'), 'Back swipe yields to map pan and pinch gestures.');

const homeSource = await readFile('src/react/screens/PassiveScreens.tsx', 'utf8');
assert.ok(homeSource.includes('openDomain(domain)'), 'Home selects a learning domain first.');
assert.equal(homeSource.includes('quick-play'), false, 'Home starts no round before a domain and a geographic scope are chosen.');
assert.equal(homeSource.includes('open-atlas'), false, 'The retired scope-first atlas action must not return.');
assert.ok(homeSource.includes('openScope(domain, continent.id)'), 'The domain index opens a continent within its own domain.');
assert.ok(homeSource.includes('continent-row--shell'), 'Unshipped continents render as inert shells, not launchers.');
assert.ok(launcherSource.includes('region-row__progress'), 'Every launcher scope row exposes its shared progress strip.');
assert.equal(launcherSource.includes('aria-pressed'), false, 'Launcher rows are one-tap actions rather than selection toggles.');
assert.ok(launcherSource.includes('aria-label={`Play ${label}`}'), 'Every launcher row announces that it starts Play for the scope it names.');
assert.ok(launcherSource.includes('>Learn {model.continentScope.label}</button>'), 'Launcher Learn names the whole continent it acts on.');
assert.equal(launcherSource.includes('stat-legend'), false, 'Shared launcher must not restore the deleted learning-state legend.');
assert.equal(launcherSource.includes('mini-ledger'), false, 'Shared launcher must not restore the deleted country ledger.');

const resultSources = await Promise.all([
  'src/react/screens/RecognitionScreens.tsx',
  'src/react/screens/LocationScreens.tsx',
  'src/react/screens/NeighborScreens.tsx',
].map((file) => readFile(file, 'utf8')));
const results = resultSources.join('\n');
assert.ok(results.includes('exitRound'), 'Production React result screens exit through the unified round route contract.');
assert.ok(results.includes('review(') && results.includes('repeat('), 'Production React result screens expose review and repeat paths.');

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
