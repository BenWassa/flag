import { COUNTRY_BY_ID } from '../../data/countries.js';
import { currentMapTarget } from '../../domain/map-game.js';
import type { MapRegionAsset, MapSession } from '../../domain/map-models.js';
import { icon } from '../components/icons.js';
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
  const wrongCountry = lastWrongCountryId ? COUNTRY_BY_ID.get(lastWrongCountryId) : undefined;
  const showFeedback = session.mode === 'learn';
  const feedback = visibleFeedback(session, state?.resolution, state?.misses ?? 0, wrongCountry?.name);

  return `
    <main class="page page--map-quiz">
      <header class="map-quiz-topbar">
        <button class="icon-button" data-action="exit-map" aria-label="Exit map round">${icon('close')}</button>
        <div class="map-quiz-topbar__title">
          <strong>${escapeHtml(session.scope.label)}</strong>
          <span class="map-quiz-topbar__meta">${session.mode === 'learn' ? 'Learn' : 'Test'} locations</span>
        </div>
        <span class="map-round-count">${session.currentIndex + 1} / ${session.countryIds.length}</span>
      </header>

      <section class="map-prompt" aria-labelledby="map-prompt-heading">
        <p class="map-prompt__kicker">Find</p>
        <h1 id="map-prompt-heading" tabindex="-1" data-autofocus>${escapeHtml(target.name)}</h1>
        <p class="map-prompt__status ${feedback.className}">${feedback.text}</p>
      </section>

      <section class="map-stage" aria-label="West Africa country map">
        ${renderMapSvg(asset, session, {
          interactive: true,
          showFeedback,
          lastWrongCountryId: session.mode === 'learn' ? lastWrongCountryId : null,
          labelledBy: 'map-prompt-heading',
        })}
      </section>
    </main>
  `;
}

function visibleFeedback(
  session: MapSession,
  resolution: MapSession['targets'][string]['resolution'],
  misses: number,
  wrongCountryName?: string,
): { text: string; className: string } {
  if (session.mode === 'test') {
    if (resolution) return { text: 'Answer recorded', className: '' };
    return {
      text: session.currentIndex === 0 ? 'One tap each · results at the end.' : 'Tap one country.',
      className: '',
    };
  }

  if (resolution === 'first-try') {
    return { text: 'Correct · first try', className: 'map-prompt__status--correct' };
  }
  if (resolution === 'one-miss') {
    return { text: 'Correct · after 1 miss', className: 'map-prompt__status--correct' };
  }
  if (resolution === 'two-miss') {
    return { text: 'Correct · after 2 misses', className: 'map-prompt__status--correct' };
  }
  if (resolution === 'revealed') {
    return { text: 'Revealed after 3 misses — look at the location before the next country.', className: 'map-prompt__status--reveal' };
  }

  if (misses > 0) {
    const triesLeft = Math.max(0, 3 - misses);
    const selected = wrongCountryName ? `Not ${wrongCountryName}. ` : 'Not there. ';
    return {
      text: `${selected}Try again · ${triesLeft} ${triesLeft === 1 ? 'try' : 'tries'} before reveal`,
      className: 'map-prompt__status--wrong',
    };
  }

  return { text: 'Tap the country on the map.', className: '' };
}
