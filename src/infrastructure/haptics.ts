/**
 * Physical answer feedback.
 *
 * Atlas is played with a thumb, and on a phone the cheapest way to make a
 * correct answer feel like something is to let the device confirm it. This is a
 * decoration on feedback the interface already carries visually and in text: it
 * never conveys state on its own, and every path through it must survive the
 * API being absent.
 *
 * Support is genuinely partial. `navigator.vibrate` is an Android/Chromium
 * feature; iOS Safari does not implement it, so on iPhone every call here is a
 * no-op and the round is unchanged. Nothing may be built on top of it.
 */
export type HapticPulse = 'tap' | 'correct' | 'wrong';

/** Short enough to read as confirmation rather than as an alert. */
const PATTERNS: Readonly<Record<HapticPulse, number | number[]>> = {
  tap: 8,
  correct: 14,
  wrong: [18, 40, 18],
};

function vibrationSuppressed(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  // Someone who has asked for less motion has asked for a calmer interface, not
  // merely for fewer transitions.
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function pulse(kind: HapticPulse): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  if (vibrationSuppressed()) return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    // Some browsers reject vibration outside a user gesture, or when the page
    // is not visible. A refused pulse is not an error worth surfacing.
  }
}
