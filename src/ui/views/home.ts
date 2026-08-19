import { CONTINENTS, REGIONS } from '../../data/continents.js';
import { COUNTRIES } from '../../data/countries.js';
import type { ProgressState, StudyScope } from '../../domain/models.js';
import { getScopeStats } from '../../domain/progress.js';
import { brandMark, icon } from '../components/icons.js';
import { progressStrip, statLegend } from '../components/progress.js';
import { escapeHtml } from '../format.js';

export function renderHome(progress: ProgressState, persisting = true): string {
  const worldScope: StudyScope = { kind: 'world', label: 'World' };
  const world = getScopeStats(COUNTRIES, progress, worldScope);

  return `
    <main class="page page--home">
      <header class="topbar">
        <div class="brand-block">
          ${brandMark()}
          <span class="brand-name">Flag Atlas</span>
        </div>
        <button class="text-icon-button" data-action="open-progress" aria-label="Open progress">
          ${icon('ledger')}
          <span>Progress</span>
        </button>
      </header>

      <section class="world-overview" aria-labelledby="world-heading">
        <div class="overview-heading">
          <div>
            <h1 id="world-heading" tabindex="-1" data-autofocus>World flags</h1>
            <p>Learn by region. Keep what you know.</p>
          </div>
          <div class="mastery-total" aria-label="${world.mastered} of ${world.total} flags mastered">
            <strong>${world.mastered}</strong><span>/ ${world.total}</span>
            <small>mastered</small>
          </div>
        </div>
        ${progressStrip(world)}
        ${statLegend(world)}
        <div class="primary-actions">
          <button class="button button--primary" data-action="start-world-learn">Learn world</button>
          <button class="button button--secondary" data-action="start-world-test">Test world</button>
        </div>
      </section>

      ${persisting ? '' : `
        <p class="storage-notice">
          This browser is blocking storage, so today's progress will be lost when you close the tab.
          Leaving private browsing keeps your ledger.
        </p>
      `}

      <section class="map-entry-section" aria-labelledby="locations-heading">
        <div class="list-heading">
          <h2 id="locations-heading">Country locations</h2>
          <span>Pilot</span>
        </div>
        <button class="map-entry-row" data-action="open-map-pilot">
          <span class="map-entry-row__identity">
            <strong>West Africa</strong>
            <small>16 countries · Learn or test on the map</small>
          </span>
          <span class="map-entry-row__meta">Locations</span>
          ${icon('chevron')}
        </button>
      </section>

      <section class="atlas-section" aria-labelledby="continents-heading">
        <div class="list-heading">
          <h2 id="continents-heading">Continents</h2>
          <span>${world.total} flags</span>
        </div>
        <div class="continent-list">
          ${CONTINENTS.map((continent) => {
            const scope: StudyScope = { kind: 'continent', id: continent.id, label: continent.name };
            const stats = getScopeStats(COUNTRIES, progress, scope);
            const regions = REGIONS.filter((region) => region.continentId === continent.id).length;
            return `
              <button class="continent-row" data-action="open-continent" data-id="${continent.id}">
                <span class="continent-row__identity">
                  <strong>${escapeHtml(continent.name)}</strong>
                  <small>${stats.total} flags · ${regions} regions</small>
                </span>
                <span class="continent-row__progress">${progressStrip(stats)}</span>
                <span class="continent-row__score"><strong>${stats.mastered}</strong><small>/${stats.total}</small></span>
                ${icon('chevron')}
              </button>
            `;
          }).join('')}
        </div>
      </section>
    </main>
  `;
}
