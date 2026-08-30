import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

import { CONTINENTS, REGIONS } from '../.verify-dist/data/continents.js';
import { COUNTRIES, COUNTRY_BY_ID } from '../.verify-dist/data/countries.js';
import { regionLearningScopes } from '../.verify-dist/data/learning-scopes.js';
import { getMapContinentConfig } from '../.verify-dist/data/map-scopes.js';
import { createInitialAchievementState, regionDomainMasteryKey } from '../.verify-dist/domain/achievements.js';
import { LEARNING_DOMAIN_IDS } from '../.verify-dist/domain/models.js';
import { routeForScopeId, parseRoutePath, serializeRoutePath } from '../.verify-dist/routing/routes.js';
import { decodeGlobeAsset, decodePolygons } from '../.verify-dist/spatial/globe-asset.js';
import { distanceForSpan, framingFor, fromSphere, toSphere, wrapLon, GeographyIndex } from '../.verify-dist/spatial/geo.js';
import { createCameraDirector } from '../.verify-dist/spatial/camera-director.js';
import {
  countryIdsForScope,
  framingBoxes,
  continentForScope,
  isContinentId,
  poseForFraming,
  WORLD_FRAMING,
} from '../.verify-dist/spatial/scope-geography.js';
import {
  deriveSpatialState,
  resolveTapTarget,
  selectableRegionScopes,
} from '../.verify-dist/spatial/spatial-state.js';
import { GLOBE_PROVENANCE } from '../.verify-dist/data/globe/provenance.js';
import { encodePolygons, encodeRing, decodeRing } from './lib/globe-encoding.mjs';

const CONTINENT_IDS = CONTINENTS.map((continent) => continent.id);
const ASSET_IDS = ['world', ...CONTINENT_IDS];

// ---------------------------------------------------------------------------
// F3 — generated spherical geography
// ---------------------------------------------------------------------------

const encoded = {};
for (const id of ASSET_IDS) {
  const module = await import(`../.verify-dist/data/globe/${id}.js`);
  const key = Object.keys(module).find((name) => name.endsWith('_GLOBE_ASSET'));
  assert.ok(key, `${id} globe asset module exports a single named asset.`);
  encoded[id] = module[key];
}

const assets = Object.fromEntries(ASSET_IDS.map((id) => [id, decodeGlobeAsset(encoded[id])]));

// Identity: ISO3 remains canonical and geography introduces no country of its own.
const canonicalIds = new Set(COUNTRIES.map((country) => country.id));
assert.equal(canonicalIds.size, 195, 'The canonical curriculum is 195 countries.');
assert.deepEqual(
  new Set(assets.world.countries.map((country) => country.id)),
  canonicalIds,
  'World LOD carries exactly the canonical country set — no extras, no omissions.',
);
for (const continentId of CONTINENT_IDS) {
  const expected = new Set(COUNTRIES.filter((c) => c.continentId === continentId).map((c) => c.id));
  assert.deepEqual(
    new Set(assets[continentId].countries.map((country) => country.id)),
    expected,
    `${continentId} detail LOD carries exactly its own continent's countries.`,
  );
}

for (const [id, asset] of Object.entries(assets)) {
  const ids = asset.countries.map((country) => country.id);
  assert.deepEqual(ids, [...ids].sort(), `${id} entries are sorted, so generation is byte-stable.`);
  assert.equal(new Set(ids).size, ids.length, `${id} has no duplicate country entries.`);
  for (const country of asset.countries) {
    // LOCATOR POLICY: simplification may erase a country's rings, never the country.
    assert.ok(
      country.polygons.length > 0 || country.locator,
      `${id}/${country.id} survives simplification as geometry or as a locator.`,
    );
    for (const polygon of country.polygons) {
      for (const ring of polygon) {
        assert.ok(ring.length >= 3, `${id}/${country.id} rings are real rings.`);
        // Antimeridian: rings arrive unwrapped, so no ring may wrap the planet.
        const lons = ring.map(([lon]) => lon);
        assert.ok(
          Math.max(...lons) - Math.min(...lons) < 180,
          `${id}/${country.id} ring is unwrapped rather than smeared across the antimeridian.`,
        );
      }
    }
  }
}

