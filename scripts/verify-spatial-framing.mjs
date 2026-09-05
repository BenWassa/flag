import assert from 'node:assert/strict';

import { getLearningScopeDefinition } from '../.verify-dist/data/learning-scopes.js';
import { decodeGlobeAsset } from '../.verify-dist/spatial/globe-asset.js';
import { DEG, framingFor } from '../.verify-dist/spatial/geo.js';
import {
  countryIdsForScope,
  framingBoxes,
  maximumDistanceForFramedScope,
  poseForFraming,
  poseForSelectedFraming,
  WORLD_FRAMING,
} from '../.verify-dist/spatial/scope-geography.js';

/** Matches `GLOBE_FOV` without importing the renderer into the Node verifier. */
const GLOBE_FOV = 38;
const LEGACY_FRAMING_PADDING = 1.12;
const LEGACY_MAXIMUM_FRAMED_SPAN_DEG = 170;

const REQUIRED_SCOPES = [
  'africa',
  'asia',
  'north-america',
  'south-america',
  'oceania',
  'caribbean',
  'middle-east',
  'caucasus',
  'polynesia',
  'micronesia',
];

const VIEWPORTS = [
  { label: '320x568', width: 320, height: 568 },
  { label: '390x844', width: 390, height: 844 },
  { label: '844x390', width: 844, height: 390 },
  { label: '768x1024', width: 768, height: 1024 },
  { label: '1440x900', width: 1440, height: 900 },
];

const worldModule = await import('../.verify-dist/data/globe/world.js');
const world = decodeGlobeAsset(Object.values(worldModule)[0]);

function legacyDistance(framing, aspect) {
  const spanLat = framing.spanLat * LEGACY_FRAMING_PADDING;
  const spanLon = framing.spanLon * LEGACY_FRAMING_PADDING;
  const effective = Math.max(spanLat, (spanLon / Math.max(aspect, 0.35)) * 0.75);
  const angle = Math.min(Math.max(effective, 18), LEGACY_MAXIMUM_FRAMED_SPAN_DEG) * DEG;
  const chord = 2 * Math.sin(angle / 2);
  return Math.max(1.06, 1 + (chord / 2) / Math.tan((GLOBE_FOV * DEG) / 2));
}

const scopes = REQUIRED_SCOPES.map((id) => {
  const definition = getLearningScopeDefinition(id);
  assert.ok(definition, `${id} is a canonical learner-facing scope.`);
  return definition.scope;
});

const evidence = [];
for (const scope of scopes) {
  const framing = framingFor(framingBoxes(world, countryIdsForScope(scope)));
  assert.ok(framing, `${scope.label} has canonical production framing geometry.`);
  assert.ok(Number.isFinite(framing.lon) && Number.isFinite(framing.lat), `${scope.label} frame has a finite target.`);
  assert.ok(framing.spanLon > 0 && framing.spanLat > 0, `${scope.label} frame has geographic extent.`);

  for (const viewport of VIEWPORTS) {
    const aspect = viewport.width / viewport.height;
    const initial = poseForSelectedFraming(framing, GLOBE_FOV, aspect).distance;
    const legacy = legacyDistance(framing, aspect);
    const maximum = maximumDistanceForFramedScope(initial);
    const clearanceGain = (legacy - 1) / (initial - 1) - 1;
    const retainedAtMaximum = (initial - 1) / (maximum - 1);

    assert.ok(initial > 1.05 && initial < 4.2, `${scope.label} ${viewport.label} starts at a usable distance.`);
    assert.ok(maximum > initial, `${scope.label} ${viewport.label} permits modest zoom-out beyond the initial frame.`);
    assert.ok(maximum <= 4.2, `${scope.label} ${viewport.label} never exceeds the established global marble ceiling.`);
    assert.ok(Math.abs(retainedAtMaximum - 0.8) < 1e-10, `${scope.label} ${viewport.label} keeps 80% of initial apparent scale at maximum retreat.`);

    evidence.push({
      scope: scope.label,
      viewport: viewport.label,
      legacy,
      initial,
      maximum,
      clearanceGain,
    });
  }
}

const phoneEvidence = new Map(
  evidence
    .filter((row) => row.viewport === '390x844')
    .map((row) => [row.scope, row]),
);
for (const label of ['Africa', 'Asia', 'North America', 'South America', 'Oceania', 'Caribbean', 'Middle East']) {
  const row = phoneEvidence.get(label);
  assert.ok(row, `${label} has 390x844 production framing evidence.`);
  assert.ok(
    row.clearanceGain >= 0.09,
    `${label} is materially larger than the #199 baseline at 390x844 (${(row.clearanceGain * 100).toFixed(1)}% camera-clearance scale gain).`,
  );
}

for (const label of ['Caucasus', 'Polynesia']) {
  const row = phoneEvidence.get(label);
  assert.ok(row, `${label} has 390x844 production framing evidence.`);
  const floorDistance = poseForSelectedFraming(
    { lon: 0, lat: 0, spanLon: 18, spanLat: 18 },
    GLOBE_FOV,
    390 / 844,
  ).distance;
  assert.ok(
    Math.abs(row.initial - floorDistance) < 1e-10,
    `${label} keeps the 18° orienting floor instead of over-zooming tiny geography.`,
  );
}

const worldGeneral = poseForFraming(WORLD_FRAMING, GLOBE_FOV, 390 / 844).distance;
const selectedSameSpan = poseForSelectedFraming(WORLD_FRAMING, GLOBE_FOV, 390 / 844).distance;
assert.ok(
  worldGeneral > selectedSameSpan,
  'The selected-scope arc limit is isolated from the established world/general framing contract.',
);

console.log('Spatial framing verification passed. Canonical #199 evidence:');
for (const row of evidence) {
  console.log(
    `  ${row.viewport.padEnd(9)} ${row.scope.padEnd(15)} `
    + `baseline ${row.legacy.toFixed(4)} -> initial ${row.initial.toFixed(4)} `
    + `(${(row.clearanceGain * 100).toFixed(1)}% clearance-scale gain), `
    + `zoom-out max ${row.maximum.toFixed(4)}.`,
  );
}
