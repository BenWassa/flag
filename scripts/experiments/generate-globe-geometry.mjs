#!/usr/bin/env node
/**
 * Issue #119 — spherical geography generator (EXPERIMENT).
 *
 * Emits lat/lon country rings for the globe prototype from the SAME pinned
 * Natural Earth source and the SAME ISO3 identity policy production already
 * uses. This is deliberately an extension of the canonical pipeline, not a
 * second geography system: it re-uses `fetchPinnedSource`, which refuses to
 * return bytes whose sha256 does not match the manifest, so an upstream change
 * fails loudly here exactly as it does in production generation.
 *
 * Output is lat/lon only. Turning lat/lon into sphere positions is the
 * renderer's job, so this file stays free of any Three.js or projection
 * assumption — a different renderer decision (F2) would not invalidate it.
 *
 *   node scripts/experiments/generate-globe-geometry.mjs
 */

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { presimplify, quantile, simplify } from 'topojson-simplify';
import { topology } from 'topojson-server';
import { feature } from 'topojson-client';
import { fetchPinnedSource } from '../lib/pinned-natural-earth.mjs';

const OUT_DIR = new URL('../../experiments/spatial-atlas/generated/', import.meta.url);

/**
 * Level of detail. `retained` is topojson-simplify's quantile fraction: SMALLER
 * simplifies more, 1.0 is a no-op. Two levels only — the prototype traverses
 * world → continent → region, and a third level would be cost without a
 * question attached to it.
 */
const LODS = [
  // World: every canonical country, coarse. Tiny geography becomes a locator
  // rather than disappearing (see LOCATOR POLICY below).
  { name: 'world', retained: 0.10, minPointsPerRing: 4, minRingAreaDeg2: 0.8, scope: null },
  // Continent: only the continent's own countries plus context, finer. Chunking
  // per continent is what keeps the payload proportional to what is on screen.
  { name: 'africa', retained: 0.45, minPointsPerRing: 4, minRingAreaDeg2: 0.02, scope: 'africa' },
];

/**
 * LOCATOR POLICY — mirrors production cartography.
 *
 * Simplification legitimately erases countries smaller than the retained detail
 * (Comoros, Cabo Verde, Mauritius, Sao Tome and Principe, Seychelles at world
 * LOD). Dropping them would make the globe quietly untruthful and unselectable
 * for part of the curriculum, so any canonical country left with no retained
 * ring keeps a locator point instead, exactly as `MapCountryGeometry.locator`
 * does in the production 2D assets. Every curriculum country is therefore
 * present at every LOD, as geometry or as a locator.
 */
function centroidOf(geometry) {
  const polygons = geometry?.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry?.type === 'MultiPolygon' ? geometry.coordinates : [];
  let best = null;
  let bestArea = -1;
  for (const polygon of polygons) {
    const area = ringArea(polygon[0]);
    if (area > bestArea) { bestArea = area; best = polygon[0]; }
  }
  if (!best?.length) return null;
  const lon = best.reduce((sum, p) => sum + p[0], 0) / best.length;
  const lat = best.reduce((sum, p) => sum + p[1], 0) / best.length;
  return [Number(lon.toFixed(3)), Number(lat.toFixed(3))];
}

/**
 * Canonical identity policy. This candidate order mirrors `normalizedSourceId`
 * in `scripts/map-generation-core.mjs`; it is repeated rather than imported
 * because that module is production generation and this is an experiment that
 * must not modify it. `verify-globe-geometry.mjs` cross-checks the result
 * against `src/data/countries.ts`, so a drift between the two fails a check
 * rather than silently producing different geography.
 */
const ID_CANDIDATES = ['ISO_A3_EH', 'ADM0_A3', 'ISO_A3', 'SOV_A3', 'SU_A3', 'GU_A3'];

function resolveCountryId(properties, allowedIds) {
  for (const key of ID_CANDIDATES) {
    const id = String(properties?.[key] ?? '').trim().toUpperCase();
    if (allowedIds.has(id)) return id;
  }
  return null;
}

/** Reads the canonical ISO3 set straight from the production country table. */
async function readCanonicalIds() {
  const source = await readFile(new URL('../../src/data/countries.ts', import.meta.url), 'utf8');
  const ids = new Set();
  // countries.ts stores rows as `ISO3|ISO2|Name|regionId` inside a template literal.
  for (const match of source.matchAll(/^([A-Z]{3})\|[A-Z]{2}\|/gm)) ids.add(match[1]);
  if (ids.size < 150) throw new Error(`Only found ${ids.size} ISO3 ids in countries.ts; the parse is wrong.`);
  return ids;
}

function ringArea(ring) {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += (ring[j][0] * ring[i][1]) - (ring[i][0] * ring[j][1]);
  }
  return Math.abs(area / 2);
}

/**
 * A ring crossing the antimeridian arrives with longitudes that jump ~360°.
 * Left unhandled it produces a country smeared across the whole globe. Rings
 * are unwrapped into a continuous range so the renderer can map them to sphere
 * positions without a seam artifact.
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

function cleanPolygon(polygon, lod) {
  const rings = polygon
    .map((ring) => {
      const rounded = ring.map(([lon, lat]) => [Number(lon.toFixed(3)), Number(lat.toFixed(3))]);
      // Drop the duplicated closing vertex; the renderer closes rings itself.
      const open = rounded.length > 1
        && rounded[0][0] === rounded[rounded.length - 1][0]
        && rounded[0][1] === rounded[rounded.length - 1][1]
        ? rounded.slice(0, -1)
        : rounded;
      return open;
    })
    .filter((ring) => ring.length >= lod.minPointsPerRing && ringArea(ring) >= lod.minRingAreaDeg2)
    .map(unwrapLongitudes);
  return rings.length ? rings : null;
}

function polygonsOf(geometry, lod) {
  if (!geometry) return [];
  const raw = geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : [];
  return raw.map((polygon) => cleanPolygon(polygon, lod)).filter(Boolean);
}

/** Bounding box in degrees, used by the camera director to frame a scope. */
function boundsOf(polygons) {
  let west = Infinity, east = -Infinity, south = Infinity, north = -Infinity;
  for (const polygon of polygons) {
    for (const [lon, lat] of polygon[0]) {
      if (lon < west) west = lon;
      if (lon > east) east = lon;
      if (lat < south) south = lat;
      if (lat > north) north = lat;
    }
  }
  return { west, east, south, north };
}

