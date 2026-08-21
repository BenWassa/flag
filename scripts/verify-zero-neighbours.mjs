import assert from 'node:assert/strict';
import { COUNTRIES } from '../dist/data/countries.js';
import {
  AFRICA_LAND_ADJACENCY,
  AFRICA_STANDARD_NEIGHBOR_TARGET_IDS,
  AFRICA_ZERO_LAND_NEIGHBOR_IDS,
} from '../dist/data/neighbors/index.js';
import {
  applyNeighborGuess,
  buildNeighborSession,
  createInitialNeighborProgress,
  eligibleNeighborTargets,
  getCountrySuggestions,
  getNeighborRecord,
  getNeighborScopeStats,
  neighborAttemptBudget,
  NO_LAND_NEIGHBORS_ID,
  NO_LAND_NEIGHBORS_LABEL,
} from '../dist/domain/neighbor-game.js';
import { countryIdsForSupportedScope } from '../dist/domain/scope-support.js';
import { renderNeighborQuiz, renderNeighborSuggestions } from '../dist/ui/views/neighbor-quiz.js';

const EAST_AFRICA = { kind: 'region', id: 'east-africa', label: 'East Africa' };
const ISLAND = 'SYC';
const MAINLAND = 'GHA';

/* --- Canonical data is unchanged --- */

assert.deepEqual(
  [...AFRICA_LAND_ADJACENCY[ISLAND]],
  [],
  'Canonical empty adjacency stays empty: no maritime or near-touching neighbour is invented.',
);
for (const id of AFRICA_ZERO_LAND_NEIGHBOR_IDS) {
  assert.equal(AFRICA_LAND_ADJACENCY[id].length, 0, `${id} keeps a genuinely empty land-neighbour set.`);
}

/* --- Eligibility: known adjacency, not non-empty adjacency --- */

const known = eligibleNeighborTargets([ISLAND, MAINLAND], AFRICA_LAND_ADJACENCY);
assert.deepEqual(known, [ISLAND, MAINLAND], 'A known empty set is a learnable target.');
assert.deepEqual(
  eligibleNeighborTargets(['ZZZ'], AFRICA_LAND_ADJACENCY),
  [],
  'Unimplemented curriculum stays unplayable and can never auto-complete a scope.',
);

const eastAfrica = countryIdsForSupportedScope(EAST_AFRICA, 'neighbors');
assert.deepEqual(
  eligibleNeighborTargets(eastAfrica, AFRICA_LAND_ADJACENCY).sort(),
  [...eastAfrica].sort(),
  'Every East Africa curriculum country is now playable, so the region can genuinely complete.',
);
assert.equal(
  getNeighborScopeStats(createInitialNeighborProgress(eastAfrica), eastAfrica, AFRICA_LAND_ADJACENCY).total,
  eastAfrica.length,
  'Scope statistics count the island nations they require for completion.',
);
for (const id of AFRICA_ZERO_LAND_NEIGHBOR_IDS) {
  assert.ok(AFRICA_STANDARD_NEIGHBOR_TARGET_IDS.includes(id), `${id} joins the standard target pool.`);
}

/* --- Clean zero-neighbour retrieval --- */

function islandRound() {
  const progress = createInitialNeighborProgress([ISLAND]);
  const session = buildNeighborSession(
    AFRICA_LAND_ADJACENCY, progress, EAST_AFRICA, [ISLAND], 'test', 'zero-clean', 1, [ISLAND],
  );
  return { progress, session };
}

const fresh = islandRound();
assert.equal(fresh.session.countryIds[0], ISLAND, 'A zero-neighbour country can enter a round.');
assert.equal(fresh.session.targets[ISLAND].attemptBudget, neighborAttemptBudget(0));
assert.equal(fresh.session.targets[ISLAND].resolved, false, 'The target does not resolve itself before an answer.');

