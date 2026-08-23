#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { MAP_GENERATION_CONFIGS } from './map-continent-configs.mjs';

const PATH_DIGITS = 1;
const PHYSICAL_TOLERANCE = Object.freeze({
  ocean: 0.4,
  lakes: 0.15,
});

function extractLiteral(source, name) {
  const declaration = `export const ${name}`;
  const declarationIndex = source.indexOf(declaration);
  if (declarationIndex < 0) throw new Error(`Generated map constant ${name} was not found.`);
  const equalsIndex = source.indexOf('=', declarationIndex);
  const endIndex = source.indexOf(';\n\n', equalsIndex);
  if (equalsIndex < 0 || endIndex < 0) throw new Error(`Could not parse generated map constant ${name}.`);
  const raw = source.slice(equalsIndex + 1, endIndex).trim();
  const hasConstAssertion = /\s+as const$/.test(raw);
  const json = raw.replace(/\s+as const$/, '');
  return {
    equalsIndex,
    endIndex,
    hasConstAssertion,
    value: JSON.parse(json),
  };
}

function replaceLiteral(source, name, value) {
  const parsed = extractLiteral(source, name);
  const suffix = parsed.hasConstAssertion ? ' as const' : '';
  const replacement = ` ${JSON.stringify(value)}${suffix}`;
  return `${source.slice(0, parsed.equalsIndex + 1)}${replacement}${source.slice(parsed.endIndex)}`;
}

function formatNumber(value, digits = PATH_DIGITS) {
  const rounded = Number(value.toFixed(digits));
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

function roundSvgPath(path, digits = PATH_DIGITS) {
  return path.replace(/-?\d+(?:\.\d+)?/g, (value) => formatNumber(Number(value), digits));
}

function distanceToSegment(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) return Math.hypot(point[0] - start[0], point[1] - start[1]);
  const projected = ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy);
  const t = Math.max(0, Math.min(1, projected));
  return Math.hypot(point[0] - (start[0] + t * dx), point[1] - (start[1] + t * dy));
}

function rdp(points, tolerance) {
  if (points.length <= 2) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];

  while (stack.length) {
    const [startIndex, endIndex] = stack.pop();
    let furthestIndex = -1;
    let furthestDistance = tolerance;
    for (let index = startIndex + 1; index < endIndex; index += 1) {
      const distance = distanceToSegment(points[index], points[startIndex], points[endIndex]);
      if (distance > furthestDistance) {
        furthestDistance = distance;
        furthestIndex = index;
      }
    }
    if (furthestIndex >= 0) {
      keep[furthestIndex] = 1;
      stack.push([startIndex, furthestIndex], [furthestIndex, endIndex]);
    }
  }

  return points.filter((_, index) => keep[index]);
}

function parseSubpaths(path) {
  const commandPattern = /([MLZ])([^MLZ]*)/g;
  const subpaths = [];
  let current = null;
  let match;
  let consumed = '';

  while ((match = commandPattern.exec(path))) {
    consumed += match[0];
    const command = match[1];
    const numbers = match[2].match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    if (command === 'M') {
      if (numbers.length !== 2) throw new Error(`Unexpected SVG move command in generated water path: ${match[0]}`);
      if (current) subpaths.push(current);
      current = { points: [[numbers[0], numbers[1]]], closed: false };
    } else if (command === 'L') {
      if (!current || numbers.length !== 2) throw new Error(`Unexpected SVG line command in generated water path: ${match[0]}`);
      current.points.push([numbers[0], numbers[1]]);
    } else if (command === 'Z') {
      if (!current || numbers.length !== 0) throw new Error(`Unexpected SVG close command in generated water path: ${match[0]}`);
      current.closed = true;
      subpaths.push(current);
      current = null;
    }
  }

  if (current) subpaths.push(current);
  if (consumed !== path) {
    throw new Error('Generated water path contains an unsupported SVG command; refusing lossy optimization.');
  }
  return subpaths;
}

