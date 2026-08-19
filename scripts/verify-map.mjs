import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COUNTRIES } from '../dist/data/countries.js';
import { WEST_AFRICA_MAP_COUNTRY_IDS } from '../dist/data/map-scopes.js';
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

const asset = await loadMapAsset('west-africa');
assert.ok(asset, 'West Africa pilot asset must load.');
assert.equal(asset.scope.id, 'west-africa');
assert.equal(asset.countries.length, 16, 'West Africa map must cover all 16 curriculum countries.');
assert.equal(new Set(asset.countries.map((item) => item.countryId)).size, 16, 'Map country IDs must be unique.');
assert.deepEqual(
  new Set(asset.countries.map((item) => item.countryId)),
  new Set(WEST_AFRICA_MAP_COUNTRY_IDS),
  'Map geometry must exactly cover the pilot curriculum.',
);
assert.ok((asset.contextPaths?.length ?? 0) > 20, 'A region round keeps the rest of Africa as non-interactive geographic context.');
assert.ok(asset.initialFocus, 'Region assets define an initial gameplay viewport within the continent canvas.');

for (const geometry of asset.countries) {
  const catalogCountry = country(geometry.countryId);
  assert.ok(catalogCountry, `${geometry.countryId} must exist in the canonical catalog.`);
  assert.equal(catalogCountry.regionId, 'west-africa', `${geometry.countryId} must belong to West Africa.`);
  assert.ok(geometry.path || geometry.locator, `${geometry.countryId} needs a polygon or explicit locator.`);
}
assert.ok(asset.countries.find((item) => item.countryId === 'CPV')?.locator, 'Cabo Verde keeps an explicit island locator.');
for (const id of ['GMB', 'TGO', 'CPV']) {
  const geometry = asset.countries.find((item) => item.countryId === id);
  assert.ok(geometry?.callout, `${id} has a visible off-country touch callout.`);
  assert.equal(geometry?.hitAssist, undefined, `${id} uses the visible callout instead of an invisible oversized assist.`);
  assert.ok((geometry?.callout?.target.r ?? 0) >= 10, `${id} callout target is visibly substantial.`);
}

let progress = createInitialLocationProgress(WEST_AFRICA_MAP_COUNTRY_IDS);
let learn = buildMapSession(asset, 'learn', 'learn-three-strikes', ['GHA']);
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
const revealedHtml = renderMapQuiz(asset, learn, 'MLI');
assert.ok(revealedHtml.includes('Revealed after 3 misses'), 'Reveal feedback explicitly tells the learner what happened.');

const oneMissSession = buildMapSession(asset, 'learn', 'one-miss-feedback', ['GHA']);
const oneMiss = applyMapGuess(oneMissSession, createInitialLocationProgress(WEST_AFRICA_MAP_COUNTRY_IDS), 'MLI', 600);
const oneMissHtml = renderMapQuiz(asset, oneMiss.session, 'MLI');
assert.ok(oneMissHtml.includes('Not Mali.'), 'A wrong map tap names the selected country instead of only showing a countdown.');
assert.ok(oneMissHtml.includes('map-prompt__status--wrong'), 'Wrong feedback has a text-visible semantic state.');
assert.ok(oneMissHtml.includes('map-country--wrong-pulse'), 'Wrong Learn taps receive a visible transient map state.');

// Correct after one miss must go straight to amber, never flash green first.
let correctedAfterMiss = oneMiss.session;
const corrected = applyMapGuess(correctedAfterMiss, oneMiss.progress, 'GHA', 700);
correctedAfterMiss = corrected.session;
const correctedHtml = renderMapQuiz(asset, correctedAfterMiss, null);
assert.ok(correctedHtml.includes('map-country--one-miss'), 'Correct after one miss receives the amber stored score immediately.');
assert.ok(!correctedHtml.includes('map-country--current-correct'), 'Green success flash is reserved for first-try correctness only.');

progress = createInitialLocationProgress(WEST_AFRICA_MAP_COUNTRY_IDS);
for (let round = 1; round <= 3; round += 1) {
  let session = buildMapSession(asset, 'learn', `mastery-${round}`, ['GHA']);
  const result = applyMapGuess(session, progress, 'GHA', 800, new Date(`2026-02-0${round}T12:00:00Z`));
  session = result.session;
  progress = result.progress;
  assert.equal(session.targets.GHA.resolution, 'first-try');
}
assert.equal(getLocationRecord(progress, 'GHA').status, 'mastered', 'Three first-try rounds master a map location.');

