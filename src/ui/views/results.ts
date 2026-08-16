import { COUNTRY_BY_ID } from '../../data/countries.js';
import type { SessionResult } from '../../domain/models.js';
import { flagImage } from '../components/flag.js';

export function renderResults(result: SessionResult): string {
  const accuracy = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  return `
    <main class="page results-page">
      <header class="sub-header results-header">
        <button class="back-button" data-action="home">×</button>
        <div><p class="eyebrow">ROUND COMPLETE</p><h1>${result.session.scope.label}</h1></div>
      </header>

      <section class="result-score">
        <span class="result-score__number">${result.correct}</span>
        <span class="result-score__denominator">/ ${result.total}</span>
        <strong>${accuracy}%</strong>
      </section>

      <section class="result-summary-grid">
        <div><strong>${result.newlyMastered.length}</strong><span>newly mastered</span></div>
        <div><strong>${result.missed.length}</strong><span>to review</span></div>
      </section>

      ${result.missed.length ? `
        <section class="mistakes-section">
          <div class="section-heading section-heading--tight"><div><p class="eyebrow">REVIEW</p><h2>Missed flags</h2></div></div>
          <div class="mistake-list">
            ${result.missed.map((attempt) => {
              const correct = COUNTRY_BY_ID.get(attempt.countryId)!;
              const selected = COUNTRY_BY_ID.get(attempt.selectedCountryId)!;
              return `<div class="mistake-row">${flagImage(correct, true, 'flag-image--tiny')}<span><strong>${correct.name}</strong><small>You chose ${selected.name}</small></span></div>`;
            }).join('')}
          </div>
        </section>
      ` : `<div class="perfect-note"><strong>Clean round.</strong><span>No missed flags this session.</span></div>`}

      <div class="result-actions">
        ${result.missed.length ? '<button class="button button--primary" data-action="review-mistakes">Review mistakes</button>' : ''}
        <button class="button button--quiet" data-action="repeat-scope">Another round</button>
        <button class="button button--ghost" data-action="home">Back to atlas</button>
      </div>
    </main>
  `;
}
