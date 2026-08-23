#!/usr/bin/env node
import { copyFile, mkdir } from 'node:fs/promises';

const files = [
  ['src/data/maps/south-america.ts', 'dist/issue-24-generated/src/data/maps/south-america.ts'],
  ['src/data/neighbors/south-america.ts', 'dist/issue-24-generated/src/data/neighbors/south-america.ts'],
  ['docs/architecture/south-america-cartography-provenance.json', 'dist/issue-24-generated/docs/architecture/south-america-cartography-provenance.json'],
];

for (const [source, destination] of files) {
  await mkdir(destination.slice(0, destination.lastIndexOf('/')), { recursive: true });
  await copyFile(source, destination);
}

console.log('Staged exact Issue #24 generated sources inside the production artifact.');
