import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import {
  AFRICA_CARTOGRAPHY_PROVENANCE,
  AFRICA_COASTLINE_PATHS,
  AFRICA_EXTRA_CONTEXT_PATHS,
  AFRICA_GEOMETRY,
  AFRICA_LAND_ADJACENCY,
  AFRICA_SCOPE_FOCUS,
  AFRICA_SHARED_BOUNDARY_PATHS,
  AFRICA_VIEWBOX,
  AFRICA_WATER,
} from '../dist/data/maps/africa.js';
import { AFRICA_MAP_COUNTRY_IDS } from '../dist/data/map-scopes.js';
import { loadMapAsset } from '../dist/data/maps/index.js';
import { buildMapSession } from '../dist/domain/map-game.js';
import { renderMapSvg } from '../dist/ui/components/map.js';

assert.equal(AFRICA_VIEWBOX, '0 0 835 723', 'Production asset retains one deterministic Africa canvas.');
assert.equal(Object.keys(AFRICA_GEOMETRY).length, 54, 'Generated production geometry has all 54 app countries.');
assert.deepEqual(new Set(Object.keys(AFRICA_GEOMETRY)), new Set(AFRICA_MAP_COUNTRY_IDS));
assert.ok(AFRICA_EXTRA_CONTEXT_PATHS.length >= 2, 'Western Sahara and Bir Tawil remain explicit non-scoring context.');
assert.equal(AFRICA_SHARED_BOUNDARY_PATHS.length, 1, 'Shared political borders are emitted as one topology-derived mesh.');
assert.equal(AFRICA_COASTLINE_PATHS.length, 1, 'Coastline is emitted separately from country fills.');
assert.ok(AFRICA_SHARED_BOUNDARY_PATHS[0].length > 1000, 'Shared-border mesh contains real production geometry.');
assert.ok(AFRICA_COASTLINE_PATHS[0].length > 1000, 'Coastline mesh contains real production geometry.');

const lakeNames = new Set(AFRICA_WATER.lakes?.map((item) => item.name));
for (const name of ['Lake Victoria', 'Lake Tanganyika', 'Lake Malawi', 'Lake Chad']) {
  assert.ok(lakeNames.has(name), `${name} is retained as geographic recognition context.`);
}
const riverNames = new Set(AFRICA_WATER.rivers?.map((item) => item.name));
for (const name of ['Nile', 'Congo', 'Niger', 'Zambezi']) {
  assert.ok(riverNames.has(name), `${name} is retained as restrained river context.`);
}
assert.ok((AFRICA_WATER.oceanPath?.length ?? 0) > 1000, 'Ocean is source-derived instead of only a canvas color.');

const provenance = AFRICA_CARTOGRAPHY_PROVENANCE;
assert.equal(provenance.upstream, 'nvkelso/natural-earth-vector');
assert.equal(provenance.upstreamCommit, 'ca96624a56bd078437bca8184e78163e5039ad19');
assert.equal(provenance.sources.countries.version, '5.1.1');
assert.equal(provenance.sources.boundaries.version, '5.1.0');
assert.equal(provenance.sources.ocean.version, '5.1.1');
assert.equal(provenance.sources.lakes.version, '5.0.0');
assert.equal(provenance.sources.rivers.version, '5.0.0');
assert.equal(provenance.sources.minorIslands.version, '4.1.0');
for (const source of Object.values(provenance.sources)) {
  assert.match(source.sha256, /^[0-9a-f]{64}$/, `${source.path} has a pinned content hash.`);
  assert.ok(source.bytes > 0, `${source.path} records source byte size.`);
}
assert.equal(provenance.projection.name, 'd3.geoNaturalEarth1');
assert.equal(provenance.topology.quantization, 100000);
assert.equal(provenance.topology.simplificationQuantile, 0.72);
assert.ok(
  provenance.topology.coordinateCountAfter < provenance.topology.coordinateCountBefore,
  'Scale-aware simplification reduces source coordinates.',
);
assert.ok(
  provenance.topology.coordinateCountAfter / provenance.topology.coordinateCountBefore > 0.12,
  'Production simplification remains materially higher fidelity than an aggressive locator map.',
);
assert.equal(provenance.runtimeOptimization.pathDigits, 1);
assert.equal(provenance.runtimeOptimization.physicalTolerance.ocean, 0.4);
assert.equal(provenance.runtimeOptimization.physicalTolerance.lakes, 0.15);
assert.equal(provenance.runtimeOptimization.physicalTolerance.rivers, 0.2);
assert.equal(provenance.boundaryPolicy.scoredCountries, 54);
assert.match(provenance.boundaryPolicy.somaliland, /canonical SOM/);
assert.match(provenance.boundaryPolicy.westernSahara, /non-scoring context/);
assert.match(provenance.boundaryPolicy.birTawil, /non-scoring context/);
assert.match(provenance.boundaryPolicy.birTawil, /not merged into EGY or SDN/);

