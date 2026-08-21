import { COUNTRY_BY_ID } from '../data/countries.js';
import { AFRICA_MAP_SCOPE } from '../data/map-scopes.js';
import { loadMapAsset } from '../data/maps/index.js';
import type { LearningActivity, StudyScope } from '../domain/models.js';
import type { MapMode, MapRegionAsset } from '../domain/map-models.js';
import { routeForScope } from '../routing/routes.js';
import { setActiveRoundRoute } from './active-round.js';
import { beginRoundLaunch, isCurrentRoundLaunch } from './round-launch-guard.js';
import type { RoundContext } from './round-context.js';

export interface LocationsRound {
  currentScope(): StudyScope;
  begin(
    mode: MapMode,
    targetCountryIds?: readonly string[],
    scope?: StudyScope,
    activity?: LearningActivity,
    replaceRoute?: boolean,
  ): Promise<void>;
  submitAnswer(countryId: string, selector: string): void;
  announceResult(): void;
  cancelPending(): void;
  /** No-op unless a map round has just finished (mirrors the original app.ts view-name guard). */
  reviewMistakes(): void;
  repeat(): void;
}

export function createLocationsRound(context: RoundContext): LocationsRound {
  const { store, router, announce, finishInteraction, getCurrentRoute, cancelAllPending } = context;

  let pendingMapAdvance: number | null = null;

  function cancelPending(): void {
    if (pendingMapAdvance === null) return;
    window.clearTimeout(pendingMapAdvance);
    pendingMapAdvance = null;
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
      if (isCurrentRoundLaunch(request)) announce(`${scope.label} map could not be loaded.`);
      return;
    }
    if (!isCurrentRoundLaunch(request)) return;
    if (!asset) {
      announce(`${scope.label} map could not be loaded.`);
      return;
    }
    if (!store.startMapSession(asset, mode, targetCountryIds)) {
      announce('No map locations are available for this round.');
      return;
    }

    const route = routeForScope('locations', scope, activity);
    setActiveRoundRoute(route);
    router.navigate(route, { replace: replaceRoute });
    announce(`${asset.scope.label} locations. ${activity === 'review' ? 'Review' : mode === 'learn' ? 'Learn' : 'Play'} round of ${store.mapSession?.countryIds.length ?? 0} countries.`);
  }

  function answerAnnouncement(): string {
    const outcome = store.mapLastOutcome;
    const session = store.mapSession;
    if (!outcome || !session) return '';
    if (session.mode === 'test') return 'Location recorded.';
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

  function submitAnswer(countryId: string, selector: string): void {
    if (store.view.name !== 'map-quiz' || !store.mapSession) return;
    const currentId = store.mapSession.countryIds[store.mapSession.currentIndex];
    if (!currentId || store.mapSession.targets[currentId]?.resolved) return;

    const outcome = store.answerMap(countryId);
    const advanceDelay = store.mapSession.mode === 'test'
      ? 180
      : outcome.revealed
        ? 1400
        : outcome.misses >= 2
          ? 850
          : outcome.misses === 1
            ? 700
            : 520;
    announce(answerAnnouncement());
    finishInteraction(selector);

    if (!outcome.resolved) return;
    cancelPending();
    pendingMapAdvance = window.setTimeout(() => {
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
    }, advanceDelay);
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
