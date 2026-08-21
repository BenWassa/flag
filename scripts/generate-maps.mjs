#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature, merge, mesh, neighbors } from 'topojson-client';
import { topology } from 'topojson-server';
import { presimplify, quantile, simplify } from 'topojson-simplify';

const MANIFEST_PATH = new URL('./map-sources/natural-earth.json', import.meta.url);
const OUTPUT_PATH = new URL('../src/data/maps/africa.ts', import.meta.url);
const PROVENANCE_PATH = new URL('../docs/architecture/cartography-provenance.json', import.meta.url);
const COUNTRY_SOURCE_PATH = new URL('../src/data/countries.ts', import.meta.url);

const WIDTH = 835;
const HEIGHT = 723;
const PADDING = 22;
const QUANTIZATION = 100_000;
const SIMPLIFICATION_QUANTILE = 0.72;
const PATH_DIGITS = 2;
const ISLAND_LOCATORS = new Set(['CPV', 'STP', 'COM', 'MUS', 'SYC']);
const AFRICA_REGIONS = new Set([
  'north-africa',
  'west-africa',
  'central-africa',
  'east-africa',
  'southern-africa',
]);

const LAKES = [
  ['Lake Victoria', /victoria/i, true],
  ['Lake Tanganyika', /tanganyika/i, true],
  ['Lake Malawi', /(malawi|nyasa)/i, true],
  ['Lake Chad', /\bchad\b/i, true],
  ['Lake Turkana', /turkana/i, false],
  ['Lake Albert', /\balbert\b/i, false],
  ['Lake Kivu', /\bkivu\b/i, false],
  ['Lake Tana', /\btana\b/i, false],
  ['Lake Nasser', /\bnasser\b/i, false],
];

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function loadManifest() {
  return JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
}