// Deterministic encoding: re-encoding what we decoded reproduces the stored bytes.
for (const id of ASSET_IDS) {
  const source = encoded[id];
  for (const country of source.countries) {
    if (!country.p) continue;
    const roundTripped = encodePolygons(decodePolygons(country.p, source.precision), source.precision);
    assert.equal(roundTripped, country.p, `${id}/${country.id} encoding is a stable round trip.`);
  }
}

// Separators can never collide with encoded vertex data.
for (let value = -400000; value <= 400000; value += 997) {
  const text = encodeRing([[value / 32, -value / 32]], 32);
  assert.equal(text.includes(';'), false, 'Ring separator cannot appear in encoded output.');
  assert.equal(text.includes(','), false, 'Polygon separator cannot appear in encoded output.');
}
assert.deepEqual(decodeRing(encodeRing([[12.5, -7.25]], 32), 32), [[12.5, -7.25]], 'Encoding is lossless on the grid.');

// Provenance travels with the artifact and still names the pinned source.
const manifest = JSON.parse(await readFile('scripts/map-sources/natural-earth.json', 'utf8'));
assert.equal(GLOBE_PROVENANCE.upstream, manifest.upstream, 'Globe geography uses the pinned Natural Earth upstream.');
assert.equal(GLOBE_PROVENANCE.upstreamCommit, manifest.upstreamCommit, 'Globe geography uses the pinned upstream commit.');
assert.equal(GLOBE_PROVENANCE.sourceSha256, manifest.sources.countries.sha256, 'Globe geography records the pinned source digest.');
assert.equal(GLOBE_PROVENANCE.sourcePath, manifest.sources.countries.path, 'Globe geography reads the same source file as the 2D pipeline.');
assert.deepEqual(
  GLOBE_PROVENANCE.identityPolicy,
  ['ISO_A3_EH', 'ADM0_A3', 'ISO_A3', 'SOV_A3', 'SU_A3', 'GU_A3'],
  'Globe geography uses the documented ISO3 identity candidate order.',
);

// The framing policy is the production one, not a second policy.
const continentConfigSource = await readFile('scripts/map-continent-configs.mjs', 'utf8');
assert.equal(
  GLOBE_PROVENANCE.framingPolicySource,
  'scripts/map-continent-configs.mjs',
  'Globe framing reuses the declared 2D continent framing policy.',
);
for (const [continentId, excluded] of Object.entries(GLOBE_PROVENANCE.framingExclusions)) {
  for (const id of excluded) {
    assert.match(continentConfigSource, new RegExp(`'${id}'`), `${continentId} framing exclusion ${id} is declared in the shared config.`);
  }
}
assert.ok(
  GLOBE_PROVENANCE.framingExclusions.europe?.includes('RUS'),
  'Russia is excluded from Europe framing, as it is for the projected Europe map.',
);

// ---------------------------------------------------------------------------
// Picking geometry, microstates and the antimeridian
// ---------------------------------------------------------------------------

const worldIndex = new GeographyIndex(assets.world.countries);
/**
 * Degrees per CSS pixel at roughly a continent frame on a phone. Interaction
 * envelopes are sized in pixels, so picking with assistance needs a camera.
 */
const PHONE_SCALE = { degreesPerPixel: 0.2 };

assert.equal(worldIndex.resolve(-30, 35), null, 'Open ocean resolves to no country.');
for (const [lon, lat, expected] of [
  [1.5, 8.5, 'TGO'],
  [-3.7, 40.4, 'ESP'],
  [37.6, 55.7, 'RUS'],
  [174.8, -41.2, 'NZL'],
  [-58.4, -34.6, 'ARG'],
  [139.7, 35.6, 'JPN'],
]) {
  assert.equal(worldIndex.resolve(lon, lat), expected, `World LOD picking resolves ${expected} from its own territory.`);
}
/*
 * HIT PRECEDENCE — Issue #117's rule, as Issue #166 refined it for touch.
 *
 * Real geography still wins a contested tap wherever the country contesting it
 * can actually be aimed at. What changed is that a country too small to aim at
 * is no longer shadowed by whatever it happens to sit beside: it carries an
 * invisible interaction envelope, bounded by the room its neighbour has, so an
 * ENCLAVED microstate is now selectable too and the country around it keeps its
 * interior. `verify-spatial-touch.mjs` proves both halves of that against every
 * production frame; this file asserts only that every locator-only country in
 * the world asset is reachable at its own position.
 */
