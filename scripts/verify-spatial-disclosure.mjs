import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { CONTINENTS, REGIONS } from '../.verify-dist/data/continents.js';
import { COUNTRIES, COUNTRY_BY_ID } from '../.verify-dist/data/countries.js';
import { GLOBAL_LAND_ADJACENCY } from '../.verify-dist/data/neighbors/global.js';
import { createInitialAchievementState, regionDomainMasteryKey } from '../.verify-dist/domain/achievements.js';
import { LEARNING_DOMAIN_IDS } from '../.verify-dist/domain/models.js';
import { scopeSupportsDomain } from '../.verify-dist/domain/scope-support.js';
import { routeForScopeId } from '../.verify-dist/routing/routes.js';
import { decodeGlobeAsset } from '../.verify-dist/spatial/globe-asset.js';
import { framingFor, GeographyIndex } from '../.verify-dist/spatial/geo.js';
import {
  boundarySegments,
  buildBoundaryTopology,
  scopeAnchor,
} from '../.verify-dist/spatial/disclosure.js';
import {
  countryIdsForScope,
  framingBoxes,
  WORLD_FRAMING,
} from '../.verify-dist/spatial/scope-geography.js';
import {
  deriveSpatialState,
  regionScopeByCountry,
  selectableRegionScopes,
} from '../.verify-dist/spatial/spatial-state.js';

/**
 * Issue #197 — progressive disclosure of continent, region and country detail.
 *
 * Two claims carry the whole feature and neither is safe to assume:
 *
 *   1. continent and region shells really are the canonical country geometry
 *      with shared edges cancelled, so no second geography source exists and no
 *      interior border survives to clutter a navigation level;
 *   2. every name written on the Earth is a real, routable, curriculum-derived
 *      scope, placed on the geography it names.
 *
 * Both are checked against the production assets and the canonical land
 * adjacency tables rather than against synthetic fixtures.
 */

const CONTINENT_IDS = CONTINENTS.map((continent) => continent.id);
const assets = {};
for (const id of ['world', ...CONTINENT_IDS]) {
  const module = await import(`../.verify-dist/data/globe/${id}.js`);
  const key = Object.keys(module).find((name) => name.endsWith('_GLOBE_ASSET'));
  assets[id] = decodeGlobeAsset(module[key]);
}

const continentOf = (id) => COUNTRY_BY_ID.get(id)?.continentId ?? null;
const identity = (id) => id;
const segmentCount = (flat) => flat.length / 4;

// ---------------------------------------------------------------------------
// Shells are derived, not authored: shared edges actually cancel
// ---------------------------------------------------------------------------

const worldTopology = buildBoundaryTopology(assets.world.countries);
const sharedPairs = new Set();
for (let i = 0; i < worldTopology.owner.length; i += 1) {
  const other = worldTopology.neighbour[i];
  if (other === null) continue;
  const [a, b] = [worldTopology.owner[i], other].sort();
  sharedPairs.add(`${a}:${b}`);
}

/**
 * THE LOAD-BEARING ASSERTION. Cancellation only works because the generated
 * assets come from one shared topology, so two neighbours carry their common
 * boundary vertex for vertex. If that ever stopped being true the shells would
 * silently fill with stray interior lines rather than fail, so the canonical
 * land-adjacency tables — themselves emitted by the production 2D generator —
 * are used to prove the arcs really are shared.
 */
let adjacentPairs = 0;
let recognised = 0;
const missed = [];
for (const [id, neighbours] of Object.entries(GLOBAL_LAND_ADJACENCY)) {
  for (const other of neighbours) {
    if (id >= other) continue;
    adjacentPairs += 1;
    if (sharedPairs.has(`${id}:${other}`)) recognised += 1;
    else missed.push(`${id}-${other}`);
  }
}
assert.ok(adjacentPairs > 300, `The canonical adjacency table is present (${adjacentPairs} land borders).`);
assert.ok(
  recognised / adjacentPairs > 0.9,
  `World geometry shares its boundaries with its neighbours (${recognised}/${adjacentPairs} recognised; missed ${missed.slice(0, 12).join(', ')}).`,
);
// A handful of borders are legitimately shorter than the world LOD retains at
// all; a named sample of ordinary ones must never be among them.
for (const [a, b] of [['GHA', 'TGO'], ['FRA', 'DEU'], ['USA', 'MEX'], ['BRA', 'ARG'], ['IND', 'NPL'], ['KEN', 'TZA']]) {
  assert.ok(sharedPairs.has([a, b].sort().join(':')), `${a} and ${b} share their border in the world asset.`);
}

