import type { AnswerFeedback, RoundScore } from '../../domain/round-feedback.js';
import { STREAK_DISPLAY_THRESHOLD } from '../../domain/round-feedback.js';
import { escapeHtml } from '../format.js';

/**
 * Live round score. Rendered inline rather than in a live region: the spoken
 * update travels with the existing per-answer announcement.
 */
export function liveScore(score: RoundScore): string {
  const streak = score.streak >= STREAK_DISPLAY_THRESHOLD
    ? item(String(score.streak), 'streak', 'round-score__item--streak')
    : '';

  return `
    <div class="round-score" role="group" aria-label="Round score">
      ${item(String(score.correct), 'correct')}
      ${item(String(score.remaining), 'left')}
      ${streak}
    </div>
  `;
}

function item(value: string, label: string, modifier = ''): string {
  return `
    <span class="round-score__item ${modifier}">
      <span class="round-score__value">${escapeHtml(value)}</span>
      <span class="round-score__label">${escapeHtml(label)}</span>
    </span>
  `;
}

/**
 * Per-answer feedback. The tone word carries the meaning on its own so the
 * state never depends on colour alone.
 */
export function answerFeedbackPanel(feedback: AnswerFeedback): string {
  return `
    <div class="answer-feedback answer-feedback--${feedback.tone}">
      <div class="feedback-copy">
        <strong>${escapeHtml(feedback.title)}</strong>
        <span>${escapeHtml(feedback.detail)}</span>
      </div>
    </div>
  `;
}
