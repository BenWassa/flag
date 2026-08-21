import { COUNTRY_BY_ID } from '../../data/countries.js';
import { getRecord } from '../../domain/progress.js';
import { answerFeedback, roundScore } from '../../domain/round-feedback.js';
import type { ProgressState, QuizSession } from '../../domain/models.js';
import { flagImage } from '../components/flag.js';
import { icon } from '../components/icons.js';
import { answerFeedbackPanel, liveScore } from '../components/round-feedback.js';
import { escapeHtml, statusLabel } from '../format.js';

export function renderQuiz(
  session: QuizSession,
  progress: ProgressState,
  answeredCountryId: string | null,
): string {
  const question = session.questions[session.currentIndex];
  const target = question ? COUNTRY_BY_ID.get(question.countryId) : undefined;
  if (!question || !target) return unavailable();

  // Options are resolved before rendering rather than asserted inside the map.
  // An id the catalog no longer knows used to throw from the template and take
  // the whole round down; dropping it leaves a shorter but answerable question.
  const options = question.optionCountryIds
    .map((countryId) => COUNTRY_BY_ID.get(countryId))
    .filter((country) => country !== undefined);
  if (!options.some((country) => country.id === target.id)) return unavailable();

  const isAnswered = answeredCountryId !== null;
  const isPlay = session.mode === 'test';
  const isLearnFeedback = isAnswered && !isPlay;
  const showsOutcome = isAnswered;
  const currentRecord = getRecord(progress, target.id);
  const pct = ((session.currentIndex + (isAnswered ? 1 : 0)) / session.questions.length) * 100;
  const isLastQuestion = session.currentIndex === session.questions.length - 1;
  const score = roundScore(session.attempts, session.questions.length);

  return `
    <main class="quiz-shell">
      <header class="quiz-header">
        <button class="icon-button" data-action="exit-quiz" aria-label="Exit quiz">${icon('close')}</button>
        <div class="quiz-header__center">
          <h1 tabindex="-1">${escapeHtml(session.scope.label)}</h1>
          <div class="quiz-progress" role="progressbar" aria-label="Round progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}">
            <i style="--progress:${pct / 100}"></i>
          </div>
        </div>
        <span class="quiz-count">${session.currentIndex + 1}<span>/</span>${session.questions.length}</span>
      </header>

      <section class="question-stage">
        <div class="question-meta">
          <strong>${isPlay ? 'Play' : 'Learn'}</strong>
          <span>Choose the country</span>
        </div>
        ${isPlay ? liveScore(score) : ''}
        <div class="flag-stage">
          ${flagImage(target, isLearnFeedback, 'flag-frame--stage', true)}
        </div>
      </section>

      <section class="answer-panel ${isAnswered ? 'answer-panel--answered' : ''}" aria-label="Answer choices">
        ${options.map((country, index) => {
          const selected = answeredCountryId === country.id;
          const correct = country.id === target.id;
          const continueFromCorrect = isLearnFeedback && selected && correct;
          let stateClass = '';
          if (showsOutcome) {
            if (correct) stateClass = 'answer-button--correct';
            else if (selected) stateClass = 'answer-button--wrong';
          }

          // A clean Learn answer becomes the continue control in place. This
          // keeps thumb/focus in the task surface while feedback remains visible.
          const action = continueFromCorrect ? 'next-question' : 'answer';
          const disabled = isAnswered && !continueFromCorrect;
          const advanceLabel = isLastQuestion ? 'Results' : 'Next';
          const label = continueFromCorrect
            ? `${index + 1}. ${country.name}. Correct. ${isLastQuestion ? 'Show results.' : 'Continue to the next question.'}`
            : `${index + 1}. ${country.name}`;
          return `
            <button class="answer-button ${stateClass}" data-action="${action}" ${continueFromCorrect ? 'data-autofocus' : ''} data-id="${country.id}" aria-label="${escapeHtml(label)}" ${disabled ? 'disabled' : ''} ${!isAnswered && index === 0 ? 'data-autofocus' : ''}>
              <span class="answer-key" aria-hidden="true">${continueFromCorrect ? icon('chevron') : index + 1}</span>
              <strong>${escapeHtml(country.name)}${continueFromCorrect ? ` · ${advanceLabel}` : ''}</strong>
            </button>
          `;
        }).join('')}

        ${isAnswered ? feedback(session, target.name, statusLabel(currentRecord), answeredCountryId === target.id) : ''}
        ${isAnswered ? '' : keyboardHint()}
      </section>
    </main>
  `;
}

function keyboardHint(): string {
  return `
    <p class="quiz-hint" aria-hidden="true">
      <span><kbd>1</kbd>–<kbd>4</kbd> choose</span>
      <span><kbd>Enter</kbd> next</span>
      <span><kbd>Esc</kbd> exit</span>
    </p>
  `;
}

function unavailable(): string {
  return `
    <main class="page">
      <div class="empty-state">
        <strong tabindex="-1" data-autofocus>This round could not be built</strong>
        <span>The question data is missing. Go back and start the round again.</span>
      </div>
      <div class="result-actions">
        <button class="button button--primary" data-action="home">Back to atlas</button>
      </div>
    </main>
  `;
}

function feedback(
  session: QuizSession,
  countryName: string,
  evidenceLabel: string,
  correct: boolean,
): string {
  if (session.mode === 'test') {
    return answerFeedbackPanel(answerFeedback(correct, countryName));
  }

  return `
    <div class="answer-feedback answer-feedback--${correct ? 'correct' : 'wrong'}">
      <div class="feedback-copy">
        <strong>${correct ? 'Correct' : `Correct: ${escapeHtml(countryName)}`}</strong>
        <span>${escapeHtml(evidenceLabel)}</span>
      </div>
      ${correct ? '' : `<button class="button button--primary" data-action="next-question" data-autofocus>${session.currentIndex === session.questions.length - 1 ? 'Results' : 'Next'}</button>`}
    </div>
  `;
}
