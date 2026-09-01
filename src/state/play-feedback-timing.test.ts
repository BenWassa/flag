import { describe, expect, it } from 'vitest';
import { PLAY_FEEDBACK_DWELL_CORRECT_MS, PLAY_FEEDBACK_DWELL_WRONG_MS, playFeedbackDwellMs } from './play-feedback-timing.js';

describe('Play feedback dwell', () => {
  it('keeps correct feedback readable without stalling play', () => {
    expect(playFeedbackDwellMs(true)).toBe(620);
    expect(PLAY_FEEDBACK_DWELL_CORRECT_MS).toBeGreaterThanOrEqual(400);
    expect(PLAY_FEEDBACK_DWELL_CORRECT_MS).toBeLessThanOrEqual(900);
  });

  it('gives wrong feedback longer to read', () => {
    expect(playFeedbackDwellMs(false)).toBe(1500);
    expect(PLAY_FEEDBACK_DWELL_WRONG_MS).toBeGreaterThan(PLAY_FEEDBACK_DWELL_CORRECT_MS);
    expect(PLAY_FEEDBACK_DWELL_WRONG_MS).toBeGreaterThanOrEqual(1200);
  });
});
