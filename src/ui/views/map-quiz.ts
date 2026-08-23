import { COUNTRY_BY_ID } from '../../data/countries.js';
import { getMapContinentConfigForScope } from '../../data/map-scopes.js';
import { currentMapTarget } from '../../domain/map-game.js';
import type { MapRegionAsset, MapSession } from '../../domain/map-models.js';
import { answerFeedback, roundScore } from '../../domain/round-feedback.js';
import { icon } from '../components/icons.js';
import { renderMapSvg } from '../components/map.js';
import { answerFeedbackPanel, liveScore } from '../components/round-feedback.js';
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
  const continentLabel = session.scope.id
    ? getMapContinentConfigForScope(session.scope.id)?.scope.label ?? session.scope.label
    : session.scope.label;
  const feedback = visibleFeedback(session, state?.resolution, state?.misses ?? 0, continentLabel, wrongCountry?.name);
  const lastAttempt = session.attempts.at(-1);
  const currentPlayAttempt = session.mode === 'test'
    && state?.resolved
    && lastAttempt?.targetCountryId === targetId
    && lastAttempt.resolved
      ? lastAttempt
      : undefined;
  const playFeedback = currentPlayAttempt ? answerFeedback(currentPlayAttempt.correct, target.name) : null;
  const score = roundScore(session.attempts, session.countryIds.length);
  const mapLabel = session.scope.kind === 'continent'
    ? `${continentLabel} country map`
    : `${continentLabel} map with ${session.scope.label} active`;

  return `
    <main class="page page--map-quiz">
      <header class="map-quiz-topbar">
        <button class="icon-button" data-action="exit-map" aria-label="Exit map round">${icon('close')}</button>
        <div class="map-quiz-topbar__title">
          <strong>${escapeHtml(session.scope.label)}</strong>
          <span class="map-quiz-topbar__meta">${session.mode === 'learn' ? 'Learn' : 'Play'} locations</span>
        </div>
        <span class="map-round-count">${session.currentIndex + 1} / ${session.countryIds.length}</span>
      </header>

      <section class="map-prompt" aria-labelledby="map-prompt-heading">
        <p class="map-prompt__kicker">Find</p>
        <h1 id="map-prompt-heading" tabindex="-1" data-autofocus>${escapeHtml(target.name)}</h1>
        ${session.mode === 'test' ? liveScore(score) : ''}
        ${playFeedback
          ? answerFeedbackPanel(playFeedback)
          : `<p class="map-prompt__status ${feedback.className}">${feedback.text}</p>`}
      </section>

      <section class="map-stage" aria-label="${escapeHtml(mapLabel)}">
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
  continentLabel: string,
  wrongCountryName?: string,
): { text: string; className: string } {
  if (session.mode === 'test') {
    return {
      text: session.currentIndex === 0
        ? `One tap each · pinch or wheel to zoom · swipe or drag to pan ${continentLabel} · results at the end.`
        : 'Tap one country.',
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

  return {
    text: session.currentIndex === 0
      ? `Tap the country · pinch to zoom · swipe or drag to pan ${continentLabel}.`
      : 'Tap the country on the map.',
    className: '',
  };
}
