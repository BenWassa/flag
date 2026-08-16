import { COUNTRY_BY_ID } from '../../data/countries.js';
import { masteryGoal } from '../../domain/progress.js';
import type { ProgressState, QuizSession } from '../../domain/models.js';
import { flagImage } from '../components/flag.js';

export function renderQuiz(
  session: QuizSession,
  progress: ProgressState,
  answeredCountryId: string | null,
): string {
  const question = session.questions[session.currentIndex];
  const target = COUNTRY_BY_ID.get(question.countryId);
  if (!target) return '<main class="page"><p>Question unavailable.</p></main>';

  const isAnswered = answeredCountryId !== null;
  const currentRecord = progress.records[target.id];
  const pct = ((session.currentIndex + (isAnswered ? 1 : 0)) / session.questions.length) * 100;

  return `
    <main class="quiz-shell">
      <header class="quiz-header">
        <button class="back-button" data-action="exit-quiz" aria-label="Exit quiz">×</button>
        <div class="quiz-header__center">
          <span>${session.scope.label}</span>
          <div class="quiz-progress"><i style="width:${pct}%"></i></div>
        </div>
        <span class="quiz-count">${session.currentIndex + 1}/${session.questions.length}</span>
      </header>

      <section class="question-stage">
        <div class="question-meta">
          <span class="mode-badge">${session.mode}</span>
          <span>${session.mode === 'learn' ? 'Identify the flag' : 'Test'}</span>
        </div>
        <div class="flag-stage">
          ${flagImage(target, isAnswered && session.mode === 'learn')}
        </div>
      </section>

      <section class="answer-panel ${isAnswered ? 'answer-panel--answered' : ''}">
        ${question.optionCountryIds.map((countryId, index) => {
          const country = COUNTRY_BY_ID.get(countryId)!;
          const selected = answeredCountryId === countryId;
          const correct = countryId === target.id;
          let stateClass = '';
          if (isAnswered && session.mode === 'learn') {
            if (correct) stateClass = 'answer-button--correct';
            else if (selected) stateClass = 'answer-button--wrong';
          } else if (selected) {
            stateClass = 'answer-button--selected';
          }

          return `
            <button class="answer-button ${stateClass}" data-action="answer" data-id="${country.id}" ${isAnswered ? 'disabled' : ''}>
              <span class="answer-key">${String.fromCharCode(65 + index)}</span>
              <strong>${country.name}</strong>
            </button>
          `;
        }).join('')}

        ${isAnswered ? feedback(session, target.name, currentRecord.status, currentRecord.masteryStreak, masteryGoal(currentRecord), answeredCountryId === target.id) : ''}
      </section>
    </main>
  `;
}

function feedback(
  session: QuizSession,
  countryName: string,
  status: string,
  streak: number,
  goal: number,
  correct: boolean,
): string {
  if (session.mode === 'test') {
    return `<div class="test-advance" aria-live="polite">Answer recorded</div>`;
  }

  const statusLabel = status === 'mastered' ? 'Mastered' : `Learning ${streak}/${goal}`;
  return `
    <div class="answer-feedback ${correct ? 'answer-feedback--correct' : 'answer-feedback--wrong'}">
      <div><span>${correct ? 'Correct' : 'Review'}</span><strong>${countryName}</strong><small>${statusLabel}</small></div>
      <button class="button button--primary" data-action="next-question">${session.currentIndex === session.questions.length - 1 ? 'Results' : 'Next'}</button>
    </div>
  `;
}
