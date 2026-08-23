import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  awardEligibleAchievements,
  continentHasCompleteCurriculum,
  createInitialAchievementState,
  getContinentAchievementReadModel,
  getRegionAchievementReadModel,
  getWorldAchievementReadModel,
  isContinentComplete,
  isRegionComplete,
  isRegionDomainMasteryEarned,
  regionDomainQualifies,
  regionHasCompleteCurriculum,
  worldHasCompleteCurriculum,
} from '../dist/domain/achievements.js';
import { CONTINENTS } from '../dist/data/continents.js';
import { LEARNING_DOMAIN_IDS } from '../dist/domain/models.js';
import { countryIdsForSupportedScope } from '../dist/domain/scope-support.js';
import { createCountryEvidenceQualification } from '../dist/state/achievement-evidence-adapter.js';

const westAfrica = { kind: 'region', id: 'west-africa', label: 'West Africa' };
const westAsia = { kind: 'region', id: 'west-asia', label: 'West Asia' };
const africa = { kind: 'continent', id: 'africa', label: 'Africa' };

function qualificationForScope(scope) {
  const supported = new Map(
    LEARNING_DOMAIN_IDS.map((domain) => [domain, new Set(countryIdsForSupportedScope(scope, domain))]),
  );
  return (domain, countryId) => supported.get(domain)?.has(countryId) ?? false;
}

const empty = createInitialAchievementState();
const westQualification = qualificationForScope(westAfrica);
const westFlagIds = countryIdsForSupportedScope(westAfrica, 'flags');
assert.ok(westFlagIds.length > 1);
assert.equal(
  regionDomainQualifies(
    'west-africa',
    'flags',
    (domain, countryId) => westQualification(domain, countryId) && countryId !== westFlagIds[0],
  ),
  false,
  'An incomplete region does not qualify for domain mastery.',
);

const westFull = awardEligibleAchievements(empty, westQualification);
for (const domain of LEARNING_DOMAIN_IDS) {
  assert.equal(
    isRegionDomainMasteryEarned(westFull.state, 'west-africa', domain),
    true,
    `Full qualifying West Africa evidence earns ${domain} mastery.`,
  );
}
assert.equal(isRegionComplete(westFull.state, 'west-africa'), true, 'A fully qualified four-domain region earns complete-region prestige.');
assert.equal(
  westFull.newlyEarned.filter((item) => item.kind === 'region-domain' && item.regionId === 'west-africa').length,
  4,
  'Each West Africa domain mastery is awarded exactly once on the first qualifying pass.',
);

const westAgain = awardEligibleAchievements(westFull.state, westQualification);
assert.deepEqual(westAgain.state, westFull.state, 'Awarding is idempotent.');
assert.equal(westAgain.newlyEarned.length, 0, 'An idempotent award pass emits no duplicate earning events.');

const afterLapse = awardEligibleAchievements(westFull.state, () => false);
assert.deepEqual(afterLapse.state, westFull.state, 'Later live-evidence lapse does not revoke earned regional or domain achievement state.');

const westNeighborIds = countryIdsForSupportedScope(westAfrica, 'neighbors');
assert.ok(westNeighborIds.length > 0);
const westMissingNeighbor = awardEligibleAchievements(
  empty,
  (domain, countryId) => westQualification(domain, countryId)
    && !(domain === 'neighbors' && countryId === westNeighborIds[0]),
);
assert.equal(isRegionDomainMasteryEarned(westMissingNeighbor.state, 'west-africa', 'neighbors'), false);
assert.equal(isRegionComplete(westMissingNeighbor.state, 'west-africa'), false, 'Complete region waits for every required four-domain mastery.');

assert.equal(regionHasCompleteCurriculum('west-africa'), true, 'Africa regions expose the complete four-domain proving-ground curriculum.');
assert.equal(regionHasCompleteCurriculum('west-asia'), false, 'A Flags-only region is not complete curriculum.');
const everywhereQualified = awardEligibleAchievements(empty, () => true);
assert.equal(isRegionDomainMasteryEarned(everywhereQualified.state, 'west-asia', 'flags'), true, 'A supported individual domain can still earn mastery outside Africa.');
assert.equal(isRegionComplete(everywhereQualified.state, 'west-asia'), false, 'Unsupported domain absence never counts as complete-region progress.');

const westAsiaReadModel = getRegionAchievementReadModel(everywhereQualified.state, westAsia.id);
assert.ok(westAsiaReadModel);
assert.deepEqual(westAsiaReadModel.supportedDomains, ['flags']);
assert.equal(westAsiaReadModel.completeCurriculum, false);
assert.equal(westAsiaReadModel.complete, false);

const africaQualification = qualificationForScope(africa);
const missingAfricaNeighbor = westNeighborIds[0];
const africaIncomplete = awardEligibleAchievements(
  empty,
  (domain, countryId) => africaQualification(domain, countryId)
    && !(domain === 'neighbors' && countryId === missingAfricaNeighbor),
);
assert.equal(isRegionComplete(africaIncomplete.state, 'west-africa'), false);
assert.equal(isContinentComplete(africaIncomplete.state, 'africa'), false, 'Continent completion waits for every required region/domain mastery.');

const africaFull = awardEligibleAchievements(empty, africaQualification);
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

const fakeLedgers = {
  flags: { records: { AAA: { status: 'mastered' } } },
  locations: { records: { AAA: { status: 'learning' } } },
  outlines: { records: { AAA: { status: 'unseen' } } },
  neighbors: { records: { AAA: { status: 'mastered' } } },
};
const evidenceQualification = createCountryEvidenceQualification(fakeLedgers);
assert.equal(evidenceQualification('flags', 'AAA'), true);
assert.equal(evidenceQualification('locations', 'AAA'), false);
assert.equal(evidenceQualification('outlines', 'AAA'), false);
assert.equal(evidenceQualification('neighbors', 'AAA'), true);
fakeLedgers.locations.records.AAA.status = 'mastered';
assert.equal(evidenceQualification('locations', 'AAA'), true, 'Locations evidence can change independently.');
assert.equal(evidenceQualification('outlines', 'AAA'), false, 'Changing one ledger does not contaminate another domain.');

const achievementEngine = await readFile('dist/domain/achievements.js', 'utf8');
for (const forbidden of ['masteryStreak', 'nextReviewAt', "status === 'mastered'", 'lifetimeCorrect']) {
  assert.equal(achievementEngine.includes(forbidden), false, `Achievement domain does not encode the legacy evidence rule ${forbidden}.`);
}
const evidenceAdapter = await readFile('dist/state/achievement-evidence-adapter.js', 'utf8');
assert.ok(evidenceAdapter.includes('qualifiesForRegionMastery'), 'Achievement state delegates country qualification to Issue #29.');
assert.equal(evidenceAdapter.includes("status === 'mastered'"), false, 'Achievement adapter does not hard-code the compatibility scheduler status.');

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

const { AppStore } = await import('../dist/state/store.js');
const store = new AppStore();
store.achievements = africaFull.state;
saveAchievementState(store.achievements);
store.resetProgress();
assert.deepEqual(store.achievements, empty, 'The existing Reset all progress store path explicitly resets earned achievements.');
assert.equal(memory.has(ACHIEVEMENT_STORAGE_KEY), false, 'The reset path removes the durable achievement key.');

console.log('Achievement verification passed: monotonic region/domain mastery, guarded region/continent/world completion, canonical evidence seam, versioned persistence and explicit reset semantics.');