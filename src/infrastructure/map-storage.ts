import type { LearningStatus } from '../domain/models.js';
import type { LocationProgressRecord, LocationProgressState, MapAttempt } from '../domain/map-models.js';

const PROGRESS_KEY = 'flag-atlas:location-progress:v1';
const ATTEMPTS_KEY = 'flag-atlas:location-attempts:v1';
const ATTEMPT_LIMIT = 2000;
const FLUSH_DELAY_MS = 500;
const STATUSES: readonly LearningStatus[] = ['unseen', 'learning', 'mastered'];

let writable = true;
let attemptCache: MapAttempt[] | null = null;
let flushHandle: number | null = null;

export function mapStorageIsWritable(): boolean {
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

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function toConfusions(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {};
  const counts: Record<string, number> = {};
  for (const [countryId, raw] of Object.entries(value as Record<string, unknown>)) {
    const count = toCount(raw);
    if (count > 0) counts[countryId] = count;
  }
  return counts;
}

export function sanitizeLocationRecord(countryId: string, value: unknown): LocationProgressRecord | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const status = STATUSES.find((item) => item === raw.status);
  if (!status) return null;

  return {
    countryId,
    status,
    masteryStreak: toCount(raw.masteryStreak),
    lifetimeResolved: toCount(raw.lifetimeResolved),
    lifetimeFirstTryCorrect: toCount(raw.lifetimeFirstTryCorrect),
    lifetimeIncorrectGuesses: toCount(raw.lifetimeIncorrectGuesses),
    revealCount: toCount(raw.revealCount),
    lapseCount: toCount(raw.lapseCount),
    firstSeenAt: toOptionalString(raw.firstSeenAt),
    lastSeenAt: toOptionalString(raw.lastSeenAt),
    lastCorrectAt: toOptionalString(raw.lastCorrectAt),
    lastMissedAt: toOptionalString(raw.lastMissedAt),
    masteredAt: toOptionalString(raw.masteredAt),
    lastMasteryCreditSessionId: toOptionalString(raw.lastMasteryCreditSessionId),
    confusionCounts: toConfusions(raw.confusionCounts),
  };
}

export function loadLocationProgress(): LocationProgressState | null {
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

  const records: Record<string, LocationProgressRecord> = {};
  for (const [countryId, value] of Object.entries(state.records as Record<string, unknown>)) {
    const record = sanitizeLocationRecord(countryId, value);
    if (record) records[countryId] = record;
  }
  return { version: 1, records };
}

export function saveLocationProgress(state: LocationProgressState): boolean {
  return writeRaw(PROGRESS_KEY, JSON.stringify(state));
}

function loadMapAttempts(): MapAttempt[] {
  if (attemptCache) return attemptCache;
  const raw = readRaw(ATTEMPTS_KEY);
  if (!raw) return (attemptCache = []);
  try {
    const parsed = JSON.parse(raw);
    attemptCache = Array.isArray(parsed) ? parsed as MapAttempt[] : [];
  } catch {
    attemptCache = [];
  }
  return attemptCache;
}

export function appendMapAttempt(attempt: MapAttempt): void {
  const attempts = loadMapAttempts();
  attempts.push(attempt);
  if (attempts.length > ATTEMPT_LIMIT) attempts.splice(0, attempts.length - ATTEMPT_LIMIT);
  if (flushHandle !== null) return;
  flushHandle = window.setTimeout(() => {
    flushHandle = null;
    flushMapAttempts();
  }, FLUSH_DELAY_MS);
}

export function flushMapAttempts(): void {
  if (flushHandle !== null) {
    window.clearTimeout(flushHandle);
    flushHandle = null;
  }
  if (!attemptCache) return;
  writeRaw(ATTEMPTS_KEY, JSON.stringify(attemptCache));
}

export function resetMapProgressStorage(): void {
  if (flushHandle !== null) {
    window.clearTimeout(flushHandle);
    flushHandle = null;
  }
  attemptCache = [];
  try {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(ATTEMPTS_KEY);
  } catch {
    // In-memory reset remains useful even when the browser blocks persistence.
  }
}
