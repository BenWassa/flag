import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { geoIdentity, geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature, merge, mesh, neighbors } from 'topojson-client';
import { topology } from 'topojson-server';
import { presimplify, quantile, simplify } from 'topojson-simplify';
import { MAP_CANVAS } from './map-continent-configs.mjs';

const MANIFEST_PATH = new URL('./map-sources/natural-earth.json', import.meta.url);
const COUNTRY_SOURCE_PATH = new URL('../src/data/countries.ts', import.meta.url);
const MAP_OUTPUT_DIR = new URL('../src/data/maps/', import.meta.url);
const NEIGHBOR_OUTPUT_DIR = new URL('../src/data/neighbors/', import.meta.url);
const DOCS_ARCHITECTURE_DIR = new URL('../docs/architecture/', import.meta.url);
const GLOBAL_ADJACENCY_PATH = new URL('../src/data/neighbors/global.ts', import.meta.url);

const {
  width: WIDTH,
  height: HEIGHT,
  padding: PADDING,
  quantization: QUANTIZATION,
  simplificationQuantile: SIMPLIFICATION_QUANTILE,
  pathDigits: PATH_DIGITS,
} = MAP_CANVAS;

// Canvas units an opening frame reserves around a locator dot or leader-line
// target, so the runtime's ~44 CSS px touch surface stays on screen at phone
// widths instead of being cropped by the frame edge.
const HIT_SURFACE_FOCUS_RESERVE = 34;

// Inset panel sizing. The panel is measured in CSS pixels because its scale is
// deliberately independent of the map's zoom.
const HIT_SURFACE_CSS_PX = 44;
// Anchors are spaced slightly wider than the touch surface so neighbouring
// members inside a panel cannot overlap each other's taps.
const INSET_MARK_SEPARATION_PX = 48;
const INSET_SOURCE_PADDING = 1.2;
// A panel larger than this stops being an answer surface and becomes the screen.
const INSET_MAX_PANEL_PX = 260;

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function serializeTs(value) {
  return JSON.stringify(value, null, 2);
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
  if (source.role !== 'evaluated-only') json = JSON.parse(bytes.toString('utf8'));
  return { bytes: bytes.length, digest, json, url };
}

export function parseCountryCatalog(source) {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[A-Z]{3}\|[A-Z]{2}\|.+\|[a-z-]+$/.test(line))
    .map((line) => {
      const [id, iso2, name, region] = line.split('|');
      return { id, iso2, name, region };
    });
}

function sourceName(sourceFeature) {
  const properties = sourceFeature?.properties ?? {};
  return String(
    properties.ADMIN
    ?? properties.NAME
    ?? properties.NAME_EN
    ?? properties.SOVEREIGNT
    ?? properties.GEOUNIT
    ?? properties.SUBUNIT
    ?? '',
  ).trim();
}

function normalizedSourceId(sourceFeature, allowedIds) {
  const properties = sourceFeature?.properties ?? {};
  const candidates = [
    properties.ISO_A3_EH,
    properties.ADM0_A3,
    properties.ISO_A3,
    properties.SOV_A3,
    properties.SU_A3,
    properties.GU_A3,
  ];
  for (const candidate of candidates) {
    const id = String(candidate ?? '').trim().toUpperCase();
    if (allowedIds.has(id)) return id;
  }
  return null;
}

function isSomaliland(sourceFeature) {
  return /somaliland/i.test(sourceName(sourceFeature));
}

function isWesternSahara(sourceFeature) {
  const properties = sourceFeature?.properties ?? {};
  return String(properties.ADM0_A3 ?? properties.SOV_A3 ?? '').toUpperCase() === 'SAH'
    || /western sahara/i.test(sourceName(sourceFeature));
}

function isBirTawil(sourceFeature) {
  return /bir tawil/i.test(sourceName(sourceFeature));
}

function geometryCoordinateCount(geometry) {
  if (!geometry) return 0;
  if (geometry.type === 'GeometryCollection') {
    return geometry.geometries.reduce((sum, item) => sum + geometryCoordinateCount(item), 0);
  }
  function count(value) {
    if (!Array.isArray(value)) return 0;
    if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') return 1;
    return value.reduce((sum, item) => sum + count(item), 0);
  }
  return count(geometry.coordinates);
}

function polygonComponents(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return [...geometry.coordinates];
  if (geometry.type === 'GeometryCollection') return geometry.geometries.flatMap(polygonComponents);
  return [];
}

function geographicAuditFor(geometry) {
  const components = polygonComponents(geometry);
  const bounds = coordinateBounds(geometry?.coordinates ?? []);
  const componentBounds = components.map((coordinates) => coordinateBounds(coordinates));
  return {
    coordinateCount: geometryCoordinateCount(geometry),
    componentCount: components.length,
    longitude: { min: bounds.minX, max: bounds.maxX },
    componentsEastOf170: componentBounds.filter((item) => item.maxX > 170).length,
    componentsWestOfMinus170: componentBounds.filter((item) => item.minX < -170).length,
    duplicateComponentCount: components.length - new Set(components.map((item) => JSON.stringify(item))).size,
  };
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
      if (!projected) throw new Error('Projection returned null for continent geometry.');
      return projected;
    }
    return value.map(projectCoordinates);
  }
  return { type: geometry.type, coordinates: projectCoordinates(geometry.coordinates) };
}

