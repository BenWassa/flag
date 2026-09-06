import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COUNTRIES, COUNTRY_BY_ID } from '../.verify-dist/data/countries.js';
import { AFRICA_MAP_COUNTRY_IDS } from '../.verify-dist/data/map-scopes.js';
import { loadMapAsset } from '../.verify-dist/data/maps/index.js';
import { loadOutlineAsset } from '../.verify-dist/data/outlines.js';
import {
  applyMapGuess,
  buildMapSession,
  createInitialLocationProgress,
} from '../.verify-dist/domain/map-game.js';
import { buildOutlineQuiz } from '../.verify-dist/domain/outline.js';
import { createInitialProgress } from '../.verify-dist/domain/progress.js';
import { buildQuiz } from '../.verify-dist/domain/quiz.js';
import {
  answerFeedback,
  roundRank,
  roundScore,
  scoreAnnouncement,
  streakTier,
  STREAK_DISPLAY_THRESHOLD,
  STREAK_TIER_MARKS,
  STREAK_TIER_THRESHOLDS,
} from '../.verify-dist/domain/round-feedback.js';
import { loadScreens, renderScreen } from './lib/react-markup.mjs';

const { FlagsQuizScreen, OutlineQuizScreen } = await loadScreens('RecognitionScreens.js');
const { LocationQuizScreen } = await loadScreens('LocationScreens.js');

const renderQuiz = (session, answeredCountryId) => renderScreen(FlagsQuizScreen, {
  session,
  progress,
  answeredCountryId,
});
const renderOutlineQuiz = (asset, session, answeredCountryId) => renderScreen(OutlineQuizScreen, {
  asset,
  session,
  progress,
  answeredCountryId,
});
const renderMapQuiz = (asset, session, lastWrongCountryId) => renderScreen(LocationQuizScreen, {
  asset,
  session,
  lastWrongCountryId,
});

const AFRICA = { kind: 'continent', id: 'africa', label: 'Africa' };
const WEST_AFRICA = { kind: 'region', id: 'west-africa', label: 'West Africa' };
const progress = createInitialProgress(COUNTRIES);

function playSession(attempts = [], currentIndex = attempts.length) {
  return {
    id: 'play-feedback',
    mode: 'test',
    scope: AFRICA,
    startedAt: new Date().toISOString(),
    questions: buildQuiz({
      countries: COUNTRIES,
      progress,
      scope: AFRICA,
      mode: 'test',
      size: 8,
      sessionId: 'play-feedback',
    }),
    currentIndex,
    attempts,
  };
}

/* --- Score model --- */

const empty = roundScore([], 8);
assert.deepEqual(
  empty,
  { correct: 0, answered: 0, remaining: 8, total: 8, streak: 0 },
  'A fresh round starts with a full remaining budget and no streak.',
);

const mixed = roundScore(
  [{ correct: true }, { correct: false }, { correct: true }, { correct: true }],
  8,
);
assert.equal(mixed.correct, 3, 'Score counts every correct attempt in the round.');
assert.equal(mixed.answered, 4, 'Answered counts attempts used.');
assert.equal(mixed.remaining, 4, 'Remaining is the unused attempt budget.');
assert.equal(mixed.streak, 2, 'Streak is the trailing run of correct answers only.');

assert.equal(
  roundScore([{ correct: true }, { correct: false }], 8).streak,
  0,
  'A missed answer resets the streak.',
);
assert.equal(
  roundScore(Array.from({ length: 12 }, () => ({ correct: true })), 8).remaining,
  0,
  'Remaining never falls below zero if attempts exceed the question count.',
);

/* --- Feedback contract --- */

const correct = answerFeedback(true, 'Kenya');
const wrong = answerFeedback(false, 'Kenya');
assert.equal(correct.tone, 'correct', 'A clean answer carries the correct tone.');
assert.equal(wrong.tone, 'wrong', 'A missed answer carries the wrong tone.');
assert.notEqual(correct.title, wrong.title, 'Feedback states differ by wording, not only by tone.');
assert.ok(wrong.detail.includes('Kenya'), 'A missed answer names the country that was asked for.');

assert.ok(
  scoreAnnouncement(roundScore([{ correct: true }, { correct: true }], 8)).includes('Streak 2'),
  'The spoken summary carries a qualifying streak.',
);
assert.ok(
  !scoreAnnouncement(roundScore([{ correct: true }], 8)).includes('Streak'),
  'A single correct answer is not yet a streak.',
);
assert.equal(STREAK_DISPLAY_THRESHOLD, 2, 'Streaks surface from two consecutive correct answers.');

