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
  /** Persistent perceptual marker at the canonical location; never the practical touch surface. */
  marker?: MapPoint;
  /** Explicit cartographic callout for mainland countries too small/narrow for honest phone tapping. */
  callout?: MapCountryCallout;
}

/** Where a country can actually be tapped inside an inset, in canvas units. */
export interface MapInsetMark {
  countryId: string;
  cx: number;
  cy: number;
}

export type MapInsetAnchor = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * A magnified window onto part of the same continent canvas, for clusters of
 * countries too small and too tightly packed to tap on the map itself.
 *
 * The panel is sized in CSS pixels, not canvas units, and that is the whole
 * point. A box living on the canvas competes with the map for the same space,
 * so its magnification is capped by the frame it sits in — for the Levant that
 * caps the smallest target at roughly 11 CSS px, well under the 44 px contract.
 * Fixing the panel in screen space decouples its scale from the map's, so every
 * member reaches a full 44 px touch surface.
 *
 * The panel is shown only while the current question's country is inside it, so
 * it is the question's own answer surface rather than persistent chrome. The
 * source window stays outlined on the map, so the panel never implies the
 * cluster is somewhere it is not.
 */
export interface MapInset {
  id: string;
  /** Learner-facing label. Names water or a region — never a country, which would be the answer. */
  label: string;
  /** Scored countries answerable inside this panel. */
  countryIds: string[];
  /** Canvas-space window the panel magnifies. */
  source: MapViewportFocus;
  /** Tap anchors, one per member, in canvas units. */
  marks: MapInsetMark[];
  /** Panel size in CSS px, derived so every member clears the 44 px touch contract. */
  size: { width: number; height: number };
  /** Hit-surface radius in canvas units, equal to 22 CSS px at the panel's fixed scale. */
  hitRadius: number;
  /** Stage corner the panel occupies. */
  anchor: MapInsetAnchor;
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
  /** Evidence-based maximum zoom multiplier owned by the continent configuration. */
  maxZoom?: number;
  /** Preferred first viewport within the full continent canvas. */
  initialFocus?: MapViewportFocus;
  /** Framed magnified windows for distant or fragmented scoring geography. */
  insets?: MapInset[];
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
  cleared: number;
}
