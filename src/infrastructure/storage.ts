import type { LearningStatus, ProgressRecord, ProgressState, QuizAttempt } from '../domain/models.js';

const PROGRESS_KEY = 'flag-atlas:progress:v1';
const ATTEMPTS_KEY = 'flag-atlas:attempts:v1';

/**
 * The attempt log is study history rather than the ledger, so it is capped. A
 * long-running install must not let the cost of writing one answer grow without
 * bound.
 */
const ATTEMPT_LIMIT = 2000;

/** Trailing delay before the log is serialised, so answering never pays for it. */
const FLUSH_DELAY_MS = 500;

const STATUSES: readonly LearningStatus[] = ['unseen', 'learning', 'mastered'];

/**
 * Persistence is an enhancement, never a precondition for studying. Safari
 * private mode throws on every write, a blocked-cookie policy throws on read,
 * and a full origin quota throws once the log grows. Any of those escaped
 * `saveProgress` into the answer handler and froze the round on the question
 * the learner had just answered, so every access is guarded here and failure
 * degrades to an in-memory session that the app can report.
 */
let writable = true;

export function storageIsWritable(): boolean {
  return writable;
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // A read that throws is a policy block, so writes cannot succeed either.
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

function parseJson(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// --- Sanitising a persisted ledger ---------------------------------------
// Stored progress outlives the release that wrote it, can be truncated by a
// crashed write, and can be edited by hand. It is parsed as unknown and rebuilt
// field by field: a single `null` record, or a `masteryStreak` of `null`, used
// to reach the views as a thrown TypeError or a rendered NaN.

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function toOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function toConfusionCounts(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {};
  const counts: Record<string, number> = {};
  for (const [countryId, raw] of Object.entries(value as Record<string, unknown>)) {
    const count = toCount(raw);
    if (count > 0) counts[countryId] = count;
  }
  return counts;
}

export function sanitizeRecord(countryId: string, value: unknown): ProgressRecord | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const status = STATUSES.find((item) => item === raw.status);
  if (!status) return null;

  return {
    countryId,
    status,
    masteryStreak: toCount(raw.masteryStreak),
    lifetimeCorrect: toCount(raw.lifetimeCorrect),
    lifetimeIncorrect: toCount(raw.lifetimeIncorrect),
    currentCorrectStreak: toCount(raw.currentCorrectStreak),
    lapseCount: toCount(raw.lapseCount),
    retentionLevel: toCount(raw.retentionLevel),
    lastMasteryCreditSessionId: toOptionalString(raw.lastMasteryCreditSessionId),
    firstSeenAt: toOptionalString(raw.firstSeenAt),
    lastSeenAt: toOptionalString(raw.lastSeenAt),
    lastCorrectAt: toOptionalString(raw.lastCorrectAt),
    lastIncorrectAt: toOptionalString(raw.lastIncorrectAt),
    masteredAt: toOptionalString(raw.masteredAt),
    nextReviewAt: toOptionalString(raw.nextReviewAt),
    averageResponseTimeMs: toOptionalNumber(raw.averageResponseTimeMs),
    confusionCounts: toConfusionCounts(raw.confusionCounts),
  };
}

export function loadProgress(): ProgressState | null {
  const parsed = parseJson(readRaw(PROGRESS_KEY));
  if (!parsed || typeof parsed !== 'object') return null;

  const state = parsed as { version?: unknown; records?: unknown };
  if (state.version !== 1) return null;
  if (!state.records || typeof state.records !== 'object') return null;

  const records: Record<string, ProgressRecord> = {};
  for (const [countryId, value] of Object.entries(state.records as Record<string, unknown>)) {
    const record = sanitizeRecord(countryId, value);
    if (record) records[countryId] = record;
  }

  return { version: 1, records };
}

/** Returns false when the ledger could not be written, so the caller can say so. */
export function saveProgress(progress: ProgressState): boolean {
  return writeRaw(PROGRESS_KEY, JSON.stringify(progress));
}

// --- Attempt log ----------------------------------------------------------

let attemptCache: QuizAttempt[] | null = null;
let flushHandle: number | null = null;

export function loadAttempts(): QuizAttempt[] {
  if (attemptCache) return attemptCache;
  const parsed = parseJson(readRaw(ATTEMPTS_KEY));
  attemptCache = Array.isArray(parsed) ? (parsed as QuizAttempt[]) : [];
  return attemptCache;
}

/**
 * Appending used to re-read, parse and re-serialise the whole log inside the
 * answer handler, so one tap cost more the longer someone had studied. The log
 * is held in memory and written on a trailing delay instead; `flushAttempts`
 * covers the page going away before that delay elapses.
 */
export function appendAttempt(attempt: QuizAttempt): void {
  const attempts = loadAttempts();
  attempts.push(attempt);
  if (attempts.length > ATTEMPT_LIMIT) attempts.splice(0, attempts.length - ATTEMPT_LIMIT);

  if (flushHandle !== null) return;
  flushHandle = window.setTimeout(() => {
    flushHandle = null;
    flushAttempts();
  }, FLUSH_DELAY_MS);
}

export function flushAttempts(): void {
  if (flushHandle !== null) {
    window.clearTimeout(flushHandle);
    flushHandle = null;
  }
  if (!attemptCache) return;
  writeRaw(ATTEMPTS_KEY, JSON.stringify(attemptCache));
}

export function resetAllProgress(): void {
  if (flushHandle !== null) {
    window.clearTimeout(flushHandle);
    flushHandle = null;
  }
  attemptCache = [];
  try {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(ATTEMPTS_KEY);
  } catch {
    // Nothing durable to erase; the in-memory reset the caller performs is enough.
  }
}
