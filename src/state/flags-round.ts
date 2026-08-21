import { COUNTRY_BY_ID } from '../data/countries.js';
import type { LearningActivity, SessionResult, StudyMode, StudyScope } from '../domain/models.js';
import { getRecord, masteryGoal } from '../domain/progress.js';
import { routeForScope } from '../routing/routes.js';
import { setActiveRoundRoute } from './active-round.js';
import type { RoundContext } from './round-context.js';

export interface FlagsRound {
  currentScope(): StudyScope;
  begin(
    scope: StudyScope,
    mode: StudyMode,
    size?: number,
    reviewIds?: string[],
    activity?: LearningActivity,
    replaceRoute?: boolean,
  ): void;
  submitAnswer(countryId: string): void;
  announceResult(): void;
  cancelPending(): void;
  /** Captures the just-rendered result so review/repeat can act on it later. */
  recordResult(result: SessionResult): void;
  /** Returns false (and does nothing) if there is no captured result to review. */
  reviewMistakes(): boolean;
  /** Returns false (and does nothing) if there is no captured result to repeat. */
  repeat(): boolean;
}

export function createFlagsRound(context: RoundContext): FlagsRound {
  const { store, router, announce, finishInteraction, getCurrentRoute, cancelAllPending } = context;

  let lastResultScope: StudyScope | null = null;
  let lastResultMode: StudyMode = 'learn';
  let lastMissedIds: string[] = [];
  let pendingAdvance: number | null = null;

  function cancelPending(): void {
    if (pendingAdvance === null) return;
    window.clearTimeout(pendingAdvance);
    pendingAdvance = null;
  }

  function currentScope(): StudyScope {
    const route = getCurrentRoute();
    if (route.name === 'learning' && route.domain === 'flags' && route.scope) {
      return route.scope;
    }
    return { kind: 'world', label: 'World' };
  }

  function begin(
    scope: StudyScope,
    mode: StudyMode,
    size?: number,
    reviewIds?: string[],
    activity: LearningActivity = mode,
    replaceRoute = false,
  ): void {
    cancelAllPending();
    if (!store.startSession(scope, mode, size, reviewIds)) {
      announce(`${scope.label} has no flags to practise right now.`);
      return;
    }

    const route = routeForScope('flags', scope, activity);
    setActiveRoundRoute(route);
    router.navigate(route, { replace: replaceRoute });
    const count = store.session?.questions.length ?? 0;
    announce(`${scope.label}. ${activity === 'review' ? 'Review' : mode === 'learn' ? 'Learn' : 'Play'} round of ${count} flags. Question 1.`);
  }

  function answerAnnouncement(countryId: string): string {
    if (!store.session) return '';
    const question = store.session.questions[store.session.currentIndex];
    const target = question ? COUNTRY_BY_ID.get(question.countryId) : undefined;
    if (!target) return '';
    if (store.session.mode === 'test') return 'Answer recorded.';

    const record = getRecord(store.progress, target.id);
    const state = record.status === 'mastered'
      ? 'Now mastered.'
      : `Learning, ${record.masteryStreak} of ${masteryGoal(record)} rounds.`;
    return countryId === target.id
      ? `Correct. ${target.name}. ${state}`
      : `Incorrect. The answer is ${target.name}. ${state}`;
  }

  function announceResult(): void {
    if (store.view.name !== 'results') return;
    const { correct, total, newlyMastered } = store.view.result;
    const mastery = newlyMastered.length ? ` ${newlyMastered.length} newly mastered.` : '';
    announce(`Round complete. ${correct} of ${total} correct.${mastery}`);
  }

  function submitAnswer(countryId: string): void {
    if (!store.session || store.answeredCountryId !== null) return;
    store.answer(countryId);
    announce(answerAnnouncement(countryId));

    if (store.session.mode === 'test') {
      cancelPending();
      pendingAdvance = window.setTimeout(() => {
        pendingAdvance = null;
        if (store.view.name !== 'quiz') return;
        store.advance();
        announceResult();
        finishInteraction(null);
      }, 180);
    }
  }

  function recordResult(result: SessionResult): void {
    lastResultScope = result.session.scope;
    lastResultMode = result.session.mode;
    lastMissedIds = [...new Set(result.missed.map((attempt) => attempt.countryId))];
  }

  function reviewMistakes(): boolean {
    if (!lastResultScope || !lastMissedIds.length) return false;
    begin(lastResultScope, 'learn', Math.max(4, Math.min(10, lastMissedIds.length)), lastMissedIds, 'review', true);
    return true;
  }

  function repeat(): boolean {
    if (!lastResultScope) return false;
    begin(lastResultScope, lastResultMode, undefined, undefined, lastResultMode, true);
    return true;
  }

  return {
    currentScope,
    begin,
    submitAnswer,
    announceResult,
    cancelPending,
    recordResult,
    reviewMistakes,
    repeat,
  };
}