let enclavedLocators = 0;
let openWaterLocators = 0;
for (const country of assets.world.countries) {
  if (country.polygons.length) continue;
  const [lon, lat] = country.locator;
  const strict = worldIndex.resolve(lon, lat);
  if (strict === null) openWaterLocators += 1; else enclavedLocators += 1;
  assert.equal(
    worldIndex.resolve(lon, lat, PHONE_SCALE),
    country.id,
    `${country.id} is selectable at its own locator, enclaved or not.`,
  );
}
assert.ok(openWaterLocators >= 25, `Island locators stay selectable (${openWaterLocators} of them).`);
assert.ok(enclavedLocators <= 12, `Only genuinely enclaved microstates sit inside other geography (${enclavedLocators}).`);
// Assistance is opt-in: without a camera scale, picking is pure containment and
// can never silently widen a target.
const islandLocator = assets.world.countries.find(
  (country) => !country.polygons.length && worldIndex.resolve(country.locator[0], country.locator[1]) === null,
);
assert.equal(worldIndex.resolve(islandLocator.locator[0], islandLocator.locator[1]), null,
  'Locator picking is opt-in, so it can never silently widen a target.');

// Antimeridian cases resolve on both sides of the date line.
assert.equal(worldIndex.resolve(178.5, -17.8), 'FJI', 'Fiji resolves west of the date line.');
assert.equal(worldIndex.resolve(179, 69), 'RUS', 'Russian Chukotka resolves west of the date line.');
assert.equal(worldIndex.resolve(-175, 66), 'RUS', 'Russian Chukotka resolves east of the date line too.');
assert.equal(worldIndex.resolve(185, 66), 'RUS', 'The same position resolves identically when expressed past 180.');
assert.equal(worldIndex.resolve(-175 - 360, 66), 'RUS', 'And when expressed below -180.');

// fromSphere/toSphere are exact inverses, which is what makes picking geographic.
for (const [lon, lat] of [[0, 0], [179.5, -12], [-179.5, 61], [12, -83]]) {
  const [x, y, z] = toSphere(lon, lat, 1);
  const [backLon, backLat] = fromSphere(x, y, z);
  assert.ok(Math.abs(wrapLon(backLon - lon)) < 1e-9 && Math.abs(backLat - lat) < 1e-9,
    `Sphere projection round-trips at ${lon},${lat}.`);
}

// ---------------------------------------------------------------------------
// Framing: every scope frames, and the declared policy actually bites
// ---------------------------------------------------------------------------

const framingFor_ = (scope) => framingFor(framingBoxes(assets.world, countryIdsForScope(scope)));
for (const continent of CONTINENTS) {
  const scope = { kind: 'continent', id: continent.id, label: continent.name };
  const framing = framingFor_(scope);
  assert.ok(framing, `${continent.id} frames.`);
  for (const value of [framing.lon, framing.lat, framing.spanLon, framing.spanLat]) {
    assert.ok(Number.isFinite(value), `${continent.id} framing is finite.`);
  }
  assert.ok(framing.spanLon > 0 && framing.spanLat > 0, `${continent.id} frames a real extent.`);
  for (const definition of regionLearningScopes(continent.id)) {
    const regionFraming = framingFor_(definition.scope);
    assert.ok(regionFraming && Number.isFinite(regionFraming.lon), `${definition.scope.id} frames.`);
    const distance = distanceForSpan(regionFraming.spanLat, regionFraming.spanLon, 38, 0.9);
    assert.ok(distance > 1 && distance < 5, `${definition.scope.id} frames from a usable camera distance.`);
  }
}
// The exclusions are the reason these hold: a union frame over Russia's mainland
// would put Europe's centre in Kazakhstan and span more than 150 degrees.
const europe = framingFor_({ kind: 'continent', id: 'europe', label: 'Europe' });
assert.ok(europe.lon > -10 && europe.lon < 30, `Europe frames over Europe (got ${europe.lon.toFixed(1)}).`);
assert.ok(europe.spanLon < 100, `Europe frames at a European scale (got ${europe.spanLon.toFixed(0)} degrees).`);
const northAmerica = framingFor_({ kind: 'continent', id: 'north-america', label: 'North America' });
assert.ok(northAmerica.lon < -85, `North America frames over the continent, not the Caribbean (got ${northAmerica.lon.toFixed(1)}).`);
// Circular longitude, not an arithmetic mean: a Pacific scope must not frame at 0.
const polynesia = framingFor_(regionLearningScopes('oceania').find((d) => d.scope.id === 'polynesia').scope);
assert.ok(Math.abs(polynesia.lon) > 150, `Polynesia frames across the date line (got ${polynesia.lon.toFixed(1)}).`);
const oceania = framingFor_({ kind: 'continent', id: 'oceania', label: 'Oceania' });
assert.ok(Math.abs(oceania.lon) > 100, `Oceania frames on the Pacific (got ${oceania.lon.toFixed(1)}).`);
// The whole-Earth frame is the fallback and never depends on an asset.
assert.ok(poseForFraming(WORLD_FRAMING, 38, 1).distance > 2, 'World frame stands the camera off the whole planet.');

