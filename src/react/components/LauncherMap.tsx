import { getMapContinentConfigForScope } from '../../data/map-scopes.js';
import type { MapCountryGeometry, MapRegionAsset } from '../../domain/map-models.js';
import type { LearningDomain } from '../../domain/models.js';
import { useAtlasActions } from '../actions.js';

function Geometry({ geometry }: { geometry: MapCountryGeometry }) {
  return <>
    {geometry.path ? <path className="launcher-map-country__shape" d={geometry.path} /> : null}
    {geometry.locator ? <>
      <circle className="launcher-map-country__locator" cx={geometry.locator.cx} cy={geometry.locator.cy} r={geometry.locator.r} />
      <circle className="launcher-map-country__hit" cx={geometry.locator.cx} cy={geometry.locator.cy} r={Math.max(geometry.locator.r, 18)} />
    </> : null}
    {geometry.callout ? <>
      <line className="launcher-map-country__callout-line" x1={geometry.callout.anchor.cx} y1={geometry.callout.anchor.cy} x2={geometry.callout.target.cx} y2={geometry.callout.target.cy} />
      <circle className="launcher-map-country__locator" cx={geometry.callout.target.cx} cy={geometry.callout.target.cy} r={geometry.callout.target.r} />
      <circle className="launcher-map-country__hit" cx={geometry.callout.target.cx} cy={geometry.callout.target.cy} r={Math.max(geometry.callout.target.r, 18)} />
    </> : null}
  </>;
}

export function LauncherMap({ asset, domain, selectedRegionId }: {
  asset: MapRegionAsset;
  domain: LearningDomain;
  selectedRegionId?: string;
}) {
  const actions = useAtlasActions();
  const continent = asset.scope.id ? getMapContinentConfigForScope(asset.scope.id) : undefined;
  const regions = continent?.regions ?? [];
  const geometryById = new Map(
    [...asset.countries, ...(asset.contextCountries ?? [])].map((geometry) => [geometry.countryId, geometry]),
  );

  return (
    <div className="launcher-map">
      <svg className="launcher-map__svg" viewBox={asset.viewBox} preserveAspectRatio="xMidYMid meet" role="group" aria-label={`${continent?.scope.label ?? asset.scope.label} region selector`}>
        <rect className="launcher-map__ocean" x="0" y="0" width="100%" height="100%" />
        {asset.water?.oceanPath ? <g className="launcher-map-water launcher-map-water--ocean"><path d={asset.water.oceanPath} /></g> : null}
        <g className="launcher-map-water launcher-map-water--lakes">
          {(asset.water?.lakes ?? []).map((item, index) => <path d={item.path} key={index} />)}
        </g>
        {(asset.contextPaths ?? []).map((path, index) => <path className="launcher-map-context" d={path} key={index} />)}
        {regions.map((config) => {
          const regionId = config.scope.id ?? '';
          const geometries = config.countryIds
            .map((countryId) => geometryById.get(countryId))
            .filter((geometry): geometry is MapCountryGeometry => Boolean(geometry));
          const selected = regionId === selectedRegionId;
          return (
            <g
              className={`launcher-map-region${selected ? ' launcher-map-region--selected' : ''}`}
              data-domain={domain}
              data-id={regionId}
              role="button"
              tabIndex={0}
              aria-label={`Select ${config.scope.label}`}
              aria-pressed={selected}
              onClick={() => actions.selectRegion(domain, regionId, 'map')}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                actions.selectRegion(domain, regionId, 'map');
              }}
              key={regionId}
            >
              {geometries.map((geometry) => <Geometry geometry={geometry} key={geometry.countryId} />)}
            </g>
          );
        })}
        <g className="launcher-map-boundaries">
          {(asset.coastlinePaths ?? []).map((path, index) => <path className="launcher-map-coastline" d={path} key={`coast-${index}`} />)}
          {(asset.sharedBoundaryPaths ?? []).map((path, index) => <path className="launcher-map-boundary" d={path} key={`boundary-${index}`} />)}
        </g>
      </svg>
      <div className="launcher-map__labels" aria-hidden="true">
        {regions.map((config) => {
          const regionId = config.scope.id ?? '';
          if (!config.launcherLabel) return null;
          return <span
            className={`launcher-map__label${regionId === selectedRegionId ? ' launcher-map__label--selected' : ''}`}
            data-id={regionId}
            style={{ left: `${config.launcherLabel.left}%`, top: `${config.launcherLabel.top}%` }}
            key={regionId}
          >{config.scope.label}</span>;
        })}
      </div>
    </div>
  );
}
