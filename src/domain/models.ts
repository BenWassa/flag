export const CONTINENT_IDS = [
  'africa',
  'asia',
  'europe',
  'north-america',
  'south-america',
  'oceania',
] as const;

export const LEARNING_DOMAIN_IDS = ['flags', 'locations', 'outlines', 'neighbors'] as const;

export type ContinentId = (typeof CONTINENT_IDS)[number];
export type LearningDomain = (typeof LEARNING_DOMAIN_IDS)[number];
export type LearningActivity = 'learn' | 'test' | 'review';
export type LearningStatus = 'unseen' | 'learning' | 'mastered';
export type StudyMode = 'learn' | 'test';
export type ScopeKind = 'world' | 'continent' | 'region';

/** Shared evidence vocabulary. Stable UI/routes may still use `test`; the evidence layer calls it Play. */
export type EvidenceActivity = 'learn' | 'play' | 'review';
export type EvidenceOutcome =
  | 'passive-exposure'
  | 'assisted-retrieval'
  | 'clean-retrieval'
  | 'contradictory';

/**
 * Cross-domain evidence summary stored beside each domain's native counters.
 * Native records intentionally remain richer: this is an interoperability seam,
 * not a replacement for domain-specific learning mechanics.
 */
export interface CountryEvidenceSummary {
  version: 1;
  passiveExposures: number;
  assistedRetrievals: number;
  cleanLearnRetrievals: number;
  cleanPlayRetrievals: number;
  cleanReviewRetrievals: number;
  /** Scored retrievals retained from v1 records whose original Learn/Play mode is unknowable. */
  legacyScoredRetrievals: number;
  contradictions: number;
  retentionSuccesses: number;
  lastActivity?: EvidenceActivity;
  lastOutcome?: EvidenceOutcome;
  lastEvidenceAt?: string;
  lastScoredAt?: string;
  strongEvidenceAt?: string;
}

export interface Country {
  id: string;
  name: string;
  iso2: string;
  iso3: string;
  continentId: ContinentId;
  regionId: string;
  aliases?: string[];
}

export interface Region {
  id: string;
  continentId: ContinentId;
  name: string;
}

export interface Continent {
  id: ContinentId;
  name: string;
}

export interface StudyScope {
  kind: ScopeKind;
  id?: string;
  label: string;
}

export interface ProgressRecord {
  countryId: string;
  status: LearningStatus;
  /** Compatibility scheduler credit. Learner-facing UI must not expose it as a punch card. */
  masteryStreak: number;
  lifetimeCorrect: number;
  lifetimeIncorrect: number;
  currentCorrectStreak: number;
  lapseCount: number;
  retentionLevel: number;
  evidence: CountryEvidenceSummary;
  lastMasteryCreditSessionId?: string;
  firstSeenAt?: string;
  lastSeenAt?: string;
  lastCorrectAt?: string;
  lastIncorrectAt?: string;
  masteredAt?: string;
  nextReviewAt?: string;
  averageResponseTimeMs?: number;
  confusionCounts: Record<string, number>;
}

export interface ProgressState {
  version: 2;
  records: Record<string, ProgressRecord>;
}

export interface Question {
  id: string;
  countryId: string;
  optionCountryIds: string[];
  correctIndex: number;
}

export interface QuizSession {
  id: string;
  mode: StudyMode;
  scope: StudyScope;
  startedAt: string;
  questions: Question[];
  currentIndex: number;
  attempts: QuizAttempt[];
}

export interface QuizAttempt {
  sessionId: string;
  questionId: string;
  countryId: string;
  selectedCountryId: string;
  correct: boolean;
  responseTimeMs: number;
  answeredAt: string;
  statusBefore: LearningStatus;
  statusAfter: LearningStatus;
  streakBefore: number;
  streakAfter: number;
  evidenceActivity?: EvidenceActivity;
  evidenceOutcome?: EvidenceOutcome;
  evidenceCredit?: number;
}

export interface SessionResult {
  session: QuizSession;
  correct: number;
  total: number;
  /** Internal compatibility name: this means countries that newly reached strong evidence. */
  newlyMastered: string[];
  missed: QuizAttempt[];
}

export interface ScopeStats {
  total: number;
  unseen: number;
  learning: number;
  /** Internal compatibility bucket: learner-facing copy calls this Strong evidence. */
  mastered: number;
  due: number;
}