/* --- Streak tiers stay presentation-free momentum --- */

assert.equal(streakTier(0), null, 'No streak has no tier.');
assert.equal(streakTier(STREAK_DISPLAY_THRESHOLD), null, 'A visible streak is not yet a tier.');
assert.equal(streakTier(STREAK_TIER_THRESHOLDS.warm), 'warm');
assert.equal(streakTier(STREAK_TIER_THRESHOLDS.hot - 1), 'warm', 'A tier holds until the next threshold.');
assert.equal(streakTier(STREAK_TIER_THRESHOLDS.hot), 'hot');
assert.equal(streakTier(STREAK_TIER_THRESHOLDS.blazing), 'blazing');
assert.equal(streakTier(999), 'blazing', 'The top tier is the top: streaks do not keep escalating.');
assert.ok(
  STREAK_TIER_THRESHOLDS.warm < STREAK_TIER_THRESHOLDS.hot
    && STREAK_TIER_THRESHOLDS.hot < STREAK_TIER_THRESHOLDS.blazing,
  'Streak tiers ascend.',
);
assert.deepEqual(
  new Set(Object.values(STREAK_TIER_MARKS)).size,
  3,
  'Every tier carries its own count of marks, so a tier is never colour alone.',
);
assert.equal(
  streakTier(roundScore([{ correct: true }, { correct: true }, { correct: false }], 8).streak),
  null,
  'A missed answer takes the tier with the streak: nothing about it is durable.',
);

/* --- The round rank is transient result feedback, not standing --- */

assert.equal(roundRank(10, 10).id, 'flawless');
assert.equal(roundRank(9, 10).id, 'strong');
assert.equal(roundRank(7, 10).id, 'solid');
assert.equal(roundRank(4, 10).id, 'building');
assert.equal(roundRank(0, 0).id, 'building', 'An empty round scores nothing rather than scoring perfectly.');
for (const [correctCount, total] of [[10, 10], [9, 10], [7, 10], [4, 10], [0, 0]]) {
  const rank = roundRank(correctCount, total);
  assert.ok(rank.label && rank.detail, `Rank ${rank.id} states itself in words.`);
  assert.equal(rank.label.includes('Perfect round'), false, 'The rank never restates the Perfect round ceremony.');
}
assert.equal(
  new Set([roundRank(10, 10).label, roundRank(9, 10).label, roundRank(7, 10).label, roundRank(4, 10).label]).size,
  4,
  'Ranks differ by wording, not only by identifier.',
);

/* --- Rendered Flags Play surface --- */

const session = playSession([{ correct: true }, { correct: true }], 2);
const target = session.questions[2];
const targetName = COUNTRY_BY_ID.get(target.countryId).name;
const distractor = target.optionCountryIds.find((id) => id !== target.countryId);

