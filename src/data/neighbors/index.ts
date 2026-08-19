import { getAfricaMapScopeConfig, type MapScopeConfig } from '../map-scopes.js';
import {
  AFRICA_LAND_ADJACENCY,
  AFRICA_STANDARD_NEIGHBOR_TARGET_IDS as AFRICA_TOPOLOGY_NEIGHBOR_TARGET_IDS,
  AFRICA_ZERO_LAND_NEIGHBOR_IDS,
} from './africa.js';

export { AFRICA_LAND_ADJACENCY, AFRICA_ZERO_LAND_NEIGHBOR_IDS };

// The production topology is deliberately Africa-only. Egypt and Morocco have
// application-country land-border relationships that cross that topology boundary,
// so their Africa-only adjacency arrays are incomplete. Keep the generated graph
// untouched and exclude these targets until the canonical topology is expanded.
export const AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS = Object.freeze(['EGY', 'MAR'] as const);
const COVERAGE_EXCLUDED = new Set<string>(AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS);

export const AFRICA_STANDARD_NEIGHBOR_TARGET_IDS = Object.freeze(
  AFRICA_TOPOLOGY_NEIGHBOR_TARGET_IDS.filter((countryId) => !COVERAGE_EXCLUDED.has(countryId)),
);

export function getAfricaNeighborScopeConfig(scopeId: string): MapScopeConfig | undefined {
  const config = getAfricaMapScopeConfig(scopeId);
  if (!config) return undefined;
  return {
    scope: config.scope,
    countryIds: config.countryIds.filter((countryId) => !COVERAGE_EXCLUDED.has(countryId)),
  };
}
