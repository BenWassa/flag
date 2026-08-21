import type {
  CountryEvidenceSummary,
  EvidenceActivity,
  EvidenceOutcome,
} from '../domain/models.js';
import { createEvidenceSummary } from '../domain/evidence.js';

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

const ACTIVITIES: readonly EvidenceActivity[] = ['learn', 'play', 'review'];
const OUTCOMES: readonly EvidenceOutcome[] = [
  'passive-exposure',
  'assisted-retrieval',
  'clean-retrieval',
  'contradictory',
];

function toActivity(value: unknown): EvidenceActivity | undefined {
  return ACTIVITIES.find((item) => item === value);
}

function toOutcome(value: unknown): EvidenceOutcome | undefined {
  return OUTCOMES.find((item) => item === value);
}

/**
 * Rebuild a persisted shared summary field by field. When v1 has no shared
 * summary, callers provide an honest domain-specific legacy projection instead
 * of guessing whether old clean retrievals came from Learn or Play.
 */
export function sanitizeEvidenceSummary(
  value: unknown,
  fallback: CountryEvidenceSummary = createEvidenceSummary(),
): CountryEvidenceSummary {
  if (!value || typeof value !== 'object') return { ...fallback };
  const raw = value as Record<string, unknown>;
  if (raw.version !== 1) return { ...fallback };

  return {
    version: 1,
    passiveExposures: toCount(raw.passiveExposures),
    assistedRetrievals: toCount(raw.assistedRetrievals),
    cleanLearnRetrievals: toCount(raw.cleanLearnRetrievals),
    cleanPlayRetrievals: toCount(raw.cleanPlayRetrievals),
    cleanReviewRetrievals: toCount(raw.cleanReviewRetrievals),
    legacyScoredRetrievals: toCount(raw.legacyScoredRetrievals),
    contradictions: toCount(raw.contradictions),
    retentionSuccesses: toCount(raw.retentionSuccesses),
    lastActivity: toActivity(raw.lastActivity),
    lastOutcome: toOutcome(raw.lastOutcome),
    lastEvidenceAt: toOptionalString(raw.lastEvidenceAt),
    lastScoredAt: toOptionalString(raw.lastScoredAt),
    strongEvidenceAt: toOptionalString(raw.strongEvidenceAt),
  };
}

export function legacyEvidenceSummary(input: {
  passiveExposures?: number;
  assistedRetrievals?: number;
  legacyScoredRetrievals?: number;
  contradictions?: number;
  strongEvidenceAt?: string;
  lastEvidenceAt?: string;
  lastScoredAt?: string;
}): CountryEvidenceSummary {
  return {
    ...createEvidenceSummary(),
    passiveExposures: Math.max(0, Math.floor(input.passiveExposures ?? 0)),
    assistedRetrievals: Math.max(0, Math.floor(input.assistedRetrievals ?? 0)),
    legacyScoredRetrievals: Math.max(0, Math.floor(input.legacyScoredRetrievals ?? 0)),
    contradictions: Math.max(0, Math.floor(input.contradictions ?? 0)),
    strongEvidenceAt: input.strongEvidenceAt,
    lastEvidenceAt: input.lastEvidenceAt,
    lastScoredAt: input.lastScoredAt,
  };
}
