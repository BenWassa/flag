// Issue #227 — the shared initial-fit contract.
//
// Canonical country geometry is not the same thing as the envelope a scope
// opens on. These assertions guard that separation: one generic, scope-stable
// rule may keep a country's remote subordinate components out of the opening
// frame, but never out of the country, its path, its identity or its Outlines
// silhouette — and it never names a country or reads the current question.

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { partitionRemoteComponents } from './map-generation-core.mjs';
import { EUROPE_GEOMETRY, EUROPE_SCOPE_FOCUS } from '../.verify-dist/data/maps/europe.js';
import { loadMapAsset } from '../.verify-dist/data/maps/index.js';
import { MAP_CONTINENT_CONFIGS } from '../.verify-dist/data/map-scopes.js';
import { auditAllScopes } from './measure-locations-framing.mjs';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const generatorSource = await read('./map-generation-core.mjs');
const configSource = await read('./map-continent-configs.mjs');

/* --- 1. The rule itself, on synthetic geometry ---------------------------- */

const square = (x, y, size) => [[[x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y]]];
const measure = {
  bounds: (polygon) => {
    const ring = polygon.coordinates[0];
    const xs = ring.map((point) => point[0]);
    const ys = ring.map((point) => point[1]);
    return [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]];
  },
  area: (polygon) => {
    const [[x0, y0], [x1, y1]] = measure.bounds(polygon);
    return (x1 - x0) * (y1 - y0);
  },
};
const policy = { minGapUnits: 40, maxAreaShare: 0.05 };
const country = (...polygons) => ({
  type: 'Feature',
  properties: { countryId: 'TST', role: 'country' },
  geometry: { type: 'MultiPolygon', coordinates: polygons },
});

const mainland = square(0, 0, 200);
const remoteIsland = square(0, 400, 4);
const nearIsland = square(215, 0, 4);
const remoteButLarge = square(0, 400, 120);

const input = country(mainland, nearIsland, remoteIsland);
const snapshot = JSON.stringify(input);
const partition = partitionRemoteComponents(input, policy, measure);
assert.equal(JSON.stringify(input), snapshot, 'Fit partitioning never mutates the canonical feature.');
assert.equal(partition.excluded.length, 1, 'Only the remote, tiny component is excluded.');
assert.equal(partition.kept.geometry.coordinates.length, 2, 'The nearby island stays in the opening frame.');
assert.ok(partition.excluded[0].gapUnits >= policy.minGapUnits);
assert.ok(partition.excluded[0].areaShare <= policy.maxAreaShare);

const reversed = partitionRemoteComponents(country(remoteIsland, nearIsland, mainland), policy, measure);
assert.deepEqual(reversed.excluded, partition.excluded, 'The decision does not depend on component order.');

assert.equal(
  partitionRemoteComponents(country(mainland, remoteButLarge), policy, measure).excluded.length,
  0,
  'A remote component that is a substantial share of the country is part of the learning geography.',
);
assert.equal(
  partitionRemoteComponents({ ...input, geometry: { type: 'Polygon', coordinates: mainland } }, policy, measure).excluded.length,
  0,
  'A single-polygon country has no subordinate component.',
);
assert.equal(
  partitionRemoteComponents(input, null, measure).kept,
  input,
  'Without a declared policy a continent frames exactly as before.',
);

/* --- 2. The mechanism is generic: no country id, no question input -------- */

const mechanism = ['boxGap', 'partitionRemoteComponents', 'summariseExcluded', 'resolveInitialFitPolicy']
  .map((name) => {
    const start = generatorSource.indexOf(`function ${name}(`);
    assert.ok(start >= 0, `${name} exists.`);
    const end = generatorSource.indexOf('\nfunction ', start + 1);
    return generatorSource.slice(start, end);
  })
  .join('\n');
