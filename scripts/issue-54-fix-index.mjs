#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

const path = 'src/data/maps/index.ts';
let source = await readFile(path, 'utf8');
const riverClone = "      rivers: (data.AFRICA_WATER.rivers ?? []).map((item) => ({ ...item })),\n";
if (!source.includes(riverClone)) throw new Error('Expected map asset river clone was not found.');
source = source.replace(riverClone, '');
await writeFile(path, source);
console.log('Removed stale river clone from map asset adapter.');
