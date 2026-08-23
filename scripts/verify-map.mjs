import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COUNTRIES } from '../dist/data/countries.js';
import {
  AFRICA_MAP_COUNTRY_IDS,
  AFRICA_MAP_REGION_CONFIGS,
  AFRICA_MAP_SCOPE,
  AFRICA_MAP_SCOPE_CONFIGS,
  WEST_AFRICA_MAP_COUNTRY_IDS,
} from '../dist/data/map-scopes.js';
import { loadMapAsset } from '../dist/data/maps/index.js';
import {
  advanceMapSession,
  applyMapGuess,
  buildMapSession,
  createInitialLocationProgress,
  finishMapSession,
  getLocationRecord,
  locationMasteryGoal,
} from '../dist/domain/map-game.js';
import { sanitizeLocationRecord } from '../dist/infrastructure/map-storage.js';
import { renderMapHome } from '../dist/ui/views/map-home.js';
import { renderMapQuiz } from '../dist/ui/views/map-quiz.js';
import { renderMapResults } from '../dist/ui/views/map-results.js';

const country = (id) => COUNTRIES.find((item) => item.id === id);
const africaCatalogIds = COUNTRIES.filter((item) => item.continentId === 'africa').map((item) => item.id);

// Naming guardrails for rename-sensitive / article-sensitive countries.
assert.equal(country('GMB')?.name, 'The Gambia', 'English UI uses the natural short name The Gambia.');
assert.ok(country('GMB')?.aliases?.includes('Gambia'), 'Gambia remains a searchable/accepted alias.');
assert.equal(country('CPV')?.name, 'Cabo Verde');
assert.equal(country('SWZ')?.name, 'Eswatini');
assert.equal(country('MKD')?.name, 'North Macedonia');
assert.equal(country('TUR')?.name, 'Türkiye');
assert.equal(country('TLS')?.name, 'Timor-Leste');
assert.equal(country('CZE')?.name, 'Czechia');
assert.match(country('CIV')?.name ?? '', /^Côte d['’]Ivoire$/);

// Africa scope data must exactly match the canonical 54-country catalog.
assert.equal(AFRICA_MAP_COUNTRY_IDS.length, 54, 'Africa location curriculum contains 54 countries.');
assert.equal(new Set(AFRICA_MAP_COUNTRY_IDS).size, 54, 'Africa location curriculum has no duplicate IDs.');
assert.deepEqual(new Set(AFRICA_MAP_COUNTRY_IDS), new Set(africaCatalogIds), 'Africa map IDs exactly match the canonical Africa catalog.');
assert.equal(AFRICA_MAP_REGION_CONFIGS.length, 5, 'Africa map exposes the five existing learning regions.');
assert.equal(
  AFRICA_MAP_REGION_CONFIGS.reduce((sum, config) => sum + config.countryIds.length, 0),
  54,
  'The five Africa regions partition all 54 countries.',
);

const assets = new Map();
for (const config of AFRICA_MAP_SCOPE_CONFIGS) {
  const scopeId = config.scope.id;
  assert.ok(scopeId);
  const asset = await loadMapAsset(scopeId);
  assert.ok(asset, `${config.scope.label} map asset must load.`);
  assets.set(scopeId, asset);

  const activeIds = asset.countries.map((item) => item.countryId);
  const contextIds = (asset.contextCountries ?? []).map((item) => item.countryId);
  assert.deepEqual(new Set(activeIds), new Set(config.countryIds), `${config.scope.label} active geometry matches its curriculum.`);
  assert.equal(new Set(activeIds).size, activeIds.length, `${config.scope.label} active IDs are unique.`);
  assert.equal(new Set(contextIds).size, contextIds.length, `${config.scope.label} context IDs are unique.`);
  assert.ok(asset.initialFocus, `${config.scope.label} defines an opening viewport.`);
  assert.equal(asset.viewBox, '0 0 835 723', `${config.scope.label} uses the shared Africa canvas.`);

  if (config.scope.kind === 'region') {
    assert.equal(contextIds.length, 54 - activeIds.length, `${config.scope.label} keeps every other African country as context.`);
    assert.deepEqual(new Set([...activeIds, ...contextIds]), new Set(AFRICA_MAP_COUNTRY_IDS), `${config.scope.label} active + context geometry covers Africa exactly once.`);
    assert.ok((asset.contextPaths?.length ?? 0) >= 1, `${config.scope.label} retains extra non-scoring geography such as Western Sahara.`);
  } else {
    assert.equal(contextIds.length, 0, 'All-Africa scope makes all 54 countries active.');
  }

  for (const geometry of [...asset.countries, ...(asset.contextCountries ?? [])]) {
    assert.ok(country(geometry.countryId), `${geometry.countryId} exists in the canonical country catalog.`);
    assert.ok(geometry.path || geometry.locator, `${geometry.countryId} has a polygon or island locator.`);
  }
}

const africaAsset = assets.get('africa');
const westAsset = assets.get('west-africa');
assert.ok(africaAsset && westAsset);
assert.equal(westAsset.countries.length, WEST_AFRICA_MAP_COUNTRY_IDS.length, 'West Africa remains a 16-country scope.');

// Mainland callouts are exceptional and limited to the two user-approved West Africa cases.
const africaCallouts = africaAsset.countries.filter((item) => item.callout).map((item) => item.countryId).sort();
assert.deepEqual(africaCallouts, ['GMB', 'TGO'], 'Only The Gambia and Togo use mainland leader-line callouts.');
for (const id of ['CPV', 'GNB', 'SLE', 'BEN']) {
  assert.equal(africaAsset.countries.find((item) => item.countryId === id)?.callout, undefined, `${id} does not receive an unnecessary leader-line callout.`);
}

// Island nations use one visible locator dot plus an invisible touch surface, never a leader line.
for (const id of ['CPV', 'STP', 'COM', 'MUS', 'SYC']) {
  const geometry = africaAsset.countries.find((item) => item.countryId === id);
  assert.ok(geometry?.locator, `${id} has a single island locator dot.`);
  assert.equal(geometry?.path, undefined, `${id} does not fake an oversized island polygon in the MVP geometry.`);
  assert.equal(geometry?.callout, undefined, `${id} island target does not duplicate the dot with a leader line.`);
}
const cpvSession = buildMapSession(westAsset, 'learn', 'island-dot-target', ['CPV']);
const cpvHtml = renderMapQuiz(westAsset, cpvSession, null);
const cpvGroup = cpvHtml.match(/<g class="map-country[^"]*"[^>]*data-id="CPV"[\s\S]*?<\/g>/)?.[0] ?? '';
assert.ok(cpvGroup.includes('map-country__locator'), 'Cabo Verde locator is visibly rendered in its own country group.');
assert.ok(cpvGroup.includes('map-country__locator-hit'), 'Cabo Verde locator receives an enlarged invisible touch area.');
assert.ok(!cpvGroup.includes('map-country__callout-line'), 'Cabo Verde itself does not render a redundant callout line.');

let progress = createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS);
let learn = buildMapSession(westAsset, 'learn', 'learn-three-strikes', ['GHA']);
for (let miss = 1; miss <= 3; miss += 1) {
  const result = applyMapGuess(learn, progress, 'MLI', 1000 + miss, new Date(`2026-01-0${miss}T12:00:00Z`));
  learn = result.session;
  progress = result.progress;
  assert.equal(result.outcome.misses, miss);
  assert.equal(result.outcome.resolved, miss === 3, 'Learn mode resolves only on the third wrong guess.');
}
assert.equal(learn.targets.GHA.resolution, 'revealed', 'Third miss reveals the target red.');
assert.equal(getLocationRecord(progress, 'GHA').revealCount, 1, 'Guided reveal is persisted separately.');
assert.equal(getLocationRecord(progress, 'GHA').confusionCounts.MLI, 3, 'Repeated wrong selections feed location confusions.');
const revealedHtml = renderMapQuiz(westAsset, learn, 'MLI');
assert.ok(revealedHtml.includes('Revealed after 3 misses'), 'Reveal feedback explicitly tells the learner what happened.');

const oneMissSession = buildMapSession(westAsset, 'learn', 'one-miss-feedback', ['GHA']);
const oneMiss = applyMapGuess(oneMissSession, createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS), 'MLI', 600);
const oneMissHtml = renderMapQuiz(westAsset, oneMiss.session, 'MLI');
assert.ok(oneMissHtml.includes('Not Mali.'), 'A wrong map tap names the selected country instead of only showing a countdown.');
assert.ok(oneMissHtml.includes('map-prompt__status--wrong'), 'Wrong feedback has a text-visible semantic state.');
assert.ok(oneMissHtml.includes('map-country--wrong-pulse'), 'Wrong Learn taps receive a visible transient map state.');