const lapseSession = buildMapSession(asset, 'learn', 'lapse', ['GHA']);
const lapsed = applyMapGuess(lapseSession, progress, 'MLI', 950, new Date('2026-02-04T12:00:00Z'));
assert.equal(getLocationRecord(lapsed.progress, 'GHA').status, 'learning', 'A mastered map miss lapses the location.');
assert.equal(locationMasteryGoal(getLocationRecord(lapsed.progress, 'GHA')), 2, 'A lapsed location uses two-success recovery.');

const testSession = buildMapSession(asset, 'test', 'test-wrong', ['GHA']);
const testWrong = applyMapGuess(testSession, createInitialLocationProgress(WEST_AFRICA_MAP_COUNTRY_IDS), 'MLI', 700);
assert.equal(testWrong.outcome.resolved, true, 'Test mode accepts exactly one tap per target.');
assert.equal(testWrong.session.targets.GHA.resolution, 'incorrect', 'Test wrong answers are retained for result feedback.');
assert.equal(testWrong.outcome.revealed, false, 'Test mode does not reveal correctness during the round.');
const testHtml = renderMapQuiz(asset, testWrong.session, 'MLI');
assert.ok(!testHtml.includes('map-country--wrong-pulse'), 'Test mode must not leak correctness through red wrong-answer styling.');
assert.ok(testHtml.includes('map-country--recorded'), 'Test mode visibly acknowledges the selected country with a neutral recorded state.');
assert.ok(testHtml.includes('Answer recorded'), 'Test confirms input without revealing whether the answer was right.');

