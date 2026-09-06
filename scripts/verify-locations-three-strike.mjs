import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadMapAsset } from '../.verify-dist/data/maps/index.js';
import {
  applyMapGuess,
  buildMapSession,
  createInitialLocationProgress,
  finishMapSession,
  getLocationRecord,
} from '../.verify-dist/domain/map-game.js';
import {
  coveredFullRegion,
  createInitialPerfectRunStreakState,
  createRegionDomainPerfectRunQualification,
  isFullRegionPlayLaunch,
  recordRegionDomainPlayResult,
  regionDomainMasteryKey,
} from '../.verify-dist/domain/achievements.js';
import { sanitizeLocationRecord } from '../.verify-dist/infrastructure/map-storage.js';

const asset = await loadMapAsset('west-africa');
assert.ok(asset, 'West Africa asset is required for Locations three-strike verification.');
const scopeIds = asset.countries.map((country) => country.countryId);
const target = 'GHA';
const wrong = ['MLI', 'SEN', 'GIN'];

function freshProgress() {
  return createInitialLocationProgress(scopeIds);
}

// 1. First-try Play is the only clean retrieval path and retains strong Play credit.
let session = buildMapSession(asset, 'test', 'first-try-play', [target]);
let progress = freshProgress();
const firstTry = applyMapGuess(session, progress, target, 420, new Date('2026-09-05T12:00:00Z'));
assert.equal(firstTry.outcome.resolution, 'first-try');
assert.equal(firstTry.attempt.evidenceOutcome, 'clean-retrieval');
assert.equal(firstTry.attempt.evidenceCredit, 2, 'Fresh first-try Play keeps the existing strong two-credit assessment evidence.');
let record = getLocationRecord(firstTry.progress, target);
assert.equal(record.evidence.cleanPlayRetrievals, 1);
assert.equal(record.evidence.assistedRetrievals, 0);
assert.equal(record.evidence.contradictions, 0);
assert.deepEqual(finishMapSession(firstTry.session).missedCountryIds, [], 'A one-target first-try Play result is Perfect-eligible.');

// 2. One miss then success is assisted retrieval: successful, amber, and never clean credit.
session = buildMapSession(asset, 'test', 'one-miss-play', [target]);
progress = freshProgress();
const missOnce = applyMapGuess(session, progress, wrong[0], 450, new Date('2026-09-05T12:01:00Z'));
assert.equal(missOnce.outcome.resolved, false);
assert.equal(missOnce.attempt.evidenceOutcome, 'contradictory');
assert.equal(missOnce.attempt.evidenceCredit, 0);
const oneMissSuccess = applyMapGuess(missOnce.session, missOnce.progress, target, 390, new Date('2026-09-05T12:01:01Z'));
assert.equal(oneMissSuccess.outcome.resolution, 'one-miss');
assert.equal(oneMissSuccess.attempt.evidenceOutcome, 'assisted-retrieval');
assert.equal(oneMissSuccess.attempt.evidenceCredit, 0);
record = getLocationRecord(oneMissSuccess.progress, target);
assert.equal(record.evidence.cleanPlayRetrievals, 0);
assert.equal(record.evidence.assistedRetrievals, 1);
assert.equal(record.evidence.contradictions, 1);
assert.deepEqual(finishMapSession(oneMissSuccess.session).missedCountryIds, [target]);

// 3. Two misses then success is still success, but heavily assisted and non-Perfect.
session = buildMapSession(asset, 'test', 'two-miss-play', [target]);
progress = freshProgress();
const missA = applyMapGuess(session, progress, wrong[0], 450);
const missB = applyMapGuess(missA.session, missA.progress, wrong[1], 460);
assert.equal(missB.outcome.resolved, false, 'Second wrong guess must keep the target active.');
const twoMissSuccess = applyMapGuess(missB.session, missB.progress, target, 470);
assert.equal(twoMissSuccess.outcome.resolution, 'two-miss');
assert.equal(twoMissSuccess.attempt.evidenceOutcome, 'assisted-retrieval');
assert.equal(twoMissSuccess.attempt.evidenceCredit, 0);
record = getLocationRecord(twoMissSuccess.progress, target);
assert.equal(record.evidence.cleanPlayRetrievals, 0);
assert.equal(record.evidence.assistedRetrievals, 1);
assert.equal(record.evidence.contradictions, 2);
assert.deepEqual(finishMapSession(twoMissSuccess.session).missedCountryIds, [target]);

