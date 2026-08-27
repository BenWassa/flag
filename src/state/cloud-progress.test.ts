import { describe, expect, it } from 'vitest';
import { mergeCloudState, sanitizeCloudState } from './cloud-progress.js';

function evidence(overrides: Record<string, unknown> = {}) {
  return {
    version: 1,
    passiveExposures: 0,
    assistedRetrievals: 0,
    cleanLearnRetrievals: 0,
    cleanPlayRetrievals: 0,
    cleanReviewRetrievals: 0,
    legacyScoredRetrievals: 0,
    contradictions: 0,
    retentionSuccesses: 0,
    ...overrides,
  };
}

function flagsRecord(overrides: Record<string, unknown> = {}) {
  return {
    status: 'learning',
    masteryStreak: 0,
    lifetimeCorrect: 0,
    lifetimeIncorrect: 0,
    currentCorrectStreak: 0,
    lapseCount: 0,
    retentionLevel: 0,
    evidence: evidence(),
    confusionCounts: {},
    ...overrides,
  };
}

describe('cloud progress reconciliation', () => {
  it('sanitises cloud ledgers through the same persisted-record boundary', () => {
    const value = sanitizeCloudState('flag-atlas:progress:v1', {
      version: 2,
      records: {
        valid: flagsRecord({ lifetimeCorrect: 4 }),
        broken: { status: 'not-a-real-status', lifetimeCorrect: 999 },
      },
    });

    expect(value.version).toBe(2);
    expect(value.records.valid?.lifetimeCorrect).toBe(4);
    expect(value.records.broken).toBeUndefined();
  });

  it('restores cloud-only state into an empty local ledger', () => {
    const merged = mergeCloudState(
      'flag-atlas:progress:v1',
      { version: 2, records: {} },
      { version: 2, records: { gha: flagsRecord({ lifetimeCorrect: 3, lastSeenAt: '2026-08-20T10:00:00.000Z' }) } },
    );

    expect(merged.records.gha?.lifetimeCorrect).toBe(3);
    expect(merged.records.gha?.lastSeenAt).toBe('2026-08-20T10:00:00.000Z');
  });

  it('backfills local-only state when cloud is empty', () => {
    const local = { version: 2 as const, records: { gha: flagsRecord({ lifetimeCorrect: 2 }) } };
    expect(mergeCloudState('flag-atlas:progress:v1', local, null)).toMatchObject(local);
  });

  it('merges divergent evidence without whole-document timestamp loss', () => {
    const local = {
      version: 2,
      records: {
        gha: flagsRecord({
          status: 'learning',
          lifetimeCorrect: 5,
          lifetimeIncorrect: 1,
          lastSeenAt: '2026-08-20T10:00:00.000Z',
          lastCorrectAt: '2026-08-20T10:00:00.000Z',
          confusionCounts: { nga: 2 },
          evidence: evidence({ cleanPlayRetrievals: 5, contradictions: 1, lastEvidenceAt: '2026-08-20T10:00:00.000Z' }),
        }),
      },
    };
    const cloud = {
      version: 2,
      records: {
        gha: flagsRecord({
          status: 'mastered',
          lifetimeCorrect: 3,
          lifetimeIncorrect: 4,
          lastSeenAt: '2026-08-22T10:00:00.000Z',
          masteredAt: '2026-08-22T10:00:00.000Z',
          confusionCounts: { civ: 3 },
          evidence: evidence({ cleanPlayRetrievals: 3, contradictions: 4, strongEvidenceAt: '2026-08-22T10:00:00.000Z', lastEvidenceAt: '2026-08-22T10:00:00.000Z' }),
        }),
      },
    };

    const merged = mergeCloudState('flag-atlas:progress:v1', local, cloud);
    const record = merged.records.gha;
    expect(record?.status).toBe('mastered');
    expect(record?.lifetimeCorrect).toBe(5);
    expect(record?.lifetimeIncorrect).toBe(4);
    expect(record?.evidence.cleanPlayRetrievals).toBe(5);
    expect(record?.evidence.contradictions).toBe(4);
    expect(record?.confusionCounts).toEqual({ civ: 3, nga: 2 });
  });

  it('keeps earned achievements monotonic across devices', () => {
    const merged = mergeCloudState(
      'flag-atlas:earned-achievements:v1',
      { version: 1, regionDomainMasteries: ['west-africa:flags'], completeRegions: [], completeContinents: [], worldCrown: false },
      { version: 1, regionDomainMasteries: ['west-africa:locations'], completeRegions: ['west-africa'], completeContinents: ['africa'], worldCrown: false },
    );

    expect(merged.regionDomainMasteries).toEqual(['west-africa:flags', 'west-africa:locations']);
    expect(merged.completeRegions).toEqual(['west-africa']);
    expect(merged.completeContinents).toEqual(['africa']);
  });

  it('rejects malformed remote envelopes instead of bypassing migrations', () => {
    const local = { version: 2, records: { gha: flagsRecord({ lifetimeCorrect: 2 }) } };
    const merged = mergeCloudState('flag-atlas:progress:v1', local, { version: 999, records: { gha: flagsRecord({ lifetimeCorrect: 500 }) } });
    expect(merged.records.gha?.lifetimeCorrect).toBe(2);
  });
});
