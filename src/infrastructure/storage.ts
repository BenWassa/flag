import type { ProgressState, QuizAttempt } from '../domain/models.js';

const PROGRESS_KEY = 'flag-atlas:progress:v1';
const ATTEMPTS_KEY = 'flag-atlas:attempts:v1';

export function loadProgress(): ProgressState | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProgressState;
    return parsed.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function saveProgress(progress: ProgressState): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function loadAttempts(): QuizAttempt[] {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    return raw ? (JSON.parse(raw) as QuizAttempt[]) : [];
  } catch {
    return [];
  }
}

export function appendAttempt(attempt: QuizAttempt): void {
  const attempts = loadAttempts();
  attempts.push(attempt);
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts.slice(-5000)));
}

export function resetAllProgress(): void {
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(ATTEMPTS_KEY);
}
