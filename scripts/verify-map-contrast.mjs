import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const theme = await readFile('src/styles/atlas-theme.css', 'utf8');
const launcherShell = await readFile('src/styles/styles.css', 'utf8');
const locations = await readFile('src/styles/map.css', 'utf8');
const cartography = await readFile('src/styles/map-cartography.css', 'utf8');
const locationStyles = `${locations}\n${cartography}`;
const neighbours = await readFile('src/styles/neighbors.css', 'utf8');
const mapRenderer = await readFile('src/ui/components/map.ts', 'utf8');

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
  ['Locations', locationStyles, tokens.slice(0, 6)],
  ['Neighbours', neighbours, ['--map-ocean', '--map-context-land', '--map-active-land', '--map-active-border', '--map-label-halo']],
]) {
  for (const token of required) assert.ok(css.includes(`var(${token})`), `${surface} consumes ${token}.`);
}

// The launcher retired its map, so the launcher shell must no longer consume
// the cartography palette at all.
assert.equal(/--map-[\w-]+/.test(launcherShell), false, 'The launcher shell no longer renders map geography.');
assert.ok(locations.lastIndexOf('.map-country--current-correct') > locations.indexOf('.map-country__shape'), 'Locations correct feedback outranks neutral map geography.');
assert.ok(locations.lastIndexOf('.map-country--wrong-pulse') > locations.indexOf('.map-country__shape'), 'Locations wrong feedback outranks neutral map geography.');
assert.ok(neighbours.indexOf('.neighbor-map-country--target') > neighbours.indexOf('.neighbor-map-country__shape'), 'Neighbours target treatment outranks neutral map geography.');
assert.ok(neighbours.indexOf('.neighbor-map-country--solved') > neighbours.indexOf('.neighbor-map-country__shape'), 'Neighbours solved treatment outranks neutral map geography.');
assert.ok(neighbours.indexOf('.neighbor-map-country--revealed') > neighbours.indexOf('.neighbor-map-country__shape'), 'Neighbours revealed treatment outranks neutral map geography.');

for (const [surface, css] of [['Locations', locationStyles], ['Neighbours', neighbours]]) {
  assert.ok(css.includes('@media (forced-colors: active)'), `${surface} has a forced-colours contract.`);
  assert.ok(css.includes('Canvas') && css.includes('CanvasText'), `${surface} maps geography to system colours.`);
}

for (const css of [locations, cartography, neighbours]) {
  assert.ok(!/--map-[\w-]+:\s*#/i.test(css), 'Consumer sheets do not fork the central map palette.');
}

for (const css of [theme, launcherShell, locations, cartography, neighbours]) {
  assert.ok(!css.includes('--map-water-line'), 'Obsolete river colour token is absent.');
  assert.ok(!css.includes('map-water--rivers') && !css.includes('launcher-map-water--rivers'), 'No map surface retains river styling.');
}

// Issue #201: outcome colour belongs to exact country geometry, never to the
// practical interaction/cartographic symbols that can extend beyond it. Check
// both Locations sheets because map-cartography.css is deliberately loaded last.
const feedbackStates = [
  'first',
  'one-miss',
  'two-miss',
  'revealed',
  'current-correct',
  'current-wrong',
  'wrong-pulse',
];
const helperMarks = ['locator', 'marker', 'callout-target', 'callout-line'];
for (const state of feedbackStates) {
  assert.ok(
    locations.includes(`.map-country--${state} .map-country__shape`),
    `${state} feedback fills ordinary canonical country paths.`,
  );
  for (const helper of helperMarks) {
    assert.equal(
      locationStyles.includes(`.map-country--${state} .map-country__${helper}`),
      false,
      `${state} feedback does not style the ${helper} helper symbol in either Locations stylesheet.`,
    );
  }
}
assert.ok(
  locations.includes('.map-country--current-correct .map-country__feedback-shape')
    && locations.includes('.map-country--wrong-pulse .map-country__feedback-shape'),
  'Immediate feedback reaches the canonical fallback path used by locator-only islands.',
);
assert.ok(
  mapRenderer.includes('!geometry.path && geometry.outlinePath')
    && mapRenderer.includes('class="map-country__feedback-shape"'),
  'Locator-only countries reuse generated outlinePath geometry for feedback instead of enlarging a locator.',
);

const correctFrames = locations.slice(
  locations.indexOf('@keyframes map-correct'),
  locations.indexOf('@keyframes map-wrong'),
);
const wrongFrames = locations.slice(
  locations.indexOf('@keyframes map-wrong'),
  locations.indexOf('/* Results favour error structure'),
);
assert.ok(correctFrames.length > 0 && wrongFrames.length > 0, 'Locations retains correct and wrong feedback motion.');
assert.equal(correctFrames.includes('stroke-width'), false, 'Correct animation never expands an exterior stroke.');
assert.equal(wrongFrames.includes('stroke-width'), false, 'Wrong animation never expands an exterior stroke.');
assert.equal(locations.includes('@keyframes map-wrong-line'), false, 'No semantic callout-line animation remains.');

const insetCountriesIndex = mapRenderer.indexOf('<g class="map-inset__countries">');
const insetBoundariesIndex = mapRenderer.indexOf('<g class="map-inset__boundaries" aria-hidden="true">');
assert.ok(
  insetCountriesIndex >= 0 && insetBoundariesIndex > insetCountriesIndex,
  'Inset topology boundaries paint after country fills so shared borders/coastlines stay crisp.',
);
assert.ok(
  mapRenderer.indexOf('<g class="map-active-countries">') < mapRenderer.lastIndexOf('${renderBoundaries(asset)}'),
  'Main-map topology boundaries paint after country fills.',
);

console.log('Map contrast verification passed: one cartography token family serves Locations and Neighbours, and Locations feedback stays inside canonical country geometry.');
