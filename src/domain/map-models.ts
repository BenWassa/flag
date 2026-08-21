import type {
  CountryEvidenceSummary,
  EvidenceActivity,
  EvidenceOutcome,
  LearningStatus,
  StudyScope,
} from './models.js';

export type MapMode = 'learn' | 'test';
export type MapResolution = 'first-try' | 'one-miss' | 'two-miss' | 'revealed' | 'incorrect';

export interface MapPoint {
  cx: number;
  cy: number;
  r: number;
}

export interface MapAnchorPoint {
  cx: number;
  cy: number;
}

export interface MapCountryCallout {
  /** Point on/next to the real country geometry where the leader line starts. */
  anchor: MapAnchorPoint;
  /** Visible off-country target connected to the true location by a leader line. */
  target: MapPoint;
}

export interface MapViewportFocus {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MapNamedPath {
  name: string;
  path: string;
}

export interface MapWaterLayers {
  /** Source-derived ocean geometry, projected into the same continent canvas. */
  oceanPath?: string;
  /** Restrained recognition context. Never interactive. */
  lakes?: MapNamedPath[];
}

export interface MapCountryGeometry {
  countryId: string;
  path?: string;
  /**
   * Canonical generated polygon retained when map UX substitutes a locator for
   * a tiny island country. Map rendering ignores this field; geometry-derived
   * learning domains can still consume the same production source topology.
   */
  outlinePath?: string;
  locator?: MapPoint;
  hitAssist?: MapPoint;
  /** Explicit cartographic callout for mainland countries too small/narrow for honest phone tapping. */
  callout?: MapCountryCallout;
}

export interface MapRegionAsset {
  scope: StudyScope;
  viewBox: string;
  countries: MapCountryGeometry[];
  /** Non-interactive catalog countries used to preserve parent-continent context. */
  contextCountries?: MapCountryGeometry[];
  /** Additional non-catalog geography such as Western Sahara / source POV context. */
  contextPaths?: string[];
  /** Political borders rendered once from the canonical topology, not once per country fill. */
  sharedBoundaryPaths?: string[];
  /** Exterior coastlines rendered separately from political boundaries. */
  coastlinePaths?: string[];
  /** Source-derived physical context on the same projection/canvas. */
  water?: MapWaterLayers;
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
  evidenceActivity?: EvidenceActivity;
  evidenceOutcome?: EvidenceOutcome;
  evidenceCredit?: number;
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
  /** Compatibility scheduler credit; learner-facing UI must not expose x/y thresholds. */
  masteryStreak: number;
  lifetimeResolved: number;
  lifetimeFirstTryCorrect: number;
  lifetimeIncorrectGuesses: number;
  revealCount: number;
  lapseCount: number;
  evidence: CountryEvidenceSummary;
  firstSeenAt?: string;
  lastSeenAt?: string;
  lastCorrectAt?: string;
  lastMissedAt?: string;
  masteredAt?: string;
  lastMasteryCreditSessionId?: string;
  confusionCounts: Record<string, number>;
}

export interface LocationProgressState {
  version: 2;
  records: Record<string, LocationProgressRecord>;
}

export interface LocationScopeStats {
  total: number;
  unseen: number;
  learning: number;
  mastered: number;
}
