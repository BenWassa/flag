import assert from 'node:assert/strict';
import { loadMapAsset } from '../dist/data/maps/index.js';
import {
  advanceMapSession,
  applyMapGuess,
  buildMapSession,
  createInitialLocationProgress,
} from '../dist/domain/map-game.js';
import { WEST_AFRICA_MAP_COUNTRY_IDS } from '../dist/data/map-scopes.js';
import { renderMapQuiz } from '../dist/ui/views/map-quiz.js';

const asset = await loadMapAsset('west-africa');
assert.ok(asset, 'West Africa map must load for v4 edge regressions.');

for (const id of ['CPV', 'GMB', 'GNB', 'SLE', 'TGO']) {
  const geometry = asset.countries.find((item) => item.countryId === id);
  assert.ok(geometry?.callout, `${id} uses a visible cartographic callout at phone scale.`);
  assert.equal(geometry?.hitAssist, undefined, `${id} does not also retain an invisible enlarged target.`);
}
assert.ok(
  asset.countries.find((item) => item.countryId === 'BEN')?.hitAssist,
  'Benin retains clipped neutral-space assistance instead of adding another Gulf callout.',
);

let session = buildMapSession(asset, 'test', 'recorded-next-target-leak', ['GHA', 'MLI']);
const firstTarget = session.countryIds[0];
const nextTarget = session.countryIds[1];
assert.ok(firstTarget && nextTarget && firstTarget !== nextTarget);

const progress = createInitialLocationProgress(WEST_AFRICA_MAP_COUNTRY_IDS);
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

console.log('Map v4 callout and Test-feedback edge regressions passed.');