// Correct after one miss must go straight to amber, never flash green first.
const corrected = applyMapGuess(oneMiss.session, oneMiss.progress, 'GHA', 700);
const correctedHtml = renderMapQuiz(westAsset, corrected.session, null);
assert.ok(correctedHtml.includes('map-country--one-miss'), 'Correct after one miss receives amber immediately.');
assert.ok(!correctedHtml.includes('map-country--current-correct'), 'Green success flash is reserved for first-try correctness only.');

progress = createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS);
for (let round = 1; round <= 3; round += 1) {
  const session = buildMapSession(westAsset, 'learn', `mastery-${round}`, ['GHA']);
  const result = applyMapGuess(session, progress, 'GHA', 800, new Date(`2026-02-0${round}T12:00:00Z`));
  progress = result.progress;
  assert.equal(result.session.targets.GHA.resolution, 'first-try');
}
assert.equal(getLocationRecord(progress, 'GHA').status, 'mastered', 'Three first-try rounds master a map location.');

const lapseSession = buildMapSession(westAsset, 'learn', 'lapse', ['GHA']);
const lapsed = applyMapGuess(lapseSession, progress, 'MLI', 950, new Date('2026-02-04T12:00:00Z'));
assert.equal(getLocationRecord(lapsed.progress, 'GHA').status, 'learning', 'A mastered map miss lapses the location.');
assert.equal(locationMasteryGoal(getLocationRecord(lapsed.progress, 'GHA')), 2, 'A lapsed location uses two-success recovery.');

