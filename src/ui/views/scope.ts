import { CONTINENTS, REGIONS } from '../../data/continents.js';
import { COUNTRIES } from '../../data/countries.js';
import type { ProgressState, StudyScope } from '../../domain/models.js';
import { getScopeStats } from '../../domain/progress.js';
import { icon } from '../components/icons.js';
import { progressStrip, statLegend } from '../components/progress.js';
import { statusLabel } from '../format.js';

export function renderScope(progress: ProgressState, scope: StudyScope): string {
  const stats = getScopeStats(COUNTRIES, progress, scope);
  const isContinent = scope.kind === 'continent';
  const continent = isContinent ? CONTINENTS.find((item) => item.id === scope.id) : undefined;
  const regions = continent ? REGIONS.filter((region) => region.continentId === continent.id) : [];

  return `
    <main class="page">
      <header class="topbar topbar--detail">
        <button class="icon-button" data-action="home" aria-label="Back to atlas">${icon('back')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" data-autofocus>${scope.label}</h1>
          <span>${scope.kind === 'region' ? 'Region' : 'Continent'} · ${stats.total} flags</span>
        </div>
      </header>

      <section class="scope-overview" aria-label="${scope.label} learning status">
        <div class="scope-status-line">
          <strong>${stats.mastered} mastered</strong>
          <span>${stats.learning} learning · ${stats.unseen} unseen</span>
        </div>
        ${progressStrip(stats)}
        ${statLegend(stats)}

        <div class="study-actions">
          <button class="study-action study-action--primary" data-action="start-learn">
            <strong>Learn</strong>
            <span>${stats.unseen > 0 ? `${stats.unseen} unseen prioritized` : 'Adaptive practice'}</span>
          </button>
          <button class="study-action" data-action="start-test">
            <strong>Test</strong>
            <span>Random flags, no answers shown</span>
          </button>
        </div>
      </section>

      ${regions.length ? renderRegions(progress, regions) : renderCountryLedger(progress, scope)}
    </main>
  `;
}

function renderRegions(progress: ProgressState, regions: typeof REGIONS): string {
  return `
    <section class="atlas-section" aria-labelledby="regions-heading">
      <div class="list-heading"><h2 id="regions-heading">Regions</h2><span>${regions.length}</span></div>
      <div class="region-list">
        ${regions.map((region) => {
          const regionScope: StudyScope = { kind: 'region', id: region.id, label: region.name };
          const regionStats = getScopeStats(COUNTRIES, progress, regionScope);
          const status = regionStats.unseen > 0
            ? `${regionStats.unseen} unseen`
            : regionStats.learning > 0
              ? `${regionStats.learning} learning`
              : 'Mastered';
          return `
            <button class="region-row" data-action="open-region" data-id="${region.id}">
              <span class="region-row__identity">
                <strong>${region.name}</strong>
                <small>${regionStats.total} flags · ${regionStats.mastered}/${regionStats.total} mastered</small>
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

function renderCountryLedger(progress: ProgressState, scope: StudyScope): string {
  const countries = COUNTRIES.filter((country) => country.regionId === scope.id);
  return `
    <section class="atlas-section" aria-labelledby="countries-heading">
      <div class="list-heading"><h2 id="countries-heading">Countries</h2><span>${countries.length}</span></div>
      <div class="mini-ledger">
        ${countries.map((country) => {
          const record = progress.records[country.id];
          return `
            <div class="mini-ledger__row">
              <span>${country.name}</span>
              <span class="status-text status-text--${record.status}">${statusLabel(record)}</span>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;
}
