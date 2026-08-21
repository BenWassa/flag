import { readFile, writeFile } from 'node:fs/promises';
const path = new URL('../scripts/verify-neighbors.mjs', import.meta.url);
let source = await readFile(path, 'utf8');
const before = "assert.ok(generationSource.includes(\"src/data/maps/africa.ts\"), 'Lightweight fixture is mechanically extracted from Issue #9 generated topology output.');";
const after = "assert.ok(generationSource.includes('MAP_GENERATION_CONFIGS'), 'Lightweight fixtures are mechanically extracted from configured production topology outputs.');";
if (!source.includes(before)) throw new Error('Stale Neighbours generator assertion not found.');
source = source.replace(before, after);
await writeFile(path, source);
