import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COUNTRIES } from '../dist/data/countries.js';
import { AFRICA_MAP_COUNTRY_IDS, AFRICA_MAP_SCOPE } from '../dist/data/map-scopes.js';
import {
  AFRICA_LAND_ADJACENCY,
  AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS,
  AFRICA_STANDARD_NEIGHBOR_TARGET_IDS,
  getAfricaNeighborScopeConfig,
} from '../dist/data/neighbors/index.js';
import { createInitialLocationProgress } from '../dist/domain/map-game.js';
import { createInitialNeighborProgress } from '../dist/domain/neighbor-game.js';
import { createInitialProgress } from '../dist/domain/progress.js';
import { renderDomainHome } from '../dist/ui/views/domain.js';
import { renderHome } from '../dist/ui/views/home.js';
import { renderContinent } from '../dist/ui/views/atlas.js';
import { renderMapHome } from '../dist/ui/views/map-home.js';
import { renderNeighborHome } from '../dist/ui/views/neighbor-home.js';
import { renderOutlineHome } from '../dist/ui/views/outline-home.js';

assert.deepEqual(
  [...AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS],
  ['EGY', 'MAR'],
  'Africa-only topology defers targets whose complete app-country neighbour sets cross the topology boundary.',
);
assert.ok(!AFRICA_STANDARD_NEIGHBOR_TARGET_IDS.includes('EGY'), 'Egypt is not taught with an incomplete Africa-only neighbour set.');
assert.ok(!AFRICA_STANDARD_NEIGHBOR_TARGET_IDS.includes('MAR'), 'Morocco is not taught with an incomplete Africa-only neighbour set.');

const africaNeighbors = getAfricaNeighborScopeConfig('africa');
const northNeighbors = getAfricaNeighborScopeConfig('north-africa');
assert.ok(africaNeighbors && northNeighbors);
for (const id of AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS) {
  assert.ok(!africaNeighbors.countryIds.includes(id), `${id} is excluded from Africa Neighbours target scope.`);
  assert.ok(!northNeighbors.countryIds.includes(id), `${id} is excluded from North Africa Neighbours target scope.`);
}

const indexHtml = await readFile('dist/index.html', 'utf8');
assert.ok(indexHtml.includes('./atlas-theme.css'), 'Combined production shell includes the Tactile Atlas stylesheet.');
assert.ok(indexHtml.includes('./outline.css'), 'Combined production shell retains the Outlines stylesheet.');
assert.ok(indexHtml.includes('./neighbors.css'), 'Combined production shell includes the Neighbours stylesheet.');
assert.ok(indexHtml.includes('./neighbor-map-runtime.js'), 'Combined production shell includes the lightweight Neighbours map runtime.');

const serviceWorker = await readFile('dist/sw.js', 'utf8');
assert.ok(serviceWorker.includes("const VERSION = 'flag-atlas-v16'"), 'Atlas brand rollout owns the v16 PWA cache.');
assert.ok(serviceWorker.includes('./atlas-theme.css'), 'Tactile Atlas styling remains in the offline shell.');
assert.ok(serviceWorker.includes('./outline.css') && serviceWorker.includes('./neighbors.css'), 'Both learning-domain styles remain in the offline shell.');
assert.ok(serviceWorker.includes('./neighbor-map-runtime.js'), 'Neighbour map presentation runtime is in the offline shell.');

const app = await readFile('dist/app.js', 'utf8');
for (const marker of ['outlineSession', 'neighborSession', 'flushOutlineAttempts', 'flushNeighborAttempts']) {
  assert.ok(app.includes(marker), `Combined app orchestration retains ${marker}.`);
}

const flagProgress = createInitialProgress(COUNTRIES);
const locationProgress = createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS);
const outlineProgress = createInitialProgress(COUNTRIES);
const neighborProgress = createInitialNeighborProgress(Object.keys(AFRICA_LAND_ADJACENCY));
const homeHtml = renderHome(flagProgress);
assert.equal((homeHtml.match(/data-action="open-atlas"/g) ?? []).length, 6, 'Home exposes all six continents.');
const africaAtlasHtml = renderContinent(flagProgress, { kind: 'continent', id: 'africa', label: 'Africa' });
assert.equal(
  (africaAtlasHtml.match(/data-action="quick-play"/g) ?? []).length,
  20,
  'Every Africa region exposes all four learning domains as direct launch shortcuts.',
);
for (const label of ['Flags', 'Locations', 'Outlines', 'Neighbours']) {
  assert.ok(
    africaAtlasHtml.includes(`Play West Africa ${label.toLowerCase()}`),
    `The continent surface exposes ${label} through its canonical display name.`,
  );
}

const flagsHomeHtml = renderDomainHome('flags', flagProgress);
assert.ok(flagsHomeHtml.includes('Play world') && flagsHomeHtml.includes('Learn world'), 'Flags keeps its world-level Play/Learn index.');
assert.equal((flagsHomeHtml.match(/data-action="open-scope"/g) ?? []).length, 6, 'Flags exposes all six continent launchers.');

const launchers = [
  ['Locations', renderMapHome(locationProgress, AFRICA_MAP_SCOPE)],
  ['Outlines', renderOutlineHome(outlineProgress, AFRICA_MAP_SCOPE)],
  ['Neighbours', renderNeighborHome(neighborProgress, AFRICA_MAP_SCOPE)],
];
for (const [name, html] of launchers) {
  assert.ok(html.includes('Play Africa') && html.includes('Learn Africa'), `${name} opens directly on the Africa launcher.`);
  assert.equal((html.match(/data-action="select-region"/g) ?? []).length, 5, `${name} exposes the five Africa regions.`);
  assert.ok(html.includes('data-launcher-map-slot'), `${name} reserves the shared lazy map slot.`);
  for (const deletedSurface of ['mini-ledger', 'stat-legend', 'map-guide', 'map-legend', 'neighbor-policy']) {
    assert.equal(html.includes(deletedSurface), false, `${name} does not restore deleted pre-round ${deletedSurface} UI.`);
  }
}

console.log('Cross-domain integration verification passed: scope-first Home, four-domain region grid, direct Africa launchers, v16 Atlas shell, cached map runtime, and deferred incomplete Neighbours targets.');
