import { CONTINENTS, REGIONS } from '../data/continents.js';
import {
  ACHIEVEMENT_SCHEMA_VERSION,
  createInitialAchievementState,
  isKnownRegionDomainMasteryKey,
  type EarnedAchievementState,
  type RegionDomainMasteryKey,
} from '../domain/achievements.js';
import type { ContinentId } from '../domain/models.js';

export const ACHIEVEMENT_STORAGE_KEY = 'flag-atlas:earned-achievements:v1';

const REGION_IDS = new Set(REGIONS.map((region) => region.id));
const CONTINENT_IDS = new Set<ContinentId>(CONTINENTS.map((continent) => continent.id));
let writable = true;

export function achievementStorageIsWritable(): boolean {
  return writable;
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
  } catch {
    writable = false;
    return null;
  }
}

function writeRaw(value: string): boolean {
  try {
    localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, value);
    return true;
  } catch {
    writable = false;
    return false;
  }
}

function parseJson(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
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
  return migrateAchievementState(parseJson(readRaw()));
}

export function saveAchievementState(state: EarnedAchievementState): boolean {
  return writeRaw(JSON.stringify(state));
}

/** Full learner reset semantics: earned achievements are erased explicitly. */
export function resetAchievementStorage(): void {
  try {
    localStorage.removeItem(ACHIEVEMENT_STORAGE_KEY);
  } catch {
    writable = false;
  }
}