async function fetchSource(manifest, key, updateHashes) {
  const source = manifest.sources[key];
  if (!source) throw new Error(`Unknown source ${key}.`);
  const url = `${manifest.rawBaseUrl}/${manifest.upstreamCommit}/${source.path}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not fetch ${key}: ${response.status} ${response.statusText}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const digest = sha256(bytes);
  if (source.sha256 && source.sha256 !== digest) {
    throw new Error(`${key} sha256 mismatch: expected ${source.sha256}, received ${digest}.`);
  }
  if (updateHashes) source.sha256 = digest;
  let json = null;
  if (source.role !== 'evaluated-only') {
    json = JSON.parse(bytes.toString('utf8'));
  }
  return { bytes: bytes.length, digest, json, url };
}

function parseAfricaCatalog(source) {
  const rows = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[A-Z]{3}\|[A-Z]{2}\|.+\|[a-z-]+$/.test(line))
    .map((line) => {
      const [id, iso2, name, region] = line.split('|');
      return { id, iso2, name, region };
    })
    .filter((row) => AFRICA_REGIONS.has(row.region));
  if (rows.length !== 54) throw new Error(`Expected 54 Africa catalog rows, found ${rows.length}.`);
  return rows;
}

function sourceName(featureValue) {
  const properties = featureValue?.properties ?? {};
  return String(
    properties.NAME_EN
    ?? properties.NAME
    ?? properties.ADMIN
    ?? properties.NAME_LONG
    ?? properties.name
    ?? '',
  ).trim();
}

function normalizedSourceId(featureValue, allowedIds) {
  const properties = featureValue?.properties ?? {};
  const candidates = [
    properties.ISO_A3_EH,
    properties.ADM0_A3,
    properties.ISO_A3,
    properties.SOV_A3,
    properties.SU_A3,
    properties.GU_A3,
  ];
  for (const candidate of candidates) {
    const value = String(candidate ?? '').toUpperCase();
    if (allowedIds.has(value)) return value;
  }
  return null;
}

function isWesternSahara(featureValue) {
  const name = sourceName(featureValue).toLowerCase();
  const properties = featureValue?.properties ?? {};
  return name.includes('western sahara')
    || ['ESH', 'SAH'].includes(String(properties.ADM0_A3 ?? '').toUpperCase())
    || String(properties.ISO_A3 ?? '').toUpperCase() === 'ESH';
}

function isSomaliland(featureValue) {
  return sourceName(featureValue).toLowerCase().includes('somaliland');
}

function isBirTawil(featureValue) {
  return sourceName(featureValue).toLowerCase() === 'bir tawil';
}

function geometryCoordinateCount(geometry) {
  if (!geometry) return 0;
  if (geometry.type === 'GeometryCollection') {
    return geometry.geometries.reduce((sum, item) => sum + geometryCoordinateCount(item), 0);
  }
  const coordinates = geometry.coordinates;
  let count = 0;
  (function visit(value) {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      count += 1;
      return;
    }
    for (const item of value) visit(item);
  }(coordinates));
  return count;
}

function projectGeometry(geometry, projection) {
  if (!geometry) return null;
  if (geometry.type === 'GeometryCollection') {
    return {
      type: 'GeometryCollection',
      geometries: geometry.geometries.map((item) => projectGeometry(item, projection)),
    };
  }
  function projectCoordinates(value) {
    if (!Array.isArray(value)) return value;
    if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      const projected = projection([value[0], value[1]]);
      if (!projected) throw new Error('Projection returned null for Africa geometry.');
      return projected;
    }
    return value.map(projectCoordinates);
  }
  return { type: geometry.type, coordinates: projectCoordinates(geometry.coordinates) };
}

function featureCollection(features) {
  return { type: 'FeatureCollection', features };
}

function normalizeCountries(countries, catalog) {
  const allowedIds = new Set(catalog.map((row) => row.id));
  const appFeatures = new Map();
  let somaliland = null;
  let westernSahara = null;
  let birTawil = null;
  const unexpectedAfrica = [];

  for (const sourceFeature of countries.features) {
    const id = normalizedSourceId(sourceFeature, allowedIds);
    if (id) {
      if (appFeatures.has(id)) throw new Error(`Natural Earth resolves more than one feature to ${id}.`);
      appFeatures.set(id, sourceFeature);
      continue;
    }
    if (isSomaliland(sourceFeature)) {
      somaliland = sourceFeature;
      continue;
    }
    if (isWesternSahara(sourceFeature)) {
      westernSahara = sourceFeature;
      continue;
    }
    if (isBirTawil(sourceFeature)) {
      birTawil = sourceFeature;
      continue;
    }
    if (String(sourceFeature.properties?.CONTINENT ?? '').toLowerCase() === 'africa') {
      unexpectedAfrica.push(sourceName(sourceFeature) || '(unnamed)');
    }
  }

  const missing = catalog.filter((row) => !appFeatures.has(row.id)).map((row) => row.id);
  if (missing.length) throw new Error(`Natural Earth is missing canonical Africa IDs: ${missing.join(', ')}`);
  if (unexpectedAfrica.length) {
    throw new Error(`Unresolved Natural Earth Africa features require policy review: ${unexpectedAfrica.join(', ')}`);
  }
  if (!somaliland) throw new Error('Expected Natural Earth Somaliland de-facto feature was not found.');
  if (!westernSahara) throw new Error('Expected Natural Earth Western Sahara context feature was not found.');
  if (!birTawil) throw new Error('Expected Natural Earth Bir Tawil context feature was not found.');

  // Natural Earth defaults to a de-facto POV. The application curriculum follows
  // canonical ISO3/UN country identities, so Somaliland is dissolved into SOM for
  // scoring/adjacency. Western Sahara and Bir Tawil remain explicit non-scoring
  // context rather than being silently assigned to a neighboring scored country.
  const rawFeatures = [
    ...catalog.map((row) => ({
      type: 'Feature',
      properties: { sourceKey: row.id, countryId: row.id, role: 'country', name: row.name },
      geometry: appFeatures.get(row.id).geometry,
    })),
    {
      type: 'Feature',
      properties: { sourceKey: 'SOMALILAND', role: 'merge-somalia', name: sourceName(somaliland) },
      geometry: somaliland.geometry,
    },
    {
      type: 'Feature',
      properties: { sourceKey: 'ESH-CONTEXT', role: 'context', name: 'Western Sahara' },
      geometry: westernSahara.geometry,
    },
    {
      type: 'Feature',
      properties: { sourceKey: 'BIR-TAWIL-CONTEXT', role: 'context', name: 'Bir Tawil' },
      geometry: birTawil.geometry,
    },
  ];

  const rawTopology = topology({ areas: featureCollection(rawFeatures) }, 1_000_000);
  const geometries = rawTopology.objects.areas.geometries;
  const byKey = new Map(geometries.map((geometry) => [geometry.properties?.sourceKey, geometry]));
  const somaliaMerged = merge(rawTopology, [byKey.get('SOM'), byKey.get('SOMALILAND')].filter(Boolean));

  const normalized = [];
  for (const row of catalog) {
    const geometry = row.id === 'SOM'
      ? somaliaMerged
      : feature(rawTopology, byKey.get(row.id)).geometry;
    normalized.push({
      type: 'Feature',
      properties: { countryId: row.id, role: 'country', name: row.name },
      geometry,
    });
  }
  normalized.push({
    type: 'Feature',
    properties: { contextId: 'ESH', role: 'context', name: 'Western Sahara' },
    geometry: feature(rawTopology, byKey.get('ESH-CONTEXT')).geometry,
  });
  normalized.push({
    type: 'Feature',
    properties: { contextId: 'BIR-TAWIL', role: 'context', name: 'Bir Tawil' },
    geometry: feature(rawTopology, byKey.get('BIR-TAWIL-CONTEXT')).geometry,
  });
  return featureCollection(normalized);
}

function boundsToFocus(bounds, padding = 26) {
  const [[x0, y0], [x1, y1]] = bounds;
  let width = Math.max(1, x1 - x0) + padding * 2;
  let height = Math.max(1, y1 - y0) + padding * 2;
  width = Math.max(width, 180);
  height = Math.max(height, 170);
  const x = Math.max(0, Math.min(WIDTH - width, (x0 + x1) / 2 - width / 2));
  const y = Math.max(0, Math.min(HEIGHT - height, (y0 + y1) / 2 - height / 2));
  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
    width: Number(Math.min(width, WIDTH).toFixed(2)),
    height: Number(Math.min(height, HEIGHT).toFixed(2)),
  };
}

function featureName(featureValue) {
  const properties = featureValue?.properties ?? {};
  return String(
    properties.name
    ?? properties.NAME
    ?? properties.name_en
    ?? properties.NAME_EN
    ?? properties.namepar
    ?? properties.NAMEPAR
    ?? '',
  ).trim();
}

function namedPhysicalPaths(collection, projection, specs, layerName) {
  const path = geoPath(projection).digits(PATH_DIGITS);
  const output = [];
  for (const [canonicalName, matcher, required] of specs) {
    const matches = collection.features.filter((sourceFeature) => matcher.test(featureName(sourceFeature)));
    if (!matches.length) {
      if (required) throw new Error(`Required ${layerName} "${canonicalName}" was not found in Natural Earth.`);
      continue;
    }
    const d = path(featureCollection(matches));
    if (!d) {
      if (required) throw new Error(`Required ${layerName} "${canonicalName}" projected to an empty path.`);
      continue;
    }
    output.push({ name: canonicalName, path: d });
  }
  return output;
}

function calloutFor(id, centroid) {
  const [cx, cy] = centroid;
  if (id === 'GMB') {
    return {
      anchor: { cx: Number(cx.toFixed(2)), cy: Number(cy.toFixed(2)) },
      target: { cx: Number((cx - 36).toFixed(2)), cy: Number((cy - 8).toFixed(2)), r: 10 },
    };
  }
  if (id === 'TGO') {
    return {
      anchor: { cx: Number(cx.toFixed(2)), cy: Number(cy.toFixed(2)) },
      target: { cx: Number((cx - 25).toFixed(2)), cy: Number((cy + 34).toFixed(2)), r: 10 },
    };
  }
  return undefined;
}

function serializeTs(value) {
  return JSON.stringify(value, null, 2);
}

async function main() {
  const updateHashes = process.argv.includes('--update-hashes');
  const manifest = await loadManifest();
  const countrySource = await readFile(COUNTRY_SOURCE_PATH, 'utf8');
  const catalog = parseAfricaCatalog(countrySource);

  const sourceResults = {};
  for (const key of Object.keys(manifest.sources).sort()) {
    sourceResults[key] = await fetchSource(manifest, key, updateHashes);
  }
  if (updateHashes) await writeFile(MANIFEST_PATH, stableJson(manifest));

  const countriesSource = sourceResults.countries.json;
  const normalized = normalizeCountries(countriesSource, catalog);
  const beforePoints = normalized.features.reduce((sum, item) => sum + geometryCoordinateCount(item.geometry), 0);

  const projection = geoNaturalEarth1().fitExtent(
    [[PADDING, PADDING], [WIDTH - PADDING, HEIGHT - PADDING]],
    normalized,
  );
  projection.clipExtent([[0, 0], [WIDTH, HEIGHT]]);

  const projected = featureCollection(normalized.features.map((item) => ({
    type: 'Feature',
    properties: { ...item.properties },
    geometry: projectGeometry(item.geometry, projection),
  })));

  let projectedTopology = topology({ areas: projected }, QUANTIZATION);
  projectedTopology = presimplify(projectedTopology);
  const weightThreshold = quantile(projectedTopology, SIMPLIFICATION_QUANTILE);
  const simplifiedTopology = simplify(projectedTopology, weightThreshold);
  const simplifiedCollection = feature(simplifiedTopology, simplifiedTopology.objects.areas);
  const afterPoints = simplifiedCollection.features.reduce((sum, item) => sum + geometryCoordinateCount(item.geometry), 0);

  const planarPath = geoPath().digits(PATH_DIGITS);
  const simplifiedById = new Map(
    simplifiedCollection.features
      .filter((item) => item.properties?.countryId)
      .map((item) => [item.properties.countryId, item]),
  );

  const geometry = {};
  for (const row of catalog) {
    const countryFeature = simplifiedById.get(row.id);
    if (!countryFeature) throw new Error(`Simplified topology missing ${row.id}.`);
    const centroid = planarPath.centroid(countryFeature);
    const countryPath = planarPath(countryFeature);
    if (!countryPath) throw new Error(`Simplified topology projected ${row.id} to an empty path.`);
    const countryGeometry = { countryId: row.id };
    if (ISLAND_LOCATORS.has(row.id)) {
      countryGeometry.outlinePath = countryPath;
      countryGeometry.locator = {
        cx: Number(centroid[0].toFixed(2)),
        cy: Number(centroid[1].toFixed(2)),
        r: 7,
      };
    } else {
      countryGeometry.path = countryPath;
    }
    const callout = calloutFor(row.id, centroid);
    if (callout) countryGeometry.callout = callout;
    geometry[row.id] = countryGeometry;
  }

  const contextFeatures = simplifiedCollection.features.filter((item) => item.properties?.role === 'context');
  const contextPaths = contextFeatures.map((item) => planarPath(item)).filter(Boolean);

  const sharedMesh = mesh(
    simplifiedTopology,
    simplifiedTopology.objects.areas,
    (a, b) => a !== b,
  );
  const coastlineMesh = mesh(
    simplifiedTopology,
    simplifiedTopology.objects.areas,
    (a, b) => a === b,
  );
  const sharedBoundaryPath = planarPath(sharedMesh);
  const coastlinePath = planarPath(coastlineMesh);

  const topologyNeighbors = neighbors(simplifiedTopology.objects.areas.geometries);
  const geometryEntries = simplifiedTopology.objects.areas.geometries;
  const adjacency = {};
  for (let index = 0; index < geometryEntries.length; index += 1) {
    const id = geometryEntries[index].properties?.countryId;
    if (!id) continue;
    adjacency[id] = topologyNeighbors[index]
      .map((neighborIndex) => geometryEntries[neighborIndex].properties?.countryId)
      .filter(Boolean)
      .sort();
  }

  const scopeFocus = {
    africa: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
  };
  const regionIds = new Map();
  for (const row of catalog) {
    const ids = regionIds.get(row.region) ?? [];
    ids.push(row.id);
    regionIds.set(row.region, ids);
  }
  for (const [region, ids] of [...regionIds.entries()].sort()) {
    const regionFeatures = ids.map((id) => simplifiedById.get(id)).filter(Boolean);
    scopeFocus[region] = boundsToFocus(planarPath.bounds(featureCollection(regionFeatures)));
  }

  const sourceProjection = geoNaturalEarth1().fitExtent(
    [[PADDING, PADDING], [WIDTH - PADDING, HEIGHT - PADDING]],
    normalized,
  );
  sourceProjection.clipExtent([[0, 0], [WIDTH, HEIGHT]]);
  const physicalPath = geoPath(sourceProjection).digits(PATH_DIGITS);
  const oceanPath = physicalPath(sourceResults.ocean.json);
  if (!oceanPath) throw new Error('Natural Earth ocean projected to an empty path.');
  const lakes = namedPhysicalPaths(sourceResults.lakes.json, sourceProjection, LAKES, 'lake');

  const provenance = {
    upstream: manifest.upstream,
    upstreamCommit: manifest.upstreamCommit,
    rawBaseUrl: manifest.rawBaseUrl,
    sources: Object.fromEntries(
      Object.entries(manifest.sources)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => [key, {
          path: value.path,
          version: value.version,
          role: value.role,
          sha256: sourceResults[key].digest,
          bytes: sourceResults[key].bytes,
        }]),
    ),
    projection: {
      name: 'd3.geoNaturalEarth1',
      canvas: [WIDTH, HEIGHT],
      fitPadding: PADDING,
      pathDigits: PATH_DIGITS,
    },
    topology: {
      quantization: QUANTIZATION,
      simplificationMethod: 'topojson presimplify + planar triangle-area quantile',
      simplificationQuantile: SIMPLIFICATION_QUANTILE,
      weightThreshold,
      coordinateCountBefore: beforePoints,
      coordinateCountAfter: afterPoints,
    },
    boundaryPolicy: {
      naturalEarthView: 'default de-facto',
      scoredCountries: 54,
      somaliland: 'dissolved into canonical SOM scoring geometry; no separate target',
      westernSahara: 'non-scoring context; not merged into MAR',
      birTawil: 'non-scoring context; not merged into EGY or SDN',
      unRole: 'policy/dispute/disclaimer audit reference, not runtime redistribution source',
    },
  };

  const output = `// GENERATED FILE. Do not hand-edit geometry.\n`
    + `// Run: npm run maps:generate\n`
    + `// Source/pipeline: scripts/generate-maps.mjs + scripts/map-sources/natural-earth.json\n\n`
    + `import type { MapCountryGeometry, MapViewportFocus, MapWaterLayers } from '../../domain/map-models.js';\n\n`
    + `export const AFRICA_VIEWBOX = '0 0 ${WIDTH} ${HEIGHT}';\n\n`
    + `export const AFRICA_CARTOGRAPHY_PROVENANCE = ${serializeTs(provenance)} as const;\n\n`
    + `export const AFRICA_GEOMETRY: Readonly<Record<string, MapCountryGeometry>> = ${serializeTs(geometry)};\n\n`
    + `export const AFRICA_EXTRA_CONTEXT_PATHS: readonly string[] = ${serializeTs(contextPaths)};\n\n`
    + `export const AFRICA_SHARED_BOUNDARY_PATHS: readonly string[] = ${serializeTs(sharedBoundaryPath ? [sharedBoundaryPath] : [])};\n\n`
    + `export const AFRICA_COASTLINE_PATHS: readonly string[] = ${serializeTs(coastlinePath ? [coastlinePath] : [])};\n\n`
    + `export const AFRICA_WATER: Readonly<MapWaterLayers> = ${serializeTs({ oceanPath, lakes })};\n\n`
    + `export const AFRICA_SCOPE_FOCUS: Readonly<Record<string, MapViewportFocus>> = ${serializeTs(scopeFocus)};\n\n`
    + `export const AFRICA_LAND_ADJACENCY: Readonly<Record<string, readonly string[]>> = ${serializeTs(adjacency)};\n`;

  await mkdir(new URL('../src/data/maps/', import.meta.url), { recursive: true });
  await writeFile(OUTPUT_PATH, output);
  await writeFile(PROVENANCE_PATH, stableJson(provenance));

  console.log(`Generated Africa production cartography: ${afterPoints}/${beforePoints} projected coordinates retained.`);
  console.log(`Water: ${lakes.length} lakes/reservoirs; linear river context intentionally excluded.`);
  console.log(`Source commit: ${manifest.upstreamCommit}.`);
}

await main();
