import assert from 'node:assert/strict';
import { COUNTRIES } from '../dist/data/countries.js';
import { CONTINENTS, REGIONS } from '../dist/data/continents.js';
import { applyAttempt, createInitialProgress, getRecord, masteryGoal } from '../dist/domain/progress.js';
import { balancedPositions, buildQuiz, createSeededRandom } from '../dist/domain/quiz.js';

const EXPECTED_CONTINENT_TOTALS = {
  africa: 54,
  asia: 48,
  europe: 44,
  'north-america': 23,
  'south-america': 12,
  oceania: 14,
};

assert.equal(COUNTRIES.length, 195, 'Core catalog must contain 195 countries.');
assert.equal(new Set(COUNTRIES.map((country) => country.iso3)).size, 195, 'ISO3 identifiers must be unique.');
assert.equal(CONTINENTS.length, 6, 'Six inhabited continents are used for the core curriculum.');
assert.equal(new Set(REGIONS.map((region) => region.id)).size, REGIONS.length, 'Region IDs must be unique.');

for (const continent of CONTINENTS) {
  assert.equal(
    COUNTRIES.filter((country) => country.continentId === continent.id).length,
    EXPECTED_CONTINENT_TOTALS[continent.id],
    `${continent.name} must have the expected curriculum total.`,
  );
}

for (const country of COUNTRIES) {
  assert.ok(CONTINENTS.some((continent) => continent.id === country.continentId), `${country.name} has a valid continent.`);
  assert.ok(REGIONS.some((region) => region.id === country.regionId && region.continentId === country.continentId), `${country.name} has a valid region.`);
}

const progress = createInitialProgress(COUNTRIES);
const africaQuiz = buildQuiz({
  countries: COUNTRIES,
  progress,
  scope: { kind: 'continent', id: 'africa', label: 'Africa' },
  mode: 'learn',
  size: 10,
  sessionId: 'verification-session',
});

assert.equal(africaQuiz.length, 10);
assert.equal(new Set(africaQuiz.map((question) => question.countryId)).size, 10, 'Targets must be unique in a standard round.');
for (const question of africaQuiz) {
  const target = COUNTRIES.find((country) => country.id === question.countryId);
  assert.equal(target?.continentId, 'africa', 'Africa scope must only target African countries.');
  assert.equal(question.optionCountryIds.length, 4, 'Every question must have four options.');
  assert.equal(new Set(question.optionCountryIds).size, 4, 'Options must be unique.');
  assert.equal(question.optionCountryIds[question.correctIndex], question.countryId, 'Correct index must identify the target.');
}

const positions = balancedPositions(20, createSeededRandom(42));
const counts = [0, 1, 2, 3].map((position) => positions.filter((value) => value === position).length);
assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, 'Answer positions must be balanced.');
assert.ok(!positions.some((value, index) => index >= 2 && value === positions[index - 1] && value === positions[index - 2]), 'No triple answer-position run.');

let learningState = createInitialProgress(COUNTRIES);
for (let round = 1; round <= 3; round += 1) {
  learningState = applyAttempt(learningState, 'GHA', {
    sessionId: `round-${round}`,
    countryId: 'GHA',
    selectedCountryId: 'GHA',
    responseTimeMs: 1200,
    now: new Date(`2026-01-0${round}T12:00:00Z`),
  }).state;
}
assert.equal(getRecord(learningState, 'GHA').status, 'mastered', 'Three correct answers across separate rounds must master a flag.');

const sameSession = applyAttempt(learningState, 'GHA', {
  sessionId: 'round-3',
  countryId: 'GHA',
  selectedCountryId: 'GHA',
  responseTimeMs: 1000,
  now: new Date('2026-01-03T12:05:00Z'),
}).state;
assert.equal(getRecord(sameSession, 'GHA').status, 'mastered', 'Repeated answer in one session cannot create extra mastery credit.');

const lapsed = applyAttempt(learningState, 'GHA', {
  sessionId: 'round-4',
  countryId: 'GHA',
  selectedCountryId: 'MLI',
  responseTimeMs: 2100,
  now: new Date('2026-01-04T12:00:00Z'),
}).state;
assert.equal(getRecord(lapsed, 'GHA').status, 'learning', 'A mastered miss must return the flag to Learning.');
assert.equal(masteryGoal(getRecord(lapsed, 'GHA')), 2, 'A mastered lapse uses the v1 two-success recovery goal.');
assert.equal(getRecord(lapsed, 'GHA').confusionCounts.MLI, 1, 'Wrong selections must feed the confusion graph.');

console.log(`Verified ${COUNTRIES.length} countries, ${REGIONS.length} regions, mastery transitions, quiz integrity, and answer randomization.`);