// ---------------------------------------------------------------------------
// F1 — route to spatial presentation
// ---------------------------------------------------------------------------

const achievements = createInitialAchievementState();
const state = (route, view, extra = {}) => deriveSpatialState({ route, view, achievements, ...extra });

assert.equal(state({ name: 'home' }, 'home').mode, 'world', 'Home frames the whole Earth.');
assert.equal(state({ name: 'home' }, 'home').picking, 'none', 'Nothing is selectable before a mode is chosen.');
assert.equal(state({ name: 'profile' }, 'profile').mode, 'yielded', 'Profile is not a geographic screen.');

for (const domain of LEARNING_DOMAIN_IDS) {
  const domainState = state({ name: 'learning', domain }, 'domain');
  assert.equal(domainState.mode, 'world', `${domain} index frames the whole Earth.`);
  assert.equal(domainState.picking, 'continent', `${domain} index makes continents the selectable unit.`);
  assert.equal(domainState.detail, null, `${domain} index needs no continent detail.`);

  for (const continent of CONTINENTS) {
    const scope = { kind: 'continent', id: continent.id, label: continent.name };
    const view = domain === 'flags' ? 'scope' : domain === 'locations' ? 'map-home' : domain === 'outlines' ? 'outline-home' : 'neighbor-home';
    const launcher = state({ name: 'learning', domain, scope }, view);
    assert.equal(launcher.mode, 'focus', `${domain}/${continent.id} focuses the continent.`);
    assert.equal(launcher.picking, 'region', `${domain}/${continent.id} makes regions the selectable unit.`);
    assert.equal(launcher.detail, continent.id, `${domain}/${continent.id} requests that continent's detail LOD.`);
    assert.ok(launcher.description.includes(continent.name), `${domain}/${continent.id} describes the frame in words.`);

    for (const regionScope of selectableRegionScopes(continent.id, domain)) {
      const region = state({ name: 'learning', domain, scope: regionScope }, view);
      assert.equal(region.mode, 'focus', `${domain}/${regionScope.id} focuses.`);
      assert.equal(region.detail, continent.id, `${domain}/${regionScope.id} loads its parent continent's detail.`);
      assert.ok(region.countryStates.size > 0, `${domain}/${regionScope.id} presents country state.`);
    }
  }
}

// NO ANSWER LEAKAGE. A live question must never carry scope highlighting, and the
// domains whose own learning object is a map must not have a second map behind it.
for (const [view, expectedMode] of [
  ['quiz', 'context'],
  ['map-quiz', 'yielded'],
  ['outline-quiz', 'yielded'],
  ['neighbor-quiz', 'yielded'],
  ['flags-study', 'yielded'],
]) {
  const scope = { kind: 'region', id: 'west-africa', label: 'West Africa' };
  const live = state({ name: 'learning', domain: 'flags', scope, activity: 'test' }, view);
  assert.equal(live.mode, expectedMode, `${view} puts the stage in ${expectedMode}.`);
  assert.equal(live.picking, 'none', `${view} makes no geography selectable.`);
  assert.equal(live.countryStates.size, 0, `${view} highlights no country, so the globe cannot hint at an answer.`);
  assert.equal(live.description, '', `${view} publishes no scope description while a question is live.`);
  assert.equal(live.scopeStatus.size, 0, `${view} publishes no scope status while a question is live.`);
}

