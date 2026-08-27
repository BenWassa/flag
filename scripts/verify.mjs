import assert from 'node:assert/strict';
import { COUNTRIES } from '../dist/data/countries.js';
import { CONTINENTS, REGIONS } from '../dist/data/continents.js';
import { LEARNING_DOMAIN_IDS } from '../dist/domain/models.js';
import { scopeSupportsDomain } from '../dist/domain/scope-support.js';
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

// --- Production React rendering ------------------------------------------
// Render the shipped React screens to static markup so these assertions cover
// the learner-facing presentation rather than the retired string renderers.
const { loadScreens, renderScreen } = await import('./lib/react-markup.mjs');
const { HomeScreen, DomainScreen } = await loadScreens('PassiveScreens.js');
const { FlagsLauncherScreen } = await loadScreens('LauncherScreens.js');
const { FlagsQuizScreen, RecognitionResultsScreen } = await loadScreens('RecognitionScreens.js');

const renderHome = (ledgers, persisting = true) => renderScreen(HomeScreen, { ledgers, persisting });
const renderDomainIndex = (domain, ledgers, achievements, persisting = true) => renderScreen(DomainScreen, { domain, ledgers, achievements, persisting });
const renderScope = (progress, scope, achievements, persisting = true) => renderScreen(FlagsLauncherScreen, { progress, scope, achievements, persisting });
const renderQuiz = (session, progress, answeredCountryId) => renderScreen(FlagsQuizScreen, { session, progress, answeredCountryId });
const renderResults = (result) => renderScreen(RecognitionResultsScreen, { result, domain: 'flags' });
const { renderFocusIntent } = await import('../dist/ui/focus.js');
const { buildQuiz: build } = await import('../dist/domain/quiz.js');
const { createInitialAchievementState } = await import('../dist/domain/achievements.js');
const achievements = createInitialAchievementState();

assert.equal(
  renderFocusIntent(false),
  'none',
  'Initial document render leaves focus under browser control.',
);
assert.equal(
  renderFocusIntent(true),
  'restore-or-autofocus',
  'Subsequent navigation and same-route renders restore or deliberately move focus.',
);