function featureCollection(features) {
  return { type: 'FeatureCollection', features };
}

function projectionForConfig(config) {
  const projection = geoNaturalEarth1();
  if (config.projectionRotate) projection.rotate([...config.projectionRotate]);
  return projection;
}

function mergedGeometry(sourceFeatures) {
  if (!sourceFeatures.length) return null;
  if (sourceFeatures.length === 1) return sourceFeatures[0].geometry;
  const raw = topology({ parts: featureCollection(sourceFeatures) }, 1_000_000);
  return merge(raw, raw.objects.parts.geometries);
}

function coordinateBounds(value, bounds = {
  minX: Number.POSITIVE_INFINITY,
  minY: Number.POSITIVE_INFINITY,
  maxX: Number.NEGATIVE_INFINITY,
  maxY: Number.NEGATIVE_INFINITY,
}) {
  if (!Array.isArray(value)) return bounds;
  if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
    bounds.minX = Math.min(bounds.minX, value[0]);
    bounds.minY = Math.min(bounds.minY, value[1]);
    bounds.maxX = Math.max(bounds.maxX, value[0]);
    bounds.maxY = Math.max(bounds.maxY, value[1]);
    return bounds;
  }
  for (const item of value) coordinateBounds(item, bounds);
  return bounds;
}

function coordinatesIntersectBounds(coordinates, bounds) {
  const measured = coordinateBounds(coordinates);
  return measured.maxX >= bounds.minLon
    && measured.minX <= bounds.maxLon
    && measured.maxY >= bounds.minLat
    && measured.minY <= bounds.maxLat;
}

function filterGeometryByBounds(geometry, bounds) {
  if (!geometry || !bounds) return geometry;
  if (geometry.type === 'Polygon') {
    return coordinatesIntersectBounds(geometry.coordinates, bounds) ? geometry : null;
  }
  if (geometry.type === 'MultiPolygon') {
    const coordinates = geometry.coordinates.filter((polygon) => coordinatesIntersectBounds(polygon, bounds));
    return coordinates.length ? { ...geometry, coordinates } : null;
  }
  if (geometry.type === 'GeometryCollection') {
    const geometries = geometry.geometries
      .map((item) => filterGeometryByBounds(item, bounds))
      .filter(Boolean);
    return geometries.length ? { ...geometry, geometries } : null;
  }
  return geometry;
}

function sourceCountryId(sourceFeature, allowedIds) {
  if (isSomaliland(sourceFeature) && allowedIds.has('SOM')) return 'SOM';
  return normalizedSourceId(sourceFeature, allowedIds);
}

function deriveGlobalAdjacency(countriesSource, catalog) {
  const allowedIds = new Set(catalog.map((row) => row.id));
  const sourceFeatures = [];
  for (let index = 0; index < countriesSource.features.length; index += 1) {
    const sourceFeature = countriesSource.features[index];
    const countryId = sourceCountryId(sourceFeature, allowedIds);
    if (!countryId) continue;
    sourceFeatures.push({
      type: 'Feature',
      properties: { countryId, sourceIndex: index },
      geometry: sourceFeature.geometry,
    });
  }

  const globalTopology = topology({ countries: featureCollection(sourceFeatures) }, 1_000_000);
  const geometries = globalTopology.objects.countries.geometries;
  const graph = neighbors(geometries);
  const adjacency = Object.fromEntries(catalog.map((row) => [row.id, new Set()]));
  const representedIds = new Set();

  for (let index = 0; index < geometries.length; index += 1) {
    const countryId = geometries[index].properties?.countryId;
    if (!countryId) continue;
    representedIds.add(countryId);
    for (const neighborIndex of graph[index]) {
      const neighborId = geometries[neighborIndex].properties?.countryId;
      if (!neighborId || neighborId === countryId) continue;
      adjacency[countryId]?.add(neighborId);
      adjacency[neighborId]?.add(countryId);
    }
  }

  return {
    adjacency: Object.fromEntries(
      Object.entries(adjacency).map(([id, values]) => [id, [...values].sort()]),
    ),
    representedIds,
    sourceFeatureCount: sourceFeatures.length,
  };
}

function catalogForConfig(catalog, config) {
  const regions = new Set(config.regionIds);
  const rows = catalog.filter((row) => regions.has(row.region));
  if (rows.length !== config.expectedCountryCount) {
    throw new Error(
      `${config.displayName} catalog expected ${config.expectedCountryCount} countries, found ${rows.length}.`,
    );
  }
  return rows;
}

