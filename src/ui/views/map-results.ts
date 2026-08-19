import type { MapRegionAsset, MapSessionResult } from '../../domain/map-models.js';
import { renderMapSvg } from '../components/map.js';

export function renderMapResults(asset: MapRegionAsset, result: MapSessionResult): string {
  const accuracy = result.total ? Math.round((result.firstTryCorrect / result.total) * 100) : 0;
  const mode = result.session.mode;
  return `
    <main class="page page--map-results">
      <header class="topbar">
        <button class="text-icon-button" data-action="open-map-pilot">← Maps</button>
        <span class="map-mode-label">Round complete</span>
      </header>

      <section class="map-result-summary" aria-labelledby="map-result-heading">
        <p class="map-eyebrow">${mode === 'learn' ? 'Learn' : 'Test'} · ${result.session.scope.label}</p>
        <h1 id="map-result-heading" tabindex="-1" data-autofocus>${result.firstTryCorrect} of ${result.total} first try</h1>
        <strong class="map-result-percent">${accuracy}%</strong>
        <p>${result.missedCountryIds.length === 0 ? 'Clean round.' : `${result.missedCountryIds.length} ${result.missedCountryIds.length === 1 ? 'location needs' : 'locations need'} another pass.`}</p>
      </section>

      <section class="map-stage map-stage--results" aria-label="Completed map">
        ${renderMapSvg(asset, result.session, { interactive: false, showFeedback: true, labelledBy: 'map-result-heading' })}
      </section>

      <div class="map-results-actions">
        ${result.missedCountryIds.length ? `<button class="button button--primary" data-action="review-map-mistakes">Review mistakes</button>` : ''}
        <button class="button button--secondary" data-action="repeat-map">Repeat ${mode}</button>
        <button class="button button--ghost" data-action="open-map-pilot">Map home</button>
      </div>
    </main>
  `;
}
