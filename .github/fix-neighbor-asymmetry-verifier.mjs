import { readFile, writeFile } from 'node:fs/promises';
const path = new URL('../scripts/verify-neighbors.mjs', import.meta.url);
let source = await readFile(path, 'utf8');
const before = "assert.ok(generationSource.includes('Asymmetric generated adjacency'), 'Fixture generation fails on asymmetric topology output.');";
const after = "assert.ok(generationSource.includes('Asymmetric generated') && generationSource.includes('adjacency:'), 'Fixture generation fails on asymmetric topology output.');";
if (!source.includes(before)) throw new Error('Stale asymmetry assertion not found.');
await writeFile(path, source.replace(before, after));