function normalizeAfricaCountries(countriesSource, scoredCatalog) {
  const allowedIds = new Set(scoredCatalog.map((row) => row.id));
  const appFeatures = new Map();
  let somaliland = null;
  let westernSahara = null;
  let birTawil = null;
  const unexpected = [];

  for (const sourceFeature of countriesSource.features) {
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
      unexpected.push(sourceName(sourceFeature) || '(unnamed)');
    }
  }

  const missing = scoredCatalog.filter((row) => !appFeatures.has(row.id)).map((row) => row.id);
  if (missing.length) throw new Error(`Natural Earth is missing canonical Africa IDs: ${missing.join(', ')}`);
  if (unexpected.length) {
    throw new Error(`Unresolved Natural Earth Africa features require policy review: ${unexpected.join(', ')}`);
  }
  if (!somaliland) throw new Error('Expected Natural Earth Somaliland de-facto feature was not found.');
  if (!westernSahara) throw new Error('Expected Natural Earth Western Sahara context feature was not found.');
  if (!birTawil) throw new Error('Expected Natural Earth Bir Tawil context feature was not found.');

  const rawFeatures = [
    ...scoredCatalog.map((row) => ({
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
  const normalized = scoredCatalog.map((row) => ({
    type: 'Feature',
    properties: { countryId: row.id, role: 'country', name: row.name },
    geometry: row.id === 'SOM' ? somaliaMerged : feature(rawTopology, byKey.get(row.id)).geometry,
  }));
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

function normalizeStandardContinent(countriesSource, catalog, scoredCatalog, config) {
  const allIds = new Set(catalog.map((row) => row.id));
  const scoredIds = new Set(scoredCatalog.map((row) => row.id));
  const localContextIds = new Set(config.localContextCountryIds ?? []);
  const grouped = new Map();

  for (const sourceFeature of countriesSource.features) {
    const id = sourceCountryId(sourceFeature, allIds);
    if (!id) continue;
    const values = grouped.get(id) ?? [];
    values.push(sourceFeature);
    grouped.set(id, values);
  }

  const normalized = [];
  for (const row of scoredCatalog) {
    const parts = grouped.get(row.id) ?? [];
    if (!parts.length) throw new Error(`Natural Earth is missing canonical ${config.displayName} ID ${row.id}.`);
    normalized.push({
      type: 'Feature',
      properties: { countryId: row.id, role: 'country', name: row.name },
      geometry: mergedGeometry(parts),
    });
  }

  for (const countryId of localContextIds) {
    if (scoredIds.has(countryId)) continue;
    const parts = grouped.get(countryId) ?? [];
    const filtered = parts
      .map((sourceFeature) => ({
        ...sourceFeature,
        geometry: filterGeometryByBounds(sourceFeature.geometry, config.localContextBounds),
      }))
      .filter((sourceFeature) => sourceFeature.geometry);
    if (!filtered.length) continue;
    const row = catalog.find((item) => item.id === countryId);
    normalized.push({
      type: 'Feature',
      properties: {
        countryId,
        role: 'context-country',
        name: row?.name ?? countryId,
      },
      geometry: mergedGeometry(filtered),
    });
  }

  const contextPatterns = (config.allowedContextPatterns ?? []).map(
    (spec) => new RegExp(spec.pattern, spec.flags ?? 'i'),
  );
  const excludedContextPatterns = (config.excludedContextPatterns ?? []).map(
    (spec) => new RegExp(spec.pattern, spec.flags ?? 'i'),
  );
  const unexpected = [];
  for (const sourceFeature of countriesSource.features) {
    if (String(sourceFeature.properties?.CONTINENT ?? '').toLowerCase() !== config.sourceContinent.toLowerCase()) continue;
    const id = sourceCountryId(sourceFeature, allIds);
    if (id && (scoredIds.has(id) || localContextIds.has(id))) continue;
    const name = sourceName(sourceFeature) || '(unnamed)';
    if (excludedContextPatterns.some((pattern) => pattern.test(name))) continue;
    if (contextPatterns.length && !contextPatterns.some((pattern) => pattern.test(name))) {
      unexpected.push(name);
      continue;
    }
    normalized.push({
      type: 'Feature',
      properties: { role: 'context', name },
      geometry: sourceFeature.geometry,
    });
  }
  if (unexpected.length) {
    throw new Error(
      `Unresolved Natural Earth ${config.displayName} context features require policy review: ${[...new Set(unexpected)].join(', ')}`,
    );
  }
  return featureCollection(normalized);
}

function normalizeContinent(countriesSource, catalog, scoredCatalog, config) {
  if (config.policy === 'africa-v1') return normalizeAfricaCountries(countriesSource, scoredCatalog);
  return normalizeStandardContinent(countriesSource, catalog, scoredCatalog, config);
}

function boundsToFocus(bounds, padding = 26, minimum = {}) {
  const [[x0, y0], [x1, y1]] = bounds;
  let width = Math.max(1, x1 - x0) + padding * 2;
  let height = Math.max(1, y1 - y0) + padding * 2;
  width = Math.max(width, minimum.width ?? 180);
  height = Math.max(height, minimum.height ?? 170);
  const x = Math.max(0, Math.min(WIDTH - width, (x0 + x1) / 2 - width / 2));
  const y = Math.max(0, Math.min(HEIGHT - height, (y0 + y1) / 2 - height / 2));
  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
    width: Number(Math.min(width, WIDTH).toFixed(2)),
    height: Number(Math.min(height, HEIGHT).toFixed(2)),
  };
}

function geometryBounds(geometry) {
  const bounds = [[Infinity, Infinity], [-Infinity, -Infinity]];
  for (const [, x, y] of (geometry.path ?? geometry.outlinePath ?? '').matchAll(/(-?[\d.]+),(-?[\d.]+)/g)) {
    bounds[0][0] = Math.min(bounds[0][0], Number(x));
    bounds[0][1] = Math.min(bounds[0][1], Number(y));
    bounds[1][0] = Math.max(bounds[1][0], Number(x));
    bounds[1][1] = Math.max(bounds[1][1], Number(y));
  }
  for (const circle of [geometry.locator, geometry.hitAssist, geometry.callout?.target]) {
    if (!circle) continue;
    bounds[0][0] = Math.min(bounds[0][0], circle.cx - circle.r);
    bounds[0][1] = Math.min(bounds[0][1], circle.cy - circle.r);
    bounds[1][0] = Math.max(bounds[1][0], circle.cx + circle.r);
    bounds[1][1] = Math.max(bounds[1][1], circle.cy + circle.r);
  }
  return bounds;
}

/** Rings of an absolute M/L/Z path, as coordinate arrays. */
function pathRings(d) {
  return d.split('M').filter(Boolean).map((subpath) =>
    [...subpath.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((match) => [Number(match[1]), Number(match[2])]));
}

function ringContains(ring, px, py) {
  let contained = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) contained = !contained;
  }
  return contained;
}

function distanceToRing(ring, px, py) {
  let nearest = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [x1, y1] = ring[j];
    const [x2, y2] = ring[i];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1)));
    nearest = Math.min(nearest, Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)));
  }
  return nearest;
}

