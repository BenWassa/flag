#!/usr/bin/env node
/**
 * Issue #119 — canonical spherical geography generator.
 *
 * This is an EXTENSION of the existing pinned Natural Earth pipeline, not a
 * second cartography system. It re-uses `fetchPinnedSource`, which refuses to
 * return bytes whose sha256 does not match `scripts/map-sources/natural-earth.json`,
 * so an upstream change fails here exactly as it does in production generation.
 * Country identity comes from `src/data/countries.ts`; continent membership
 * comes from `src/data/continents.ts`. The renderer owns no taxonomy.
 *
 * Output is lat/lon only. Turning lat/lon into sphere positions is the
 * renderer's job, so nothing here assumes Three.js or any projection.
 *
 *   node scripts/generate-globe-assets.mjs
 *
 * ## LOD contract (F3)
 *
 * Two levels, seven assets:
 *
 *   world   — every canonical country, coarse. Always mounted.
 *   <continent> x6 — that continent's own countries only, finer. Lazily loaded
 *                    and swapped over the world meshes on entry, disposed on exit.
 *
 * Continent assets deliberately carry NO context geography: the world asset is
 * still mounted underneath, so context is free and cannot drift between levels.
 *
 * ## Locator policy
 *
 * Simplification legitimately erases countries smaller than the retained detail.
 * Dropping them would make the globe quietly untruthful and part of the
 * curriculum unselectable, so any canonical country left with no retained ring
 * keeps a locator point instead — computed from the UNSIMPLIFIED source, so the
 * point is where the country actually is. Every canonical country is present at
 * every LOD, as geometry or as a locator.
 */

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { presimplify, quantile, simplify } from 'topojson-simplify';
import { topology } from 'topojson-server';
import { feature } from 'topojson-client';
import { fetchPinnedSource } from './lib/pinned-natural-earth.mjs';
import { encodePolygons } from './lib/globe-encoding.mjs';
import { MAP_GENERATION_CONFIGS } from './map-continent-configs.mjs';

const OUT_DIR = new URL('../src/data/globe/', import.meta.url);

/**
 * `retained` is topojson-simplify's quantile fraction: SMALLER simplifies more.
 * `precision` is quantisation units per degree.
 *
 * World precision 32 (0.031 deg, ~3.5 km) is an order of magnitude finer than a
 * device pixel at the world frame and still finer than a pixel at the deepest
 * dolly the world LOD survives to, which is where the continent LOD takes over.
 */
const WORLD_LOD = {
  name: 'world',
  scope: null,
  retained: 0.08,
  precision: 32,
  minPointsPerRing: 4,
  minRingAreaDeg2: 0.6,
};

const CONTINENT_LOD = {
  retained: 0.42,
  precision: 128,
  minPointsPerRing: 4,
  minRingAreaDeg2: 0.01,
};

const ID_CANDIDATES = ['ISO_A3_EH', 'ADM0_A3', 'ISO_A3', 'SOV_A3', 'SU_A3', 'GU_A3'];

function resolveCountryId(properties, allowedIds) {
  for (const key of ID_CANDIDATES) {
    const id = String(properties?.[key] ?? '').trim().toUpperCase();
    if (allowedIds.has(id)) return id;
  }
  return null;
}

async function readCanonicalCountries() {
  const countriesSource = await readFile(new URL('../src/data/countries.ts', import.meta.url), 'utf8');
  const continentsSource = await readFile(new URL('../src/data/continents.ts', import.meta.url), 'utf8');

  const regionToContinent = new Map();
  for (const match of continentsSource.matchAll(/id:\s*'([a-z-]+)'[^}]*?continentId:\s*'([a-z-]+)'/g)) {
    regionToContinent.set(match[1], match[2]);
  }

  const ids = new Set();
  const byContinent = new Map();
  const continentOf = new Map();
  for (const match of countriesSource.matchAll(/^([A-Z]{3})\|[A-Z]{2}\|[^|]+\|([a-z-]+)$/gm)) {
    const [, id, regionId] = match;
    const continentId = regionToContinent.get(regionId);
    if (!continentId) throw new Error(`Unknown region ${regionId} for ${id}.`);
    ids.add(id);
    continentOf.set(id, continentId);
    if (!byContinent.has(continentId)) byContinent.set(continentId, new Set());
    byContinent.get(continentId).add(id);
  }
  if (ids.size < 150) throw new Error(`Only found ${ids.size} ISO3 ids in countries.ts; the parse is wrong.`);
  return { ids, byContinent, continentOf };
}

function ringArea(ring) {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(area / 2);
}

