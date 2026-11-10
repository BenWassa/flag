import { COUNTRY_BY_ID } from '../data/countries.js';
import { AFRICA_MAP_SCOPE } from '../data/map-scopes.js';
import { loadMapAsset } from '../data/maps/index.js';
import type { LearningActivity, StudyScope } from '../domain/models.js';
import type { MapGuessOutcome, MapMode, MapRegionAsset } from '../domain/map-models.js';
import { routeForScope } from '../routing/routes.js';
import { setActiveRoundRoute } from './active-round.js';
import { beginRoundLaunch, isCurrentRoundLaunch } from './round-launch-guard.js';
import { playFeedbackDwellMs } from './play-feedback-timing.js';
import type { RoundContext } from './round-context.js';

export const LOCATION_WRONG_FEEDBACK_MS = 520;

export interface LocationsRound {
  currentScope(): StudyScope;
  begin(
    mode: MapMode,
    targetCountryIds?: readonly string[],
    scope?: StudyScope,
    activity?: LearningActivity,
    replaceRoute?: boolean,
  ): Promise<void>;
  submitAnswer(countryId: string, selector: string | null): void;
  announceResult(): void;
  cancelPending(): void;
  /** No-op unless a map round has just finished (mirrors the original app.ts view-name guard). */
  reviewMistakes(): void;
  repeat(): void;
}

function resolvedFeedbackDwellMs(outcome: MapGuessOutcome): number {
  if (outcome.revealed) return playFeedbackDwellMs(false);
  if (outcome.misses >= 2) return 850;
  if (outcome.misses === 1) return 700;
  return playFeedbackDwellMs(true);
}

/**
 * Resolve visible feedback through a single, cancellable completion callback.
 *
 * Chromium can defer the timer task source after a real touch gesture while
 * still delivering animation frames. #235 exact-production mobile evidence
 * showed both the 620ms quiz timer and a separate 1s timeout stalled for
 * >15s after an accepted answer, but frame callbacks continued. A frame
 * watchdog therefore enforces the same dwell without relying solely on the
 * timer queue. A normal timeout remains the efficient fallback for hidden
 * documents, where animation frames can pause. Either path cancels the other,
 * so scoring and question advancement happen exactly once.
 */
function scheduleFeedbackDwell(durationMs: number, callback: () => void): () => void {
  const startedAt = performance.now();
  let finished = false;
  let timeoutId: number | null = null;
  let frameId: number | null = null;

  const cancel = () => {
    if (finished) return;
    finished = true;
    if (timeoutId !== null) window.clearTimeout(timeoutId);
    if (frameId !== null) window.cancelAnimationFrame(frameId);
    timeoutId = null;
    frameId = null;
  };
  const finish = () => {
    if (finished) return;
    cancel();
    callback();
  };
  timeoutId = window.setTimeout(finish, durationMs);
  if (typeof window.requestAnimationFrame === 'function') {
    const checkFrame = (now: number) => {
      if (finished) return;
      if (now - startedAt >= durationMs) finish();
      else frameId = window.requestAnimationFrame(checkFrame);
    };
    frameId = window.requestAnimationFrame(checkFrame);
  }
  return cancel;
}