// Results resolve the same session over the geography just played.
for (const view of ['results', 'map-results', 'outline-results', 'neighbor-results']) {
  const resultScope = { kind: 'region', id: 'southern-africa', label: 'Southern Africa' };
  const resolved = state({ name: 'learning', domain: 'flags', scope: resultScope, activity: 'test' }, view, { resultScope });
  assert.equal(resolved.mode, 'results', `${view} returns the learner to the geography.`);
  assert.equal(resolved.picking, 'none', `${view} does not offer geography selection before the learner leaves.`);
  assert.equal(resolved.detail, 'africa', `${view} keeps the played continent's detail mounted.`);
  assert.ok(resolved.countryStates.size > 0, `${view} presents the played scope.`);
}

// ---------------------------------------------------------------------------
// DOM and geography resolve to the SAME action
// ---------------------------------------------------------------------------

for (const domain of LEARNING_DOMAIN_IDS) {
  const worldState = state({ name: 'learning', domain }, 'domain');
  for (const country of COUNTRIES) {
    const target = resolveTapTarget(worldState, country.id);
    assert.equal(target, country.continentId, `Tapping ${country.id} at world level selects its continent.`);
    assert.ok(routeForScopeId(domain, target), `${domain}/${target} is a routable scope, exactly as the DOM control produces.`);
  }
}

for (const domain of LEARNING_DOMAIN_IDS) {
  const view = domain === 'flags' ? 'scope' : domain === 'locations' ? 'map-home' : domain === 'outlines' ? 'outline-home' : 'neighbor-home';
  for (const continent of CONTINENTS) {
    const scope = { kind: 'continent', id: continent.id, label: continent.name };
    const focused = state({ name: 'learning', domain, scope }, view);
    const offered = new Set(selectableRegionScopes(continent.id, domain).map((region) => region.id));
    for (const country of COUNTRIES.filter((item) => item.continentId === continent.id)) {
      const target = resolveTapTarget(focused, country.id);
      assert.ok(
        target === continent.id || offered.has(target),
        `Tapping ${country.id} inside ${continent.id} resolves to a scope the ${domain} launcher also offers (got ${target}).`,
      );
      assert.ok(routeForScopeId(domain, target), `${domain}/${target} resolves to a real route.`);
    }
    // A tap outside the framed continent travels back out rather than dying.
    const elsewhere = COUNTRIES.find((item) => item.continentId !== continent.id);
    assert.equal(resolveTapTarget(focused, elsewhere.id), elsewhere.continentId,
      'A tap outside the framed continent selects the tapped continent.');
  }
}

// Picking is genuinely disabled where the contract says so.
const duringQuiz = state({ name: 'learning', domain: 'flags', scope: { kind: 'region', id: 'west-africa', label: 'West Africa' }, activity: 'test' }, 'quiz');
assert.equal(resolveTapTarget(duringQuiz, 'GHA'), null, 'Geography cannot navigate while a round is live.');
assert.equal(resolveTapTarget(state({ name: 'home' }, 'home'), 'GHA'), null, 'Geography cannot navigate before a mode is chosen.');

// ---------------------------------------------------------------------------
// Mastery and completion presentation reuse the existing achievement semantics
// ---------------------------------------------------------------------------

