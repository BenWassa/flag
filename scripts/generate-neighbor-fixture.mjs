#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { MAP_GENERATION_CONFIGS } from './map-continent-configs.mjs';

function constantName(config, suffix) {
  return `${config.exportPrefix}_${suffix}`;
}

function parseAdjacency(source, config) {
  const name = constantName(config, 'LAND_ADJACENCY');
  const marker = `export const ${name}: Readonly<Record<string, readonly string[]>> = `;
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Generated ${config.displayName} map output is missing ${name}.`);
  const objectStart = source.indexOf('{', markerIndex + marker.length);
  const objectEnd = source.indexOf('\n};', objectStart);
  if (objectStart < 0 || objectEnd < 0) throw new Error(`Could not parse generated ${config.displayName} adjacency object.`);
  return JSON.parse(source.slice(objectStart, objectEnd + 2));
}

function validateAdjacency(adjacency, config) {
  const ids = Object.keys(adjacency);
  for (const countryId of ids) {
    if (!Array.isArray(adjacency[countryId])) throw new Error(`${countryId} adjacency is not an array.`);
    adjacency[countryId] = [...new Set(adjacency[countryId])].sort();
    if (adjacency[countryId].includes(countryId)) throw new Error(`${countryId} adjacency contains a self-link.`);
    for (const neighborId of adjacency[countryId]) {
      // A globally complete continent slice may name a neighbour whose own
      // record lives in another runtime fixture. Only require local symmetry
      // when both sides are emitted by this continent.
      if (adjacency[neighborId] && !adjacency[neighborId].includes(countryId)) {
        throw new Error(`Asymmetric generated ${config.displayName} adjacency: ${countryId}<->${neighborId}.`);
      }
    }
  }
  return ids;
}

function fixtureSource(adjacency, config) {
  const ids = validateAdjacency(adjacency, config);
  const adjacencyName = constantName(config, 'LAND_ADJACENCY');
  const zeroName = constantName(config, 'ZERO_LAND_NEIGHBOR_IDS');
  const standardName = constantName(config, 'STANDARD_NEIGHBOR_TARGET_IDS');
  const adjacencyLines = ids.map((countryId) => {
    const neighborIds = adjacency[countryId].map((neighborId) => `'${neighborId}'`).join(', ');
    return `  ${countryId}: [${neighborIds}],`;
  }).join('\n');

  return {
    ids,
    source: `// GENERATED FIXTURE. Do not hand-edit adjacency.\n`
      + `// Canonical source: ${adjacencyName} emitted by the production topology generator.\n`
      + `// Regenerate with: npm run maps:generate\n\n`
      + `export const ${adjacencyName}: Readonly<Record<string, readonly string[]>> = {\n${adjacencyLines}\n};\n\n`
      + `export const ${zeroName} = Object.freeze(\n`
      + `  Object.keys(${adjacencyName}).filter((countryId) => ${adjacencyName}[countryId].length === 0),\n`
      + `);\n\n`
      + `export const ${standardName} = Object.freeze(\n`
      + `  Object.keys(${adjacencyName}).filter((countryId) => ${adjacencyName}[countryId].length > 0),\n`
      + `);\n`,
  };
}

const outputDir = new URL('../src/data/neighbors/', import.meta.url);
await mkdir(outputDir, { recursive: true });

for (const config of MAP_GENERATION_CONFIGS) {
  const mapPath = new URL(`../src/data/maps/${config.outputFilename}`, import.meta.url);
  const source = await readFile(mapPath, 'utf8');
  const adjacency = parseAdjacency(source, config);
  const output = fixtureSource(adjacency, config);
  await writeFile(new URL(`${config.id}.ts`, outputDir), output.source);
  console.log(`Generated lightweight ${config.displayName} neighbor fixture: ${output.ids.length} ISO3 countries.`);
}
