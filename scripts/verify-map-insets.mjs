// Issue 113 — the reusable cluster-inset pattern.
//
// A cluster inset is a screen-space panel: fixed CSS pixel size, scale
// deliberately independent of the map's zoom, shown only while the current
// question's country is inside it. These assertions guard the pattern itself,
// so the mechanism is proven before wider continent rollout.

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildInsets } from './map-generation-core.mjs';
import { ASIA_GEOMETRY, ASIA_INSETS } from '../.verify-dist/data/maps/asia.js';
import { loadMapAsset } from '../.verify-dist/data/maps/index.js';
import { buildMapSession } from '../.verify-dist/domain/map-game.js';
import { renderMapSvg } from '../.verify-dist/ui/components/map.js';

const CATALOG = [
  { id: 'AAA', name: 'Alphaland', region: 'test-region' },
  { id: 'BBB', name: 'Betaland', region: 'test-region' },
  { id: 'CCC', name: 'Gammaland', region: 'test-region' },
];

// Two tiny neighbours a few canvas units apart, plus a large mainland body.
const GEOMETRY = {
  AAA: { countryId: 'AAA', path: 'M500,360L502,360L502,362L500,362Z' },
  BBB: { countryId: 'BBB', path: 'M500,366L502,366L502,368L500,368Z' },
  CCC: { countryId: 'CCC', path: 'M440,200L560,200L560,320L440,320Z' },
};

const config = {
  displayName: 'Testland',
  insets: [{ id: 'test-sea', label: 'Test Sea', countryIds: ['AAA', 'BBB'], anchor: 'bottom-right' }],
};

/* --- Derivation: the panel is sized by the touch contract, not by taste --- */

const [inset] = buildInsets(config, GEOMETRY, CATALOG);
assert.equal(inset.id, 'test-sea');
assert.deepEqual(inset.countryIds, ['AAA', 'BBB']);
assert.deepEqual(inset.marks.map((mark) => mark.countryId), ['AAA', 'BBB']);

for (const mark of inset.marks) {
  const bounds = GEOMETRY[mark.countryId].path.matchAll(/(-?[\d.]+),(-?[\d.]+)/g);
  const points = [...bounds].map(([, x, y]) => [Number(x), Number(y)]);
  const insideX = mark.cx >= Math.min(...points.map((p) => p[0])) && mark.cx <= Math.max(...points.map((p) => p[0]));
  const insideY = mark.cy >= Math.min(...points.map((p) => p[1])) && mark.cy <= Math.max(...points.map((p) => p[1]));
  assert.ok(insideX && insideY, `${mark.countryId}'s tap anchor sits inside its own geometry, not in the sea.`);
}

const pxPerUnit = inset.size.width / inset.source.width;
assert.ok(
  Math.abs(inset.hitRadius * pxPerUnit - 22) < 0.05,
  `The hit radius is exactly 22 CSS px at the panel's fixed scale (got ${(inset.hitRadius * pxPerUnit).toFixed(2)}).`,
);
// Two 44 px surfaces must not overlap, or the panel recreates the very
// tap-stealing that made a leader line unusable here.
for (let i = 0; i < inset.marks.length; i += 1) {
  for (let j = i + 1; j < inset.marks.length; j += 1) {
    const apart = Math.hypot(inset.marks[i].cx - inset.marks[j].cx, inset.marks[i].cy - inset.marks[j].cy) * pxPerUnit;
    assert.ok(apart >= 43.99, `${inset.marks[i].countryId} and ${inset.marks[j].countryId} are ${apart.toFixed(1)} px apart, so their touch surfaces do not overlap.`);
  }
}
assert.ok(inset.size.width <= 260 && inset.size.height <= 260, 'The panel stays small enough to be an answer surface, not the screen.');

/* --- Refusals: an inset must never cost more than it buys --- */

assert.throws(
  () => buildInsets({ ...config, insets: [{ ...config.insets[0], label: 'Alphaland' }] }, GEOMETRY, CATALOG),
  /would hand the learner the answer/,
  'A country-named label is refused, because the map never names a selectable country.',
);

assert.throws(
  () => buildInsets({ ...config, insets: [{ ...config.insets[0], countryIds: ['AAA'] }] }, GEOMETRY, CATALOG),
  /needs at least two members/,
  'A lone small country is a locator or leader-line case, not a panel.',
);

