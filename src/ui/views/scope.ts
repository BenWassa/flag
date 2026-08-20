import { CONTINENTS, REGIONS } from '../../data/continents.js';
import { COUNTRIES } from '../../data/countries.js';
import type { ProgressState, StudyScope } from '../../domain/models.js';
import { getScopeStats } from '../../domain/progress.js';
import { renderLauncher } from './launcher.js';

function continentFor(scope: StudyScope): StudyScope | null {
  if (scope.kind === 'continent') return scope;
  const region = REGIONS.find((item) => item.id === scope.id);
  const continent = region ? CONTINENTS.find((item) => item.id === region.continentId) : undefined;
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
  const regions = REGIONS
    .filter((region) => region.continentId === continentScope.id)
    .map((region) => {
      const regionScope: StudyScope = { kind: 'region', id: region.id, label: region.name };
      return { scope: regionScope, stats: getScopeStats(COUNTRIES, progress, regionScope) };
    });

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