/**
 * Pole of inaccessibility — the interior point furthest from any edge.
 *
 * A polygon centroid can fall outside a crescent or a multipart country, which
 * would anchor a tap surface in the sea. This grid-refines instead, so the
 * anchor is always inside real land.
 */
function poleOfInaccessibility(rings) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const ring of rings) {
    for (const [x, y] of ring) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y);
      x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
  }
  let best = { radius: -1, x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
  let step = Math.max(x1 - x0, y1 - y0) / 40;
  for (let pass = 0; pass < 7; pass += 1) {
    const centreX = best.x;
    const centreY = best.y;
    for (let i = -20; i <= 20; i += 1) {
      for (let j = -20; j <= 20; j += 1) {
        const x = centreX + i * step;
        const y = centreY + j * step;
        // SVG country paths use the even-odd relationship between subpaths:
        // outer rings add land and inner rings remove holes. Testing only
        // whether any ring contains the point can place an anchor in a lake.
        const inside = rings.reduce((contained, ring) => ringContains(ring, x, y) ? !contained : contained, false);
        if (!inside) continue;
        const radius = Math.min(...rings.map((ring) => distanceToRing(ring, x, y)));
        if (radius > best.radius) best = { radius, x, y };
      }
    }
    step /= 4;
  }
  return best;
}

/**
 * A cluster inset is a screen-space panel, so its scale is set in CSS pixels
 * rather than canvas units. Only that decoupling can satisfy the 44 CSS px
 * touch contract: a box placed on the canvas competes with the map for the same
 * room, which caps its magnification far below what these clusters need.
 *
 * Configuration names the countries, the label and the corner. The window, the
 * tap anchors and the pixel size are all derived from generated geometry.
 */
