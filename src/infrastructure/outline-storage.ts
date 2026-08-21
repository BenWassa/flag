import type { ProgressState, QuizAttempt } from '../domain/models.js';
import { createAttemptLog, loadVersionedRecords, saveVersionedRecords } from './ledger-storage.js';
import { sanitizeRecord } from './storage.js';
import { createStorageGuard } from './storage-guard.js';

// Stable namespace; payloads migrate from schema v1 to v2 on load/save.
const PROGRESS_KEY = 'flag-atlas:outline-progress:v1';
const ATTEMPTS_KEY = 'flag-atlas:outline-attempts:v1';

const guard = createStorageGuard();
const attempts = createAttemptLog<QuizAttempt>(guard, ATTEMPTS_KEY);

export function outlineStorageIsWritable(): boolean {
  return guard.isWritable();
}

// Outlines shares Flags' ProgressRecord shape, so it reuses `sanitizeRecord`
// from storage.ts rather than duplicating a domain-specific one.
export function loadOutlineProgress(): ProgressState | null {
  return loadVersionedRecords(guard, PROGRESS_KEY, sanitizeRecord);
}

export function saveOutlineProgress(state: ProgressState): boolean {
  return saveVersionedRecords(guard, PROGRESS_KEY, state);
}

export function appendOutlineAttempt(attempt: QuizAttempt): void {
  attempts.append(attempt);
}

export function flushOutlineAttempts(): void {
  attempts.flush();
}

export function resetOutlineProgressStorage(): void {
  attempts.reset();
  guard.removeRaw(PROGRESS_KEY);
  guard.removeRaw(ATTEMPTS_KEY);
}
