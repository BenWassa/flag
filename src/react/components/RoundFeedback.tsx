import { useEffect } from 'react';
import type { AnswerFeedback, RoundScore } from '../../domain/round-feedback.js';
import {
  STREAK_DISPLAY_THRESHOLD,
  STREAK_TIER_MARKS,
  streakTier,
} from '../../domain/round-feedback.js';
import { pulse } from '../../infrastructure/haptics.js';

export function LiveScore({ score }: { score: RoundScore }) {
  return <div className="round-score" role="group" aria-label="Round score">
    <ScoreItem value={score.correct} label="correct" />
    <ScoreItem value={score.remaining} label="left" />
    {score.streak >= STREAK_DISPLAY_THRESHOLD ? <StreakPill streak={score.streak} /> : null}
  </div>;
}

function ScoreItem({ value, label, modifier = '' }: { value: number; label: string; modifier?: string }) {
  return <span className={`round-score__item ${modifier}`}><span className="round-score__value">{value}</span><span className="round-score__label">{label}</span></span>;
}

/**
 * The one loud thing in a live round.
 *
 * `key` is the streak itself, so every increment remounts the pill and its CSS
 * entrance replays. That keeps the whole effect declarative: no timers, no
 * animation state, and nothing left running if the round ends mid-pop.
 *
 * The tier is drawn as a count of marks as well as a colour. The marks are
 * decoration over a number that is already there, so only they are hidden: the
 * streak itself stays in the score group beside `correct` and `left`, exactly
 * as it did before it grew a tier.
 */
function StreakPill({ streak }: { streak: number }) {
  const tier = streakTier(streak);
  const marks = tier ? STREAK_TIER_MARKS[tier] : 1;
  return (
    <span
      className={`round-score__item round-score__item--streak round-streak${tier ? ` round-streak--${tier}` : ''}`}
      key={streak}
    >
      <span className="round-streak__marks" aria-hidden="true">{'▴'.repeat(marks)}</span>
      <span className="round-score__value">{streak}</span>
      <span className="round-score__label">streak</span>
    </span>
  );
}

export function AnswerFeedbackPanel({ feedback }: { feedback: AnswerFeedback }) {
  // Play mounts this panel once per resolved answer, so mounting IS the moment
  // an answer landed — the one place every domain shares. Haptics decorate
  // feedback the panel already states in words.
  useEffect(() => {
    if (feedback.tone === 'neutral') return;
    pulse(feedback.tone);
  }, [feedback.tone, feedback.detail]);
  return <div className={`answer-feedback answer-feedback--${feedback.tone}`}><div className="feedback-copy"><strong>{feedback.title}</strong><span>{feedback.detail}</span></div></div>;
}
