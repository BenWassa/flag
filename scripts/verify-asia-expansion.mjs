import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import {
  ASIA_MAP_COUNTRY_IDS,
  ASIA_MAP_REGION_CONFIGS,
  CAUCASUS_MAP_COUNTRY_IDS,
  MIDDLE_EAST_MAP_COUNTRY_IDS,
} from '../.verify-dist/data/map-scopes.js';
import {
  CAUCASUS_LEARNING_COUNTRY_IDS,
  MIDDLE_EAST_LEARNING_COUNTRY_IDS,
  countryIdsForLearningScope,
  getLearningScopeDefinition,
  regionLearningScopes,
} from '../.verify-dist/data/learning-scopes.js';
import { COUNTRY_BY_ID } from '../.verify-dist/data/countries.js';
import { loadMapAsset } from '../.verify-dist/data/maps/index.js';
import {
  ASIA_LAND_ADJACENCY,
  ASIA_ZERO_LAND_NEIGHBOR_IDS,
} from '../.verify-dist/data/neighbors/index.js';
import {
  ASIA_CARTOGRAPHY_PROVENANCE,
  ASIA_GEOMETRY,
  ASIA_SCOPE_FOCUS,
  ASIA_WATER,
} from '../.verify-dist/data/maps/asia.js';
import {
  createInitialAchievementState,
  getContinentAchievementReadModel,
} from '../.verify-dist/domain/achievements.js';
import { scopeSupportsDomain, countryIdsForSupportedScope } from '../.verify-dist/domain/scope-support.js';
import { parseRoutePath, serializeRoutePath } from '../.verify-dist/routing/routes.js';
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
  runtimeModulePath: '.verify-dist/data/maps/asia.js',
  maxRawBytes: 3_100_000,
  maxGzipBytes: 500_000,
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
assert.equal(asiaAsset.maxZoom, 8, 'Asia exposes its evidence-based zoom ceiling through generic map metadata.');
assert.deepEqual(middleEastAsset.insets, [], 'Middle East has no question-triggered Levant popup.');

const lakeNames = new Set(ASIA_WATER.lakes?.map((lake) => lake.name));
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
assert.deepEqual(locatorIds, [], 'Asia keeps canonical small-country polygons instead of substituting visible locators.');
const hitAssistIds = Object.values(ASIA_GEOMETRY)
  .filter((geometry) => geometry.hitAssist)
  .map((geometry) => geometry.countryId)
  .sort();
assert.deepEqual(hitAssistIds, ['BHR', 'BRN', 'ISR', 'KWT', 'LBN', 'MDV', 'PSE', 'QAT', 'SGP']);
const markerIds = Object.values(ASIA_GEOMETRY)
  .filter((geometry) => geometry.marker)
  .map((geometry) => geometry.countryId)
  .sort();
assert.deepEqual(markerIds, ['BHR', 'BRN', 'MDV', 'SGP'], 'Only the audited island/split-island set receives a restrained perceptual marker.');
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
assert.deepEqual(provenance.canonicalSourceGeometryMerges.CYP.map((item) => item.pattern), ['^Northern Cyprus$', '^Cyprus No Mans Area$']);
assert.match(provenance.boundaryPolicy.cyprus, /Northern Cyprus and Cyprus No Mans Area/);
assert.match(provenance.boundaryPolicy.sovereignBaseAreas, /Akrotiri and Dhekelia/);
assert.match(provenance.boundaryPolicy.assistance, /no Asia question-triggered inset/);
assert.match(provenance.boundaryPolicy.physicalWater, /Caspian requested only if present/);