const testSession = buildMapSession(westAsset, 'test', 'test-wrong', ['GHA']);
const testWrong = applyMapGuess(testSession, createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS), 'MLI', 700);
assert.equal(testWrong.outcome.resolved, true, 'Test mode accepts exactly one tap per target.');
assert.equal(testWrong.session.targets.GHA.resolution, 'incorrect', 'Test wrong answers are retained for result feedback.');
assert.equal(testWrong.outcome.revealed, false, 'Test mode does not reveal correctness during the round.');
const testHtml = renderMapQuiz(westAsset, testWrong.session, 'MLI');
assert.ok(!testHtml.includes('map-country--wrong-pulse'), 'Test mode does not leak correctness through red styling.');
assert.ok(testHtml.includes('map-country--recorded'), 'Test visibly acknowledges the selected country with a neutral state.');
assert.ok(testHtml.includes('Answer recorded'), 'Test confirms input without revealing correctness.');

const fullWestSession = buildMapSession(westAsset, 'learn', 'render-west-round');
const westQuizHtml = renderMapQuiz(westAsset, fullWestSession, null);
const renderedWestIds = [...westQuizHtml.matchAll(/data-action="map-answer" data-id="([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(new Set(renderedWestIds), new Set(WEST_AFRICA_MAP_COUNTRY_IDS), 'Every unresolved West Africa country is directly interactive.');
assert.equal((westQuizHtml.match(/data-autofocus/g) ?? []).length, 1, 'Map quiz has one focus landing point.');
assert.ok(westQuizHtml.indexOf('map-prompt') < westQuizHtml.indexOf('map-stage'), 'The active target stays above the geography while scanning.');
assert.ok(westQuizHtml.includes('map-context-country'), 'Out-of-region Africa remains visible as context.');
assert.ok(westQuizHtml.includes('map-context-locator'), 'Out-of-region island dots remain visible as context.');
assert.ok(westQuizHtml.includes('data-map-viewport'), 'Map gameplay exposes a dedicated pannable viewport.');
assert.ok(westQuizHtml.includes('data-map-focus='), 'The viewport carries the preferred starting region.');
assert.ok(westQuizHtml.includes('swipe or drag to pan Africa'), 'The first prompt teaches the continent-pan gesture once.');
assert.ok(westQuizHtml.includes('map-country__callout-line'), 'Approved mainland callouts render leader lines.');
assert.ok(westQuizHtml.includes('--map-canvas-width: 835px'), 'The renderer respects the wider shared Africa canvas including eastern islands.');

let currentCorrectSession = buildMapSession(westAsset, 'learn', 'current-correct', ['GHA']);
const currentCorrect = applyMapGuess(currentCorrectSession, createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS), 'GHA', 500);
currentCorrectSession = currentCorrect.session;
const currentCorrectHtml = renderMapQuiz(westAsset, currentCorrectSession, null);
assert.ok(currentCorrectHtml.includes('map-country--first map-country--current-correct'), 'A first-try Learn tap receives the strong green success state.');

// Once a target has been resolved and the round advances, it is no longer a tap target.
let twoTarget = buildMapSession(westAsset, 'learn', 'advance-lock', ['GHA', 'MLI']);
const resolvedId = twoTarget.countryIds[0];
const firstAnswer = applyMapGuess(twoTarget, createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS), resolvedId, 500);
twoTarget = advanceMapSession(firstAnswer.session);
const afterAdvanceHtml = renderMapQuiz(westAsset, twoTarget, null);
const interactiveAfterAdvance = [...afterAdvanceHtml.matchAll(/data-action="map-answer" data-id="([^"]+)"/g)].map((match) => match[1]);
assert.ok(!interactiveAfterAdvance.includes(resolvedId), 'Already resolved countries are no longer clickable later in the round.');

