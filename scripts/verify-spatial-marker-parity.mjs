/**
 * Issue #200 — exact generated marker → practical-touch parity audit.
 *
 * `scopeMarkersFor` is the production marker inventory, while GeographyIndex is
 * the production picking/assistance owner. This verifier runs both against every
 * supported continent/region frame on a phone-sized stage and the exact decoded
 * Natural Earth assets emitted into `.verify-dist`.
 */
import assert from 'node:assert/strict';

import { CONTINENTS } from '../.verify-dist/data/continents.js';
import { getMapContinentConfig } from '../.verify-dist/data/map-scopes.js';
import {
  ASSIST_RADIUS_PX,
  ASSIST_THRESHOLD_PX,
  DEG,
  GeographyIndex,
  framingFor,
  mergeForPicking,
  touchGeometryForCountry,
  wrapLon,
} from '../.verify-dist/spatial/geo.js';
import { decodeGlobeAsset } from '../.verify-dist/spatial/globe-asset.js';
import {
  countryIdsForScope,
  framingBoxes,
  poseForSelectedFraming,
} from '../.verify-dist/spatial/scope-geography.js';
import { scopeMarkersFor } from '../.verify-dist/spatial/scope-markers.js';

/** Mirrors production globe/stage constants. */
const GLOBE_FOV = 38;
const STAGE = { width: 390, height: 640 };

const load = async (lod) => {
  const module = await import(`../.verify-dist/data/globe/${lod}.js`);
  return decodeGlobeAsset(Object.values(module)[0]);
};

const degreesPerPixel = (distance) =>
  ((2 * Math.atan(Math.tan((GLOBE_FOV / 2) * DEG) * Math.max(0.01, distance - 1))) / DEG) / STAGE.height;

const world = await load('world');
const worldById = new Map(world.countries.map((country) => [country.id, country]));

const frames = [];
for (const continent of CONTINENTS) {
  const config = getMapContinentConfig(continent.id);
  if (!config) continue;
  const detail = await load(continent.id);
  const countries = mergeForPicking(detail.countries, world.countries);
  const index = new GeographyIndex(countries);
  const byId = new Map(countries.map((country) => [country.id, country]));

  for (const { scope } of [{ scope: config.scope }, ...config.regions]) {
    const ids = countryIdsForScope(scope);
    const framing = framingFor(framingBoxes(world, ids));
    if (!framing) continue;
    const distance = poseForSelectedFraming(
      framing,
      GLOBE_FOV,
      STAGE.width / STAGE.height,
    ).distance;
    const scale = { degreesPerPixel: degreesPerPixel(distance) };
    const markers = scopeMarkersFor(
      ids,
      worldById,
      Math.max(framing.spanLon, framing.spanLat),
      index,
      scale,
    );
    frames.push({ continent: continent.id, scope, countries, byId, index, scale, markers });
  }
}

assert.ok(frames.length >= 30, `Every supported continent/region frame is audited (${frames.length}).`);

const markerIds = new Set();
const markerIdsByContinent = new Map();
const markerIdsByScope = new Map();
let markerInstances = 0;
let embeddedHostCentres = 0;
let edgeSamples = 0;
let edgeUncontested = 0;
let zoomRetired = 0;

/** Same latitude-corrected distance metric GeographyIndex uses for envelopes. */
function distanceTo(anchor, lon, lat) {
  const lonScale = Math.cos(lat * DEG);
  return Math.hypot(lat - anchor[1], wrapLon(lon - anchor[0]) * lonScale);
}

