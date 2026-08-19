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
assert.ok(indexHtml.includes('./outline.css'), 'Combined production shell retains the Outlines stylesheet.');
assert.ok(indexHtml.includes('./neighbors.css'), 'Combined production shell includes the Neighbours stylesheet.');
assert.ok(indexHtml.includes('./neighbor-map-runtime.js'), 'Combined production shell includes the lightweight Neighbours map runtime.');

const serviceWorker = await readFile('dist/sw.js', 'utf8');
assert.ok(serviceWorker.includes("const VERSION = 'flag-atlas-v13'"), 'British-English shell change owns a fresh v13 PWA cache.');
assert.ok(serviceWorker.includes('./outline.css') && serviceWorker.includes('./neighbors.css'), 'Both learning-domain styles remain in the offline shell.');
assert.ok(serviceWorker.includes('./neighbor-map-runtime.js'), 'Neighbour map presentation runtime is in the offline shell.');

const app = await readFile('dist/app.js', 'utf8');
for (const marker of ['outlineSession', 'neighborSession', 'flushOutlineAttempts', 'flushNeighborAttempts']) {
  assert.ok(app.includes(marker), `Combined app orchestration retains ${marker}.`);
}

const home = await readFile('dist/ui/views/home.js', 'utf8');
assert.ok(home.includes('4 available'), 'Home reports all four learning domains as available.');
assert.ok(home.includes('Outlines') && home.includes("domainDisplayName('neighbors')"), 'Home exposes Outlines and the canonical Neighbours display name together.');

const domain = await readFile('dist/ui/views/domain.js', 'utf8');
assert.ok(domain.includes('Country silhouettes') && domain.includes('Land-border sets'), 'Shared domain IA exposes both new learning families.');

console.log('Cross-domain integration verification passed: Outlines + Neighbours coexist, v13 shell is coherent, the map runtime is cached, and incomplete cross-topology Neighbours targets are deferred.');
