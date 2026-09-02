import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { parseRoutePath, serializeRoutePath } from '../src/app-route.js';
import { COUNTRIES } from '../src/data/countries.js';
import { AFRICA_NEIGHBOR_FIXTURE } from '../src/data/neighbors/africa.js';
import { evaluateNeighborAnswer, getNeighborRound, normalizeNeighborInput } from '../src/domain/neighbors.js';
import { getLearningScope } from '../src/domain/learning-scopes.js';
import { NeighborProgressStore } from '../src/infrastructure/neighbor-storage.js';
import { StorageBox } from '../src/infrastructure/storage.js';
import { buildNeighborMapModel } from '../src/ui/components/neighbor-map.js';
import { MAP_RENDERER_TARGETS, getMapViewport } from '../src/ui/components/map.js';

const westAfrica = getLearningScope('africa', 'west-africa');
assert.ok(westAfrica, 'West Africa scope must exist.');
const africa = getLearningScope('africa', 'all');
assert.ok(africa, 'Africa scope must exist.');

const nga = COUNTRIES.find((country) => country.id === 'NGA');
assert.ok(nga, 'Nigeria country row must exist.');
const round = getNeighborRound('NGA');
assert.deepEqual(round.neighbors, ['BEN', 'CMR', 'NER', 'TCD']);
assert.equal(round.total, 4);
assert.equal(normalizeNeighborInput(' Côte d’Ivoire '), "cote d'ivoire");
assert.deepEqual(evaluateNeighborAnswer(round, 'Cameroon'), { kind: 'correct', countryId: 'CMR' });
assert.deepEqual(evaluateNeighborAnswer(round, 'Cameroon', new Set(['CMR'])), { kind: 'duplicate', countryId: 'CMR' });
assert.deepEqual(evaluateNeighborAnswer(round, 'Senegal'), { kind: 'not-neighbor', countryId: 'SEN' });
assert.deepEqual(evaluateNeighborAnswer(round, 'not a country'), { kind: 'unknown' });

const zeroNeighborTargets = AFRICA_NEIGHBOR_FIXTURE.targets
  .filter((target) => target.neighbors.length === 0)
  .map((target) => target.id);
assert.ok(zeroNeighborTargets.includes('CPV'), 'Cape Verde remains an explicit zero-land-neighbor target.');
assert.ok(zeroNeighborTargets.includes('COM'), 'Comoros remains an explicit zero-land-neighbor target.');
assert.ok(zeroNeighborTargets.includes('MDG'), 'Madagascar remains an explicit zero-land-neighbor target.');
assert.ok(zeroNeighborTargets.includes('MUS'), 'Mauritius remains an explicit zero-land-neighbor target.');
assert.ok(zeroNeighborTargets.includes('STP'), 'São Tomé and Príncipe remains an explicit zero-land-neighbor target.');
assert.ok(zeroNeighborTargets.includes('SYC'), 'Seychelles remains an explicit zero-land-neighbor target.');

const fixtureTargetIds = new Set(AFRICA_NEIGHBOR_FIXTURE.targets.map((target) => target.id));
for (const target of AFRICA_NEIGHBOR_FIXTURE.targets) {
  for (const neighborId of target.neighbors) {
    assert.ok(fixtureTargetIds.has(neighborId), `${target.id} neighbor ${neighborId} must be a target too.`);
    const reverse = AFRICA_NEIGHBOR_FIXTURE.targets.find((candidate) => candidate.id === neighborId);
    assert.ok(reverse?.neighbors.includes(target.id), `${target.id}↔${neighborId} must be symmetric.`);
  }
}

const fixtureIds = [...fixtureTargetIds].sort();
const africaIds = [...africa.countryIds].sort();
assert.deepEqual(fixtureIds, africaIds, 'Africa neighbor fixture must cover exactly the Africa curriculum.');

const westTargets = westAfrica.countryIds.map((id) => getNeighborRound(id));
assert.equal(westTargets.length, westAfrica.countryIds.length);
assert.ok(westTargets.some((target) => target.neighbors.length > 0));

const mapModel = await buildNeighborMapModel({
  targetCountryId: 'NGA',
  scopeCountryIds: westAfrica.countryIds,
  submittedCountryIds: new Set(['BEN', 'SEN']),
  correctNeighborIds: new Set(['BEN']),
});
assert.equal(mapModel.targetCountryId, 'NGA');
assert.equal(mapModel.submittedCountries.get('BEN'), 'correct');
assert.equal(mapModel.submittedCountries.get('SEN'), 'wrong');
assert.ok(mapModel.paths.some((path) => path.countryId === 'NGA'));
assert.ok(mapModel.paths.some((path) => path.countryId === 'BEN'));

