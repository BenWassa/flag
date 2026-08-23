import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COUNTRIES, COUNTRY_BY_ID } from '../dist/data/countries.js';
import { AFRICA_MAP_COUNTRY_IDS } from '../dist/data/map-scopes.js';
import { loadMapAsset } from '../dist/data/maps/index.js';
import { loadOutlineAsset } from '../dist/data/outlines.js';
import {
  applyMapGuess,
  buildMapSession,
  createInitialLocationProgress,
} from '../dist/domain/map-game.js';
import { buildOutlineQuiz } from '../dist/domain/outline.js';
import { createInitialProgress } from '../dist/domain/progress.js';
import { buildQuiz } from '../dist/domain/quiz.js';
import {
  answerFeedback,
  roundScore,
  scoreAnnouncement,
  STREAK_DISPLAY_THRESHOLD,
} from '../dist/domain/round-feedback.js';
import { renderMapQuiz } from '../dist/ui/views/map-quiz.js';
import { renderOutlineQuiz } from '../dist/ui/views/outline-quiz.js';
import { renderQuiz } from '../dist/ui/views/quiz.js';

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

/* --- Rendered Flags Play surface --- */

const session = playSession([{ correct: true }, { correct: true }], 2);
const target = session.questions[2];
const targetName = COUNTRY_BY_ID.get(target.countryId).name;
const distractor = target.optionCountryIds.find((id) => id !== target.countryId);

