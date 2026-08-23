import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import {
  ASIA_MAP_COUNTRY_IDS,
  ASIA_MAP_REGION_CONFIGS,
  CAUCASUS_MAP_COUNTRY_IDS,
  MIDDLE_EAST_MAP_COUNTRY_IDS,
  getMapScopeConfig,
} from '../dist/data/map-scopes.js';
import {
  CAUCASUS_LEARNING_COUNTRY_IDS,
  MIDDLE_EAST_LEARNING_COUNTRY_IDS,
  countryIdsForLearningScope,
  getLearningScopeDefinition,
  regionLearningScopes,
} from '../dist/data/learning-scopes.js';
import { COUNTRY_BY_ID } from '../dist/data/countries.js';
import { loadMapAsset } from '../dist/data/maps/index.js';
import {
  ASIA_LAND_ADJACENCY,
  ASIA_ZERO_LAND_NEIGHBOR_IDS,
} from '../dist/data/neighbors/index.js';
import {
  ASIA_CARTOGRAPHY_PROVENANCE,
  ASIA_GEOMETRY,
  ASIA_SCOPE_FOCUS,
  ASIA_WATER,
} from '../dist/data/maps/asia.js';
import {
  createInitialAchievementState,
  getContinentAchievementReadModel,
} from '../dist/domain/achievements.js';
import { scopeSupportsDomain, countryIdsForSupportedScope } from '../dist/domain/scope-support.js';
import { parseRoutePath, serializeRoutePath } from '../dist/routing/routes.js';
import { verifyContinentContract } from './verify-continent-contract.mjs';

function sorted(values) {
  return [...values].sort();
}

const expectedRegionIds = [
  'central-asia',
  'east-asia',
  'southeast-asia',
  'south-asia',
  'middle-east',
  'caucasus',
];
const expectedRegionalCoverage = [...ASIA_MAP_COUNTRY_IDS, 'EGY'];

assert.equal(ASIA_MAP_COUNTRY_IDS.length, 48, 'Asia keeps the locked 48-country canonical curriculum.');
assert.equal(new Set(ASIA_MAP_COUNTRY_IDS).size, 48, 'Asia canonical curriculum has no duplicate ISO3 IDs.');
assert.deepEqual(
  ASIA_MAP_REGION_CONFIGS.map((region) => region.scope.id),
  expectedRegionIds,
  'Learner-facing Asia order is Central, East, Southeast, South, Middle East, Caucasus.',
);
assert.deepEqual(
  regionLearningScopes('asia').map((definition) => definition.scope.id),
  expectedRegionIds,
  'Flags and achievement navigation consume the same learner-facing Asia regions.',
);
assert.equal(
  regionLearningScopes('asia').some((definition) => definition.scope.id === 'west-asia'),
  false,
  'Formal West Asia is hidden from normal learner navigation.',
);
assert.ok(getLearningScopeDefinition('west-asia'), 'Legacy West Asia remains resolvable for backwards compatibility.');

assert.deepEqual(sorted(MIDDLE_EAST_MAP_COUNTRY_IDS), sorted(MIDDLE_EAST_LEARNING_COUNTRY_IDS));
assert.deepEqual(sorted(CAUCASUS_MAP_COUNTRY_IDS), sorted(CAUCASUS_LEARNING_COUNTRY_IDS));
assert.equal(MIDDLE_EAST_MAP_COUNTRY_IDS.length, 17, 'Middle East contains the locked 17-country curriculum.');
assert.equal(CAUCASUS_MAP_COUNTRY_IDS.length, 3, 'Caucasus contains Armenia, Azerbaijan and Georgia.');
assert.ok(MIDDLE_EAST_MAP_COUNTRY_IDS.includes('EGY'), 'Egypt is an active Middle East learning target.');
for (const id of CAUCASUS_MAP_COUNTRY_IDS) {
  assert.equal(MIDDLE_EAST_MAP_COUNTRY_IDS.includes(id), false, `${id} belongs to Caucasus, not Middle East.`);
}
assert.equal(COUNTRY_BY_ID.get('EGY')?.continentId, 'africa', 'Egypt retains canonical African identity.');
assert.equal(COUNTRY_BY_ID.get('TUR')?.continentId, 'asia', 'Türkiye retains canonical Asian ownership.');
assert.equal(COUNTRY_BY_ID.get('KAZ')?.continentId, 'asia', 'Kazakhstan retains canonical Asian ownership.');
assert.equal(COUNTRY_BY_ID.get('RUS')?.continentId, 'europe', 'Russia retains canonical European ownership.');

