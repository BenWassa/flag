import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifyContinentContract } from './verify-continent-contract.mjs';

const EXPECTED_COUNTRY_IDS = [
  'ARG', 'BOL', 'BRA', 'CHL', 'COL', 'ECU',
  'GUY', 'PRY', 'PER', 'SUR', 'URY', 'VEN',
];

const EXPECTED_REGIONS = {
  andean: ['BOL', 'COL', 'ECU', 'PER', 'VEN'],
  'atlantic-south-america': ['BRA', 'GUY', 'SUR'],
  'southern-cone': ['ARG', 'CHL', 'PRY', 'URY'],
};

function sorted(values) {
  return [...values].sort();
}

const sizes = await verifyContinentContract({
  continentId: 'south-america',
  expectedCountryIds: EXPECTED_COUNTRY_IDS,
  expectedRegionIds: Object.keys(EXPECTED_REGIONS),
  expectedNeighborCountryIds: EXPECTED_COUNTRY_IDS,
  runtimeModulePath: 'dist/data/maps/south-america.js',
});

const mapScopes = await import('../dist/data/map-scopes.js');
const maps = await import('../dist/data/maps/index.js');
const neighbors = await import('../dist/data/neighbors/index.js');

for (const [regionId, expectedIds] of Object.entries(EXPECTED_REGIONS)) {
  assert.deepEqual(
    sorted(mapScopes.getMapScopeConfig(regionId)?.countryIds ?? []),
    sorted(expectedIds),
    `${regionId} keeps the locked Issue #24 membership.`,
  );
}

const continent = mapScopes.getMapContinentConfig('south-america');
assert.ok(continent, 'South America map configuration is registered.');
assert.deepEqual(sorted(continent.contextCountryIds ?? []), ['FRA', 'PAN']);
assert.equal(continent.countryIds.includes('TTO'), false, 'Trinidad and Tobago remains outside South America scoring.');

const asset = await maps.loadMapAsset('south-america');
assert.ok(asset, 'South America production map loads.');
assert.deepEqual(
  sorted(asset.contextCountries.map((country) => country.countryId)),
  ['FRA', 'PAN'],
  'Panama and sovereign France/French Guiana geometry are keyed non-scoring context.',
);
assert.ok(
  asset.water.lakes.some((lake) => lake.name === 'Lake Titicaca'),
  'Lake Titicaca is retained as restrained physical context.',
);
assert.equal('rivers' in asset.water, false, 'South America preserves the river-free runtime contract.');

for (const country of asset.countries) {
  assert.equal(country.locator, undefined, `${country.countryId} has no unapproved locator assistance.`);
  assert.equal(country.hitAssist, undefined, `${country.countryId} has no unapproved hit assistance.`);
  assert.equal(country.callout, undefined, `${country.countryId} has no unapproved callout assistance.`);
}

const adjacency = neighbors.SOUTH_AMERICA_LAND_ADJACENCY;
assert.deepEqual(sorted(adjacency.COL ?? []), ['BRA', 'ECU', 'PAN', 'PER', 'VEN']);
assert.deepEqual(sorted(adjacency.BOL ?? []), ['ARG', 'BRA', 'CHL', 'PRY', 'PER']);
assert.deepEqual(
  sorted(adjacency.BRA ?? []),
  ['ARG', 'BOL', 'COL', 'FRA', 'GUY', 'PRY', 'PER', 'SUR', 'URY', 'VEN'],
  'Brazil retains complete application-country land adjacency, including sovereign France via French Guiana.',
);
assert.ok((adjacency.SUR ?? []).includes('FRA'), 'Suriname retains its sovereign-France/French Guiana land border.');
assert.equal((adjacency.COL ?? []).includes('PAN'), true, 'Colombia ↔ Panama cross-continent adjacency is preserved.');

const loaderSource = await readFile('src/data/maps/index.ts', 'utf8');
assert.match(loaderSource, /'south-america': async \(\) =>/);
assert.match(loaderSource, /import\('\.\/south-america\.js'\)/, 'South America map data remains lazy-loaded.');

const provenance = JSON.parse(await readFile('docs/architecture/south-america-cartography-provenance.json', 'utf8'));
assert.equal(provenance.boundaryPolicy.scoredCountries, 12);
assert.match(provenance.boundaryPolicy.frenchGuiana, /non-scoring sovereign FRA context/i);
assert.match(provenance.boundaryPolicy.falklands, /non-scoring disputed context/i);
assert.match(provenance.boundaryPolicy.southernPatagonianIceField, /non-scoring undemarcated Argentina-Chile boundary context/i);
assert.match(provenance.boundaryPolicy.trinidadAndTobago, /not a South America scoring target/i);
assert.match(provenance.boundaryPolicy.crossContinentAdjacency, /COL-PAN/i);

console.log(
  `South America expansion verified: 12 countries, 5/3/4 regions, ${sizes.rawBytes} raw bytes / ${sizes.gzipBytes} gzip bytes.`,
);
