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

// --- View rendering -------------------------------------------------------
// The views are pure string builders, so their output can be asserted here
// without a browser. These guard the states that are easy to break silently:
// empty ledgers, focus landing points, and the single mastery-goal source.

const { renderHome } = await import('../dist/ui/views/home.js');
const { renderScope } = await import('../dist/ui/views/scope.js');
const { renderProgress } = await import('../dist/ui/views/progress.js');
const { renderQuiz } = await import('../dist/ui/views/quiz.js');
const { renderResults } = await import('../dist/ui/views/results.js');
const { buildQuiz: build } = await import('../dist/domain/quiz.js');

const fresh = createInitialProgress(COUNTRIES);
const screens = {
  home: renderHome(fresh),
  scope: renderScope(fresh, { kind: 'continent', id: 'africa', label: 'Africa' }),
  region: renderScope(fresh, { kind: 'region', id: 'west-africa', label: 'West Africa' }),
  progress: renderProgress(fresh, 'all'),
};

for (const [name, html] of Object.entries(screens)) {
  assert.equal(
    (html.match(/data-autofocus/g) ?? []).length,
    1,
    `${name} must declare exactly one focus landing point per render.`,
  );
  assert.ok(!html.includes('undefined'), `${name} must not render undefined values.`);
  assert.ok(!html.includes('NaN'), `${name} must not render NaN values.`);
}

for (const filter of ['unseen', 'learning', 'mastered']) {
  const html = renderProgress(fresh, filter);
  const isEmpty = filter !== 'unseen';
  assert.equal(
    html.includes('class="empty-state"'),
    isEmpty,
    `The ${filter} ledger filter must show an empty state only when it has no rows.`,
  );
}

assert.ok(
  !renderProgress(fresh, 'all').includes('data-action="reset-request"'),
  'Reset must stay hidden until there is progress worth erasing.',
);
assert.ok(
  renderProgress(learningState, 'all').includes('data-action="reset-request"'),
  'Reset must be reachable once flags have been studied.',
);
assert.ok(
  renderProgress(learningState, 'all', true).includes('data-action="reset-confirm"'),
  'Reset must require a second, explicit confirmation.',
);

const lapsedProgress = { ...lapsed };
assert.ok(
  renderScope(lapsedProgress, { kind: 'region', id: 'west-africa', label: 'West Africa' }).includes('Learning 0/2'),
  'The region ledger must read its mastery goal from masteryGoal, including the post-lapse goal of 2.',
);

const quizSession = {
  id: 'render-session',
  mode: 'learn',
  scope: { kind: 'continent', id: 'africa', label: 'Africa' },
  startedAt: new Date().toISOString(),
  questions: build({
    countries: COUNTRIES,
    progress: fresh,
    scope: { kind: 'continent', id: 'africa', label: 'Africa' },
    mode: 'learn',
    size: 10,
    sessionId: 'render-session',
  }),
  currentIndex: 0,
  attempts: [],
};

const unanswered = renderQuiz(quizSession, fresh, null);
assert.ok(unanswered.includes('<h1'), 'The quiz must expose a heading for assistive navigation.');
assert.equal((unanswered.match(/data-autofocus/g) ?? []).length, 1, 'Unanswered quiz has one focus landing point.');
assert.ok(unanswered.includes('Flag to identify'), 'The flag stays anonymous until the answer is revealed.');
assert.ok(unanswered.includes('flag-fallback'), 'Every flag carries a fallback for a failed image load.');

const answered = renderQuiz(quizSession, fresh, quizSession.questions[0].countryId);
assert.ok(
  answered.includes('data-action="next-question" data-autofocus'),
  'After answering in Learn mode, focus must land on the advance control.',
);
assert.ok(!answered.includes('aria-live'), 'Announcements belong to the persistent live region, not re-rendered nodes.');

const emptyResult = renderResults({
  session: quizSession,
  correct: 10,
  total: 10,
  newlyMastered: [],
  missed: [],
});
assert.ok(emptyResult.includes('Clean round'), 'A perfect round still reports its outcome.');

console.log(`Verified ${COUNTRIES.length} countries, ${REGIONS.length} regions, mastery transitions, quiz integrity, answer randomization, and view rendering.`);
