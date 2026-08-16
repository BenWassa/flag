import { CONTINENTS, REGIONS } from '../../data/continents.js';
import { COUNTRIES } from '../../data/countries.js';
import type { ProgressState, StudyScope } from '../../domain/models.js';
import { getScopeStats } from '../../domain/progress.js';
import { progressStrip, statPills } from '../components/progress.js';

export function renderHome(progress: ProgressState): string {
  const worldScope: StudyScope = { kind: 'world', label: 'World' };
  const world = getScopeStats(COUNTRIES, progress, worldScope);

  return `
    <main class="page page--home">
      <header class="app-header">
        <div>
          <p class="eyebrow">FLAG ATLAS</p>
          <h1>Learn the world by sight.</h1>
        </div>
        <button class="icon-button" data-action="open-progress" aria-label="Open learning ledger"><svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
      </header>

      <section class="hero-card">
        <div class="hero-card__topline">
          <span>World progress</span>
          <strong>${world.mastered}<small> / ${world.total}</small></strong>
        </div>
        ${progressStrip(world)}
        ${statPills(world)}
        <div class="hero-actions">
          <button class="button button--primary" data-action="start-world-learn">Continue learning</button>
          <button class="button button--quiet" data-action="start-world-test">Test me</button>
        </div>
      </section>

      <section class="section-heading">
        <div>
          <p class="eyebrow">BY CONTINENT</p>
          <h2>Choose a field of study</h2>
        </div>
      </section>

      <div class="continent-grid">
        ${CONTINENTS.map((continent, index) => {
          const scope: StudyScope = { kind: 'continent', id: continent.id, label: continent.name };
          const stats = getScopeStats(COUNTRIES, progress, scope);
          const regions = REGIONS.filter((region) => region.continentId === continent.id).length;
          return `
            <button class="continent-card" data-action="open-continent" data-id="${continent.id}">
              <span class="continent-card__index">${String(index + 1).padStart(2, '0')}</span>
              <span class="continent-card__body">
                <strong>${continent.name}</strong>
                <small>${stats.total} flags · ${regions} regions</small>
                ${progressStrip(stats)}
                <span class="continent-card__meta">${stats.mastered} mastered · ${stats.learning} learning · ${stats.unseen} unseen</span>
              </span>
              <span class="continent-card__arrow">→</span>
            </button>
          `;
        }).join('')}
      </div>
    </main>
  `;
}