function simplifySvgPath(path, tolerance) {
  const output = [];
  for (const subpath of parseSubpaths(path)) {
    if (subpath.points.length === 0) continue;
    let working = subpath.points;
    if (subpath.closed && working.length > 2) working = [...working, working[0]];
    let simplified = rdp(working, tolerance);
    if (subpath.closed) {
      const unique = simplified.slice(0, -1);
      if (unique.length < 3) simplified = [...working];
    }

    const first = simplified[0];
    output.push(`M${formatNumber(first[0])},${formatNumber(first[1])}`);
    for (let index = 1; index < simplified.length; index += 1) {
      const point = simplified[index];
      if (subpath.closed && index === simplified.length - 1 && point[0] === first[0] && point[1] === first[1]) continue;
      output.push(`L${formatNumber(point[0])},${formatNumber(point[1])}`);
    }
    if (subpath.closed) output.push('Z');
  }
  return output.join('');
}

async function optimizeContinent(config) {
  const mapPath = new URL(`../src/data/maps/${config.outputFilename}`, import.meta.url);
  const provenancePath = new URL(`../docs/architecture/${config.provenanceFilename}`, import.meta.url);
  const prefix = config.exportPrefix;
  let source = await readFile(mapPath, 'utf8');
  const beforeBytes = Buffer.byteLength(source);

  const provenance = extractLiteral(source, `${prefix}_CARTOGRAPHY_PROVENANCE`).value;
  const geometry = extractLiteral(source, `${prefix}_GEOMETRY`).value;
  const contextPaths = extractLiteral(source, `${prefix}_EXTRA_CONTEXT_PATHS`).value;
  const sharedBoundaryPaths = extractLiteral(source, `${prefix}_SHARED_BOUNDARY_PATHS`).value;
  const coastlinePaths = extractLiteral(source, `${prefix}_COASTLINE_PATHS`).value;
  const water = extractLiteral(source, `${prefix}_WATER`).value;

  const precisionSensitiveIds = new Set(config.precisionSensitiveCountryIds ?? []);
  for (const [countryId, item] of Object.entries(geometry)) {
    const digits = precisionSensitiveIds.has(countryId) ? 2 : PATH_DIGITS;
    if (item.path) item.path = roundSvgPath(item.path, digits);
    if (item.outlinePath) item.outlinePath = roundSvgPath(item.outlinePath, digits);
  }
  for (let index = 0; index < contextPaths.length; index += 1) contextPaths[index] = roundSvgPath(contextPaths[index]);
  for (let index = 0; index < sharedBoundaryPaths.length; index += 1) sharedBoundaryPaths[index] = roundSvgPath(sharedBoundaryPaths[index]);
  for (let index = 0; index < coastlinePaths.length; index += 1) coastlinePaths[index] = roundSvgPath(coastlinePaths[index]);

  if (water.oceanPath) water.oceanPath = simplifySvgPath(water.oceanPath, PHYSICAL_TOLERANCE.ocean);
  for (const lake of water.lakes ?? []) lake.path = simplifySvgPath(lake.path, PHYSICAL_TOLERANCE.lakes);

  provenance.runtimeOptimization = {
    pathDigits: PATH_DIGITS,
    method: 'projection-space path quantization plus Ramer-Douglas-Peucker for non-interactive physical context',
    canvasUnits: `${config.displayName} ${835}x${723} projected canvas units`,
    physicalTolerance: { ...PHYSICAL_TOLERANCE },
    precisionSensitiveCountryIds: [...precisionSensitiveIds],
  };

  source = replaceLiteral(source, `${prefix}_CARTOGRAPHY_PROVENANCE`, provenance);
  source = replaceLiteral(source, `${prefix}_GEOMETRY`, geometry);
  source = replaceLiteral(source, `${prefix}_EXTRA_CONTEXT_PATHS`, contextPaths);
  source = replaceLiteral(source, `${prefix}_SHARED_BOUNDARY_PATHS`, sharedBoundaryPaths);
  source = replaceLiteral(source, `${prefix}_COASTLINE_PATHS`, coastlinePaths);
  source = replaceLiteral(source, `${prefix}_WATER`, water);

  await writeFile(mapPath, source);
  await writeFile(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);

  const afterBytes = Buffer.byteLength(source);
  console.log(
    `Optimized ${config.displayName} runtime asset from ${beforeBytes} to ${afterBytes} bytes `
    + `(${Math.round((afterBytes / beforeBytes) * 100)}%).`,
  );
}

for (const config of MAP_GENERATION_CONFIGS) await optimizeContinent(config);
console.log(
  `Physical path tolerances: ocean ${PHYSICAL_TOLERANCE.ocean}, lakes ${PHYSICAL_TOLERANCE.lakes}; `
  + `final path precision ${PATH_DIGITS} decimal.`,
);
