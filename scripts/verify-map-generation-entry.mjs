import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
assert.equal(
  packageJson.scripts?.['maps:generate'],
  'node scripts/generate-map-assets.mjs',
  'Map generation must use the source-aware orchestration wrapper.',
);

const wrapper = await readFile('scripts/generate-map-assets.mjs', 'utf8');
const sourceCall = "run('scripts/generate-maps.mjs', process.argv.slice(2));";
const optimizationCall = "run('scripts/optimize-map-runtime.mjs');";
assert.ok(wrapper.includes(sourceCall), 'CLI source-control flags are forwarded to the geodata generator.');
assert.ok(wrapper.includes(optimizationCall), 'Runtime path optimization remains part of the generation pipeline.');
assert.ok(
  wrapper.indexOf(sourceCall) < wrapper.indexOf(optimizationCall),
  'Source generation must complete before deterministic runtime optimization.',
);

console.log('Map generation entry-point verification passed: source flags forward before runtime optimization.');