let resultSession = buildMapSession(westAsset, 'learn', 'result-round', ['GHA']);
const answered = applyMapGuess(resultSession, createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS), 'GHA', 600);
resultSession = answered.session;
const result = finishMapSession(resultSession);
const resultHtml = renderMapResults(westAsset, result);
assert.ok(resultHtml.includes('1 of 1 first try'), 'Map results report first-try accuracy.');
assert.ok(resultHtml.includes('map-country--first'), 'Completed map retains resolution color evidence.');
assert.ok(!resultHtml.includes('map-country--current-correct'), 'Results do not retain transient in-round success styling.');
assert.ok(
  resultHtml.includes('data-action="exit-round"') && resultHtml.includes('Back to Locations'),
  'Results exit to the Locations launcher they actually land on, not a retired region screen.',
);
assert.ok(
  !/Back to (West|East|North|Southern|Central) Africa/.test(resultHtml),
  'Results never promise a region-detail destination that no longer exists.',
);

// The map launcher keeps one stable hierarchy while its geography loads lazily.
const emptyAfricaProgress = createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS);
const africaHomeHtml = renderMapHome(emptyAfricaProgress, AFRICA_MAP_SCOPE);
assert.ok(africaHomeHtml.includes('Play Africa') && africaHomeHtml.includes('Learn Africa'), 'Africa map launcher exposes both round choices.');
assert.ok(africaHomeHtml.includes('id="launcher-regions-heading"'), 'Africa map launcher lists regional drills.');
assert.ok(africaHomeHtml.includes('data-launcher-map-slot'), 'The stable first render reserves the lazy map slot.');
assert.equal(africaHomeHtml.includes('class="launcher-map"'), false, 'The first render does not pretend the lazy map asset is ready.');
for (const config of AFRICA_MAP_REGION_CONFIGS) {
  assert.ok(africaHomeHtml.includes(`data-id="${config.scope.id}"`), `${config.scope.label} is navigable from Africa locations.`);
}
const africaHomeWithMap = renderMapHome(emptyAfricaProgress, AFRICA_MAP_SCOPE, true, africaAsset);
assert.ok(africaHomeWithMap.includes('class="launcher-map"'), 'The resolved Africa asset fills the existing launcher map slot.');
const launcherRegionTags = [...africaHomeWithMap.matchAll(/<g\b[^>]*class="[^"]*\blauncher-map-region\b[^"]*"[^>]*>/g)].map((match) => match[0]);
const launcherLabelTags = [...africaHomeWithMap.matchAll(/<span\b[^>]*class="[^"]*\blauncher-map__label\b[^"]*"[^>]*>[\s\S]*?<\/span>/g)].map((match) => match[0]);
assert.equal(launcherRegionTags.length, AFRICA_MAP_REGION_CONFIGS.length, 'The launcher map exposes one SVG control per Africa region.');
assert.equal(launcherLabelTags.length, AFRICA_MAP_REGION_CONFIGS.length, 'The launcher map exposes one direct HTML overlay label per Africa region.');
for (const config of AFRICA_MAP_REGION_CONFIGS) {
  const regionTag = launcherRegionTags.find((tag) => tag.includes(`data-id="${config.scope.id}"`));
  assert.ok(regionTag, `${config.scope.label} has an SVG launcher-map region control.`);
  assert.ok(regionTag.includes('role="button"'), `${config.scope.label} exposes button semantics on the SVG map.`);
  assert.ok(regionTag.includes('tabindex="0"'), `${config.scope.label} is reachable in the SVG map keyboard order.`);
  assert.ok(regionTag.includes(`aria-label="Select ${config.scope.label}"`), `${config.scope.label} has a direct SVG accessible name.`);
  assert.ok(regionTag.includes('aria-pressed="false"'), `${config.scope.label} starts unselected on the Africa launcher.`);

  const labelTag = launcherLabelTags.find((tag) => tag.includes(`data-id="${config.scope.id}"`));
  assert.ok(labelTag?.includes(`>${config.scope.label}</span>`), `${config.scope.label} is directly labelled by the HTML map overlay.`);
}
assert.equal(africaHomeWithMap.includes('launcher-map-region__label'), false, 'Launcher labels no longer shrink inside the SVG coordinate system.');
const westHomeHtml = renderMapHome(emptyAfricaProgress, westAsset.scope, true, africaAsset);
assert.ok(westHomeHtml.includes('16 countries'), 'West Africa map home remains independently drillable.');
assert.ok(westHomeHtml.includes('Play West Africa') && westHomeHtml.includes('Learn West Africa'), 'Selecting West Africa retargets both launcher actions.');
assert.ok(westHomeHtml.includes('All Africa') && westHomeHtml.includes('Selected'), 'West Africa can be cleared without leaving the launcher.');
assert.ok(westHomeHtml.includes('launcher-map-region--selected'), 'The launcher map mirrors the selected region.');
const selectedWestRegion = [...westHomeHtml.matchAll(/<g\b[^>]*class="[^"]*\blauncher-map-region--selected\b[^"]*"[^>]*>/g)]
  .map((match) => match[0])
  .find((tag) => tag.includes('data-id="west-africa"'));
