import { COUNTRY_BY_ID, COUNTRIES } from '../../data/countries.js';
import { AFRICA_MAP_REGION_CONFIGS, getAfricaMapScopeConfig } from '../../data/map-scopes.js';
import type { ProgressState, StudyScope } from '../../domain/models.js';
import { getRecord, getScopeStats } from '../../domain/progress.js';
import { icon } from '../components/icons.js';
import { progressStrip, statLegend } from '../components/progress.js';
import { escapeHtml, statusLabel } from '../format.js';

export function renderOutlineHome(
  progress: ProgressState,
  scope: StudyScope,
  persisting = true,
): string {
  const config = getAfricaMapScopeConfig(scope.id ?? 'africa');
  if (!config) {
    return `<main class="page"><h1 tabindex="-1" data-autofocus>Outline scope unavailable</h1><button class="button" data-action="route-parent">Back</button></main>`;
  }

  const stats = getScopeStats(COUNTRIES, progress, config.scope);
  const isAfrica = config.scope.kind === 'continent';

  return `
    <main class="page">
      <header class="topbar topbar--detail">
        <button class="icon-button" data-action="route-parent" aria-label="Back one level">${icon('back')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" data-autofocus>${escapeHtml(config.scope.label)}</h1>
          <span>Outlines · ${isAfrica ? 'Continent' : 'Region'} · ${stats.total} countries</span>
        </div>
      </header>

      <section class="scope-overview" aria-label="${escapeHtml(config.scope.label)} outline learning status">
        <div class="scope-status-line">
          <strong>${stats.mastered} mastered</strong>
          <span>${stats.learning} learning · ${stats.unseen} unseen</span>
        </div>
        ${progressStrip(stats)}
        ${statLegend(stats)}

        <div class="study-actions">
          <button class="study-action study-action--primary" data-action="start-outline-learn">
            <strong>Learn</strong>
            <span>${stats.unseen > 0 ? `${stats.unseen} unseen prioritised` : 'Adaptive practice'}</span>
          </button>
          <button class="study-action" data-action="start-outline-test">
            <strong>Test</strong>
            <span>Random silhouettes · answers at the end</span>
          </button>
        </div>
      </section>

      ${isAfrica ? renderRegions(progress) : renderCountryLedger(progress, config.countryIds)}
      ${persisting ? '' : `<p class="storage-notice">This browser is blocking storage, so outline progress will last only for this visit.</p>`}
    </main>
  `;
}

function renderRegions(progress: ProgressState): string {
  return `
    <section class="atlas-section" aria-labelledby="outline-regions-heading">
      <div class="list-heading"><h2 id="outline-regions-heading">Regions</h2><span>${AFRICA_MAP_REGION_CONFIGS.length}</span></div>
      <div class="region-list">
        ${AFRICA_MAP_REGION_CONFIGS.map((config) => {
          const stats = getScopeStats(COUNTRIES, progress, config.scope);
          const status = stats.unseen > 0
            ? `${stats.unseen} unseen`
            : stats.learning > 0
              ? `${stats.learning} learning`
              : 'Mastered';
          return `
            <button class="region-row" data-action="open-scope" data-domain="outlines" data-id="${config.scope.id}">
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

function renderCountryLedger(progress: ProgressState, countryIds: readonly string[]): string {
  return `
    <section class="atlas-section" aria-labelledby="outline-countries-heading">
      <div class="list-heading"><h2 id="outline-countries-heading">Countries</h2><span>${countryIds.length}</span></div>
      <div class="mini-ledger">
        ${countryIds.map((countryId) => {
          const country = COUNTRY_BY_ID.get(countryId);
          const record = getRecord(progress, countryId);
          return `
            <div class="mini-ledger__row">
              <span>${escapeHtml(country?.name ?? countryId)}</span>
              <span class="status-text status-text--${record.status}">${statusLabel(record)}</span>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;
}
