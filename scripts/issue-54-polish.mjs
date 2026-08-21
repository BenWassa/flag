#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
const path = 'styles.css';
let source = await readFile(path, 'utf8');
const from = '.launcher-map-context { fill: var(--map-context-land); }.launcher-map-region {';
const to = '.launcher-map-context { fill: var(--map-context-land); }\n.launcher-map-region {';
if (!source.includes(from)) throw new Error('Expected joined launcher rules were not found.');
source = source.replace(from, to);
await writeFile(path, source);
