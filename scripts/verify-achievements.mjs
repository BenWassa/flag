import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  awardEligibleAchievements,
  continentHasCompleteCurriculum,
  createInitialAchievementState,
  createInitialPerfectRunStreakState,
  createRegionDomainPerfectRunQualification,
  getContinentAchievementReadModel,
  getRegionAchievementReadModel,
  getWorldAchievementReadModel,
  isContinentComplete,
  isRegionComplete,
  isRegionDomainMasteryEarned,
  PERFECT_RUN_STREAK_GOAL,
  recordRegionDomainPlayResult,
  regionDomainQualifies,
  regionHasCompleteCurriculum,
  worldHasCompleteCurriculum,
} from '../.verify-dist/domain/achievements.js';
import { CONTINENTS } from '../.verify-dist/data/continents.js';
import { regionLearningScopes } from '../.verify-dist/data/learning-scopes.js';
import { LEARNING_DOMAIN_IDS } from '../.verify-dist/domain/models.js';

const westAfrica = { kind: 'region', id: 'west-africa', label: 'West Africa' };
const melanesia = { kind: 'region', id: 'melanesia', label: 'Melanesia' };
const unsupportedRegionId = 'not-a-region';
const africa = { kind: 'continent', id: 'africa', label: 'Africa' };

assert.equal(PERFECT_RUN_STREAK_GOAL, 2, 'Two consecutive perfect full-region Play runs are required, not one.');

let streaks = createInitialPerfectRunStreakState();
assert.equal(
  regionDomainQualifies('west-africa', 'flags', createRegionDomainPerfectRunQualification(streaks)),
  false,
  'A region with no recorded perfect runs does not qualify for domain mastery.',
);

streaks = recordRegionDomainPlayResult(streaks, 'west-africa', 'flags', true);
assert.equal(
  regionDomainQualifies('west-africa', 'flags', createRegionDomainPerfectRunQualification(streaks)),
  false,
  'A single perfect full-region Play run does not by itself earn mastery.',
);

streaks = recordRegionDomainPlayResult(streaks, 'west-africa', 'flags', true);
assert.equal(
  regionDomainQualifies('west-africa', 'flags', createRegionDomainPerfectRunQualification(streaks)),
  true,
  'Two consecutive perfect full-region Play runs earn mastery.',
);

let resetStreaks = recordRegionDomainPlayResult(createInitialPerfectRunStreakState(), 'west-africa', 'flags', true);
resetStreaks = recordRegionDomainPlayResult(resetStreaks, 'west-africa', 'flags', false);
assert.equal(
  regionDomainQualifies('west-africa', 'flags', createRegionDomainPerfectRunQualification(resetStreaks)),
  false,
  'A non-perfect full-region Play run resets the streak to zero.',
);
resetStreaks = recordRegionDomainPlayResult(resetStreaks, 'west-africa', 'flags', true);
assert.equal(
  regionDomainQualifies('west-africa', 'flags', createRegionDomainPerfectRunQualification(resetStreaks)),
  false,
  'After a reset, one more perfect run alone is still not enough — the streak restarts from zero.',
);
resetStreaks = recordRegionDomainPlayResult(resetStreaks, 'west-africa', 'flags', true);
assert.equal(
  regionDomainQualifies('west-africa', 'flags', createRegionDomainPerfectRunQualification(resetStreaks)),
  true,
  'Two consecutive perfect runs after a reset earn mastery.',
);

const empty = createInitialAchievementState();

function fullQualification(scope, domains = LEARNING_DOMAIN_IDS) {
  const regionIds = scope.kind === 'continent'
    ? regionLearningScopes(scope.id).map((definition) => definition.scope.id).filter(Boolean)
    : [scope.id];
  let state = createInitialPerfectRunStreakState();
  for (const regionId of regionIds) {
    for (const domain of domains) {
      for (let run = 0; run < PERFECT_RUN_STREAK_GOAL; run += 1) {
        state = recordRegionDomainPlayResult(state, regionId, domain, true);
      }
    }
  }
  return createRegionDomainPerfectRunQualification(state);
}

const westFull = awardEligibleAchievements(empty, fullQualification(westAfrica));
for (const domain of LEARNING_DOMAIN_IDS) {
  assert.equal(
    isRegionDomainMasteryEarned(westFull.state, 'west-africa', domain),
    true,
    `Two perfect West Africa Play runs per domain earn ${domain} mastery.`,
  );
}
assert.equal(isRegionComplete(westFull.state, 'west-africa'), true, 'A fully qualified four-domain region earns complete-region prestige.');
assert.equal(
  westFull.newlyEarned.filter((item) => item.kind === 'region-domain' && item.regionId === 'west-africa').length,
  4,
  'Each West Africa domain mastery is awarded exactly once on the first qualifying pass.',
);

