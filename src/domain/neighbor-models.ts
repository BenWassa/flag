import type { LearningStatus, StudyMode, StudyScope } from './models.js';

export type NeighborResolution = 'complete' | 'exhausted';
export type NeighborGuessKind = 'correct' | 'wrong' | 'duplicate';

export interface NeighborTargetState {
  countryId: string;
  neighborIds: string[];
  foundIds: string[];
  guessedIds: string[];
  wrongGuesses: number;
  attemptBudget: number;
  resolved: boolean;
  resolution?: NeighborResolution;
  revealedIds: string[];
}

export interface NeighborAttempt {
  sessionId: string;
  targetCountryId: string;
  selectedCountryId: string;
  kind: NeighborGuessKind;
  consumedAttempt: boolean;
  attemptsUsed: number;
  remainingAttempts: number;
  foundCount: number;
  totalNeighbors: number;
  resolved: boolean;
  responseTimeMs: number;
  answeredAt: string;
}

export interface NeighborGuessOutcome {
  targetCountryId: string;
  selectedCountryId: string;
  kind: NeighborGuessKind;
  consumedAttempt: boolean;
  attemptsUsed: number;
  remainingAttempts: number;
  foundCount: number;
  totalNeighbors: number;
  resolved: boolean;
  resolution?: NeighborResolution;
  revealedIds: string[];
}

export interface NeighborSession {
  id: string;
  mode: StudyMode;
  scope: StudyScope;
  startedAt: string;
  countryIds: string[];
  currentIndex: number;
  targets: Record<string, NeighborTargetState>;
  attempts: NeighborAttempt[];
}

export interface NeighborSessionResult {
  session: NeighborSession;
  cleanCompletions: number;
  completed: number;
  exhausted: number;
  total: number;
  missedCountryIds: string[];
}

export interface NeighborProgressRecord {
  countryId: string;
  status: LearningStatus;
  masteryStreak: number;
  lifetimeRounds: number;
  lifetimeCompleted: number;
  lifetimeCleanCompletions: number;
  lifetimeWrongGuesses: number;
  revealCount: number;
  lapseCount: number;
  firstSeenAt?: string;
  lastSeenAt?: string;
  lastCompletedAt?: string;
  lastMissedAt?: string;
  masteredAt?: string;
  lastMasteryCreditSessionId?: string;
  confusionCounts: Record<string, number>;
}

export interface NeighborProgressState {
  version: 1;
  records: Record<string, NeighborProgressRecord>;
}

export interface NeighborScopeStats {
  total: number;
  unseen: number;
  learning: number;
  mastered: number;
}