export function buildInsets(config, geometry, catalog) {
  const specs = config.insets ?? [];
  if (!specs.length) return [];

  // The map never names a selectable country, because the name is the answer.
  // An inset label therefore names water or a region, never a country.
  const countryNames = new Set(catalog.map((row) => row.name.toLowerCase()));

  const insetIds = new Set();
  const assignedCountryIds = new Set();
  const validAnchors = new Set(['top-left', 'top-right', 'bottom-left', 'bottom-right']);

  return specs.map((spec) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(spec.id) || insetIds.has(spec.id)) {
      throw new Error(`${config.displayName} inset id "${spec.id}" must be unique lowercase kebab-case.`);
    }
    insetIds.add(spec.id);
    if (!validAnchors.has(spec.anchor)) {
      throw new Error(`${config.displayName} inset ${spec.id} has unsupported anchor "${spec.anchor}".`);
    }
    if (new Set(spec.countryIds).size !== spec.countryIds.length) {
      throw new Error(`${config.displayName} inset ${spec.id} repeats a country.`);
    }
    for (const countryId of spec.countryIds) {
      if (assignedCountryIds.has(countryId)) {
        throw new Error(`${config.displayName} inset country ${countryId} belongs to more than one panel.`);
      }
      assignedCountryIds.add(countryId);
    }
    if (countryNames.has(spec.label.toLowerCase())) {
      throw new Error(
        `${config.displayName} inset ${spec.id} is labelled "${spec.label}", which is a country name and would `
        + 'hand the learner the answer. Label an inset by its water or region.',
      );
    }
    if (spec.countryIds.length < 2) {
      throw new Error(
        `${config.displayName} inset ${spec.id} needs at least two members. A lone small country is a locator or `
        + 'leader-line case; a panel is for clusters that defeat both.',
      );
    }

    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    const marks = spec.countryIds.map((id) => {
      const member = geometry[id];
      if (!member) throw new Error(`${config.displayName} inset ${spec.id} names unknown country ${id}.`);
      const rings = pathRings(member.path ?? member.outlinePath ?? '');
      if (!rings.length) throw new Error(`${config.displayName} inset ${spec.id} member ${id} has no geometry.`);
      const bounds = geometryBounds(member);
      x0 = Math.min(x0, bounds[0][0]); y0 = Math.min(y0, bounds[0][1]);
      x1 = Math.max(x1, bounds[1][0]); y1 = Math.max(y1, bounds[1][1]);
      const pole = poleOfInaccessibility(rings);
      return { countryId: id, cx: Number(pole.x.toFixed(2)), cy: Number(pole.y.toFixed(2)) };
    });

    // Members must not merely fit — each needs its own 44 px surface, so the
    // panel is scaled by the closest pair of anchors, not by the cluster bounds.
    let closest = Infinity;
    for (let i = 0; i < marks.length; i += 1) {
      for (let j = i + 1; j < marks.length; j += 1) {
        closest = Math.min(closest, Math.hypot(marks[i].cx - marks[j].cx, marks[i].cy - marks[j].cy));
      }
    }
    const pxPerUnit = INSET_MARK_SEPARATION_PX / closest;
    const source = {
      x: Number((x0 - INSET_SOURCE_PADDING).toFixed(2)),
      y: Number((y0 - INSET_SOURCE_PADDING).toFixed(2)),
      width: Number((x1 - x0 + INSET_SOURCE_PADDING * 2).toFixed(2)),
      height: Number((y1 - y0 + INSET_SOURCE_PADDING * 2).toFixed(2)),
    };
    // Round the panel up, then read the scale back off the rounded size. Deriving
    // the hit radius from the ideal scale instead would ship a surface fractionally
    // under the contract it exists to guarantee.
    // The SVG scales by the smaller of the two axes, so the height is rounded up
    // against the shipped width scale. Rounding each axis independently would let
    // height win and quietly shrink every touch surface below the contract.
    const width = Math.ceil(source.width * pxPerUnit);
    const shippedPxPerUnit = width / source.width;
    const size = { width, height: Math.ceil(source.height * shippedPxPerUnit) };
    if (size.width > INSET_MAX_PANEL_PX || size.height > INSET_MAX_PANEL_PX) {
      throw new Error(
        `${config.displayName} inset ${spec.id} needs a ${size.width}x${size.height} px panel to give every member a `
        + `${HIT_SURFACE_CSS_PX} px target, which does not fit a phone stage. Split the cluster, or design a `
        + 'schematic arrangement rather than a true-scale magnifier.',
      );
    }

    return {
      id: spec.id,
      label: spec.label,
      countryIds: [...spec.countryIds],
      source,
      marks,
      size,
      hitRadius: Number(((HIT_SURFACE_CSS_PX / 2) / shippedPxPerUnit).toFixed(4)),
      anchor: spec.anchor,
    };
  });
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
  for (const spec of specs) {
    const matcher = new RegExp(spec.pattern, spec.flags ?? 'i');
    const matches = collection.features.filter((sourceFeature) => matcher.test(featureName(sourceFeature)));
    if (!matches.length) {
      if (spec.required) throw new Error(`Required ${layerName} "${spec.name}" was not found in Natural Earth.`);
      continue;
    }
    const d = path(featureCollection(matches));
    if (!d) {
      if (spec.required) throw new Error(`Required ${layerName} "${spec.name}" projected to an empty path.`);
      continue;
    }
    output.push({ name: spec.name, path: d });
  }
  return output;
}

function calloutFor(config, id, centroid) {
  const policy = config.callouts?.[id];
  if (!policy) return undefined;
  const [cx, cy] = centroid;
  return {
    anchor: { cx: Number(cx.toFixed(2)), cy: Number(cy.toFixed(2)) },
    target: {
      cx: Number((cx + policy.dx).toFixed(2)),
      cy: Number((cy + policy.dy).toFixed(2)),
      r: policy.r,
    },
  };
}

function deriveLocalAdjacency(simplifiedTopology) {
  const topologyNeighbors = neighbors(simplifiedTopology.objects.areas.geometries);
  const geometryEntries = simplifiedTopology.objects.areas.geometries;
  const adjacency = {};
  for (let index = 0; index < geometryEntries.length; index += 1) {
    const id = geometryEntries[index].properties?.role === 'country'
      ? geometryEntries[index].properties?.countryId
      : undefined;
    if (!id) continue;
    adjacency[id] = topologyNeighbors[index]
      .map((neighborIndex) => {
        const neighbor = geometryEntries[neighborIndex];
        return neighbor.properties?.role === 'country' ? neighbor.properties?.countryId : undefined;
      })
      .filter(Boolean)
      .sort();
  }
  return adjacency;
}

function sliceGlobalAdjacency(globalAdjacency, scoredCatalog, representedIds, config) {
  const output = {};
  // Scored curriculum plus any canonical country this continent's module must
  // teach through an overlapping learner scope (Issue #28 Egypt in Middle
  // East). Extra members gain adjacency only; continent ownership, country
  // records and progress stay canonical elsewhere.
  const ids = [...scoredCatalog.map((row) => row.id), ...(config.adjacencyExtraCountryIds ?? [])];
  for (const id of ids) {
    if (!representedIds.has(id)) {
      throw new Error(`Global Natural Earth adjacency topology does not represent ${id} for ${config.displayName}.`);
    }
    output[id] = [...(globalAdjacency[id] ?? [])];
  }
  return output;
}

