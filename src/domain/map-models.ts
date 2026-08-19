import type { LearningStatus, StudyScope } from './models.js';

export type MapMode = 'learn' | 'test';
export type MapResolution = 'first-try' | 'one-miss' | 'two-miss' | 'revealed' | 'incorrect';

export interface MapPoint {
  cx: number;
  cy: number;
  r: number;
}

export interface MapViewportFocus {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MapCountryGeometry {
  countryId: string;
  path?: string;
  locator?: MapPoint;
  hitAssist?: MapPoint;
}

export interface MapRegionAsset {
  scope: StudyScope;
  viewBox: string;
  countries: MapCountryGeometry[];
  /** Non-interactive surrounding geography used to preserve continent context. */
  contextPaths?: string[];
  /** Preferred first viewport within the full continent canvas. */
  initialFocus?: MapViewportFocus;
}

export interface MapTargetState {
  countryId: string;
  misses: number;
  resolved: boolean;
  resolution?: MapResolution;
  selectedCountryId?: string;
}

export interface MapAttempt {
  sessionId: string;
  targetCountryId: string;
  selectedCountryId: string;
  correct: boolean;
  missNumber: number;
  resolved: boolean;
  revealed: boolean;
  responseTimeMs: number;
  answeredAt: string;
}

export interface MapSession {
  id: string;
  mode: MapMode;
  scope: StudyScope;
  startedAt: string;
  countryIds: string[];
  currentIndex: number;
  targets: Record<string, MapTargetState>;
  attempts: MapAttempt[];
}

export interface MapGuessOutcome {
  correct: boolean;
  resolved: boolean;
  revealed: boolean;
  targetCountryId: string;
  selectedCountryId: string;
  misses: number;
  resolution?: MapResolution;
}

export interface MapSessionResult {
  session: MapSession;
  firstTryCorrect: number;
  total: number;
  revealed: number;
  missedCountryIds: string[];
}

export interface LocationProgressRecord {
  countryId: string;
  status: LearningStatus;
  masteryStreak: number;
  lifetimeResolved: number;
  lifetimeFirstTryCorrect: number;
  lifetimeIncorrectGuesses: number;
  revealCount: number;
  lapseCount: number;
  firstSeenAt?: string;
  lastSeenAt?: string;
  lastCorrectAt?: string;
  lastMissedAt?: string;
  masteredAt?: string;
  lastMasteryCreditSessionId?: string;
  confusionCounts: Record<string, number>;
}

export interface LocationProgressState {
  version: 1;
  records: Record<string, LocationProgressRecord>;
}

export interface LocationScopeStats {
  total: number;
  unseen: number;
  learning: number;
  mastered: number;
}
