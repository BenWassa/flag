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
} from '../dist/domain/achievements.js';
import { CONTINENTS } from '../dist/data/continents.js';
import { regionLearningScopes } from '../dist/data/learning-scopes.js';
import { LEARNING_DOMAIN_IDS } from '../dist/domain/models.js';

const westAfrica = { kind: 'region', id: 'west-africa', label: 'West Africa' };
// Melanesia is learner-facing but Flags-only: Oceania ships no generated
// geography yet.
const flagsOnlyRegion = { kind: 'region', id: 'melanesia', label: 'Melanesia' };
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

assert.equal(regionHasCompleteCurriculum('west-africa'), true, 'Africa regions expose the complete four-domain proving-ground curriculum.');
assert.equal(regionHasCompleteCurriculum('melanesia'), false, 'A Flags-only region is not complete curriculum.');

const everywhereQualification = () => true;
const everywhereQualified = awardEligibleAchievements(empty, everywhereQualification);
assert.equal(isRegionDomainMasteryEarned(everywhereQualified.state, 'melanesia', 'flags'), true, 'A supported individual domain can still earn mastery outside Africa.');
assert.equal(isRegionComplete(everywhereQualified.state, 'melanesia'), false, 'Unsupported domain absence never counts as complete-region progress.');

const flagsOnlyReadModel = getRegionAchievementReadModel(everywhereQualified.state, flagsOnlyRegion.id);
assert.ok(flagsOnlyReadModel);
assert.deepEqual(flagsOnlyReadModel.supportedDomains, ['flags']);
assert.equal(flagsOnlyReadModel.completeCurriculum, false);
assert.equal(flagsOnlyReadModel.complete, false);

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
assert.equal(worldHasCompleteCurriculum(), false, 'The current worldwide curriculum is incomplete.');
assert.equal(everywhereQualified.state.worldCrown, false, 'Even universally qualifying current evidence cannot award the World Crown.');
assert.deepEqual(
  getWorldAchievementReadModel(everywhereQualified.state),
  { kind: 'world', completeCurriculum: false, crownEarned: false },
);

const achievementEngine = await readFile('dist/domain/achievements.js', 'utf8');
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
} = await import('../dist/infrastructure/achievement-storage.js');

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

console.log('Achievement verification passed: two-consecutive-perfect-run region/domain mastery, guarded region/continent/world completion, and versioned persistence for both earned achievements and in-progress streaks.');