/**
 * A ring crossing the antimeridian arrives with longitudes that jump ~360 deg.
 * Left unhandled it produces a country smeared across the whole globe. Rings are
 * unwrapped into one continuous range; sin/cos of the unwrapped value is
 * identical, so the renderer needs no seam special case, and framing maths reads
 * a coherent bounding box instead of -180..180.
 */
function unwrapLongitudes(ring) {
  const out = [ring[0]];
  for (let i = 1; i < ring.length; i += 1) {
    const [lon, lat] = ring[i];
    const previous = out[i - 1][0];
    let adjusted = lon;
    while (adjusted - previous > 180) adjusted -= 360;
    while (adjusted - previous < -180) adjusted += 360;
    out.push([adjusted, lat]);
  }
  return out;
}

function quantiseRing(ring, precision) {
  const out = [];
  let lastX = NaN;
  let lastY = NaN;
  for (const [lon, lat] of ring) {
    const x = Math.round(lon * precision);
    const y = Math.round(lat * precision);
    // Quantisation collapses neighbouring vertices onto the same grid cell.
    // Emitting both would cost bytes and produce zero-area triangles.
    if (x === lastX && y === lastY) continue;
    lastX = x;
    lastY = y;
    out.push([x / precision, y / precision]);
  }
  return out;
}

function cleanPolygon(polygon, lod) {
  const rings = polygon
    .map((ring) => {
      // Drop the duplicated closing vertex; the renderer closes rings itself.
      const closed = ring.length > 1
        && ring[0][0] === ring[ring.length - 1][0]
        && ring[0][1] === ring[ring.length - 1][1];
      return quantiseRing(unwrapLongitudes(closed ? ring.slice(0, -1) : ring), lod.precision);
    })
    .filter((ring) => ring.length >= lod.minPointsPerRing && ringArea(ring) >= lod.minRingAreaDeg2);
  return rings.length ? rings : null;
}

function polygonsOf(geometry, lod) {
  const raw = geometry?.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry?.type === 'MultiPolygon'
      ? geometry.coordinates
      : [];
  return raw.map((polygon) => cleanPolygon(polygon, lod)).filter(Boolean);
}

function boundsOf(polygons) {
  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  for (const polygon of polygons) {
    for (const [lon, lat] of polygon[0]) {
      if (lon < west) west = lon;
      if (lon > east) east = lon;
      if (lat < south) south = lat;
      if (lat > north) north = lat;
    }
  }
  return [round(west), round(south), round(east), round(north)];
}

/**
 * Bounding box of the LARGEST polygon only.
 *
 * A country's full extent is the wrong thing to point a camera at. Natural
 * Earth's FRA includes French Guiana, so France's full bounds reach 54 deg W and
 * a naive union puts "Western Europe" in the mid-Atlantic. Framing wants the
 * principal landmass; the full extent is kept separately for anything that
 * genuinely needs it.
 */
function mainlandBoundsOf(polygons) {
  let best = null;
  let bestArea = -1;
  for (const polygon of polygons) {
    const area = ringArea(polygon[0]);
    if (area > bestArea) {
      bestArea = area;
      best = polygon;
    }
  }
  return best ? boundsOf([best]) : null;
}

function centroidOf(geometry) {
  const polygons = geometry?.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry?.type === 'MultiPolygon'
      ? geometry.coordinates
      : [];
  let best = null;
  let bestArea = -1;
  for (const polygon of polygons) {
    const area = ringArea(polygon[0]);
    if (area > bestArea) {
      bestArea = area;
      best = polygon[0];
    }
  }
  if (!best?.length) return null;
  const unwrapped = unwrapLongitudes(best);
  const lon = unwrapped.reduce((sum, point) => sum + point[0], 0) / unwrapped.length;
  const lat = unwrapped.reduce((sum, point) => sum + point[1], 0) / unwrapped.length;
  return [round(((lon + 540) % 360) - 180), round(lat)];
}

const round = (value) => Number(value.toFixed(3));

/**
 * FRAMING POLICY — reused from the production 2D pipeline, not reinvented.
 *
 * `scripts/map-continent-configs.mjs` already declares which countries distort
 * a continent's viewport and which need their remote components clipped before
 * fitting: Russia, France, Norway and the Netherlands are excluded from Europe's
 * focus, and the United States is clipped for North America. A globe has exactly
 * the same defect — Atlas files Russia under Eastern Europe, so a naive union
 * frame for "Europe" has to reach the Bering Strait — and solving it a second
 * way with a statistical heuristic would create a second framing policy that
 * could silently drift from the maps.
 *
 * So each country carries a framing box alongside its geometry: its mainland,
 * clipped to any declared bounds, or omitted entirely when the continent
 * declares it excluded. Excluded countries are still drawn, still selectable and
 * still fully on the curriculum. They just do not aim the camera.
 */
