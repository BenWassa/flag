import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS,
  AFRICA_STANDARD_NEIGHBOR_TARGET_IDS,
  getAfricaNeighborScopeConfig,
} from '../dist/data/neighbors/index.js';

assert.deepEqual(
  [...AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS],
  ['EGY', 'MAR'],
  'Africa-only topology defers targets whose complete app-country neighbor sets cross the topology boundary.',
);
assert.ok(!AFRICA_STANDARD_NEIGHBOR_TARGET_IDS.includes('EGY'), 'Egypt is not taught with an incomplete Africa-only neighbor set.');
assert.ok(!AFRICA_STANDARD_NEIGHBOR_TARGET_IDS.includes('MAR'), 'Morocco is not taught with an incomplete Africa-only neighbor set.');

const africaNeighbors = getAfricaNeighborScopeConfig('africa');
const northNeighbors = getAfricaNeighborScopeConfig('north-africa');
assert.ok(africaNeighbors && northNeighbors);
for (const id of AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS) {
  assert.ok(!africaNeighbors.countryIds.includes(id), `${id} is excluded from Africa Neighbor target scope.`);
  assert.ok(!northNeighbors.countryIds.includes(id), `${id} is excluded from North Africa Neighbor target scope.`);
}

const indexHtml = await readFile('dist/index.html', 'utf8');
assert.ok(indexHtml.includes('./outline.css'), 'Combined production shell retains the Outlines stylesheet.');
assert.ok(indexHtml.includes('./neighbors.css'), 'Combined production shell includes the Neighbors stylesheet.');
assert.ok(indexHtml.includes('./neighbor-map-runtime.js'), 'Combined production shell includes the lightweight Neighbors map runtime.');

const serviceWorker = await readFile('dist/sw.js', 'utf8');
assert.ok(serviceWorker.includes("const VERSION = 'flag-atlas-v12'"), 'Neighbor-map release owns a fresh v12 PWA cache.');
assert.ok(serviceWorker.includes('./outline.css') && serviceWorker.includes('./neighbors.css'), 'Both learning-domain styles remain in the offline shell.');
assert.ok(serviceWorker.includes('./neighbor-map-runtime.js'), 'Neighbor map presentation runtime is in the offline shell.');

const app = await readFile('dist/app.js', 'utf8');
for (const marker of ['outlineSession', 'neighborSession', 'flushOutlineAttempts', 'flushNeighborAttempts']) {
  assert.ok(app.includes(marker), `Combined app orchestration retains ${marker}.`);
}

const home = await readFile('dist/ui/views/home.js', 'utf8');
assert.ok(home.includes('4 available'), 'Home reports all four learning domains as available.');
assert.ok(home.includes('Outlines') && home.includes('Neighbors'), 'Home exposes Outlines and Neighbors together.');

const domain = await readFile('dist/ui/views/domain.js', 'utf8');
assert.ok(domain.includes('Country silhouettes') && domain.includes('Land-border sets'), 'Shared domain IA exposes both new learning families.');

console.log('Cross-domain integration verification passed: Outlines + Neighbors coexist, v12 shell is coherent, the map runtime is cached, and incomplete cross-topology Neighbor targets are deferred.');
