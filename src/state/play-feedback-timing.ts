/** Shared Play feedback dwell for equivalent one-answer recognition mechanics. */
export const PLAY_FEEDBACK_DWELL_CORRECT_MS = 620;
export const PLAY_FEEDBACK_DWELL_WRONG_MS = 1500;

export function playFeedbackDwellMs(correct: boolean): number {
  return correct ? PLAY_FEEDBACK_DWELL_CORRECT_MS : PLAY_FEEDBACK_DWELL_WRONG_MS;
}