for (const [countryId, adjacent] of Object.entries(AFRICA_LAND_ADJACENCY)) {
  assert.ok(AFRICA_GEOMETRY[countryId], `${countryId} adjacency belongs to an app country.`);
  assert.ok(!adjacent.includes(countryId), `${countryId} adjacency never self-links.`);
  for (const neighbor of adjacent) {
    assert.ok(AFRICA_LAND_ADJACENCY[neighbor]?.includes(countryId), `${countryId}<->${neighbor} adjacency is symmetric.`);
  }
}
assert.deepEqual(AFRICA_LAND_ADJACENCY.LSO, ['ZAF'], 'Lesotho topology has the expected single land neighbor.');
for (const neighbor of ['BFA', 'CIV', 'TGO']) {
  assert.ok(AFRICA_LAND_ADJACENCY.GHA.includes(neighbor), `Ghana shares a topology edge with ${neighbor}.`);
}
for (const neighbor of ['DJI', 'ETH', 'KEN']) {
  assert.ok(AFRICA_LAND_ADJACENCY.SOM.includes(neighbor), `Canonical Somalia adjacency includes ${neighbor}.`);
}

for (const id of ['CPV', 'STP', 'COM', 'MUS', 'SYC']) {
  assert.ok(AFRICA_GEOMETRY[id].locator, `${id} keeps one visible island locator.`);
  assert.equal(AFRICA_GEOMETRY[id].path, undefined, `${id} does not add a redundant visible island polygon.`);
}
const callouts = Object.values(AFRICA_GEOMETRY).filter((item) => item.callout).map((item) => item.countryId).sort();
assert.deepEqual(callouts, ['GMB', 'TGO'], 'Mainland leader-line contract remains limited to The Gambia and Togo.');

assert.deepEqual(AFRICA_SCOPE_FOCUS.africa, { x: 0, y: 0, width: 835, height: 723 });
for (const region of ['north-africa', 'west-africa', 'central-africa', 'east-africa', 'southern-africa']) {
  const focus = AFRICA_SCOPE_FOCUS[region];
  assert.ok(focus && focus.width < 835 && focus.height < 723, `${region} has a closer initial frame than the full continent.`);
}

const westAsset = await loadMapAsset('west-africa');
assert.ok(westAsset);
assert.equal(westAsset.sharedBoundaryPaths?.length, 1);
assert.ok(westAsset.water?.lakes?.length);
const session = buildMapSession(westAsset, 'learn', 'cartography-render', ['GHA']);
const html = renderMapSvg(westAsset, session);
assert.ok(html.includes('map-water--ocean'), 'Renderer includes source-derived ocean layer.');
assert.ok(html.includes('map-water--lakes'), 'Renderer includes lake layer.');
assert.ok(html.includes('map-water--rivers'), 'Renderer includes restrained river layer.');
assert.ok(html.includes('map-shared-boundary'), 'Renderer includes the single-stroke shared-border layer.');
assert.ok(html.includes('data-map-command="fit-continent"'), 'Viewport exposes deterministic full-Africa reset.');
assert.ok(html.includes('data-map-command="fit-region"'), 'Regional view exposes deterministic region fit.');
assert.ok(html.includes('data-map-command="zoom-in"') && html.includes('data-map-command="zoom-out"'), 'Keyboard/pointer zoom controls are available.');
assert.ok(html.includes('data-map-hit'), 'Touch targets can be normalized to CSS pixels as zoom changes.');
assert.ok(html.indexOf('map-water--ocean') < html.indexOf('map-active-countries'), 'Ocean renders below country fills.');
assert.ok(html.indexOf('map-water--lakes') > html.indexOf('map-active-countries'), 'Lakes cut into land above country fills.');

