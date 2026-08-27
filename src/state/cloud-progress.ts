import type { EarnedAchievementState } from '../domain/achievements.js';
import type { LocationProgressRecord, LocationProgressState } from '../domain/map-models.js';
import type { CountryEvidenceSummary, ProgressRecord, ProgressState } from '../domain/models.js';
import type { NeighborProgressRecord, NeighborProgressState } from '../domain/neighbor-models.js';
import { migrateAchievementState } from '../infrastructure/achievement-storage.js';
import type { CloudStateKey } from '../infrastructure/firestore-sync.js';
import { sanitizeLocationRecord } from '../infrastructure/map-storage.js';
import { sanitizeNeighborRecord } from '../infrastructure/neighbor-storage.js';
import { sanitizeRecord } from '../infrastructure/storage.js';

export interface CloudProgressState {
  'flag-atlas:progress:v1': ProgressState;
  'flag-atlas:location-progress:v1': LocationProgressState;
  'flag-atlas:outline-progress:v1': ProgressState;
  'flag-atlas:neighbor-progress:v1': NeighborProgressState;
  'flag-atlas:earned-achievements:v1': EarnedAchievementState;
}

function objectRecords(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as { version?: unknown; records?: unknown };
  if ((raw.version !== 1 && raw.version !== 2) || !raw.records || typeof raw.records !== 'object' || Array.isArray(raw.records)) return null;
  return raw.records as Record<string, unknown>;
}

function sanitizeLedger<T>(value: unknown, sanitize: (id: string, record: unknown) => T | null): { version: 2; records: Record<string, T> } {
  const rawRecords = objectRecords(value);
  const records: Record<string, T> = {};
  if (!rawRecords) return { version: 2, records };
  for (const [id, raw] of Object.entries(rawRecords)) {
    const record = sanitize(id, raw);
    if (record) records[id] = record;
  }
  return { version: 2, records };
}

export function sanitizeCloudState<K extends CloudStateKey>(key: K, value: unknown): CloudProgressState[K] {
  if (key === 'flag-atlas:progress:v1' || key === 'flag-atlas:outline-progress:v1') {
    return sanitizeLedger(value, sanitizeRecord) as CloudProgressState[K];
  }
  if (key === 'flag-atlas:location-progress:v1') {
    return sanitizeLedger(value, sanitizeLocationRecord) as CloudProgressState[K];
  }
  if (key === 'flag-atlas:neighbor-progress:v1') {
    return sanitizeLedger(value, sanitizeNeighborRecord) as CloudProgressState[K];
  }
  return migrateAchievementState(value) as CloudProgressState[K];
}

function earlier(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a <= b ? a : b;
}

