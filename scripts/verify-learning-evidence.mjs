import assert from 'node:assert/strict';
import { COUNTRIES } from '../dist/data/countries.js';
import {
  applyCountryEvidence,
  qualifiesForRegionMastery,
} from '../dist/domain/evidence.js';
import {
  applyMapGuess,
  buildMapSession,
  createInitialLocationProgress,
  getLocationRecord,
} from '../dist/domain/map-game.js';
import {
  applyNeighborGuess,
  buildNeighborSession,
  createInitialNeighborProgress,
  getNeighborRecord,
} from '../dist/domain/neighbor-game.js';
import {
  applyAttempt,
  applyPassiveExposure,
  createInitialProgress,
  createProgressRecord,
  getRecord,
} from '../dist/domain/progress.js';
import { buildQuiz } from '../dist/domain/quiz.js';
import { sanitizeLocationRecord } from '../dist/infrastructure/map-storage.js';
import { sanitizeNeighborRecord } from '../dist/infrastructure/neighbor-storage.js';
import { sanitizeRecord } from '../dist/infrastructure/storage.js';
import { renderProgress } from '../dist/ui/views/progress.js';
import { renderQuiz } from '../dist/ui/views/quiz.js';
import { renderResults } from '../dist/ui/views/results.js';

const gha = 'GHA';
const now = (day) => new Date(`2026-02-${String(day).padStart(2, '0')}T12:00:00Z`);

// Passive exposure is retained without turning Unseen into scored learning.
let flagState = createInitialProgress(COUNTRIES);
flagState = applyPassiveExposure(flagState, gha, now(1));
let flagRecord = getRecord(flagState, gha);
assert.equal(flagRecord.status, 'unseen');
assert.equal(flagRecord.masteryStreak, 0);
assert.equal(flagRecord.evidence.passiveExposures, 1);
assert.equal(flagRecord.evidence.lastScoredAt, undefined);
assert.equal(qualifiesForRegionMastery(flagRecord), false);

// Assisted retrieval is scored evidence, but not clean strength credit.
const assisted = applyCountryEvidence(createProgressRecord(gha), {
  activity: 'learn',
  outcome: 'assisted-retrieval',
  at: now(2).toISOString(),
  sessionId: 'assisted',
}).record;
assert.equal(assisted.status, 'learning');
assert.equal(assisted.masteryStreak, 0);
assert.equal(assisted.evidence.assistedRetrievals, 1);
assert.equal(assisted.evidence.lastScoredAt, now(2).toISOString());
assert.equal(qualifiesForRegionMastery(assisted), false);

// Clean Learn is one independent strength credit.
const cleanLearn = applyAttempt(createInitialProgress(COUNTRIES), gha, {
  sessionId: 'learn-1',
  countryId: gha,
  selectedCountryId: gha,
  responseTimeMs: 600,
  activity: 'learn',
  now: now(3),
});
assert.equal(cleanLearn.attempt.evidenceOutcome, 'clean-retrieval');
assert.equal(cleanLearn.attempt.evidenceCredit, 1);
assert.equal(getRecord(cleanLearn.state, gha).masteryStreak, 1);
assert.equal(getRecord(cleanLearn.state, gha).evidence.cleanLearnRetrievals, 1);

// Clean Play is diagnostically stronger on material without contradiction history.
const cleanPlay = applyAttempt(createInitialProgress(COUNTRIES), gha, {
  sessionId: 'play-1',
  countryId: gha,
  selectedCountryId: gha,
  responseTimeMs: 500,
  activity: 'play',
  now: now(4),
});
assert.equal(cleanPlay.attempt.evidenceCredit, 2);
assert.equal(getRecord(cleanPlay.state, gha).masteryStreak, 2);
assert.equal(getRecord(cleanPlay.state, gha).evidence.cleanPlayRetrievals, 1);

// A Learn retrieval plus a later clean assessment calibrates already-known material in two sessions.
let calibrated = cleanLearn.state;
calibrated = applyAttempt(calibrated, gha, {
  sessionId: 'play-2',
  countryId: gha,
  selectedCountryId: gha,
  responseTimeMs: 450,
  activity: 'play',
  now: now(5),
}).state;
assert.equal(getRecord(calibrated, gha).status, 'mastered');
assert.equal(qualifiesForRegionMastery(getRecord(calibrated, gha)), true);

// Contradictory evidence is retained and a lapse cannot be erased by one strong Play result.
let strong = createInitialProgress(COUNTRIES);
for (let index = 0; index < 3; index += 1) {
  strong = applyAttempt(strong, gha, {
    sessionId: `strong-${index}`,
    countryId: gha,
    selectedCountryId: gha,
    responseTimeMs: 500,
    activity: 'learn',
    now: now(6 + index),
  }).state;
}
const contradicted = applyAttempt(strong, gha, {
  sessionId: 'lapse',
  countryId: gha,
  selectedCountryId: 'MLI',
  responseTimeMs: 800,
  activity: 'play',
  now: now(9),
}).state;
let contradictedRecord = getRecord(contradicted, gha);
assert.equal(contradictedRecord.status, 'learning');
assert.equal(contradictedRecord.lapseCount, 1);
assert.equal(contradictedRecord.evidence.contradictions, 1);
assert.equal(contradictedRecord.confusionCounts.MLI, 1);
assert.equal(qualifiesForRegionMastery(contradictedRecord), false);

