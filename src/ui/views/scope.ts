import { CONTINENTS } from '../../data/continents.js';
import { COUNTRIES } from '../../data/countries.js';
import {
  parentContinentIdForLearningScope,
  regionLearningScopes,
} from '../../data/learning-scopes.js';
import type { ProgressState, StudyScope } from '../../domain/models.js';
import { getScopeStats } from '../../domain/progress.js';
import { renderLauncher } from './launcher.js';

function continentFor(scope: StudyScope): StudyScope | null {
  if (scope.kind === 'continent') return scope;
  const continentId = parentContinentIdForLearningScope(scope);
  const continent = CONTINENTS.find((item) => item.id === continentId);
  return continent
    ? { kind: 'continent', id: continent.id, label: continent.name }
    : null;
}

export function renderScope(
  progress: ProgressState,
  scope: StudyScope,
  persisting = true,
): string {
  const continentScope = continentFor(scope);
  if (!continentScope?.id) {
    return '<main class="page"><h1 tabindex="-1" data-autofocus>Flag scope unavailable</h1><button class="button" data-action="launcher-parent">Back</button></main>';
  }

  const selectedRegion = scope.kind === 'region' ? scope : undefined;
  const regions = regionLearningScopes(continentScope.id as (typeof CONTINENTS)[number]['id'])
    .map((definition) => ({
      scope: definition.scope,
      stats: getScopeStats(COUNTRIES, progress, definition.scope),
    }));

  return renderLauncher({
    domain: 'flags',
    continentScope,
    selectedRegion,
    stats: getScopeStats(COUNTRIES, progress, selectedRegion ?? continentScope),
    regions,
    unitLabel: 'flags',
    persisting,
    storageNotice: "This browser is blocking storage, so today's flag progress will be lost when you close the tab.",
    showMap: false,
  });
}