const unanswered = renderQuiz(session, null);
assert.ok(unanswered.includes('round-score'), 'Play shows the live score before the answer is given.');
const scoreValues = [...unanswered.matchAll(/round-score__value">([^<]*)</g)].map(([, value]) => value);
assert.deepEqual(
  scoreValues,
  ['2', '6', '2'],
  'The live score reports correct answers, remaining attempts and the current streak.',
);
assert.ok(unanswered.includes('round-score__item--streak'), 'A qualifying streak is visible during the round.');

const fresh = renderQuiz(playSession([], 0), null);
assert.deepEqual(
  [...fresh.matchAll(/round-score__value">([^<]*)</g)].map(([, value]) => value),
  ['0', '8'],
  'A round opens with a plain zero score and no streak noise.',
);
assert.ok(
  !unanswered.includes('answer-button--correct') && !unanswered.includes('answer-button--wrong'),
  'No outcome state leaks before the learner answers.',
);

const answeredCorrect = renderQuiz(session, target.countryId);
assert.ok(
  answeredCorrect.includes('answer-feedback--correct'),
  'A correct Play answer shows immediate correct feedback in the same render.',
);
assert.ok(answeredCorrect.includes('Correct'), 'Correct feedback is readable without relying on colour.');
assert.ok(
  answeredCorrect.includes('answer-button--correct'),
  'The chosen answer is marked correct on the option itself.',
);
assert.ok(
  !answeredCorrect.includes('Answer recorded'),
  'Play no longer hides the outcome behind a neutral acknowledgement.',
);

const answeredWrong = renderQuiz(session, distractor);
assert.ok(
  answeredWrong.includes('answer-feedback--wrong'),
  'A missed Play answer shows immediate corrective feedback.',
);
assert.ok(answeredWrong.includes('Not quite'), 'Wrong feedback is readable without relying on colour.');
assert.ok(
  answeredWrong.includes(targetName),
  'A missed Play answer reveals the country that was actually being asked for.',
);
assert.ok(
  answeredWrong.includes('answer-button--correct') && answeredWrong.includes('answer-button--wrong'),
  'A missed Play answer marks both the chosen option and the true answer.',
);
assert.ok(
  !answeredWrong.includes('data-action="next-question"'),
  'Play advances on its own dwell rather than adding a manual advance control.',
);

assert.ok(
  !answeredCorrect.includes('aria-live') && !answeredWrong.includes('aria-live'),
  'Announcements stay in the persistent live region, not in re-rendered feedback nodes.',
);

/* --- Outlines reuses the same Play feedback contract --- */

const westOutlineAsset = await loadOutlineAsset('west-africa');
assert.ok(westOutlineAsset, 'West Africa asset loads for Outlines feedback verification.');
const outlineQuestions = buildOutlineQuiz({
  countries: COUNTRIES,
  progress,
  scope: WEST_AFRICA,
  mode: 'test',
  size: 1,
  sessionId: 'outlines-play-feedback',
  asset: westOutlineAsset,
});
assert.equal(outlineQuestions.length, 1, 'Outlines builds a Play question for feedback verification.');
const outlineSession = {
  id: 'outlines-play-feedback',
  mode: 'test',
  scope: WEST_AFRICA,
  startedAt: new Date().toISOString(),
  questions: outlineQuestions,
  currentIndex: 0,
  attempts: [],
};
const outlineTarget = outlineQuestions[0];
const outlineTargetName = COUNTRY_BY_ID.get(outlineTarget.countryId).name;
const outlineDistractor = outlineTarget.optionCountryIds.find((id) => id !== outlineTarget.countryId);

const outlineBefore = renderOutlineQuiz(westOutlineAsset, outlineSession, null);
assert.ok(outlineBefore.includes('round-score'), 'Outlines Play shows the same live score contract as Flags and Locations.');
assert.deepEqual(
  [...outlineBefore.matchAll(/round-score__value\">([^<]*)/g)].map(([, value]) => value),
  ['0', '1'],
  'Outlines Play opens with the correct/left score and no artificial exemption.',
);
assert.ok(
  !outlineBefore.includes('answer-feedback--correct') && !outlineBefore.includes('answer-feedback--wrong'),
  'Outlines Play reveals no outcome before the answer.',
);
const outlineCorrect = renderOutlineQuiz(westOutlineAsset, outlineSession, outlineTarget.countryId);
assert.ok(outlineCorrect.includes('answer-feedback--correct'), 'Outlines correct feedback uses the shared panel.');
assert.ok(outlineCorrect.includes('answer-button--correct'), 'Outlines marks the correct option during Play feedback.');
assert.ok(!outlineCorrect.includes('Answer recorded'), 'Outlines no longer renders the neutral recorded state.');

const outlineWrong = renderOutlineQuiz(westOutlineAsset, outlineSession, outlineDistractor);
assert.ok(outlineWrong.includes('answer-feedback--wrong'), 'Outlines wrong feedback uses the shared panel.');
assert.ok(outlineWrong.includes('Not quite'), 'Outlines wrong feedback is explicit in text.');
assert.ok(outlineWrong.includes(`Answer: ${outlineTargetName}`), 'Outlines wrong feedback names the correct country.');
assert.ok(
  outlineWrong.includes('answer-button--correct') && outlineWrong.includes('answer-button--wrong'),
  'Outlines marks both the chosen option and the correct option after a miss.',
);
assert.ok(!outlineWrong.includes('Answer recorded'), 'Outlines Play never falls back to the ambiguous recorded state.');

/* --- Locations uses graded three-strike Play feedback --- */

const westAsset = await loadMapAsset('west-africa');
assert.ok(westAsset, 'West Africa asset loads for Locations feedback verification.');
const locationProgress = createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS);

let mapCorrectSession = buildMapSession(westAsset, 'test', 'locations-play-correct', ['GHA']);
const mapBefore = renderMapQuiz(westAsset, mapCorrectSession, null);
assert.ok(!mapBefore.includes('answer-feedback--correct') && !mapBefore.includes('answer-feedback--wrong'), 'Locations Play reveals no outcome before the tap.');
assert.deepEqual(
  [...mapBefore.matchAll(/round-score__value">([^<]*)</g)].map(([, value]) => value),
  ['0', '1'],
  'Locations Play renders the same visible correct/left score contract as Flags.',
);
const mapCorrect = applyMapGuess(mapCorrectSession, locationProgress, 'GHA', 400);
mapCorrectSession = mapCorrect.session;
const mapCorrectHtml = renderMapQuiz(westAsset, mapCorrectSession, null);
assert.ok(mapCorrectHtml.includes('answer-feedback--correct'), 'Locations first-try feedback uses the correct panel.');
assert.ok(mapCorrectHtml.includes('First try'), 'Locations first-try feedback is explicit in text.');
assert.ok(mapCorrectHtml.includes('map-country--current-correct'), 'Locations first-try feedback is also visible on the geography.');
assert.deepEqual(
  [...mapCorrectHtml.matchAll(/round-score__value">([^<]*)</g)].map(([, value]) => value),
  ['1', '0'],
  'Locations updates the visible score during the resolved Play dwell.',
);

let mapWrongSession = buildMapSession(westAsset, 'test', 'locations-play-wrong', ['GHA']);
const firstMiss = applyMapGuess(mapWrongSession, locationProgress, 'MLI', 400);
mapWrongSession = firstMiss.session;
const firstMissHtml = renderMapQuiz(westAsset, mapWrongSession, 'MLI');
assert.ok(firstMissHtml.includes('answer-feedback--neutral'), 'Locations unresolved miss uses neutral feedback.');
assert.ok(!firstMissHtml.includes('answer-feedback--wrong'), 'Locations unresolved miss does not use the failure tone.');
assert.ok(firstMissHtml.includes('2 tries left'), 'Locations first miss communicates the remaining retry budget.');
assert.ok(firstMissHtml.includes('map-country--wrong-pulse'), 'Locations marks the wrong selection transiently on the map.');
assert.ok(!firstMissHtml.includes('map-country--current-correct'), 'Locations unresolved miss does not reveal the target.');
assert.ok(!firstMissHtml.includes('Answer: Ghana'), 'Locations unresolved miss does not leak the answer in text.');
assert.ok((firstMissHtml.match(/data-action="map-answer"/g) ?? []).length > 0, 'Locations keeps answer controls available after the first miss.');

const assisted = applyMapGuess(mapWrongSession, firstMiss.progress, 'GHA', 450);
mapWrongSession = assisted.session;
const assistedHtml = renderMapQuiz(westAsset, mapWrongSession, null);
assert.ok(assistedHtml.includes('answer-feedback--neutral'), 'Locations assisted success stays distinct from clean green feedback.');
assert.ok(assistedHtml.includes('After 1 miss'), 'Locations assisted success states the miss count in words.');
assert.ok(assistedHtml.includes('map-country--one-miss'), 'Locations one-miss success uses the amber graded geography state.');
assert.ok(!assistedHtml.includes('map-country--current-correct'), 'Locations assisted success is not overridden by clean green emphasis.');
assert.equal((assistedHtml.match(/data-action="map-answer"/g) ?? []).length, 0, 'Locations locks further answer taps only after resolution.');

let revealSession = buildMapSession(westAsset, 'test', 'locations-play-reveal', ['GHA']);
const revealMiss1 = applyMapGuess(revealSession, locationProgress, 'MLI', 500);
const revealMiss2 = applyMapGuess(revealMiss1.session, revealMiss1.progress, 'SEN', 550);
const revealMiss3 = applyMapGuess(revealMiss2.session, revealMiss2.progress, 'CIV', 600);
revealSession = revealMiss3.session;
const revealHtml = renderMapQuiz(westAsset, revealSession, null);
assert.ok(revealHtml.includes('answer-feedback--wrong'), 'Locations third miss uses the failure tone.');
assert.ok(revealHtml.includes('Revealed'), 'Locations third miss explicitly identifies the reveal outcome.');
assert.ok(revealHtml.includes('Ghana'), 'Locations reveal names the correct country only after the third miss.');
assert.ok(revealHtml.includes('map-country--revealed'), 'Locations reveal paints the correct country with the failure state.');
assert.equal((revealHtml.match(/data-action="map-answer"/g) ?? []).length, 0, 'Locations locks further answer taps after reveal.');

const andeanAsset = await loadMapAsset('andean');
assert.ok(andeanAsset, 'Andean asset loads for continent-specific Locations copy verification.');
const andeanSession = buildMapSession(andeanAsset, 'test', 'locations-south-america-copy', ['PER']);
const andeanHtml = renderMapQuiz(andeanAsset, andeanSession, null);
assert.ok(andeanHtml.includes('pan South America'), 'Locations Play names the active continent in pan guidance.');
assert.ok(andeanHtml.includes('South America map with Andean active'), 'Locations map aria copy names the active continent.');
assert.ok(!andeanHtml.includes('pan Africa'), 'Non-Africa Locations rounds no longer leak Africa-specific guidance.');

/* --- Learn is deliberately left quiet / unchanged --- */

const learnSession = { ...playSession([{ correct: true }, { correct: true }], 2), mode: 'learn' };
const learnHtml = renderQuiz(learnSession, null);
assert.ok(!learnHtml.includes('round-score'), 'Flags Learn stays low-pressure and carries no live score.');
const mapLearn = buildMapSession(westAsset, 'learn', 'locations-learn-unchanged', ['GHA']);
const mapLearnHtml = renderMapQuiz(westAsset, mapLearn, null);
assert.ok(mapLearnHtml.includes('Tap the country'), 'Locations Learn retains its existing guided instruction.');
assert.ok(!mapLearnHtml.includes('round-score'), 'Locations Learn stays low-pressure and carries no live score.');
assert.ok(!mapLearnHtml.includes('answer-feedback'), 'Locations Learn does not inherit the Play feedback panel.');

/* --- Presentation and motion contracts --- */

const baseCss = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
const themeCss = readFileSync(new URL('../dist/atlas-theme.css', import.meta.url), 'utf8');

assert.ok(baseCss.includes('.round-score'), 'The live score has a base presentation.');
for (const tone of ['correct', 'wrong', 'neutral']) {
  assert.ok(
    themeCss.includes(`.answer-feedback--${tone}`),
    `The shared feedback contract styles the ${tone} tone.`,
  );
}
assert.ok(
  themeCss.includes('@keyframes answer-feedback-in'),
  'Feedback uses a lightweight entrance transition.',
);
assert.ok(
  /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation-duration: \.01ms !important/.test(themeCss),
  'Reduced-motion users receive no information through animation alone.',
);

/* --- Round timing keeps rapid play viable --- */

const timingSource = readFileSync(new URL('../.verify-dist/state/play-feedback-timing.js', import.meta.url), 'utf8');
const sharedCorrect = Number(/PLAY_FEEDBACK_DWELL_CORRECT_MS = (\d+)/.exec(timingSource)?.[1]);
const sharedWrong = Number(/PLAY_FEEDBACK_DWELL_WRONG_MS = (\d+)/.exec(timingSource)?.[1]);
assert.ok(sharedCorrect >= 400 && sharedCorrect <= 900, 'Shared correct feedback has a readable but quick dwell.');
assert.ok(sharedWrong > sharedCorrect && sharedWrong >= 1200, 'Shared wrong feedback gets longer to read than a correct answer.');

for (const [label, file] of [
  ['Flags', 'flags-round.js'],
  ['Locations', 'locations-round.js'],
  ['Outlines', 'outlines-round.js'],
]) {
  const source = readFileSync(new URL(`../.verify-dist/state/${file}`, import.meta.url), 'utf8');
  assert.ok(source.includes('playFeedbackDwellMs'), `${label} Play consumes the shared domain-neutral dwell policy.`);
}
const flagsRoundSource = readFileSync(new URL('../.verify-dist/state/flags-round.js', import.meta.url), 'utf8');
const outlinesRoundSource = readFileSync(new URL('../.verify-dist/state/outlines-round.js', import.meta.url), 'utf8');
assert.ok(flagsRoundSource.includes('advanceNow'), 'The Flags Play dwell can be skipped from the keyboard.');
assert.ok(outlinesRoundSource.includes('advanceNow'), 'The Outlines Play dwell can be skipped from the keyboard.');

console.log(
  'Play feedback verification passed: shared Flags/Outlines feedback, graded three-strike Locations outcomes, visible Play scores, scope-correct map guidance, non-colour cues, quiet Learn, reduced motion, and outcome-aware dwell.',
);
