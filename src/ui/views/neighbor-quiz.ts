import { COUNTRIES, COUNTRY_BY_ID } from '../../data/countries.js';
import { AFRICA_LAND_ADJACENCY } from '../../data/neighbors/index.js';
import { currentNeighborTarget, getCountrySuggestions } from '../../domain/neighbor-game.js';
import type { NeighborGuessOutcome, NeighborSession } from '../../domain/neighbor-models.js';
import { icon } from '../components/icons.js';
import { escapeHtml } from '../format.js';

const ALLOWED_COUNTRY_IDS = new Set(Object.keys(AFRICA_LAND_ADJACENCY));

function countryName(countryId: string): string {
  return COUNTRY_BY_ID.get(countryId)?.name ?? countryId;
}

export function renderNeighborQuiz(
  session: NeighborSession,
  lastOutcome: NeighborGuessOutcome | null,
  query = '',
): string {
  const target = currentNeighborTarget(session);
  if (!target) return '<main class="page"><p>No neighbor target is active.</p></main>';
  const country = COUNTRY_BY_ID.get(target.countryId);
  const questionNumber = session.currentIndex + 1;
  const attemptsUsed = target.guessedIds.length;
  const remainingAttempts = Math.max(0, target.attemptBudget - attemptsUsed);
  const progressPercent = target.neighborIds.length === 0 ? 0 : (target.foundIds.length / target.neighborIds.length) * 100;

  return `
    <main class="page neighbor-quiz-page">
      <header class="topbar topbar--detail neighbor-quiz-header">
        <button class="icon-button" data-action="exit-round" aria-label="Exit neighbor round">${icon('close')}</button>
        <div class="screen-title">
          <h1 tabindex="-1">${escapeHtml(country?.name ?? target.countryId)}</h1>
          <span>${session.mode === 'learn' ? 'Learn' : 'Test'} · ${escapeHtml(session.scope.label)} · ${questionNumber}/${session.countryIds.length}</span>
        </div>
      </header>

      <section class="neighbor-task" aria-labelledby="neighbor-prompt">
        <div class="neighbor-status-line">
          <div>
            <h2 id="neighbor-prompt">Name every land-border neighbor</h2>
            <p><strong>${target.foundIds.length} of ${target.neighborIds.length}</strong> neighbors found</p>
          </div>
          <div class="neighbor-attempts" aria-label="${remainingAttempts} attempts remaining">
            <strong>${remainingAttempts}</strong><span>attempts left</span>
          </div>
        </div>
        <div class="neighbor-progress" aria-hidden="true"><span style="transform: scaleX(${Math.max(0, Math.min(1, progressPercent / 100))})"></span></div>

        ${renderFound(target.foundIds)}
        ${target.resolved ? renderResolution(target) : renderEntry(session, query)}
        ${renderFeedback(lastOutcome)}
      </section>
    </main>
  `;
}

function renderFound(foundIds: readonly string[]): string {
  if (!foundIds.length) return '<p class="neighbor-found-empty">Correct neighbors will collect here.</p>';
  return `
    <div class="neighbor-found" aria-label="Neighbors found">
      ${foundIds.map((countryId) => `<span><strong>${escapeHtml(countryName(countryId))}</strong><small>Found</small></span>`).join('')}
    </div>
  `;
}

function renderEntry(session: NeighborSession, query: string): string {
  const target = currentNeighborTarget(session);
  if (!target) return '';
  return `
    <form class="neighbor-entry" data-neighbor-form autocomplete="off">
      <label for="neighbor-country-input">Country</label>
      <div class="neighbor-input-row">
        <input id="neighbor-country-input" data-neighbor-input name="country" type="search" value="${escapeHtml(query)}" placeholder="Type a country name" autocomplete="off" autocapitalize="words" spellcheck="false" enterkeyhint="go" aria-autocomplete="list" aria-controls="neighbor-suggestions" />
        <button class="button button--primary" type="submit">Submit</button>
      </div>
      <div id="neighbor-suggestions" class="neighbor-suggestions" role="listbox" aria-label="Country suggestions">
        ${renderNeighborSuggestions(session, query)}
      </div>
    </form>
  `;
}

export function renderNeighborSuggestions(session: NeighborSession, query: string): string {
  const target = currentNeighborTarget(session);
  if (!target) return '';
  const excluded = new Set([...target.guessedIds, target.countryId]);
  const suggestions = getCountrySuggestions(COUNTRIES, ALLOWED_COUNTRY_IDS, query, excluded, query.trim() ? 8 : 6);
  if (!suggestions.length) return '<p class="neighbor-suggestions__empty">No matching country.</p>';
  return suggestions.map((country) => `
    <button type="button" role="option" class="neighbor-suggestion" data-action="neighbor-guess" data-id="${country.id}">
      <span>${escapeHtml(country.name)}</span>
      ${country.aliases?.length && query.trim() ? `<small>${escapeHtml(country.aliases[0] ?? '')}</small>` : ''}
    </button>
  `).join('');
}

function renderFeedback(outcome: NeighborGuessOutcome | null): string {
  if (!outcome) return '';
  if (outcome.kind === 'duplicate') {
    return '<p class="neighbor-feedback">Already guessed. No attempt used.</p>';
  }
  if (outcome.kind === 'correct') {
    return `<p class="neighbor-feedback neighbor-feedback--correct">Correct: ${escapeHtml(countryName(outcome.selectedCountryId))}.</p>`;
  }
  return `<p class="neighbor-feedback neighbor-feedback--wrong">${escapeHtml(countryName(outcome.selectedCountryId))} is not in this neighbor set.</p>`;
}

function renderResolution(target: NonNullable<ReturnType<typeof currentNeighborTarget>>): string {
  const clean = target.resolution === 'complete' && target.wrongGuesses === 0;
  const remaining = target.neighborIds.filter((countryId) => !target.foundIds.includes(countryId));
  return `
    <div class="neighbor-resolution" data-autofocus tabindex="-1">
      <strong>${target.resolution === 'complete' ? (clean ? 'Complete — clean set' : 'Complete') : 'Attempts exhausted'}</strong>
      ${remaining.length ? `<p>Remaining: ${remaining.map((countryId) => escapeHtml(countryName(countryId))).join(', ')}</p>` : '<p>Every land neighbor found.</p>'}
      <button class="button button--primary" data-action="next-neighbor">Next</button>
    </div>
  `;
}