assert.ok(selectedWestRegion?.includes('aria-pressed="true"'), 'The selected West Africa SVG control exposes its pressed state.');
assert.ok(westHomeHtml.includes('launcher-map__label launcher-map__label--selected'), 'The selected West Africa overlay label mirrors the SVG state.');
for (const deletedSurface of ['mini-ledger', 'stat-legend', 'map-guide', 'map-legend']) {
  assert.equal(westHomeHtml.includes(deletedSurface), false, `The pre-round launcher does not restore deleted ${deletedSurface} UI.`);
}

assert.equal(sanitizeLocationRecord('GHA', null), null, 'Null map progress is rejected.');
const repaired = sanitizeLocationRecord('GHA', {
  status: 'learning',
  masteryStreak: null,
  lifetimeFirstTryCorrect: 'many',
  confusionCounts: { MLI: 2, SEN: 'bad' },
});
assert.equal(repaired.masteryStreak, 0);
assert.equal(repaired.lifetimeFirstTryCorrect, 0);
assert.deepEqual(repaired.confusionCounts, { MLI: 2 });

const mapCss = await readFile('src/styles/map.css', 'utf8');
const mapCartographyCss = await readFile('src/styles/map-cartography.css', 'utf8');
const styles = await readFile('src/styles/styles.css', 'utf8');
assert.ok(!/#[0-9a-f]{3,8}\b/i.test(mapCss), 'Map CSS uses shared tokens instead of literal color drift.');
assert.ok(!mapCss.includes('backdrop-filter'), 'Map mode does not reintroduce glass/blur chrome.');
// The map viewport contract is owned by map-cartography.css, which loads after
// map.css and overrides it. These previously asserted map.css text that never
// applied: the production map is an explicitly clipped viewport driven by the
// pointer controller, not a native scroll canvas (Issue #72, CSS ownership).
assert.ok(mapCartographyCss.includes('overflow: hidden'), 'The production map viewport is explicitly clipped rather than a native scroll canvas.');
assert.ok(mapCartographyCss.includes('width: 100%'), 'Map canvas sizing follows the stable viewport while JavaScript drives the viewBox.');
assert.ok(mapCss.includes('.map-context-locator'), 'Context islands use the same strengthened context visual system.');
assert.ok(mapCss.includes('opacity: 1'), 'Normal context geography is no longer washed out by blanket low opacity.');
assert.ok(!mapCss.includes('opacity: .28'), 'The previous strainingly faint context opacity is removed.');
assert.ok(mapCss.includes('.map-country__locator-hit'), 'Island dots receive explicit enlarged touch surfaces.');
assert.ok(mapCss.includes('.map-country[tabindex]:focus'), 'SVG focus overrides the rectangular tabindex outline.');
assert.ok(mapCss.includes('.map-country--current-correct'), 'First-try correct taps keep high-salience feedback.');
assert.ok(mapCss.includes('.map-country--recorded'), 'Test taps keep neutral visible acknowledgment.');
assert.ok(mapCss.includes('(hover: hover) and (pointer: fine)'), 'Hover feedback is limited to devices that actually hover.');
assert.ok(mapCss.includes('forced-colors: active'), 'Map interaction has a forced-colors fallback.');
assert.ok(mapCartographyCss.includes('touch-action: none'), 'The custom map controller owns pan and pinch gestures.');
assert.equal(westQuizHtml.includes('map-viewport-control'), false, 'Location maps stay visually immersive without zoom toolbar chrome.');
assert.ok(styles.includes('env(safe-area-inset-left)'), 'Shared layouts avoid the left safe area in landscape.');
assert.ok(styles.includes('env(safe-area-inset-right)'), 'Shared layouts avoid the right safe area in landscape.');
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
assert.ok(serviceWorker.includes("const VERSION = 'flag-atlas-v27'"), 'Issue #77 shell changes own the v27 PWA cache.');
assert.ok(serviceWorker.includes('./atlas-theme.css'), 'The Tactile Atlas stylesheet is part of the offline shell.');
assert.ok(serviceWorker.includes('./map-viewport.js'), 'The viewport helper remains part of the offline shell.');

// All-Africa engine smoke: a target from each region can coexist in one round.
const representativeIds = AFRICA_MAP_REGION_CONFIGS.map((config) => config.countryIds[0]);
const africaRound = buildMapSession(africaAsset, 'learn', 'africa-cross-region', representativeIds);
assert.equal(africaRound.countryIds.length, 5, 'All-Africa round accepts targets across all five regions.');
assert.deepEqual(new Set(africaRound.countryIds), new Set(representativeIds));

console.log('Africa map verification passed: 54-country coverage, launcher hierarchy, regional context, island dots, callouts, feedback, Atlas shell, and mobile contracts.');
