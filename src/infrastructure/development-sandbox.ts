import { CONTINENTS } from '../data/continents.js';
import { COUNTRIES } from '../data/countries.js';
import { regionLearningScopes } from '../data/learning-scopes.js';
import { generatedMapCountryIds } from '../data/map-scopes.js';
import { generatedNeighborCountryIds } from '../data/neighbors/index.js';
import {
  createInitialAchievementState,
  createInitialPerfectRunStreakState,
  regionDomainMasteryKey,
  type EarnedAchievementState,
} from '../domain/achievements.js';
import { createEvidenceSummary } from '../domain/evidence.js';
import { createInitialLocationProgress } from '../domain/map-game.js';
import { LEARNING_DOMAIN_IDS } from '../domain/models.js';
import { createInitialNeighborProgress } from '../domain/neighbor-game.js';
import { createInitialProgress } from '../domain/progress.js';
import { migrateAchievementState, migratePerfectRunStreakState } from './achievement-storage.js';
import { sanitizeLocationRecord } from './map-storage.js';
import { sanitizeNeighborRecord } from './neighbor-storage.js';
import {
  DEVELOPMENT_SANDBOX_NAMESPACE,
  LEARNER_STORAGE_KEYS,
  developmentSandboxKey,
  type LearnerStorageKey,
} from './persistence-keys.js';
import { isDevelopmentSandbox } from './runtime-environment.js';
import { sanitizeRecord } from './storage.js';

export const DEVELOPMENT_SANDBOX_BUNDLE_VERSION = 1 as const;

export type DevelopmentSandboxPreset =
  | 'clean'
  | 'partial-evidence'
  | 'review-due'
  | 'one-perfect-round'
  | 'regional-mastery'
  | 'complete-region'
  | 'complete-continent'
  | 'world-crown';

export interface DevelopmentSandboxBundle {
  version: typeof DEVELOPMENT_SANDBOX_BUNDLE_VERSION;
  namespace: typeof DEVELOPMENT_SANDBOX_NAMESPACE;
  state: Record<LearnerStorageKey, unknown>;
}

const progressKeys = new Map<LearnerStorageKey, (id: string, value: unknown) => unknown>([
  ['flag-atlas:progress:v1', sanitizeRecord],
  ['flag-atlas:location-progress:v1', sanitizeLocationRecord],
  ['flag-atlas:outline-progress:v1', sanitizeRecord],
  ['flag-atlas:neighbor-progress:v1', sanitizeNeighborRecord],
]);
const attemptKeys = new Set<LearnerStorageKey>([
  'flag-atlas:attempts:v1',
  'flag-atlas:location-attempts:v1',
  'flag-atlas:outline-attempts:v1',
  'flag-atlas:neighbor-attempts:v1',
]);

function assertSandbox(): void {
  if (!isDevelopmentSandbox) throw new Error('Development sandbox tools are unavailable in production.');
}

function initialState(): Record<LearnerStorageKey, unknown> {
  const mapIds = generatedMapCountryIds();
  const mapCountries = COUNTRIES.filter((country) => mapIds.includes(country.id));
  return {
    'flag-atlas:progress:v1': createInitialProgress(COUNTRIES),
    'flag-atlas:attempts:v1': [],
    'flag-atlas:location-progress:v1': createInitialLocationProgress(mapIds),
    'flag-atlas:location-attempts:v1': [],
    'flag-atlas:outline-progress:v1': createInitialProgress(mapCountries),
    'flag-atlas:outline-attempts:v1': [],
    'flag-atlas:neighbor-progress:v1': createInitialNeighborProgress(generatedNeighborCountryIds()),
    'flag-atlas:neighbor-attempts:v1': [],
    'flag-atlas:earned-achievements:v1': createInitialAchievementState(),
    'flag-atlas:region-domain-perfect-run-streaks:v1': createInitialPerfectRunStreakState(),
  };
}

function allRegionIds(): string[] {
  return CONTINENTS.flatMap((continent) => regionLearningScopes(continent.id))
    .map((definition) => definition.scope.id)
    .filter((id): id is string => Boolean(id));
}

