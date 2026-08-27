import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifyContinentContract } from './verify-continent-contract.mjs';

const EXPECTED_COUNTRY_IDS = [
  'CAN', 'USA',
  'BLZ', 'CRI', 'SLV', 'GTM', 'HND', 'MEX', 'NIC', 'PAN',
  'ATG', 'BHS', 'BRB', 'CUB', 'DMA', 'DOM', 'GRD', 'HTI', 'JAM', 'KNA', 'LCA', 'VCT', 'TTO',
];
const EXPECTED_REGIONS = {
  'northern-america': ['CAN', 'USA'],
  'central-america': ['BLZ', 'CRI', 'SLV', 'GTM', 'HND', 'MEX', 'NIC', 'PAN'],
  caribbean: ['ATG', 'BHS', 'BRB', 'CUB', 'DMA', 'DOM', 'GRD', 'HTI', 'JAM', 'KNA', 'LCA', 'VCT', 'TTO'],
};
const EXPECTED_ZERO_NEIGHBOR_IDS = ['ATG', 'BHS', 'BRB', 'CUB', 'DMA', 'GRD', 'JAM', 'KNA', 'LCA', 'VCT', 'TTO'];
const EXPECTED_HIT_ASSIST_IDS = ['BHS', 'BLZ', 'DOM', 'HTI', 'JAM', 'SLV', 'TTO'];
const EXPECTED_CONTEXT_COUNTRY_IDS = ['COL', 'FRA', 'NLD', 'VEN'];
const EXPECTED_LAKES = ['Lake Erie', 'Lake Huron', 'Lake Michigan', 'Lake Ontario', 'Lake Superior'];

function sorted(values) {
  return [...values].sort();
}

