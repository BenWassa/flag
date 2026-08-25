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
  warning: 'warning',
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

/* --- Issue #43: the source-derived Atlas globe brand mark --- */

const BRAND_SVGS = ['atlas-globe.svg', 'app-icon.svg', 'app-icon-maskable.svg'];
const BRAND_PNGS = {
  'app-icon-192.png': 192,
  'app-icon-512.png': 512,
  'app-icon-1024.png': 1024,
  'app-icon-maskable-512.png': 512,
  'apple-touch-icon.png': 180,
};
const GRAPHITE = '#101318';

const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'));
const html = await readFile('dist/index.html', 'utf8');
const serviceWorker = await readFile('dist/sw.js', 'utf8');
const sourceManifest = JSON.parse(await readFile('scripts/map-sources/natural-earth.json', 'utf8'));

for (const name of BRAND_SVGS) {
  const svg = await readFile(`dist/icons/${name}`, 'utf8');
  assert.ok(svg.includes('viewBox="0 0 1024 1024"'), `${name} uses the canonical 1024 canvas.`);
  assert.ok(
    svg.includes(sourceManifest.sources.countries.path),
    `${name} records the pinned Natural Earth countries source it was generated from.`,
  );
  assert.ok(svg.includes('geoOrthographic'), `${name} records the fixed-radius orthographic projection.`);
  for (const banned of ['<text', '<image', '<filter', 'Gradient', 'href=', 'data:']) {
    assert.ok(!svg.includes(banned), `${name} contains no ${banned} — the mark stays flat geometry only.`);
  }
  assert.ok(!svg.includes('stroke'), `${name} draws no country boundaries: the land is merged and borderless.`);

  const colours = new Set([...svg.matchAll(/fill="([^"]+)"/g)].map(([, value]) => value.toLowerCase()));
  for (const colour of colours) {
    assert.ok(
      colour === '#ffffff' || colour === GRAPHITE,
      `${name} uses only white and graphite, found ${colour}.`,
    );
  }
  assert.ok(colours.has('#ffffff'), `${name} draws the land in white.`);
}

const regularSvg = await readFile('dist/icons/app-icon.svg', 'utf8');
const maskableSvg = await readFile('dist/icons/app-icon-maskable.svg', 'utf8');
const globeSvg = await readFile('dist/icons/atlas-globe.svg', 'utf8');
assert.ok(!globeSvg.includes('<rect'), 'The canonical mark has a transparent background.');
assert.ok(regularSvg.includes('rx="224"'), 'The regular icon carries the squircle field.');
assert.ok(
  maskableSvg.includes('<rect width="1024" height="1024"') && !maskableSvg.includes('rx='),
  'The maskable icon is full-bleed with no baked rounded mask.',
);
assert.notEqual(regularSvg, maskableSvg, 'Regular and maskable are separate assets, not one file reused.');

const landPath = /<path d="([^"]+)"/.exec(globeSvg)?.[1] ?? '';
assert.ok(landPath.length > 4000, 'The globe retains real coastline geometry rather than a token shape.');
const points = [...landPath.matchAll(/[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)]
  .map(([, x, y]) => [Number(x), Number(y)]);
const radii = points.map(([x, y]) => Math.hypot(x - 512, y - 512));
// A fixed-radius orthographic globe: no land may fall outside the disc, and the
// disc is 74% of the canvas regardless of which hemisphere is showing.
assert.ok(Math.max(...radii) <= 512 * 0.74 + 1, 'No land escapes the fixed globe radius.');
assert.ok(Math.max(...radii) >= 512 * 0.70, 'The land reaches the limb, so the globe is not land-fitted and shrunken.');
// Maskable safe zone: the standard minimum is a central circle of 40% radius.
assert.ok(Math.max(...radii) <= 512 * 0.8, 'Maskable globe geometry stays inside the minimum safe zone.');

for (const [name, size] of Object.entries(BRAND_PNGS)) {
  const png = await readFile(`dist/icons/${name}`);
  assert.equal(png.readUInt32BE(16), size, `${name} is ${size}px wide.`);
  assert.equal(png.readUInt32BE(20), size, `${name} is ${size}px tall.`);
}

const purposes = manifest.icons.map((entry) => entry.purpose);
assert.ok(!purposes.includes('any maskable'), 'No icon claims both purposes from one padded asset.');
assert.ok(purposes.includes('any') && purposes.includes('maskable'), 'Regular and maskable purposes are both declared.');
for (const entry of manifest.icons) {
  await readFile(`dist/${entry.src.replace('./', '')}`);
}

assert.ok(
  html.includes('<link rel="apple-touch-icon" href="./icons/apple-touch-icon.png" />'),
  'The Apple touch icon is declared in the production shell.',
);
assert.ok(html.includes('./icons/app-icon.svg'), 'The browser favicon points at the regular mark.');
for (const shellIcon of ['app-icon.svg', 'app-icon-192.png', 'app-icon-512.png', 'app-icon-maskable-512.png', 'apple-touch-icon.png']) {
  assert.ok(serviceWorker.includes(`icons/${shellIcon}`), `${shellIcon} is part of the cached offline shell.`);
}

assert.ok(
  !(await readFile('scripts/generate-brand-icons.mjs', 'utf8')).includes('fitExtent'),
  'Brand generation never fits the globe to the visible land.',
);

console.log('Verified the source-derived Atlas globe mark, its regular/maskable split, raster derivatives and PWA wiring.');