function achievementState(regionIds: string[], continentIds: EarnedAchievementState['completeContinents'], crown = false): EarnedAchievementState {
  return {
    version: 1,
    regionDomainMasteries: regionIds.flatMap((id) => LEARNING_DOMAIN_IDS.map((domain) => regionDomainMasteryKey(id, domain))),
    completeRegions: regionIds,
    completeContinents: continentIds,
    worldCrown: crown,
  };
}

function markEvidence(state: Record<LearnerStorageKey, unknown>, due: boolean): void {
  const at = due ? '2020-01-01T00:00:00.000Z' : '2026-01-01T00:00:00.000Z';
  const flags = state['flag-atlas:progress:v1'] as ReturnType<typeof createInitialProgress>;
  flags.records.GHA = {
    ...flags.records.GHA,
    status: due ? 'mastered' : 'learning',
    masteryStreak: due ? 2 : 1,
    lifetimeCorrect: due ? 4 : 1,
    currentCorrectStreak: due ? 4 : 1,
    firstSeenAt: at,
    lastSeenAt: at,
    lastCorrectAt: at,
    masteredAt: due ? at : undefined,
    nextReviewAt: due ? at : undefined,
    evidence: { ...createEvidenceSummary(), cleanPlayRetrievals: due ? 4 : 1, lastEvidenceAt: at, lastScoredAt: at, strongEvidenceAt: due ? at : undefined },
  };
}

function markProgressForIds(state: Record<LearnerStorageKey, unknown>, countryIds: readonly string[]): void {
  const at = '2026-08-01T00:00:00.000Z';
  for (const key of progressKeys.keys()) {
    const progress = state[key] as { records: Record<string, { status: string; evidence: ReturnType<typeof createEvidenceSummary>; [name: string]: unknown }> };
    for (const id of countryIds) {
      const record = progress.records[id];
      if (!record) continue;
      record.status = 'learning';
      record.evidence = {
        ...record.evidence,
        cleanPlayRetrievals: Math.max(1, record.evidence.cleanPlayRetrievals),
        lastActivity: 'play',
        lastOutcome: 'clean-retrieval',
        lastEvidenceAt: at,
        lastScoredAt: at,
      };
    }
  }
}

export function createDevelopmentSandboxPreset(preset: DevelopmentSandboxPreset): DevelopmentSandboxBundle {
  assertSandbox();
  const state = initialState();
  if (preset === 'partial-evidence') {
    markEvidence(state, false);
    markProgressForIds(state, ['DZA', 'EGY', 'GHA', 'NGA', 'CMR', 'COD', 'ETH', 'KEN', 'ZAF']);
  }
  if (preset === 'review-due') markEvidence(state, true);
  if (preset === 'one-perfect-round') {
    state['flag-atlas:region-domain-perfect-run-streaks:v1'] = { version: 1, streaks: { 'west-africa:flags': 1 } };
  }
  if (preset === 'regional-mastery') {
    state['flag-atlas:earned-achievements:v1'] = {
      ...createInitialAchievementState(),
      regionDomainMasteries: [regionDomainMasteryKey('west-africa', 'flags')],
    };
  }
  if (preset === 'complete-region') {
    state['flag-atlas:earned-achievements:v1'] = achievementState(['west-africa'], []);
    markProgressForIds(state, regionLearningScopes('africa').find((definition) => definition.scope.id === 'west-africa')?.countryIds ?? []);
  }
  if (preset === 'complete-continent') {
    const africaRegions = regionLearningScopes('africa').map((definition) => definition.scope.id).filter((id): id is string => Boolean(id));
    state['flag-atlas:earned-achievements:v1'] = achievementState(africaRegions, ['africa']);
    markProgressForIds(state, COUNTRIES.filter((country) => country.continentId === 'africa').map((country) => country.id));
  }
  if (preset === 'world-crown') state['flag-atlas:earned-achievements:v1'] = achievementState(allRegionIds(), CONTINENTS.map((continent) => continent.id), true);
  return { version: DEVELOPMENT_SANDBOX_BUNDLE_VERSION, namespace: DEVELOPMENT_SANDBOX_NAMESPACE, state };
}

