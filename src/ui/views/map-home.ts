import { WEST_AFRICA_MAP_COUNTRY_IDS } from '../../data/map-scopes.js';
import type { LocationProgressState } from '../../domain/map-models.js';
import { getLocationScopeStats } from '../../domain/map-game.js';

export function renderMapHome(progress: LocationProgressState, persisting = true): string {
  const stats = getLocationScopeStats(progress, WEST_AFRICA_MAP_COUNTRY_IDS);
  return `
    <main class="page page--map-home">
      <header class="topbar">
        <button class="text-icon-button" data-action="home" aria-label="Back to flags">← Flags</button>
        <span class="map-mode-label">Country locations</span>
      </header>

      <section class="map-intro" aria-labelledby="map-home-heading">
        <p class="map-eyebrow">Pilot region</p>
        <h1 id="map-home-heading" tabindex="-1" data-autofocus>West Africa</h1>
        <p>Learn where all 16 countries are by tapping them directly on the map.</p>

        <div class="map-progress-card" aria-label="Location mastery: ${stats.mastered} of ${stats.total} mastered">
          <div class="map-progress-card__score"><strong>${stats.mastered}</strong><span>/ ${stats.total}</span><small>locations mastered</small></div>
          <div class="map-progress-bar" aria-hidden="true">
            <span class="map-progress-bar__mastered" style="width:${stats.total ? (stats.mastered / stats.total) * 100 : 0}%"></span>
            <span class="map-progress-bar__learning" style="width:${stats.total ? (stats.learning / stats.total) * 100 : 0}%"></span>
          </div>
          <div class="map-progress-meta"><span>${stats.learning} learning</span><span>${stats.unseen} unseen</span></div>
        </div>

        <div class="primary-actions map-primary-actions">
          <button class="button button--primary" data-action="start-map-learn">Learn map</button>
          <button class="button button--secondary" data-action="start-map-test">Test map</button>
        </div>
      </section>

      <section class="map-how" aria-labelledby="map-how-heading">
        <h2 id="map-how-heading">Learn feedback</h2>
        <div class="map-legend">
          <span><i class="map-swatch map-swatch--first"></i>First try</span>
          <span><i class="map-swatch map-swatch--one"></i>1 miss</span>
          <span><i class="map-swatch map-swatch--two"></i>2 misses</span>
          <span><i class="map-swatch map-swatch--reveal"></i>Revealed</span>
        </div>
        <p>Three wrong taps reveal the answer. Test mode gives one attempt per country and holds correctness until the end.</p>
      </section>

      ${persisting ? '' : `<p class="storage-notice">This browser is blocking storage, so map progress will last only for this visit.</p>`}
    </main>
  `;
}