const fresh = createInitialProgress(COUNTRIES);
const africaScopeFixture = { kind: 'continent', id: 'africa', label: 'Africa' };
const westAfricaScopeFixture = { kind: 'region', id: 'west-africa', label: 'West Africa' };
const ledgers = {
  flags: fresh,
  locations: { version: 2, records: {} },
  outlines: { version: 2, records: {} },
  neighbors: { version: 2, records: {} },
};
const screens = {
  home: renderHome(ledgers),
  flagsIndex: renderDomainIndex('flags', ledgers, achievements),
  locationsIndex: renderDomainIndex('locations', ledgers, achievements),
  scope: renderScope(fresh, africaScopeFixture, achievements),
  region: renderScope(fresh, westAfricaScopeFixture, achievements),
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

// Home is mode-first: it selects a learning domain, and geography is chosen
// one level deeper on that domain's own continent index.
assert.equal(
  (screens.home.match(/class="atlas-card"/g) ?? []).length,
  LEARNING_DOMAIN_IDS.length,
  'Home exposes every learning domain.',
);
assert.equal(
  (screens.home.match(/data-action="quick-play"/g) ?? []).length,
  0,
  'Home commits to choosing a mode; it does not start a round behind the learner\'s back.',
);
assert.equal(
  screens.home.includes('data-action="open-scope"'),
  false,
  'Home no longer selects geography directly.',
);
// The domain index is the continent list for exactly one domain.
assert.equal(
  (screens.flagsIndex.match(/<button class="continent-row__open"/g) ?? []).length,
  CONTINENTS.length,
  'Flags reaches every continent from its own index.',
);
const shippedLocationContinents = CONTINENTS.filter((continent) => scopeSupportsDomain(
  { kind: 'continent', id: continent.id, label: continent.name },
  'locations',
)).length;
assert.equal(
  (screens.locationsIndex.match(/<button class="continent-row__open"/g) ?? []).length,
  shippedLocationContinents,
  'Locations opens every continent with canonical shipped map coverage.',
);
assert.equal(
  (screens.locationsIndex.match(/continent-row--shell/g) ?? []).length,
  CONTINENTS.length - shippedLocationContinents,
  'Every continent Locations has not shipped is still listed, as an honest shell.',
);
assert.ok(
  screens.locationsIndex.includes('Coming soon'),
  'An unshipped continent names the gap rather than looking playable.',
);
assert.equal(
  screens.locationsIndex.includes('Play world'),
  false,
  'Only Flags offers a world round, because only Flags teaches the world.',
);
assert.ok(
  screens.flagsIndex.includes('>Play world</button>'),
  'The Flags index keeps its world round.',
);
assert.ok(screens.scope.includes('aria-label="Play All Africa"') && screens.scope.includes('Learn Africa'), 'The continent launcher plays the whole continent from its own row and keeps Learn below.');
assert.ok(screens.scope.includes('aria-label="Play West Africa"'), 'Every region plays straight from its row.');
assert.ok(screens.region.includes('aria-label="Play West Africa"') && screens.region.includes('aria-label="Play All Africa"'), 'A region route offers the same one-tap rows.');
assert.ok(!screens.scope.includes('Selected') && !screens.region.includes('Selected'), 'The launcher has one selection method, so nothing is merely selected.');
for (const [name, html] of Object.entries({ scope: screens.scope, region: screens.region })) {
  assert.ok(!html.includes('mini-ledger') && !html.includes('stat-legend'), `${name} launcher stays free of the deleted pre-round ledger and legend.`);
}

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
  answered.includes('answer-feedback--correct') && answered.includes('data-autofocus=""'),
  'After a clean Learn answer, the correct answer becomes the focused advance control.',
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

// --- Hardening ------------------------------------------------------------
// Everything below covers a way the real world breaks the idealised data the
// views are written against: hostile text, a corrupted ledger, a scope with
// nothing in it, and an id the catalog no longer knows.

const { escapeHtml } = await import('../dist/ui/format.js');
const { sanitizeRecord } = await import('../dist/infrastructure/storage.js');

assert.equal(
  escapeHtml('Australia & New Zealand'),
  'Australia &amp; New Zealand',
  'Catalog text is escaped before it reaches markup.',
);
assert.equal(escapeHtml(`a"b'c<d>e&f`), 'a&quot;b&#39;c&lt;d&gt;e&amp;f', 'Every attribute-breaking character is escaped.');

const hostileHtml = renderScope(fresh, { kind: 'region', id: 'west-africa', label: '"><b>x</b>' }, achievements);
assert.ok(!hostileHtml.includes('<script>'), 'A scope label cannot inject markup.');
assert.ok(!hostileHtml.includes('"><b>'), 'A scope label cannot break out of an attribute.');

assert.equal(sanitizeRecord('GHA', null), null, 'A null record is discarded rather than trusted.');
assert.equal(sanitizeRecord('GHA', { status: 'bogus' }), null, 'An unknown learning status is discarded.');

const repaired = sanitizeRecord('GHA', {
  status: 'learning',
  masteryStreak: null,
  lifetimeCorrect: 'seven',
  lifetimeIncorrect: -3,
  retentionLevel: Number.NaN,
  confusionCounts: { MLI: 2, SEN: 'lots' },
});
assert.equal(repaired.masteryStreak, 0, 'A null count is repaired to zero rather than rendered as NaN.');
assert.equal(repaired.lifetimeCorrect, 0, 'A non-numeric count is repaired.');
assert.equal(repaired.lifetimeIncorrect, 0, 'A negative count is repaired.');
assert.equal(repaired.retentionLevel, 0, 'NaN never survives into a record.');
assert.deepEqual(repaired.confusionCounts, { MLI: 2 }, 'Only well-formed confusion counts are kept.');

// Corruption is repaired once, at the storage boundary, so the views can stay
// written against well-formed records. This asserts that contract end to end.
const repairedState = {
  version: 2,
  records: {
    ...fresh.records,
    GHA: sanitizeRecord('GHA', { status: 'learning', masteryStreak: null, lifetimeIncorrect: undefined }),
    MLI: sanitizeRecord('MLI', { status: 'mastered', lifetimeCorrect: '9', lapseCount: null }),
  },
};
const repairedScopeHtml = renderScope(repairedState, { kind: 'region', id: 'west-africa', label: 'West Africa' }, achievements);
assert.ok(!repairedScopeHtml.includes('NaN'), 'A repaired progress state cannot render NaN into a region launcher.');
assert.ok(!repairedScopeHtml.includes('undefined'), 'A repaired progress state cannot render undefined into a region launcher.');

// A record the ledger never had at all: `getRecord` must supply the default
// rather than let the view index into undefined.
const missingRecords = { version: 2, records: {} };
const missingRecordsHtml = renderScope(missingRecords, { kind: 'region', id: 'west-africa', label: 'West Africa' }, achievements);
assert.doesNotThrow(
  () => renderScope(missingRecords, { kind: 'region', id: 'west-africa', label: 'West Africa' }, achievements),
  'A ledger missing every record still renders.',
);
assert.ok(!missingRecordsHtml.includes('undefined'), 'Missing records fall back to Unseen.');

const emptyScopeQuiz = build({
  countries: COUNTRIES,
  progress: fresh,
  scope: { kind: 'region', id: 'west-africa', label: 'West Africa' },
  mode: 'learn',
  size: 10,
  sessionId: 'empty-round',
  targetCountryIds: ['NOT-A-COUNTRY'],
});
assert.equal(emptyScopeQuiz.length, 0, 'A review list of unknown ids builds no questions.');

const staleOptions = {
  ...quizSession,
  questions: [{ ...quizSession.questions[0], optionCountryIds: [quizSession.questions[0].countryId, 'NOPE', 'GONE', 'MISSING'] }],
  currentIndex: 0,
};
const staleHtml = renderQuiz(staleOptions, fresh, null);
assert.ok(!staleHtml.includes('This round could not be built'), 'A stale distractor still leaves an answerable question.');
assert.equal((staleHtml.match(/class="answer-button /g) ?? []).length, 1, 'Options the catalog no longer knows are dropped.');

const staleTarget = { ...quizSession, questions: [{ ...quizSession.questions[0], countryId: 'NOPE' }], currentIndex: 0 };
assert.ok(
  renderQuiz(staleTarget, fresh, null).includes('This round could not be built'),
  'An unresolvable target falls back to the explained dead end, not a thrown render.',
);

const staleMissed = renderResults({
  session: quizSession,
  correct: 0,
  total: 1,
  newlyMastered: [],
  missed: [{ countryId: 'GHA', selectedCountryId: 'NOPE', correct: false }],
});
assert.ok(staleMissed.includes('Answered incorrectly'), 'A mistake against an unknown option still renders a review row.');

assert.ok(renderHome(ledgers, false).includes('storage-notice'), 'A browser that blocks storage is told so on the atlas.');
assert.ok(!renderHome(ledgers, true).includes('storage-notice'), 'The storage notice stays out of the way when storage works.');
assert.ok(
  !renderHome(ledgers, false).includes('role="status"') && !renderHome(ledgers, false).includes('aria-live'),
  'The storage notice is static copy, not another live region inside the replaced #app.',
);

// --- Studying without storage --------------------------------------------
// Safari private browsing throws on every write and a blocked-cookie policy
// throws on every read. Both used to escape `answer()` into the click handler
// and freeze the round on the question that had just been answered, so the
// store is driven here against a localStorage that refuses to cooperate.

const timers = new Set();
globalThis.window = {
  setTimeout: (fn, ms) => {
    const handle = setTimeout(fn, ms);
    timers.add(handle);
    return handle;
  },
  clearTimeout: (handle) => {
    clearTimeout(handle);
    timers.delete(handle);
  },
};
globalThis.performance ??= { now: () => Date.now() };

let storageMode = 'throw-write';
globalThis.localStorage = {
  getItem() {
    if (storageMode === 'throw-read') throw new Error('SecurityError');
    return null;
  },
  setItem() {
    if (storageMode !== 'ok') throw new Error('QuotaExceededError');
  },
  removeItem() {},
};

const { AppStore } = await import('../dist/state/store.js');

for (const mode of ['ok', 'throw-write', 'throw-read']) {
  storageMode = mode;
  const store = new AppStore();
  assert.ok(
    store.startSession({ kind: 'region', id: 'west-africa', label: 'West Africa' }, 'learn'),
    `A round still starts with storage in "${mode}".`,
  );

  assert.doesNotThrow(() => {
    for (let index = 0; index < 3; index += 1) {
      const question = store.session.questions[store.session.currentIndex];
      store.answer(question.optionCountryIds[0]);
      store.advance();
    }
  }, `Answering must not throw with storage in "${mode}".`);

  const touched = Object.values(store.progress.records).filter((record) => record.status !== 'unseen');
  assert.equal(touched.length, 3, `Progress is tracked in memory with storage in "${mode}".`);
  assert.equal(store.persisting, mode === 'ok', `Storage failure is reported for "${mode}".`);
}

const noScope = new AppStore();
assert.equal(
  noScope.startSession({ kind: 'region', id: 'west-africa', label: 'West Africa' }, 'learn', 10, ['NOT-A-COUNTRY']),
  false,
  'A round with nothing to ask reports failure instead of opening an empty quiz.',
);
assert.equal(noScope.view.name, 'home', 'A refused round leaves the learner where they were.');

for (const handle of timers) clearTimeout(handle);

console.log(
  `Verified ${COUNTRIES.length} countries, ${REGIONS.length} regions, mastery transitions, quiz integrity, ` +
    'answer randomization, view rendering, escaping, ledger sanitisation, degraded states, and storage-denied study.',
);