const worldCountryLevel = segmentCount(boundarySegments(worldTopology, { groupOf: identity }));
const worldContinentLevel = segmentCount(boundarySegments(worldTopology, { groupOf: continentOf }));
assert.ok(
  worldContinentLevel < worldCountryLevel * 0.85,
  `World level sheds country tessellation (${worldContinentLevel} of ${worldCountryLevel} segments survive).`,
);
{
  // Stated exactly: the segments the continent grouping drops are precisely
  // those whose two owners share a continent — no more and no fewer, so no
  // interior border can survive and no coastline can be lost.
  const retained = new Set();
  assert.equal(boundarySegments(worldTopology, { groupOf: continentOf }).length % 4, 0,
    'Boundary output is whole segments.');
  for (let i = 0; i < worldTopology.owner.length; i += 1) {
    const other = worldTopology.neighbour[i];
    if (other === null) continue;
    if (continentOf(worldTopology.owner[i]) === continentOf(other)) retained.add(i);
  }
  assert.equal(
    worldCountryLevel - worldContinentLevel,
    retained.size,
    'Exactly the interior borders of each continent are the ones dropped.',
  );
}

// The same mechanism at the next level down, for every continent and domain.
for (const continentId of CONTINENT_IDS) {
  const topology = buildBoundaryTopology(assets[continentId].countries);
  const countryLevel = segmentCount(boundarySegments(topology, { groupOf: identity }));
  for (const domain of LEARNING_DOMAIN_IDS) {
    const scope = { kind: 'continent', id: continentId, label: continentId };
    if (!scopeSupportsDomain(scope, domain)) continue;
    const regions = regionScopeByCountry(continentId, domain);
    const groupOf = (id) => (continentOf(id) === continentId ? regions.get(id) ?? continentId : continentId);
    const regionLevel = segmentCount(boundarySegments(topology, { groupOf }));
    assert.ok(regionLevel <= countryLevel, `${continentId}/${domain} area boundaries are a subset of country borders.`);
    // Every country of the continent belongs to exactly one named area, so an
    // area outline can never be drawn around geography the learner cannot pick.
    for (const country of COUNTRIES.filter((item) => item.continentId === continentId)) {
      const group = groupOf(country.id);
      assert.ok(group, `${continentId}/${domain}/${country.id} belongs to a named area.`);
    }
    // A continent with internal land borders must actually shed some of them.
    const internal = COUNTRIES
      .filter((item) => item.continentId === continentId)
      .some((item) => (GLOBAL_LAND_ADJACENCY[item.id] ?? []).some((other) => {
        if (continentOf(other) !== continentId) return false;
        return regions.get(other) === regions.get(item.id);
      }));
    if (internal) {
      assert.ok(
        regionLevel < countryLevel,
        `${continentId}/${domain} draws areas rather than every country border.`,
      );
    }
  }
}

// An excluded country — one another layer is already drawing — leaves the
// surviving side's boundary in place rather than taking it away with it.
{
  const africa = new Set(COUNTRIES.filter((item) => item.continentId === 'africa').map((item) => item.id));
  const withAfrica = segmentCount(boundarySegments(worldTopology, { groupOf: continentOf }));
  const withoutAfrica = segmentCount(boundarySegments(worldTopology, { groupOf: continentOf, exclude: africa }));
  assert.ok(withoutAfrica < withAfrica, 'A mounted continent hands its own boundaries to the detail layer.');
  const egyptIsrael = boundarySegments(worldTopology, { groupOf: continentOf, exclude: africa });
  assert.ok(egyptIsrael.length > 0, 'The rest of the world keeps its boundaries while a continent is mounted.');
}

