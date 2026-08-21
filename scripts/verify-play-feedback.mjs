import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COUNTRIES, COUNTRY_BY_ID } from '../dist/data/countries.js';
import { createInitialProgress } from '../dist/domain/progress.js';
import { buildQuiz } from '../dist/domain/quiz.js';
import {
  answerFeedback,
  roundScore,
  scoreAnnouncement,
  STREAK_DISPLAY_THRESHOLD,
} from '../dist/domain/round-feedback.js';
import { renderQuiz } from '../dist/ui/views/quiz.js';

const AFRICA = { kind: 'continent', id: 'africa', label: 'Africa' };
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

/* --- Rendered Play surface --- */

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

/* --- Learn is deliberately left quiet --- */

const learnSession = { ...playSession([{ correct: true }, { correct: true }], 2), mode: 'learn' };
const learnHtml = renderQuiz(learnSession, progress, null);
assert.ok(!learnHtml.includes('round-score'), 'Learn stays low-pressure and carries no live score.');

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

const roundSource = readFileSync(new URL('../dist/state/flags-round.js', import.meta.url), 'utf8');
const dwellCorrect = Number(/PLAY_DWELL_CORRECT_MS = (\d+)/.exec(roundSource)?.[1]);
const dwellWrong = Number(/PLAY_DWELL_WRONG_MS = (\d+)/.exec(roundSource)?.[1]);
assert.ok(dwellCorrect >= 400, 'A correct answer stays visible long enough to register.');
assert.ok(dwellCorrect <= 900, 'A correct answer does not stall rapid play.');
assert.ok(dwellWrong > dwellCorrect, 'A missed answer gets longer to read than a correct one.');
assert.ok(roundSource.includes('advanceNow'), 'The Play dwell can be skipped from the keyboard.');

console.log(
  'Play feedback verification passed: live score model, immediate correct/wrong states, non-colour cues, quiet Learn, reduced motion, and skippable Play dwell.',
);
