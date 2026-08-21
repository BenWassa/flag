import { readFile, writeFile } from 'node:fs/promises';
const path = new URL('../scripts/verify-neighbor-map.mjs', import.meta.url);
let source = await readFile(path, 'utf8');
const before = "assert.ok(runtime.includes(\"loadMapAsset('africa')\"), 'Neighbor geometry is requested lazily only by the active map runtime.');";
const after = "assert.ok(runtime.includes('loadMapAsset(scopeId)') && runtime.includes('assetPromiseByScopeId'), 'Neighbour geometry is requested lazily and memoised by the active scope.');";
if (!source.includes(before)) throw new Error('Stale neighbour-map lazy-load assertion not found.');
await writeFile(path, source.replace(before, after));