let recovering = applyAttempt(contradicted, gha, {
  sessionId: 'recovery-play-1',
  countryId: gha,
  selectedCountryId: gha,
  responseTimeMs: 500,
  activity: 'play',
  now: now(10),
});
assert.equal(recovering.attempt.evidenceCredit, 1, 'Post-lapse Play cannot erase contradictory evidence in one assessment.');
assert.equal(getRecord(recovering.state, gha).status, 'learning');
recovering = applyAttempt(recovering.state, gha, {
  sessionId: 'recovery-play-2',
  countryId: gha,
  selectedCountryId: gha,
  responseTimeMs: 500,
  activity: 'play',
  now: now(11),
});
assert.equal(getRecord(recovering.state, gha).status, 'mastered');
assert.equal(qualifiesForRegionMastery(getRecord(recovering.state, gha)), true);

// Later review evidence is retained separately from acquisition evidence.
const reviewed = applyAttempt(recovering.state, gha, {
  sessionId: 'review-1',
  countryId: gha,
  selectedCountryId: gha,
  responseTimeMs: 450,
  activity: 'review',
  now: now(12),
}).state;
assert.equal(getRecord(reviewed, gha).evidence.cleanReviewRetrievals, 1);
assert.ok(getRecord(reviewed, gha).evidence.retentionSuccesses >= 1);

// Locations preserve their native first-try / assisted / reveal semantics.
const mapAsset = {
  scope: { kind: 'region', id: 'west-africa', label: 'West Africa' },
  viewBox: '0 0 10 10',
  countries: [{ countryId: gha, path: 'M0,0L1,0L1,1Z' }],
};
let locationState = createInitialLocationProgress([gha]);
let mapSession = buildMapSession(mapAsset, 'test', 'location-play', [gha], now(13));
let mapStep = applyMapGuess(mapSession, locationState, gha, 400, now(13));
assert.equal(mapStep.attempt.evidenceActivity, 'play');
assert.equal(mapStep.attempt.evidenceCredit, 2);
assert.equal(getLocationRecord(mapStep.progress, gha).evidence.cleanPlayRetrievals, 1);

locationState = createInitialLocationProgress([gha]);
mapSession = buildMapSession(mapAsset, 'learn', 'location-assisted', [gha], now(14));
mapStep = applyMapGuess(mapSession, locationState, 'MLI', 400, now(14));
mapStep = applyMapGuess(mapStep.session, mapStep.progress, gha, 400, now(14));
const assistedLocation = getLocationRecord(mapStep.progress, gha);
assert.equal(assistedLocation.evidence.contradictions, 1);
assert.equal(assistedLocation.evidence.assistedRetrievals, 1);
assert.equal(assistedLocation.masteryStreak, 0);

// Neighbours preserve complete-set semantics instead of flattening individual guesses.
const adjacency = { GHA: ['BFA'], BFA: ['GHA'] };
const neighborScope = { kind: 'region', id: 'west-africa', label: 'West Africa' };
let neighborState = createInitialNeighborProgress([gha]);
let neighborSession = buildNeighborSession(adjacency, neighborState, neighborScope, [gha], 'test', 'neighbor-play', 1, [gha], now(15));
let neighborStep = applyNeighborGuess(neighborSession, neighborState, 'BFA', 400, now(15));
assert.equal(neighborStep.attempt.evidenceActivity, 'play');
assert.equal(neighborStep.attempt.evidenceOutcome, 'clean-retrieval');
assert.equal(neighborStep.attempt.evidenceCredit, 2);
assert.equal(getNeighborRecord(neighborStep.progress, gha).evidence.cleanPlayRetrievals, 1);

neighborState = createInitialNeighborProgress([gha]);
neighborSession = buildNeighborSession(adjacency, neighborState, neighborScope, [gha], 'learn', 'neighbor-assisted', 1, [gha], now(16));
neighborStep = applyNeighborGuess(neighborSession, neighborState, 'BEN', 400, now(16));
neighborStep = applyNeighborGuess(neighborStep.session, neighborStep.progress, 'BFA', 400, now(16));
const assistedNeighbor = getNeighborRecord(neighborStep.progress, gha);
assert.equal(assistedNeighbor.evidence.contradictions, 1);
assert.equal(assistedNeighbor.evidence.assistedRetrievals, 1);
assert.equal(assistedNeighbor.masteryStreak, 0);

