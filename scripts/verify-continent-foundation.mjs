import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  AFRICA_MAP_COUNTRY_IDS,
  AFRICA_MAP_REGION_CONFIGS,
  MAP_CONTINENT_CONFIGS,
} from '../dist/data/map-scopes.js';
import { AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS } from '../dist/data/neighbors/index.js';
import { verifyContinentContract } from './verify-continent-contract.mjs';

const excluded = new Set(AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS);
const africaNeighborIds = AFRICA_MAP_COUNTRY_IDS.filter((id) => !excluded.has(id));
const sizes = await verifyContinentContract({
  continentId: 'africa',
  expectedCountryIds: AFRICA_MAP_COUNTRY_IDS,
  expectedRegionIds: AFRICA_MAP_REGION_CONFIGS.map((region) => region.scope.id),
  expectedNeighborCountryIds: africaNeighborIds,
  runtimeModulePath: 'dist/data/maps/africa.js',
});

assert.ok(
  MAP_CONTINENT_CONFIGS.some((config) => config.continentId === 'africa'),
  'Africa remains registered while the shared geography registry expands.',
);
assert.equal(
  new Set(MAP_CONTINENT_CONFIGS.map((config) => config.continentId)).size,
  MAP_CONTINENT_CONFIGS.length,
  'Each shipped geography continent is registered exactly once.',
);

const generatorEntry = await readFile('scripts/generate-maps.mjs', 'utf8');
const generatorCore = await readFile('scripts/map-generation-core.mjs', 'utf8');
const generatorConfigs = await readFile('scripts/map-continent-configs.mjs', 'utf8');
const learningScopes = await readFile('src/data/learning-scopes.ts', 'utf8');
const neighborIndex = await readFile('src/data/neighbors/index.ts', 'utf8');
const outlineLoader = await readFile('src/data/outlines.ts', 'utf8');

assert.ok(generatorEntry.includes('MAP_GENERATION_CONFIGS'), 'Map generation is driven by a shared continent configuration list.');
assert.ok(generatorEntry.includes('generateConfiguredMaps'), 'Map generation delegates to the shared engine.');
assert.ok(generatorCore.includes('deriveGlobalAdjacency'), 'Shared generation derives application-country adjacency globally before continent slicing.');
assert.ok(generatorCore.includes('GLOBAL_ADJACENCY_PATH'), 'Shared generation emits a reusable global adjacency fixture.');
assert.ok(generatorCore.includes('localContextCountryIds'), 'Shared generation supports keyed non-scoring cross-continent context countries.');
// The runtime contract is that no river layer is ever generated. Continent
// policy prose may still *document* that exclusion, so this asserts the
// absence of a river configuration key or source rather than the word itself.
assert.equal(
  /\brivers?\s*:/i.test(generatorConfigs) || /ne_\d+m_rivers/i.test(generatorConfigs),
  false,
  'Continent generation configuration has no river layer or abstraction.',
);
assert.ok(learningScopes.includes('OVERLAPPING_LEARNING_SCOPES'), 'Learner scopes expose an explicit overlapping-scope extension seam.');
assert.ok(neighborIndex.includes('getNeighborContinentData'), 'Neighbours resolve through the shared continent-data registry.');
assert.ok(neighborIndex.includes('NEIGHBOR_GUESS_COUNTRY_IDS'), 'Neighbour entry can recognise cross-continent canonical countries.');
assert.ok(outlineLoader.includes('loadMapAsset(scopeId)'), 'Outlines remain a consumer of canonical generated map geometry.');

console.log(`Global expansion foundation verified: Africa regression ${sizes.rawBytes} raw / ${sizes.gzipBytes} gzip bytes; shared generation, scopes, lazy loading and adjacency contracts are reusable.`);