assert.doesNotMatch(mechanism, /['"][A-Z]{3}['"]/, 'The initial-fit mechanism names no country.');
assert.doesNotMatch(mechanism, /target|question|session|prompt/i, 'The initial-fit mechanism cannot see the current question.');

const declared = [...configSource.matchAll(/initialFit:\s*Object\.freeze\(\{([\s\S]*?)\n  \}\),/g)];
assert.ok(declared.length > 0, 'At least one continent declares initialFit.');
for (const [, body] of declared) {
  assert.match(body, /remoteComponents:\s*Object\.freeze\(\{\s*minGapUnits:\s*[\d.]+,\s*maxAreaShare:\s*[\d.]+\s*\}\)/,
    'initialFit declares only the shared numeric remote-component rule, never country ids.');
}

/* --- 3. Generated evidence: canonical geometry survives the exclusion ----- */

const PROVENANCE = {
  europe: JSON.parse(await read('../docs/architecture/europe-cartography-provenance.json')),
};

function pathBounds(path) {
  const points = [...path.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((match) => [Number(match[1]), Number(match[2])]);
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

const europeFit = PROVENANCE.europe.initialFit;
assert.ok(europeFit, 'Europe records its initial-fit evidence in provenance.');
assert.deepEqual(europeFit.remoteComponents, { minGapUnits: 40, maxAreaShare: 0.05 }, 'Provenance records the rule that was applied.');
for (const [countryId, excluded] of Object.entries(europeFit.excludedComponents)) {
  const geometry = EUROPE_GEOMETRY[countryId];
  assert.ok(geometry, `${countryId} remains a canonical Europe country.`);
  const canonical = pathBounds(geometry.path);
  const [x0, y0, x1, y1] = excluded.bounds;
  assert.ok(
    canonical[0] <= x0 + 0.2 && canonical[1] <= y0 + 0.2 && canonical[2] >= x1 - 0.2 && canonical[3] >= y1 - 0.2,
    `${countryId}'s fit-excluded components are still part of its canonical path.`,
  );
  assert.ok(excluded.components > 0 && excluded.areaShare <= europeFit.remoteComponents.maxAreaShare * excluded.components);
}

/* --- 4. Southern Europe is the reference case ----------------------------- */

for (const mandatory of ['ESP', 'PRT']) {
  assert.ok(europeFit.excludedComponents[mandatory], `${mandatory}'s remote islands are excluded from initial fit.`);
}
const southern = EUROPE_SCOPE_FOCUS['southern-europe'];
const canary = europeFit.excludedComponents.ESP.bounds;
assert.ok(
  canary[1] > southern.y + southern.height || canary[0] < southern.x,
  'Spain’s Canary Islands begin outside the Southern Europe opening frame.',
);
assert.ok(southern.width < 450, `Southern Europe opens close (${southern.width} canvas units wide), not at the fit-everything 632.`);
assert.ok(EUROPE_SCOPE_FOCUS.europe.width < 650, 'The Europe continent frame is not widened by Azores, Madeira or the Canaries.');

const asset = await loadMapAsset('southern-europe');
assert.deepEqual(asset.initialFocus, southern, 'The runtime frame is the generated, scope-stable frame.');
assert.deepEqual((await loadMapAsset('southern-europe')).initialFocus, asset.initialFocus, 'The opening frame is deterministic.');
for (const id of ['ESP', 'PRT', 'ITA', 'GRC']) {
  const [x0, y0, x1, y1] = pathBounds(asset.countries.find((item) => item.countryId === id).path);
  assert.ok(x1 > southern.x && x0 < southern.x + southern.width && y1 > southern.y && y0 < southern.y + southern.height,
    `${id}'s mainland is inside the Southern Europe opening frame.`);
}
const spain = asset.countries.find((item) => item.countryId === 'ESP');
assert.ok(
  (spain.path.match(/M/g) ?? []).length >= 20,
  'Spain keeps every canonical component, including those outside the opening frame.',
);

/* --- 5. Audit tooling covers every learner scope -------------------------- */

const expectedScopes = MAP_CONTINENT_CONFIGS.reduce((sum, continent) => sum + 1 + continent.regions.length, 0);
assert.equal(expectedScopes, 31, 'Six continents plus 25 regions.');
const audit = await auditAllScopes();
assert.equal(audit.length, 31, 'The framing audit covers all 31 Locations scopes.');
for (const row of audit) {
  assert.ok(row.focus.width > 0 && row.focus.height > 0, `${row.scope} has an opening frame.`);
  for (const item of row.countries) {
    assert.ok(['A', 'B', 'C', 'D'].includes(item.class), `${row.scope}/${item.id} has a target class.`);
  }
}
// The opening frame must leave room to inspect small targets: if it already sat
// at the zoom ceiling, a regional lane could only "fix" a poor frame by raising
// the ceiling, which is exactly what the zoom contract forbids.
for (const row of audit) {
  assert.ok(row.zoomHeadroom >= 1.1, `${row.scope} keeps zoom headroom beyond its opening frame (${row.zoomHeadroom}x).`);
}
const audited = audit.find((row) => row.scope === 'southern-europe');
for (const id of ['AND', 'SMR', 'VAT', 'MLT']) {
  const item = audited.countries.find((entry) => entry.id === id);
  assert.notEqual(item.class, 'A', `${id} is classified as needing more than its canonical polygon.`);
}

console.log('Initial-fit contract verified: generic remote-component rule, canonical geometry intact, Southern Europe frame, 31-scope audit.');