function framingPolicyByContinent() {
  const policy = new Map();
  for (const config of MAP_GENERATION_CONFIGS) {
    policy.set(config.id, {
      excluded: new Set(config.focusExcludeCountryIds ?? config.fitExcludeCountryIds ?? []),
      bounds: config.focusCountryBounds ?? config.fitCountryBounds ?? {},
    });
  }
  return policy;
}

function clampBounds(bounds, box) {
  if (!box) return bounds;
  const [west, south, east, north] = bounds;
  const clamped = [
    Math.max(west, box.minLon ?? west),
    Math.max(south, box.minLat ?? south),
    Math.min(east, box.maxLon ?? east),
    Math.min(north, box.maxLat ?? north),
  ];
  // A declared box that removes the country entirely is a policy error, not a
  // silent empty frame.
  if (clamped[0] > clamped[2] || clamped[1] > clamped[3]) return bounds;
  return clamped.map(round);
}

function buildLod(collection, lod, wantedIds, allowedIds, sourceFeatures, continentOf, policy) {
  const entries = [];
  const seen = new Set();
  let rings = 0;
  let points = 0;

  for (const item of collection.features) {
    const id = resolveCountryId(item.properties, allowedIds);
    if (!id || !wantedIds.has(id) || seen.has(id)) continue;
    const polygons = polygonsOf(item.geometry, lod);
    if (!polygons.length) continue;
    seen.add(id);
    for (const polygon of polygons) {
      rings += polygon.length;
      for (const ring of polygon) points += ring.length;
    }
    const bounds = boundsOf(polygons);
    const mainland = mainlandBoundsOf(polygons) ?? bounds;
    const rules = policy.get(continentOf.get(id));
    const excluded = rules?.excluded.has(id) ?? false;
    const framing = excluded ? null : clampBounds(mainland, rules?.bounds[id]);
    entries.push({
      id,
      p: encodePolygons(polygons, lod.precision),
      b: bounds,
      ...(mainland.join() === bounds.join() ? {} : { m: mainland }),
      ...(excluded ? { x: 1 } : framing.join() === mainland.join() ? {} : { f: framing }),
    });
  }

  let locators = 0;
  for (const id of [...wantedIds].sort()) {
    if (seen.has(id)) continue;
    const sourceFeature = sourceFeatures.find((item) => resolveCountryId(item.properties, allowedIds) === id);
    const locator = sourceFeature ? centroidOf(sourceFeature.geometry) : null;
    if (!locator) throw new Error(`No geometry and no locator for canonical country ${id}.`);
    locators += 1;
    const point = [locator[0], locator[1], locator[0], locator[1]];
    const excluded = policy.get(continentOf.get(id))?.excluded.has(id) ?? false;
    entries.push({ id, p: '', b: point, l: locator, ...(excluded ? { x: 1 } : {}) });
  }

  entries.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { entries, rings, points, locators };
}

function emitModule({ name, constant, lod, entries, provenance }) {
  const rows = entries.map((entry) => {
    const parts = [`id:'${entry.id}'`, `p:${JSON.stringify(entry.p)}`, `b:[${entry.b.join(',')}]`];
    if (entry.m) parts.push(`m:[${entry.m.join(',')}]`);
    if (entry.f) parts.push(`f:[${entry.f.join(',')}]`);
    if (entry.x) parts.push('x:1');
    if (entry.l) parts.push(`l:[${entry.l.join(',')}]`);
    return `{${parts.join(',')}}`;
  });

  const header = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Source: scripts/generate-globe-assets.mjs
 * Upstream: ${provenance.upstream}@${provenance.upstreamCommit}
 * Path: ${provenance.sourcePath}
 * sha256: ${provenance.sourceSha256}
 *
 * Coordinates are delta-encoded varint strings at ${lod.precision} units per degree.
 * Decode with \`decodeGlobeAsset\` in src/spatial/globe-asset.ts.
 */
import type { EncodedGlobeAsset } from '../../spatial/globe-asset.js';

export const ${constant}: EncodedGlobeAsset = {
  lod: '${name}',
  precision: ${lod.precision},
  retained: ${lod.retained},
  countries: [
${rows.map((row) => `    ${row},`).join('\n')}
  ],
};
`;
  return header;
}

