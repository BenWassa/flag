import type { MapRegionAsset, MapSession, MapTargetState } from '../../domain/map-models.js';

function resolutionClass(state: MapTargetState | undefined, showFeedback: boolean): string {
  if (!showFeedback || !state?.resolved || !state.resolution) return '';
  switch (state.resolution) {
    case 'first-try': return ' map-country--first';
    case 'one-miss': return ' map-country--one-miss';
    case 'two-miss': return ' map-country--two-miss';
    case 'revealed':
    case 'incorrect': return ' map-country--revealed';
  }
}

export interface RenderMapOptions {
  interactive?: boolean;
  showFeedback?: boolean;
  lastWrongCountryId?: string | null;
  labelledBy?: string;
}

export function renderMapSvg(
  asset: MapRegionAsset,
  session: MapSession,
  options: RenderMapOptions = {},
): string {
  const interactive = options.interactive ?? true;
  const showFeedback = options.showFeedback ?? session.mode === 'learn';
  const wrongId = options.lastWrongCountryId ?? null;
  const labelledBy = options.labelledBy ?? 'map-prompt-heading';

  return `
    <div class="map-stage__scroll">
      <svg class="map-svg" viewBox="${asset.viewBox}" role="group" aria-labelledby="${labelledBy}">
        <rect class="map-ocean" x="0" y="0" width="100%" height="100%" />
        ${asset.countries.map((geometry) => {
          const state = session.targets[geometry.countryId];
          const classes = `map-country${resolutionClass(state, showFeedback)}${wrongId === geometry.countryId ? ' map-country--wrong-pulse' : ''}`;
          const action = interactive ? ` data-action="map-answer" data-id="${geometry.countryId}" tabindex="0" role="button" aria-label="Selectable country area"` : '';
          return `
            <g class="${classes}"${action}>
              ${geometry.path ? `<path class="map-country__shape" d="${geometry.path}" />` : ''}
              ${geometry.locator ? `
                <circle class="map-country__locator-halo" cx="${geometry.locator.cx}" cy="${geometry.locator.cy}" r="${geometry.locator.r + 5}" />
                <circle class="map-country__locator" cx="${geometry.locator.cx}" cy="${geometry.locator.cy}" r="${geometry.locator.r}" />
              ` : ''}
            </g>
          `;
        }).join('')}
        ${(() => {
          if (!interactive) return '';
          const targetId = session.countryIds[session.currentIndex];
          const assist = asset.countries.find((item) => item.countryId === targetId)?.hitAssist;
          if (!targetId || !assist) return '';
          const usableRadius = Math.max(assist.r, 26);
          return `<circle class="map-current-target-hit" cx="${assist.cx}" cy="${assist.cy}" r="${usableRadius}" data-action="map-answer" data-id="${targetId}" aria-hidden="true" />`;
        })()}
      </svg>
    </div>
  `;
}
