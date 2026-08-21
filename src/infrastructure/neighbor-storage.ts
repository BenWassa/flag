import type { LearningStatus } from '../domain/models.js';
import type { NeighborAttempt, NeighborProgressRecord, NeighborProgressState } from '../domain/neighbor-models.js';
import { legacyEvidenceSummary, sanitizeEvidenceSummary } from './evidence-storage.js';
import { createAttemptLog, loadVersionedRecords, saveVersionedRecords } from './ledger-storage.js';
import { toConfusionCounts, toCount, toOptionalString } from './sanitize.js';
import { createStorageGuard } from './storage-guard.js';

// Stable namespace; payloads migrate from schema v1 to v2 on load/save.
const PROGRESS_KEY = 'flag-atlas:neighbor-progress:v1';
const ATTEMPTS_KEY = 'flag-atlas:neighbor-attempts:v1';
const STATUSES: readonly LearningStatus[] = ['unseen', 'learning', 'mastered'];

const guard = createStorageGuard();
const attempts = createAttemptLog<NeighborAttempt>(guard, ATTEMPTS_KEY);

export function neighborStorageIsWritable(): boolean {
  return guard.isWritable();
}

export function sanitizeNeighborRecord(countryId: string, value: unknown): NeighborProgressRecord | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const status = STATUSES.find((item) => item === raw.status);
  if (!status) return null;

  const lifetimeRounds = toCount(raw.lifetimeRounds);
  const lifetimeCompleted = toCount(raw.lifetimeCompleted);
  const lifetimeCleanCompletions = toCount(raw.lifetimeCleanCompletions);
  const lifetimeWrongGuesses = toCount(raw.lifetimeWrongGuesses);
  const revealCount = toCount(raw.revealCount);
  const firstSeenAt = toOptionalString(raw.firstSeenAt);
  const lastSeenAt = toOptionalString(raw.lastSeenAt);
  const lastCompletedAt = toOptionalString(raw.lastCompletedAt);
  const lastMissedAt = toOptionalString(raw.lastMissedAt);
  const masteredAt = toOptionalString(raw.masteredAt);
  const legacyEvidence = legacyEvidenceSummary({
    passiveExposures: revealCount,
    assistedRetrievals: Math.max(0, lifetimeCompleted - lifetimeCleanCompletions),
    legacyScoredRetrievals: lifetimeCleanCompletions,
    contradictions: lifetimeWrongGuesses,
    strongEvidenceAt: masteredAt,
    lastEvidenceAt: lastSeenAt,
    lastScoredAt: lastCompletedAt ?? lastMissedAt ?? lastSeenAt,
  });

  return {
    countryId,
    status,
    masteryStreak: toCount(raw.masteryStreak),
    lifetimeRounds,
    lifetimeCompleted,
    lifetimeCleanCompletions,
    lifetimeWrongGuesses,
    revealCount,
    lapseCount: toCount(raw.lapseCount),
    evidence: sanitizeEvidenceSummary(raw.evidence, legacyEvidence),
    firstSeenAt,
    lastSeenAt,
    lastCompletedAt,
    lastMissedAt,
    masteredAt,
    lastMasteryCreditSessionId: toOptionalString(raw.lastMasteryCreditSessionId),
    confusionCounts: toConfusionCounts(raw.confusionCounts),
  };
}

export function loadNeighborProgress(): NeighborProgressState | null {
  return loadVersionedRecords(guard, PROGRESS_KEY, sanitizeNeighborRecord);
}

export function saveNeighborProgress(state: NeighborProgressState): boolean {
  return saveVersionedRecords(guard, PROGRESS_KEY, state);
}

export function appendNeighborAttempt(attempt: NeighborAttempt): void {
  attempts.append(attempt);
}

export function flushNeighborAttempts(): void {
  attempts.flush();
}

export function resetNeighborProgressStorage(): void {
  attempts.reset();
  guard.removeRaw(PROGRESS_KEY);
  guard.removeRaw(ATTEMPTS_KEY);
}