const CONSTANT_NAMES = {
  world: 'WORLD_GLOBE_ASSET',
  africa: 'AFRICA_GLOBE_ASSET',
  asia: 'ASIA_GLOBE_ASSET',
  europe: 'EUROPE_GLOBE_ASSET',
  'north-america': 'NORTH_AMERICA_GLOBE_ASSET',
  'south-america': 'SOUTH_AMERICA_GLOBE_ASSET',
  oceania: 'OCEANIA_GLOBE_ASSET',
};

async function main() {
  const { ids: allowedIds, byContinent, continentOf } = await readCanonicalCountries();
  const policy = framingPolicyByContinent();
  console.log(`Canonical ISO3 ids: ${allowedIds.size}`);

  const pinned = await fetchPinnedSource('countries');
  console.log(`Source verified: ${pinned.url}`);
  console.log(`  sha256 ${pinned.source.sha256} (${pinned.bytes.length} bytes)`);
  const source = pinned.json();

  const kept = source.features.filter((item) => resolveCountryId(item.properties, allowedIds));
  console.log(`Source features: ${source.features.length}, resolved to canonical ids: ${kept.length}`);

  const provenance = {
    generator: 'scripts/generate-globe-assets.mjs',
    upstream: pinned.manifest.upstream,
    upstreamCommit: pinned.manifest.upstreamCommit,
    sourcePath: pinned.source.path,
    sourceSha256: pinned.source.sha256,
    sourceVersion: pinned.source.version,
    identityPolicy: ID_CANDIDATES,
    encoding: 'delta-varint',
    framingPolicySource: 'scripts/map-continent-configs.mjs',
    framingExclusions: Object.fromEntries(
      [...policy.entries()]
        .map(([continentId, rules]) => [continentId, [...rules.excluded].sort()])
        .filter(([, excluded]) => excluded.length),
    ),
    framingClamps: Object.fromEntries(
      [...policy.entries()]
        .map(([continentId, rules]) => [continentId, Object.keys(rules.bounds).sort()])
        .filter(([, clamped]) => clamped.length),
    ),
  };

  await mkdir(OUT_DIR, { recursive: true });

  const lods = [
    { ...WORLD_LOD, wanted: allowedIds },
    ...[...byContinent.keys()].sort().map((continentId) => ({
      ...CONTINENT_LOD,
      name: continentId,
      scope: continentId,
      wanted: byContinent.get(continentId),
    })),
  ];

  const measured = {};
  // Simplification is done once per retained level, not once per continent: the
  // six continent assets share one weighting, so a country never gets different
  // geometry depending on which asset it lands in.
  const cache = new Map();
  for (const lod of lods) {
    if (!cache.has(lod.retained)) {
      const sourceTopology = topology({ countries: { type: 'FeatureCollection', features: kept } });
      const weighted = presimplify(sourceTopology);
      const simplified = simplify(weighted, quantile(weighted, lod.retained));
      cache.set(lod.retained, feature(simplified, simplified.objects.countries));
    }
    const collection = cache.get(lod.retained);
    const { entries, rings, points, locators } = buildLod(collection, lod, lod.wanted, allowedIds, kept, continentOf, policy);

    const module = emitModule({
      name: lod.name,
      constant: CONSTANT_NAMES[lod.name],
      lod,
      entries,
      provenance,
    });
    await writeFile(new URL(`${lod.name}.ts`, OUT_DIR), module);

    const raw = Buffer.byteLength(module);
    const gzip = gzipSync(Buffer.from(module), { level: 9 }).length;
    measured[lod.name] = {
      retained: lod.retained,
      precision: lod.precision,
      countries: entries.length,
      withGeometry: entries.length - locators,
      locators,
      rings,
      points,
      moduleBytes: raw,
      moduleGzipBytes: gzip,
    };
    console.log(
      `  ${lod.name}: ${entries.length} countries (${locators} locators), ${rings} rings, ${points} points, `
      + `${(raw / 1024).toFixed(1)} kB raw / ${(gzip / 1024).toFixed(1)} kB gzip`,
    );
  }

  const record = { ...provenance, lods: measured };
  await writeFile(new URL('provenance.json', OUT_DIR), `${JSON.stringify(record, null, 2)}\n`);
  await writeFile(
    new URL('provenance.ts', OUT_DIR),
    `/**\n * GENERATED FILE - do not edit by hand.\n *\n * Source: scripts/generate-globe-assets.mjs\n *\n * Verifiers read this module rather than the JSON so provenance travels with\n * the built artifact instead of only with the repository.\n */\nexport const GLOBE_PROVENANCE = ${JSON.stringify(record, null, 2)} as const;\n`,
  );
  console.log('Wrote src/data/globe/.');
}

await main();
