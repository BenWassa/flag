import { getMapContinentConfigForScope } from '../../data/map-scopes.js';
import type { MapRegionAsset } from '../../domain/map-models.js';
import type { LearningDomain } from '../../domain/models.js';
import { CONTINENT_PATHS } from './continent-icons.js';
import { escapeHtml } from '../format.js';

export function renderLauncherMap(asset: MapRegionAsset, domain: LearningDomain, selectedRegionId?: string): string {
  const continent = asset.scope.id ? getMapContinentConfigForScope(asset.scope.id) : undefined;
  const regions = continent?.regions ?? [];
  const continentId = continent?.continentId ?? '';
  const path = CONTINENT_PATHS[continentId] ?? '';

  return `
    <div class="launcher-map" role="group" aria-label="${escapeHtml(continent?.scope.label ?? asset.scope.label)} region selector">
      <svg class="launcher-map__svg" data-continent="${escapeHtml(continentId)}" viewBox="0 0 48 48" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
        ${path ? `<path class="launcher-map__silhouette" d="${path}" />` : ''}
      </svg>
      <div class="launcher-map__labels">
        ${regions.map((config) => {
          const regionId = config.scope.id ?? '';
          const label = config.launcherLabel;
          if (!label) return '';
          const selected = regionId === selectedRegionId;
          return `<button type="button" class="launcher-map__label${selected ? ' launcher-map__label--selected' : ''}" data-action="select-region" data-domain="${domain}" data-id="${escapeHtml(regionId)}" aria-label="Select ${escapeHtml(config.scope.label)}" aria-pressed="${selected}" style="left:${label.left}%;top:${label.top}%">${escapeHtml(config.scope.label)}</button>`;
        }).join('')}
      </div>
    </div>
  `;
}