async function generateContinent({ config, catalog, sourceResults, manifest, globalGraph }) {
  const scoredCatalog = catalogForConfig(catalog, config);
  const normalized = normalizeContinent(sourceResults.countries.json, catalog, scoredCatalog, config);
  const geographicAudit = Object.fromEntries((config.geographicAuditCountryIds ?? []).map((id) => {
    const sourceFeature = normalized.features.find((item) => item.properties?.countryId === id);
    if (!sourceFeature) throw new Error(`${config.displayName} geographic audit is missing ${id}.`);
    return [id, geographicAuditFor(sourceFeature.geometry)];
  }));
  const beforePoints = normalized.features.reduce((sum, item) => sum + geometryCoordinateCount(item.geometry), 0);
  const fitExcludedIds = new Set(config.fitExcludeCountryIds ?? []);
  const fitCountryBounds = config.fitCountryBounds ?? {};
  const fitExcludedContextPatterns = (config.fitExcludeContextPatterns ?? []).map(
    (spec) => new RegExp(spec.pattern, spec.flags ?? 'i'),
  );
  const fitCollection = featureCollection(normalized.features.flatMap((item) => {
    const countryId = item.properties?.countryId;
    if (countryId && fitExcludedIds.has(countryId)) return [];
    if (item.properties?.role === 'context'
      && fitExcludedContextPatterns.some((pattern) => pattern.test(sourceName(item)))) return [];
    const bounds = countryId ? fitCountryBounds[countryId] : undefined;
    if (!bounds) return [item];
    const geometry = filterGeometryByBounds(item.geometry, bounds);
    if (!geometry) {
      throw new Error(`${config.displayName} viewport-fit bounds removed every component of ${countryId}.`);
    }
    return [{ ...item, geometry }];
  }));
  if (!fitCollection.features.length) throw new Error(`${config.displayName} viewport-fit policy removed every feature.`);

  const projection = projectionForConfig(config).fitExtent(
    [[PADDING, PADDING], [WIDTH - PADDING, HEIGHT - PADDING]],
    fitCollection,
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
  // #86: the runtime viewBox is clamped to the continent canvas, so any
  // coordinate outside it can never be displayed. Non-interactive context is
  // therefore serialised through a planar clip. Scored country geometry is NOT:
  // `src/domain/outline.ts` falls back to the map `path` for its silhouette, so
  // cropping a scored country would crop the shape Outlines teaches. Centroids,
  // bounds and focus rects keep using the unclipped path so locator and callout
  // placement is unchanged.
  const clippedPath = geoPath(geoIdentity().clipExtent([[0, 0], [WIDTH, HEIGHT]])).digits(PATH_DIGITS);
  const simplifiedById = new Map(
    simplifiedCollection.features
      .filter((item) => item.properties?.countryId)
      .map((item) => [item.properties.countryId, item]),
  );

  const islandLocators = new Set(config.islandLocatorIds ?? []);
  const hitAssistIds = new Set(config.hitAssistIds ?? []);
  for (const id of hitAssistIds) {
    if (islandLocators.has(id)) {
      throw new Error(`${config.displayName} ${id} cannot use both a visible locator and invisible hit assistance.`);
    }
  }
  // A country carries role 'country' even when this continent only renders it as
  // context, so scoring membership — not the feature role — decides whether its
  // path may be clipped. Derived focus scopes are folded in because they score
  // countries this continent's own catalogue does not own (Egypt through the
  // Middle East), and Outlines teaches every scored shape whole.
  const answerableIds = new Set([
    ...scoredCatalog.map((row) => row.id),
    ...Object.values(config.derivedFocusScopes ?? {}).flatMap((ids) => [...ids]),
  ]);
  const geometry = {};
  for (const item of simplifiedCollection.features.filter((featureValue) => featureValue.properties?.countryId)) {
    const id = item.properties.countryId;
    const countryPath = planarPath(item);
    if (!countryPath) throw new Error(`Simplified topology projected ${id} to an empty path.`);
    const countryGeometry = { countryId: id };
    if (item.properties?.role === 'country' && islandLocators.has(id)) {
      const centroid = planarPath.centroid(item);
      const anchor = config.locatorAnchorMode === 'pole'
        ? poleOfInaccessibility(pathRings(countryPath))
        : { x: centroid[0], y: centroid[1] };
      countryGeometry.outlinePath = countryPath;
      countryGeometry.locator = {
        cx: Number(anchor.x.toFixed(2)),
        cy: Number(anchor.y.toFixed(2)),
        r: 7,
      };
    } else {
      countryGeometry.path = answerableIds.has(id)
        ? countryPath
        : (clippedPath(item) || countryPath);
    }
    if (item.properties?.role === 'country' && hitAssistIds.has(id)) {
      const anchor = poleOfInaccessibility(pathRings(countryPath));
      countryGeometry.hitAssist = {
        cx: Number(anchor.x.toFixed(2)),
        cy: Number(anchor.y.toFixed(2)),
        r: 7,
      };
    }
    if (item.properties?.role === 'country') {
      const callout = calloutFor(config, id, planarPath.centroid(item));
      if (callout) countryGeometry.callout = callout;
    }
    geometry[id] = countryGeometry;
  }

  for (const row of scoredCatalog) {
    if (!geometry[row.id]) throw new Error(`Simplified topology missing ${row.id}.`);
  }

  const contextFeatures = simplifiedCollection.features.filter((item) => item.properties?.role === 'context');
  const contextPaths = contextFeatures.map((item) => clippedPath(item)).filter(Boolean);

  const sharedMesh = mesh(simplifiedTopology, simplifiedTopology.objects.areas, (a, b) => a !== b);
  const coastlineMesh = mesh(simplifiedTopology, simplifiedTopology.objects.areas, (a, b) => a === b);
  const sharedBoundaryPath = clippedPath(sharedMesh);
  const coastlinePath = clippedPath(coastlineMesh);

  const adjacency = config.adjacencyMode === 'global'
    ? sliceGlobalAdjacency(globalGraph.adjacency, scoredCatalog, globalGraph.representedIds, config)
    : deriveLocalAdjacency(simplifiedTopology);

  const regionIds = new Map();
  for (const row of scoredCatalog) {
    const ids = regionIds.get(row.region) ?? [];
    ids.push(row.id);
    regionIds.set(row.region, ids);
  }
  const focusExcludedIds = new Set(config.focusExcludeCountryIds ?? []);
  const focusCountryBounds = config.focusCountryBounds ?? {};
  const focusProjectedById = new Map(
    normalized.features
      .filter((item) => item.properties?.countryId && focusCountryBounds[item.properties.countryId])
      .map((item) => {
        const id = item.properties.countryId;
        const filtered = filterGeometryByBounds(item.geometry, focusCountryBounds[id]);
        if (!filtered) throw new Error(`${config.displayName} focus bounds removed every component of ${id}.`);
        return [id, {
          type: 'Feature',
          properties: { ...item.properties },
          geometry: projectGeometry(filtered, projection),
        }];
      }),
  );
  const focusForIds = (ids, scopeId) => {
    const preferredIds = ids.filter((id) => !focusExcludedIds.has(id));
    const focusIds = preferredIds.length ? preferredIds : ids;
    const regionFeatures = focusIds
      .map((id) => focusProjectedById.get(id) ?? simplifiedById.get(id))
      .filter(Boolean);
    const bounds = planarPath.bounds(featureCollection(regionFeatures));
    // A locator dot or leader-line target can sit outside its own polygon, and
    // the runtime grows its invisible touch surface to roughly 44 CSS px. A
    // frame derived from polygons alone therefore crops the very thing the
    // learner taps, so reserve the touch surface rather than the drawn radius.
    for (const id of focusIds) {
      for (const circle of [geometry[id]?.locator, geometry[id]?.hitAssist, geometry[id]?.callout?.target]) {
        if (!circle) continue;
        const reach = Math.max(circle.r, HIT_SURFACE_FOCUS_RESERVE);
        bounds[0][0] = Math.min(bounds[0][0], circle.cx - reach);
        bounds[0][1] = Math.min(bounds[0][1], circle.cy - reach);
        bounds[1][0] = Math.max(bounds[1][0], circle.cx + reach);
        bounds[1][1] = Math.max(bounds[1][1], circle.cy + reach);
      }
    }
    return boundsToFocus(bounds, 26, config.focusMinimumByScope?.[scopeId]);
  };
  // The whole-continent opening view is fitted to the scoring geography, not to
  // the raw canvas. The canvas carries non-scoring context and projection slack,
  // so framing on it left phone portrait stages with a dead band instead of map.
  const scopeFocus = {
    [config.id]: focusForIds(scoredCatalog.map((row) => row.id), config.id),
  };
  // An inset panel is screen-space, so it changes touch size rather than
  // framing. Opening frames stay exactly as they are, and every member is still
  // drawn and tappable in its true place on the map.
  const insets = buildInsets(config, geometry, scoredCatalog);
  // Canonical classification regions that Atlas deliberately does not expose to
  // learners get no focus entry, so no navigation can resolve to them.
  const hiddenFocusRegions = new Set(config.hiddenFocusRegionIds ?? []);
  for (const [region, ids] of [...regionIds.entries()].sort()) {
    if (hiddenFocusRegions.has(region)) continue;
    scopeFocus[region] = focusForIds(ids, region);
  }
  // Learner-facing scopes may deliberately overlap the canonical region
  // taxonomy (Issue #28 Middle East, and Caucasus). They own no country
  // records; they only need deterministic framing derived from the same
  // simplified geometry, including keyed cross-continent context members.
  for (const [scopeId, ids] of Object.entries(config.derivedFocusScopes ?? {})) {
    const missing = ids.filter((id) => !simplifiedById.has(id));
    if (missing.length) {
      throw new Error(
        `${config.displayName} derived focus scope ${scopeId} is missing geometry for ${missing.join(', ')}.`,
      );
    }
    scopeFocus[scopeId] = focusForIds([...ids]);
  }

  const sourceProjection = projectionForConfig(config).fitExtent(
    [[PADDING, PADDING], [WIDTH - PADDING, HEIGHT - PADDING]],
    fitCollection,
  );
  sourceProjection.clipExtent([[0, 0], [WIDTH, HEIGHT]]);
  const physicalPath = geoPath(sourceProjection).digits(PATH_DIGITS);
  const oceanPath = physicalPath(sourceResults.ocean.json);
  if (!oceanPath) throw new Error('Natural Earth ocean projected to an empty path.');
  const lakes = namedPhysicalPaths(sourceResults.lakes.json, sourceProjection, config.lakes ?? [], 'lake');

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
      ...(config.projectionRotate ? { rotate: [...config.projectionRotate] } : {}),
    },
    topology: {
      quantization: QUANTIZATION,
      simplificationMethod: 'topojson presimplify + planar triangle-area quantile',
      simplificationQuantile: SIMPLIFICATION_QUANTILE,
      weightThreshold,
      coordinateCountBefore: beforePoints,
      coordinateCountAfter: afterPoints,
    },
    adjacency: {
      source: config.adjacencyMode === 'global' ? 'global canonical Natural Earth application-country topology' : 'continent-local canonical topology',
      globalSourceFeatureCount: globalGraph.sourceFeatureCount,
    },
    ...(Object.keys(geographicAudit).length ? { geographicAudit } : {}),
    boundaryPolicy: {
      ...config.boundaryPolicy,
      scoredCountries: scoredCatalog.length,
    },
  };

  const prefix = config.exportPrefix;
  const output = `// GENERATED FILE. Do not hand-edit geometry.\n`
    + `// Run: npm run maps:generate\n`
    + `// Source/pipeline: scripts/generate-maps.mjs + scripts/map-generation-core.mjs + scripts/map-sources/natural-earth.json\n\n`
    + `import type { MapCountryGeometry, MapInset, MapViewportFocus, MapWaterLayers } from '../../domain/map-models.js';\n\n`
    + `export const ${prefix}_VIEWBOX = '0 0 ${WIDTH} ${HEIGHT}';\n\n`
    + `export const ${prefix}_CARTOGRAPHY_PROVENANCE = ${serializeTs(provenance)} as const;\n\n`
    + `export const ${prefix}_GEOMETRY: Readonly<Record<string, MapCountryGeometry>> = ${serializeTs(geometry)};\n\n`
    + `export const ${prefix}_EXTRA_CONTEXT_PATHS: readonly string[] = ${serializeTs(contextPaths)};\n\n`
    + `export const ${prefix}_SHARED_BOUNDARY_PATHS: readonly string[] = ${serializeTs(sharedBoundaryPath ? [sharedBoundaryPath] : [])};\n\n`
    + `export const ${prefix}_COASTLINE_PATHS: readonly string[] = ${serializeTs(coastlinePath ? [coastlinePath] : [])};\n\n`
    + `export const ${prefix}_WATER: Readonly<MapWaterLayers> = ${serializeTs({ oceanPath, lakes })};\n\n`
    + `export const ${prefix}_SCOPE_FOCUS: Readonly<Record<string, MapViewportFocus>> = ${serializeTs(scopeFocus)};\n\n`
    + `export const ${prefix}_INSETS: readonly MapInset[] = ${serializeTs(insets)};\n\n`
    + `export const ${prefix}_LAND_ADJACENCY: Readonly<Record<string, readonly string[]>> = ${serializeTs(adjacency)};\n`;

  await writeFile(new URL(config.outputFilename, MAP_OUTPUT_DIR), output);
  await writeFile(new URL(config.provenanceFilename, DOCS_ARCHITECTURE_DIR), stableJson(provenance));

  console.log(
    `Generated ${config.displayName} production cartography: ${afterPoints}/${beforePoints} projected coordinates retained.`,
  );
  console.log(`Water: ${lakes.length} lakes/reservoirs; linear river context intentionally excluded.`);
}

