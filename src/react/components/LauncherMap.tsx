import { getMapContinentConfigForScope } from '../../data/map-scopes.js';
import type { MapRegionAsset } from '../../domain/map-models.js';
import type { LearningDomain } from '../../domain/models.js';
import { CONTINENT_PATHS } from '../../ui/components/continent-icons.js';
import { useAtlasActions } from '../actions.js';

export function LauncherMap({ asset, domain, selectedRegionId }: {
  asset: MapRegionAsset;
  domain: LearningDomain;
  selectedRegionId?: string;
}) {
  const actions = useAtlasActions();
  const continent = asset.scope.id ? getMapContinentConfigForScope(asset.scope.id) : undefined;
  const regions = continent?.regions ?? [];
  const continentId = continent?.continentId ?? '';
  const path = CONTINENT_PATHS[continentId];

  return (
    <div className="launcher-map" role="group" aria-label={`${continent?.scope.label ?? asset.scope.label} region selector`}>
      <svg className="launcher-map__svg" data-continent={continentId} viewBox="0 0 48 48" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
        {path ? <path className="launcher-map__silhouette" d={path} /> : null}
      </svg>
      <div className="launcher-map__labels">
        {regions.map((config) => {
          const regionId = config.scope.id ?? '';
          if (!config.launcherLabel) return null;
          const selected = regionId === selectedRegionId;
          return <button
            type="button"
            className={`launcher-map__label${selected ? ' launcher-map__label--selected' : ''}`}
            data-id={regionId}
            aria-pressed={selected}
            aria-label={`Select ${config.scope.label}`}
            style={{ left: `${config.launcherLabel.left}%`, top: `${config.launcherLabel.top}%` }}
            onClick={() => actions.selectRegion(domain, regionId, 'map')}
            key={regionId}
          >{config.scope.label}</button>;
        })}
      </div>
    </div>
  );
}