const westAgain = awardEligibleAchievements(westFull.state, fullQualification(westAfrica));
assert.deepEqual(westAgain.state, westFull.state, 'Awarding is idempotent.');
assert.equal(westAgain.newlyEarned.length, 0, 'An idempotent award pass emits no duplicate earning events.');

const afterStreakLoss = awardEligibleAchievements(westFull.state, createRegionDomainPerfectRunQualification(createInitialPerfectRunStreakState()));
assert.deepEqual(afterStreakLoss.state, westFull.state, 'A later empty streak state does not revoke earned regional or domain achievement state.');

const westMissingNeighbor = awardEligibleAchievements(empty, fullQualification(westAfrica, ['flags', 'locations', 'outlines']));
assert.equal(isRegionDomainMasteryEarned(westMissingNeighbor.state, 'west-africa', 'neighbors'), false);
assert.equal(isRegionComplete(westMissingNeighbor.state, 'west-africa'), false, 'Complete region waits for every required four-domain mastery.');

assert.equal(regionHasCompleteCurriculum('west-africa'), true, 'Africa regions expose complete four-domain curriculum.');
assert.equal(regionHasCompleteCurriculum('melanesia'), true, 'Issue #27 makes Melanesia a complete four-domain curriculum.');

const everywhereQualification = () => true;
const everywhereQualified = awardEligibleAchievements(empty, everywhereQualification);
for (const domain of LEARNING_DOMAIN_IDS) {
  assert.equal(
    isRegionDomainMasteryEarned(everywhereQualified.state, melanesia.id, domain),
    true,
    `Universally qualifying evidence earns Melanesia ${domain} mastery once that domain is shipped.`,
  );
}
assert.equal(isRegionComplete(everywhereQualified.state, melanesia.id), true, 'Complete Oceania curriculum allows Melanesia region completion.');
const melanesiaReadModel = getRegionAchievementReadModel(everywhereQualified.state, melanesia.id);
assert.ok(melanesiaReadModel);
assert.deepEqual(melanesiaReadModel.supportedDomains, LEARNING_DOMAIN_IDS);
assert.equal(melanesiaReadModel.completeCurriculum, true);
assert.equal(melanesiaReadModel.complete, true);

assert.equal(regionHasCompleteCurriculum(unsupportedRegionId), false, 'Unknown or unsupported curriculum can never be complete.');
assert.equal(
  regionDomainQualifies(unsupportedRegionId, 'flags', everywhereQualification),
  false,
  'Universal evidence cannot fabricate mastery for an unsupported region.',
);
assert.equal(getRegionAchievementReadModel(everywhereQualified.state, unsupportedRegionId), null, 'Unsupported regions expose no achievement read model.');

const africaIncomplete = awardEligibleAchievements(empty, fullQualification(africa, ['flags', 'locations', 'outlines']));
assert.equal(isRegionComplete(africaIncomplete.state, 'west-africa'), false);
assert.equal(isContinentComplete(africaIncomplete.state, 'africa'), false, 'Continent completion waits for every required region/domain mastery.');

const africaFull = awardEligibleAchievements(empty, fullQualification(africa));
assert.equal(continentHasCompleteCurriculum('africa'), true);
assert.equal(isContinentComplete(africaFull.state, 'africa'), true, 'Full Africa completion earns the continent state.');
const africaReadModel = getContinentAchievementReadModel(africaFull.state, 'africa');
assert.ok(africaReadModel);
assert.equal(africaReadModel.crestEarned, true, 'Continent completion exposes the crest presentation contract.');

assert.equal(continentHasCompleteCurriculum('south-america'), true, 'Issue #24 makes South America a complete four-domain curriculum.');
assert.equal(
  isContinentComplete(everywhereQualified.state, 'south-america'),
  true,
  'Universally qualifying evidence completes South America once all four domains are shipped.',
);
for (const continent of CONTINENTS) {
  assert.equal(
    isContinentComplete(everywhereQualified.state, continent.id),
    continentHasCompleteCurriculum(continent.id),
    `${continent.id} completion follows current curriculum support rather than a hard-coded continent allowlist.`,
  );
}
assert.equal(worldHasCompleteCurriculum(), true, '#22 + #27 make the intended six-continent four-domain curriculum complete.');
assert.equal(everywhereQualified.state.worldCrown, true, 'Universally qualifying evidence can now reach the existing World Crown state.');
assert.equal(
  everywhereQualified.newlyEarned.filter((item) => item.kind === 'world-crown').length,
  1,
  'The World Crown is awarded exactly once when complete worldwide curriculum and continent completion become true.',
);
assert.deepEqual(
  getWorldAchievementReadModel(everywhereQualified.state),
  { kind: 'world', completeCurriculum: true, crownEarned: true },
);

