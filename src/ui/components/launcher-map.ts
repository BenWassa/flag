import { COUNTRY_BY_ID } from '../../data/countries.js';
import { AFRICA_MAP_REGION_CONFIGS } from '../../data/map-scopes.js';
import type { MapCountryGeometry, MapRegionAsset } from '../../domain/map-models.js';
import type { LearningDomain } from '../../domain/models.js';
import { escapeHtml } from '../format.js';

const REGION_LABELS: Readonly<Record<string, { left: number; top: number; text: string }>> = {
  'north-africa': { left: 49, top: 18, text: 'North Africa' },
  'west-africa': { left: 23, top: 35, text: 'West Africa' },
  'central-africa': { left: 45, top: 58, text: 'Central Africa' },
  'east-africa': { left: 77, top: 46, text: 'East Africa' },
  'southern-africa': { left: 55, top: 82, text: 'Southern Africa' },
};

function renderGeometry(geometry: MapCountryGeometry): string {
  return `
    ${geometry.path ? `<path class="launcher-map-country__shape" d="${geometry.path}" />` : ''}
    ${geometry.locator ? `
      <circle class="launcher-map-country__locator" cx="${geometry.locator.cx}" cy="${geometry.locator.cy}" r="${geometry.locator.r}" />
      <circle class="launcher-map-country__hit" cx="${geometry.locator.cx}" cy="${geometry.locator.cy}" r="${Math.max(geometry.locator.r, 18)}" />
    ` : ''}
    ${geometry.callout ? `
      <line class="launcher-map-country__callout-line" x1="${geometry.callout.anchor.cx}" y1="${geometry.callout.anchor.cy}" x2="${geometry.callout.target.cx}" y2="${geometry.callout.target.cy}" />
      <circle class="launcher-map-country__locator" cx="${geometry.callout.target.cx}" cy="${geometry.callout.target.cy}" r="${geometry.callout.target.r}" />
      <circle class="launcher-map-country__hit" cx="${geometry.callout.target.cx}" cy="${geometry.callout.target.cy}" r="${Math.max(geometry.callout.target.r, 18)}" />
    ` : ''}
  `;
}

function renderWater(asset: MapRegionAsset): string {
  return `
    ${asset.water?.oceanPath ? `<g class="launcher-map-water launcher-map-water--ocean"><path d="${asset.water.oceanPath}" /></g>` : ''}
    <g class="launcher-map-water launcher-map-water--lakes">
      ${(asset.water?.lakes ?? []).map((item) => `<path d="${item.path}" />`).join('')}
    </g>
  `;
}

function renderBoundaries(asset: MapRegionAsset): string {
  return `
    <g class="launcher-map-boundaries">
      ${(asset.coastlinePaths ?? []).map((path) => `<path class="launcher-map-coastline" d="${path}" />`).join('')}
      ${(asset.sharedBoundaryPaths ?? []).map((path) => `<path class="launcher-map-boundary" d="${path}" />`).join('')}
    </g>
  `;
}

export function renderLauncherMap(
  asset: MapRegionAsset,
  domain: LearningDomain,
  selectedRegionId?: string,
): string {
  return `
    <div class="launcher-map">
      <svg
        class="launcher-map__svg"
        viewBox="${escapeHtml(asset.viewBox)}"
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label="Africa region selector"
      >
        <rect class="launcher-map__ocean" x="0" y="0" width="100%" height="100%" />
        ${renderWater(asset)}
        ${(asset.contextPaths ?? []).map((path) => `<path class="launcher-map-context" d="${path}" />`).join('')}
        ${AFRICA_MAP_REGION_CONFIGS.map((config) => {
          const regionId = config.scope.id ?? '';
          const countryIds = new Set(config.countryIds);
          const geometries = asset.countries.filter((geometry) => {
            const country = COUNTRY_BY_ID.get(geometry.countryId);
            return country?.regionId === regionId || countryIds.has(geometry.countryId);
          });
          const selected = regionId === selectedRegionId;
          return `
            <g
              class="launcher-map-region${selected ? ' launcher-map-region--selected' : ''}"
              data-action="select-region"
              data-domain="${domain}"
              data-id="${escapeHtml(regionId)}"
              role="button"
              tabindex="0"
              aria-label="Select ${escapeHtml(config.scope.label)}"
              aria-pressed="${selected}"
            >
              ${geometries.map(renderGeometry).join('')}
            </g>
          `;
        }).join('')}
        ${renderBoundaries(asset)}
      </svg>
      <div class="launcher-map__labels" aria-hidden="true">
        ${AFRICA_MAP_REGION_CONFIGS.map((config) => {
          const regionId = config.scope.id ?? '';
          const label = REGION_LABELS[regionId];
          if (!label) return '';
          const selected = regionId === selectedRegionId;
          return `<span
            class="launcher-map__label${selected ? ' launcher-map__label--selected' : ''}"
            data-id="${escapeHtml(regionId)}"
            style="left:${label.left}%;top:${label.top}%"
          >${escapeHtml(label.text)}</span>`;
        }).join('')}
      </div>
    </div>
  `;
}
