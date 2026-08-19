import type { ProgressRecord, ProgressState, QuizAttempt } from '../domain/models.js';
import { sanitizeRecord } from './storage.js';

const PROGRESS_KEY = 'flag-atlas:outline-progress:v1';
const ATTEMPTS_KEY = 'flag-atlas:outline-attempts:v1';
const ATTEMPT_LIMIT = 2000;
const FLUSH_DELAY_MS = 500;

let writable = true;
let attemptCache: QuizAttempt[] | null = null;
let flushHandle: number | null = null;

export function outlineStorageIsWritable(): boolean {
  return writable;
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    writable = false;
    return null;
  }
}

function writeRaw(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    writable = false;
    return false;
  }
}

export function loadOutlineProgress(): ProgressState | null {
  const raw = readRaw(PROGRESS_KEY);
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') return null;
  const state = parsed as { version?: unknown; records?: unknown };
  if (state.version !== 1 || !state.records || typeof state.records !== 'object') return null;

  const records: Record<string, ProgressRecord> = {};
  for (const [countryId, value] of Object.entries(state.records as Record<string, unknown>)) {
    const record = sanitizeRecord(countryId, value);
    if (record) records[countryId] = record;
  }
  return { version: 1, records };
}

export function saveOutlineProgress(state: ProgressState): boolean {
  return writeRaw(PROGRESS_KEY, JSON.stringify(state));
}

function loadOutlineAttempts(): QuizAttempt[] {
  if (attemptCache) return attemptCache;
  const raw = readRaw(ATTEMPTS_KEY);
  if (!raw) return (attemptCache = []);
  try {
    const parsed = JSON.parse(raw);
    attemptCache = Array.isArray(parsed) ? parsed as QuizAttempt[] : [];
  } catch {
    attemptCache = [];
  }
  return attemptCache;
}

export function appendOutlineAttempt(attempt: QuizAttempt): void {
  const attempts = loadOutlineAttempts();
  attempts.push(attempt);
  if (attempts.length > ATTEMPT_LIMIT) attempts.splice(0, attempts.length - ATTEMPT_LIMIT);
  if (flushHandle !== null) return;

  flushHandle = window.setTimeout(() => {
    flushHandle = null;
    flushOutlineAttempts();
  }, FLUSH_DELAY_MS);
}

export function flushOutlineAttempts(): void {
  if (flushHandle !== null) {
    window.clearTimeout(flushHandle);
    flushHandle = null;
  }
  if (!attemptCache) return;
  writeRaw(ATTEMPTS_KEY, JSON.stringify(attemptCache));
}

export function resetOutlineProgressStorage(): void {
  if (flushHandle !== null) {
    window.clearTimeout(flushHandle);
    flushHandle = null;
  }
  attemptCache = [];
  try {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(ATTEMPTS_KEY);
  } catch {
    // In-memory reset remains useful when persistence is blocked.
  }
}
