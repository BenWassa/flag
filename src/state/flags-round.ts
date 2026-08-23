import { COUNTRY_BY_ID } from '../data/countries.js';
import type { LearningActivity, SessionResult, StudyMode, StudyScope } from '../domain/models.js';
import { getRecord, masteryGoal } from '../domain/progress.js';
import { roundScore, scoreAnnouncement } from '../domain/round-feedback.js';
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
  /** Skips the remaining Play feedback dwell. Returns false when nothing is pending. */
  advanceNow(): boolean;
  /** Captures the just-rendered result so review/repeat can act on it later. */
  recordResult(result: SessionResult): void;
  /** Returns false (and does nothing) if there is no captured result to review. */
  reviewMistakes(): boolean;
  /** Returns false (and does nothing) if there is no captured result to repeat. */
  repeat(): boolean;
}

/**
 * Play dwell before the round moves on. A missed answer needs long enough to
 * read the country that was actually being asked for; a correct one does not.
 * Both are skippable with Enter so rapid play is never gated on the timer.
 */
const PLAY_DWELL_CORRECT_MS = 620;
const PLAY_DWELL_WRONG_MS = 1500;

export function createFlagsRound(context: RoundContext): FlagsRound {
  const { store, router, announce, notify, finishInteraction, getCurrentRoute, cancelAllPending } = context;

  let lastResultScope: StudyScope | null = null;
  let lastResultMode: StudyMode = 'learn';
  // Flags Learn is a study surface rather than a round, so the only learn-mode
  // rounds left are reviews. Repeat has to restore the activity that actually
  // ran, or it would navigate back to the study gallery and drop the session.
  let lastActivity: LearningActivity = 'test';
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
      notify(`${scope.label} has no flags to practise right now.`);
      return;
    }

    lastActivity = activity;
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

    if (store.session.mode === 'test') {
      const score = roundScore(store.session.attempts, store.session.questions.length);
      const outcome = countryId === target.id ? 'Correct.' : `Not quite. Answer: ${target.name}.`;
      return `${outcome} ${scoreAnnouncement(score)}`;
    }

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
    const { correct, total, missed, session } = store.view.result;
    const perfect = session.mode === 'test' && missed.length === 0 ? ' Perfect round.' : '';
    announce(`Round complete. ${correct} of ${total} correct.${perfect}`);
  }

  function submitAnswer(countryId: string): void {
    if (!store.session || store.answeredCountryId !== null) return;
    const attempt = store.answer(countryId);
    announce(answerAnnouncement(countryId));

    if (store.session.mode === 'test') {
      cancelPending();
      pendingAdvance = window.setTimeout(
        advancePending,
        attempt.correct ? PLAY_DWELL_CORRECT_MS : PLAY_DWELL_WRONG_MS,
      );
    }
  }

  function advancePending(): void {
    pendingAdvance = null;
    if (store.view.name !== 'quiz') return;
    store.advance();
    announceResult();
    finishInteraction(null);
  }

  function advanceNow(): boolean {
    if (pendingAdvance === null) return false;
    cancelPending();
    advancePending();
    return true;
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
    begin(lastResultScope, lastResultMode, undefined, undefined, lastActivity, true);
    return true;
  }

  return {
    currentScope,
    begin,
    submitAnswer,
    announceResult,
    cancelPending,
    advanceNow,
    recordResult,
    reviewMistakes,
    repeat,
  };
}
