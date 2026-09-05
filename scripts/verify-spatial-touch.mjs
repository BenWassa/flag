/**
 * Issue #166 — small-island / microstate touch reliability, against the exact
 * generated geography at the frames Atlas actually uses.
 *
 * The unit tests in `src/spatial/geo.test.ts` state the picking contract on
 * synthetic geography. This verifier proves the same rules hold for the real
 * Natural Earth assets: that every reported failure is now selectable, that no
 * ordinary country was displaced to achieve it, and that nothing here draws or
 * reveals anything.
 */
import assert from 'node:assert/strict';

import { CONTINENTS } from '../.verify-dist/data/continents.js';
import { getMapContinentConfig } from '../.verify-dist/data/map-scopes.js';
import {
  ASSIST_INTRUSION_SHARE,
  ASSIST_RADIUS_PX,
  ASSIST_THRESHOLD_PX,
  DEG,
  GeographyIndex,
  framingFor,
  mergeForPicking,
} from '../.verify-dist/spatial/geo.js';
import { decodeGlobeAsset } from '../.verify-dist/spatial/globe-asset.js';
import {
  WORLD_FRAMING,
  countryIdsForScope,
  framingBoxes,
  poseForSelectedFraming,
} from '../.verify-dist/spatial/scope-geography.js';

/** Matches `GLOBE_FOV` in the renderer, which the verifier must not import. */
const GLOBE_FOV = 38;
/** A production phone: 390x844 with the compact spatial command band deducted. */
const STAGE = { width: 390, height: 640 };

const load = async (lod) => {
  const module = await import(`../.verify-dist/data/globe/${lod}.js`);
  return decodeGlobeAsset(Object.values(module)[0]);
};

const degreesPerPixel = (distance) =>
  ((2 * Math.atan(Math.tan((GLOBE_FOV / 2) * DEG) * Math.max(0.01, distance - 1))) / DEG) / STAGE.height;

const dimensions = (country) => {
  const [west, south, east, north] = country.mainland;
  const height = north - south;
  const width = (east - west) * Math.cos(((south + north) / 2) * DEG);
  return { span: Math.max(height, width), narrow: Math.min(height, width) };
};

const world = await load('world');

/** Every scope Atlas can frame, with the picking surface and camera it uses. */
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
    const framing = framingFor(framingBoxes(world, ids)) ?? WORLD_FRAMING;
    const scale = {
      degreesPerPixel: degreesPerPixel(
        poseForSelectedFraming(framing, GLOBE_FOV, STAGE.width / STAGE.height).distance,
      ),
    };
    frames.push({ continent: continent.id, scope, ids, index, byId, scale });
  }
}
assert.ok(frames.length >= 30, 'Every supported continent and region contributes a frame.');

/**
 * Reachability: sweep taps across the disc a fingertip covers around the
 * country's own anchor, at a third, two thirds and the whole of half the
 * envelope radius. Three rings rather than one because a land-locked speck gains
 * its reach close in — the intrusion bound deliberately stops it reaching
 * further onto a neighbour — while an island gains it all the way out.
 *
 * A country nothing can reach fails here, and so does a country a neighbour's
 * assistance has covered over.
 */
function reach(frame, id) {
  const country = frame.byId.get(id);
  if (!country) return null;
  const [west, south, east, north] = country.mainland;
  const anchor = country.locator ?? [(west + east) / 2, (south + north) / 2];
  const step = (ASSIST_RADIUS_PX / 2) * frame.scale.degreesPerPixel;
  const samples = [[0, 0]];
  for (const ring of [1 / 3, 2 / 3, 1]) {
    for (let turn = 0; turn < 8; turn += 1) {
      const angle = (turn / 8) * Math.PI * 2;
      samples.push([Math.cos(angle) * step * ring, Math.sin(angle) * step * ring]);
    }
  }
  let hits = 0;
  let bare = 0;
  for (const [dLon, dLat] of samples) {
    const lon = anchor[0] + dLon / Math.max(0.15, Math.cos(anchor[1] * DEG));
    const lat = anchor[1] + dLat;
    if (frame.index.resolve(lon, lat, frame.scale) === id) hits += 1;
    if (frame.index.resolve(lon, lat) === id) bare += 1;
  }
  return { hits, bare, samples: samples.length, anchor, ...dimensions(country) };
}

// ---------------------------------------------------------------------------
// 1. The reported failures, and representative small islands elsewhere.
// ---------------------------------------------------------------------------
const REPORTED = ['SGP', 'MDV', 'BRN', 'BHR'];
/** One genuinely small island target per other continent, all curriculum. */
const ISLANDS = {
  africa: ['STP', 'SYC', 'CPV', 'COM', 'MUS'],
  europe: ['MLT', 'MCO', 'SMR', 'VAT', 'AND', 'LIE'],
  'north-america': ['ATG', 'KNA', 'GRD', 'VCT', 'LCA', 'DMA', 'BRB'],
  oceania: ['NRU', 'TUV', 'MHL', 'PLW', 'FSM', 'KIR', 'TON'],
  'south-america': ['SUR', 'GUY', 'URY'],
  asia: ['SGP', 'MDV', 'BRN', 'BHR', 'QAT', 'LBN', 'PSE', 'CYP'],
};

