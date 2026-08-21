import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const theme = await readFile('src/styles/atlas-theme.css', 'utf8');
const launcher = await readFile('src/styles/styles.css', 'utf8');
const locations = await readFile('src/styles/map.css', 'utf8');
const cartography = await readFile('src/styles/map-cartography.css', 'utf8');
const neighbours = await readFile('src/styles/neighbors.css', 'utf8');

const tokens = [
  '--map-ocean',
  '--map-inland-water',
  '--map-context-land',
  '--map-context-border',
  '--map-active-land',
  '--map-active-border',
  '--map-label-halo',
];

for (const token of tokens) {
  assert.match(theme, new RegExp(`${token}:\\s*#[0-9a-f]{6}`, 'i'), `${token} is centrally defined by Tactile Atlas.`);
}

for (const [surface, css, required] of [
  ['launcher', launcher, ['--map-ocean', '--map-inland-water', '--map-context-land', '--map-active-land', '--map-active-border']],
  ['Locations', `${locations}\n${cartography}`, tokens.slice(0, 6)],
  ['Neighbours', neighbours, ['--map-ocean', '--map-context-land', '--map-active-land', '--map-active-border', '--map-label-halo']],
]) {
  for (const token of required) assert.ok(css.includes(`var(${token})`), `${surface} consumes ${token}.`);
}

assert.ok(launcher.lastIndexOf('.launcher-map-region--selected') > launcher.indexOf('.launcher-map-country__shape'), 'Launcher selection outranks neutral map geography.');
assert.ok(locations.lastIndexOf('.map-country--current-correct') > locations.indexOf('.map-country__shape'), 'Locations correct feedback outranks neutral map geography.');
assert.ok(locations.lastIndexOf('.map-country--wrong-pulse') > locations.indexOf('.map-country__shape'), 'Locations wrong feedback outranks neutral map geography.');
assert.ok(neighbours.indexOf('.neighbor-map-country--target') > neighbours.indexOf('.neighbor-map-country__shape'), 'Neighbours target treatment outranks neutral map geography.');
assert.ok(neighbours.indexOf('.neighbor-map-country--solved') > neighbours.indexOf('.neighbor-map-country__shape'), 'Neighbours solved treatment outranks neutral map geography.');
assert.ok(neighbours.indexOf('.neighbor-map-country--revealed') > neighbours.indexOf('.neighbor-map-country__shape'), 'Neighbours revealed treatment outranks neutral map geography.');

for (const [surface, css] of [['launcher', launcher], ['Locations', `${locations}\n${cartography}`], ['Neighbours', neighbours]]) {
  assert.ok(css.includes('@media (forced-colors: active)'), `${surface} has a forced-colours contract.`);
  assert.ok(css.includes('Canvas') && css.includes('CanvasText'), `${surface} maps geography to system colours.`);
}

for (const css of [launcher, locations, cartography, neighbours]) {
  assert.ok(!/--map-[\w-]+:\s*#/i.test(css), 'Consumer sheets do not fork the central map palette.');
}

for (const css of [theme, launcher, locations, cartography, neighbours]) {
  assert.ok(!css.includes('--map-water-line'), 'Obsolete river colour token is absent.');
  assert.ok(!css.includes('map-water--rivers') && !css.includes('launcher-map-water--rivers'), 'No map surface retains river styling.');
}

console.log('Map contrast verification passed: one neutral token family serves launcher, Locations and Neighbours with semantic and forced-colours precedence.');
