import { CONTINENTS } from '../../data/continents.js';
import { COUNTRIES } from '../../data/countries.js';
import type { ProgressState, StudyScope } from '../../domain/models.js';
import { getScopeStats } from '../../domain/progress.js';
import { supportedDomainsForScope } from '../../domain/scope-support.js';
import { brandMark, icon } from '../components/icons.js';
import { escapeHtml } from '../format.js';

function continentCard(continent: { id: string; name: string }, progress: ProgressState): string {
  const scope: StudyScope = { kind: 'continent', id: continent.id, label: continent.name };
  const stats = getScopeStats(COUNTRIES, progress, scope);
  const domains = supportedDomainsForScope(scope).length;
  const shell = domains < 4;
  const name = escapeHtml(continent.name);

  return `
    <button
      class="atlas-card${shell ? ' atlas-card--shell' : ''}"
      type="button"
      data-action="open-atlas"
      data-id="${escapeHtml(continent.id)}"
    >
      <span class="atlas-card__mark" aria-hidden="true">${icon('globe')}</span>
      <span class="atlas-card__identity">
        <strong>${name}</strong>
        <small>${stats.total} countries</small>
      </span>
      ${shell ? '<span class="atlas-card__shell-note">Flags only</span>' : ''}
    </button>
  `;
}

export function renderHome(progress: ProgressState, persisting = true): string {
  const worldScope: StudyScope = { kind: 'world', label: 'World' };
  const world = getScopeStats(COUNTRIES, progress, worldScope);

  return `
    <main class="page page--home page--atlas">
      <header class="topbar topbar--atlas">
        <div class="brand-block">
          ${brandMark()}
          <h1 class="brand-name" tabindex="-1" data-autofocus>Atlas</h1>
        </div>
        <button class="icon-button" type="button" data-action="open-progress" aria-label="Open progress">
          ${icon('ledger')}
        </button>
      </header>

      ${persisting ? '' : `
        <p class="storage-notice">
          This browser is blocking storage, so today's progress will be lost when you close the tab.
        </p>
      `}

      <h2 class="atlas-eyebrow">Continents</h2>
      <div class="atlas-card-list">
        ${CONTINENTS.map((continent) => continentCard(continent, progress)).join('')}
      </div>

      <button
        class="atlas-utility"
        type="button"
        data-action="quick-play"
        data-domain="flags"
        data-id="flags"
      >Play world flags · ${world.total}</button>
    </main>
  `;
}
