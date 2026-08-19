import { COUNTRY_BY_ID } from '../../data/countries.js';
import {
  AFRICA_MAP_REGION_CONFIGS,
  getAfricaMapScopeConfig,
} from '../../data/map-scopes.js';
import type { StudyScope } from '../../domain/models.js';
import type { LocationProgressState } from '../../domain/map-models.js';
import { getLocationRecord, getLocationScopeStats } from '../../domain/map-game.js';
import { icon } from '../components/icons.js';
import { progressStrip, statLegend } from '../components/progress.js';
import { escapeHtml } from '../format.js';

export function renderMapHome(
  progress: LocationProgressState,
  scope: StudyScope,
  persisting = true,
): string {
  const config = getAfricaMapScopeConfig(scope.id ?? 'africa');
  if (!config) {
    return `<main class="page"><h1 tabindex="-1" data-autofocus>Map scope unavailable</h1><button class="button" data-action="home">Back</button></main>`;
  }

  const stats = getLocationScopeStats(progress, config.countryIds);
  const progressStats = { ...stats, due: 0 };
  const isAfrica = config.scope.kind === 'continent';

  return `
    <main class="page">
      <header class="topbar topbar--detail">
        <button class="icon-button" data-action="${isAfrica ? 'home' : 'open-map-scope'}"${isAfrica ? '' : ' data-id="africa"'} aria-label="${isAfrica ? 'Back to flags' : 'Back to Africa locations'}">${icon('back')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" data-autofocus>${escapeHtml(config.scope.label)}</h1>
          <span>Country locations · ${stats.total} countries</span>
        </div>
      </header>

      <section class="scope-overview" aria-label="${escapeHtml(config.scope.label)} location learning status">
        <div class="scope-status-line">
          <strong>${stats.mastered} mastered</strong>
          <span>${stats.learning} learning · ${stats.unseen} unseen</span>
        </div>
        ${progressStrip(progressStats)}
        ${statLegend(progressStats)}

        <div class="study-actions">
          <button class="study-action study-action--primary" data-action="start-map-learn">
            <strong>Learn</strong>
            <span>Up to 3 tries · immediate feedback</span>
          </button>
          <button class="study-action" data-action="start-map-test">
            <strong>Test</strong>
            <span>One tap each · results at the end</span>
          </button>
        </div>
      </section>

      ${isAfrica ? renderRegions(progress) : renderCountryLedger(progress, config.countryIds)}

      <section class="atlas-section map-guide" aria-labelledby="map-guide-heading">
        <div class="list-heading">
          <h2 id="map-guide-heading">Learn feedback</h2>
          <span>Attempts</span>
        </div>
        <div class="map-legend" aria-label="Map feedback legend">
          <span><i class="map-swatch map-swatch--first" aria-hidden="true"></i>First try</span>
          <span><i class="map-swatch map-swatch--one" aria-hidden="true"></i>1 miss</span>
          <span><i class="map-swatch map-swatch--two" aria-hidden="true"></i>2 misses</span>
          <span><i class="map-swatch map-swatch--reveal" aria-hidden="true"></i>Revealed</span>
        </div>
        <p>The completed map records where you needed help. Three misses reveal the target; wrongly tapped countries do not stay filled.</p>
      </section>

      ${persisting ? '' : `<p class="storage-notice">This browser is blocking storage, so map progress will last only for this visit.</p>`}
    </main>
  `;
}

function renderRegions(progress: LocationProgressState): string {
  return `
    <section class="atlas-section" aria-labelledby="map-regions-heading">
      <div class="list-heading"><h2 id="map-regions-heading">Regions</h2><span>${AFRICA_MAP_REGION_CONFIGS.length}</span></div>
      <div class="region-list">
        ${AFRICA_MAP_REGION_CONFIGS.map((config) => {
          const stats = getLocationScopeStats(progress, config.countryIds);
          const status = stats.unseen > 0
            ? `${stats.unseen} unseen`
            : stats.learning > 0
              ? `${stats.learning} learning`
              : 'Mastered';
          return `
            <button class="region-row" data-action="open-map-scope" data-id="${config.scope.id}">
              <span class="region-row__identity">
                <strong>${escapeHtml(config.scope.label)}</strong>
                <small>${stats.total} countries · ${stats.mastered}/${stats.total} mastered</small>
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

function renderCountryLedger(progress: LocationProgressState, countryIds: readonly string[]): string {
  return `
    <section class="atlas-section" aria-labelledby="map-countries-heading">
      <div class="list-heading"><h2 id="map-countries-heading">Countries</h2><span>${countryIds.length}</span></div>
      <div class="mini-ledger">
        ${countryIds.map((countryId) => {
          const country = COUNTRY_BY_ID.get(countryId);
          const record = getLocationRecord(progress, countryId);
          const label = record.status === 'mastered'
            ? 'Mastered'
            : record.status === 'learning'
              ? 'Learning'
              : 'Unseen';
          return `
            <div class="mini-ledger__row">
              <span>${escapeHtml(country?.name ?? countryId)}</span>
              <span class="status-text status-text--${record.status}">${label}</span>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;
}
