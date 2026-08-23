import { COUNTRY_BY_ID } from '../../data/countries.js';
import type { OutlineAsset } from '../../domain/outline.js';
import type { ProgressState, QuizSession } from '../../domain/models.js';
import { getRecord } from '../../domain/progress.js';
import { answerFeedback } from '../../domain/round-feedback.js';
import { icon } from '../components/icons.js';
import { outlineSilhouette } from '../components/outline.js';
import { answerFeedbackPanel } from '../components/round-feedback.js';
import { escapeHtml, statusLabel } from '../format.js';

export function renderOutlineQuiz(
  asset: OutlineAsset,
  session: QuizSession,
  progress: ProgressState,
  answeredCountryId: string | null,
): string {
  const question = session.questions[session.currentIndex];
  const target = question ? COUNTRY_BY_ID.get(question.countryId) : undefined;
  const geometry = question ? asset.geometries[question.countryId] : undefined;
  if (!question || !target || !geometry) return unavailable();

  const options = question.optionCountryIds
    .map((countryId) => COUNTRY_BY_ID.get(countryId))
    .filter((country) => country !== undefined);
  if (options.length !== 4 || !options.some((country) => country.id === target.id)) return unavailable();

  const isAnswered = answeredCountryId !== null;
  const isPlay = session.mode === 'test';
  const isLearnFeedback = isAnswered && !isPlay;
  const currentRecord = getRecord(progress, target.id);
  const pct = ((session.currentIndex + (isAnswered ? 1 : 0)) / session.questions.length) * 100;
  const isLastQuestion = session.currentIndex === session.questions.length - 1;

  return `
    <main class="quiz-shell quiz-shell--outline">
      <header class="quiz-header">
        <button class="icon-button" data-action="exit-outline" aria-label="Exit outline quiz">${icon('close')}</button>
        <div class="quiz-header__center">
          <h1 tabindex="-1">${escapeHtml(session.scope.label)}</h1>
          <div class="quiz-progress" role="progressbar" aria-label="Round progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}">
            <i style="--progress:${pct / 100}"></i>
          </div>
        </div>
        <span class="quiz-count">${session.currentIndex + 1}<span>/</span>${session.questions.length}</span>
      </header>

      <section class="question-stage outline-question-stage">
        <div class="question-meta">
          <strong>${session.mode === 'learn' ? 'Learn' : 'Play'}</strong>
          <span>Which country is this?</span>
        </div>
        <div class="outline-stage">
          ${outlineSilhouette(geometry, 'outline-frame--stage')}
        </div>
      </section>

      <section class="answer-panel ${isAnswered ? 'answer-panel--answered' : ''}" aria-label="Answer choices">
        ${options.map((country, index) => {
          const selected = answeredCountryId === country.id;
          const correct = country.id === target.id;
          const continueFromCorrect = isLearnFeedback && selected && correct;
          let stateClass = '';
          if (isAnswered) {
            if (correct) stateClass = 'answer-button--correct';
            else if (selected) stateClass = 'answer-button--wrong';
          }

          const action = continueFromCorrect ? 'next-outline-question' : 'outline-answer';
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

        ${isAnswered ? feedback(session, target.name, statusLabel(currentRecord), answeredCountryId === target.id) : keyboardHint()}
      </section>
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
      ${correct ? '' : `<button class="button button--primary" data-action="next-outline-question" data-autofocus>${session.currentIndex === session.questions.length - 1 ? 'Results' : 'Next'}</button>`}
    </div>
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
        <strong tabindex="-1" data-autofocus>This outline round could not be built</strong>
        <span>The canonical silhouette data is missing. Go back and start the round again.</span>
      </div>
      <div class="result-actions"><button class="button button--primary" data-action="route-parent">Back</button></div>
    </main>
  `;
}