const globeProvenance = JSON.parse(await readFile('src/data/globe/provenance.json', 'utf8'));
assert.deepEqual(globeProvenance.canonicalSourceGeometryMerges, provenance.canonicalSourceGeometryMerges, 'Projected and spherical generators publish the same canonical Cyprus source-reconciliation policy.');
const outlineSource = await readFile('src/data/outlines.ts', 'utf8');
assert.match(outlineSource, /loadMapAsset/, 'Outlines continue to consume canonical generated map geometry, including corrected CYP.');
const mapRendererSource = await readFile('src/ui/components/map.ts', 'utf8');
assert.doesNotMatch(mapRendererSource, /!session\.targets\[countryId\]\?\.resolved/, 'A country resolved earlier in the round remains selectable against a later target.');
assert.match(mapRendererSource, /data-map-max-zoom=\"\$\{asset\.maxZoom \?\? 5\.5\}\"/, 'The renderer consumes generic asset maxZoom metadata.');
const loaderSource = await readFile('src/data/maps/index.ts', 'utf8');
assert.ok(loaderSource.includes("import('./asia.js')"), 'Asia runtime geography is lazy-loaded by continent.');
const generatorConfig = await readFile('scripts/map-continent-configs.mjs', 'utf8');
assert.equal(
  /\brivers?\s*:/i.test(generatorConfig) || /ne_\d+m_rivers/i.test(generatorConfig),
  false,
  'Asia generation configuration introduces no river layer or abstraction.',
);
// Issue #116. Asia had no fitExcludeCountryIds, so its canvas was fitted around
// Russia's trans-antimeridian geometry even though Russia is non-scoring Asia
// context. Because max zoom is defined relative to the canvas, that under-scaled
// every Asian country by 2.31x even at full pinch. Russia leaves the fit only —
// it stays rendered as context and inside every frame it borders.
const asiaConfig = generatorConfig.slice(generatorConfig.indexOf('ASIA_MAP_GENERATION_CONFIG'));
const asiaFitExclude = asiaConfig.match(/fitExcludeCountryIds: Object\.freeze\(\[([^\]]*)\]/);
assert.ok(asiaFitExclude, 'Asia declares fitExcludeCountryIds.');
assert.match(asiaFitExclude[1], /'RUS'/, 'Asia excludes Russia from its viewport fit.');
assert.doesNotMatch(
  asiaConfig,
  /focusExcludeCountryIds/,
  'Russia leaves the Asia fit only; opening frames still include the context it borders.',
);
assert.doesNotMatch(
  generatorConfig,
  /fitContextCountryIds/,
  'The unread fitContextCountryIds entry stays removed rather than implying behaviour the generator never had.',
);

// The gain is only real if it survives into the generated geometry, so the
// scored small-country floor is asserted against measured canvas extents.
const SMALL_COUNTRY_FLOOR = {
  CYP: 3.5, LBN: 7.0, QAT: 5.0, ISR: 7.5, KWT: 10.0, ARM: 15.0, BHR: 2.5,
};
for (const [id, floor] of Object.entries(SMALL_COUNTRY_FLOOR)) {
  const path = ASIA_GEOMETRY[id]?.path ?? ASIA_GEOMETRY[id]?.outlinePath ?? '';
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const [, x, y] of path.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)) {
    minX = Math.min(minX, Number(x)); maxX = Math.max(maxX, Number(x));
    minY = Math.min(minY, Number(y)); maxY = Math.max(maxY, Number(y));
  }
  const smallest = Math.min(maxX - minX, maxY - minY);
  assert.ok(
    smallest >= floor,
    `${id} keeps the canvas extent the Asia fit policy buys it (${smallest.toFixed(1)} < ${floor}).`,
  );
}

const moduleStat = await stat('.verify-dist/data/maps/asia.js');
const moduleBytes = await readFile('.verify-dist/data/maps/asia.js');
const gzipBytes = gzipSync(moduleBytes, { level: 9 }).byteLength;
assert.equal(moduleStat.size, sizes.rawBytes);
assert.equal(gzipBytes, sizes.gzipBytes);

console.log(
  `Asia expansion verified: ${ASIA_MAP_COUNTRY_IDS.length} canonical countries, ${expectedRegionIds.length} learner regions, `
  + `Middle East ${MIDDLE_EAST_MAP_COUNTRY_IDS.length}, Caucasus ${CAUCASUS_MAP_COUNTRY_IDS.length}; `
  + `${sizes.rawBytes} raw / ${sizes.gzipBytes} gzip bytes.`,
);
