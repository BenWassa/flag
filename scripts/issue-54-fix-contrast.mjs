#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

const path = 'scripts/verify-map-contrast.mjs';
let source = await readFile(path, 'utf8');
const from = "  ['Locations', `${locations}\\n${cartography}`, tokens.slice(0, 7)],\n";
const to = "  ['Locations', `${locations}\\n${cartography}`, tokens.slice(0, 6)],\n";
if (!source.includes(from)) throw new Error('Expected Locations token slice was not found.');
source = source.replace(from, to);
await writeFile(path, source);
console.log('Kept Locations map-contrast token scope to its six retained cartography roles.');
