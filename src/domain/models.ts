export const CONTINENT_IDS = [
  'africa',
  'asia',
  'europe',
  'north-america',
  'south-america',
  'oceania',
] as const;

export type ContinentId = (typeof CONTINENT_IDS)[number];
export type LearningStatus = 'unseen' | 'learning' | 'mastered';
export type StudyMode = 'learn' | 'test';
export type ScopeKind = 'world' | 'continent' | 'region';

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
  masteryStreak: number;
  lifetimeCorrect: number;
  lifetimeIncorrect: number;
  currentCorrectStreak: number;
  lapseCount: number;
  retentionLevel: number;
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
  version: 1;
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
}

export interface SessionResult {
  session: QuizSession;
  correct: number;
  total: number;
  newlyMastered: string[];
  missed: QuizAttempt[];
}

export interface ScopeStats {
  total: number;
  unseen: number;
  learning: number;
  mastered: number;
  due: number;
}