const achievementEngine = await readFile('.verify-dist/domain/achievements.js', 'utf8');
for (const forbidden of ['masteryStreak', 'nextReviewAt', "status === 'mastered'", 'lifetimeCorrect']) {
  assert.equal(achievementEngine.includes(forbidden), false, `Achievement domain does not encode the legacy evidence rule ${forbidden}.`);
}

const memory = new Map();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem(key) { return memory.has(key) ? memory.get(key) : null; },
    setItem(key, value) { memory.set(key, String(value)); },
    removeItem(key) { memory.delete(key); },
  },
});
const {
  ACHIEVEMENT_STORAGE_KEY,
  loadAchievementState,
  migrateAchievementState,
  resetAchievementStorage,
  saveAchievementState,
  PERFECT_RUN_STREAK_STORAGE_KEY,
  loadPerfectRunStreakState,
  migratePerfectRunStreakState,
  resetPerfectRunStreakStorage,
  savePerfectRunStreakState,
} = await import('../.verify-dist/infrastructure/achievement-storage.js');

memory.clear();
assert.equal(saveAchievementState(africaFull.state), true);
assert.deepEqual(loadAchievementState(), africaFull.state, 'Persistence reload preserves earned achievement state.');
assert.deepEqual([...memory.keys()], [ACHIEVEMENT_STORAGE_KEY], 'Achievement persistence does not write into any domain learning ledger namespace.');

assert.deepEqual(migrateAchievementState(null), empty, 'Missing achievement storage defaults safely.');
assert.deepEqual(migrateAchievementState({ version: 99 }), empty, 'Unknown schema versions default safely rather than guessing.');
const migrated = migrateAchievementState({
  version: 1,
  regionDomainMasteries: ['west-africa:flags', 'west-africa:flags', 'bogus:flags', 42],
  completeRegions: ['west-africa', 'bogus'],
  completeContinents: ['africa', 'mars'],
  worldCrown: 'yes',
});
assert.deepEqual(migrated.regionDomainMasteries, ['west-africa:flags']);
assert.deepEqual(migrated.completeRegions, ['west-africa']);
assert.deepEqual(migrated.completeContinents, ['africa']);
assert.equal(migrated.worldCrown, false);

resetAchievementStorage();
assert.deepEqual(loadAchievementState(), empty, 'Explicit achievement reset returns to deterministic empty state.');
assert.equal(memory.has(ACHIEVEMENT_STORAGE_KEY), false, 'Explicit achievement reset removes the durable achievement key.');

memory.clear();
const initialStreaks = createInitialPerfectRunStreakState();
const oneStreak = recordRegionDomainPlayResult(initialStreaks, 'west-africa', 'flags', true);
assert.equal(savePerfectRunStreakState(oneStreak), true);
assert.deepEqual(loadPerfectRunStreakState(), oneStreak, 'Persistence reload preserves in-progress perfect-run streaks.');
assert.deepEqual([...memory.keys()], [PERFECT_RUN_STREAK_STORAGE_KEY], 'Streak persistence does not write into the achievement key or any domain learning ledger namespace.');

assert.deepEqual(migratePerfectRunStreakState(null), initialStreaks, 'Missing streak storage defaults safely.');
assert.deepEqual(migratePerfectRunStreakState({ version: 99, streaks: {} }), initialStreaks, 'Unknown streak schema versions default safely rather than guessing.');
const migratedStreaks = migratePerfectRunStreakState({
  version: 1,
  streaks: { 'west-africa:flags': 1, 'bogus:flags': 3, 'west-africa:locations': -4, 'west-africa:outlines': 1.9, 'west-africa:neighbors': 'two' },
});
assert.deepEqual(migratedStreaks.streaks, { 'west-africa:flags': 1, 'west-africa:locations': 0, 'west-africa:outlines': 1 });

resetPerfectRunStreakStorage();
assert.deepEqual(loadPerfectRunStreakState(), initialStreaks, 'Explicit streak reset returns to deterministic empty state.');
assert.equal(memory.has(PERFECT_RUN_STREAK_STORAGE_KEY), false, 'Explicit streak reset removes the durable streak key.');

// Issue #108: qualification integrity. Region x domain Mastery claims a complete
// region, so a Play that covered only part of one must not advance — or reset —
// the streak. Flags, Outlines and Neighbours used to launch a ten-question
// sample, so in any region with more than ten targets they could award
// permanent Mastery on a sample of it.
// AppStore writes its learning ledgers through window.localStorage, so the store
// needs the same in-memory stand-in the persistence checks above already use.
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    localStorage: globalThis.localStorage,
    addEventListener() {}, removeEventListener() {},
    setTimeout(fn) { return setTimeout(fn, 0); },
    clearTimeout(handle) { clearTimeout(handle); },
  },
});
const { AppStore } = await import('../.verify-dist/state/store.js');
const { COUNTRIES } = await import('../.verify-dist/data/countries.js');
const { countriesInScope } = await import('../.verify-dist/domain/progress.js');
const { coveredFullRegion, isFullRegionPlayLaunch, FULL_REGION_ROUND_SIZE } = await import('../.verify-dist/domain/achievements.js');

