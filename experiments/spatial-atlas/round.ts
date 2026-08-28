/**
 * Issue #119 prototype — a real Flags round, with no production side effects.
 *
 * IMPORTANT: this deliberately does NOT use `AppStore`. `AppStore.answer()`
 * calls `saveProgress()` and `refreshAchievements()`, so wiring it in would let
 * a throwaway prototype round write the real `flag-atlas:progress:v1` ledger and
 * potentially award real region × domain Mastery. A prototype must never be able
 * to do that.
 *
 * Instead it uses the pure domain question builder — the same `buildQuiz` the
 * production store calls, with the same distractor selection and the same
 * country data — against a throwaway in-memory progress state. The questions a
 * learner sees are genuinely production-generated; nothing is persisted and no
 * achievement can be earned.
 */

import { COUNTRIES, COUNTRY_BY_ID } from '../../src/data/countries.js';
import { createInitialProgress } from '../../src/domain/progress.js';
import { buildQuiz } from '../../src/domain/quiz.js';
import type { Question, StudyScope } from '../../src/domain/models.js';
import { flagUrl } from '../../src/infrastructure/flags.js';

export interface RoundAttempt { countryId: string; selectedCountryId: string; correct: boolean }

export interface PrototypeRound {
  scope: StudyScope;
  questions: Question[];
  index: number;
  attempts: RoundAttempt[];
  answered: string | null;
}

export interface RoundResult {
  scope: StudyScope;
  correct: number;
  total: number;
  missed: RoundAttempt[];
  perfect: boolean;
}

const ROUND_SIZE = 8;

export function startRound(scope: StudyScope): PrototypeRound | null {
  const questions = buildQuiz({
    countries: COUNTRIES,
    // A fresh, unsaved ledger: the prototype neither reads nor writes real evidence.
    progress: createInitialProgress(COUNTRIES),
    scope,
    mode: 'test',
    size: ROUND_SIZE,
    sessionId: `prototype-${Date.now()}`,
  });
  if (!questions.length) return null;
  return { scope, questions, index: 0, attempts: [], answered: null };
}

export function answerRound(round: PrototypeRound, selectedCountryId: string): RoundAttempt | null {
  if (round.answered !== null) return null;
  const question = round.questions[round.index];
  if (!question) return null;
  const attempt: RoundAttempt = {
    countryId: question.countryId,
    selectedCountryId,
    correct: selectedCountryId === question.countryId,
  };
  round.attempts.push(attempt);
  round.answered = selectedCountryId;
  return attempt;
}

/** Returns a result once the last question is answered, otherwise null. */
export function advanceRound(round: PrototypeRound): RoundResult | null {
  if (round.index < round.questions.length - 1) {
    round.index += 1;
    round.answered = null;
    return null;
  }
  const missed = round.attempts.filter((attempt) => !attempt.correct);
  return {
    scope: round.scope,
    correct: round.attempts.length - missed.length,
    total: round.questions.length,
    missed,
    perfect: missed.length === 0,
  };
}

export function currentQuestion(round: PrototypeRound): Question | undefined {
  return round.questions[round.index];
}

export function countryName(id: string): string {
  return COUNTRY_BY_ID.get(id)?.name ?? id;
}

export function countryFlagUrl(id: string): string {
  const country = COUNTRY_BY_ID.get(id);
  return country ? flagUrl(country.iso2) : '';
}