const clean = applyNeighborGuess(fresh.session, fresh.progress, NO_LAND_NEIGHBORS_ID, 400);
assert.equal(clean.outcome.kind, 'correct', 'Claiming the empty set is the correct answer for an island nation.');
assert.equal(clean.outcome.resolution, 'complete');
assert.equal(clean.outcome.totalNeighbors, 0);
assert.equal(clean.attempt.evidenceOutcome, 'clean-retrieval', 'Clean zero-neighbour retrieval produces qualifying evidence.');
assert.ok(clean.attempt.evidenceCredit > 0, 'That evidence carries real credit.');
assert.equal(getNeighborRecord(clean.progress, ISLAND).lifetimeCleanCompletions, 1);

/* --- A wrong guess never satisfies an empty set --- */

const misfire = islandRound();
const named = applyNeighborGuess(misfire.session, misfire.progress, 'KEN', 300);
assert.equal(named.outcome.kind, 'wrong', 'Naming a country against an empty set is wrong.');
assert.equal(
  named.outcome.resolved,
  false,
  'Naming a country never completes an empty set, even though 0 found equals 0 required.',
);
assert.equal(named.attempt.evidenceOutcome, 'contradictory');
assert.equal(
  getNeighborRecord(named.progress, ISLAND).confusionCounts[NO_LAND_NEIGHBORS_ID],
  undefined,
  'The reserved answer id never leaks into confusion counts.',
);

const recovered = applyNeighborGuess(named.session, named.progress, NO_LAND_NEIGHBORS_ID, 300);
assert.equal(recovered.outcome.resolution, 'complete');
assert.equal(
  recovered.attempt.evidenceOutcome,
  'assisted-retrieval',
  'A recovered zero-neighbour answer is weaker evidence than a clean one.',
);

const exhausted = applyNeighborGuess(
  applyNeighborGuess(misfire.session, misfire.progress, 'KEN', 300).session,
  named.progress,
  'UGA',
  300,
);
assert.equal(exhausted.outcome.resolution, 'exhausted', 'Two wrong guesses exhaust the zero-neighbour budget.');
assert.deepEqual(exhausted.outcome.revealedIds, [], 'Exhaustion reveals no invented neighbours.');
assert.equal(
  exhausted.attempt.evidenceOutcome,
  'contradictory',
  'A revealed zero-neighbour outcome does not falsely qualify as retrieval.',
);
assert.equal(getNeighborRecord(exhausted.progress, ISLAND).lifetimeCleanCompletions, 0);

/* --- Ordinary n > 0 gameplay is untouched --- */

const mainProgress = createInitialNeighborProgress([MAINLAND]);
const mainSession = buildNeighborSession(
  AFRICA_LAND_ADJACENCY, mainProgress, EAST_AFRICA, [MAINLAND], 'test', 'mainland', 1, [MAINLAND],
);
assert.equal(mainSession.targets[MAINLAND].attemptBudget, neighborAttemptBudget(3), 'n + 2 budget is unchanged.');

let running = { session: mainSession, progress: mainProgress };
for (const neighborId of AFRICA_LAND_ADJACENCY[MAINLAND]) {
  running = applyNeighborGuess(running.session, running.progress, neighborId, 250);
}
assert.equal(running.outcome.resolution, 'complete');
assert.equal(running.attempt.evidenceOutcome, 'clean-retrieval', 'A clean mainland set still qualifies as before.');

const wrongEmptyClaim = applyNeighborGuess(mainSession, mainProgress, NO_LAND_NEIGHBORS_ID, 250);
assert.equal(wrongEmptyClaim.outcome.kind, 'wrong', 'Claiming an empty set for a bordered country is wrong.');
assert.equal(wrongEmptyClaim.outcome.consumedAttempt, true, 'That wrong claim costs an attempt like any other.');
assert.equal(wrongEmptyClaim.outcome.remainingAttempts, 4);

const duplicateClaim = applyNeighborGuess(wrongEmptyClaim.session, wrongEmptyClaim.progress, NO_LAND_NEIGHBORS_ID, 200);
assert.equal(duplicateClaim.outcome.kind, 'duplicate', 'Repeating the claim is a duplicate.');
assert.equal(duplicateClaim.outcome.consumedAttempt, false, 'Duplicates still consume no attempt.');

/* --- The answer is never given away --- */