const sizes = await verifyContinentContract({
  continentId: 'asia',
  expectedCountryIds: ASIA_MAP_COUNTRY_IDS,
  expectedRegionIds,
  expectedRegionalCountryIds: expectedRegionalCoverage,
  expectedNeighborCountryIds: ASIA_MAP_COUNTRY_IDS,
  runtimeModulePath: 'dist/data/maps/asia.js',
  maxRawBytes: 2_000_000,
  maxGzipBytes: 600_000,
});

for (const region of ASIA_MAP_REGION_CONFIGS) {
  const scope = region.scope;
  assert.deepEqual(
    sorted(countryIdsForLearningScope(scope)),
    sorted(region.countryIds),
    `${scope.label} Flags membership matches the canonical learner scope.`,
  );
  for (const domain of ['flags', 'locations', 'outlines', 'neighbors']) {
    assert.equal(scopeSupportsDomain(scope, domain), true, `${scope.label} supports ${domain}.`);
    assert.deepEqual(
      sorted(countryIdsForSupportedScope(scope, domain)),
      sorted(region.countryIds),
      `${scope.label} ${domain} membership is exact.`,
    );
  }
}

const middleEastAsset = await loadMapAsset('middle-east');
assert.ok(middleEastAsset, 'Middle East map asset loads.');
assert.deepEqual(sorted(middleEastAsset.countries.map((country) => country.countryId)), sorted(MIDDLE_EAST_MAP_COUNTRY_IDS));
assert.ok(middleEastAsset.countries.some((country) => country.countryId === 'EGY'), 'Egypt is interactive inside Middle East.');
assert.ok(middleEastAsset.contextCountries?.some((country) => country.countryId === 'RUS'), 'Russia remains non-scoring Asia context.');
assert.equal(middleEastAsset.contextCountries?.some((country) => country.countryId === 'EGY'), false, 'Egypt is never duplicated as context when it is active.');

const asiaAsset = await loadMapAsset('asia');
assert.ok(asiaAsset, 'Full Asia map asset loads.');
assert.ok(asiaAsset.contextCountries?.some((country) => country.countryId === 'EGY'), 'Egypt is context on the full Asia map.');
assert.ok(asiaAsset.contextCountries?.some((country) => country.countryId === 'RUS'), 'Russia is context on the full Asia map.');
assert.equal('rivers' in (asiaAsset.water ?? {}), false, 'Asia inherits the global no-rivers policy.');

const lakeNames = new Set(ASIA_WATER.lakes?.map((lake) => lake.name));
assert.ok(lakeNames.has('Caspian Sea'), 'Caspian Sea is retained as useful Asia orientation context.');
assert.ok(lakeNames.has('Lake Baikal'), 'Lake Baikal is retained as useful Asia orientation context.');
assert.equal('rivers' in ASIA_WATER, false, 'Generated Asia water contains no river layer.');

for (const id of [...ASIA_MAP_COUNTRY_IDS, 'EGY', 'RUS']) {
  assert.ok(ASIA_GEOMETRY[id], `Asia generated geometry contains ${id}.`);
}
assert.equal(Object.keys(ASIA_GEOMETRY).length, 50, 'Asia module contains 48 canonical targets plus Egypt and Russia context geometry.');
const locatorIds = Object.values(ASIA_GEOMETRY)
  .filter((geometry) => geometry.locator)
  .map((geometry) => geometry.countryId)
  .sort();
assert.deepEqual(locatorIds, ['BHR', 'MDV', 'SGP'], 'Initial visible locator policy is limited to Bahrain, Maldives and Singapore.');
const calloutIds = Object.values(ASIA_GEOMETRY)
  .filter((geometry) => geometry.callout)
  .map((geometry) => geometry.countryId)
  .sort();
assert.deepEqual(calloutIds, [], 'Asia starts without mainland leader-line callouts; QA must justify any later addition.');

for (const scopeId of ['asia', ...expectedRegionIds]) {
  assert.ok(ASIA_SCOPE_FOCUS[scopeId], `${scopeId} has deterministic generated focus.`);
}
assert.equal(ASIA_SCOPE_FOCUS['west-asia'], undefined, 'Hidden West Asia has no learner-facing map focus.');

function assertNeighbor(countryId, neighborId) {
  assert.ok(ASIA_LAND_ADJACENCY[countryId]?.includes(neighborId), `${countryId} has canonical land neighbour ${neighborId}.`);
}

