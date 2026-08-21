import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { COUNTRIES } from '../dist/data/countries.js';
import { AFRICA_MAP_COUNTRY_IDS } from '../dist/data/map-scopes.js';
import {
  AFRICA_LAND_ADJACENCY,
  AFRICA_STANDARD_NEIGHBOR_TARGET_IDS,
  AFRICA_ZERO_LAND_NEIGHBOR_IDS,
} from '../dist/data/neighbors/africa.js';
import { AFRICA_LAND_ADJACENCY as MAP_ADJACENCY } from '../dist/data/maps/africa.js';
import { createInitialLocationProgress, getLocationRecord } from '../dist/domain/map-game.js';
import {
  applyNeighborGuess,
  buildNeighborSession,
  createInitialNeighborProgress,
  getCountrySuggestions,
  getNeighborRecord,
  neighborAttemptBudget,
  neighborMasteryGoal,
  resolveCountryGuess,
} from '../dist/domain/neighbor-game.js';
import { createInitialProgress, getRecord } from '../dist/domain/progress.js';
import { renderNeighborQuiz, renderNeighborSuggestions } from '../dist/ui/views/neighbor-quiz.js';
import { parseRoutePath, serializeRoutePath } from '../dist/routing/routes.js';

assert.deepEqual(AFRICA_LAND_ADJACENCY, MAP_ADJACENCY, 'Lightweight neighbor fixture exactly matches Issue #9 topology output.');
assert.equal(Object.keys(AFRICA_LAND_ADJACENCY).length, 54);
assert.deepEqual(new Set(Object.keys(AFRICA_LAND_ADJACENCY)), new Set(AFRICA_MAP_COUNTRY_IDS));
for (const [countryId, neighbors] of Object.entries(AFRICA_LAND_ADJACENCY)) {
  assert.deepEqual([...neighbors], [...neighbors].sort(), `${countryId} adjacency is deterministic and sorted.`);
  assert.equal(new Set(neighbors).size, neighbors.length, `${countryId} adjacency has no duplicates.`);
  assert.ok(!neighbors.includes(countryId), `${countryId} does not self-link.`);
  for (const neighborId of neighbors) {
    assert.ok(AFRICA_LAND_ADJACENCY[neighborId]?.includes(countryId), `${countryId}<->${neighborId} is symmetric.`);
  }
}

assert.deepEqual(AFRICA_ZERO_LAND_NEIGHBOR_IDS, ['CPV', 'STP', 'COM', 'MDG', 'MUS', 'SYC']);
assert.equal(AFRICA_STANDARD_NEIGHBOR_TARGET_IDS.length, 54, 'Every country with known adjacency is a standard target.');
for (const zeroNeighborId of AFRICA_ZERO_LAND_NEIGHBOR_IDS) {
  assert.ok(
    AFRICA_STANDARD_NEIGHBOR_TARGET_IDS.includes(zeroNeighborId),
    `${zeroNeighborId} is learnable even though its truthful answer is the empty set.`,
  );
}
assert.deepEqual(AFRICA_LAND_ADJACENCY.LSO, ['ZAF'], 'Lesotho enclave resolves to South Africa only.');
assert.deepEqual(AFRICA_LAND_ADJACENCY.GMB, ['SEN'], 'The Gambia is enclosed by Senegal on land.');
assert.ok(AFRICA_LAND_ADJACENCY.AGO.includes('COG'), 'Angola adjacency captures Cabinda/exclave topology.');
assert.deepEqual(AFRICA_LAND_ADJACENCY.GNQ, ['CMR', 'GAB'], 'Multipart Equatorial Guinea adds no maritime neighbors.');
assert.equal(AFRICA_LAND_ADJACENCY.COD.length, 9, 'DR Congo remains the representative high-degree case.');
assert.equal(AFRICA_LAND_ADJACENCY.TZA.length, 8, 'Tanzania retains all topology-derived land neighbors.');
assert.deepEqual(AFRICA_LAND_ADJACENCY.MAR, ['DZA'], 'Western Sahara remains non-scoring context under Issue #9 policy.');
assert.deepEqual(AFRICA_LAND_ADJACENCY.SOM, ['DJI', 'ETH', 'KEN'], 'Somaliland dissolution is inherited through canonical SOM topology.');

const allowed = new Set(Object.keys(AFRICA_LAND_ADJACENCY));
assert.equal(resolveCountryGuess(COUNTRIES, allowed, 'Ivory Coast')?.id, 'CIV');
assert.equal(resolveCountryGuess(COUNTRIES, allowed, "Cote d'Ivoire")?.id, 'CIV');
assert.equal(resolveCountryGuess(COUNTRIES, allowed, 'DRC')?.id, 'COD');
assert.equal(resolveCountryGuess(COUNTRIES, allowed, 'Sao Tome and Principe')?.id, 'STP');
assert.equal(getCountrySuggestions(COUNTRIES, allowed, 'drc', new Set())[0]?.id, 'COD');
assert.equal(getCountrySuggestions(COUNTRIES, allowed, 'cote', new Set())[0]?.id, 'CIV');

