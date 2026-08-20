import { CONTINENTS, REGIONS } from '../../data/continents.js';
import { COUNTRIES } from '../../data/countries.js';
import { domainDisplayName } from '../../domain/display.js';
import type { LearningDomain, ProgressState, StudyScope } from '../../domain/models.js';
import { getScopeStats } from '../../domain/progress.js';
import { icon } from '../components/icons.js';
import { progressStrip } from '../components/progress.js';
import { escapeHtml } from '../format.js';

export function renderDomainHome(
  domain: LearningDomain,
  progress: ProgressState,
  persisting = true,
): string {
  if (domain !== 'flags') {
    throw new Error(`Only Flags has a domain index; ${domain} canonicalises to its Africa launcher.`);
  }
  return renderFlagsHome(progress, persisting);
}

function renderFlagsHome(progress: ProgressState, persisting: boolean): string {
  const worldScope: StudyScope = { kind: 'world', label: 'World' };
  const world = getScopeStats(COUNTRIES, progress, worldScope);

  return `
    <main class="page">
      <header class="topbar topbar--detail">
        <button class="icon-button" type="button" data-action="route-parent" aria-label="Back to learning domains">${icon('back')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" data-autofocus>${domainDisplayName('flags')}</h1>
          <span>World · ${world.total} countries</span>
        </div>
      </header>

      <section class="world-overview" aria-labelledby="world-heading">
        <div class="overview-heading">
          <div>
            <h1 id="world-heading">World</h1>
            <p>Learn by continent or region. Keep what you know.</p>
          </div>
          <div class="mastery-total" aria-label="${world.mastered} of ${world.total} flags mastered">
            <strong>${world.mastered}</strong><span>/ ${world.total}</span>
            <small>mastered</small>
          </div>
        </div>
        ${progressStrip(world)}
        <div class="primary-actions">
          <button class="button button--primary" type="button" data-action="start-learn">Learn world</button>
          <button class="button button--secondary" type="button" data-action="start-test">Play world</button>
        </div>
      </section>

      ${persisting ? '' : `
        <p class="storage-notice">
          This browser is blocking storage, so today's flag progress will be lost when you close the tab.
        </p>
      `}

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
              <div class="continent-row">
                <button
                  class="continent-row__open"
                  type="button"
                  data-action="open-scope"
                  data-domain="flags"
                  data-id="${continent.id}"
                >
                  <span class="continent-row__identity">
                    <strong>${escapeHtml(continent.name)}</strong>
                    <small>${stats.total} flags · ${regions} regions</small>
                  </span>
                  <span class="continent-row__progress">${progressStrip(stats)}</span>
                  <span class="continent-row__score"><strong>${stats.mastered}</strong><small>/${stats.total}</small></span>
                  ${icon('chevron')}
                </button>
                <button
                  class="continent-row__play"
                  type="button"
                  data-action="quick-play"
                  data-domain="flags"
                  data-id="${continent.id}"
                  aria-label="Play ${escapeHtml(continent.name)} flags"
                >${icon('play')}</button>
              </div>
            `;
          }).join('')}
        </div>
      </section>
    </main>
  `;
}
