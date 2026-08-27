import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifyContinentContract } from './verify-continent-contract.mjs';

const EXPECTED_REGIONS = {
  'northern-europe': ['DNK', 'EST', 'FIN', 'ISL', 'IRL', 'LVA', 'LTU', 'NOR', 'SWE', 'GBR'],
  'western-europe': ['AUT', 'BEL', 'FRA', 'DEU', 'LIE', 'LUX', 'MCO', 'NLD', 'CHE'],
  'eastern-europe': ['BLR', 'BGR', 'CZE', 'HUN', 'MDA', 'POL', 'ROU', 'RUS', 'SVK', 'UKR'],
  'southern-europe': [
    'ALB', 'AND', 'BIH', 'HRV', 'GRC', 'ITA', 'MLT', 'MNE', 'MKD', 'PRT',
    'SMR', 'SRB', 'SVN', 'ESP', 'VAT',
  ],
};

const EXPECTED_COUNTRY_IDS = Object.values(EXPECTED_REGIONS).flat();
const CONTEXT_COUNTRY_IDS = ['ARM', 'AZE', 'CYP', 'GEO', 'TUR'];
const CALLOUT_MICROSTATES = ['AND', 'LIE', 'LUX', 'MCO', 'SMR', 'VAT'];

function sorted(values) {
  return [...values].sort();
}

// Europe's canonical whole-country RUS/NOR geometry keeps its lazy chunk above
// the Africa-calibrated shared default even after physical-context tuning.
// The budget is gated here so the payload cannot grow back silently.
const sizes = await verifyContinentContract({
  continentId: 'europe',
  expectedCountryIds: EXPECTED_COUNTRY_IDS,
  expectedRegionIds: Object.keys(EXPECTED_REGIONS),
  expectedNeighborCountryIds: EXPECTED_COUNTRY_IDS,
  runtimeModulePath: '.verify-dist/data/maps/europe.js',
  maxRawBytes: 1_750_000,
  maxGzipBytes: 440_000,
});

const mapScopes = await import('../.verify-dist/data/map-scopes.js');
const maps = await import('../.verify-dist/data/maps/index.js');
const neighbors = await import('../.verify-dist/data/neighbors/index.js');

assert.equal(EXPECTED_COUNTRY_IDS.length, 44, 'Europe ships the locked Issue #25 44-country curriculum.');

for (const [regionId, expectedIds] of Object.entries(EXPECTED_REGIONS)) {
  assert.deepEqual(
    sorted(mapScopes.getMapScopeConfig(regionId)?.countryIds ?? []),
    sorted(expectedIds),
    `${regionId} keeps the locked Issue #25 membership.`,
  );
}

const continent = mapScopes.getMapContinentConfig('europe');
assert.ok(continent, 'Europe map configuration is registered.');
assert.deepEqual(
  sorted(continent.contextCountryIds ?? []),
  CONTEXT_COUNTRY_IDS,
  'Türkiye, Cyprus and the Caucasus stay keyed non-scoring context.',
);
for (const contextId of CONTEXT_COUNTRY_IDS) {
  assert.equal(
    continent.countryIds.includes(contextId),
    false,
    `${contextId} is context only and never a Europe scoring target.`,
  );
}
assert.equal(continent.countryIds.includes('RUS'), true, 'Russia remains one canonical Europe-scored country.');
assert.equal(continent.countryIds.includes('XKX'), false, 'Kosovo has no Atlas application-country target.');

const asset = await maps.loadMapAsset('europe');
assert.ok(asset, 'Europe production map loads.');
assert.deepEqual(
  sorted(asset.contextCountries.map((country) => country.countryId)),
  CONTEXT_COUNTRY_IDS,
  'Europe keys exactly the documented sovereign context geometry.',
);
assert.ok(
  asset.water.lakes.some((lake) => lake.name === 'Lake Ladoga'),
  'Lake Ladoga is retained as restrained physical context.',
);
assert.equal('rivers' in asset.water, false, 'Europe preserves the river-free runtime contract.');

// Phone-scale readability assistance is explicitly bounded: only the audited
// microstates may carry a callout, and only Malta may carry an island locator.
const byId = new Map(asset.countries.map((country) => [country.countryId, country]));
for (const microstateId of CALLOUT_MICROSTATES) {
  assert.ok(byId.get(microstateId)?.callout, `${microstateId} keeps its audited mainland callout.`);
  assert.equal(byId.get(microstateId)?.locator, undefined, `${microstateId} uses a callout rather than an island locator.`);
}
assert.ok(byId.get('MLT')?.locator, 'Malta keeps the island locator.');
assert.equal(byId.get('MLT')?.callout, undefined, 'Malta does not double up locator and callout assistance.');
for (const country of asset.countries) {
  if (!CALLOUT_MICROSTATES.includes(country.countryId)) {
    assert.equal(country.callout, undefined, `${country.countryId} has no unapproved callout assistance.`);
  }
  if (country.countryId !== 'MLT') {
    assert.equal(country.locator, undefined, `${country.countryId} has no unapproved locator assistance.`);
  }
  assert.equal(country.hitAssist, undefined, `${country.countryId} has no unapproved hit assistance.`);
}

