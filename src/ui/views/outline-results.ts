import { COUNTRY_BY_ID } from '../../data/countries.js';
import type { SessionResult } from '../../domain/models.js';
import { icon } from '../components/icons.js';
import { escapeHtml } from '../format.js';

export function renderOutlineResults(result: SessionResult): string {
  const accuracy = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  const mastered = result.newlyMastered
    .map((id) => COUNTRY_BY_ID.get(id))
    .filter((country) => country !== undefined);
  const missed = result.missed.flatMap((attempt) => {
    const correct = COUNTRY_BY_ID.get(attempt.countryId);
    if (!correct) return [];
    return [{ correct, selected: COUNTRY_BY_ID.get(attempt.selectedCountryId) }];
  });

  return `
    <main class="page results-page">
      <header class="topbar topbar--detail results-header">
        <button class="icon-button" data-action="exit-round" aria-label="Back to ${escapeHtml(result.session.scope.label)} outlines">${icon('close')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" data-autofocus>${escapeHtml(result.session.scope.label)}</h1>
          <span>Outlines · Round complete · ${result.session.mode === 'learn' ? 'Learn' : 'Play'}</span>
        </div>
      </header>

      <section class="result-score" aria-label="${result.correct} of ${result.total} correct, ${accuracy} percent">
        <strong>${result.correct}<span>/${result.total}</span></strong>
        <p>${accuracy}% correct</p>
      </section>

      <div class="result-statline" aria-label="Learning changes">
        <span><strong>${result.newlyMastered.length}</strong> newly mastered</span>
        <span><strong>${result.missed.length}</strong> to review</span>
      </div>

      ${mastered.length ? `
        <section class="result-section" aria-labelledby="outline-mastered-heading">
          <div class="list-heading"><h2 id="outline-mastered-heading">Mastered this round</h2><span>${mastered.length}</span></div>
          <div class="mini-ledger">
            ${mastered.map((country) => `<div class="mini-ledger__row"><strong>${escapeHtml(country.name)}</strong><span class="status-text status-text--mastered">Mastered</span></div>`).join('')}
          </div>
        </section>
      ` : ''}

      ${missed.length ? `
        <section class="result-section" aria-labelledby="outline-review-heading">
          <div class="list-heading"><h2 id="outline-review-heading">Review</h2><span>${missed.length} missed</span></div>
          <div class="mistake-list">
            ${missed.map(({ correct, selected }) => `
              <div class="outline-mistake-row">
                <strong>${escapeHtml(correct.name)}</strong>
                <small>${selected ? `You chose ${escapeHtml(selected.name)}` : 'Answered incorrectly'}</small>
              </div>
            `).join('')}
          </div>
        </section>
      ` : '<p class="clean-round"><strong>Clean round.</strong> No missed outlines.</p>'}

      <div class="result-actions">
        ${missed.length ? '<button class="button button--primary" data-action="review-outline-mistakes">Review mistakes</button>' : ''}
        <button class="button button--secondary" data-action="repeat-outline">Another round</button>
        <button class="button button--tertiary" data-action="exit-round">Back to ${escapeHtml(result.session.scope.label)}</button>
      </div>
    </main>
  `;
}