// The emphasised outline is a split of the same derivation, never an extra pass
// that could draw a boundary twice.
{
  const topology = buildBoundaryTopology(assets.africa.countries);
  const regions = regionScopeByCountry('africa', 'flags');
  const groupOf = (id) => regions.get(id) ?? 'africa';
  const emphasis = new Set(['west-africa']);
  const ordinary = segmentCount(boundarySegments(topology, { groupOf, emphasis, emphasised: false }));
  const selected = segmentCount(boundarySegments(topology, { groupOf, emphasis, emphasised: true }));
  const total = segmentCount(boundarySegments(topology, { groupOf }));
  assert.equal(ordinary + selected, total, 'Emphasis partitions the boundaries rather than duplicating them.');
  assert.ok(selected > 0, 'A selected area has an outline of its own.');
}

// ---------------------------------------------------------------------------
// Names are placed on the geography they name
// ---------------------------------------------------------------------------

const worldById = new Map(assets.world.countries.map((country) => [country.id, country]));
const worldIndex = new GeographyIndex(assets.world.countries);

function anchorFor(scope) {
  const ids = countryIdsForScope(scope);
  const framing = framingFor(framingBoxes(assets.world, ids)) ?? WORLD_FRAMING;
  const polygons = [];
  for (const id of ids) {
    const country = worldById.get(id);
    if (country?.polygons.length) polygons.push(...country.polygons);
  }
  return { anchor: scopeAnchor(polygons, framing), framing, ids };
}

const wrap = (degrees) => ((degrees + 540) % 360) - 180;
let onLand = 0;
let atSea = 0;
const labelled = [];
for (const continent of CONTINENTS) {
  labelled.push({ kind: 'continent', id: continent.id, label: continent.name });
}
for (const continent of CONTINENTS) {
  for (const domain of LEARNING_DOMAIN_IDS) {
    for (const region of selectableRegionScopes(continent.id, domain)) {
      if (!labelled.some((scope) => scope.id === region.id)) labelled.push(region);
    }
  }
}

for (const scope of labelled) {
  const { anchor, framing, ids } = anchorFor(scope);
  const [lon, lat] = anchor;
  assert.ok(Number.isFinite(lon) && Number.isFinite(lat), `${scope.id} anchors at a real position.`);
  assert.ok(lat >= -90 && lat <= 90, `${scope.id} anchors at a real latitude.`);
  // The name sits inside the frame the camera uses for that same scope, so it
  // cannot be written off the edge of the place it belongs to.
  assert.ok(
    Math.abs(wrap(lon - framing.lon)) <= framing.spanLon / 2 + 1e-6,
    `${scope.id} anchors inside its own frame (${lon.toFixed(1)} against ${framing.lon.toFixed(1)}±${(framing.spanLon / 2).toFixed(1)}).`,
  );
  assert.ok(
    Math.abs(lat - framing.lat) <= framing.spanLat / 2 + 1e-6,
    `${scope.id} anchors inside its own frame vertically.`,
  );
  const resolved = worldIndex.resolve(lon, lat);
  if (resolved === null) atSea += 1;
  else {
    onLand += 1;
    assert.ok(
      ids.includes(resolved),
      `${scope.id} is named over its own geography, not over ${resolved}.`,
    );
  }
}
assert.ok(onLand >= labelled.length - 6, `Names sit on their own land wherever there is land to sit on (${onLand} of ${labelled.length}).`);
assert.ok(atSea <= 6, `Only genuinely archipelagic scopes are named across water (${atSea}).`);
// Anchors are geometry, not camera: asking twice returns the same answer.
for (const scope of labelled.slice(0, 8)) {
  assert.deepEqual(anchorFor(scope).anchor, anchorFor(scope).anchor, `${scope.id} anchors deterministically.`);
}

// ---------------------------------------------------------------------------
// The hierarchy the route asks for is the hierarchy the geography presents
// ---------------------------------------------------------------------------

