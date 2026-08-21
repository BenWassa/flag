import type { StorageGuard } from './storage-guard.js';
import { parseJson } from './sanitize.js';

/**
 * Every domain persists its ledger as `{ version, records: Record<id, TRecord> }`
 * under a stable per-domain key, and migrates schema v1 payloads forward to v2
 * on load. This shared loader handles the envelope (version check, object
 * shape, per-record sanitisation); each domain still supplies its own
 * `sanitizeRecord` because the record shape itself is domain-specific.
 */
export function loadVersionedRecords<TRecord>(
  guard: StorageGuard,
  key: string,
  sanitizeRecord: (id: string, value: unknown) => TRecord | null,
): { version: 2; records: Record<string, TRecord> } | null {
  const parsed = parseJson(guard.readRaw(key));
  if (!parsed || typeof parsed !== 'object') return null;

  const state = parsed as { version?: unknown; records?: unknown };
  if ((state.version !== 1 && state.version !== 2) || !state.records || typeof state.records !== 'object') {
    return null;
  }

  const records: Record<string, TRecord> = {};
  for (const [id, value] of Object.entries(state.records as Record<string, unknown>)) {
    const record = sanitizeRecord(id, value);
    if (record) records[id] = record;
  }
  return { version: 2, records };
}

export function saveVersionedRecords(guard: StorageGuard, key: string, state: unknown): boolean {
  return guard.writeRaw(key, JSON.stringify(state));
}

/** Study history is capped so the cost of writing one answer never grows unbounded. */
const ATTEMPT_LIMIT = 2000;

/** Trailing delay before the log is serialised, so answering never pays for it. */
const FLUSH_DELAY_MS = 500;

export interface AttemptLog<TAttempt> {
  load(): TAttempt[];
  /** Appending mutates the in-memory cache and schedules a debounced flush. */
  append(attempt: TAttempt): void;
  /** Serialises the cache immediately; covers the page going away before the debounce fires. */
  flush(): void;
  /** Clears the cache and cancels any pending flush, without touching localStorage. */
  reset(): void;
}

/**
 * Appending used to re-read, parse and re-serialise the whole log inside the
 * answer handler, so one tap cost more the longer someone had studied. The
 * log is held in memory and written on a trailing delay instead.
 */
export function createAttemptLog<TAttempt>(guard: StorageGuard, key: string): AttemptLog<TAttempt> {
  let cache: TAttempt[] | null = null;
  let flushHandle: number | null = null;

  function load(): TAttempt[] {
    if (cache) return cache;
    const parsed = parseJson(guard.readRaw(key));
    cache = Array.isArray(parsed) ? (parsed as TAttempt[]) : [];
    return cache;
  }

  function flush(): void {
    if (flushHandle !== null) {
      window.clearTimeout(flushHandle);
      flushHandle = null;
    }
    if (!cache) return;
    guard.writeRaw(key, JSON.stringify(cache));
  }

  function append(attempt: TAttempt): void {
    const attempts = load();
    attempts.push(attempt);
    if (attempts.length > ATTEMPT_LIMIT) attempts.splice(0, attempts.length - ATTEMPT_LIMIT);

    if (flushHandle !== null) return;
    flushHandle = window.setTimeout(() => {
      flushHandle = null;
      flush();
    }, FLUSH_DELAY_MS);
  }

  function reset(): void {
    if (flushHandle !== null) {
      window.clearTimeout(flushHandle);
      flushHandle = null;
    }
    cache = [];
  }

  return { load, append, flush, reset };
}
