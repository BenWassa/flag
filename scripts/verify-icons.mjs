import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { continentIcon } from '../dist/ui/components/continent-icons.js';
import { icon } from '../dist/ui/components/icons.js';

const PHOSPHOR_BOLD_SOURCES = {
  back: 'arrow-left',
  close: 'x',
  chevron: 'caret-right',
  ledger: 'chart-bar',
  play: 'play',
  flag: 'flag',
  outline: 'polygon',
  location: 'map-pin',
  adjacency: 'intersect',
  'zoom-in': 'magnifying-glass-plus',
  'zoom-out': 'magnifying-glass-minus',
  star: 'star',
  check: 'check',
};

function innerSvg(svg) {
  return svg.replace(/^<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

for (const [atlasName, phosphorName] of Object.entries(PHOSPHOR_BOLD_SOURCES)) {
  const source = await readFile(
    `node_modules/@phosphor-icons/core/assets/bold/${phosphorName}-bold.svg`,
    'utf8',
  );
  const rendered = icon(atlasName);

  assert.ok(
    rendered.includes(innerSvg(source)),
    `${atlasName} must match Phosphor Bold's ${phosphorName} geometry.`,
  );
  assert.ok(rendered.includes('viewBox="0 0 256 256"'), `${atlasName} keeps the Phosphor viewBox.`);
  assert.ok(rendered.includes('fill="currentColor"'), `${atlasName} inherits colour from its context.`);
  assert.ok(rendered.includes('aria-hidden="true"'), `${atlasName} stays decorative inside its labelled control.`);
  assert.ok(rendered.includes('focusable="false"'), `${atlasName} cannot create a duplicate focus stop.`);
  assert.equal(rendered.includes('stroke='), false, `${atlasName} does not retain the provisional stroke family.`);
}

console.log(`Verified ${Object.keys(PHOSPHOR_BOLD_SOURCES).length} curated Phosphor Bold icons.`);

const continentIcons = ['africa', 'asia', 'europe', 'north-america', 'south-america', 'oceania']
  .map((id) => continentIcon(id));
assert.equal(new Set(continentIcons).size, 6, 'Every continent has distinct silhouette geometry.');
for (const rendered of continentIcons) {
  assert.ok(rendered.includes('class="continent-icon"'), 'Continent marks use the shared silhouette class.');
  assert.ok(rendered.includes('viewBox="0 0 48 48"'), 'Continent marks use the compact generated viewBox.');
  assert.ok(rendered.includes('fill="currentColor"'), 'Routine continent silhouettes inherit their contextual colour.');
  assert.equal(rendered.includes('stroke='), false, 'Flat continent silhouettes do not add a second outline treatment.');
  assert.ok(rendered.includes('aria-hidden="true"'), 'The labelled continent card owns the accessible name.');
}
assert.equal(continentIcon('unknown'), '', 'Unknown continent IDs do not invent fallback geography.');
console.log('Verified 6 generated Natural Earth continent silhouettes.');