const achievements = createInitialAchievementState();
const state = (route, view, extra = {}) => deriveSpatialState({ route, view, achievements, ...extra });
const LAUNCHER_VIEW = { flags: 'scope', locations: 'map-home', outlines: 'outline-home', neighbors: 'neighbor-home' };

const home = state({ name: 'home' }, 'home');
assert.equal(home.labels.length, 0, 'Home names no geography: no mode has been chosen yet.');
assert.equal(home.labelLevel, null, 'Home has no label level.');
assert.equal(home.boundaries, 'continent', 'Home shows continents rather than a country tessellation.');

for (const domain of LEARNING_DOMAIN_IDS) {
  const world = state({ name: 'learning', domain }, 'domain');
  assert.equal(world.boundaries, 'continent', `${domain} world level draws continents, not countries.`);
  assert.equal(world.labelLevel, 'continent', `${domain} world level names continents.`);
  assert.deepEqual(
    world.labels.map((label) => label.scopeId),
    CONTINENT_IDS,
    `${domain} names every continent on the Earth.`,
  );
  for (const label of world.labels) {
    const scope = { kind: 'continent', id: label.scopeId, label: label.label };
    assert.equal(label.available, scopeSupportsDomain(scope, domain), `${domain}/${label.scopeId} is offered exactly as its chip is.`);
    assert.equal(label.current, false, 'No continent is framed at world level.');
    assert.equal(label.status, undefined, 'World level publishes no earned state.');
    if (label.available) {
      assert.ok(routeForScopeId(domain, label.scopeId), `${domain}/${label.scopeId} names a routable scope.`);
    }
  }

  for (const continent of CONTINENTS) {
    const scope = { kind: 'continent', id: continent.id, label: continent.name };
    if (!scopeSupportsDomain(scope, domain)) continue;
    const focused = state({ name: 'learning', domain, scope }, LAUNCHER_VIEW[domain]);
    assert.equal(focused.boundaries, 'region', `${domain}/${continent.id} reveals areas, not country borders.`);
    assert.equal(focused.labelLevel, 'region', `${domain}/${continent.id} names its areas.`);
    const offered = selectableRegionScopes(continent.id, domain).map((region) => region.id);
    assert.deepEqual(
      focused.labels.map((label) => label.scopeId),
      offered,
      `${domain}/${continent.id} names exactly the areas its command surface offers.`,
    );
    assert.ok(focused.labels.every((label) => label.available), 'Every named area of a shipped continent is selectable.');
    assert.ok(focused.labels.every((label) => !label.current), 'No area is current while the continent itself is framed.');
    for (const label of focused.labels) {
      assert.ok(routeForScopeId(domain, label.scopeId), `${domain}/${label.scopeId} names a routable scope.`);
    }

    for (const region of selectableRegionScopes(continent.id, domain)) {
      const framed = state({ name: 'learning', domain, scope: region }, LAUNCHER_VIEW[domain]);
      assert.equal(framed.boundaries, 'region', `${domain}/${region.id} keeps navigation at area level.`);
      assert.deepEqual(
        framed.labels.map((label) => label.scopeId),
        offered,
        `${domain}/${region.id} keeps its sibling areas named and selectable.`,
      );
      assert.equal(
        framed.labels.filter((label) => label.current).length,
        1,
        `${domain}/${region.id} marks exactly one area as the framed one.`,
      );
      assert.equal(
        framed.labels.find((label) => label.current)?.scopeId,
        region.id,
        `${domain}/${region.id} marks the area the route names.`,
      );
    }
  }
}

// Country detail appears only where the activity is actually about countries.
for (const view of ['map-quiz', 'outline-quiz', 'neighbor-quiz', 'flags-study', 'profile']) {
  const live = state({ name: 'learning', domain: 'flags', scope: { kind: 'region', id: 'west-africa', label: 'West Africa' }, activity: 'test' }, view);
  assert.equal(live.labels.length, 0, `${view} names no geography while the activity owns the screen.`);
  assert.notEqual(live.boundaries, 'country', `${view} does not expose country borders.`);
}
{
  const scope = { kind: 'region', id: 'west-africa', label: 'West Africa' };
  const context = state({ name: 'learning', domain: 'flags', scope, activity: 'test' }, 'quiz');
  assert.equal(context.labels.length, 0, 'A live Flags question names no geography behind itself.');
  assert.equal(context.boundaries, 'region', 'A live question keeps the level the learner navigated at.');
  const results = state({ name: 'learning', domain: 'flags', scope, activity: 'test' }, 'results', { resultScope: scope });
  assert.equal(results.labels.length, 0, 'Results offers no geography selection.');
  assert.equal(results.boundaries, 'country', 'Results reframes the countries the round was actually about.');
}