const earned = {
  ...createInitialAchievementState(),
  regionDomainMasteries: [regionDomainMasteryKey('west-africa', 'flags')],
  completeRegions: ['southern-africa'],
};
const masteredState = deriveSpatialState({
  route: { name: 'learning', domain: 'flags', scope: { kind: 'continent', id: 'africa', label: 'Africa' } },
  view: 'scope',
  achievements: earned,
});
assert.equal(masteredState.countryStates.get('GHA'), 'mastered', 'An earned region × domain Mastery shows on its geography.');
assert.equal(masteredState.countryStates.get('EGY'), 'active', 'An unearned region stays ordinary in-scope geography.');
assert.equal(masteredState.countryStates.get('ZAF'), 'complete', 'A complete region takes the scarce completion treatment.');
assert.equal(masteredState.countryStates.get('FRA'), 'dimmed', 'Out-of-scope geography stays context.');
const otherDomain = deriveSpatialState({
  route: { name: 'learning', domain: 'outlines', scope: { kind: 'continent', id: 'africa', label: 'Africa' } },
  view: 'outline-home',
  achievements: earned,
});
assert.equal(otherDomain.countryStates.get('GHA'), 'active', 'Mastery is per region × domain and does not leak across domains.');

// Colour never carries earned state alone: the DOM control that mirrors the
// globe's tint publishes the same state as a scope status the bar renders in words.
assert.equal(masteredState.scopeStatus.get('west-africa'), 'mastered', 'Mastery reaches the DOM control as state, not only as colour.');
assert.equal(masteredState.scopeStatus.get('southern-africa'), 'complete', 'Completion reaches the DOM control as state, not only as colour.');
assert.equal(masteredState.scopeStatus.get('north-africa'), undefined, 'Unearned scopes carry no status.');
assert.equal(otherDomain.scopeStatus.get('west-africa'), undefined, 'Scope status is per domain.');
const commandSource = await readFile('src/spatial/SpatialCommand.tsx', 'utf8');
assert.match(commandSource, /visually-hidden/, 'The command surface names earned state for assistive technology.');
assert.match(commandSource, /aria-hidden="true"/, 'Its marks are decorative beside that text.');
// World level stays neutral: the globe never becomes a progress choropleth.
const worldWithMastery = deriveSpatialState({ route: { name: 'learning', domain: 'flags' }, view: 'domain', achievements: earned });
for (const value of worldWithMastery.countryStates.values()) {
  assert.notEqual(value, 'mastered', 'World level carries no mastery tint.');
  assert.notEqual(value, 'complete', 'World level carries no completion tint.');
}
assert.equal(worldWithMastery.scopeStatus.size, 0, 'World level publishes no scope status either.');

// ---------------------------------------------------------------------------
// Camera grammar
// ---------------------------------------------------------------------------

{
  const applied = [];
  let clock = 0;
  const queue = [];
  const director = createCameraDirector({ lon: 0, lat: 0, distance: 3 }, {
    apply: (pose) => applied.push(pose),
    prefersReducedMotion: () => false,
    now: () => clock,
    schedule: (callback) => queue.push(callback),
  });
  director.travelTo({ lon: 40, lat: 10, distance: 2 });
  assert.equal(director.travelling, true, 'Ordinary motion travels.');
  clock = 200;
  queue.shift()();
  const midway = director.pose;
  assert.ok(midway.lon > 0 && midway.lon < 40, 'Travel interpolates rather than jumping.');
  // Retargeting mid-flight continues from where the camera is.
  director.travelTo({ lon: -20, lat: 0, distance: 3 });
  clock = 400;
  queue.shift()();
  assert.ok(director.pose.lon !== midway.lon, 'A new destination mid-flight retargets rather than restarting.');
  // A learner's hand always wins.
  director.nudge({ lon: 90, lat: 5, distance: 2.5 });
  assert.equal(director.travelling, false, 'Direct manipulation cancels travel.');
  assert.deepEqual(director.pose, { lon: 90, lat: 5, distance: 2.5 }, 'Direct manipulation owns the pose.');
}

{
  const applied = [];
  const director = createCameraDirector({ lon: 0, lat: 0, distance: 3 }, {
    apply: (pose) => applied.push(pose),
    prefersReducedMotion: () => true,
    now: () => 0,
    schedule: () => { throw new Error('Reduced motion must not schedule animation frames.'); },
  });
  director.travelTo({ lon: 40, lat: 10, distance: 2 });
  assert.equal(director.travelling, false, 'Reduced motion does not animate.');
  assert.deepEqual(director.pose, { lon: 40, lat: 10, distance: 2 }, 'Reduced motion arrives at the same destination.');
}