export function createLocationsRound(context: RoundContext): LocationsRound {
  const { store, router, announce, notify, finishInteraction, getCurrentRoute, cancelAllPending } = context;

  let pendingMapAdvance: (() => void) | null = null;
  let pendingWrongReset: (() => void) | null = null;

  function cancelMapAdvance(): void {
    pendingMapAdvance?.();
    pendingMapAdvance = null;
  }

  function cancelWrongReset(): void {
    pendingWrongReset?.();
    pendingWrongReset = null;
  }

  function cancelPending(): void {
    cancelMapAdvance();
    cancelWrongReset();
  }

  function currentScope(): StudyScope {
    const route = getCurrentRoute();
    if (route.name === 'learning' && route.domain === 'locations' && route.scope) {
      return route.scope;
    }
    if (store.view.name === 'map-results') return store.view.result.session.scope;
    return store.mapSession?.scope ?? AFRICA_MAP_SCOPE;
  }

  async function begin(
    mode: MapMode,
    targetCountryIds?: readonly string[],
    scope: StudyScope = currentScope(),
    activity: LearningActivity = mode,
    replaceRoute = false,
  ): Promise<void> {
    cancelAllPending();
    const request = beginRoundLaunch();
    const scopeId = scope.id ?? 'africa';
    let asset: MapRegionAsset | null;
    try {
      asset = await loadMapAsset(scopeId);
    } catch {
      if (isCurrentRoundLaunch(request)) notify(`${scope.label} map could not be loaded. Check your connection and try again.`);
      return;
    }
    if (!isCurrentRoundLaunch(request)) return;
    if (!asset) {
      notify(`${scope.label} map could not be loaded. Check your connection and try again.`);
      return;
    }
    if (!store.startMapSession(asset, mode, targetCountryIds)) {
      notify('No map locations are available for this round.');
      return;
    }

    const route = routeForScope('locations', scope, activity);
    setActiveRoundRoute(route);
    router.navigate(route, { replace: replaceRoute });
    announce(`${asset.scope.label} locations. ${activity === 'review' ? 'Review' : mode === 'learn' ? 'Learn' : 'Play'} round of ${store.mapSession?.countryIds.length ?? 0} countries.`);
  }

  function answerAnnouncement(): string {
    const outcome = store.mapLastOutcome;
    if (!outcome || !store.mapSession) return '';
    if (outcome.correct) {
      if (outcome.misses === 0) return 'Correct on the first try.';
      return `Correct after ${outcome.misses} ${outcome.misses === 1 ? 'miss' : 'misses'}.`;
    }
    if (outcome.revealed) {
      const target = COUNTRY_BY_ID.get(outcome.targetCountryId);
      return `Three misses. ${target?.name ?? 'The country'} is revealed in red.`;
    }
    const left = 3 - outcome.misses;
    return `Incorrect. ${left} ${left === 1 ? 'try' : 'tries'} left.`;
  }

  function announceResult(): void {
    if (store.view.name !== 'map-results') return;
    const { firstTryCorrect, total, missedCountryIds } = store.view.result;
    announce(`Map round complete. ${firstTryCorrect} of ${total} first try. ${missedCountryIds.length} to review.`);
  }

  function submitAnswer(countryId: string, selector: string | null): void {
    if (store.view.name !== 'map-quiz' || !store.mapSession) return;
    const currentId = store.mapSession.countryIds[store.mapSession.currentIndex];
    if (!currentId || store.mapSession.targets[currentId]?.resolved) return;

    cancelWrongReset();
    const outcome = store.answerMap(countryId);
    announce(answerAnnouncement());
    // Only unresolved keyboard misses retain an actionable country to restore.
    // Pointer submissions pass no selector, and resolved answers deliberately
    // leave focus under browser control because their answer surface is locked.
    const retryFocusSelector = !outcome.resolved ? selector : null;
    finishInteraction(retryFocusSelector);

    if (!outcome.correct && !outcome.revealed) {
      pendingWrongReset = scheduleFeedbackDwell(LOCATION_WRONG_FEEDBACK_MS, () => {
        pendingWrongReset = null;
        if (store.view.name !== 'map-quiz') return;
        if (store.clearMapWrongFeedback(countryId)) finishInteraction(retryFocusSelector);
      });
    }

    if (!outcome.resolved) return;
    cancelMapAdvance();
    pendingMapAdvance = scheduleFeedbackDwell(resolvedFeedbackDwellMs(outcome), () => {
      pendingMapAdvance = null;
      if (store.view.name !== 'map-quiz') return;
      const result = store.advanceMap();
      if (result) announceResult();
      else if (store.mapSession) {
        const nextId = store.mapSession.countryIds[store.mapSession.currentIndex];
        const next = nextId ? COUNTRY_BY_ID.get(nextId) : undefined;
        if (next) announce(`Next country. Find ${next.name}.`);
      }
      finishInteraction(null);
    });
  }

  function reviewMistakes(): void {
    if (store.view.name !== 'map-results') return;
    void begin('learn', store.view.result.missedCountryIds, store.view.result.session.scope, 'review', true);
  }

  function repeat(): void {
    if (store.view.name !== 'map-results') return;
    void begin(
      store.view.result.session.mode,
      undefined,
      store.view.result.session.scope,
      store.view.result.session.mode,
      true,
    );
  }

  return { currentScope, begin, submitAnswer, announceResult, cancelPending, reviewMistakes, repeat };
}
