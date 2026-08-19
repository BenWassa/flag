import { WEST_AFRICA_MAP_COUNTRY_IDS } from '../../data/map-scopes.js';
import type { LocationProgressState } from '../../domain/map-models.js';
import { getLocationScopeStats } from '../../domain/map-game.js';
import { icon } from '../components/icons.js';
import { progressStrip, statLegend } from '../components/progress.js';

export function renderMapHome(progress: LocationProgressState, persisting = true): string {
  const stats = getLocationScopeStats(progress, WEST_AFRICA_MAP_COUNTRY_IDS);
  const progressStats = { ...stats, due: 0 };
  return `
    <main class="page">
      <header class="topbar topbar--detail">
        <button class="icon-button" data-action="home" aria-label="Back to flags">${icon('back')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" data-autofocus>West Africa</h1>
          <span>Country locations · ${stats.total} countries</span>
        </div>
      </header>

      <section class="scope-overview" aria-label="West Africa location learning status">
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
