import { COUNTRY_BY_ID } from '../../data/countries.js';
import { currentMapTarget } from '../../domain/map-game.js';
import type { MapRegionAsset, MapSession } from '../../domain/map-models.js';
import { renderMapSvg } from '../components/map.js';
import { escapeHtml } from '../format.js';

export function renderMapQuiz(
  asset: MapRegionAsset,
  session: MapSession,
  lastWrongCountryId: string | null,
): string {
  const targetId = currentMapTarget(session);
  const target = targetId ? COUNTRY_BY_ID.get(targetId) : undefined;
  if (!targetId || !target) {
    return `<main class="page"><h1 tabindex="-1" data-autofocus>Map round unavailable</h1><button class="button" data-action="exit-map">Back</button></main>`;
  }
  const state = session.targets[targetId];
  const triesLeft = Math.max(0, 3 - (state?.misses ?? 0));
  const showFeedback = session.mode === 'learn';

  return `
    <main class="page page--map-quiz">
      <header class="map-quiz-topbar">
        <button class="text-icon-button" data-action="exit-map" aria-label="Exit map round">← Exit</button>
        <span>${escapeHtml(session.scope.label)} · ${session.mode === 'learn' ? 'Learn' : 'Test'}</span>
        <span>${session.currentIndex + 1} / ${session.countryIds.length}</span>
      </header>

      <section class="map-stage" aria-label="Country map">
        ${renderMapSvg(asset, session, {
          interactive: true,
          showFeedback,
          lastWrongCountryId: session.mode === 'learn' ? lastWrongCountryId : null,
          labelledBy: 'map-prompt-heading',
        })}
      </section>

      <section class="map-prompt" aria-labelledby="map-prompt-heading">
        <p class="map-prompt__kicker">Find this country</p>
        <h1 id="map-prompt-heading" tabindex="-1" data-autofocus>${escapeHtml(target.name)}</h1>
        <p class="map-prompt__hint">
          ${session.mode === 'test'
            ? 'One tap. Correctness is held until the round ends.'
            : state?.misses
              ? `${triesLeft} ${triesLeft === 1 ? 'try' : 'tries'} left before reveal.`
              : 'Tap the country on the map.'}
        </p>
      </section>
    </main>
  `;
}
