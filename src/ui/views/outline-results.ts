import { COUNTRY_BY_ID } from '../../data/countries.js';
import type { SessionResult } from '../../domain/models.js';
import { icon } from '../components/icons.js';
import { escapeHtml, exitRoundLabel, repeatRoundLabel } from '../format.js';

export function renderOutlineResults(result: SessionResult): string {
  const accuracy = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  const perfect = result.session.mode === 'test' && result.missed.length === 0;
  const missed = result.missed.flatMap((attempt) => {
    const correct = COUNTRY_BY_ID.get(attempt.countryId);
    if (!correct) return [];
    return [{ correct, selected: COUNTRY_BY_ID.get(attempt.selectedCountryId) }];
  });

  return `
    <main class="page results-page">
      <header class="topbar topbar--detail results-header">
        <button class="icon-button" data-action="exit-round" aria-label="${exitRoundLabel('outlines')}">${icon('close')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" data-autofocus>${escapeHtml(result.session.scope.label)}</h1>
          <span>Outlines · Round complete · ${result.session.mode === 'learn' ? 'Learn' : 'Play'}</span>
        </div>
      </header>

      <section class="result-score${perfect ? ' result-score--perfect' : ''}" aria-label="${result.correct} of ${result.total} correct, ${accuracy} percent">
        <strong>${result.correct}<span>/${result.total}</span></strong>
        <p>${accuracy}% correct</p>
        ${perfect ? '<span class="result-score__badge">Perfect round</span>' : ''}
      </section>

      ${missed.length ? `
        <section class="result-section" aria-labelledby="outline-review-heading">
          <div class="list-heading"><h2 id="outline-review-heading">Review</h2></div>
          <div class="mistake-list">
            ${missed.map(({ correct, selected }) => `
              <div class="outline-mistake-row">
                <strong>${escapeHtml(correct.name)}</strong>
                <small>${selected ? `You chose ${escapeHtml(selected.name)}` : 'Answered incorrectly'}</small>
              </div>
            `).join('')}
          </div>
        </section>
      ` : perfect ? '' : '<p class="clean-round"><strong>Clean round.</strong> No missed outlines.</p>'}

      <div class="result-actions">
        ${missed.length ? '<button class="button button--primary" data-action="review-outline-mistakes">Review mistakes</button>' : ''}
        <button class="button button--secondary" data-action="repeat-outline">${repeatRoundLabel(result.session.mode)}</button>
        <button class="button button--tertiary" data-action="exit-round">${exitRoundLabel('outlines')}</button>
      </div>
    </main>
  `;
}
