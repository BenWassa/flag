import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifyContinentContract } from './verify-continent-contract.mjs';

const EXPECTED_COUNTRY_IDS = ['AUS', 'NZL', 'FJI', 'PNG', 'SLB', 'VUT', 'KIR', 'MHL', 'FSM', 'NRU', 'PLW', 'WSM', 'TON', 'TUV'];
const EXPECTED_REGIONS = {
  'australia-new-zealand': ['AUS', 'NZL'],
  melanesia: ['FJI', 'PNG', 'SLB', 'VUT'],
  micronesia: ['KIR', 'MHL', 'FSM', 'NRU', 'PLW'],
  polynesia: ['WSM', 'TON', 'TUV'],
};
const EXPECTED_ZERO_NEIGHBOR_IDS = ['AUS', 'NZL', 'FJI', 'SLB', 'VUT', 'KIR', 'MHL', 'FSM', 'NRU', 'PLW', 'WSM', 'TON', 'TUV'];
const EXPECTED_HIT_ASSIST_IDS = ['FJI', 'SLB', 'VUT', 'KIR', 'MHL', 'FSM', 'NRU', 'PLW', 'WSM', 'TON', 'TUV'];

function sorted(values) { return [...values].sort(); }
function maxSegmentDx(path) {
  let max = 0;
  for (const subpath of path.split('M').filter(Boolean)) {
    const points = [...subpath.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    for (let i = 1; i < points.length; i += 1) max = Math.max(max, Math.abs(points[i][0] - points[i - 1][0]));
  }
  return max;
}

const sizes = await verifyContinentContract({
  continentId: 'oceania',
  expectedCountryIds: EXPECTED_COUNTRY_IDS,
  expectedRegionIds: Object.keys(EXPECTED_REGIONS),
  expectedNeighborCountryIds: EXPECTED_COUNTRY_IDS,
  runtimeModulePath: '.verify-dist/data/maps/oceania.js',
  maxRawBytes: 900_000,
  maxGzipBytes: 210_000,
});

const mapScopes = await import('../.verify-dist/data/map-scopes.js');
const maps = await import('../.verify-dist/data/maps/index.js');
const neighbors = await import('../.verify-dist/data/neighbors/index.js');
const support = await import('../.verify-dist/domain/scope-support.js');
const learningScopes = await import('../.verify-dist/data/learning-scopes.js');
const achievements = await import('../.verify-dist/domain/achievements.js');

for (const [regionId, expectedIds] of Object.entries(EXPECTED_REGIONS)) {
  const config = mapScopes.getMapScopeConfig(regionId);
  assert.ok(config, `${regionId} is registered.`);
  assert.deepEqual(sorted(config.countryIds), sorted(expectedIds));
  assert.deepEqual(sorted(learningScopes.countryIdsForLearningScope(config.scope)), sorted(expectedIds));
  for (const domain of ['flags', 'locations', 'outlines', 'neighbors']) {
    assert.equal(support.scopeSupportsDomain(config.scope, domain), true, `${regionId} supports ${domain}.`);
    assert.deepEqual(sorted(support.countryIdsForSupportedScope(config.scope, domain)), sorted(expectedIds));
  }
  assert.equal(achievements.regionHasCompleteCurriculum(regionId), true);
  assert.equal(achievements.isFullRegionPlayLaunch(config.scope, 'test'), true);
  assert.equal(achievements.coveredFullRegion(expectedIds, expectedIds), true);
  assert.equal(achievements.coveredFullRegion(expectedIds, expectedIds.slice(0, -1)), false);
}
assert.equal(achievements.continentHasCompleteCurriculum('oceania'), true);
assert.equal(achievements.worldHasCompleteCurriculum(), true, 'On the intentional #22 stack, Oceania completes the currently intended world curriculum.');

const oceania = mapScopes.getMapContinentConfig('oceania');
assert.ok(oceania);
assert.deepEqual(oceania.contextCountryIds, ['IDN']);

const asset = await maps.loadMapAsset('oceania');
assert.ok(asset);
assert.deepEqual(asset.contextCountries.map((item) => item.countryId), ['IDN']);
assert.equal('rivers' in asset.water, false);

const adjacency = neighbors.OCEANIA_LAND_ADJACENCY;
assert.deepEqual(adjacency.PNG, ['IDN'], 'PNG keeps its cross-continent Indonesia land border.');
assert.deepEqual(sorted(neighbors.OCEANIA_ZERO_LAND_NEIGHBOR_IDS), sorted(EXPECTED_ZERO_NEIGHBOR_IDS));
for (const id of EXPECTED_ZERO_NEIGHBOR_IDS) assert.deepEqual(adjacency[id], [], `${id} has a truthful empty land-neighbour set.`);
assert.equal((adjacency.FJI ?? []).includes('VUT'), false, 'No maritime Melanesia adjacency is invented.');
assert.equal((adjacency.WSM ?? []).includes('TON'), false, 'No maritime Polynesia adjacency is invented.');
assert.equal((neighbors.ASIA_LAND_ADJACENCY.IDN ?? []).includes('PNG'), true, 'The reciprocal IDN-PNG global edge survives learner-continent ownership.');

for (const id of ['NZL', 'PNG', 'FJI', 'SLB', 'VUT', 'KIR', 'FSM', 'MHL', 'TUV']) {
  const geometry = asset.countries.find((country) => country.countryId === id);
  assert.ok(geometry?.path, `${id} keeps canonical scored geometry.`);
  assert.ok((geometry.path.match(/M/g) ?? []).length >= 2, `${id} retains multipart canonical identity.`);
}
const kiribati = asset.countries.find((country) => country.countryId === 'KIR');
assert.ok(kiribati?.path);
assert.ok(maxSegmentDx(kiribati.path) < 250, 'Kiribati has no false world-spanning projected segment.');

const assisted = asset.countries.filter((country) => country.hitAssist || country.locator || country.callout).map((country) => country.countryId);
assert.deepEqual(sorted(assisted), sorted(EXPECTED_HIT_ASSIST_IDS), 'Only phone-audited small-island targets receive assistance.');
for (const id of EXPECTED_HIT_ASSIST_IDS) {
  const geometry = asset.countries.find((country) => country.countryId === id);
  assert.ok(geometry?.hitAssist, `${id} has invisible hit assistance.`);
  assert.equal(geometry.locator, undefined, `${id} does not gain a visible locator.`);
  assert.equal(geometry.callout, undefined, `${id} does not gain a callout.`);
}
for (const id of ['AUS', 'NZL', 'PNG']) {
  const geometry = asset.countries.find((country) => country.countryId === id);
  assert.equal(geometry?.hitAssist, undefined, `${id} remains real-polygon only.`);
}
assert.deepEqual(asset.insets, [], 'No true-scale Pacific inset is needed after audited hit assistance.');

const loaderSource = await readFile('src/data/maps/index.ts', 'utf8');
assert.match(loaderSource, /oceania: async \(\) =>/);
assert.match(loaderSource, /import\('\.\/oceania\.js'\)/, 'Oceania remains lazy-loaded.');
const viteSource = await readFile('vite.config.ts', 'utf8');
assert.match(viteSource, /assets\/oceania-\*\.js/, 'Oceania lazy geography is excluded from service-worker precache.');

const configSource = (await readFile('scripts/map-continent-configs.mjs', 'utf8')).toLowerCase();
for (const term of ['new caledonia', 'french polynesia', 'guam', 'northern mariana', 'american samoa', 'cook islands', 'niue']) {
  assert.ok(configSource.includes(term), `Territory policy explicitly records ${term}.`);
}

const provenance = JSON.parse(await readFile('docs/architecture/oceania-cartography-provenance.json', 'utf8'));
assert.equal(provenance.boundaryPolicy.scoredCountries, 14);
assert.deepEqual(provenance.projection.rotate, [-160, 0, 0]);
assert.match(provenance.boundaryPolicy.antimeridian, /rendering seam/i);
assert.match(provenance.boundaryPolicy.indonesia, /PNG-IDN/i);
const kiribatiSourceAudit = provenance.geographicAudit?.KIR;
assert.ok(kiribatiSourceAudit, 'Generator-owned provenance carries a Kiribati source-geography audit.');
assert.ok(kiribatiSourceAudit.longitude.min < -170 && kiribatiSourceAudit.longitude.max > 170, 'Canonical Kiribati source geometry exists on both sides of the antimeridian.');
assert.ok(kiribatiSourceAudit.componentsEastOf170 > 0 && kiribatiSourceAudit.componentsWestOfMinus170 > 0, 'Kiribati retains polygon components east and west of the antimeridian.');
assert.equal(kiribatiSourceAudit.duplicateComponentCount, 0, 'Kiribati source components are not duplicated by the generator.');
assert.ok(provenance.topology.coordinateCountAfter < provenance.topology.coordinateCountBefore);

const generatedSource = await readFile('src/data/maps/oceania.ts', 'utf8');
assert.equal(/river/i.test(generatedSource), false);

console.log(`Oceania expansion verified: 14 countries, 2/4/5/3 regions, ${sizes.rawBytes} raw bytes / ${sizes.gzipBytes} gzip bytes.`);
