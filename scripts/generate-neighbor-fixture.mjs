#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const MAP_OUTPUT_PATH = new URL('../src/data/maps/africa.ts', import.meta.url);
const NEIGHBOR_OUTPUT_PATH = new URL('../src/data/neighbors/africa.ts', import.meta.url);
const MARKER = 'export const AFRICA_LAND_ADJACENCY: Readonly<Record<string, readonly string[]>> = ';

const source = await readFile(MAP_OUTPUT_PATH, 'utf8');
const markerIndex = source.indexOf(MARKER);
if (markerIndex < 0) throw new Error('Generated Africa map output is missing AFRICA_LAND_ADJACENCY.');
const objectStart = source.indexOf('{', markerIndex + MARKER.length);
const objectEnd = source.indexOf('\n};', objectStart);
if (objectStart < 0 || objectEnd < 0) throw new Error('Could not parse generated Africa adjacency object.');

const adjacency = JSON.parse(source.slice(objectStart, objectEnd + 2));
const ids = Object.keys(adjacency);
for (const countryId of ids) {
  if (!Array.isArray(adjacency[countryId])) throw new Error(`${countryId} adjacency is not an array.`);
  adjacency[countryId] = [...new Set(adjacency[countryId])].sort();
  if (adjacency[countryId].includes(countryId)) throw new Error(`${countryId} adjacency contains a self-link.`);
  for (const neighborId of adjacency[countryId]) {
    if (!adjacency[neighborId]?.includes(countryId)) throw new Error(`Asymmetric generated adjacency: ${countryId}<->${neighborId}.`);
  }
}

const adjacencyLines = ids.map((countryId) => {
  const neighbors = adjacency[countryId].map((neighborId) => `'${neighborId}'`).join(', ');
  return `  ${countryId}: [${neighbors}],`;
}).join('\n');

const output = `// GENERATED FIXTURE. Do not hand-edit adjacency.\n`
  + `// Canonical source: AFRICA_LAND_ADJACENCY emitted by scripts/generate-maps.mjs from the Issue #9 topology.\n`
  + `// Regenerate with: npm run maps:generate\n\n`
  + `export const AFRICA_LAND_ADJACENCY: Readonly<Record<string, readonly string[]>> = {\n${adjacencyLines}\n};\n\n`
  + `export const AFRICA_ZERO_LAND_NEIGHBOR_IDS = Object.freeze(\n`
  + `  Object.keys(AFRICA_LAND_ADJACENCY).filter((countryId) => AFRICA_LAND_ADJACENCY[countryId].length === 0),\n`
  + `);\n\n`
  + `export const AFRICA_STANDARD_NEIGHBOR_TARGET_IDS = Object.freeze(\n`
  + `  Object.keys(AFRICA_LAND_ADJACENCY).filter((countryId) => AFRICA_LAND_ADJACENCY[countryId].length > 0),\n`
  + `);\n`;

await mkdir(new URL('../src/data/neighbors/', import.meta.url), { recursive: true });
await writeFile(NEIGHBOR_OUTPUT_PATH, output);
console.log(`Generated lightweight Africa neighbor fixture: ${ids.length} ISO3 countries.`);
