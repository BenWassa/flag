import { COUNTRY_BY_ID } from '../data/countries.js';
import { AFRICA_MAP_SCOPE } from '../data/map-scopes.js';
import { loadOutlineAsset } from '../data/outlines.js';
import type { LearningActivity, StudyMode, StudyScope } from '../domain/models.js';
import { getRecord, masteryGoal } from '../domain/progress.js';
import { routeForScope } from '../routing/routes.js';
import { setActiveRoundRoute } from './active-round.js';
import { beginRoundLaunch, isCurrentRoundLaunch } from './round-launch-guard.js';
import type { RoundContext } from './round-context.js';

export interface OutlinesRound {
  currentScope(): StudyScope;
  begin(
    mode: StudyMode,
    targetCountryIds?: readonly string[],
    scope?: StudyScope,
    activity?: LearningActivity,
    replaceRoute?: boolean,
  ): Promise<void>;
  submitAnswer(countryId: string): void;
  announceResult(): void;
  cancelPending(): void;
  /** No-op unless an outline round has just finished (mirrors the original app.ts view-name guard). */
  reviewMistakes(): void;
  repeat(): void;
}

export function createOutlinesRound(context: RoundContext): OutlinesRound {
  const { store, router, announce, notify, finishInteraction, getCurrentRoute, cancelAllPending } = context;

  let pendingOutlineAdvance: number | null = null;

  function cancelPending(): void {
    if (pendingOutlineAdvance === null) return;
    window.clearTimeout(pendingOutlineAdvance);
    pendingOutlineAdvance = null;
  }

  function currentScope(): StudyScope {
    const route = getCurrentRoute();
    if (route.name === 'learning' && route.domain === 'outlines' && route.scope) {
      return route.scope;
    }
    if (store.view.name === 'outline-results') return store.view.result.session.scope;
    return store.outlineSession?.scope ?? AFRICA_MAP_SCOPE;
  }

  async function begin(
    mode: StudyMode,
    targetCountryIds?: readonly string[],
    scope: StudyScope = currentScope(),
    activity: LearningActivity = mode,
    replaceRoute = false,
  ): Promise<void> {
    cancelAllPending();
    const request = beginRoundLaunch();
    let asset: Awaited<ReturnType<typeof loadOutlineAsset>>;
    try {
      asset = await loadOutlineAsset(scope.id ?? 'africa');
    } catch {
      if (isCurrentRoundLaunch(request)) notify(`${scope.label} silhouettes could not be loaded. Check your connection and try again.`);
      return;
    }
    if (!isCurrentRoundLaunch(request)) return;
    if (!asset) {
      notify(`${scope.label} silhouettes could not be loaded. Check your connection and try again.`);
      return;
    }
    const size = targetCountryIds ? Math.max(1, Math.min(10, targetCountryIds.length)) : 10;
    if (!store.startOutlineSession(asset, mode, size, targetCountryIds)) {
      notify('No country outlines are available for this round.');
      return;
    }

    const route = routeForScope('outlines', scope, activity);
    setActiveRoundRoute(route);
    router.navigate(route, { replace: replaceRoute });
    announce(`${asset.scope.label} outlines. ${activity === 'review' ? 'Review' : mode === 'learn' ? 'Learn' : 'Play'} round of ${store.outlineSession?.questions.length ?? 0} countries. Question 1.`);
  }

  function answerAnnouncement(countryId: string): string {
    if (!store.outlineSession) return '';
    const question = store.outlineSession.questions[store.outlineSession.currentIndex];
    const target = question ? COUNTRY_BY_ID.get(question.countryId) : undefined;
    if (!target) return '';
    if (store.outlineSession.mode === 'test') return 'Answer recorded.';

    const record = getRecord(store.outlineProgress, target.id);
    const state = record.status === 'mastered'
      ? 'Now mastered.'
      : `Learning, ${record.masteryStreak} of ${masteryGoal(record)} rounds.`;
    return countryId === target.id
      ? `Correct. ${target.name}. ${state}`
      : `Incorrect. The answer is ${target.name}. ${state}`;
  }

  function announceResult(): void {
    if (store.view.name !== 'outline-results') return;
    const { correct, total, newlyMastered } = store.view.result;
    const mastery = newlyMastered.length ? ` ${newlyMastered.length} newly mastered.` : '';
    announce(`Outline round complete. ${correct} of ${total} correct.${mastery}`);
  }

  function submitAnswer(countryId: string): void {
    if (!store.outlineSession || store.outlineAnsweredCountryId !== null) return;
    store.answerOutline(countryId);
    announce(answerAnnouncement(countryId));

    if (store.outlineSession.mode === 'test') {
      cancelPending();
      pendingOutlineAdvance = window.setTimeout(() => {
        pendingOutlineAdvance = null;
        if (store.view.name !== 'outline-quiz') return;
        store.advanceOutline();
        announceResult();
        finishInteraction(null);
      }, 180);
    }
  }

  function reviewMistakes(): void {
    if (store.view.name !== 'outline-results') return;
    const missedIds = [...new Set(store.view.result.missed.map((attempt) => attempt.countryId))];
    void begin('learn', missedIds, store.view.result.session.scope, 'review', true);
  }

  function repeat(): void {
    if (store.view.name !== 'outline-results') return;
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