assert.throws(
  () => buildInsets({ ...config, insets: [{ ...config.insets[0], countryIds: ['AAA', 'ZZZ'] }] }, GEOMETRY, CATALOG),
  /unknown country ZZZ/,
  'An inset cannot name geography the continent does not have.',
);

assert.throws(
  () => buildInsets({ ...config, insets: [{ ...config.insets[0], anchor: 'middle' }] }, GEOMETRY, CATALOG),
  /unsupported anchor/,
  'A panel cannot silently ship with an unpositioned CSS anchor.',
);

assert.throws(
  () => buildInsets({ ...config, insets: [{ ...config.insets[0], countryIds: ['AAA', 'AAA'] }] }, GEOMETRY, CATALOG),
  /repeats a country/,
  'A panel cannot expose duplicate answer surfaces for one country.',
);

assert.throws(
  () => buildInsets({
    ...config,
    insets: [config.insets[0], { ...config.insets[0], id: 'second-sea', countryIds: ['AAA', 'CCC'] }],
  }, GEOMETRY, CATALOG),
  /belongs to more than one panel/,
  'A country belongs to only one active inset.',
);

// A cluster spread too wide to magnify truthfully is refused rather than shipped
// at an unreadable scale. The Gulf is the real instance: Bahrain and Qatar sit
// under four canvas units apart while the UAE is twenty-seven away, so a true-
// scale panel giving Bahrain 44 px would be wider than the phone.
assert.throws(
  () => buildInsets(
    {
      displayName: 'Asia',
      insets: [{ id: 'gulf', label: 'Persian Gulf', countryIds: ['BHR', 'QAT', 'KWT', 'ARE'], anchor: 'bottom-left' }],
    },
    ASIA_GEOMETRY,
    CATALOG,
  ),
  /does not fit a phone stage/,
  'A cluster needing an oversized panel is refused, pointing at a schematic instead.',
);

/* --- Asia no longer ships the question-triggered Levant prototype --- */

assert.equal(ASIA_INSETS.length, 0, 'Asia ships no question-triggered inset after #137.');
const asset = await loadMapAsset('middle-east');
assert.ok(asset, 'The Middle East scope loads.');
assert.equal(asset.insets?.length ?? 0, 0, 'The Middle East keeps Lebanon, Israel and Palestine in canonical geography without popup chrome.');
const southAsia = await loadMapAsset('south-asia');
assert.equal(southAsia.insets?.length ?? 0, 0, 'South Asia remains inset-free.');
const near = buildMapSession(asset, 'learn', 'inset-near', ['PSE']);
const nearHtml = renderMapSvg(asset, near);
assert.ok(!nearHtml.includes('data-map-inset'), 'Palestine no longer triggers a question-specific inset.');
assert.ok(!nearHtml.includes('map-inset-source'), 'No Levant source-window outline is rendered.');
for (const id of ['LBN', 'ISR', 'PSE']) {
  assert.ok(nearHtml.includes(`data-id="${id}"`), `${id} remains represented at its canonical map location.`);
}

/* --- Presentation is generated, and the frame is a shape not a colour --- */

const cartographyCss = await readFile('src/styles/map-cartography.css', 'utf8');
assert.ok(/\.map-inset\s*\{[^}]*position: absolute/.test(cartographyCss), 'The panel is positioned over the stage, not inside the canvas.');
assert.ok(/\.map-inset\s*\{[^}]*border:/.test(cartographyCss), 'The panel boundary is drawn as an edge, not a colour fill.');
assert.ok(
  /forced-colors: active[\s\S]*\.map-inset\b/.test(cartographyCss),
  'The panel survives forced-colours mode, so its boundary never depends on colour alone.',
);
assert.ok(/\.map-inset__context[\s\S]{0,80}pointer-events: none/.test(cartographyCss), 'Only the panel members answer inside the panel.');

const configSource = await readFile('scripts/map-continent-configs.mjs', 'utf8');
assert.ok(
  !/insets:[\s\S]{0,600}?(source|marks|hitRadius):/.test(configSource),
  'Windows, anchors and sizes stay derived from generated geometry rather than hand-authored.',
);

console.log('Map inset verification passed: generic inset geometry remains guarded while Asia ships no question-triggered Levant inset.');
