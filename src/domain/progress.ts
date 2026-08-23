import { countryIdsForLearningScope } from '../data/learning-scopes.js';
import type {
  Country,
  EvidenceActivity,
  ProgressRecord,
  ProgressState,
  QuizAttempt,
  ScopeStats,
  StudyScope,
} from './models.js';
import {
  applyCountryEvidence,
  createEvidenceSummary,
  evidenceStrengthGoal,
} from './evidence.js';

const RETENTION_DAYS = [2, 7, 21, 60, 180];

export function createProgressRecord(countryId: string): ProgressRecord {
  return {
    countryId,
    status: 'unseen',
    masteryStreak: 0,
    lifetimeCorrect: 0,
    lifetimeIncorrect: 0,
    currentCorrectStreak: 0,
    lapseCount: 0,
    retentionLevel: 0,
    evidence: createEvidenceSummary(),
    confusionCounts: {},
  };
}

export function createInitialProgress(countries: Country[]): ProgressState {
  return {
    version: 2,
    records: Object.fromEntries(countries.map((country) => [country.id, createProgressRecord(country.id)])),
  };
}

export function getRecord(state: ProgressState, countryId: string): ProgressRecord {
  return state.records[countryId] ?? createProgressRecord(countryId);
}

/** Compatibility alias retained for selection/scheduler code. UI must not expose it as x/y progress. */
export function masteryGoal(record: ProgressRecord): number {
  return evidenceStrengthGoal(record);
}

export function isDue(record: ProgressRecord, now = new Date()): boolean {
  return Boolean(record.status === 'mastered' && record.nextReviewAt && new Date(record.nextReviewAt) <= now);
}

export interface ApplyAttemptInput {
  sessionId: string;
  countryId: string;
  selectedCountryId: string;
  responseTimeMs: number;
  /** Defaults to Learn for backwards-compatible callers and old verification fixtures. */
  activity?: EvidenceActivity;
  now?: Date;
}

export interface ApplyAttemptResult {
  state: ProgressState;
  attempt: QuizAttempt;
}

export function applyAttempt(
  state: ProgressState,
  correctCountryId: string,
  input: ApplyAttemptInput,
): ApplyAttemptResult {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const previous = getRecord(state, correctCountryId);
  let record: ProgressRecord = {
    ...previous,
    evidence: { ...previous.evidence },
    confusionCounts: { ...previous.confusionCounts },
  };

  const correct = input.selectedCountryId === correctCountryId;
  const statusBefore = record.status;
  const streakBefore = record.masteryStreak;
  const priorTotal = record.lifetimeCorrect + record.lifetimeIncorrect;
  const priorAverage = record.averageResponseTimeMs ?? input.responseTimeMs;
  const activity = input.activity ?? 'learn';

  record.firstSeenAt ??= timestamp;
  record.lastSeenAt = timestamp;
  record.averageResponseTimeMs =
    (priorAverage * priorTotal + input.responseTimeMs) / Math.max(1, priorTotal + 1);

  let evidenceCredit = 0;

  if (correct) {
    record.lifetimeCorrect += 1;
    record.currentCorrectStreak += 1;
    record.lastCorrectAt = timestamp;

    const applied = applyCountryEvidence(record, {
      activity,
      outcome: 'clean-retrieval',
      at: timestamp,
      sessionId: input.sessionId,
    });
    record = applied.record;
    evidenceCredit = applied.credit;

    if (statusBefore === 'mastered') {
      record.retentionLevel = Math.min(record.retentionLevel + 1, RETENTION_DAYS.length - 1);
      record.nextReviewAt = addDays(now, RETENTION_DAYS[record.retentionLevel]).toISOString();
    } else if (applied.becameStrong) {
      record.retentionLevel = 0;
      record.nextReviewAt = addDays(now, RETENTION_DAYS[0]).toISOString();
    }
  } else {
    record.lifetimeIncorrect += 1;
    record.currentCorrectStreak = 0;
    record.lastIncorrectAt = timestamp;
    record.confusionCounts[input.selectedCountryId] =
      (record.confusionCounts[input.selectedCountryId] ?? 0) + 1;

    const applied = applyCountryEvidence(record, {
      activity,
      outcome: 'contradictory',
      at: timestamp,
      sessionId: input.sessionId,
    });
    record = applied.record;
    record.nextReviewAt = undefined;
    record.retentionLevel = 0;
  }

  const nextState: ProgressState = {
    ...state,
    version: 2,
    records: {
      ...state.records,
      [correctCountryId]: record,
    },
  };

  return {
    state: nextState,
    attempt: {
      sessionId: input.sessionId,
      questionId: `${input.sessionId}:${correctCountryId}`,
      countryId: correctCountryId,
      selectedCountryId: input.selectedCountryId,
      correct,
      responseTimeMs: input.responseTimeMs,
      answeredAt: timestamp,
      statusBefore,
      statusAfter: record.status,
      streakBefore,
      streakAfter: record.masteryStreak,
      evidenceActivity: activity,
      evidenceOutcome: correct ? 'clean-retrieval' : 'contradictory',
      evidenceCredit,
    },
  };
}

/**
 * Forward-compatible hook for Issue #30 and other browse/reveal study surfaces.
 * Exposure is retained but deliberately cannot create scored strength credit.
 */
export function applyPassiveExposure(
  state: ProgressState,
  countryId: string,
  now = new Date(),
): ProgressState {
  const timestamp = now.toISOString();
  const previous = getRecord(state, countryId);
  let record: ProgressRecord = {
    ...previous,
    evidence: { ...previous.evidence },
    confusionCounts: { ...previous.confusionCounts },
  };
  record.firstSeenAt ??= timestamp;
  record.lastSeenAt = timestamp;
  record = applyCountryEvidence(record, {
    activity: 'learn',
    outcome: 'passive-exposure',
    at: timestamp,
  }).record;
  return {
    ...state,
    version: 2,
    records: { ...state.records, [countryId]: record },
  };
}

export function countriesInScope(countries: Country[], scope: StudyScope): Country[] {
  const ids = new Set(countryIdsForLearningScope(scope));
  return countries.filter((country) => ids.has(country.id));
}

export function getScopeStats(
  countries: Country[],
  state: ProgressState,
  scope: StudyScope,
  now = new Date(),
): ScopeStats {
  const scoped = countriesInScope(countries, scope);
  return scoped.reduce<ScopeStats>(
    (stats, country) => {
      const record = getRecord(state, country.id);
      stats[record.status] += 1;
      if (isDue(record, now)) stats.due += 1;
      stats.total += 1;
      return stats;
    },
    { total: 0, unseen: 0, learning: 0, mastered: 0, due: 0 },
  );
}

export function learningPriority(record: ProgressRecord, now = new Date()): number {
  if (record.status === 'unseen') return 100;

  const attempts = record.lifetimeCorrect + record.lifetimeIncorrect;
  const accuracy = attempts === 0 ? 0 : record.lifetimeCorrect / attempts;
  let score = record.status === 'learning' ? 45 : 5;

  score += record.lifetimeIncorrect * 8;
  score += (1 - accuracy) * 20;
  score += Math.min((record.averageResponseTimeMs ?? 0) / 1000, 10);

  if (record.lastIncorrectAt) {
    const hoursSinceMiss = (now.getTime() - new Date(record.lastIncorrectAt).getTime()) / 3_600_000;
    score += Math.max(0, 20 - hoursSinceMiss / 6);
  }

  if (record.status === 'mastered' && isDue(record, now)) score += 35;
  return score;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
