import type { AnswerFeedback, RoundScore } from '../../domain/round-feedback.js';
import { STREAK_DISPLAY_THRESHOLD } from '../../domain/round-feedback.js';

export function LiveScore({ score }: { score: RoundScore }) {
  return <div className="round-score" role="group" aria-label="Round score">
    <ScoreItem value={score.correct} label="correct" />
    <ScoreItem value={score.remaining} label="left" />
    {score.streak >= STREAK_DISPLAY_THRESHOLD ? <ScoreItem value={score.streak} label="streak" modifier="round-score__item--streak" /> : null}
  </div>;
}

function ScoreItem({ value, label, modifier = '' }: { value: number; label: string; modifier?: string }) {
  return <span className={`round-score__item ${modifier}`}><span className="round-score__value">{value}</span><span className="round-score__label">{label}</span></span>;
}

export function AnswerFeedbackPanel({ feedback }: { feedback: AnswerFeedback }) {
  return <div className={`answer-feedback answer-feedback--${feedback.tone}`}><div className="feedback-copy"><strong>{feedback.title}</strong><span>{feedback.detail}</span></div></div>;
}