// Longitude interpolation takes the short way round rather than crossing the globe.
{
  const seen = [];
  let clock = 0;
  const queue = [];
  const director = createCameraDirector({ lon: 170, lat: 0, distance: 2 }, {
    apply: (pose) => seen.push(pose.lon),
    prefersReducedMotion: () => false,
    now: () => clock,
    schedule: (callback) => queue.push(callback),
  });
  director.travelTo({ lon: -170, lat: 0, distance: 2 });
  clock = 310;
  queue.shift()();
  assert.ok(Math.abs(wrapLon(seen[seen.length - 1] - 170)) < 30,
    'Travel across the date line takes the short way round.');
}

// ---------------------------------------------------------------------------
// No second navigation stack, and no renderer-owned taxonomy
// ---------------------------------------------------------------------------

const spatialFiles = (await readdir('src/spatial', { recursive: true }))
  .filter((name) => name.endsWith('.ts') || name.endsWith('.tsx'));
assert.ok(spatialFiles.length >= 8, 'The spatial module is present in source.');
for (const name of spatialFiles) {
  const source = await readFile(join('src/spatial', name), 'utf8');
  for (const forbidden of ['pushState', 'replaceState', 'location.hash', 'window.location']) {
    assert.equal(source.includes(forbidden), false, `src/spatial/${name} does not write navigation state (${forbidden}).`);
  }
}
const rendererSource = await readFile('src/spatial/renderer/globe-scene.ts', 'utf8');
for (const forbidden of ['CONTINENTS', 'REGIONS', 'learning-scopes', 'countries.js']) {
  assert.equal(rendererSource.includes(forbidden), false, `The renderer owns no curriculum taxonomy (${forbidden}).`);
}
// Render on demand: the only animation frame the scene requests is the guarded one.
assert.equal((rendererSource.match(/requestAnimationFrame/g) ?? []).length, 1,
  'The scene schedules exactly one, guarded animation frame — there is no idle render loop.');
assert.match(rendererSource, /if \(renderPending \|\| disposed \|\| !active\) return;/,
  'Render requests coalesce and stop entirely while the stage is yielded.');
assert.match(rendererSource, /dprCeiling = 1;/, 'Device pixel ratio degrades on sustained slow frames.');
assert.match(rendererSource, /webglcontextrestored/, 'A lost WebGL context is recovered rather than left blank.');
assert.match(rendererSource, /aria-hidden/, 'The canvas is not exposed as an accessibility surface of its own.');

const stageSource = await readFile('src/spatial/SpatialStage.tsx', 'utf8');
assert.match(stageSource, /await import\('\.\/stage-controller\.js'\)/, 'The whole spatial stack loads lazily.');
assert.match(stageSource, /onUnavailable\(\)/, 'A renderer that cannot start falls back rather than failing.');

const appSource = await readFile('src/react/AtlasApp.tsx', 'utf8');
assert.match(appSource, /spatialAvailable\s*\n?\s*\?\s*<SpatialShell/, 'Renderer failure renders the conventional shell.');
// Issue #166: for ordinary navigation the spatial surface IS the screen. The
// conventional panel renders only when an activity or results owns the content.
const shellSource = await readFile('src/spatial/SpatialShell.tsx', 'utf8');
assert.match(
  shellSource,
  /state\.navigation\s*\n?\s*\?\s*<SpatialCommand[\s\S]*?:\s*<div className="spatial-shell__panel"/,
  'No conventional launcher page renders beneath spatial navigation.',
);
assert.match(appSource, /resolveTapTarget\(spatialState, countryId\)/, 'Geography selection resolves through the shared contract.');
assert.match(appSource, /navigateStable\(route\)/, 'Geography selection dispatches the same navigation the DOM controls use.');

const gestureSource = await readFile('src/spatial/gestures.ts', 'utf8');
assert.match(gestureSource, /EDGE_GUTTER_PX = 28/, 'The platform back-gesture gutter is reserved.');
const spatialCss = await readFile('src/styles/spatial.css', 'utf8');
assert.match(spatialCss, /\.spatial-stage__surface \{[^}]*touch-action: none;/s, 'touch-action is scoped to the stage.');
assert.equal(spatialCss.includes('body { touch-action'), false, 'The document never surrenders its touch behaviour.');
assert.match(spatialCss, /@media \(forced-colors: active\)/, 'Forced-colours mode falls back to the DOM interface.');

