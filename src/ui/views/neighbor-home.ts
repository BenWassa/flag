import { COUNTRY_BY_ID } from '../../data/countries.js';
import { AFRICA_MAP_REGION_CONFIGS } from '../../data/map-scopes.js';
import {
  AFRICA_LAND_ADJACENCY,
  AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS,
  getAfricaNeighborScopeConfig,
} from '../../data/neighbors/index.js';
import { domainDisplayName } from '../../domain/display.js';
import { getNeighborRecord, getNeighborScopeStats, neighborMasteryGoal } from '../../domain/neighbor-game.js';
import type { NeighborProgressState } from '../../domain/neighbor-models.js';
import type { StudyScope } from '../../domain/models.js';
import { icon } from '../components/icons.js';
import { progressStrip, statLegend } from '../components/progress.js';
import { escapeHtml } from '../format.js';

export function renderNeighborHome(
  progress: NeighborProgressState,
  scope: StudyScope,
  persisting = true,
): string {
  const config = getAfricaNeighborScopeConfig(scope.id ?? 'africa');
  if (!config) {
    return `<main class="page"><h1 tabindex="-1" data-autofocus>Neighbour scope unavailable</h1><button class="button" data-action="route-parent">Back</button></main>`;
  }

  const stats = getNeighborScopeStats(progress, config.countryIds, AFRICA_LAND_ADJACENCY);
  const progressStats = { ...stats, due: 0 };
  const zeroCount = config.countryIds.filter((countryId) => (AFRICA_LAND_ADJACENCY[countryId]?.length ?? 0) === 0).length;
  const isAfrica = config.scope.kind === 'continent';

  return `
    <main class="page">
      <header class="topbar topbar--detail">
        <button class="icon-button" data-action="route-parent" aria-label="Back one level">${icon('back')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" data-autofocus>${escapeHtml(config.scope.label)}</h1>
          <span>${domainDisplayName('neighbors')} · ${isAfrica ? 'Continent' : 'Region'} · ${stats.total} standard targets</span>
        </div>
      </header>

      <section class="scope-overview" aria-label="${escapeHtml(config.scope.label)} neighbour learning status">
        <div class="scope-status-line">
          <strong>${stats.mastered} mastered</strong>
          <span>${stats.learning} learning · ${stats.unseen} unseen</span>
        </div>
        ${progressStrip(progressStats)}
        ${statLegend(progressStats)}

        <div class="study-actions">
          <button class="study-action study-action--primary" data-action="start-neighbor-learn">
            <strong>Learn</strong>
            <span>Name every land neighbour · immediate feedback</span>
          </button>
          <button class="study-action" data-action="start-neighbor-test">
            <strong>Test</strong>
            <span>Same task · results summarised at the end</span>
          </button>
        </div>
      </section>

      ${isAfrica ? renderRegions(progress) : renderCountryLedger(progress, config.countryIds)}

      <section class="atlas-section" aria-labelledby="neighbor-rules-heading">
        <div class="list-heading"><h2 id="neighbor-rules-heading">Round rules</h2><span>n + 2 attempts</span></div>
        <p class="neighbor-policy">Each country starts with two guesses beyond the number of correct land neighbours. Repeating any previous guess is free. A clean full-set completion earns one mastery credit; three distinct clean sessions master a country.</p>
        ${zeroCount ? `<p class="neighbor-policy">${zeroCount} ${zeroCount === 1 ? 'country has' : 'countries have'} zero land neighbours in this scope. The data keeps those empty sets, but standard rounds exclude them.</p>` : ''}
        ${isAfrica ? `<p class="neighbor-policy">${AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS.length} countries are temporarily excluded because their complete application-country land-border sets cross the current Africa-only production topology. They return when the canonical topology expands.</p>` : ''}
      </section>

      ${persisting ? '' : `<p class="storage-notice">This browser is blocking storage, so neighbour progress will last only for this visit.</p>`}
    </main>
  `;
}

function renderRegions(progress: NeighborProgressState): string {
  return `
    <section class="atlas-section" aria-labelledby="neighbor-regions-heading">
      <div class="list-heading"><h2 id="neighbor-regions-heading">Regions</h2><span>${AFRICA_MAP_REGION_CONFIGS.length}</span></div>
      <div class="region-list">
        ${AFRICA_MAP_REGION_CONFIGS.map((mapConfig) => {
          const config = getAfricaNeighborScopeConfig(mapConfig.scope.id ?? '');
          const countryIds = config?.countryIds ?? [];
          const stats = getNeighborScopeStats(progress, countryIds, AFRICA_LAND_ADJACENCY);
          const zeros = countryIds.filter((countryId) => (AFRICA_LAND_ADJACENCY[countryId]?.length ?? 0) === 0).length;
          const deferred = mapConfig.countryIds.length - countryIds.length;
          const status = stats.unseen > 0 ? `${stats.unseen} unseen` : stats.learning > 0 ? `${stats.learning} learning` : 'Mastered';
          const exclusions = [
            zeros ? `${zeros} zero-neighbour excluded` : '',
            deferred ? `${deferred} coverage-deferred` : '',
          ].filter(Boolean).join(' · ');
          return `
            <button class="region-row" data-action="open-scope" data-domain="neighbors" data-id="${mapConfig.scope.id}">
              <span class="region-row__identity">
                <strong>${escapeHtml(mapConfig.scope.label)}</strong>
                <small>${stats.total} targets${exclusions ? ` · ${exclusions}` : ''}</small>
              </span>
              <span class="region-row__status">${status}</span>
              ${icon('chevron')}
            </button>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function renderCountryLedger(progress: NeighborProgressState, countryIds: readonly string[]): string {
  return `
    <section class="atlas-section" aria-labelledby="neighbor-countries-heading">
      <div class="list-heading"><h2 id="neighbor-countries-heading">Countries</h2><span>${countryIds.length}</span></div>
      <div class="mini-ledger">
        ${countryIds.map((countryId) => {
          const country = COUNTRY_BY_ID.get(countryId);
          const neighborCount = AFRICA_LAND_ADJACENCY[countryId]?.length ?? 0;
          if (neighborCount === 0) {
            return `<div class="mini-ledger__row"><span>${escapeHtml(country?.name ?? countryId)}</span><span class="status-text">No land neighbours · excluded</span></div>`;
          }
          const record = getNeighborRecord(progress, countryId);
          const label = record.status === 'mastered'
            ? 'Mastered'
            : record.status === 'learning'
              ? `Learning ${record.masteryStreak}/${neighborMasteryGoal(record)}`
              : 'Unseen';
          return `<div class="mini-ledger__row"><span>${escapeHtml(country?.name ?? countryId)} · ${neighborCount}</span><span class="status-text status-text--${record.status}">${label}</span></div>`;
        }).join('')}
      </div>
    </section>
  `;
}