function globalAdjacencyModule(globalGraph, manifest) {
  return `// GENERATED FILE. Do not hand-edit adjacency.\n`
    + `// Run: npm run maps:generate\n`
    + `// Canonical source: ${manifest.upstream}@${manifest.upstreamCommit}\n\n`
    + `export const GLOBAL_LAND_ADJACENCY: Readonly<Record<string, readonly string[]>> = ${serializeTs(globalGraph.adjacency)};\n`;
}

export async function generateConfiguredMaps(configs, argv = []) {
  const updateHashes = argv.includes('--update-hashes');
  const manifest = await loadManifest();
  const countrySource = await readFile(COUNTRY_SOURCE_PATH, 'utf8');
  const catalog = parseCountryCatalog(countrySource);

  const sourceResults = {};
  for (const key of Object.keys(manifest.sources).sort()) {
    sourceResults[key] = await fetchSource(manifest, key, updateHashes);
  }
  if (updateHashes) await writeFile(MANIFEST_PATH, stableJson(manifest));

  const globalGraph = deriveGlobalAdjacency(sourceResults.countries.json, catalog);
  await mkdir(MAP_OUTPUT_DIR, { recursive: true });
  await mkdir(NEIGHBOR_OUTPUT_DIR, { recursive: true });
  await mkdir(DOCS_ARCHITECTURE_DIR, { recursive: true });
  await writeFile(GLOBAL_ADJACENCY_PATH, globalAdjacencyModule(globalGraph, manifest));

  for (const config of configs) {
    await generateContinent({ config, catalog, sourceResults, manifest, globalGraph });
  }
  console.log(`Global adjacency derived from ${globalGraph.sourceFeatureCount} canonical Natural Earth source features.`);
  console.log(`Source commit: ${manifest.upstreamCommit}.`);
}
