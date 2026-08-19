import type { LearningStatus, StudyScope } from './models.js';

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
  /** Major orientation rivers only. Never interactive. */
  rivers?: MapNamedPath[];
}

export interface MapCountryGeometry {
  countryId: string;
  /** Production map polygon when the country is directly rendered/tappable. */
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
  startedTargetAt: string;
}

export interface LocationProgressRecord {
  countryId: string;
  status: LearningStatus;
  evidenceSessions: string[];
  masterySessionStreak: number;
  /** Misses in the current learning sequence, used to require recovery after a lapse. */
  recoveryDebt: number;
  lastResolution?: MapResolution;
  firstTryCorrect: number;
  totalResolved: number;
  updatedAt: string;
}

export interface LocationProgressState {
  version: 1;
  records: Record<string, LocationProgressRecord>;
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
  resolutionCounts: Record<MapResolution, number>;
  missedCountryIds: string[];
}