const sizes = await verifyContinentContract({
  continentId: 'north-america',
  expectedCountryIds: EXPECTED_COUNTRY_IDS,
  expectedRegionIds: Object.keys(EXPECTED_REGIONS),
  expectedNeighborCountryIds: EXPECTED_COUNTRY_IDS,
  runtimeModulePath: '.verify-dist/data/maps/north-america.js',
  maxRawBytes: 2_100_000,
  maxGzipBytes: 400_000,
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
  assert.deepEqual(sorted(config.countryIds), sorted(expectedIds), `${regionId} keeps the locked Issue #22 membership.`);
  assert.deepEqual(
    sorted(learningScopes.countryIdsForLearningScope(config.scope)),
    sorted(expectedIds),
    `${regionId} Flags membership comes from the same learner scope.`,
  );
  for (const domain of ['flags', 'locations', 'outlines', 'neighbors']) {
    assert.equal(support.scopeSupportsDomain(config.scope, domain), true, `${regionId} supports ${domain}.`);
    assert.deepEqual(
      sorted(support.countryIdsForSupportedScope(config.scope, domain)),
      sorted(expectedIds),
      `${regionId} ${domain} membership is exact.`,
    );
  }
  assert.equal(achievements.regionHasCompleteCurriculum(regionId), true, `${regionId} has complete four-domain Mastery support.`);
}
assert.equal(achievements.continentHasCompleteCurriculum('north-america'), true, 'North America qualifies as a complete four-domain continent curriculum.');

const northAmerica = mapScopes.getMapContinentConfig('north-america');
assert.ok(northAmerica);
assert.deepEqual(sorted(northAmerica.contextCountryIds ?? []), sorted(EXPECTED_CONTEXT_COUNTRY_IDS));

const asset = await maps.loadMapAsset('north-america');
assert.ok(asset, 'North America production map loads.');
assert.deepEqual(sorted(asset.contextCountries.map((country) => country.countryId)), sorted(EXPECTED_CONTEXT_COUNTRY_IDS));
assert.ok((asset.contextPaths ?? []).length >= 10, 'Audited non-scoring dependencies/territories remain available as context paths.');
assert.deepEqual(sorted((asset.water.lakes ?? []).map((lake) => lake.name)), sorted(EXPECTED_LAKES));
assert.equal('rivers' in asset.water, false, 'North America preserves the river-free runtime contract.');

const hitAssistIds = asset.countries.filter((country) => country.hitAssist).map((country) => country.countryId);
assert.deepEqual(sorted(hitAssistIds), sorted(EXPECTED_HIT_ASSIST_IDS), 'Invisible hit assistance is limited to the audited inventory.');
for (const country of asset.countries) {
  assert.equal(country.locator, undefined, `${country.countryId} has no permanent visible locator.`);
  assert.equal(country.callout, undefined, `${country.countryId} has no leader-line callout.`);
}

const insetInventory = Object.fromEntries((asset.insets ?? []).map((inset) => [inset.id, sorted(inset.countryIds)]));
assert.deepEqual(insetInventory, {
  'northern-lesser-antilles': ['ATG', 'KNA'],
  'windward-islands-north': ['DMA', 'LCA'],
  'windward-islands-south': ['BRB', 'GRD', 'VCT'],
});
for (const inset of asset.insets ?? []) {
  assert.ok(inset.size.width <= 260 && inset.size.height <= 260, `${inset.id} stays within the shipped mobile inset ceiling.`);
  assert.equal(inset.marks.length, inset.countryIds.length, `${inset.id} has one truthful mark per scored member.`);
}

// Canonical whole-country Outlines: archipelagic countries keep every generated
// component instead of being reduced to an arbitrary island or assistance mark.
for (const id of ['BHS', 'ATG', 'KNA', 'VCT', 'TTO']) {
  const geometry = asset.countries.find((country) => country.countryId === id);
  assert.ok(geometry?.path, `${id} keeps canonical scored polygon geometry.`);
  const moveCount = (geometry.path.match(/M/g) ?? []).length;
  assert.ok(moveCount >= 2, `${id} retains multipart geometry (${moveCount} components in the runtime path).`);
}

const adjacency = neighbors.NORTH_AMERICA_LAND_ADJACENCY;
assert.deepEqual(sorted(adjacency.CAN ?? []), ['USA']);
assert.deepEqual(sorted(adjacency.USA ?? []), ['CAN', 'MEX']);
assert.deepEqual(sorted(adjacency.MEX ?? []), ['BLZ', 'GTM', 'USA']);
assert.deepEqual(sorted(adjacency.GTM ?? []), ['BLZ', 'HND', 'MEX', 'SLV']);
assert.deepEqual(sorted(adjacency.PAN ?? []), ['COL', 'CRI'], 'Panama keeps cross-continent Colombia adjacency.');
assert.deepEqual(sorted(adjacency.HTI ?? []), ['DOM']);
assert.deepEqual(sorted(adjacency.DOM ?? []), ['HTI']);
assert.deepEqual(sorted(neighbors.NORTH_AMERICA_ZERO_LAND_NEIGHBOR_IDS), sorted(EXPECTED_ZERO_NEIGHBOR_IDS));
for (const id of EXPECTED_ZERO_NEIGHBOR_IDS) {
  assert.deepEqual(adjacency[id], [], `${id} has an explicit truthful zero-land-neighbour record.`);
}
assert.equal((adjacency.CUB ?? []).includes('JAM'), false, 'No Cuba-Jamaica maritime neighbour is invented.');
assert.equal((neighbors.SOUTH_AMERICA_LAND_ADJACENCY.COL ?? []).includes('PAN'), true, 'The reciprocal COL-PAN global edge survives continent ownership.');

// #108 integrity applies to every new region: only coverage of the complete
// supported target set can qualify a Play result for the perfect-run streak.
for (const [regionId, expectedIds] of Object.entries(EXPECTED_REGIONS)) {
  const scope = { kind: 'region', id: regionId, label: mapScopes.getMapScopeConfig(regionId).scope.label };
  assert.equal(achievements.isFullRegionPlayLaunch(scope, 'test'), true);
  assert.equal(achievements.coveredFullRegion(expectedIds, expectedIds), true);
  assert.equal(achievements.coveredFullRegion(expectedIds, expectedIds.slice(0, -1)), false, `${regionId} sampled practice cannot qualify Mastery.`);
}

const loaderSource = await readFile('src/data/maps/index.ts', 'utf8');
assert.match(loaderSource, /'north-america': async \(\) =>/);
assert.match(loaderSource, /import\('\.\/north-america\.js'\)/, 'North America remains a lazy geography chunk.');

const rendererSource = await readFile('src/ui/components/map.ts', 'utf8');
assert.ok(
  rendererSource.indexOf('${assistHitLayer()}') < rendererSource.indexOf('<g class="map-active-countries">'),
  'Assisted hit surfaces paint below real country polygons so real geography wins hit precedence.',
);
assert.match(rendererSource, /clip-path="url\(#map-target-hit-clip\)"/, 'Question-specific invisible hit assistance is clipped away from other geometry.');

const configSource = await readFile('scripts/map-continent-configs.mjs', 'utf8');
for (const policyTerm of ['greenland', 'bermuda', 'saint pierre', 'puerto rico', 'british virgin', 'cura', 'guantanamo', 'united states minor outlying islands']) {
  assert.ok(configSource.toLowerCase().includes(policyTerm), `Territory policy explicitly records ${policyTerm}.`);
}
assert.match(configSource, /fitCountryBounds:[\s\S]*USA:[\s\S]*minLon: -170/, 'USA remote multipart geometry is excluded from fit by generated policy, not edited geometry.');
assert.match(configSource, /focusMinimumByScope:[\s\S]*'central-america'[\s\S]*caribbean/, 'Dense regions use explicit first-view minima rather than bespoke CSS offsets.');

const provenance = JSON.parse(await readFile('docs/architecture/north-america-cartography-provenance.json', 'utf8'));
assert.equal(provenance.boundaryPolicy.scoredCountries, 23);
assert.match(provenance.boundaryPolicy.southAmericaContext, /PAN-COL adjacency remains global/i);
assert.match(provenance.boundaryPolicy.usMinorOutlyingIslands, /excluded/i);
assert.match(provenance.boundaryPolicy.assistance, /BHS\/BLZ\/DOM\/HTI\/JAM\/SLV\/TTO/i);
assert.equal(provenance.topology.coordinateCountAfter, 110143);
assert.ok(provenance.topology.coordinateCountAfter < provenance.topology.coordinateCountBefore);

const generatedSource = await readFile('src/data/maps/north-america.ts', 'utf8');
assert.equal(/river/i.test(generatedSource), false, 'Generated North America module contains no river layer or label.');

console.log(
  `North America expansion verified: 23 countries, 2/8/13 regions, ${sizes.rawBytes} raw bytes / ${sizes.gzipBytes} gzip bytes.`,
);
