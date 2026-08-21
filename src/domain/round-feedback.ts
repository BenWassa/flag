/**
 * Shared per-answer feedback and live-score contract for Play rounds.
 *
 * Domain rule engines stay authoritative: these helpers only describe outcomes
 * those engines have already decided, so every learning domain can present the
 * same feedback and score shape without duplicating rules in view code.
 */

export type AnswerTone = 'correct' | 'wrong' | 'neutral';

export interface AnswerFeedback {
  tone: AnswerTone;
  /** Short headline, e.g. `Correct`. */
  title: string;
  /** Supporting line, e.g. the country that was actually being asked for. */
  detail: string;
}

export interface RoundScore {
  correct: number;
  answered: number;
  remaining: number;
  total: number;
  /** Trailing run of correct answers; `0` once an answer is missed. */
  streak: number;
}

/** Minimal shape shared by every domain's attempt record. */
export interface ScoredAttempt {
  readonly correct: boolean;
}

/** Streaks below this read as noise rather than momentum, so they stay hidden. */
export const STREAK_DISPLAY_THRESHOLD = 2;

export function roundScore(attempts: readonly ScoredAttempt[], total: number): RoundScore {
  const answered = Math.min(attempts.length, total);
  const correct = attempts.filter((attempt) => attempt.correct).length;

  let streak = 0;
  for (let index = attempts.length - 1; index >= 0 && attempts[index].correct; index -= 1) {
    streak += 1;
  }

  return { correct, answered, remaining: Math.max(0, total - answered), total, streak };
}

export function answerFeedback(correct: boolean, answerName: string): AnswerFeedback {
  return correct
    ? { tone: 'correct', title: 'Correct', detail: answerName }
    : { tone: 'wrong', title: 'Not quite', detail: `Answer: ${answerName}` };
}

/**
 * One concise spoken summary per scored answer. Assistive technology hears the
 * outcome and the running score without a second competing live region.
 */
export function scoreAnnouncement(score: RoundScore): string {
  const streak = score.streak >= STREAK_DISPLAY_THRESHOLD ? ` Streak ${score.streak}.` : '';
  return `Score ${score.correct} of ${score.answered}. ${score.remaining} left.${streak}`;
}
