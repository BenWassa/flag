import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COUNTRIES } from '../.verify-dist/data/countries.js';
import { CONTINENTS } from '../.verify-dist/data/continents.js';
import { AFRICA_MAP_COUNTRY_IDS, AFRICA_MAP_SCOPE } from '../.verify-dist/data/map-scopes.js';
import {
  AFRICA_LAND_ADJACENCY,
  AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS,
  AFRICA_STANDARD_NEIGHBOR_TARGET_IDS,
  getAfricaNeighborScopeConfig,
} from '../.verify-dist/data/neighbors/index.js';
import { createInitialAchievementState } from '../.verify-dist/domain/achievements.js';
import { createInitialLocationProgress } from '../.verify-dist/domain/map-game.js';
import { createInitialNeighborProgress } from '../.verify-dist/domain/neighbor-game.js';
import { createInitialProgress } from '../.verify-dist/domain/progress.js';
import { scopeSupportsDomain } from '../.verify-dist/domain/scope-support.js';
import { loadScreens, renderScreen } from './lib/react-markup.mjs';

const { HomeScreen, DomainScreen } = await loadScreens('PassiveScreens.js');
const { GeographyLauncherScreen } = await loadScreens('LauncherScreens.js');

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
assert.ok(serviceWorker.includes('flag-atlas-v29'), 'React/Vite integration advances the PWA cache to v29.');
assert.ok(serviceWorker.includes('atlas-theme.css'), 'Tactile Atlas styling remains in the offline shell.');
assert.ok(serviceWorker.includes('outline.css') && serviceWorker.includes('neighbors.css'), 'Both learning-domain styles remain in the offline shell.');
assert.ok(serviceWorker.includes('neighbor-map-runtime.js'), 'Neighbour map presentation runtime is in the offline shell.');

const app = await readFile('src/react/AtlasApp.tsx', 'utf8');
for (const marker of ['outlineSession', 'neighborSession', 'flushOutlineAttempts', 'flushNeighborAttempts']) {
  assert.ok(app.includes(marker), `Combined app orchestration retains ${marker}.`);
}
assert.equal(app.includes('quick-play'), false, 'Combined app orchestration has no retired row-level Quick Play path.');

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
const achievements = createInitialAchievementState();
const homeHtml = renderScreen(HomeScreen, { ledgers, achievements, persisting: true });
assert.equal((homeHtml.match(/class="atlas-card"/g) ?? []).length, 4, 'Home exposes all four learning domains.');
for (const label of ['Flags', 'Locations', 'Outlines', 'Neighbours']) {
  assert.ok(homeHtml.includes(`<strong>${label}</strong>`), `Home names ${label} by its canonical display name.`);
}

const flagsIndexHtml = renderScreen(DomainScreen, { domain: 'flags', ledgers, achievements, persisting: true });
assert.ok(flagsIndexHtml.includes('Play world') && flagsIndexHtml.includes('Learn world'), 'Flags keeps its world-level Play/Learn index.');
assert.equal((flagsIndexHtml.match(/<button class="continent-row__open/g) ?? []).length, 6, 'Flags exposes all six continent launchers.');
assert.equal((flagsIndexHtml.match(/data-action="quick-play"/g) ?? []).length, 0, 'Flags continent rows do not bypass their launchers.');
for (const domain of ['locations', 'outlines', 'neighbors']) {
  const indexHtml2 = renderScreen(DomainScreen, { domain, ledgers, achievements, persisting: true });
  const shippedContinents = CONTINENTS.filter((continent) => scopeSupportsDomain(
    { kind: 'continent', id: continent.id, label: continent.name },
    domain,
  )).length;
  assert.equal(
    (indexHtml2.match(/<button class="continent-row__open/g) ?? []).length,
    shippedContinents,
    `${domain} opens every continent with canonical shipped coverage.`,
  );
  assert.equal(
    (indexHtml2.match(/data-action="quick-play"/g) ?? []).length,
    0,
    `${domain} exposes no row-level Quick Play shortcut.`,
  );
  assert.ok(
    indexHtml2.includes('<strong>Africa</strong>'),
    `${domain} names Africa through its canonical display label.`,
  );
}

const launchers = [
  ['Locations', renderScreen(GeographyLauncherScreen, { domain: 'locations', progress: locationProgress, scope: AFRICA_MAP_SCOPE, achievements, persisting: true })],
  ['Outlines', renderScreen(GeographyLauncherScreen, { domain: 'outlines', progress: outlineProgress, scope: AFRICA_MAP_SCOPE, achievements, persisting: true })],
  ['Neighbours', renderScreen(GeographyLauncherScreen, { domain: 'neighbors', progress: neighborProgress, scope: AFRICA_MAP_SCOPE, achievements, persisting: true })],
];
for (const [name, html] of launchers) {
  assert.ok(html.includes('All Africa') && html.includes('Learn Africa'), `${name} opens directly on the Africa launcher.`);
  assert.equal((html.match(/class="region-row__progress"/g) ?? []).length, 6, `${name} exposes progress for Africa and all five of its regions.`);
  assert.equal((html.match(/data-action="quick-play"/g) ?? []).length, 0, `${name} has no separate row-level Play shortcut.`);
  assert.equal(html.includes('data-launcher-map-slot'), false, `${name} reserves no retired launcher map.`);
  for (const deletedSurface of ['mini-ledger', 'stat-legend', 'map-guide', 'map-legend', 'neighbor-policy']) {
    assert.equal(html.includes(deletedSurface), false, `${name} does not restore deleted pre-round ${deletedSurface} UI.`);
  }
}

console.log('Cross-domain integration verification passed: mode-first Home, full-width continent and region selection, deliberate Africa launchers, v29 Atlas shell, cached map runtime, and deferred incomplete Neighbours targets.');
