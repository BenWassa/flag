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

/**
 * Streak tiers.
 *
 * A running streak is the one piece of momentum a retrieval round has, and a
 * bare number does not read as momentum. Tiers give it somewhere to go without
 * inventing a currency: nothing is stored, nothing is spent, and the tier is
 * gone the moment an answer is missed.
 *
 * Each tier also carries its own count of marks, so the presentation never
 * depends on telling amber from orange.
 */
export type StreakTier = 'warm' | 'hot' | 'blazing';

export const STREAK_TIER_THRESHOLDS: Readonly<Record<StreakTier, number>> = {
  warm: 3,
  hot: 6,
  blazing: 10,
};

/** How many marks a tier shows. Shape, so the tier is never colour alone. */
export const STREAK_TIER_MARKS: Readonly<Record<StreakTier, number>> = {
  warm: 1,
  hot: 2,
  blazing: 3,
};

export function streakTier(streak: number): StreakTier | null {
  if (streak >= STREAK_TIER_THRESHOLDS.blazing) return 'blazing';
  if (streak >= STREAK_TIER_THRESHOLDS.hot) return 'hot';
  if (streak >= STREAK_TIER_THRESHOLDS.warm) return 'warm';
  return null;
}

/**
 * How a completed Play round went, in one word.
 *
 * This is transient result feedback in the same family as the Perfect round
 * acknowledgement: it describes the round that just ended and is never stored,
 * never accumulated and never a rank the learner holds. Durable standing
 * remains region × domain Mastery and above.
 */
export type RoundRankId = 'flawless' | 'strong' | 'solid' | 'building';

export interface RoundRank {
  id: RoundRankId;
  label: string;
  detail: string;
}

export function roundRank(correct: number, total: number): RoundRank {
  if (total <= 0) return { id: 'building', label: 'Building', detail: 'Nothing to score yet.' };
  if (correct >= total) return { id: 'flawless', label: 'Flawless', detail: 'Every one, first time.' };
  const accuracy = correct / total;
  if (accuracy >= 0.9) return { id: 'strong', label: 'Strong', detail: 'A handful left to tighten.' };
  if (accuracy >= 0.7) return { id: 'solid', label: 'Solid', detail: 'The shape of it is there.' };
  return { id: 'building', label: 'Building', detail: 'Another pass will move this.' };
}