for (const frame of frames) {
  const scopeSet = markerIdsByScope.get(frame.scope.id) ?? new Set();
  markerIdsByScope.set(frame.scope.id, scopeSet);
  const continentSet = markerIdsByContinent.get(frame.continent) ?? new Set();
  markerIdsByContinent.set(frame.continent, continentSet);

  // Precompute every assistance candidate on the mounted picking surface. A
  // near-edge sample is "uncontested" only when this marker is the nearest
  // eligible assisted anchor; real land is handled separately by precedence.
  const assisted = frame.countries.flatMap((country) => {
    const anchor = frame.index.assistanceAnchor(country.id, frame.scale);
    if (!anchor) return [];
    return [{
      id: country.id,
      anchor,
      spanDeg: touchGeometryForCountry(country).spanDeg,
    }];
  });

  for (const marker of frame.markers) {
    markerInstances += 1;
    markerIds.add(marker.id);
    continentSet.add(marker.id);
    scopeSet.add(marker.id);

    const country = frame.byId.get(marker.id);
    assert.ok(country, `${marker.id} exists on the mounted ${frame.continent} picking surface.`);
    const geometry = touchGeometryForCountry(country);

    assert.deepEqual(
      marker.anchor,
      geometry.anchor,
      `${marker.id} marker uses the current-LOD source-derived touch anchor in ${frame.scope.label}.`,
    );
    assert.deepEqual(
      frame.index.assistanceAnchor(marker.id, frame.scale),
      marker.anchor,
      `${marker.id} is visibly marked only while its matching practical envelope exists in ${frame.scope.label}.`,
    );

    const bareCentre = frame.index.resolve(marker.anchor[0], marker.anchor[1]);
    const assistedCentre = frame.index.resolve(marker.anchor[0], marker.anchor[1], frame.scale);
    if (bareCentre && bareCentre !== marker.id) embeddedHostCentres += 1;

    // #166 deliberately lets an embedded microstate own its own assisted centre
    // even when the broader host polygon is what bare containment sees first
    // (San Marino / Italy is the canonical case). Real-land precedence is
    // preserved by the bounded intrusion rule away from that tiny centre, not by
    // making the visible microstate marker itself untappable.
    assert.equal(
      assistedCentre,
      marker.id,
      `${marker.id} marker centre resolves its own canonical identity in ${frame.scope.label}.`,
    );

    // Probe 80% of the practical radius in eight directions. Over another real
    // polygon that polygon legitimately owns the tap once the established
    // intrusion bound is exceeded. Over open water, assert this marker wherever
    // no other assisted anchor is nearer.
    const radius = ASSIST_RADIUS_PX * frame.scale.degreesPerPixel;
    for (let turn = 0; turn < 8; turn += 1) {
      edgeSamples += 1;
      const angle = (turn / 8) * Math.PI * 2;
      const dLat = Math.sin(angle) * radius * 0.8;
      const sampleLat = marker.anchor[1] + dLat;
      const sampleLon = marker.anchor[0]
        + (Math.cos(angle) * radius * 0.8) / Math.max(0.15, Math.cos(sampleLat * DEG));
      const bare = frame.index.resolve(sampleLon, sampleLat);
      if (bare && bare !== marker.id) continue;

      const candidates = assisted
        .map((candidate) => ({
          ...candidate,
          distance: distanceTo(candidate.anchor, sampleLon, sampleLat),
        }))
        .filter((candidate) => candidate.distance <= radius)
        .sort((a, b) =>
          a.distance - b.distance
          || a.spanDeg - b.spanDeg
          || a.id.localeCompare(b.id));
      if (!candidates.length || candidates[0].id !== marker.id) continue;

      edgeUncontested += 1;
      assert.equal(
        frame.index.resolve(sampleLon, sampleLat, frame.scale),
        marker.id,
        `${marker.id} keeps its uncontested practical-envelope edge in ${frame.scope.label}.`,
      );
    }

    // Detail polygons have measurable span and must eventually leave both the
    // assisted inventory and visible marker inventory as the learner zooms in.
    // Locator-only countries cannot acquire physical size at that LOD, so those
    // are intentionally excluded from this retirement assertion.
    if (geometry.spanDeg > 0) {
      const close = { degreesPerPixel: geometry.spanDeg / (ASSIST_THRESHOLD_PX * 2) };
      assert.equal(
        frame.index.assistanceAnchor(marker.id, close),
        null,
        `${marker.id} assistance retires once its own detail geometry is aimable.`,
      );
      zoomRetired += 1;
    }
  }
}

assert.ok(markerInstances >= 40, `Generated audit exercises a substantial marker inventory (${markerInstances}).`);
assert.ok(markerIds.size >= 20, `Generated audit covers many distinct tiny countries (${markerIds.size}).`);
assert.ok(edgeUncontested >= 100, `Near-edge reliability is exercised broadly (${edgeUncontested}/${edgeSamples}).`);
assert.ok(zoomRetired >= 20, `Zoom retirement is exercised on real detail geometry (${zoomRetired}).`);

// Required #200 geographic breadth and reported cases. These assertions are
// inventory-derived: no country gets special picking behaviour from this list.
for (const id of ['SGP', 'MDV', 'BHR']) {
  assert.ok(markerIds.has(id), `${id} appears in the generated visible-marker inventory.`);
}
assert.ok(markerIdsByContinent.get('north-america')?.size, 'North America / Caribbean tiny geography is represented.');
assert.ok(markerIdsByContinent.get('oceania')?.size, 'Pacific tiny geography is represented.');
assert.ok(markerIdsByScope.get('caribbean')?.size, 'Caribbean marker inventory is audited.');
assert.ok(markerIdsByScope.get('micronesia')?.size, 'Micronesia marker inventory is audited.');
assert.ok(markerIdsByScope.get('polynesia')?.size, 'Polynesia marker inventory is audited.');

console.log(
  `Spatial marker parity verification passed: ${frames.length} frames, ${markerInstances} marker instances / `
  + `${markerIds.size} countries, ${edgeUncontested}/${edgeSamples} uncontested edge samples, `
  + `${zoomRetired} zoom-retirement cases, ${embeddedHostCentres} embedded-host marker centres.`,
);
