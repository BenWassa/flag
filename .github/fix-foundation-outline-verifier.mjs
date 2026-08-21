import { readFile, writeFile } from 'node:fs/promises';
const path = new URL('../scripts/verify-outline.mjs', import.meta.url);
let source = await readFile(path, 'utf8');
source = source.replace(
  "const generatorSource = await readFile('scripts/generate-maps.mjs', 'utf8');\nassert.ok(generatorSource.includes('countryGeometry.outlinePath = countryPath'), 'Locator-island silhouettes must be emitted by the canonical production map generator.');",
  "const generatorSource = await readFile('scripts/map-generation-core.mjs', 'utf8');\nassert.ok(generatorSource.includes('countryGeometry.outlinePath = countryPath'), 'Locator-island silhouettes must be emitted by the canonical shared production map generator.');",
);
await writeFile(path, source);