function canonicalBundle(value: unknown): DevelopmentSandboxBundle {
  if (!value || typeof value !== 'object') throw new Error('The import must be a JSON object.');
  const raw = value as Partial<DevelopmentSandboxBundle>;
  if (raw.version !== DEVELOPMENT_SANDBOX_BUNDLE_VERSION) throw new Error('Unsupported sandbox bundle version.');
  if (raw.namespace !== DEVELOPMENT_SANDBOX_NAMESPACE) throw new Error('This bundle belongs to a different storage namespace.');
  if (!raw.state || typeof raw.state !== 'object') throw new Error('The bundle has no state object.');
  const suppliedKeys = Object.keys(raw.state);
  if (suppliedKeys.length !== LEARNER_STORAGE_KEYS.length || LEARNER_STORAGE_KEYS.some((key) => !(key in raw.state!))) {
    throw new Error('The bundle must contain all ten learner-state namespaces.');
  }

  const state = {} as Record<LearnerStorageKey, unknown>;
  for (const key of LEARNER_STORAGE_KEYS) {
    const data = raw.state[key];
    const sanitizer = progressKeys.get(key);
    if (sanitizer) {
      if (!data || typeof data !== 'object') throw new Error(`${key} must be a progress object.`);
      const envelope = data as { version?: unknown; records?: unknown };
      if ((envelope.version !== 1 && envelope.version !== 2) || !envelope.records || typeof envelope.records !== 'object') throw new Error(`${key} has an invalid versioned envelope.`);
      const records: Record<string, unknown> = {};
      for (const [id, record] of Object.entries(envelope.records as Record<string, unknown>)) {
        const clean = sanitizer(id, record);
        if (!clean) throw new Error(`${key} contains an invalid record for ${id}.`);
        records[id] = clean;
      }
      state[key] = { version: 2, records };
    } else if (attemptKeys.has(key)) {
      if (!Array.isArray(data) || data.length > 2000 || data.some((entry) => !entry || typeof entry !== 'object')) throw new Error(`${key} must be an array of at most 2,000 attempt objects.`);
      state[key] = data;
    } else if (key === 'flag-atlas:earned-achievements:v1') {
      if (!data || typeof data !== 'object' || (data as { version?: unknown }).version !== 1) throw new Error(`${key} has an invalid envelope.`);
      state[key] = migrateAchievementState(data);
    } else {
      if (!data || typeof data !== 'object' || (data as { version?: unknown }).version !== 1) throw new Error(`${key} has an invalid envelope.`);
      state[key] = migratePerfectRunStreakState(data);
    }
  }
  return { version: DEVELOPMENT_SANDBOX_BUNDLE_VERSION, namespace: DEVELOPMENT_SANDBOX_NAMESPACE, state };
}

export function exportDevelopmentSandbox(): DevelopmentSandboxBundle {
  assertSandbox();
  const fallback = initialState();
  const state = {} as Record<LearnerStorageKey, unknown>;
  for (const key of LEARNER_STORAGE_KEYS) {
    const raw = localStorage.getItem(developmentSandboxKey(key));
    state[key] = raw === null ? fallback[key] : JSON.parse(raw);
  }
  return canonicalBundle({ version: DEVELOPMENT_SANDBOX_BUNDLE_VERSION, namespace: DEVELOPMENT_SANDBOX_NAMESPACE, state });
}

export function applyDevelopmentSandboxBundle(value: unknown): void {
  assertSandbox();
  const bundle = canonicalBundle(value);
  const previous = new Map(LEARNER_STORAGE_KEYS.map((key) => [key, localStorage.getItem(developmentSandboxKey(key))]));
  try {
    for (const key of LEARNER_STORAGE_KEYS) localStorage.setItem(developmentSandboxKey(key), JSON.stringify(bundle.state[key]));
  } catch (error) {
    for (const key of LEARNER_STORAGE_KEYS) {
      const oldValue = previous.get(key);
      if (oldValue === null || oldValue === undefined) localStorage.removeItem(developmentSandboxKey(key));
      else localStorage.setItem(developmentSandboxKey(key), oldValue);
    }
    throw error;
  }
}

export function resetDevelopmentSandbox(): void {
  assertSandbox();
  for (const key of LEARNER_STORAGE_KEYS) localStorage.removeItem(developmentSandboxKey(key));
}

export function parseDevelopmentSandboxImport(source: string): DevelopmentSandboxBundle {
  let parsed: unknown;
  try { parsed = JSON.parse(source); } catch { throw new Error('The import is not valid JSON.'); }
  return canonicalBundle(parsed);
}