/** Continent membership straight from the production region/country tables. */
async function readContinentIds() {
  const countriesSource = await readFile(new URL('../../src/data/countries.ts', import.meta.url), 'utf8');
  const continentsSource = await readFile(new URL('../../src/data/continents.ts', import.meta.url), 'utf8');
  const regionToContinent = new Map();
  for (const match of continentsSource.matchAll(/id:\s*'([a-z-]+)'[^}]*?continentId:\s*'([a-z-]+)'/g)) {
    regionToContinent.set(match[1], match[2]);
  }
  const byContinent = new Map();
  for (const match of countriesSource.matchAll(/^([A-Z]{3})\|[A-Z]{2}\|[^|]+\|([a-z-]+)$/gm)) {
    const continent = regionToContinent.get(match[2]);
    if (!continent) continue;
    if (!byContinent.has(continent)) byContinent.set(continent, new Set());
    byContinent.get(continent).add(match[1]);
  }
  return byContinent;
}

async function main() {
  const allowedIds = await readCanonicalIds();
  const continentIds = await readContinentIds();
  for (const [continent, ids] of continentIds) console.log(`  ${continent}: ${ids.size} countries`);
  console.log(`Canonical ISO3 ids: ${allowedIds.size}`);

  const pinned = await fetchPinnedSource('countries');
  console.log(`Source verified: ${pinned.url}`);
  console.log(`  sha256 ${pinned.source.sha256} (${pinned.bytes.length} bytes)`);
  const countries = pinned.json();

  // Keep only features that resolve to a canonical country before simplifying,
  // so simplification weights are not spent on geography we never render.
  const kept = countries.features.filter((f) => resolveCountryId(f.properties, allowedIds));
  console.log(`Source features: ${countries.features.length}, resolved to canonical ids: ${kept.length}`);

  await mkdir(OUT_DIR, { recursive: true });
  const manifest = {
    generator: 'scripts/experiments/generate-globe-geometry.mjs',
    experiment: 'issue-119-spatial-atlas',
    productionAsset: false,
    upstream: pinned.manifest.upstream,
    upstreamCommit: pinned.manifest.upstreamCommit,
    sourcePath: pinned.source.path,
    sourceSha256: pinned.source.sha256,
    identityPolicy: ID_CANDIDATES,
    generatedAt: null,
    lods: {},
  };

  for (const lod of LODS) {
    const sourceTopology = topology({ countries: { type: 'FeatureCollection', features: kept } });
    const weighted = presimplify(sourceTopology);
    const simplified = simplify(weighted, quantile(weighted, lod.retained));
    const collection = feature(simplified, simplified.objects.countries);

    const wanted = lod.scope ? continentIds.get(lod.scope) : allowedIds;
    const entries = [];
    let ringCount = 0;
    let pointCount = 0;
    let locatorCount = 0;
    const seen = new Set();
    for (const f of collection.features) {
      const id = resolveCountryId(f.properties, allowedIds);
      if (!id || !wanted.has(id) || seen.has(id)) continue;
      const polygons = polygonsOf(f.geometry, lod);
      if (polygons.length) {
        seen.add(id);
        for (const polygon of polygons) {
          ringCount += polygon.length;
          for (const ring of polygon) pointCount += ring.length;
        }
        entries.push({ id, polygons, bounds: boundsOf(polygons) });
      }
    }
    // Locator fallback, computed from the UNSIMPLIFIED source so the point is
    // where the country actually is, not where simplification left it.
    for (const id of wanted) {
      if (seen.has(id)) continue;
      const sourceFeature = kept.find((f) => resolveCountryId(f.properties, allowedIds) === id);
      const locator = sourceFeature ? centroidOf(sourceFeature.geometry) : null;
      if (!locator) continue;
      locatorCount += 1;
      entries.push({
        id,
        polygons: [],
        locator,
        bounds: { west: locator[0], east: locator[0], south: locator[1], north: locator[1] },
      });
    }

    entries.sort((a, b) => a.id.localeCompare(b.id));
    const payload = { lod: lod.name, retained: lod.retained, countries: entries };
    const path = new URL(`globe-${lod.name}.json`, OUT_DIR);
    const json = JSON.stringify(payload);
    await writeFile(path, json);

    manifest.lods[lod.name] = {
      retained: lod.retained,
      scope: lod.scope,
      countries: entries.length,
      withGeometry: entries.length - locatorCount,
      locators: locatorCount,
      rings: ringCount,
      points: pointCount,
      bytes: Buffer.byteLength(json),
    };
    console.log(
      `  ${lod.name}: ${entries.length} countries (${locatorCount} as locators), ${ringCount} rings, `
      + `${pointCount} points, ${(Buffer.byteLength(json) / 1024).toFixed(1)} kB raw`,
    );
  }

  await writeFile(new URL('provenance.json', OUT_DIR), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log('Wrote experiments/spatial-atlas/generated/.');
}

await main();