const adjacency = neighbors.EUROPE_LAND_ADJACENCY;
assert.deepEqual(
  sorted(Object.keys(adjacency)),
  sorted(EXPECTED_COUNTRY_IDS),
  'Europe adjacency covers the whole curriculum, so every country is a teachable Neighbours target.',
);
assert.deepEqual(sorted(adjacency.CHE ?? []), sorted(['AUT', 'DEU', 'FRA', 'ITA', 'LIE']));
assert.deepEqual(sorted(adjacency.VAT ?? []), ['ITA'], 'Vatican City keeps its single enclave border.');
assert.deepEqual(sorted(adjacency.SMR ?? []), ['ITA'], 'San Marino keeps its single enclave border.');
assert.deepEqual(adjacency.ISL ?? [], [], 'Iceland is a truthful zero-land-neighbour island.');
assert.deepEqual(adjacency.MLT ?? [], [], 'Malta is a truthful zero-land-neighbour island.');
assert.ok((adjacency.ESP ?? []).includes('MAR'), 'Spain keeps its cross-continent Morocco land border.');
assert.ok((adjacency.RUS ?? []).includes('CHN'), 'Russia keeps complete cross-continent adjacency.');
assert.ok((adjacency.FRA ?? []).includes('BRA'), 'France keeps its sovereign French Guiana land borders.');
assert.deepEqual(
  sorted(neighbors.EUROPE_ZERO_LAND_NEIGHBOR_IDS),
  ['ISL', 'MLT'],
  'Europe declares exactly the two island members with no land neighbours.',
);
const westernEurope = neighbors.getNeighborScopeConfig('western-europe');
assert.ok(westernEurope, 'Europe regions resolve through the shared Neighbours scope seam.');
assert.deepEqual(
  sorted(westernEurope.countryIds),
  sorted(EXPECTED_REGIONS['western-europe']),
  'Europe Neighbours withholds no region members, because its adjacency is complete.',
);

const loaderSource = await readFile('src/data/maps/index.ts', 'utf8');
assert.match(loaderSource, /europe: async \(\) =>/);
assert.match(loaderSource, /import\('\.\/europe\.js'\)/, 'Europe map data remains lazy-loaded.');

const generatorConfig = await readFile('scripts/map-continent-configs.mjs', 'utf8');
const provenance = JSON.parse(await readFile('docs/architecture/europe-cartography-provenance.json', 'utf8'));
assert.equal(provenance.boundaryPolicy.scoredCountries, 44);
assert.match(provenance.boundaryPolicy.russia, /one canonical whole-country RUS geometry/i);
assert.match(provenance.boundaryPolicy.france, /one canonical whole-country FRA geometry/i);
assert.match(provenance.boundaryPolicy.microstates, /canonical polygon geometry is retained/i);
assert.match(provenance.boundaryPolicy.kosovo, /no Atlas application-country target/i);
assert.match(provenance.boundaryPolicy.crossContinentAdjacency, /complete RUS/i);

// Issue #115. Bonaire, Curacao, Saba and St Eustatius are 0.58% of the
// Netherlands' projected area yet used to set both the west and south edge of
// the Western Europe frame, costing that round 3.34x linearly. NLD now leaves
// Europe's viewport fit and focus exactly as FRA and NOR already do. Framing on
// mainland geography is asserted through the generated focus, so a regenerated
// canvas cannot quietly reach back across the Atlantic.
const europeConfig = generatorConfig.slice(
  generatorConfig.indexOf('EUROPE_MAP_GENERATION_CONFIG'),
  generatorConfig.indexOf('ASIA_MAP_GENERATION_CONFIG'),
);
for (const list of ['fitExcludeCountryIds', 'focusExcludeCountryIds']) {
  const declared = europeConfig.match(new RegExp(`${list}: Object\\.freeze\\(\\[([^\\]]*)\\]`));
  assert.ok(declared, `Europe declares ${list}.`);
  assert.match(declared[1], /'NLD'/, `Europe excludes the Netherlands' Caribbean parts from its ${list}.`);
}

const { EUROPE_SCOPE_FOCUS } = await import('../.verify-dist/data/maps/europe.js');
const westernEuropeFocus = EUROPE_SCOPE_FOCUS['western-europe'];
const europeFocus = EUROPE_SCOPE_FOCUS.europe;
assert.ok(
  westernEuropeFocus.x > 0,
  'Western Europe no longer frames from the canvas edge, which is where the Caribbean parts sat.',
);
assert.ok(
  westernEuropeFocus.width < europeFocus.width * 0.45,
  'Western Europe frames its mainland rather than most of the continent '
  + `(${westernEuropeFocus.width} of ${europeFocus.width} canvas units).`,
);

console.log(
  `Europe expansion verified: 44 countries, 10/9/10/15 regions, audited microstate assistance, mainland Western Europe framing, ${sizes.rawBytes} raw bytes / ${sizes.gzipBytes} gzip bytes.`,
);
