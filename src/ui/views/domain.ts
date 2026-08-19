import { CONTINENTS, REGIONS } from '../../data/continents.js';
import { COUNTRIES } from '../../data/countries.js';
import { AFRICA_MAP_COUNTRY_IDS } from '../../data/map-scopes.js';
import {
  AFRICA_LAND_ADJACENCY,
  AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS,
  AFRICA_ZERO_LAND_NEIGHBOR_IDS,
  getAfricaNeighborScopeConfig,
} from '../../data/neighbors/index.js';
import { getLocationScopeStats } from '../../domain/map-game.js';
import type { LocationProgressState } from '../../domain/map-models.js';
import { getNeighborScopeStats } from '../../domain/neighbor-game.js';
import type { NeighborProgressState } from '../../domain/neighbor-models.js';
import type { LearningDomain, ProgressState, StudyScope } from '../../domain/models.js';
import { getScopeStats } from '../../domain/progress.js';
import { icon } from '../components/icons.js';
import { progressStrip, statLegend } from '../components/progress.js';
import { escapeHtml } from '../format.js';

export function renderDomainHome(
  domain: LearningDomain,
  progress: ProgressState,
  locationProgress: LocationProgressState,
  outlineProgress: ProgressState,
  neighborProgress: NeighborProgressState,
  persisting = true,
  mapPersisting = true,
  outlinePersisting = true,
  neighborPersisting = true,
): string {
  if (domain === 'flags') return renderFlagsHome(progress, persisting);
  if (domain === 'locations') return renderLocationsHome(locationProgress, mapPersisting);
  if (domain === 'outlines') return renderOutlinesHome(outlineProgress, outlinePersisting);
  return renderNeighborsHome(neighborProgress, neighborPersisting);
}

function renderFlagsHome(progress: ProgressState, persisting: boolean): string {
  const worldScope: StudyScope = { kind: 'world', label: 'World' };
  const world = getScopeStats(COUNTRIES, progress, worldScope);

  return `
    <main class="page">
      <header class="topbar topbar--detail">
        <button class="icon-button" data-action="route-parent" aria-label="Back to learning domains">${icon('back')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" data-autofocus>Flags</h1>
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
        ${statLegend(world)}
        <div class="primary-actions">
          <button class="button button--primary" data-action="start-learn">Learn world</button>
          <button class="button button--secondary" data-action="start-test">Test world</button>
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
              <button class="continent-row" data-action="open-scope" data-domain="flags" data-id="${continent.id}">
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

function renderLocationsHome(progress: LocationProgressState, persisting: boolean): string {
  const stats = getLocationScopeStats(progress, AFRICA_MAP_COUNTRY_IDS);
  const progressStats = { ...stats, due: 0 };

  return `
    <main class="page">
      <header class="topbar topbar--detail">
        <button class="icon-button" data-action="route-parent" aria-label="Back to learning domains">${icon('back')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" data-autofocus>Locations</h1>
          <span>Country locations · Africa available</span>
        </div>
      </header>

      <section class="atlas-section" aria-labelledby="location-continents-heading">
        <div class="list-heading">
          <h2 id="location-continents-heading">Continents</h2>
          <span>1 available</span>
        </div>
        <div class="continent-list">
          <button class="continent-row" data-action="open-scope" data-domain="locations" data-id="africa">
            <span class="continent-row__identity">
              <strong>Africa</strong>
              <small>54 countries · 5 regions · Learn or test</small>
            </span>
            <span class="continent-row__progress">${progressStrip(progressStats)}</span>
            <span class="continent-row__score"><strong>${stats.mastered}</strong><small>/${stats.total}</small></span>
            ${icon('chevron')}
          </button>
        </div>
      </section>

      ${persisting ? '' : `<p class="storage-notice">This browser is blocking storage, so location progress will last only for this visit.</p>`}
    </main>
  `;
}

function renderOutlinesHome(progress: ProgressState, persisting: boolean): string {
  const scope: StudyScope = { kind: 'continent', id: 'africa', label: 'Africa' };
  const stats = getScopeStats(COUNTRIES, progress, scope);

  return `
    <main class="page">
      <header class="topbar topbar--detail">
        <button class="icon-button" data-action="route-parent" aria-label="Back to learning domains">${icon('back')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" data-autofocus>Outlines</h1>
          <span>Country silhouettes · Africa available</span>
        </div>
      </header>

      <section class="atlas-section" aria-labelledby="outline-continents-heading">
        <div class="list-heading">
          <h2 id="outline-continents-heading">Continents</h2>
          <span>1 available</span>
        </div>
        <div class="continent-list">
          <button class="continent-row" data-action="open-scope" data-domain="outlines" data-id="africa">
            <span class="continent-row__identity">
              <strong>Africa</strong>
              <small>54 countries · 5 regions · Learn or test</small>
            </span>
            <span class="continent-row__progress">${progressStrip(stats)}</span>
            <span class="continent-row__score"><strong>${stats.mastered}</strong><small>/${stats.total}</small></span>
            ${icon('chevron')}
          </button>
        </div>
      </section>

      ${persisting ? '' : `<p class="storage-notice">This browser is blocking storage, so outline progress will last only for this visit.</p>`}
    </main>
  `;
}

function renderNeighborsHome(progress: NeighborProgressState, persisting: boolean): string {
  const countryIds = getAfricaNeighborScopeConfig('africa')?.countryIds ?? [];
  const stats = getNeighborScopeStats(progress, countryIds, AFRICA_LAND_ADJACENCY);
  const progressStats = { ...stats, due: 0 };
  return `
    <main class="page">
      <header class="topbar topbar--detail">
        <button class="icon-button" data-action="route-parent" aria-label="Back to learning domains">${icon('back')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" data-autofocus>Neighbors</h1>
          <span>Land-border sets · Africa available</span>
        </div>
      </header>
      <section class="atlas-section" aria-labelledby="neighbor-continents-heading">
        <div class="list-heading"><h2 id="neighbor-continents-heading">Continents</h2><span>1 available</span></div>
        <div class="continent-list">
          <button class="continent-row" data-action="open-scope" data-domain="neighbors" data-id="africa">
            <span class="continent-row__identity">
              <strong>Africa</strong>
              <small>${stats.total} standard targets · ${AFRICA_ZERO_LAND_NEIGHBOR_IDS.length} zero-neighbor excluded · ${AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS.length} coverage-deferred</small>
            </span>
            <span class="continent-row__progress">${progressStrip(progressStats)}</span>
            <span class="continent-row__score"><strong>${stats.mastered}</strong><small>/${stats.total}</small></span>
            ${icon('chevron')}
          </button>
        </div>
      </section>
      ${persisting ? '' : `<p class="storage-notice">This browser is blocking storage, so neighbor progress will last only for this visit.</p>`}
    </main>
  `;
}
