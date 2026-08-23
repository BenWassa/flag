import type { LearningStatus } from '../domain/models.js';
import type { LocationProgressRecord, LocationProgressState, MapAttempt } from '../domain/map-models.js';
import { legacyEvidenceSummary, sanitizeEvidenceSummary } from './evidence-storage.js';
import { createAttemptLog, loadVersionedRecords, saveVersionedRecords } from './ledger-storage.js';
import { toConfusionCounts, toCount, toOptionalString } from './sanitize.js';
import { createStorageGuard } from './storage-guard.js';

// Stable namespace; payloads migrate from schema v1 to v2 on load/save.
const PROGRESS_KEY = 'flag-atlas:location-progress:v1';
const ATTEMPTS_KEY = 'flag-atlas:location-attempts:v1';
const STATUSES: readonly LearningStatus[] = ['unseen', 'learning', 'mastered'];

const guard = createStorageGuard();
const attempts = createAttemptLog<MapAttempt>(guard, ATTEMPTS_KEY);

export function mapStorageIsWritable(): boolean {
  return guard.isWritable();
}

export function sanitizeLocationRecord(countryId: string, value: unknown): LocationProgressRecord | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const status = STATUSES.find((item) => item === raw.status);
  if (!status) return null;

  const lifetimeResolved = toCount(raw.lifetimeResolved);
  const lifetimeFirstTryCorrect = toCount(raw.lifetimeFirstTryCorrect);
  const lifetimeIncorrectGuesses = toCount(raw.lifetimeIncorrectGuesses);
  const revealCount = toCount(raw.revealCount);
  const firstSeenAt = toOptionalString(raw.firstSeenAt);
  const lastSeenAt = toOptionalString(raw.lastSeenAt);
  const lastCorrectAt = toOptionalString(raw.lastCorrectAt);
  const lastMissedAt = toOptionalString(raw.lastMissedAt);
  const masteredAt = toOptionalString(raw.masteredAt);
  const legacyEvidence = legacyEvidenceSummary({
    passiveExposures: revealCount,
    legacyScoredRetrievals: lifetimeFirstTryCorrect,
    contradictions: lifetimeIncorrectGuesses,
    strongEvidenceAt: masteredAt,
    lastEvidenceAt: lastSeenAt,
    lastScoredAt: lastCorrectAt ?? lastMissedAt ?? lastSeenAt,
  });

  return {
    countryId,
    status,
    masteryStreak: toCount(raw.masteryStreak),
    lifetimeResolved,
    lifetimeFirstTryCorrect,
    lifetimeIncorrectGuesses,
    revealCount,
    lapseCount: toCount(raw.lapseCount),
    evidence: sanitizeEvidenceSummary(raw.evidence, legacyEvidence),
    firstSeenAt,
    lastSeenAt,
    lastCorrectAt,
    lastMissedAt,
    masteredAt,
    lastMasteryCreditSessionId: toOptionalString(raw.lastMasteryCreditSessionId),
    confusionCounts: toConfusionCounts(raw.confusionCounts),
  };
}

export function loadLocationProgress(): LocationProgressState | null {
  return loadVersionedRecords(guard, PROGRESS_KEY, sanitizeLocationRecord);
}

export function saveLocationProgress(state: LocationProgressState): boolean {
  return saveVersionedRecords(guard, PROGRESS_KEY, state);
}

export function appendMapAttempt(attempt: MapAttempt): void {
  attempts.append(attempt);
}

export function flushMapAttempts(): void {
  attempts.flush();
}