// V1 records migrate deterministically without inventing unknown historical Learn/Play modes.
const migratedFlag = sanitizeRecord(gha, {
  status: 'mastered',
  masteryStreak: 3,
  lifetimeCorrect: 7,
  lifetimeIncorrect: 2,
  lapseCount: 0,
  masteredAt: '2026-01-10T12:00:00.000Z',
  lastSeenAt: '2026-01-11T12:00:00.000Z',
  confusionCounts: { MLI: 2 },
});
assert.ok(migratedFlag);
assert.equal(migratedFlag.evidence.legacyScoredRetrievals, 7);
assert.equal(migratedFlag.evidence.contradictions, 2);
assert.equal(migratedFlag.evidence.cleanLearnRetrievals, 0);
assert.equal(migratedFlag.evidence.cleanPlayRetrievals, 0);
assert.equal(qualifiesForRegionMastery(migratedFlag), true);

const migratedLocation = sanitizeLocationRecord(gha, {
  status: 'mastered',
  masteryStreak: 3,
  lifetimeResolved: 8,
  lifetimeFirstTryCorrect: 5,
  lifetimeIncorrectGuesses: 3,
  revealCount: 1,
  masteredAt: '2026-01-10T12:00:00.000Z',
});
assert.ok(migratedLocation);
assert.equal(migratedLocation.evidence.legacyScoredRetrievals, 5);
assert.equal(migratedLocation.evidence.passiveExposures, 1);
assert.equal(migratedLocation.evidence.contradictions, 3);
assert.equal(qualifiesForRegionMastery(migratedLocation), true);

const migratedNeighbor = sanitizeNeighborRecord(gha, {
  status: 'mastered',
  masteryStreak: 3,
  lifetimeRounds: 8,
  lifetimeCompleted: 7,
  lifetimeCleanCompletions: 5,
  lifetimeWrongGuesses: 3,
  revealCount: 1,
  masteredAt: '2026-01-10T12:00:00.000Z',
});
assert.ok(migratedNeighbor);
assert.equal(migratedNeighbor.evidence.legacyScoredRetrievals, 5);
assert.equal(migratedNeighbor.evidence.assistedRetrievals, 2);
assert.equal(migratedNeighbor.evidence.passiveExposures, 1);
assert.equal(migratedNeighbor.evidence.contradictions, 3);
assert.equal(qualifiesForRegionMastery(migratedNeighbor), true);

// Separate domain ledgers remain independent.
const independentFlags = applyAttempt(createInitialProgress(COUNTRIES), gha, {
  sessionId: 'independent',
  countryId: gha,
  selectedCountryId: gha,
  responseTimeMs: 500,
  activity: 'play',
  now: now(17),
}).state;
const independentLocations = createInitialLocationProgress([gha]);
const independentNeighbors = createInitialNeighborProgress([gha]);
assert.equal(getRecord(independentFlags, gha).masteryStreak, 2);
assert.equal(getLocationRecord(independentLocations, gha).status, 'unseen');
assert.equal(getNeighborRecord(independentNeighbors, gha).status, 'unseen');

// Routine UI no longer exposes scheduler x/y punch cards or individual-country Mastered achievements.
// Pin this record's review date in the future so the fixture tests the Strong-evidence label
// rather than becoming time-dependent as the real calendar advances.
const strongUiState = {
  ...recovering.state,
  records: {
    ...recovering.state.records,
    [gha]: {
      ...recovering.state.records[gha],
      nextReviewAt: '2999-01-01T00:00:00.000Z',
    },
  },
};
const progressHtml = renderProgress(strongUiState, 'all');
assert.ok(!/\b\d+\/\d+ toward mastery\b/i.test(progressHtml));
assert.ok(!/>Mastered</.test(progressHtml));
assert.ok(progressHtml.includes('Strong evidence'));

const fresh = createInitialProgress(COUNTRIES);
const questions = buildQuiz({
  countries: COUNTRIES,
  progress: fresh,
  scope: { kind: 'continent', id: 'africa', label: 'Africa' },
  mode: 'learn',
  size: 1,
  sessionId: 'evidence-ui',
});
const quizSession = {
  id: 'evidence-ui',
  mode: 'learn',
  scope: { kind: 'continent', id: 'africa', label: 'Africa' },
  startedAt: now(18).toISOString(),
  questions,
  currentIndex: 0,
  attempts: [],
};
const targetId = questions[0].countryId;
const answeredState = applyAttempt(fresh, targetId, {
  sessionId: quizSession.id,
  countryId: targetId,
  selectedCountryId: targetId,
  responseTimeMs: 500,
  activity: 'learn',
  now: now(18),
}).state;
const quizHtml = renderQuiz(quizSession, answeredState, targetId);
assert.ok(quizHtml.includes('data-action="next-question" data-autofocus'), 'Clean Learn continues from the correct answer in place.');
assert.ok(!quizHtml.includes(' of 3 rounds'));
assert.ok(!/>Mastered</.test(quizHtml));

const resultHtml = renderResults({
  session: quizSession,
  correct: 1,
  total: 1,
  newlyMastered: [targetId],
  missed: [],
});
assert.ok(resultHtml.includes('Strong evidence this round'));
assert.ok(!/>Mastered</.test(resultHtml));

console.log('Learning evidence verification passed: passive, assisted, clean Learn/Play, retention, lapse, migration, domain independence, qualification and UI semantics.');
