import { CONTINENTS, REGIONS } from '../../data/continents.js';
import { COUNTRIES } from '../../data/countries.js';
import type { ProgressState, StudyScope } from '../../domain/models.js';
import { getScopeStats } from '../../domain/progress.js';
import { progressStrip, statPills } from '../components/progress.js';

export function renderScope(progress: ProgressState, scope: StudyScope): string {
  const stats = getScopeStats(COUNTRIES, progress, scope);
  const isContinent = scope.kind === 'continent';
  const continent = isContinent ? CONTINENTS.find((item) => item.id === scope.id) : undefined;
  const regions = continent ? REGIONS.filter((region) => region.continentId === continent.id) : [];

  return `
    <main class="page">
      <header class="sub-header">
        <button class="back-button" data-action="home" aria-label="Back">←</button>
        <div>
          <p class="eyebrow">${scope.kind === 'region' ? 'REGION' : 'CONTINENT'}</p>
          <h1>${scope.label}</h1>
        </div>
      </header>

      <section class="scope-summary">
        <div class="scope-score"><strong>${stats.mastered}</strong><span>of ${stats.total} mastered</span></div>
        ${progressStrip(stats)}
        ${statPills(stats)}
        <div class="mode-grid">
          <button class="mode-card mode-card--learn" data-action="start-learn">
            <span class="mode-card__label">LEARN</span>
            <strong>${stats.unseen > 0 ? 'Continue first pass' : 'Adaptive practice'}</strong>
            <small>${stats.unseen > 0 ? `${stats.unseen} unseen flags prioritized` : 'Weak flags first, retention mixed in'}</small>
          </button>
          <button class="mode-card" data-action="start-test">
            <span class="mode-card__label">TEST</span>
            <strong>Test this scope</strong>
            <small>Balanced sample · answers held until the end</small>
          </button>
        </div>
      </section>

      ${regions.length ? `
        <section class="section-heading section-heading--tight">
          <div><p class="eyebrow">REGIONS</p><h2>Study smaller</h2></div>
        </section>
        <div class="region-list">
          ${regions.map((region) => {
            const regionScope: StudyScope = { kind: 'region', id: region.id, label: region.name };
            const regionStats = getScopeStats(COUNTRIES, progress, regionScope);
            return `
              <button class="region-row" data-action="open-region" data-id="${region.id}">
                <span>
                  <strong>${region.name}</strong>
                  <small>${regionStats.total} flags · ${regionStats.mastered} mastered</small>
                </span>
                <span class="region-row__status">${regionStats.unseen > 0 ? `${regionStats.unseen} unseen` : regionStats.learning > 0 ? `${regionStats.learning} learning` : 'Mastered'}</span>
                <span>→</span>
              </button>
            `;
          }).join('')}
        </div>
      ` : renderCountryLedger(progress, scope)}
    </main>
  `;
}

function renderCountryLedger(progress: ProgressState, scope: StudyScope): string {
  const countries = COUNTRIES.filter((country) => country.regionId === scope.id);
  return `
    <section class="mini-ledger">
      <div class="section-heading section-heading--tight"><div><p class="eyebrow">FLAGS</p><h2>${countries.length} countries</h2></div></div>
      ${countries.map((country) => {
        const record = progress.records[country.id];
        return `<div class="mini-ledger__row"><span>${country.name}</span><span class="status-text status-text--${record.status}">${record.status === 'learning' ? `${record.masteryStreak}/${record.lapseCount ? 2 : 3}` : title(record.status)}</span></div>`;
      }).join('')}
    </section>
  `;
}

function title(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