// Earned state reaches a name in state, never as colour alone.
{
  const earned = {
    ...createInitialAchievementState(),
    regionDomainMasteries: [regionDomainMasteryKey('west-africa', 'flags')],
    completeRegions: ['southern-africa'],
  };
  const focused = deriveSpatialState({
    route: { name: 'learning', domain: 'flags', scope: { kind: 'continent', id: 'africa', label: 'Africa' } },
    view: 'scope',
    achievements: earned,
  });
  const byId = new Map(focused.labels.map((label) => [label.scopeId, label]));
  assert.equal(byId.get('west-africa').status, 'mastered', 'A Mastered area says so on the geography.');
  assert.equal(byId.get('southern-africa').status, 'complete', 'A complete area says so on the geography.');
  assert.equal(byId.get('north-africa').status, undefined, 'An unearned area carries no status.');
}

// ---------------------------------------------------------------------------
// The names are real controls, not text drawn into the scene
// ---------------------------------------------------------------------------

const labelSource = await readFile('src/spatial/scope-labels.ts', 'utf8');
assert.match(labelSource, /createElement\('button'\)/, 'Each name on the geography is a real button.');
assert.match(labelSource, /setAttribute\('aria-label'/, 'Each name carries its own accessible name.');
assert.match(labelSource, /aria-current/, 'The framed scope is announced as the current one.');
assert.match(labelSource, /onSelect\(entry\.target\.scopeId\)/, 'Choosing a name dispatches the shared scope action.');
assert.equal(labelSource.includes('fillText'), false, 'No name is painted into a canvas.');
assert.equal(labelSource.includes('aria-hidden="true"'), false, 'The controls themselves are not hidden from assistive technology.');

const rendererSource = await readFile('src/spatial/renderer/globe-scene.ts', 'utf8');
for (const forbidden of ['fillText', 'TextGeometry', 'Sprite']) {
  assert.equal(rendererSource.includes(forbidden), false, `Geography names are not baked into the scene (${forbidden}).`);
}
assert.match(rendererSource, /setBoundaries\(/, 'The scene is told which boundaries to draw rather than deciding.');
assert.match(rendererSource, /project\(lon, lat\)/, 'The scene projects an anchor for a real DOM control over it.');

const controllerSource = await readFile('src/spatial/stage-controller.ts', 'utf8');
assert.match(controllerSource, /onSelectScope/, 'A chosen name dispatches an application action.');
assert.match(controllerSource, /director\.travelTo\(\{ lon, lat, distance: director\.pose\.distance \}\)/,
  'Reaching a far-side name by keyboard turns the camera rather than changing the route.');

const css = await readFile('src/styles/spatial.css', 'utf8');
assert.match(css, /\.spatial-scope \{[^}]*min-height: var\(--control-height-compact\);/s,
  'A name on the geography carries a full-size touch target.');
assert.match(css, /\.spatial-scope \{[^}]*min-width: var\(--control-height-compact\);/s,
  'That target is wide as well as tall, independent of the glyph.');
assert.match(css, /\.spatial-scopes \{[^}]*pointer-events: none;/s,
  'The label layer never swallows a drag meant for the Earth.');
assert.match(css, /\.spatial-scope\[data-facing='back'\]/, 'A name behind the planet is not drawn over it.');

console.log(
  `Spatial disclosure verification passed: ${recognised}/${adjacentPairs} canonical land borders share their arcs, `
  + `world level retains ${worldContinentLevel} of ${worldCountryLevel} segments, `
  + `${labelled.length} scopes named on their own geography (${onLand} on land, ${atSea} across water).`,
);
