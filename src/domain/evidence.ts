import type {
  CountryEvidenceSummary,
  EvidenceActivity,
  EvidenceOutcome,
  LearningStatus,
  StudyMode,
} from './models.js';

export interface EvidenceBackedRecord {
  status: LearningStatus;
  masteryStreak: number;
  lapseCount: number;
  evidence: CountryEvidenceSummary;
  lastMasteryCreditSessionId?: string;
  masteredAt?: string;
}

export interface CountryEvidenceEvent {
  activity: EvidenceActivity;
  outcome: EvidenceOutcome;
  at: string;
  sessionId?: string;
}

export interface AppliedEvidence<T extends EvidenceBackedRecord> {
  record: T;
  credit: number;
  becameStrong: boolean;
  lapsed: boolean;
}

export type CountryEvidenceState = 'unseen' | 'learning' | 'strong' | 'due-for-review';

export function createEvidenceSummary(): CountryEvidenceSummary {
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
  };
}

export function activityForMode(mode: StudyMode): EvidenceActivity {
  return mode === 'test' ? 'play' : 'learn';
}

/**
 * Compatibility strength target. Keeping it behind the evidence layer lets a
 * later scheduler change the rule without #34 or UI code reading raw counters.
 */
export function evidenceStrengthGoal(record: Pick<EvidenceBackedRecord, 'lapseCount'>): number {
  return record.lapseCount > 0 ? 2 : 3;
}

function cleanCredit(record: EvidenceBackedRecord, activity: EvidenceActivity): number {
  // A clean Play result can calibrate untouched/already-known material faster.
  // Once contradictory evidence exists, require two independent clean sessions
  // rather than allowing one assessment to erase a lapse.
  return activity === 'play' && record.lapseCount === 0 ? 2 : 1;
}

function incrementClean(summary: CountryEvidenceSummary, activity: EvidenceActivity): void {
  if (activity === 'play') summary.cleanPlayRetrievals += 1;
  else if (activity === 'review') summary.cleanReviewRetrievals += 1;
  else summary.cleanLearnRetrievals += 1;
}

/**
 * Apply one normalised evidence event without knowing anything about a domain's
 * native attempt shape. Callers retain their own counters/confusion history.
 */
export function applyCountryEvidence<T extends EvidenceBackedRecord>(
  previous: T,
  event: CountryEvidenceEvent,
): AppliedEvidence<T> {
  const record = {
    ...previous,
    evidence: { ...previous.evidence },
  } as T;
  const summary = record.evidence;
  const wasStrong = record.status === 'mastered';
  let credit = 0;
  let lapsed = false;

  summary.lastActivity = event.activity;
  summary.lastOutcome = event.outcome;
  summary.lastEvidenceAt = event.at;

  if (event.outcome === 'passive-exposure') {
    summary.passiveExposures += 1;
    return { record, credit, becameStrong: false, lapsed: false };
  }

  summary.lastScoredAt = event.at;

  if (event.outcome === 'assisted-retrieval') {
    summary.assistedRetrievals += 1;
    if (record.status === 'unseen') record.status = 'learning';
    return { record, credit, becameStrong: false, lapsed: false };
  }

  if (event.outcome === 'contradictory') {
    summary.contradictions += 1;
    record.masteryStreak = 0;
    record.lastMasteryCreditSessionId = undefined;
    if (wasStrong) {
      record.lapseCount += 1;
      lapsed = true;
    }
    record.status = 'learning';
    return { record, credit, becameStrong: false, lapsed };
  }

  incrementClean(summary, event.activity);

  if (wasStrong) {
    summary.retentionSuccesses += 1;
    return { record, credit, becameStrong: false, lapsed: false };
  }

  record.status = 'learning';
  const mayCredit = !event.sessionId || record.lastMasteryCreditSessionId !== event.sessionId;
  const goal = evidenceStrengthGoal(record);
  if (mayCredit) {
    credit = cleanCredit(record, event.activity);
    record.masteryStreak = Math.min(goal, record.masteryStreak + credit);
    if (event.sessionId) record.lastMasteryCreditSessionId = event.sessionId;
  }

  const becameStrong = record.masteryStreak >= goal;
  if (becameStrong) {
    record.status = 'mastered';
    record.masteredAt = event.at;
    summary.strongEvidenceAt = event.at;
  }

  return { record, credit, becameStrong, lapsed: false };
}

/**
 * Critical Issue #34 integration seam. Achievement code asks this selector and
 * never reads today's compatibility `status`/`masteryStreak` fields directly.
 */
export function qualifiesForRegionMastery(record: EvidenceBackedRecord): boolean {
  return record.status === 'mastered';
}

export function countryEvidenceState(
  record: EvidenceBackedRecord,
  dueForReview = false,
): CountryEvidenceState {
  if (dueForReview && qualifiesForRegionMastery(record)) return 'due-for-review';
  if (qualifiesForRegionMastery(record)) return 'strong';
  if (record.status === 'learning') return 'learning';
  return 'unseen';
}
