#!/usr/bin/env node

/**
 * EXPERIMENT ONLY — Issue #119 spatial Atlas support work.
 *
 * Estimates how aggressively the existing generated country paths can be
 * simplified for a low-detail spatial/world presentation. This does NOT define
 * the spherical asset pipeline: it works on the current projected runtime paths
 * only so we can establish a conservative payload/shape envelope before the
 * principal renderer/geometry architecture is chosen.
 *
 * Run from the repository root:
 *   node scripts/experiments/spatial-lod-envelope.mjs
 */

import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const SOURCES = [
  ['AFRICA', 'src/data/maps/africa.ts'],
  ['SOUTH_AMERICA', 'src/data/maps/south-america.ts'],
  ['EUROPE', 'src/data/maps/europe.ts'],
  ['ASIA', 'src/data/maps/asia.ts'],
];

const TOLERANCES = [0, 0.25, 0.5, 1, 2, 4];

function extractGeometry(prefix, path) {
  const source = readFileSync(path, 'utf8');
  const marker = `export const ${prefix}_GEOMETRY = `;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Could not find ${prefix}_GEOMETRY in ${path}`);
  const jsonStart = start + marker.length;
  const endMarker = `;\nexport const ${prefix}_EXTRA_CONTEXT_PATHS`;
  const end = source.indexOf(endMarker, jsonStart);
  if (end < 0) throw new Error(`Could not find end of ${prefix}_GEOMETRY in ${path}`);
  return JSON.parse(source.slice(jsonStart, end));
}

function parsePath(path) {
  const tokens = path.match(/[MLZ]|-?\d+(?:\.\d+)?/g) ?? [];
  const sequences = [];
  let current = [];
  let command;
  for (let index = 0; index < tokens.length;) {
    const token = tokens[index];
    if (token === 'M' || token === 'L') {
      command = token;
      index += 1;
      continue;
    }
    if (token === 'Z') {
      if (current.length) sequences.push({ points: current, closed: true });
      current = [];
      command = undefined;
      index += 1;
      continue;
    }
    if (command !== 'M' && command !== 'L') throw new Error(`Unexpected SVG token ${token}`);
    const x = Number(token);
    const y = Number(tokens[index + 1]);
    index += 2;
    if (command === 'M' && current.length) {
      sequences.push({ points: current, closed: false });
      current = [];
    }
    current.push([x, y]);
    command = 'L';
  }
  if (current.length) sequences.push({ points: current, closed: false });
  return sequences;
}

function distanceToSegment(point, start, end) {
  const [x, y] = point;
  const [x1, y1] = start;
  const [x2, y2] = end;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  return Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1) / Math.hypot(dx, dy);
}

function rdp(points, tolerance) {
  if (points.length <= 2) return points;
  let maxDistance = -1;
  let split = -1;
  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = distanceToSegment(points[index], points[0], points.at(-1));
    if (distance > maxDistance) {
      maxDistance = distance;
      split = index;
    }
  }
  if (maxDistance <= tolerance) return [points[0], points.at(-1)];
  const left = rdp(points.slice(0, split + 1), tolerance);
  const right = rdp(points.slice(split), tolerance);
  return [...left.slice(0, -1), ...right];
}

function format(value) {
  const fixed = value.toFixed(1).replace(/\.0$/, '');
  return fixed === '-0' ? '0' : fixed;
}

function simplifyPath(path, tolerance) {
  const output = [];
  for (const { points, closed } of parsePath(path)) {
    if (!points.length) continue;
    const working = closed && (points.at(-1)[0] !== points[0][0] || points.at(-1)[1] !== points[0][1])
      ? [...points, points[0]]
      : points;
    let simplified = tolerance > 0 ? rdp(working, tolerance) : working;
    if (closed && simplified.length > 1 && simplified.at(-1)[0] === simplified[0][0] && simplified.at(-1)[1] === simplified[0][1]) {
      simplified = simplified.slice(0, -1);
    }
    if (closed && simplified.length < 3) simplified = points.slice(0, 3);
    output.push(`M${format(simplified[0][0])},${format(simplified[0][1])}`);
    for (const [x, y] of simplified.slice(1)) output.push(`L${format(x)},${format(y)}`);
    if (closed) output.push('Z');
  }
  return output.join('');
}

function coordinateCount(path) {
  return (path.match(/[ML]-?\d/g) ?? []).length;
}

function ringArea(points) {
  if (points.length < 3) return 0;
  let twice = 0;
  for (let index = 0; index < points.length; index += 1) {
    const [x1, y1] = points[index];
    const [x2, y2] = points[(index + 1) % points.length];
    twice += x1 * y2 - x2 * y1;
  }
  return Math.abs(twice) / 2;
}

function pathArea(path) {
  return parsePath(path).reduce((sum, sequence) => sum + ringArea(sequence.points), 0);
}

const geometries = Object.fromEntries(SOURCES.map(([prefix, path]) => [prefix, extractGeometry(prefix, path)]));

console.log('Issue #119 projected-path LOD payload envelope');
console.log('NOTE: payload feasibility proxy only; not a spherical pipeline decision.\n');

for (const tolerance of TOLERANCES) {
  const output = {};
  const distortion = [];
  let coordinateTotal = 0;

  for (const [prefix, geometry] of Object.entries(geometries)) {
    output[prefix] = {};
    for (const [countryId, country] of Object.entries(geometry)) {
      if (!country.path) continue;
      const simplified = simplifyPath(country.path, tolerance);
      output[prefix][countryId] = simplified;
      coordinateTotal += coordinateCount(simplified);
      const sourceArea = pathArea(country.path);
      const simplifiedArea = pathArea(simplified);
      if (sourceArea > 0) {
        distortion.push({
          countryId,
          continent: prefix,
          relativeAreaChange: Math.abs(simplifiedArea - sourceArea) / sourceArea,
          sourceArea,
        });
      }
    }
  }

  const bytes = Buffer.from(JSON.stringify(output));
  distortion.sort((left, right) => right.relativeAreaChange - left.relativeAreaChange);
  const overFivePercent = distortion.filter((item) => item.relativeAreaChange > 0.05).length;
  const overTenPercent = distortion.filter((item) => item.relativeAreaChange > 0.10).length;

  console.log(JSON.stringify({
    tolerance,
    coordinateTotal,
    rawBytes: bytes.length,
    gzipBytes: gzipSync(bytes, { level: 9 }).length,
    countriesOverFivePercentAreaChange: overFivePercent,
    countriesOverTenPercentAreaChange: overTenPercent,
    worstAreaChanges: distortion.slice(0, 8).map((item) => ({
      countryId: item.countryId,
      continent: item.continent,
      relativeAreaChange: Number(item.relativeAreaChange.toFixed(4)),
      sourceArea: Number(item.sourceArea.toFixed(3)),
    })),
  }, null, 2));
}
