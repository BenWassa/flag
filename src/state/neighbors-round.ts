import { FULL_REGION_ROUND_SIZE, isFullRegionPlayLaunch } from '../domain/achievements.js';
import { COUNTRY_BY_ID } from '../data/countries.js';
import { AFRICA_MAP_SCOPE } from '../data/map-scopes.js';
import { NO_LAND_NEIGHBORS_ID, NO_LAND_NEIGHBORS_LABEL } from '../domain/neighbor-game.js';
import type { LearningActivity, StudyMode, StudyScope } from '../domain/models.js';
import { routeForScope } from '../routing/routes.js';
import { setActiveRoundRoute } from './active-round.js';
import type { RoundContext } from './round-context.js';

export interface NeighborsRound {
  currentScope(): StudyScope;
  begin(
    mode: StudyMode,
    targetCountryIds?: readonly string[],
    scope?: StudyScope,
    activity?: LearningActivity,
    replaceRoute?: boolean,
  ): void;
  submitGuess(countryId: string): void;
  /** The `next-neighbor` action: advances past a completed target and announces the outcome. */
  advance(): void;
  announceResult(): void;
  /** No-op unless a neighbours round has just finished (mirrors the original app.ts view-name guard). */
  reviewMistakes(): void;
  repeat(): void;
  getQuery(): string;
  setQuery(value: string): void;
  resetQuery(): void;
}

export function createNeighborsRound(context: RoundContext): NeighborsRound {
  const { store, router, announce, notify, finishInteraction, getCurrentRoute, cancelAllPending } = context;

  let neighborQuery = '';

  function getQuery(): string {
    return neighborQuery;
  }

  function setQuery(value: string): void {
    neighborQuery = value;
  }

  function resetQuery(): void {
    neighborQuery = '';
  }

  function currentScope(): StudyScope {
    const route = getCurrentRoute();
    if (route.name === 'learning' && route.domain === 'neighbors' && route.scope) return route.scope;
    if (store.view.name === 'neighbor-results') return store.view.result.session.scope;
    return store.neighborSession?.scope ?? AFRICA_MAP_SCOPE;
  }

  function begin(
    mode: StudyMode,
    targetCountryIds?: readonly string[],
    scope: StudyScope = currentScope(),
    activity: LearningActivity = mode,
    replaceRoute = false,
  ): void {
    cancelAllPending();
    // #108: an ordinary region Play covers the complete region, because that is
    // what region x domain Mastery claims the learner demonstrated. Sampled
    // rounds at other scopes are unchanged.
    const size = targetCountryIds?.length
      ?? (isFullRegionPlayLaunch(scope, mode) ? FULL_REGION_ROUND_SIZE : 10);
    if (!store.startNeighborSession(scope, mode, size, targetCountryIds)) {
      notify(`${scope.label} has no land-neighbour targets to practise right now.`);
      return;
    }
    resetQuery();
    const route = routeForScope('neighbors', scope, activity);
    setActiveRoundRoute(route);
    router.navigate(route, { replace: replaceRoute });
    const targetId = store.neighborSession?.countryIds[0];
    const target = targetId ? COUNTRY_BY_ID.get(targetId) : undefined;
    announce(`${scope.label} neighbours. ${activity === 'review' ? 'Review' : mode === 'learn' ? 'Learn' : 'Play'} round. ${target ? `Name every land neighbour of ${target.name}.` : ''}`);
  }

  function answerAnnouncement(): string {
    const outcome = store.neighborLastOutcome;
    if (!outcome) return '';
    if (outcome.kind === 'duplicate') return 'Already guessed. No attempt used.';
    const claimedEmptySet = outcome.selectedCountryId === NO_LAND_NEIGHBORS_ID;
    const selected = claimedEmptySet
      ? NO_LAND_NEIGHBORS_LABEL
      : COUNTRY_BY_ID.get(outcome.selectedCountryId)?.name ?? outcome.selectedCountryId;

    if (outcome.resolved && outcome.resolution === 'exhausted') {
      if (outcome.totalNeighbors === 0) return `Attempts exhausted. ${NO_LAND_NEIGHBORS_LABEL}.`;
      const remaining = outcome.revealedIds.map((id) => COUNTRY_BY_ID.get(id)?.name ?? id).join(', ');
      return `Attempts exhausted. Remaining neighbours: ${remaining}.`;
    }
    if (outcome.resolved) {
      return outcome.totalNeighbors === 0
        ? `Complete. ${NO_LAND_NEIGHBORS_LABEL}.`
        : `Complete. ${outcome.foundCount} of ${outcome.totalNeighbors} neighbours found.`;
    }
    if (outcome.kind === 'correct') {
      return `Correct. ${selected}. ${outcome.foundCount} found. ${outcome.remainingAttempts} attempts left.`;
    }
    return claimedEmptySet
      ? `Incorrect. This country does have land neighbours. ${outcome.remainingAttempts} attempts left.`
      : `Incorrect. ${selected} is not in this neighbour set. ${outcome.remainingAttempts} attempts left.`;
  }

  function announceResult(): void {
    if (store.view.name !== 'neighbor-results') return;
    const { cleanCompletions, total, missedCountryIds } = store.view.result;
    announce(`Neighbour round complete. ${cleanCompletions} of ${total} clean completions. ${missedCountryIds.length} to review.`);
  }

  function submitGuess(countryId: string): void {
    if (store.view.name !== 'neighbor-quiz' || !store.neighborSession) return;
    const targetId = store.neighborSession.countryIds[store.neighborSession.currentIndex];
    if (!targetId || store.neighborSession.targets[targetId]?.resolved) return;
    const outcome = store.answerNeighbor(countryId);
    resetQuery();
    announce(answerAnnouncement());
    finishInteraction(outcome.resolved ? null : '[data-neighbor-input]');
  }

  function advance(): void {
    const result = store.advanceNeighbor();
    resetQuery();
    if (result) announceResult();
    else if (store.neighborSession) {
      const nextId = store.neighborSession.countryIds[store.neighborSession.currentIndex];
      const next = nextId ? COUNTRY_BY_ID.get(nextId) : undefined;
      if (next) announce(`Next country. Name every land neighbour of ${next.name}.`);
    }
    finishInteraction(result ? null : '[data-neighbor-input]');
  }

  function reviewMistakes(): void {
    if (store.view.name !== 'neighbor-results') return;
    begin('learn', store.view.result.missedCountryIds, store.view.result.session.scope, 'review', true);
  }

  function repeat(): void {
    if (store.view.name !== 'neighbor-results') return;
    begin(
      store.view.result.session.mode,
      undefined,
      store.view.result.session.scope,
      store.view.result.session.mode,
      true,
    );
  }

  return {
    currentScope,
    begin,
    submitGuess,
    advance,
    announceResult,
    getQuery,
    setQuery,
    resetQuery,
    reviewMistakes,
    repeat,
  };
}
