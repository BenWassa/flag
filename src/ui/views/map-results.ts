import type { MapRegionAsset, MapSessionResult } from '../../domain/map-models.js';
import { icon } from '../components/icons.js';
import { renderMapSvg } from '../components/map.js';

export function renderMapResults(asset: MapRegionAsset, result: MapSessionResult): string {
  const mode = result.session.mode;
  const states = result.session.countryIds.map((countryId) => result.session.targets[countryId]);
  const oneMiss = states.filter((state) => state?.resolution === 'one-miss').length;
  const twoMiss = states.filter((state) => state?.resolution === 'two-miss').length;
  const revealed = states.filter((state) => state?.resolution === 'revealed').length;
  const incorrect = states.filter((state) => state?.resolution === 'incorrect').length;

  return `
    <main class="page page--map-results">
      <header class="topbar topbar--detail">
        <button class="icon-button" data-action="open-map-pilot" aria-label="Back to country locations">${icon('back')}</button>
        <div class="screen-title">
          <h1 id="map-result-heading" tabindex="-1" data-autofocus>Round complete</h1>
          <span>${result.session.scope.label} · ${mode === 'learn' ? 'Learn' : 'Test'}</span>
        </div>
      </header>

      <section class="map-result-summary" aria-labelledby="map-result-heading">
        <h1>${result.firstTryCorrect} of ${result.total} first try</h1>
        <p>${result.missedCountryIds.length === 0 ? 'Clean round. Every location was right immediately.' : `${result.missedCountryIds.length} ${result.missedCountryIds.length === 1 ? 'location needs' : 'locations need'} another pass.`}</p>
        ${mode === 'learn'
          ? `<div class="map-result-breakdown" aria-label="Learn round breakdown">
              <span><i class="map-swatch map-swatch--first" aria-hidden="true"></i><strong>${result.firstTryCorrect}</strong> first try</span>
              <span><i class="map-swatch map-swatch--one" aria-hidden="true"></i><strong>${oneMiss}</strong> 1 miss</span>
              <span><i class="map-swatch map-swatch--two" aria-hidden="true"></i><strong>${twoMiss}</strong> 2 misses</span>
              <span><i class="map-swatch map-swatch--reveal" aria-hidden="true"></i><strong>${revealed}</strong> revealed</span>
            </div>`
          : `<div class="map-result-breakdown" aria-label="Test round breakdown">
              <span><strong>${result.firstTryCorrect}</strong> correct</span>
              <span><strong>${incorrect}</strong> missed</span>
            </div>`}
      </section>

      <section class="map-stage map-stage--results" aria-label="Completed map">
        ${renderMapSvg(asset, result.session, { interactive: false, showFeedback: true, labelledBy: 'map-result-heading' })}
      </section>

      <div class="map-results-actions">
        ${result.missedCountryIds.length ? `<button class="button button--primary" data-action="review-map-mistakes">Review mistakes</button>` : '<span></span>'}
        <button class="button button--secondary" data-action="repeat-map">Repeat ${mode}</button>
        <button class="button button--tertiary" data-action="open-map-pilot">Map home</button>
      </div>
    </main>
  `;
}
