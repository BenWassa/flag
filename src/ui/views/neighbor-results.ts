import { COUNTRY_BY_ID } from '../../data/countries.js';
import { domainDisplayName } from '../../domain/display.js';
import type { NeighborSessionResult } from '../../domain/neighbor-models.js';
import { icon } from '../components/icons.js';
import { escapeHtml, exitRoundLabel, repeatRoundLabel } from '../format.js';

export function renderNeighborResults(result: NeighborSessionResult): string {
  const perfect = result.session.mode === 'test' && result.missedCountryIds.length === 0;
  const missedNames = result.missedCountryIds
    .map((countryId) => COUNTRY_BY_ID.get(countryId)?.name ?? countryId)
    .map(escapeHtml);

  return `
    <main class="page">
      <header class="topbar topbar--detail">
        <button class="icon-button" data-action="exit-round" aria-label="${exitRoundLabel('neighbors')}">${icon('close')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" data-autofocus>Round complete</h1>
          <span>${domainDisplayName('neighbors')} · ${escapeHtml(result.session.scope.label)}</span>
        </div>
      </header>

      <section class="scope-overview neighbor-results-summary${perfect ? ' result-score--perfect' : ''}">
        <div class="overview-heading">
          <div>
            <h1>${result.cleanCompletions}/${result.total} clean</h1>
            <p>${result.completed} completed · ${result.exhausted} exhausted</p>
          </div>
        </div>
        <p>A clean completion means every neighbour was found with no wrong guesses.</p>
        ${perfect ? '<span class="result-score__badge">Perfect round</span>' : ''}
      </section>

      ${missedNames.length ? `
        <section class="atlas-section" aria-labelledby="neighbor-review-heading">
          <div class="list-heading"><h2 id="neighbor-review-heading">Review</h2></div>
          <p>${missedNames.join(', ')}</p>
          <button class="button button--primary" data-action="review-neighbors">Review these countries</button>
        </section>
      ` : ''}

      <div class="result-actions">
        <button class="button button--secondary" data-action="repeat-neighbors">${repeatRoundLabel(result.session.mode)}</button>
        <button class="button button--tertiary" data-action="exit-round">${exitRoundLabel('neighbors')}</button>
      </div>
    </main>
  `;
}