function later(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

function maxCounts(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return Object.fromEntries([...keys].sort().map((key) => [key, Math.max(a[key] ?? 0, b[key] ?? 0)]));
}

function evidenceTime(value: CountryEvidenceSummary): string {
  return value.lastEvidenceAt ?? value.lastScoredAt ?? value.strongEvidenceAt ?? '';
}

function recordTime(value: { lastSeenAt?: string; evidence: CountryEvidenceSummary }): string {
  return value.lastSeenAt ?? evidenceTime(value.evidence);
}

function mergeEvidence(local: CountryEvidenceSummary, cloud: CountryEvidenceSummary): CountryEvidenceSummary {
  const current = evidenceTime(local) >= evidenceTime(cloud) ? local : cloud;
  return {
    version: 1,
    passiveExposures: Math.max(local.passiveExposures, cloud.passiveExposures),
    assistedRetrievals: Math.max(local.assistedRetrievals, cloud.assistedRetrievals),
    cleanLearnRetrievals: Math.max(local.cleanLearnRetrievals, cloud.cleanLearnRetrievals),
    cleanPlayRetrievals: Math.max(local.cleanPlayRetrievals, cloud.cleanPlayRetrievals),
    cleanReviewRetrievals: Math.max(local.cleanReviewRetrievals, cloud.cleanReviewRetrievals),
    legacyScoredRetrievals: Math.max(local.legacyScoredRetrievals, cloud.legacyScoredRetrievals),
    contradictions: Math.max(local.contradictions, cloud.contradictions),
    retentionSuccesses: Math.max(local.retentionSuccesses, cloud.retentionSuccesses),
    lastActivity: current.lastActivity,
    lastOutcome: current.lastOutcome,
    lastEvidenceAt: later(local.lastEvidenceAt, cloud.lastEvidenceAt),
    lastScoredAt: later(local.lastScoredAt, cloud.lastScoredAt),
    strongEvidenceAt: later(local.strongEvidenceAt, cloud.strongEvidenceAt),
  };
}

function mergeRecognitionRecord(local: ProgressRecord, cloud: ProgressRecord): ProgressRecord {
  const current = recordTime(local) >= recordTime(cloud) ? local : cloud;
  return {
    ...current,
    countryId: local.countryId,
    lifetimeCorrect: Math.max(local.lifetimeCorrect, cloud.lifetimeCorrect),
    lifetimeIncorrect: Math.max(local.lifetimeIncorrect, cloud.lifetimeIncorrect),
    lapseCount: Math.max(local.lapseCount, cloud.lapseCount),
    evidence: mergeEvidence(local.evidence, cloud.evidence),
    firstSeenAt: earlier(local.firstSeenAt, cloud.firstSeenAt),
    lastSeenAt: later(local.lastSeenAt, cloud.lastSeenAt),
    lastCorrectAt: later(local.lastCorrectAt, cloud.lastCorrectAt),
    lastIncorrectAt: later(local.lastIncorrectAt, cloud.lastIncorrectAt),
    masteredAt: later(local.masteredAt, cloud.masteredAt),
    confusionCounts: maxCounts(local.confusionCounts, cloud.confusionCounts),
  };
}

function mergeLocationRecord(local: LocationProgressRecord, cloud: LocationProgressRecord): LocationProgressRecord {
  const current = recordTime(local) >= recordTime(cloud) ? local : cloud;
  return {
    ...current,
    countryId: local.countryId,
    lifetimeResolved: Math.max(local.lifetimeResolved, cloud.lifetimeResolved),
    lifetimeFirstTryCorrect: Math.max(local.lifetimeFirstTryCorrect, cloud.lifetimeFirstTryCorrect),
    lifetimeIncorrectGuesses: Math.max(local.lifetimeIncorrectGuesses, cloud.lifetimeIncorrectGuesses),
    revealCount: Math.max(local.revealCount, cloud.revealCount),
    lapseCount: Math.max(local.lapseCount, cloud.lapseCount),
    evidence: mergeEvidence(local.evidence, cloud.evidence),
    firstSeenAt: earlier(local.firstSeenAt, cloud.firstSeenAt),
    lastSeenAt: later(local.lastSeenAt, cloud.lastSeenAt),
    lastCorrectAt: later(local.lastCorrectAt, cloud.lastCorrectAt),
    lastMissedAt: later(local.lastMissedAt, cloud.lastMissedAt),
    masteredAt: later(local.masteredAt, cloud.masteredAt),
    confusionCounts: maxCounts(local.confusionCounts, cloud.confusionCounts),
  };
}

function mergeNeighborRecord(local: NeighborProgressRecord, cloud: NeighborProgressRecord): NeighborProgressRecord {
  const current = recordTime(local) >= recordTime(cloud) ? local : cloud;
  return {
    ...current,
    countryId: local.countryId,
    lifetimeRounds: Math.max(local.lifetimeRounds, cloud.lifetimeRounds),
    lifetimeCompleted: Math.max(local.lifetimeCompleted, cloud.lifetimeCompleted),
    lifetimeCleanCompletions: Math.max(local.lifetimeCleanCompletions, cloud.lifetimeCleanCompletions),
    lifetimeWrongGuesses: Math.max(local.lifetimeWrongGuesses, cloud.lifetimeWrongGuesses),
    revealCount: Math.max(local.revealCount, cloud.revealCount),
    lapseCount: Math.max(local.lapseCount, cloud.lapseCount),
    evidence: mergeEvidence(local.evidence, cloud.evidence),
    firstSeenAt: earlier(local.firstSeenAt, cloud.firstSeenAt),
    lastSeenAt: later(local.lastSeenAt, cloud.lastSeenAt),
    lastCompletedAt: later(local.lastCompletedAt, cloud.lastCompletedAt),
    lastMissedAt: later(local.lastMissedAt, cloud.lastMissedAt),
    masteredAt: later(local.masteredAt, cloud.masteredAt),
    confusionCounts: maxCounts(local.confusionCounts, cloud.confusionCounts),
  };
}

function mergeLedgers<T>(local: { version: 2; records: Record<string, T> }, cloud: { version: 2; records: Record<string, T> }, mergeRecord: (local: T, cloud: T) => T): { version: 2; records: Record<string, T> } {
  const records: Record<string, T> = {};
  const ids = new Set([...Object.keys(local.records), ...Object.keys(cloud.records)]);
  for (const id of [...ids].sort()) {
    const a = local.records[id];
    const b = cloud.records[id];
    if (a && b) records[id] = mergeRecord(a, b);
    else if (a) records[id] = a;
    else if (b) records[id] = b;
  }
  return { version: 2, records };
}

function mergeAchievements(local: EarnedAchievementState, cloud: EarnedAchievementState): EarnedAchievementState {
  return {
    version: 1,
    regionDomainMasteries: [...new Set([...local.regionDomainMasteries, ...cloud.regionDomainMasteries])].sort() as EarnedAchievementState['regionDomainMasteries'],
    completeRegions: [...new Set([...local.completeRegions, ...cloud.completeRegions])].sort(),
    completeContinents: [...new Set([...local.completeContinents, ...cloud.completeContinents])].sort() as EarnedAchievementState['completeContinents'],
    worldCrown: local.worldCrown || cloud.worldCrown,
  };
}

export function mergeCloudState<K extends CloudStateKey>(key: K, localValue: unknown, cloudValue: unknown): CloudProgressState[K] {
  const local = sanitizeCloudState(key, localValue);
  const cloud = sanitizeCloudState(key, cloudValue);
  if (key === 'flag-atlas:progress:v1' || key === 'flag-atlas:outline-progress:v1') {
    return mergeLedgers(local as ProgressState, cloud as ProgressState, mergeRecognitionRecord) as CloudProgressState[K];
  }
  if (key === 'flag-atlas:location-progress:v1') {
    return mergeLedgers(local as LocationProgressState, cloud as LocationProgressState, mergeLocationRecord) as CloudProgressState[K];
  }
  if (key === 'flag-atlas:neighbor-progress:v1') {
    return mergeLedgers(local as NeighborProgressState, cloud as NeighborProgressState, mergeNeighborRecord) as CloudProgressState[K];
  }
  return mergeAchievements(local as EarnedAchievementState, cloud as EarnedAchievementState) as CloudProgressState[K];
}
