import { COUNTRIES } from '../countries.js';
import {
  getMapScopeConfig,
  type MapScopeConfig,
} from '../map-scopes.js';
import type { ContinentId } from '../../domain/models.js';
import type { LandAdjacency } from '../../domain/neighbor-game.js';
import {
  AFRICA_LAND_ADJACENCY,
  AFRICA_STANDARD_NEIGHBOR_TARGET_IDS as AFRICA_TOPOLOGY_NEIGHBOR_TARGET_IDS,
  AFRICA_ZERO_LAND_NEIGHBOR_IDS,
} from './africa.js';
import {
  SOUTH_AMERICA_LAND_ADJACENCY,
  SOUTH_AMERICA_ZERO_LAND_NEIGHBOR_IDS,
} from './south-america.js';
import {
  EUROPE_LAND_ADJACENCY,
  EUROPE_ZERO_LAND_NEIGHBOR_IDS,
} from './europe.js';
import {
  ASIA_LAND_ADJACENCY,
  ASIA_ZERO_LAND_NEIGHBOR_IDS,
} from './asia.js';
import {
  NORTH_AMERICA_LAND_ADJACENCY,
  NORTH_AMERICA_ZERO_LAND_NEIGHBOR_IDS,
} from './north-america.js';
import {
  OCEANIA_LAND_ADJACENCY,
  OCEANIA_ZERO_LAND_NEIGHBOR_IDS,
} from './oceania.js';

export {
  AFRICA_LAND_ADJACENCY,
  AFRICA_ZERO_LAND_NEIGHBOR_IDS,
  SOUTH_AMERICA_LAND_ADJACENCY,
  SOUTH_AMERICA_ZERO_LAND_NEIGHBOR_IDS,
  EUROPE_LAND_ADJACENCY,
  EUROPE_ZERO_LAND_NEIGHBOR_IDS,
  ASIA_LAND_ADJACENCY,
  ASIA_ZERO_LAND_NEIGHBOR_IDS,
  NORTH_AMERICA_LAND_ADJACENCY,
  NORTH_AMERICA_ZERO_LAND_NEIGHBOR_IDS,
  OCEANIA_LAND_ADJACENCY,
  OCEANIA_ZERO_LAND_NEIGHBOR_IDS,
};

export interface NeighborContinentData {
  continentId: ContinentId;
  adjacency: LandAdjacency;
  /** Targets withheld because the currently shipped graph is known to be incomplete. */
  coverageExcludedIds: readonly string[];
}

// Africa's current shipped target policy remains stable through the generic
// refactor. The build-time global graph may know complete Egypt/Morocco
// adjacency, but re-enabling existing Africa targets is a separate curriculum
// change rather than a side effect of Asia expansion.
export const AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS = Object.freeze(['EGY', 'MAR'] as const);
const AFRICA_COVERAGE_EXCLUDED = new Set<string>(AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS);

export const AFRICA_STANDARD_NEIGHBOR_TARGET_IDS = Object.freeze(
  AFRICA_TOPOLOGY_NEIGHBOR_TARGET_IDS.filter((countryId) => !AFRICA_COVERAGE_EXCLUDED.has(countryId)),
);

const NEIGHBOR_CONTINENT_DATA: Partial<Record<ContinentId, NeighborContinentData>> = {
  africa: {
    continentId: 'africa',
    adjacency: AFRICA_LAND_ADJACENCY,
    coverageExcludedIds: AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS,
  },
  'south-america': {
    continentId: 'south-america',
    adjacency: SOUTH_AMERICA_LAND_ADJACENCY,
    coverageExcludedIds: [],
  },
  europe: {
    continentId: 'europe',
    adjacency: EUROPE_LAND_ADJACENCY,
    coverageExcludedIds: [],
  },
  asia: {
    continentId: 'asia',
    adjacency: ASIA_LAND_ADJACENCY,
    coverageExcludedIds: [],
  },
  'north-america': {
    continentId: 'north-america',
    adjacency: NORTH_AMERICA_LAND_ADJACENCY,
    coverageExcludedIds: [],
  },
  oceania: {
    continentId: 'oceania',
    adjacency: OCEANIA_LAND_ADJACENCY,
    coverageExcludedIds: [],
  },
};

export function getNeighborContinentData(continentId: ContinentId): NeighborContinentData | undefined {
  return NEIGHBOR_CONTINENT_DATA[continentId];
}

export function getNeighborScopeConfig(scopeId: string): MapScopeConfig | undefined {
  const config = getMapScopeConfig(scopeId);
  if (!config) return undefined;
  const data = getNeighborContinentData(config.continentId);
  if (!data) return undefined;
  const excluded = new Set(data.coverageExcludedIds);
  return {
    ...config,
    countryIds: config.countryIds.filter((countryId) => countryId in data.adjacency && !excluded.has(countryId)),
  };
}

export function landAdjacencyForScope(scopeId: string): LandAdjacency | undefined {
  const config = getMapScopeConfig(scopeId);
  return config ? getNeighborContinentData(config.continentId)?.adjacency : undefined;
}

export function generatedNeighborCountryIds(): readonly string[] {
  return [...new Set(Object.values(NEIGHBOR_CONTINENT_DATA)
    .filter((data): data is NeighborContinentData => Boolean(data))
    .flatMap((data) => Object.keys(data.adjacency)))];
}

/**
 * Guessing may legitimately cross a learner-continent boundary, so the entry
 * field recognises every canonical app country.
 */
export const NEIGHBOR_GUESS_COUNTRY_IDS = Object.freeze(COUNTRIES.map((country) => country.id));

/** Compatibility seam for existing Africa-specific verification. */
export function getAfricaNeighborScopeConfig(scopeId: string): MapScopeConfig | undefined {
  const config = getNeighborScopeConfig(scopeId);
  return config?.continentId === 'africa' ? config : undefined;
}