// ---------------------------------------------------------------------------
// Routing compatibility is untouched
// ---------------------------------------------------------------------------

for (const path of ['/', '/flags', '/flags/africa', '/flags/africa/west-africa', '/flags/africa/west-africa/test', '/neighbors/oceania/polynesia', '/profile']) {
  const route = parseRoutePath(path);
  assert.ok(route, `${path} still parses.`);
  assert.equal(serializeRoutePath(route), path === '/' ? '/' : path, `${path} still round-trips.`);
}

// ---------------------------------------------------------------------------
// Payload budget, measured from the built artifact
// ---------------------------------------------------------------------------

const distFiles = await readdir(join('dist', 'assets'));
const gzipOf = async (name) => gzipSync(await readFile(join('dist', 'assets', name)), { level: 9 }).length;
const find = (prefix) => {
  const match = distFiles.find((name) => name.startsWith(prefix) && name.endsWith('.js'));
  assert.ok(match, `Built artifact contains a ${prefix} chunk.`);
  return match;
};

const rendererChunk = find('stage-controller-');
const worldChunk = find('world-');
const rendererGzip = await gzipOf(rendererChunk);
const worldGzip = await gzipOf(worldChunk);
const entryGzip = rendererGzip + worldGzip;
const SPATIAL_ENTRY_BUDGET = 250 * 1024;
assert.ok(
  entryGzip <= SPATIAL_ENTRY_BUDGET,
  `Spatial entry payload is ${entryGzip} gzip bytes, over the ${SPATIAL_ENTRY_BUDGET} budget.`,
);

const coreGzip = gzipSync(await readFile(join('dist', 'app.js')), { level: 9 }).length;
assert.ok(coreGzip < 120 * 1024, `Core app.js stays lean at ${coreGzip} gzip bytes; the spatial stack is not in it.`);
const coreSource = await readFile(join('dist', 'app.js'), 'utf8');
assert.equal(coreSource.includes('WebGLRenderer'), false, 'The renderer is not linked into the initial shell.');

const continentGzip = {};
for (const continentId of CONTINENT_IDS) {
  const names = distFiles.filter((name) => name.startsWith(`${continentId}-`) && name.endsWith('.js'));
  const sizes = await Promise.all(names.map(gzipOf));
  // The smaller of the two same-named chunks is the globe LOD; the larger is the
  // existing projected 2D asset.
  continentGzip[continentId] = Math.min(...sizes);
  assert.ok(continentGzip[continentId] < 100 * 1024, `${continentId} globe detail stays under 100 kB gzip.`);
}

// The spatial shell is precached like the rest of the shell; continent detail is not.
const serviceWorker = await readFile(join('dist', 'sw.js'), 'utf8');
assert.ok(serviceWorker.includes(rendererChunk), 'The renderer is precached with the shell.');
assert.ok(serviceWorker.includes(worldChunk), 'World geography is precached with the shell.');
for (const continentId of CONTINENT_IDS) {
  const names = distFiles.filter((name) => name.startsWith(`${continentId}-`) && name.endsWith('.js'));
  for (const name of names) {
    assert.equal(serviceWorker.includes(name), false, `${name} stays lazy rather than joining the install payload.`);
  }
}

const report = [
  `renderer ${rendererGzip} gzip`,
  `world geography ${worldGzip} gzip`,
  `spatial entry ${entryGzip} gzip (budget ${SPATIAL_ENTRY_BUDGET})`,
  `core app.js ${coreGzip} gzip`,
  `continent detail ${Math.min(...Object.values(continentGzip))}–${Math.max(...Object.values(continentGzip))} gzip`,
].join(', ');

console.log(`Spatial Atlas verification passed: canonical seven-asset LOD, locator-complete curriculum, declared framing policy, route-derived presentation, DOM/geography action parity, no answer leakage, mastery reuse, render-on-demand, lazy fallback-safe stack. ${report}.`);
