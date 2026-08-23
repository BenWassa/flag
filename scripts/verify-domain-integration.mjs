import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COUNTRIES } from '../dist/data/countries.js';
import { CONTINENTS } from '../dist/data/continents.js';
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
import { scopeSupportsDomain } from '../dist/domain/scope-support.js';
import { renderDomainIndex } from '../dist/ui/views/domain.js';
import { renderHome } from '../dist/ui/views/home.js';
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
const ledgers = {
  flags: flagProgress,
  locations: locationProgress,
  outlines: outlineProgress,
  neighbors: neighborProgress,
};
const homeHtml = renderHome(ledgers);
assert.equal((homeHtml.match(/data-action="open-domain"/g) ?? []).length, 4, 'Home exposes all four learning domains.');
for (const label of ['Flags', 'Locations', 'Outlines', 'Neighbours']) {
  assert.ok(homeHtml.includes(`<strong>${label}</strong>`), `Home names ${label} by its canonical display name.`);
}

const flagsIndexHtml = renderDomainIndex('flags', ledgers);
assert.ok(flagsIndexHtml.includes('Play world') && flagsIndexHtml.includes('Learn world'), 'Flags keeps its world-level Play/Learn index.');
assert.equal((flagsIndexHtml.match(/data-action="open-scope"/g) ?? []).length, 6, 'Flags exposes all six continent launchers.');
for (const domain of ['locations', 'outlines', 'neighbors']) {
  const indexHtml2 = renderDomainIndex(domain, ledgers);
  const shippedContinents = CONTINENTS.filter((continent) => scopeSupportsDomain(
    { kind: 'continent', id: continent.id, label: continent.name },
    domain,
  )).length;
  assert.equal(
    (indexHtml2.match(/data-action="open-scope"/g) ?? []).length,
    shippedContinents,
    `${domain} opens every continent with canonical shipped coverage.`,
  );
  assert.ok(
    indexHtml2.includes(`aria-label="Play Africa ${domain === 'neighbors' ? 'neighbours' : domain}"`),
    `${domain} keeps Africa available through its canonical display name.`,
  );
}

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

console.log('Cross-domain integration verification passed: mode-first Home, per-domain continent indexes, direct Africa launchers, v16 Atlas shell, cached map runtime, and deferred incomplete Neighbours targets.');