let audited = 0;
let assisted = 0;
const reportedEvidence = [];
for (const frame of frames) {
  const watch = new Set([...REPORTED, ...(ISLANDS[frame.continent] ?? [])]);
  for (const id of frame.ids) {
    if (!watch.has(id)) continue;
    const result = reach(frame, id);
    if (!result) continue;
    audited += 1;
    const speck = result.span < ASSIST_THRESHOLD_PX * frame.scale.degreesPerPixel;

    // A country's anchor selects it whenever the anchor is on its own geometry.
    // A bounding-box centre legitimately falls offshore for a crescent, so the
    // unassisted answer decides whether the anchor is a fair place to ask.
    const unassisted = frame.index.resolve(result.anchor[0], result.anchor[1]);
    if (unassisted === id || !frame.byId.get(id).polygons.length) {
      assert.equal(
        frame.index.resolve(result.anchor[0], result.anchor[1], frame.scale),
        id,
        `${id} resolves to itself at its own anchor in ${frame.scope.label}.`,
      );
    }

    // The #166 requirement proper. A target too small to aim at gets a practical
    // envelope, so assistance must strictly widen what a near-miss selects.
    // Countries above the threshold are ordinary geography, and making those
    // easier is a zoom question (#137), not this one's.
    if (!speck) continue;
    assisted += 1;
    assert.ok(
      result.hits > result.bare,
      `${id} gains reach from assistance in ${frame.scope.label} `
      + `(${result.bare}/${result.samples} unassisted, ${result.hits}/${result.samples} assisted).`,
    );

    // The reported blockers are islands and coastal microstates with room around
    // them, so they must clear a stronger bar: most of a fingertip's worth of
    // near-miss in most directions.
    if (!REPORTED.includes(id)) continue;
    reportedEvidence.push(
      `${id}@${frame.scope.label} ${result.bare}->${result.hits}/${result.samples}`,
    );
    // At least half the area a fingertip covers around the target selects it.
    // Brunei at the whole-Asia frame is the binding case at 13/25: it is an
    // enclave inside the narrow Sarawak strip, and reaching further would take
    // Malaysia's own land rather than water.
    assert.ok(
      result.hits >= result.samples * 0.48,
      `${id} tolerates a phone-scale near-miss in ${frame.scope.label} `
      + `(${result.hits}/${result.samples} samples).`,
    );
  }
}
assert.ok(audited >= 60, `Small-target audit covers the reported and representative cases (${audited}).`);
assert.ok(assisted >= 20, `The audit actually exercises assisted geography (${assisted} envelopes).`);

// ---------------------------------------------------------------------------
// 2. No country, anywhere, was made unreachable by another's assistance.
// ---------------------------------------------------------------------------

/**
 * A point genuinely on the country, which a bounding-box centre is not: the
 * centre of Malaysia's largest polygon, the Sarawak crescent, is out at sea.
 * Found by asking unassisted picking, so it is the country's real geometry.
 */
function interior(frame, country) {
  if (!country.polygons.length) {
    return country.locator ? { total: 1, kept: frame.index.resolve(country.locator[0], country.locator[1], frame.scale) === country.id ? 1 : 0 } : null;
  }
  const [west, south, east, north] = country.mainland;
  const steps = 24;
  let total = 0;
  let kept = 0;
  for (let row = 1; row < steps; row += 1) {
    const lat = south + ((north - south) * row) / steps;
    for (let column = 1; column < steps; column += 1) {
      const lon = west + ((east - west) * column) / steps;
      if (frame.index.resolve(lon, lat) !== country.id) continue;
      total += 1;
      if (frame.index.resolve(lon, lat, frame.scale) === country.id) kept += 1;
    }
  }
  return total ? { total, kept } : null;
}

let reachable = 0;
let worst = { share: 2 };
for (const frame of frames) {
  for (const id of frame.ids) {
    const country = frame.byId.get(id);
    if (!country) continue;
    const result = interior(frame, country);
    // Simplification can legitimately leave a country with neither a retained
    // ring nor a sampled interior at this LOD; `verify-spatial-atlas.mjs` owns
    // that completeness contract.
    if (!result) continue;
    reachable += 1;
    const share = result.kept / result.total;
    if (share < worst.share) worst = { share, id, scope: frame.scope.label, ...result };
    assert.ok(
      result.kept >= 1,
      `${id} keeps somewhere selectable in ${frame.scope.label}; nothing covered it over.`,
    );
    // Assistance may take a bounded bite at a border, never a country's interior.
    assert.ok(
      share >= 0.5,
      `${id} keeps most of its own interior in ${frame.scope.label} `
      + `(${result.kept}/${result.total} sampled points).`,
    );
  }
}
assert.ok(reachable >= 380, `Every curriculum country was probed for reachability (${reachable}).`);

