import assert from 'node:assert/strict';
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

const fullSession = buildMapSession(asset, 'learn', 'render-round');
const quizHtml = renderMapQuiz(asset, fullSession, null);
const renderedMapIds = [...quizHtml.matchAll(/data-action="map-answer" data-id="([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(new Set(renderedMapIds), new Set(WEST_AFRICA_MAP_COUNTRY_IDS), 'Every pilot country is directly interactive.');
assert.equal((quizHtml.match(/data-autofocus/g) ?? []).length, 1, 'Map quiz has one focus landing point.');
assert.ok(quizHtml.includes('map-stage__scroll'), 'Mobile map is placed in a scrollable precision viewport.');

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

console.log('Map pilot verification passed.');