const viewport = getMapViewport({
  continentId: 'africa',
  regionId: 'west-africa',
  countryIds: westAfrica.countryIds,
  renderTargets: MAP_RENDERER_TARGETS.neighbors,
});
assert.ok(viewport.width > 0 && viewport.height > 0);
assert.ok(Number.isFinite(viewport.viewBox.x));
assert.ok(Number.isFinite(viewport.viewBox.y));

const memoryStorage = new Map();
const storage = new StorageBox({
  getItem(key) {
    return memoryStorage.has(key) ? memoryStorage.get(key) : null;
  },
  setItem(key, value) {
    memoryStorage.set(key, value);
  },
  removeItem(key) {
    memoryStorage.delete(key);
  },
});
const progressStore = new NeighborProgressStore(storage);
progressStore.recordLearnAttempt('NGA', { clean: false, attempts: 2 });
progressStore.recordLearnAttempt('NGA', { clean: true, attempts: 1 });
assert.equal(progressStore.getCountryProgress('NGA').learnAttempts, 2);
assert.equal(progressStore.getCountryProgress('NGA').cleanLearnAttempts, 1);
progressStore.recordPlayAttempt('NGA', { clean: true });
assert.equal(progressStore.getCountryProgress('NGA').playAttempts, 1);
assert.equal(progressStore.getCountryProgress('NGA').cleanPlayAttempts, 1);

const neighborRoute = parseRoutePath('/neighbors/africa/west-africa/learn');
assert.ok(neighborRoute && neighborRoute.name === 'learning' && neighborRoute.domain === 'neighbors');
assert.equal(serializeRoutePath(neighborRoute), '/neighbors/africa/west-africa/learn');

const storageSource = await readFile('src/infrastructure/neighbor-storage.ts', 'utf8');
assert.ok(storageSource.includes('flag-atlas:neighbor-progress:v1'));
assert.ok(storageSource.includes('flag-atlas:neighbor-attempts:v1'));
assert.ok(!storageSource.includes('flag-atlas:location-progress:v1'));
assert.ok(!storageSource.includes('flag-atlas:progress:v2'));
const neighborsRoundSource = await readFile('src/state/neighbors-round.ts', 'utf8');
assert.ok(neighborsRoundSource.includes("routeForScope('neighbors'"), 'Neighbours uses the shared Issue #10 route constructor.');
assert.ok(
  neighborsRoundSource.includes("finishInteraction(outcome.resolved ? null : '#neighbor-country-input')"),
  'Sequential guesses restore input focus while the target remains active.',
);
const reactScreenSource = await readFile('src/react/screens/NeighborScreens.tsx', 'utf8');
assert.ok(reactScreenSource.includes('onSubmit={(event) =>'), 'Enter-to-submit uses the native React form path.');
const css = await readFile('src/styles/neighbors.css', 'utf8');
assert.ok(
  css.includes('min-height: var(--control-height-standard)'),
  'Mobile entry and suggestion rows use the shared standard control height, which exceeds the 44px touch minimum.',
);
assert.ok(css.includes('max-height: min(28dvh, 230px)'), 'Autocomplete is bounded so the virtual keyboard does not bury the task status.');
assert.ok(!/#[0-9a-f]{3,8}\b/i.test(css), 'Neighbor CSS uses shared design tokens only.');
const generationSource = await readFile('scripts/generate-neighbor-fixture.mjs', 'utf8');
assert.ok(generationSource.includes('MAP_GENERATION_CONFIGS'), 'Lightweight fixtures are mechanically extracted from configured production topology outputs.');
assert.ok(generationSource.includes('Asymmetric generated') && generationSource.includes('adjacency:'), 'Fixture generation fails on asymmetric topology output.');
const fixtureBefore = await readFile('src/data/neighbors/africa.ts', 'utf8');
assert.ok(fixtureBefore.startsWith('// GENERATED FIXTURE. Do not hand-edit adjacency.'));
const regeneration = spawnSync(process.execPath, ['scripts/generate-neighbor-fixture.mjs'], { encoding: 'utf8' });
assert.equal(regeneration.status, 0, regeneration.stderr || 'Neighbor fixture regeneration failed.');
const fixtureAfter = await readFile('src/data/neighbors/africa.ts', 'utf8');
assert.equal(fixtureAfter, fixtureBefore, 'Regenerating from unchanged Issue #9 topology is byte-stable.');

const sourcePath = 'src/data/neighbors/africa.ts';
await writeFile(sourcePath, fixtureBefore);

console.log('Neighbor verification passed: topology fixture, answer rules, storage namespace, map state, zero-neighbor contract, routing, mobile keyboard constraints, and byte-stable regeneration.');