// 4. Three wrong guesses reveal/fail only on the third miss.
session = buildMapSession(asset, 'test', 'revealed-play', [target]);
progress = freshProgress();
let revealStep;
for (const [index, wrongId] of wrong.entries()) {
  revealStep = applyMapGuess(session, progress, wrongId, 480 + index);
  session = revealStep.session;
  progress = revealStep.progress;
  assert.equal(revealStep.outcome.resolved, index === 2);
  assert.equal(revealStep.outcome.revealed, index === 2);
}
assert.equal(revealStep.outcome.resolution, 'revealed');
assert.equal(revealStep.attempt.evidenceOutcome, 'contradictory');
assert.equal(revealStep.attempt.evidenceCredit, 0);
record = getLocationRecord(progress, target);
assert.equal(record.evidence.cleanPlayRetrievals, 0);
assert.equal(record.evidence.assistedRetrievals, 0);
assert.equal(record.evidence.contradictions, 3);
assert.equal(record.evidence.passiveExposures, 1);
assert.equal(record.revealCount, 1);
assert.deepEqual(finishMapSession(session).missedCountryIds, [target]);

// 5/6. Every non-first-try resolution remains outside Perfect by the same result contract.
for (const resolved of [oneMissSuccess.session, twoMissSuccess.session, session]) {
  const result = finishMapSession(resolved);
  assert.equal(result.firstTryCorrect, 0);
  assert.equal(result.missedCountryIds.length, 1);
}

// 7. #108 remains two consecutive eligible perfect full-region Play runs.
let streaks = createInitialPerfectRunStreakState();
streaks = recordRegionDomainPlayResult(streaks, 'west-africa', 'locations', true);
assert.equal(streaks.streaks[regionDomainMasteryKey('west-africa', 'locations')], 1);
assert.equal(createRegionDomainPerfectRunQualification(streaks)('west-africa', 'locations'), false);
streaks = recordRegionDomainPlayResult(streaks, 'west-africa', 'locations', true);
assert.equal(streaks.streaks[regionDomainMasteryKey('west-africa', 'locations')], 2);
assert.equal(createRegionDomainPerfectRunQualification(streaks)('west-africa', 'locations'), true);
streaks = recordRegionDomainPlayResult(streaks, 'west-africa', 'locations', false);
assert.equal(streaks.streaks[regionDomainMasteryKey('west-africa', 'locations')], 0, 'Eligible non-Perfect full-region Play still resets the current streak.');

// 8. Sampled/partial rounds remain ineligible and cannot masquerade as full-region coverage.
assert.equal(coveredFullRegion(scopeIds, scopeIds), true);
assert.equal(coveredFullRegion(scopeIds, scopeIds.slice(0, -1)), false);
assert.equal(isFullRegionPlayLaunch(asset.scope, 'test'), true);
assert.equal(isFullRegionPlayLaunch(asset.scope, 'test', scopeIds.slice(0, 3)), false);
assert.equal(isFullRegionPlayLaunch(asset.scope, 'learn'), false);

// 9. Duplicate/late submissions after target resolution remain rejected by the domain engine.
assert.throws(
  () => applyMapGuess(firstTry.session, firstTry.progress, target, 50),
  /already resolved/,
  'Resolved targets cannot be submitted twice.',
);

// 10. Existing persisted location records and namespaces migrate without a new scoring store.
const legacy = sanitizeLocationRecord(target, {
  status: 'learning',
  masteryStreak: 1,
  lifetimeResolved: 4,
  lifetimeFirstTryCorrect: 2,
  lifetimeIncorrectGuesses: 3,
  revealCount: 1,
  confusionCounts: { MLI: 2 },
});
assert.ok(legacy, 'Legacy v1-shaped Locations progress remains readable.');
assert.equal(legacy.countryId, target);
assert.equal(legacy.lifetimeResolved, 4);
assert.equal(legacy.lifetimeFirstTryCorrect, 2);
assert.equal(legacy.lifetimeIncorrectGuesses, 3);
assert.equal(legacy.revealCount, 1);
assert.deepEqual(legacy.confusionCounts, { MLI: 2 });
const storageSource = await readFile('src/infrastructure/map-storage.ts', 'utf8');
assert.ok(storageSource.includes("const PROGRESS_KEY = 'flag-atlas:location-progress:v1'"), 'Locations progress namespace remains backwards-compatible.');
assert.ok(storageSource.includes("const ATTEMPTS_KEY = 'flag-atlas:location-attempts:v1'"), 'Locations attempt namespace remains backwards-compatible.');

console.log('Locations three-strike verification passed: graded Play retrieval, exact evidence credit, Perfect/Mastery integrity, partial-round exclusion, duplicate lock, and persistence compatibility.');
