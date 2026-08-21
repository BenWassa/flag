import { CONTINENTS, REGIONS } from './continents.js';
import { COUNTRIES } from './countries.js';
import type { ContinentId, StudyScope } from '../domain/models.js';

export interface LearningScopeDefinition {
  scope: StudyScope;
  /** Parent asset/navigation continent. Cross-continent learning scopes may still name one parent. */
  parentContinentId?: ContinentId;
  countryIds: readonly string[];
}

function idsForContinent(continentId: ContinentId): string[] {
  return COUNTRIES.filter((country) => country.continentId === continentId).map((country) => country.id);
}

function idsForRegion(regionId: string): string[] {
  return COUNTRIES.filter((country) => country.regionId === regionId).map((country) => country.id);
}

const CANONICAL_CONTINENT_SCOPES: readonly LearningScopeDefinition[] = CONTINENTS.map((continent) => ({
  scope: { kind: 'continent', id: continent.id, label: continent.name },
  parentContinentId: continent.id,
  countryIds: idsForContinent(continent.id),
}));

const CANONICAL_REGION_SCOPES: readonly LearningScopeDefinition[] = REGIONS.map((region) => ({
  scope: { kind: 'region', id: region.id, label: region.name },
  parentContinentId: region.continentId,
  countryIds: idsForRegion(region.id),
}));

/**
 * Extra learner-facing scopes belong here when they intentionally overlap the
 * canonical continent/region taxonomy (for example Issue #28 Middle East).
 * Country identity and progress stay attached to the canonical ISO3 record.
 */
const OVERLAPPING_LEARNING_SCOPES: readonly LearningScopeDefinition[] = [];

export const LEARNING_SCOPE_DEFINITIONS: readonly LearningScopeDefinition[] = Object.freeze([
  ...CANONICAL_CONTINENT_SCOPES,
  ...CANONICAL_REGION_SCOPES,
  ...OVERLAPPING_LEARNING_SCOPES,
]);

const SCOPE_BY_ID = new Map(
  LEARNING_SCOPE_DEFINITIONS
    .filter((definition) => definition.scope.id)
    .map((definition) => [definition.scope.id as string, definition]),
);

export function getLearningScopeDefinition(scopeId: string): LearningScopeDefinition | undefined {
  return SCOPE_BY_ID.get(scopeId);
}

export function countryIdsForLearningScope(scope: StudyScope): readonly string[] {
  if (scope.kind === 'world') return COUNTRIES.map((country) => country.id);
  if (!scope.id) return [];
  return getLearningScopeDefinition(scope.id)?.countryIds ?? [];
}

export function parentContinentIdForLearningScope(scope: StudyScope): ContinentId | undefined {
  if (scope.kind === 'continent') return scope.id as ContinentId | undefined;
  if (!scope.id) return undefined;
  return getLearningScopeDefinition(scope.id)?.parentContinentId;
}

export function continentLearningScope(continentId: ContinentId): StudyScope | undefined {
  return getLearningScopeDefinition(continentId)?.scope;
}

export function regionLearningScopes(continentId: ContinentId): readonly LearningScopeDefinition[] {
  return LEARNING_SCOPE_DEFINITIONS.filter(
    (definition) => definition.scope.kind === 'region' && definition.parentContinentId === continentId,
  );
}
