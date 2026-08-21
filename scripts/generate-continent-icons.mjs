#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { merge } from 'topojson-client';
import { topology } from 'topojson-server';
import { presimplify, quantile, simplify } from 'topojson-simplify';

const MANIFEST_PATH = new URL('./map-sources/natural-earth.json', import.meta.url);
const OUTPUT_PATH = new URL('../src/ui/components/continent-icons.ts', import.meta.url);
const SIZE = 48;
const PADDING = 3;
// At 36 CSS px, sub-pixel 1:10m coastline detail is noise. Retain only the
// highest-weight 0.05% of topology points, then round projected paths to 0.1px.
const SIMPLIFICATION_QUANTILE = 0.9995;

const CONTINENTS = [
  ['africa', 'Africa', [[-20, 55]]],
  ['asia', 'Asia', [[25, 180]]],
  ['europe', 'Europe', [[-25, 45]]],
  ['north-america', 'North America', [[-170, -20]]],
  ['south-america', 'South America', [[-85, -30]]],
  ['oceania', 'Oceania', [[110, 180]]],
];

function cropToLongitudeRanges(geometry, ranges) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  const kept = polygons.filter((polygon) => {
    const outerRing = polygon[0] ?? [];
    if (!outerRing.length) return false;
    const longitude = outerRing.reduce((sum, point) => sum + point[0], 0) / outerRing.length;
    return ranges.some(([minimum, maximum]) => longitude >= minimum && longitude <= maximum);
  });
  return { type: 'MultiPolygon', coordinates: kept };
}

function cleanProjectedPath(path) {
  const rings = path.match(/M[^MZ]*Z/g) ?? [];
  const kept = [];

  for (const ring of rings) {
    let points = [...ring.matchAll(/[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)]
      .map((match) => [Number(match[1]), Number(match[2])])
      .filter((point, index, values) => index === 0 || point[0] !== values[index - 1][0] || point[1] !== values[index - 1][1]);
    if (points.length > 1 && points[0][0] === points.at(-1)[0] && points[0][1] === points.at(-1)[1]) points.pop();
    points = points.reduce((keptPoints, point, index) => {
      const previous = keptPoints.at(-1);
      if (!previous || index === points.length - 1 || Math.hypot(point[0] - previous[0], point[1] - previous[1]) >= 0.55) {
        keptPoints.push(point);
      }
      return keptPoints;
    }, []);
    if (points.length < 3) continue;

    const area = Math.abs(points.reduce((sum, point, index) => {
      const next = points[(index + 1) % points.length];
      return sum + point[0] * next[1] - next[0] * point[1];
    }, 0) / 2);
    if (area < 0.12) continue;

    kept.push(`${points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point[0]},${point[1]}`).join('')}Z`);
  }

  return kept.join('');
}

function fitCleanPath(path) {
  const coordinates = [...path.matchAll(/[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)]
    .map((match) => [Number(match[1]), Number(match[2])]);
  if (!coordinates.length) return path;
  const xs = coordinates.map((point) => point[0]);
  const ys = coordinates.map((point) => point[1]);
  const minimumX = Math.min(...xs);
  const maximumX = Math.max(...xs);
  const minimumY = Math.min(...ys);
  const maximumY = Math.max(...ys);
  const scale = Math.min(
    (SIZE - PADDING * 2) / (maximumX - minimumX),
    (SIZE - PADDING * 2) / (maximumY - minimumY),
  );
  const offsetX = (SIZE - (maximumX - minimumX) * scale) / 2;
  const offsetY = (SIZE - (maximumY - minimumY) * scale) / 2;
  return path.replace(/[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (command, x, y) => {
    const projectedX = ((Number(x) - minimumX) * scale + offsetX).toFixed(1).replace(/\.0$/, '');
    const projectedY = ((Number(y) - minimumY) * scale + offsetY).toFixed(1).replace(/\.0$/, '');
    return `${command[0]}${projectedX},${projectedY}`;
  });
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
const source = manifest.sources.countries;
const sourceUrl = `${manifest.rawBaseUrl}/${manifest.upstreamCommit}/${source.path}`;
const response = await fetch(sourceUrl);
if (!response.ok) throw new Error(`Could not fetch Natural Earth countries: ${response.status} ${response.statusText}`);

const bytes = Buffer.from(await response.arrayBuffer());
const digest = sha256(bytes);
if (digest !== source.sha256) {
  throw new Error(`Natural Earth countries sha256 mismatch: expected ${source.sha256}, received ${digest}.`);
}

const countries = JSON.parse(bytes.toString('utf8'));
const sourceTopology = topology({ countries });
const weightedTopology = presimplify(sourceTopology);
const simplifiedTopology = simplify(
  weightedTopology,
  quantile(weightedTopology, SIMPLIFICATION_QUANTILE),
);
const geometries = simplifiedTopology.objects.countries.geometries;
const paths = {};

for (const [id, sourceName, longitudeRanges] of CONTINENTS) {
  const members = geometries.filter((geometry) => geometry.properties?.CONTINENT === sourceName);
  if (!members.length) throw new Error(`Natural Earth contains no features for ${sourceName}.`);

  const outline = {
    type: 'Feature',
    properties: { id },
    geometry: cropToLongitudeRanges(merge(simplifiedTopology, members), longitudeRanges),
  };
  const projection = geoNaturalEarth1().fitExtent(
    [[PADDING, PADDING], [SIZE - PADDING, SIZE - PADDING]],
    outline,
  );
  const path = fitCleanPath(cleanProjectedPath(geoPath(projection).digits(1)(outline) ?? ''));
  if (!path) throw new Error(`Could not project ${sourceName}.`);
  paths[id] = path;
}

const output = `// Generated by scripts/generate-continent-icons.mjs from the pinned Natural Earth source.\n`
  + `// Do not hand-edit these paths.\n\n`
  + `const CONTINENT_PATHS: Record<string, string> = ${JSON.stringify(paths, null, 2)};\n\n`
  + `export function continentIcon(id: string): string {\n`
  + `  const path = CONTINENT_PATHS[id];\n`
  + `  if (!path) return '';\n`
  + `  return \`<svg class="continent-icon" viewBox="0 0 ${SIZE} ${SIZE}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="\${path}"/></svg>\`;\n`
  + `}\n`;

await writeFile(OUTPUT_PATH, output);
console.log(`Generated ${CONTINENTS.length} continent outline icons from ${sourceUrl}.`);