const scope = { kind: 'region', id: 'west-africa', label: 'West Africa' };
let progress = createInitialNeighborProgress(Object.keys(AFRICA_LAND_ADJACENCY));
let session = buildNeighborSession(AFRICA_LAND_ADJACENCY, progress, scope, ['GHA'], 'learn', 'duplicate-test', 1, ['GHA']);
assert.equal(session.countryIds[0], 'GHA');
assert.equal(session.targets.GHA.attemptBudget, neighborAttemptBudget(3));
assert.equal(session.targets.GHA.attemptBudget, 5, 'n + 2 gives Ghana five total guesses for three correct neighbors.');

let step = applyNeighborGuess(session, progress, 'BFA', 400);
session = step.session;
progress = step.progress;
assert.equal(step.outcome.kind, 'correct');
assert.equal(step.outcome.remainingAttempts, 4);
const duplicate = applyNeighborGuess(session, progress, 'BFA', 300);
assert.equal(duplicate.outcome.kind, 'duplicate');
assert.equal(duplicate.outcome.consumedAttempt, false);
assert.equal(duplicate.outcome.remainingAttempts, 4, 'Duplicate correct guess does not consume an attempt.');
assert.equal(duplicate.session.targets.GHA.guessedIds.length, 1);

const wrong = applyNeighborGuess(session, progress, 'BEN', 350);
assert.equal(wrong.outcome.kind, 'wrong');
assert.equal(wrong.outcome.consumedAttempt, true);
assert.equal(wrong.outcome.remainingAttempts, 3, 'A wrong unique guess consumes one attempt.');
const wrongDuplicate = applyNeighborGuess(wrong.session, wrong.progress, 'BEN', 200);
assert.equal(wrongDuplicate.outcome.kind, 'duplicate');
assert.equal(wrongDuplicate.outcome.remainingAttempts, 3, 'Duplicate wrong guess is also free.');

let exhaustedProgress = createInitialNeighborProgress(['LSO']);
let exhaustedSession = buildNeighborSession(AFRICA_LAND_ADJACENCY, exhaustedProgress, { kind: 'region', id: 'southern-africa', label: 'Southern Africa' }, ['LSO'], 'learn', 'exhaust', 1, ['LSO']);
for (const wrongId of ['BWA', 'NAM', 'ZWE']) {
  const result = applyNeighborGuess(exhaustedSession, exhaustedProgress, wrongId, 250);
  exhaustedSession = result.session;
  exhaustedProgress = result.progress;
}
assert.equal(exhaustedSession.targets.LSO.resolution, 'exhausted');
assert.deepEqual(exhaustedSession.targets.LSO.revealedIds, ['ZAF'], 'Exhaustion explicitly reveals the remaining correct neighbor.');
assert.equal(getNeighborRecord(exhaustedProgress, 'LSO').revealCount, 1);

function cleanGhanaRound(state, sessionId) {
  let currentSession = buildNeighborSession(AFRICA_LAND_ADJACENCY, state, scope, ['GHA'], 'learn', sessionId, 1, ['GHA']);
  let currentProgress = state;
  for (const countryId of AFRICA_LAND_ADJACENCY.GHA) {
    const result = applyNeighborGuess(currentSession, currentProgress, countryId, 300);
    currentSession = result.session;
    currentProgress = result.progress;
  }
  return { session: currentSession, progress: currentProgress };
}

const flagProgress = createInitialProgress(COUNTRIES);
const locationProgress = createInitialLocationProgress(['GHA']);
progress = createInitialNeighborProgress(['GHA']);
for (const sessionId of ['mastery-1', 'mastery-2', 'mastery-3']) {
  progress = cleanGhanaRound(progress, sessionId).progress;
}
assert.equal(getNeighborRecord(progress, 'GHA').status, 'mastered');
assert.equal(getNeighborRecord(progress, 'GHA').masteryStreak, 3);
assert.equal(neighborMasteryGoal(getNeighborRecord(progress, 'GHA')), 3);
assert.equal(getRecord(flagProgress, 'GHA').status, 'unseen', 'Neighbor mastery does not change flag mastery.');
assert.equal(getLocationRecord(locationProgress, 'GHA').status, 'unseen', 'Neighbor mastery does not change location mastery.');

