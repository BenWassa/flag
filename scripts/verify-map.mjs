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
  const country = COUNTRIES.find((item) => item.id === geometry.countryId);
  assert.ok(country, `${geometry.countryId} must exist in the canonical catalog.`);
  assert.equal(country.regionId, 'west-africa', `${geometry.countryId} must belong to West Africa.`);
  assert.ok(geometry.path || geometry.locator, `${geometry.countryId} needs a polygon or explicit locator.`);
}
assert.ok(asset.countries.find((item) => item.countryId === 'CPV')?.locator, 'Cabo Verde uses an explicit island locator.');

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
assert.ok(!testHtml.includes('map-country--wrong-pulse'), 'Test mode must not leak correctness through transient map feedback.');
assert.ok(testHtml.includes('Answer recorded'), 'Test confirms input without revealing whether the answer was right.');

const fullSession = buildMapSession(asset, 'learn', 'render-round');
const quizHtml = renderMapQuiz(asset, fullSession, null);
const renderedMapIds = [...quizHtml.matchAll(/data-action="map-answer" data-id="([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(new Set(renderedMapIds), new Set(WEST_AFRICA_MAP_COUNTRY_IDS), 'Every pilot country is directly interactive.');
assert.equal((quizHtml.match(/data-autofocus/g) ?? []).length, 1, 'Map quiz has one focus landing point.');
assert.ok(quizHtml.indexOf('map-prompt') < quizHtml.indexOf('map-stage'), 'The active target stays above the geography while scanning.');
assert.ok(quizHtml.includes('map-context-country'), 'Out-of-region Africa remains visible as faded context.');
assert.ok(quizHtml.includes('data-map-viewport'), 'Map gameplay exposes a dedicated pannable viewport.');
assert.ok(quizHtml.includes('data-map-focus='), 'The viewport carries the preferred starting region for mobile centering.');
assert.ok(quizHtml.includes('swipe or drag to pan Africa'), 'The first prompt teaches the continent-pan gesture once.');

const narrowSession = buildMapSession(asset, 'learn', 'narrow-target', ['TGO']);
const narrowHtml = renderMapQuiz(asset, narrowSession, null);
assert.ok(narrowHtml.includes('r="22"'), 'Narrow target assistance aims at roughly a 44px effective diameter, not a 90px circle.');
assert.ok(narrowHtml.includes('clip-path="url(#map-target-hit-clip)"'), 'Expanded target assistance is clipped so neighbouring countries remain real wrong answers.');
assert.ok(narrowHtml.includes('fill-rule="evenodd"'), 'The assist clip explicitly subtracts surrounding geography.');

let currentCorrectSession = buildMapSession(asset, 'learn', 'current-correct', ['GHA']);
let currentCorrectProgress = createInitialLocationProgress(WEST_AFRICA_MAP_COUNTRY_IDS);
const currentCorrect = applyMapGuess(currentCorrectSession, currentCorrectProgress, 'GHA', 500);
currentCorrectSession = currentCorrect.session;
const currentCorrectHtml = renderMapQuiz(asset, currentCorrectSession, null);
assert.ok(currentCorrectHtml.includes('map-country--first map-country--current-correct'), 'A correct tap gets a strong transient success fill before settling to the stored score color.');

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
assert.ok(resultHtml.includes('map-result-breakdown'), 'Results expose performance structure instead of only a percentage.');
assert.ok(!resultHtml.includes('map-result-percent'), 'Generic percentage emphasis is removed from map results.');

const mapHomeHtml = renderMapHome(createInitialLocationProgress(WEST_AFRICA_MAP_COUNTRY_IDS));
assert.ok(mapHomeHtml.includes('study-action--primary'), 'Map home uses the same Learn/Test hierarchy as flag scopes.');
assert.ok(mapHomeHtml.includes('status-strip'), 'Map mastery uses the shared progress visual language.');
assert.ok(!mapHomeHtml.includes('map-progress-card'), 'Map home no longer introduces a separate rounded progress card system.');

const twoTarget = buildMapSession(asset, 'learn', 'advance', ['GHA', 'MLI']);
const firstId = twoTarget.countryIds[0];
const firstAnswer = applyMapGuess(twoTarget, createInitialLocationProgress(WEST_AFRICA_MAP_COUNTRY_IDS), firstId, 500);
assert.equal(advanceMapSession(firstAnswer.session).currentIndex, 1, 'Resolved target advances to the next country.');

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
assert.ok(mapCss.includes('.map-country--current-correct'), 'Correct taps have a dedicated high-salience transient state.');
assert.ok(mapCss.includes('(hover: hover) and (pointer: fine)'), 'Hover feedback is limited to devices that actually hover.');
assert.ok(mapCss.includes('forced-colors: active'), 'Map interaction has a forced-colors fallback.');

const indexHtml = await readFile('dist/index.html', 'utf8');
assert.ok(indexHtml.includes('./map-viewport.js'), 'The production shell loads map pan preservation behavior.');
const viewportJs = await readFile('dist/map-viewport.js', 'utf8');
assert.ok(viewportJs.includes('data-map-viewport') || viewportJs.includes('mapViewport'), 'Built viewport helper preserves pan across map rerenders.');
const serviceWorker = await readFile('dist/sw.js', 'utf8');
assert.ok(serviceWorker.includes('./map-viewport.js'), 'The viewport helper is part of the offline app shell.');

console.log('Map pilot verification passed, including mobile continent-context gameplay contract.');