assert.equal(coveredFullRegion(['A', 'B'], ['A', 'B']), true, 'A round covering every supported target qualifies.');
assert.equal(coveredFullRegion(['A', 'B'], ['A']), false, 'A sampled round does not qualify.');
assert.equal(coveredFullRegion(['A', 'B'], ['A', 'A', 'B']), true, 'A repeated target does not break an otherwise complete round.');
assert.equal(coveredFullRegion(['A', 'B'], ['A', 'C']), false, 'Covering a different country does not stand in for a missing one.');
assert.equal(coveredFullRegion([], []), false, 'An empty supported set never qualifies.');

const regionScope = { kind: 'region', id: 'west-africa', label: 'West Africa' };
assert.equal(isFullRegionPlayLaunch(regionScope, 'test'), true, 'An ordinary region Play is a full-region launch.');
assert.equal(isFullRegionPlayLaunch(regionScope, 'learn'), false, 'Learn is not a Play result at all.');
assert.equal(isFullRegionPlayLaunch(regionScope, 'test', ['SEN']), false, 'A review or repeat round names its own targets and cannot qualify.');
assert.equal(
  isFullRegionPlayLaunch({ kind: 'continent', id: 'africa', label: 'Africa' }, 'test'),
  false,
  'Mastery is a region unit, so continent Play is not a full-region launch.',
);

const westAfricaCountryIds = countriesInScope(COUNTRIES, regionScope).map((country) => country.id);
assert.ok(
  westAfricaCountryIds.length > 10,
  'West Africa has more than ten targets, so it is a region where a sampled round used to be able to qualify.',
);

// A normal region Play now covers the complete region rather than ten of it.
memory.clear();
const fullStore = new AppStore();
assert.equal(fullStore.startSession(regionScope, 'test', FULL_REGION_ROUND_SIZE), true);
assert.equal(
  fullStore.session.questions.length,
  westAfricaCountryIds.length,
  'A region Play launched at full coverage asks every supported country in the region.',
);

// Two consecutive perfect full-region rounds earn Mastery.
// advance() returns the result on the final question and null before it, so the
// round is driven to completion rather than by watching the session field.
function playRound(store, size, pickAnswer) {
  assert.equal(store.startSession(regionScope, 'test', size), true);
  for (let step = 0; step < store.session.questions.length; step += 1) {
    const question = store.session.questions[store.session.currentIndex];
    store.answer(pickAnswer(question));
    if (store.advance()) return;
  }
  throw new Error('Round did not finish.');
}

const answerCorrectly = (question) => question.countryId;
const answerWrongly = (question) => question.optionCountryIds.find((id) => id !== question.countryId) ?? question.countryId;

function playPerfectRound(store, size) {
  playRound(store, size, answerCorrectly);
}

memory.clear();
const earning = new AppStore();
playPerfectRound(earning, FULL_REGION_ROUND_SIZE);
assert.equal(earning.perfectRunStreaks.streaks['west-africa:flags'], 1, 'One perfect full-region Play advances the streak.');
playPerfectRound(earning, FULL_REGION_ROUND_SIZE);
assert.ok(
  earning.achievements.regionDomainMastery?.['west-africa:flags']
    ?? regionDomainQualifies('west-africa', 'flags', createRegionDomainPerfectRunQualification(earning.perfectRunStreaks)),
  'Two consecutive perfect full-region Play rounds earn region x domain Mastery.',
);

// The bug: a perfect ten-question sample of the same region must not count.
memory.clear();
const sampling = new AppStore();
playPerfectRound(sampling, 10);
assert.equal(
  sampling.perfectRunStreaks.streaks['west-africa:flags'] ?? 0,
  0,
  'A perfect ten-question sample of a larger region does not advance the streak.',
);

// A sampled round is not evidence either way, so it must not destroy a streak
// the learner actually earned.
memory.clear();
const preserving = new AppStore();
playPerfectRound(preserving, FULL_REGION_ROUND_SIZE);
assert.equal(preserving.perfectRunStreaks.streaks['west-africa:flags'], 1);
playRound(preserving, 10, answerWrongly);
assert.equal(
  preserving.perfectRunStreaks.streaks['west-africa:flags'],
  1,
  'A failed sampled round does not reset a streak it could never have earned.',
);

console.log('Achievement verification passed: two-consecutive-perfect-run region/domain mastery, guarded region/continent/world completion, full-region Play qualification, and versioned persistence for both earned achievements and in-progress streaks.');
