import { COUNTRY_BY_ID } from '../../data/countries.js';
import type { SessionResult } from '../../domain/models.js';
import { flagImage } from '../components/flag.js';
import { icon } from '../components/icons.js';
import { escapeHtml, exitRoundLabel, repeatRoundLabel } from '../format.js';

export function renderResults(result: SessionResult): string {
  const accuracy = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  const strongEvidence = result.newlyMastered
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
        <button class="icon-button" data-action="exit-round" aria-label="${exitRoundLabel('flags')}">${icon('close')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" data-autofocus>${escapeHtml(result.session.scope.label)}</h1>
          <span>Flags · Round complete · ${result.session.mode === 'learn' ? 'Learn' : 'Play'}</span>
        </div>
      </header>

      <section class="result-score" aria-label="${result.correct} of ${result.total} correct, ${accuracy} percent">
        <strong>${result.correct}<span>/${result.total}</span></strong>
        <p>${accuracy}% correct</p>
      </section>

      <div class="result-statline" aria-label="Learning changes">
        <span><strong>${result.newlyMastered.length}</strong> newly strong</span>
        <span><strong>${result.missed.length}</strong> to review</span>
      </div>

      ${strongEvidence.length ? `
        <section class="result-section" aria-labelledby="strong-evidence-heading">
          <div class="list-heading"><h2 id="strong-evidence-heading">Strong evidence this round</h2><span>${strongEvidence.length}</span></div>
          <div class="mastery-list">
            ${strongEvidence.map((country) => `
              <div class="mastery-row">
                ${flagImage(country, true, 'flag-frame--tiny')}
                <strong>${escapeHtml(country.name)}</strong>
                <span>Strong</span>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      ${missed.length ? `
        <section class="result-section" aria-labelledby="review-heading">
          <div class="list-heading"><h2 id="review-heading">Review</h2><span>${missed.length} missed</span></div>
          <div class="mistake-list">
            ${missed.map(({ correct, selected }) => `
              <div class="mistake-row">
                ${flagImage(correct, true, 'flag-frame--tiny')}
                <span>
                  <strong>${escapeHtml(correct.name)}</strong>
                  <small>${selected ? `You chose ${escapeHtml(selected.name)}` : 'Answered incorrectly'}</small>
                </span>
              </div>
            `).join('')}
          </div>
        </section>
      ` : '<p class="clean-round"><strong>Clean round.</strong> No missed flags.</p>'}

      <div class="result-actions">
        ${missed.length ? '<button class="button button--primary" data-action="review-mistakes">Review mistakes</button>' : ''}
        <button class="button button--secondary" data-action="repeat-scope">${repeatRoundLabel(result.session.mode)}</button>
        <button class="button button--tertiary" data-action="exit-round">${exitRoundLabel('flags')}</button>
      </div>
    </main>
  `;
}
