import { COUNTRIES } from '../countries.js';
import {
  getMapScopeConfig,
  type MapScopeConfig,
} from '../map-scopes.js';
import type { ContinentId } from '../../domain/models.js';
import type { LandAdjacency } from '../../domain/neighbor-game.js';
import {
  AFRICA_LAND_ADJACENCY,
  AFRICA_ZERO_LAND_NEIGHBOR_IDS,
} from './africa.js';

export { AFRICA_LAND_ADJACENCY, AFRICA_ZERO_LAND_NEIGHBOR_IDS };

export interface NeighborContinentData {
  continentId: ContinentId;
  adjacency: LandAdjacency;
  /** Targets withheld because the currently shipped graph is known to be incomplete. */
  coverageExcludedIds: readonly string[];
}

// Africa's current shipped target policy remains stable through the generic
// refactor. The build-time global graph introduced by #57 may know complete
// Egypt/Morocco adjacency, but re-enabling existing targets is a separate
// curriculum change rather than a side effect of architecture work.
export const AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS = Object.freeze(['EGY', 'MAR'] as const);
const AFRICA_COVERAGE_EXCLUDED = new Set<string>(AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS);

/**
 * Every country whose land borders the topology genuinely knows, including the
 * island nations whose truthful answer is that they have none. Only countries
 * with incomplete cross-continent topology are held back.
 */
export const AFRICA_STANDARD_NEIGHBOR_TARGET_IDS = Object.freeze(
  Object.keys(AFRICA_LAND_ADJACENCY).filter((countryId) => !AFRICA_COVERAGE_EXCLUDED.has(countryId)),
);

const NEIGHBOR_CONTINENT_DATA: Partial<Record<ContinentId, NeighborContinentData>> = {
  africa: {
    continentId: 'africa',
    adjacency: AFRICA_LAND_ADJACENCY,
    coverageExcludedIds: AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS,
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
  return Object.values(NEIGHBOR_CONTINENT_DATA)
    .filter((data): data is NeighborContinentData => Boolean(data))
    .flatMap((data) => Object.keys(data.adjacency));
}

/**
 * Guessing may legitimately cross a learner-continent boundary (for example
 * Colombia → Panama), so the entry field recognises every canonical app country.
 */
export const NEIGHBOR_GUESS_COUNTRY_IDS = Object.freeze(COUNTRIES.map((country) => country.id));

/** Compatibility seam for existing Africa-specific verification. */
export function getAfricaNeighborScopeConfig(scopeId: string): MapScopeConfig | undefined {
  const config = getNeighborScopeConfig(scopeId);
  return config?.continentId === 'africa' ? config : undefined;
}