// ---------------------------------------------------------------------------
// 3. Real polygons keep #117 precedence, and assistance stays bounded.
// ---------------------------------------------------------------------------
for (const frame of frames) {
  const threshold = ASSIST_THRESHOLD_PX * frame.scale.degreesPerPixel;
  for (const id of frame.ids) {
    const country = frame.byId.get(id);
    if (!country?.polygons.length) continue;
    const { span, narrow } = dimensions(country);
    if (span < threshold) {
      // A speck owns its own land outright.
      const [west, south, east, north] = country.mainland;
      const centre = [(west + east) / 2, (south + north) / 2];
      if (frame.index.resolve(centre[0], centre[1]) === id) {
        assert.equal(
          frame.index.resolve(centre[0], centre[1], frame.scale), id,
          `${id} keeps its own land in ${frame.scope.label}.`,
        );
      }
      continue;
    }
    // Section 2 proves the retained-interior guarantee directly, against the
    // country's real geometry rather than a bounding-box proxy.
    assert.ok(narrow > 0, `${id} has a measurable extent in ${frame.scope.label}.`);
  }
}

// ---------------------------------------------------------------------------
// 4. Assistance is stable, deterministic and answer-independent.
// ---------------------------------------------------------------------------
const asia = frames.find((frame) => frame.scope.label === 'Asia');
assert.ok(asia, 'The Asia continent frame is available for the determinism checks.');

// Country order in the asset cannot change a resolution.
const shuffled = new GeographyIndex([...asia.byId.values()].reverse());
for (const id of REPORTED) {
  const country = asia.byId.get(id);
  const [west, south, east, north] = country.mainland;
  const anchor = country.locator ?? [(west + east) / 2, (south + north) / 2];
  for (const offset of [0, 0.15, -0.15, 0.4]) {
    assert.equal(
      asia.index.resolve(anchor[0] + offset, anchor[1], asia.scale),
      shuffled.resolve(anchor[0] + offset, anchor[1], asia.scale),
      `${id} resolves identically regardless of asset order (offset ${offset}).`,
    );
  }
}

// Repeated resolution is stable: nothing here carries per-question state.
for (const id of REPORTED) {
  const country = asia.byId.get(id);
  const [west, south, east, north] = country.mainland;
  const anchor = country.locator ?? [(west + east) / 2, (south + north) / 2];
  const first = asia.index.resolve(anchor[0], anchor[1], asia.scale);
  for (let repeat = 0; repeat < 4; repeat += 1) {
    assert.equal(asia.index.resolve(anchor[0], anchor[1], asia.scale), first,
      `${id} resolves identically on every tap; assistance never depends on the current target.`);
  }
}

// Assistance retires itself as the camera closes in.
const singapore = asia.byId.get('SGP');
const sgpAnchor = singapore.locator ?? [
  (singapore.mainland[0] + singapore.mainland[2]) / 2,
  (singapore.mainland[1] + singapore.mainland[3]) / 2,
];
const sgpSpan = dimensions(singapore).span;
const close = { degreesPerPixel: sgpSpan / 200 };
// Clear of Singapore's own geometry, but well inside the envelope it would have
// claimed at a continent frame.
const away = sgpAnchor[0] + sgpSpan * 1.5;
assert.notEqual(
  asia.index.resolve(away, sgpAnchor[1], close), 'SGP',
  'Zoomed in until Singapore is 200 px wide, it stops claiming its neighbours.',
);
assert.equal(
  asia.index.resolve(away, sgpAnchor[1], asia.scale), 'SGP',
  'While at the continent frame the same position still reaches it.',
);
assert.equal(
  asia.index.resolve(sgpAnchor[0], sgpAnchor[1], close), 'SGP',
  'And it still resolves on its own geography.',
);

// Without a camera scale, picking is pure containment: no envelope, no assist.
assert.equal(asia.index.resolve(-30, 35), null, 'Open ocean resolves to no country unassisted.');

console.log(
  `Spatial touch verification passed: ${frames.length} production frames, ${audited} small-target audits `
  + `(${assisted} assisted), every curriculum country reachable, real polygons retain precedence, `
  + `bounded intrusion (worst retained interior ${(worst.share * 100).toFixed(0)}% — ${worst.id} in ${worst.scope}), `
  + `${reachable} reachability probes, order-independent and answer-independent `
  + `resolution, self-retiring assistance. `
  + `threshold ${ASSIST_THRESHOLD_PX}px, radius ${ASSIST_RADIUS_PX}px, intrusion share ${ASSIST_INTRUSION_SHARE} of characteristic half-width. `
  + `Reported cases (unassisted->assisted near-miss samples): ${reportedEvidence.join(', ')}.`,
);
