import assert from 'node:assert/strict';
import { loadMapAsset } from '../dist/data/maps/index.js';
import {
  advanceMapSession,
  applyMapGuess,
  buildMapSession,
  createInitialLocationProgress,
} from '../dist/domain/map-game.js';
import { AFRICA_MAP_COUNTRY_IDS } from '../dist/data/map-scopes.js';
import { renderMapQuiz } from '../dist/ui/views/map-quiz.js';

const asset = await loadMapAsset('west-africa');
assert.ok(asset, 'West Africa map must load for edge regressions.');

const calloutIds = asset.countries.filter((item) => item.callout).map((item) => item.countryId).sort();
assert.deepEqual(calloutIds, ['GMB', 'TGO'], 'Only The Gambia and Togo retain mainland callouts in West Africa.');

for (const id of ['CPV', 'GNB', 'SLE', 'BEN']) {
  const geometry = asset.countries.find((item) => item.countryId === id);
  assert.equal(geometry?.callout, undefined, `${id} does not use a redundant mainland-style callout.`);
  assert.equal(geometry?.hitAssist, undefined, `${id} uses its true geometry without a hidden competing assist.`);
}
const caboVerde = asset.countries.find((item) => item.countryId === 'CPV');
assert.ok(caboVerde?.locator, 'Cabo Verde remains a single island dot target.');
const cpvHtml = renderMapQuiz(asset, buildMapSession(asset, 'learn', 'cpv-dot-edge', ['CPV']), null);
assert.ok(cpvHtml.includes('map-country__locator-hit'), 'Cabo Verde dot has a larger invisible touch surface.');
assert.ok(!cpvHtml.includes('map-country__callout-line'), 'Cabo Verde does not duplicate the dot with a line/callout target.');

let session = buildMapSession(asset, 'test', 'recorded-next-target-leak', ['GHA', 'MLI']);
const firstTarget = session.countryIds[0];
const nextTarget = session.countryIds[1];
assert.ok(firstTarget && nextTarget && firstTarget !== nextTarget);

const progress = createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS);
const wrong = applyMapGuess(session, progress, nextTarget, 500);
session = wrong.session;

const immediate = renderMapQuiz(asset, session, null);
assert.ok(immediate.includes('map-country--recorded'), 'The Test tap is visibly acknowledged before advancing.');

session = advanceMapSession(session);
const nextQuestion = renderMapQuiz(asset, session, null);
assert.ok(
  !nextQuestion.includes('map-country--recorded'),
  'A previous wrong selection must not highlight the next target and cue the answer.',
);

console.log('Africa small-country and Test-feedback edge regressions passed.');
