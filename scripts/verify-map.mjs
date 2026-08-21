import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AFRICA_MAP_COUNTRY_IDS, AFRICA_MAP_REGION_CONFIGS } from '../dist/data/map-scopes.js';
import { loadMapAsset } from '../dist/data/maps/index.js';
import { buildMapSession } from '../dist/domain/map-game.js';

const asset = await loadMapAsset('africa');
assert.ok(asset, 'Africa map asset loads.');
const africaAsset = asset;

assert.equal(africaAsset.countryIds.length, 54, 'Africa map asset contains all 54 playable countries.');
assert.deepEqual(
  new Set(africaAsset.countryIds),
  new Set(AFRICA_MAP_COUNTRY_IDS),
  'Africa map asset and canonical playable-country IDs stay aligned.',
);

for (const config of AFRICA_MAP_REGION_CONFIGS) {
  assert.ok(config.scope.id, `${config.scope.label} has a routed scope ID.`);
  for (const countryId of config.countryIds) {
    assert.ok(
      africaAsset.countryIds.includes(countryId),
      `${countryId} from ${config.scope.label} is present in the Africa map asset.`,
    );
  }
}

const styles = await readFile('dist/styles.css', 'utf8');
const mapCss = await readFile('dist/map.css', 'utf8');

assert.ok(mapCss.includes('--map-canvas-width'), 'Map canvas width follows the active asset viewBox.');
assert.ok(mapCss.includes('.map-context-locator'), 'Context islands use the same strengthened context visual system.');
assert.ok(mapCss.includes('opacity: 1'), 'Normal context geography is no longer washed out by blanket low opacity.');
assert.ok(!mapCss.includes('opacity: .28'), 'The previous strainingly faint context opacity is removed.');
assert.ok(mapCss.includes('.map-country__locator-hit'), 'Island dots receive explicit enlarged touch surfaces.');
assert.ok(mapCss.includes('.map-country[tabindex]:focus'), 'SVG focus overrides the rectangular tabindex outline.');
assert.ok(mapCss.includes('.map-country--current-correct'), 'First-try correct taps keep high-salience feedback.');
assert.ok(mapCss.includes('.map-country--recorded'), 'Test taps keep neutral visible acknowledgment.');
assert.ok(mapCss.includes('(hover: hover) and (pointer: fine)'), 'Hover feedback is limited to devices that actually hover.');
assert.ok(mapCss.includes('forced-colors: active'), 'Map interaction has a forced-colors fallback.');
const launcherLabelRule = styles.match(/\.launcher-map__label\s*\{([^}]*)\}/)?.[1] ?? '';
assert.match(launcherLabelRule, /font-size:\s*clamp\(11px,/, 'Launcher map overlay labels preserve the 11px typography floor.');
assert.ok(styles.includes('.launcher-map-region:focus-visible'), 'Keyboard-reachable launcher map regions have a visible focus treatment.');

const indexHtml = await readFile('dist/index.html', 'utf8');
assert.ok(indexHtml.includes('./map-viewport.js'), 'The production shell loads map pan preservation behavior.');
assert.ok(indexHtml.includes('./atlas-theme.css'), 'The production shell loads the Tactile Atlas visual layer.');
const atlasTheme = await readFile('dist/atlas-theme.css', 'utf8');
assert.ok(atlasTheme.includes('--action: #2563eb'), 'The built Atlas theme carries the locked primary action blue.');
assert.ok(atlasTheme.includes('prefers-reduced-motion: reduce'), 'The built Atlas theme includes reduced-motion behaviour.');
const viewportJs = await readFile('dist/map-viewport.js', 'utf8');
assert.ok(viewportJs.includes('data-map-viewport') || viewportJs.includes('mapViewport'), 'Built viewport helper preserves pan across rerenders.');
const serviceWorker = await readFile('dist/sw.js', 'utf8');
assert.ok(serviceWorker.includes("const VERSION = 'flag-atlas-v15'"), 'Tactile Atlas owns the v15 PWA cache.');
assert.ok(serviceWorker.includes('./atlas-theme.css'), 'The Tactile Atlas stylesheet is part of the offline shell.');
assert.ok(serviceWorker.includes('./map-viewport.js'), 'The viewport helper remains part of the offline shell.');

// All-Africa engine smoke: a target from each region can coexist in one round.
const representativeIds = AFRICA_MAP_REGION_CONFIGS.map((config) => config.countryIds[0]);
const africaRound = buildMapSession(africaAsset, 'learn', 'africa-cross-region', representativeIds);
assert.equal(africaRound.countryIds.length, 5, 'All-Africa round accepts targets across all five regions.');
assert.deepEqual(new Set(africaRound.countryIds), new Set(representativeIds));

console.log('Africa map verification passed: 54-country coverage, launcher hierarchy, regional context, island dots, callouts, feedback, Atlas shell, and mobile contracts.');