const islandHtml = renderNeighborQuiz(fresh.session, null, '');
assert.ok(
  islandHtml.includes(`data-id="${NO_LAND_NEIGHBORS_ID}"`),
  'The empty-set claim is an explicit retrieval action, not explanatory text.',
);
assert.ok(islandHtml.includes(NO_LAND_NEIGHBORS_LABEL), 'That action is labelled in British English.');
assert.ok(
  !islandHtml.includes('0 of 0'),
  'An unresolved island never displays a zero total that would hand over the answer.',
);

const mainHtml = renderNeighborQuiz(mainSession, null, '');
assert.ok(
  mainHtml.includes(`data-id="${NO_LAND_NEIGHBORS_ID}"`),
  'The action is present for bordered countries too, so its presence cannot signal an island.',
);
assert.ok(!mainHtml.includes('of 3'), 'The neighbour total is withheld from bordered targets during play as well.');

// The prompt, the set-progress line and the claim action are identical for an
// island and a bordered country. The attempts figure is the one remaining
// indirect signal, because the budget is `n + 2` and Issue #58 deliberately
// leaves the attempt model alone. Assert exactly that, rather than a
// leak-free claim the attempt model cannot support.
const withoutVolatile = (html) => html
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .replace(/\d+ attempts left/, 'N attempts left')
  .replace(/Seychelles|Ghana/g, 'COUNTRY')
  .trim();
assert.equal(
  withoutVolatile(islandHtml),
  withoutVolatile(mainHtml),
  'Apart from the attempt budget, an island round reads exactly like a bordered one before answering.',
);
assert.equal(
  fresh.session.targets[ISLAND].attemptBudget,
  2,
  'The residual signal is the documented n + 2 budget, not a bespoke zero-neighbour affordance.',
);

assert.ok(
  !renderNeighborSuggestions(fresh.session, 'no').includes(NO_LAND_NEIGHBORS_ID),
  'The reserved id never appears in country autocomplete.',
);

/* --- Resolved surfaces tell the truth --- */

const resolvedHtml = renderNeighborQuiz(clean.session, clean.outcome, '');
assert.ok(resolvedHtml.includes(NO_LAND_NEIGHBORS_LABEL), 'A resolved island states its empty set plainly.');
assert.ok(!resolvedHtml.includes('Every land neighbour found'), 'It does not reuse the mainland completion wording.');
assert.ok(!resolvedHtml.includes('Remaining:'), 'It lists no remaining neighbours, because there are none.');

const wrongClaimHtml = renderNeighborQuiz(wrongEmptyClaim.session, wrongEmptyClaim.outcome, '');
assert.ok(
  wrongClaimHtml.includes('does have land neighbours'),
  'A wrong empty-set claim is corrected in words, not by echoing a reserved id.',
);
assert.ok(
  !wrongClaimHtml.replace(/<[^>]*>/g, ' ').includes(NO_LAND_NEIGHBORS_ID),
  'The reserved id stays an attribute value and never reaches visible copy.',
);

/* --- Existing records survive --- */

const legacyProgress = {
  version: 2,
  records: {
    [ISLAND]: { ...getNeighborRecord(createInitialNeighborProgress([ISLAND]), ISLAND), lifetimeRounds: 7, status: 'learning' },
  },
};
const legacySession = buildNeighborSession(
  AFRICA_LAND_ADJACENCY, legacyProgress, EAST_AFRICA, [ISLAND], 'learn', 'legacy', 1, [ISLAND],
);
const legacyStep = applyNeighborGuess(legacySession, legacyProgress, NO_LAND_NEIGHBORS_ID, 300);
assert.equal(
  getNeighborRecord(legacyStep.progress, ISLAND).lifetimeRounds,
  8,
  'Stored Neighbours history is carried forward rather than reset by the new capability.',
);

assert.ok(
  COUNTRIES.some((country) => country.id === ISLAND),
  'The zero-neighbour target remains a canonical ISO3 application country.',
);
assert.ok(
  !getCountrySuggestions(COUNTRIES, new Set([ISLAND]), '', new Set(), 8).some((c) => c.id === NO_LAND_NEIGHBORS_ID),
  'The reserved id is not a country.',
);

console.log(
  'Zero-land-neighbour verification passed: empty adjacency preserved, islands playable and completable, explicit claim required, no answer leak, weaker recovered/exhausted evidence, and existing records intact.',
);
