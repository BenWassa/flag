import { COUNTRIES } from '../data/countries.js';
import { getAfricaMapScopeConfig } from '../data/map-scopes.js';
import { getAfricaNeighborScopeConfig } from '../data/neighbors/index.js';
import { LEARNING_DOMAIN_IDS, type LearningDomain, type StudyScope } from './models.js';

/**
 * Flags carries the full world curriculum; the other three domains only have
 * generated Africa geometry. Unsupported scopes must render as honest shells
 * rather than counting towards completion.
 */
export function scopeSupportsDomain(scope: StudyScope, domain: LearningDomain): boolean {
  if (domain === 'flags') return true;
  if (!scope.id) return false;
  return domain === 'neighbors'
    ? getAfricaNeighborScopeConfig(scope.id) !== undefined
    : getAfricaMapScopeConfig(scope.id) !== undefined;
}

export function supportedDomainsForScope(scope: StudyScope): LearningDomain[] {
  return LEARNING_DOMAIN_IDS.filter((domain) => scopeSupportsDomain(scope, domain));
}

/**
 * Canonical country membership for one supported scope/domain pair. Achievement
 * aggregation and progress summaries should consume this seam rather than
 * rebuilding geography membership from a second taxonomy.
 */
export function countryIdsForSupportedScope(scope: StudyScope, domain: LearningDomain): string[] {
  if (!scopeSupportsDomain(scope, domain)) return [];

  if (domain === 'locations' || domain === 'outlines') {
    return scope.id ? [...(getAfricaMapScopeConfig(scope.id)?.countryIds ?? [])] : [];
  }

  if (domain === 'neighbors') {
    return scope.id ? [...(getAfricaNeighborScopeConfig(scope.id)?.countryIds ?? [])] : [];
  }

  if (scope.kind === 'world') return COUNTRIES.map((country) => country.id);
  if (scope.kind === 'continent') {
    return COUNTRIES.filter((country) => country.continentId === scope.id).map((country) => country.id);
  }
  if (scope.kind === 'region') {
    return COUNTRIES.filter((country) => country.regionId === scope.id).map((country) => country.id);
  }
  return [];
}

/** Missing or empty curriculum is never treated as completion. */
export function scopeHasCompleteDomainCoverage(scope: StudyScope): boolean {
  return LEARNING_DOMAIN_IDS.every(
    (domain) => scopeSupportsDomain(scope, domain) && countryIdsForSupportedScope(scope, domain).length > 0,
  );
}
