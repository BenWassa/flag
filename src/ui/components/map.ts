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

function circlePath(cx: number, cy: number, radius: number): string {
  return `M${cx - radius},${cy}a${radius},${radius} 0 1,0 ${radius * 2},0a${radius},${radius} 0 1,0 -${radius * 2},0Z`;
}

function assistedHitTarget(asset: MapRegionAsset, session: MapSession, interactive: boolean): string {
  if (!interactive) return '';
  const targetId = session.countryIds[session.currentIndex];
  const assist = asset.countries.find((item) => item.countryId === targetId)?.hitAssist;
  if (!targetId || !assist) return '';

  // Aim for roughly a 44px effective diameter at the pilot's normal mobile
  // scale. Expansion is clipped around all real geography, so assistance can
  // use ocean/neutral gaps but can never make another country count as correct.
  const usableRadius = Math.max(assist.r, 22);
  const exclusionPaths = [
    ...(asset.contextPaths ?? []),
    ...asset.countries
      .filter((item) => item.countryId !== targetId)
      .flatMap((item) => [
        item.path ?? '',
        item.locator ? circlePath(item.locator.cx, item.locator.cy, item.locator.r + 5) : '',
      ]),
  ].filter(Boolean).join(' ');
  const clipPath = `${circlePath(assist.cx, assist.cy, usableRadius)} ${exclusionPaths}`;

  return `
    <defs>
      <clipPath id="map-target-hit-clip">
        <path d="${clipPath}" fill-rule="evenodd" clip-rule="evenodd" />
      </clipPath>
    </defs>
    <circle
      class="map-current-target-hit"
      cx="${assist.cx}"
      cy="${assist.cy}"
      r="${usableRadius}"
      clip-path="url(#map-target-hit-clip)"
      data-action="map-answer"
      data-id="${targetId}"
      aria-hidden="true"
    />
  `;
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
  const currentTargetId = session.countryIds[session.currentIndex] ?? null;
  const focus = asset.initialFocus;
  const focusData = focus ? `${focus.x},${focus.y},${focus.width},${focus.height}` : '';

  return `
    <div class="map-stage__scroll" data-map-viewport data-map-session="${session.id}" data-map-viewbox="${asset.viewBox}"${focus ? ` data-map-focus="${focusData}"` : ''}>
      <svg class="map-svg" viewBox="${asset.viewBox}" role="group" aria-labelledby="${labelledBy}">
        <rect class="map-ocean" x="0" y="0" width="100%" height="100%" />
        ${(asset.contextPaths ?? []).length ? `
          <g class="map-context" aria-hidden="true">
            ${(asset.contextPaths ?? []).map((path) => `<path class="map-context-country" d="${path}" />`).join('')}
          </g>
        ` : ''}
        ${asset.countries.map((geometry) => {
          const state = session.targets[geometry.countryId];
          const currentCorrect = showFeedback
            && geometry.countryId === currentTargetId
            && state?.resolved
            && state.resolution !== 'revealed'
            && state.resolution !== 'incorrect';
          const classes = `map-country${resolutionClass(state, showFeedback)}${currentCorrect ? ' map-country--current-correct' : ''}${wrongId === geometry.countryId ? ' map-country--wrong-pulse' : ''}`;
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
        ${assistedHitTarget(asset, session, interactive)}
      </svg>
    </div>
  `;
}
