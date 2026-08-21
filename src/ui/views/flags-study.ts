import { CONTINENTS, REGIONS } from '../../data/continents.js';
import { COUNTRIES } from '../../data/countries.js';
import type { Country, StudyScope } from '../../domain/models.js';
import { countriesInScope } from '../../domain/progress.js';
import { flagImage } from '../components/flag.js';
import { icon } from '../components/icons.js';
import { escapeHtml } from '../format.js';

interface StudyGroup {
  label: string;
  countries: Country[];
}

/**
 * Learn is a browse-and-reveal study surface, not a slower Play. Nothing here
 * scores an answer or touches a learning ledger: revealing a name is study, and
 * retrieval evidence belongs to Play.
 */
export function renderFlagsStudy(
  scope: StudyScope,
  revealedIds: ReadonlySet<string>,
  revealAll: boolean,
): string {
  const countries = countriesInScope(COUNTRIES, scope);
  if (!countries.length) {
    return `
      <main class="page">
        <div class="empty-state">
          <strong tabindex="-1" data-autofocus>No flags to study here</strong>
          <span>This scope has no flags yet. Choose another region.</span>
        </div>
        <div class="result-actions">
          <button class="button button--primary" data-action="launcher-parent">Back</button>
        </div>
      </main>
    `;
  }

  const groups = groupsFor(scope, countries);
  let index = 0;

  return `
    <main class="page">
      <header class="topbar topbar--detail">
        <button class="icon-button" data-action="launcher-parent" aria-label="Back">${icon('back')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" data-autofocus>${escapeHtml(scope.label)}</h1>
          <span>Learn · ${countries.length} flags</span>
        </div>
      </header>

      <div class="study-toolbar">
        <button class="button button--secondary" type="button" data-action="toggle-all-names" aria-pressed="${revealAll}">
          ${revealAll ? 'Hide names' : 'Reveal all'}
        </button>
        <button class="button button--primary" type="button" data-action="start-test">Play ${escapeHtml(scope.label)}</button>
      </div>

      <p class="study-hint">Tap a flag to reveal its country.</p>

      ${groups.map((group) => `
        <section class="study-group" aria-label="${escapeHtml(group.label)}">
          ${groups.length > 1 ? `<h2 class="study-group__heading">${escapeHtml(group.label)}</h2>` : ''}
          <ul class="flag-gallery">
            ${group.countries.map((country) => {
              index += 1;
              return card(country, index, countries.length, revealAll || revealedIds.has(country.id));
            }).join('')}
          </ul>
        </section>
      `).join('')}
    </main>
  `;
}

/**
 * A hidden card must not carry the country name anywhere — not in the visible
 * text, not in the image alt, not in the accessible name — or the answer leaks
 * to assistive technology before the learner has looked.
 */
function card(country: Country, position: number, total: number, revealed: boolean): string {
  const hiddenLabel = `Flag ${position} of ${total}. Reveal the country.`;
  return `
    <li class="flag-gallery__item">
      <button
        class="flag-card ${revealed ? 'flag-card--revealed' : ''}"
        type="button"
        data-action="reveal-flag"
        data-id="${country.id}"
        data-hidden-label="${escapeHtml(hiddenLabel)}"
        aria-expanded="${revealed}"
        ${revealed ? '' : `aria-label="${escapeHtml(hiddenLabel)}"`}
      >
        ${flagImage(country, revealed, 'flag-frame--card')}
        <span class="flag-card__name" data-flag-name>${revealed ? escapeHtml(country.name) : ''}</span>
      </button>
    </li>
  `;
}

/**
 * Large scopes get one heading level of geography so the gallery stays
 * scannable; a single region is already small enough to read straight through.
 */
function groupsFor(scope: StudyScope, countries: Country[]): StudyGroup[] {
  if (scope.kind === 'region') return [{ label: scope.label, countries }];

  if (scope.kind === 'continent') {
    return REGIONS
      .filter((region) => region.continentId === scope.id)
      .map((region) => ({
        label: region.name,
        countries: countries.filter((country) => country.regionId === region.id),
      }))
      .filter((group) => group.countries.length > 0);
  }

  return CONTINENTS
    .map((continent) => ({
      label: continent.name,
      countries: countries.filter((country) => country.continentId === continent.id),
    }))
    .filter((group) => group.countries.length > 0);
}
