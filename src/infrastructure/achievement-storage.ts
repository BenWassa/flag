import { CONTINENTS, REGIONS } from '../data/continents.js';
import {
  ACHIEVEMENT_SCHEMA_VERSION,
  createInitialAchievementState,
  createInitialPerfectRunStreakState,
  isKnownRegionDomainMasteryKey,
  PERFECT_RUN_STREAK_SCHEMA_VERSION,
  type EarnedAchievementState,
  type PerfectRunStreakState,
  type RegionDomainMasteryKey,
} from '../domain/achievements.js';
import type { ContinentId } from '../domain/models.js';
import { parseJson } from './sanitize.js';
import { createStorageGuard } from './storage-guard.js';

export const ACHIEVEMENT_STORAGE_KEY = 'flag-atlas:earned-achievements:v1';
export const PERFECT_RUN_STREAK_STORAGE_KEY = 'flag-atlas:region-domain-perfect-run-streaks:v1';

const REGION_IDS = new Set(REGIONS.map((region) => region.id));
const CONTINENT_IDS = new Set<ContinentId>(CONTINENTS.map((continent) => continent.id));
const guard = createStorageGuard();
const streakGuard = createStorageGuard();

export function achievementStorageIsWritable(): boolean {
  return guard.isWritable();
}

export function perfectRunStreakStorageIsWritable(): boolean {
  return streakGuard.isWritable();
}

function uniqueStrings(value: unknown, predicate: (item: string) => boolean): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && predicate(item)))];
}

/**
 * Versioned migration boundary. There is no pre-v1 achievement schema, so
 * unknown versions/defaults are intentionally empty rather than inferred from
 * country ledgers. Existing v1 earned bits are sanitised, deduplicated and kept.
 */
export function migrateAchievementState(value: unknown): EarnedAchievementState {
  if (!value || typeof value !== 'object') return createInitialAchievementState();
  const raw = value as Record<string, unknown>;
  if (raw.version !== ACHIEVEMENT_SCHEMA_VERSION) return createInitialAchievementState();

  return {
    version: ACHIEVEMENT_SCHEMA_VERSION,
    regionDomainMasteries: uniqueStrings(
      raw.regionDomainMasteries,
      isKnownRegionDomainMasteryKey,
    ) as RegionDomainMasteryKey[],
    completeRegions: uniqueStrings(raw.completeRegions, (regionId) => REGION_IDS.has(regionId)),
    completeContinents: uniqueStrings(
      raw.completeContinents,
      (continentId) => CONTINENT_IDS.has(continentId as ContinentId),
    ) as ContinentId[],
    worldCrown: raw.worldCrown === true,
  };
}

export function loadAchievementState(): EarnedAchievementState {
  return migrateAchievementState(parseJson(guard.readRaw(ACHIEVEMENT_STORAGE_KEY)));
}

export function saveAchievementState(state: EarnedAchievementState): boolean {
  return guard.writeRaw(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(state));
}

/** Full learner reset semantics: earned achievements are erased explicitly. */
export function resetAchievementStorage(): void {
  guard.removeRaw(ACHIEVEMENT_STORAGE_KEY);
}

/**
 * Versioned migration boundary, mirroring migrateAchievementState. There is
 * no pre-v1 streak schema, so unknown versions/defaults are empty rather than
 * inferred. Streak counts are clamped so corrupted storage cannot fabricate
 * an already-earned mastery on the next award pass.
 */
export function migratePerfectRunStreakState(value: unknown): PerfectRunStreakState {
  if (!value || typeof value !== 'object') return createInitialPerfectRunStreakState();
  const raw = value as Record<string, unknown>;
  if (raw.version !== PERFECT_RUN_STREAK_SCHEMA_VERSION || !raw.streaks || typeof raw.streaks !== 'object') {
    return createInitialPerfectRunStreakState();
  }

  const streaks: Partial<Record<RegionDomainMasteryKey, number>> = {};
  for (const [key, count] of Object.entries(raw.streaks as Record<string, unknown>)) {
    if (!isKnownRegionDomainMasteryKey(key) || typeof count !== 'number' || !Number.isFinite(count)) continue;
    streaks[key] = Math.max(0, Math.min(99, Math.trunc(count)));
  }

  return { version: PERFECT_RUN_STREAK_SCHEMA_VERSION, streaks };
}

export function loadPerfectRunStreakState(): PerfectRunStreakState {
  return migratePerfectRunStreakState(parseJson(streakGuard.readRaw(PERFECT_RUN_STREAK_STORAGE_KEY)));
}

export function savePerfectRunStreakState(state: PerfectRunStreakState): boolean {
  return streakGuard.writeRaw(PERFECT_RUN_STREAK_STORAGE_KEY, JSON.stringify(state));
}

/** Full learner reset semantics: in-progress perfect-run streaks are erased explicitly. */
export function resetPerfectRunStreakStorage(): void {
  streakGuard.removeRaw(PERFECT_RUN_STREAK_STORAGE_KEY);
}
