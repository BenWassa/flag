import type { LearningStatus, ProgressRecord, ProgressState, QuizAttempt } from '../domain/models.js';
import { legacyEvidenceSummary, sanitizeEvidenceSummary } from './evidence-storage.js';
import { createAttemptLog, loadVersionedRecords, saveVersionedRecords } from './ledger-storage.js';
import { toConfusionCounts, toCount, toOptionalNumber, toOptionalString } from './sanitize.js';
import { createStorageGuard } from './storage-guard.js';

// Key names remain stable compatibility namespaces. The payload itself is schema v2.
const PROGRESS_KEY = 'flag-atlas:progress:v1';
const ATTEMPTS_KEY = 'flag-atlas:attempts:v1';

const STATUSES: readonly LearningStatus[] = ['unseen', 'learning', 'mastered'];

const guard = createStorageGuard();
const attempts = createAttemptLog<QuizAttempt>(guard, ATTEMPTS_KEY);

export function storageIsWritable(): boolean {
  return guard.isWritable();
}

export function sanitizeRecord(countryId: string, value: unknown): ProgressRecord | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const status = STATUSES.find((item) => item === raw.status);
  if (!status) return null;

  const lifetimeCorrect = toCount(raw.lifetimeCorrect);
  const lifetimeIncorrect = toCount(raw.lifetimeIncorrect);
  const firstSeenAt = toOptionalString(raw.firstSeenAt);
  const lastSeenAt = toOptionalString(raw.lastSeenAt);
  const lastCorrectAt = toOptionalString(raw.lastCorrectAt);
  const lastIncorrectAt = toOptionalString(raw.lastIncorrectAt);
  const masteredAt = toOptionalString(raw.masteredAt);
  const legacyEvidence = legacyEvidenceSummary({
    legacyScoredRetrievals: lifetimeCorrect,
    contradictions: lifetimeIncorrect,
    strongEvidenceAt: masteredAt,
    lastEvidenceAt: lastSeenAt,
    lastScoredAt: lastCorrectAt ?? lastIncorrectAt ?? lastSeenAt,
  });

  return {
    countryId,
    status,
    masteryStreak: toCount(raw.masteryStreak),
    lifetimeCorrect,
    lifetimeIncorrect,
    currentCorrectStreak: toCount(raw.currentCorrectStreak),
    lapseCount: toCount(raw.lapseCount),
    retentionLevel: toCount(raw.retentionLevel),
    evidence: sanitizeEvidenceSummary(raw.evidence, legacyEvidence),
    lastMasteryCreditSessionId: toOptionalString(raw.lastMasteryCreditSessionId),
    firstSeenAt,
    lastSeenAt,
    lastCorrectAt,
    lastIncorrectAt,
    masteredAt,
    nextReviewAt: toOptionalString(raw.nextReviewAt),
    averageResponseTimeMs: toOptionalNumber(raw.averageResponseTimeMs),
    confusionCounts: toConfusionCounts(raw.confusionCounts),
  };
}

export function loadProgress(): ProgressState | null {
  return loadVersionedRecords(guard, PROGRESS_KEY, sanitizeRecord);
}

/** Returns false when the ledger could not be written, so the caller can say so. */
export function saveProgress(progress: ProgressState): boolean {
  return saveVersionedRecords(guard, PROGRESS_KEY, progress);
}

export function loadAttempts(): QuizAttempt[] {
  return attempts.load();
}

export function appendAttempt(attempt: QuizAttempt): void {
  attempts.append(attempt);
}

export function flushAttempts(): void {
  attempts.flush();
}

export function resetAllProgress(): void {
  attempts.reset();
  guard.removeRaw(PROGRESS_KEY);
  guard.removeRaw(ATTEMPTS_KEY);
}