const fullSession = buildMapSession(asset, 'learn', 'render-round');
const quizHtml = renderMapQuiz(asset, fullSession, null);
const renderedMapIds = [...quizHtml.matchAll(/data-action="map-answer" data-id="([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(new Set(renderedMapIds), new Set(WEST_AFRICA_MAP_COUNTRY_IDS), 'Every unresolved pilot country is directly interactive.');
assert.equal((quizHtml.match(/data-autofocus/g) ?? []).length, 1, 'Map quiz has one focus landing point.');
assert.ok(quizHtml.indexOf('map-prompt') < quizHtml.indexOf('map-stage'), 'The active target stays above the geography while scanning.');
assert.ok(quizHtml.includes('map-context-country'), 'Out-of-region Africa remains visible as faded context.');
assert.ok(quizHtml.includes('data-map-viewport'), 'Map gameplay exposes a dedicated pannable viewport.');
assert.ok(quizHtml.includes('data-map-focus='), 'The viewport carries the preferred starting region for mobile centering.');
assert.ok(quizHtml.includes('swipe or drag to pan Africa'), 'The first prompt teaches the continent-pan gesture once.');
assert.ok(quizHtml.includes('map-country__callout-line'), 'Tiny-country leader-line callouts are rendered.');
assert.ok(quizHtml.includes('map-country__callout-hit'), 'Tiny-country callouts expose a larger explicit touch area.');

// Non-callout narrow states still use clipped neutral-space assistance.
const narrowSession = buildMapSession(asset, 'learn', 'narrow-target', ['BEN']);
const narrowHtml = renderMapQuiz(asset, narrowSession, null);
assert.ok(narrowHtml.includes('r="22"'), 'Remaining narrow target assistance aims at roughly a 44px effective diameter.');
assert.ok(narrowHtml.includes('clip-path="url(#map-target-hit-clip)"'), 'Expanded target assistance is clipped so neighbouring countries remain real wrong answers.');
assert.ok(narrowHtml.includes('fill-rule="evenodd"'), 'The assist clip explicitly subtracts surrounding geography.');

let currentCorrectSession = buildMapSession(asset, 'learn', 'current-correct', ['GHA']);
let currentCorrectProgress = createInitialLocationProgress(WEST_AFRICA_MAP_COUNTRY_IDS);
const currentCorrect = applyMapGuess(currentCorrectSession, currentCorrectProgress, 'GHA', 500);
currentCorrectSession = currentCorrect.session;
const currentCorrectHtml = renderMapQuiz(asset, currentCorrectSession, null);
assert.ok(currentCorrectHtml.includes('map-country--first map-country--current-correct'), 'A first-try Learn tap receives the strong green success state.');

// Once a target has been resolved and the round advances, it is no longer a tap target.
let twoTarget = buildMapSession(asset, 'learn', 'advance-lock', ['GHA', 'MLI']);
let twoTargetProgress = createInitialLocationProgress(WEST_AFRICA_MAP_COUNTRY_IDS);
const resolvedId = twoTarget.countryIds[0];
const firstAnswer = applyMapGuess(twoTarget, twoTargetProgress, resolvedId, 500);
twoTarget = advanceMapSession(firstAnswer.session);
twoTargetProgress = firstAnswer.progress;
const afterAdvanceHtml = renderMapQuiz(asset, twoTarget, null);
const interactiveAfterAdvance = [...afterAdvanceHtml.matchAll(/data-action="map-answer" data-id="([^"]+)"/g)].map((match) => match[1]);
assert.ok(!interactiveAfterAdvance.includes(resolvedId), 'Already resolved countries are no longer clickable later in the round.');

let resultSession = buildMapSession(asset, 'learn', 'result-round', ['GHA']);
let resultProgress = createInitialLocationProgress(WEST_AFRICA_MAP_COUNTRY_IDS);
const answered = applyMapGuess(resultSession, resultProgress, 'GHA', 600);
resultSession = answered.session;
resultProgress = answered.progress;
assert.ok(resultProgress.records.GHA, 'Map progress is updated independently.');
const result = finishMapSession(resultSession);
const resultHtml = renderMapResults(asset, result);
assert.ok(resultHtml.includes('1 of 1 first try'), 'Map results report first-try accuracy.');
assert.ok(resultHtml.includes('map-country--first'), 'Completed map retains resolution color evidence.');
assert.ok(!resultHtml.includes('map-country--current-correct'), 'Results do not retain transient in-round success styling.');
assert.ok(resultHtml.includes('map-result-breakdown'), 'Results expose performance structure instead of only a percentage.');
assert.ok(!resultHtml.includes('map-result-percent'), 'Generic percentage emphasis is removed from map results.');

const mapHomeHtml = renderMapHome(createInitialLocationProgress(WEST_AFRICA_MAP_COUNTRY_IDS));
assert.ok(mapHomeHtml.includes('study-action--primary'), 'Map home uses the same Learn/Test hierarchy as flag scopes.');
assert.ok(mapHomeHtml.includes('status-strip'), 'Map mastery uses the shared progress visual language.');
assert.ok(!mapHomeHtml.includes('map-progress-card'), 'Map home no longer introduces a separate rounded progress card system.');

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

const mapCss = await readFile('map.css', 'utf8');
assert.ok(!/#[0-9a-f]{3,8}\b/i.test(mapCss), 'Map CSS uses the shared token system instead of literal color drift.');
assert.ok(!mapCss.includes('backdrop-filter'), 'Map mode does not reintroduce glass/blur chrome.');
assert.ok(mapCss.includes('overflow: auto'), 'The continent map is natively pannable on small screens.');
assert.ok(mapCss.includes('touch-action: pan-x pan-y pinch-zoom'), 'Touch gestures prioritize two-axis map panning and platform zoom.');
assert.ok(mapCss.includes('.map-country[tabindex]:focus'), 'SVG country focus overrides the global rectangular tabindex outline.');
assert.ok(mapCss.includes('.map-country--current-correct'), 'First-try correct taps have a dedicated high-salience state.');
assert.ok(mapCss.includes('.map-country--recorded'), 'Test taps have a neutral visible acknowledgment state.');
assert.ok(mapCss.includes('.map-country__callout-target'), 'Small-country callout targets participate in the same visual state system.');
assert.ok(mapCss.includes('shape-rendering: geometricPrecision'), 'Map rendering asks the browser for precise vector geometry.');
assert.ok(mapCss.includes('stroke-linejoin: round'), 'Border rendering avoids sharp coarse-geometry seam spikes.');
assert.ok(mapCss.includes('(hover: hover) and (pointer: fine)'), 'Hover feedback is limited to devices that actually hover.');
assert.ok(mapCss.includes('forced-colors: active'), 'Map interaction has a forced-colors fallback.');

const indexHtml = await readFile('dist/index.html', 'utf8');
assert.ok(indexHtml.includes('./map-viewport.js'), 'The production shell loads map pan preservation behavior.');
const viewportJs = await readFile('dist/map-viewport.js', 'utf8');
assert.ok(viewportJs.includes('data-map-viewport') || viewportJs.includes('mapViewport'), 'Built viewport helper preserves pan across map rerenders.');
const serviceWorker = await readFile('dist/sw.js', 'utf8');
assert.ok(serviceWorker.includes("flag-atlas-v6"), 'Feedback release bumps the PWA cache so stale map CSS is replaced.');
assert.ok(serviceWorker.includes('./map-viewport.js'), 'The viewport helper is part of the offline app shell.');

console.log('Map pilot verification passed, including feedback, callout, naming, and mobile gameplay contracts.');