for (const neighbor of ['RUS', 'MNG', 'KAZ', 'PRK']) assertNeighbor('CHN', neighbor);
for (const neighbor of ['RUS', 'CHN', 'KGZ', 'UZB', 'TKM']) assertNeighbor('KAZ', neighbor);
for (const neighbor of ['GEO', 'ARM', 'IRN', 'IRQ', 'SYR']) assertNeighbor('TUR', neighbor);
for (const neighbor of ['GEO', 'AZE', 'IRN', 'TUR']) assertNeighbor('ARM', neighbor);
assertNeighbor('IDN', 'TLS');
assertNeighbor('IDN', 'PNG');
assertNeighbor('EGY', 'ISR');

for (const [countryId, neighbors] of Object.entries(ASIA_LAND_ADJACENCY)) {
  assert.equal(neighbors.includes(countryId), false, `${countryId} never self-links.`);
  for (const neighborId of neighbors) {
    if (ASIA_LAND_ADJACENCY[neighborId]) {
      assert.ok(ASIA_LAND_ADJACENCY[neighborId].includes(countryId), `${countryId}<->${neighborId} adjacency is symmetric when both records ship in this module.`);
    }
  }
}
for (const id of ['BHR', 'CYP', 'JPN', 'LKA', 'MDV', 'PHL', 'SGP']) {
  assert.ok(ASIA_ZERO_LAND_NEIGHBOR_IDS.includes(id), `${id} is represented as a learnable zero-land-neighbour target.`);
}

const middleEastFlagRoute = parseRoutePath('/flags/asia/middle-east');
assert.deepEqual(middleEastFlagRoute, {
  name: 'learning',
  domain: 'flags',
  scope: { kind: 'region', id: 'middle-east', label: 'Middle East' },
});
assert.equal(serializeRoutePath(middleEastFlagRoute), '/flags/asia/middle-east');
const caucasusNeighborRoute = parseRoutePath('/neighbors/asia/caucasus');
assert.deepEqual(caucasusNeighborRoute, {
  name: 'learning',
  domain: 'neighbors',
  scope: { kind: 'region', id: 'caucasus', label: 'Caucasus' },
});
assert.equal(serializeRoutePath(caucasusNeighborRoute), '/neighbors/asia/caucasus');
assert.ok(parseRoutePath('/flags/asia/west-asia'), 'Legacy West Asia direct links remain parseable.');

const achievementModel = getContinentAchievementReadModel(createInitialAchievementState(), 'asia');
assert.ok(achievementModel);
assert.deepEqual(achievementModel.regionIds, expectedRegionIds, 'Asia mastery is built from the six learner-facing regions, not formal West Asia.');
assert.equal(achievementModel.completeCurriculum, true, 'Asia exposes a complete four-domain learner curriculum.');

const provenance = ASIA_CARTOGRAPHY_PROVENANCE;
assert.equal(provenance.upstream, 'nvkelso/natural-earth-vector');
assert.equal(provenance.upstreamCommit, 'ca96624a56bd078437bca8184e78163e5039ad19');
assert.equal(provenance.projection.name, 'd3.geoNaturalEarth1');
assert.equal(provenance.topology.quantization, 100000);
assert.equal(provenance.boundaryPolicy.scoredCountries, 48);
assert.match(provenance.boundaryPolicy.egypt, /Africa-owned EGY/);
assert.match(provenance.boundaryPolicy.russia, /Europe-owned RUS/);
assert.match(provenance.boundaryPolicy.caucasus, /excluded from Middle East/);
assert.match(provenance.boundaryPolicy.taiwan, /non-scoring source context/);
assert.match(provenance.boundaryPolicy.kashmir, /no handwritten override/);

const loaderSource = await readFile('src/data/maps/index.ts', 'utf8');
assert.ok(loaderSource.includes("import('./asia.js')"), 'Asia runtime geography is lazy-loaded by continent.');
const generatorConfig = await readFile('scripts/map-continent-configs.mjs', 'utf8');
assert.equal(/river/i.test(generatorConfig), false, 'Asia generation configuration introduces no river abstraction.');
const moduleStat = await stat('dist/data/maps/asia.js');
const moduleBytes = await readFile('dist/data/maps/asia.js');
const gzipBytes = gzipSync(moduleBytes, { level: 9 }).byteLength;
assert.equal(moduleStat.size, sizes.rawBytes);
assert.equal(gzipBytes, sizes.gzipBytes);

console.log(
  `Asia expansion verified: ${ASIA_MAP_COUNTRY_IDS.length} canonical countries, ${expectedRegionIds.length} learner regions, `
  + `Middle East ${MIDDLE_EAST_MAP_COUNTRY_IDS.length}, Caucasus ${CAUCASUS_MAP_COUNTRY_IDS.length}; `
  + `${sizes.rawBytes} raw / ${sizes.gzipBytes} gzip bytes.`,
);