const viewportSource = await readFile('src/map-viewport.ts', 'utf8');
assert.ok(viewportSource.includes('DEFAULT_MAX_ZOOM = 5.5'), 'Viewport has a bounded production max zoom.');
assert.ok(viewportSource.includes('fitContinent'), 'Viewport can always return to continent fit.');
assert.ok(viewportSource.includes('fitRegion'), 'Viewport can restore regional framing.');
assert.ok(viewportSource.includes('event.ctrlKey || event.metaKey'), 'Browser/page zoom modifiers are not captured.');
assert.ok(viewportSource.includes("document.addEventListener('pointermove'"), 'Pointer gestures implement pan/pinch without a runtime map dependency.');
assert.ok(viewportSource.includes('states.set(sessionId'), 'ViewBox survives answer-feedback rerenders by session.');

const cartographyCss = await readFile('src/styles/map-cartography.css', 'utf8');
assert.ok(cartographyCss.includes('touch-action: none'), 'Map surface opts into explicit pointer pan/pinch handling.');
assert.ok(cartographyCss.includes('overflow: hidden'), 'Production viewport is not an oversized scroll canvas.');
assert.ok(cartographyCss.includes('.map-shared-boundary'), 'Shared borders have a dedicated visual layer.');
assert.ok(cartographyCss.includes('pointer-events: none'), 'Water/boundary context cannot intercept country taps.');
assert.ok(!/#[0-9a-f]{3,8}\b/i.test(cartographyCss), 'Production cartography CSS uses shared design tokens.');

const indexSource = await readFile('src/data/maps/index.ts', 'utf8');
assert.ok(indexSource.includes("import('./africa.js')"), 'Africa geometry remains lazy-loaded by continent.');
const builtIndex = await readFile('dist/index.html', 'utf8');
assert.ok(builtIndex.includes('./map-cartography.css'), 'Production artifact loads cartography styles after the established map styles.');
const serviceWorker = await readFile('dist/sw.js', 'utf8');
assert.ok(serviceWorker.includes('flag-atlas-v8'), 'PWA cache is invalidated for the production cartography change.');
assert.ok(serviceWorker.includes('./map-cartography.css'), 'New map viewport/cartography CSS is offline-shell compatible.');

const africaModulePath = 'dist/data/maps/africa.js';
const africaModule = await stat(africaModulePath);
const africaModuleBytes = await readFile(africaModulePath);
const africaGzipBytes = gzipSync(africaModuleBytes, { level: 9 }).byteLength;
assert.ok(africaModule.size < 1_000_000, `Lazy Africa runtime asset stays below 1 MB raw (${africaModule.size} bytes).`);
assert.ok(africaGzipBytes < 300_000, `Lazy Africa runtime asset stays below 300 KB gzip (${africaGzipBytes} bytes).`);

console.log(
  `Production cartography verification passed: ${provenance.topology.coordinateCountAfter}/${provenance.topology.coordinateCountBefore} coordinates, `
  + `${AFRICA_WATER.lakes?.length ?? 0} lakes, ${AFRICA_WATER.rivers?.length ?? 0} rivers, ${africaModule.size} raw / ${africaGzipBytes} gzip bytes.`,
);
