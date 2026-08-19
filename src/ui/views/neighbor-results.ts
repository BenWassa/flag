import { COUNTRY_BY_ID } from '../../data/countries.js';
import type { NeighborSessionResult } from '../../domain/neighbor-models.js';
import { icon } from '../components/icons.js';
import { escapeHtml } from '../format.js';

export function renderNeighborResults(result: NeighborSessionResult): string {
  const missedNames = result.missedCountryIds
    .map((countryId) => COUNTRY_BY_ID.get(countryId)?.name ?? countryId)
    .map(escapeHtml);

  return `
    <main class="page">
      <header class="topbar topbar--detail">
        <button class="icon-button" data-action="exit-round" aria-label="Exit neighbor results">${icon('close')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" data-autofocus>Round complete</h1>
          <span>Neighbors · ${escapeHtml(result.session.scope.label)}</span>
        </div>
      </header>

      <section class="scope-overview neighbor-results-summary">
        <div class="overview-heading">
          <div>
            <h1>${result.cleanCompletions}/${result.total} clean</h1>
            <p>${result.completed} completed · ${result.exhausted} exhausted</p>
          </div>
        </div>
        <p>A clean completion means every neighbor was found with no wrong guesses. That is the mastery-credit event for this domain.</p>
      </section>

      ${missedNames.length ? `
        <section class="atlas-section" aria-labelledby="neighbor-review-heading">
          <div class="list-heading"><h2 id="neighbor-review-heading">Review</h2><span>${missedNames.length}</span></div>
          <p>${missedNames.join(', ')}</p>
          <button class="button button--primary" data-action="review-neighbors">Review these countries</button>
        </section>
      ` : ''}

      <div class="result-actions">
        <button class="button button--primary" data-action="repeat-neighbors">Repeat scope</button>
        <button class="button button--secondary" data-action="exit-round">Back to scope</button>
      </div>
    </main>
  `;
}