const unanswered = renderQuiz(session, progress, null);
assert.ok(unanswered.includes('round-score'), 'Play shows the live score before the answer is given.');
const scoreValues = [...unanswered.matchAll(/round-score__value">([^<]*)</g)].map(([, value]) => value);
assert.deepEqual(
  scoreValues,
  ['2', '6', '2'],
  'The live score reports correct answers, remaining attempts and the current streak.',
);
assert.ok(unanswered.includes('round-score__item--streak'), 'A qualifying streak is visible during the round.');

const fresh = renderQuiz(playSession([], 0), progress, null);
assert.deepEqual(
  [...fresh.matchAll(/round-score__value">([^<]*)</g)].map(([, value]) => value),
  ['0', '8'],
  'A round opens with a plain zero score and no streak noise.',
);
assert.ok(
  !unanswered.includes('answer-button--correct') && !unanswered.includes('answer-button--wrong'),
  'No outcome state leaks before the learner answers.',
);

const answeredCorrect = renderQuiz(session, progress, target.countryId);
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

const answeredWrong = renderQuiz(session, progress, distractor);
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

const outlineBefore = renderOutlineQuiz(westOutlineAsset, outlineSession, progress, null);
assert.ok(
  !outlineBefore.includes('answer-feedback--correct') && !outlineBefore.includes('answer-feedback--wrong'),
  'Outlines Play reveals no outcome before the answer.',
);
const outlineCorrect = renderOutlineQuiz(westOutlineAsset, outlineSession, progress, outlineTarget.countryId);
assert.ok(outlineCorrect.includes('answer-feedback--correct'), 'Outlines correct feedback uses the shared panel.');
assert.ok(outlineCorrect.includes('answer-button--correct'), 'Outlines marks the correct option during Play feedback.');
assert.ok(!outlineCorrect.includes('Answer recorded'), 'Outlines no longer renders the neutral recorded state.');

const outlineWrong = renderOutlineQuiz(westOutlineAsset, outlineSession, progress, outlineDistractor);
assert.ok(outlineWrong.includes('answer-feedback--wrong'), 'Outlines wrong feedback uses the shared panel.');
assert.ok(outlineWrong.includes('Not quite'), 'Outlines wrong feedback is explicit in text.');
assert.ok(outlineWrong.includes(`Answer: ${outlineTargetName}`), 'Outlines wrong feedback names the correct country.');
assert.ok(
  outlineWrong.includes('answer-button--correct') && outlineWrong.includes('answer-button--wrong'),
  'Outlines marks both the chosen option and the correct option after a miss.',
);
assert.ok(!outlineWrong.includes('Answer recorded'), 'Outlines Play never falls back to the ambiguous recorded state.');

/* --- Locations reuses the same Play feedback contract --- */

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
assert.ok(mapCorrectHtml.includes('answer-feedback--correct'), 'Locations correct feedback uses the shared panel.');
assert.ok(mapCorrectHtml.includes('Correct'), 'Locations correct feedback is explicit in text.');
assert.ok(mapCorrectHtml.includes('map-country--current-correct'), 'Locations correct feedback is also visible on the geography.');
assert.deepEqual(
  [...mapCorrectHtml.matchAll(/round-score__value">([^<]*)</g)].map(([, value]) => value),
  ['1', '0'],
  'Locations updates the visible score during the resolved Play dwell.',
);

let mapWrongSession = buildMapSession(westAsset, 'test', 'locations-play-wrong', ['GHA']);
const mapWrong = applyMapGuess(mapWrongSession, locationProgress, 'MLI', 400);
mapWrongSession = mapWrong.session;
const mapWrongHtml = renderMapQuiz(westAsset, mapWrongSession, null);
assert.ok(mapWrongHtml.includes('answer-feedback--wrong'), 'Locations wrong feedback uses the shared panel.');
assert.ok(mapWrongHtml.includes('Not quite'), 'Locations wrong feedback is explicit in text.');
assert.ok(mapWrongHtml.includes('Answer: Ghana'), 'Locations wrong feedback names the correct country.');
assert.ok(mapWrongHtml.includes('map-country--wrong-pulse'), 'Locations marks the wrong selection on the map.');
assert.ok(mapWrongHtml.includes('map-country--current-correct'), 'Locations simultaneously indicates the actual target after a miss.');
assert.ok(!mapWrongHtml.includes('Answer recorded'), 'Locations no longer renders the ambiguous recorded state.');
assert.equal((mapWrongHtml.match(/data-action="map-answer"/g) ?? []).length, 0, 'Locations locks further answer taps during the resolved feedback dwell.');

const andeanAsset = await loadMapAsset('andean');
assert.ok(andeanAsset, 'Andean asset loads for continent-specific Locations copy verification.');
const andeanSession = buildMapSession(andeanAsset, 'test', 'locations-south-america-copy', ['PER']);
const andeanHtml = renderMapQuiz(andeanAsset, andeanSession, null);
assert.ok(andeanHtml.includes('pan South America'), 'Locations Play names the active continent in pan guidance.');
assert.ok(andeanHtml.includes('South America map with Andean active'), 'Locations map aria copy names the active continent.');
assert.ok(!andeanHtml.includes('pan Africa'), 'Non-Africa Locations rounds no longer leak Africa-specific guidance.');

/* --- Learn is deliberately left quiet / unchanged --- */

const learnSession = { ...playSession([{ correct: true }, { correct: true }], 2), mode: 'learn' };
const learnHtml = renderQuiz(learnSession, progress, null);
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

const flagsRoundSource = readFileSync(new URL('../dist/state/flags-round.js', import.meta.url), 'utf8');
const flagsDwellCorrect = Number(/PLAY_DWELL_CORRECT_MS = (\d+)/.exec(flagsRoundSource)?.[1]);
const flagsDwellWrong = Number(/PLAY_DWELL_WRONG_MS = (\d+)/.exec(flagsRoundSource)?.[1]);
assert.ok(flagsDwellCorrect >= 400, 'A Flags correct answer stays visible long enough to register.');
assert.ok(flagsDwellCorrect <= 900, 'A Flags correct answer does not stall rapid play.');
assert.ok(flagsDwellWrong > flagsDwellCorrect, 'A Flags missed answer gets longer to read than a correct one.');
assert.ok(flagsRoundSource.includes('advanceNow'), 'The Flags Play dwell can be skipped from the keyboard.');

const locationsRoundSource = readFileSync(new URL('../dist/state/locations-round.js', import.meta.url), 'utf8');
const mapDwellCorrect = Number(/PLAY_DWELL_CORRECT_MS = (\d+)/.exec(locationsRoundSource)?.[1]);
const mapDwellWrong = Number(/PLAY_DWELL_WRONG_MS = (\d+)/.exec(locationsRoundSource)?.[1]);
assert.ok(mapDwellCorrect >= 400 && mapDwellCorrect <= 900, 'Locations correct feedback has a readable but quick dwell.');
assert.ok(mapDwellWrong > mapDwellCorrect, 'Locations wrong feedback stays longer for corrective reading.');
assert.ok(mapDwellWrong >= 1200, 'Locations wrong feedback has enough dwell for the answer identity and map correction.');
assert.ok(!locationsRoundSource.includes('Location recorded.'), 'Locations removed the neutral spoken acknowledgement.');
assert.ok(locationsRoundSource.includes('answerFeedback') && locationsRoundSource.includes('scoreAnnouncement'), 'Locations announcements reuse the shared #60 feedback and score contract.');

console.log(
  'Play feedback verification passed: shared Flags/Outlines/Locations outcome model, visible Play scores, scope-correct map guidance, immediate correct/wrong states, non-colour cues, quiet Learn, reduced motion, and outcome-aware dwell.',
);