const masteredSession = buildNeighborSession(AFRICA_LAND_ADJACENCY, progress, scope, ['GHA'], 'learn', 'lapse', 1, ['GHA']);
const lapse = applyNeighborGuess(masteredSession, progress, 'BEN', 300);
assert.equal(getNeighborRecord(lapse.progress, 'GHA').status, 'learning');
assert.equal(getNeighborRecord(lapse.progress, 'GHA').lapseCount, 1);
assert.equal(neighborMasteryGoal(getNeighborRecord(lapse.progress, 'GHA')), 2, 'Post-lapse mastery follows existing two-clean-session convention.');

const uiSession = buildNeighborSession(AFRICA_LAND_ADJACENCY, createInitialNeighborProgress(['GHA']), scope, ['GHA'], 'learn', 'ui', 1, ['GHA']);
const html = renderNeighborQuiz(uiSession, null, '');
assert.ok(html.includes('data-neighbor-input'));
assert.ok(html.includes('data-autofocus'));
assert.ok(html.includes('enterkeyhint="go"'));
assert.ok(html.includes('autocomplete="off"'));
assert.ok(html.includes('aria-autocomplete="list"'));
assert.ok(html.includes('<strong>0</strong> neighbours found'), 'Initial UI shows zero completed neighbours.');
assert.ok(
  !html.includes('of 3'),
  'The neighbour total stays hidden during play so an empty set is not given away.',
);
const uiStep = applyNeighborGuess(uiSession, createInitialNeighborProgress(['GHA']), 'BFA', 200);
const suggestionHtml = renderNeighborSuggestions(uiStep.session, 'burk');
assert.ok(!suggestionHtml.includes('data-id="BFA"'), 'Completed neighbors disappear from autocomplete suggestions.');

const neighborRoute = parseRoutePath('/neighbors/africa/west-africa/learn');
assert.ok(neighborRoute && neighborRoute.name === 'learning' && neighborRoute.domain === 'neighbors');
assert.equal(serializeRoutePath(neighborRoute), '/neighbors/africa/west-africa/learn');

const storageSource = await readFile('src/infrastructure/neighbor-storage.ts', 'utf8');
assert.ok(storageSource.includes('flag-atlas:neighbor-progress:v1'));
assert.ok(storageSource.includes('flag-atlas:neighbor-attempts:v1'));
assert.ok(!storageSource.includes('flag-atlas:location-progress:v1'));
assert.ok(!storageSource.includes('flag-atlas:progress:v2'));
const appSource = await readFile('src/app.ts', 'utf8');
const neighborsRoundSource = await readFile('src/state/neighbors-round.ts', 'utf8');
assert.ok(neighborsRoundSource.includes("routeForScope('neighbors'"), 'Neighbours uses the shared Issue #10 route constructor.');
assert.ok(
  neighborsRoundSource.includes("finishInteraction(outcome.resolved ? null : '[data-neighbor-input]')"),
  'Sequential guesses restore input focus while the target remains active.',
);
assert.ok(appSource.includes("root.addEventListener('submit'"), 'Enter-to-submit uses the native form path.');
const css = await readFile('src/styles/neighbors.css', 'utf8');
assert.ok(css.includes('min-height: 50px'), 'Mobile entry and suggestion rows exceed the 44px touch minimum.');
assert.ok(css.includes('max-height: min(34dvh, 270px)'), 'Autocomplete is bounded so the virtual keyboard does not bury the task status.');
assert.ok(!/#[0-9a-f]{3,8}\b/i.test(css), 'Neighbor CSS uses shared design tokens only.');
const generationSource = await readFile('scripts/generate-neighbor-fixture.mjs', 'utf8');
assert.ok(generationSource.includes("src/data/maps/africa.ts"), 'Lightweight fixture is mechanically extracted from Issue #9 generated topology output.');
assert.ok(generationSource.includes('Asymmetric generated adjacency'), 'Fixture generation fails on asymmetric topology output.');
const fixtureBefore = await readFile('src/data/neighbors/africa.ts', 'utf8');
assert.ok(fixtureBefore.startsWith('// GENERATED FIXTURE. Do not hand-edit adjacency.'));
const regeneration = spawnSync(process.execPath, ['scripts/generate-neighbor-fixture.mjs'], { encoding: 'utf8' });
assert.equal(regeneration.status, 0, regeneration.stderr || 'Neighbor fixture regeneration failed.');
const fixtureAfter = await readFile('src/data/neighbors/africa.ts', 'utf8');
assert.equal(fixtureAfter, fixtureBefore, 'Regenerating from unchanged Issue #9 topology is byte-stable.');

console.log('Neighbours verification passed: topology fixture, difficult cases, aliases, attempt accounting, mastery isolation, mobile autocomplete, storage, routes, and byte-stable regeneration.');
