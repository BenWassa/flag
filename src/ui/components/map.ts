import type {
  MapCountryGeometry,
  MapRegionAsset,
  MapSession,
  MapTargetState,
} from '../../domain/map-models.js';
import { icon } from './icons.js';

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

function geometryExclusionParts(geometry: MapCountryGeometry): string[] {
  return [
    geometry.path ?? '',
    geometry.locator ? circlePath(geometry.locator.cx, geometry.locator.cy, geometry.locator.r + 5) : '',
    geometry.callout ? circlePath(geometry.callout.target.cx, geometry.callout.target.cy, geometry.callout.target.r + 5) : '',
  ];
}

function assistedHitTarget(asset: MapRegionAsset, session: MapSession, interactive: boolean): string {
  if (!interactive) return '';
  const targetId = session.countryIds[session.currentIndex];
  const targetState = targetId ? session.targets[targetId] : undefined;
  const assist = asset.countries.find((item) => item.countryId === targetId)?.hitAssist;
  if (!targetId || targetState?.resolved || !assist) return '';

  const usableRadius = Math.max(assist.r, 22);
  const exclusionPaths = [
    ...(asset.contextPaths ?? []),
    ...(asset.contextCountries ?? []).flatMap(geometryExclusionParts),
    ...asset.countries
      .filter((item) => item.countryId !== targetId)
      .flatMap(geometryExclusionParts),
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
      data-map-hit
      data-map-hit-min="${assist.r}"
      clip-path="url(#map-target-hit-clip)"
      data-action="map-answer"
      data-id="${targetId}"
      aria-hidden="true"
    />
  `;
}

function renderContextCountry(geometry: MapCountryGeometry): string {
  return `
    ${geometry.path ? `<path class="map-context-country" d="${geometry.path}" />` : ''}
    ${geometry.locator ? `<circle class="map-context-locator" cx="${geometry.locator.cx}" cy="${geometry.locator.cy}" r="${geometry.locator.r}" />` : ''}
  `;
}

function renderOcean(asset: MapRegionAsset): string {
  const path = asset.water?.oceanPath;
  return path ? `<g class="map-water map-water--ocean" aria-hidden="true"><path d="${path}" /></g>` : '';
}

function renderInlandWater(asset: MapRegionAsset): string {
  const water = asset.water;
  return `
    <g class="map-water map-water--lakes" aria-hidden="true">
      ${(water?.lakes ?? []).map((item) => `<path data-water-name="${item.name}" d="${item.path}" />`).join('')}
    </g>
  `;
}

function renderBoundaries(asset: MapRegionAsset): string {
  return `
    <g class="map-boundaries" aria-hidden="true">
      ${(asset.coastlinePaths ?? []).map((path) => `<path class="map-coastline" d="${path}" />`).join('')}
      ${(asset.sharedBoundaryPaths ?? []).map((path) => `<path class="map-shared-boundary" d="${path}" />`).join('')}
    </g>
  `;
}

function renderViewportControls(asset: MapRegionAsset): string {
  return `
    <div class="map-viewport-controls" aria-label="Map view controls">
      <button class="map-viewport-control" type="button" data-map-command="zoom-in" aria-label="Zoom in">${icon('zoom-in')}</button>
      <button class="map-viewport-control" type="button" data-map-command="zoom-out" aria-label="Zoom out">${icon('zoom-out')}</button>
      ${asset.scope.kind === 'region' ? `<button class="map-viewport-control map-viewport-control--label" type="button" data-map-command="fit-region" aria-label="Fit ${asset.scope.label}">Region</button>` : ''}
      <button class="map-viewport-control map-viewport-control--label" type="button" data-map-command="fit-continent" aria-label="Fit all of Africa">Africa</button>
    </div>
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
  const currentTargetResolved = currentTargetId ? Boolean(session.targets[currentTargetId]?.resolved) : false;
  const lastAttempt = session.attempts.at(-1);
  const recordedCountryId = interactive
    && !showFeedback
    && lastAttempt
    && (currentTargetResolved || lastAttempt.selectedCountryId !== currentTargetId)
      ? lastAttempt.selectedCountryId
      : null;
  const focus = asset.initialFocus;
  const focusData = focus ? `${focus.x},${focus.y},${focus.width},${focus.height}` : '';
  const canvasWidth = Number(asset.viewBox.trim().split(/\s+/)[2]) || 760;
  const hasContext = (asset.contextPaths?.length ?? 0) > 0 || (asset.contextCountries?.length ?? 0) > 0;

  return `
    <div class="map-stage__frame">
      <div
        class="map-stage__scroll"
        data-map-viewport
        data-map-session="${session.id}"
        data-map-viewbox="${asset.viewBox}"
        data-map-max-zoom="5.5"
        ${focus ? `data-map-focus="${focusData}"` : ''}
      >
        <svg class="map-svg" style="--map-canvas-width: ${canvasWidth}px" viewBox="${asset.viewBox}" role="group" aria-labelledby="${labelledBy}" preserveAspectRatio="none">
          <rect class="map-ocean" x="0" y="0" width="100%" height="100%" />
          ${renderOcean(asset)}
          ${hasContext ? `
            <g class="map-context" aria-hidden="true">
              ${(asset.contextPaths ?? []).map((path) => `<path class="map-context-country" d="${path}" />`).join('')}
              ${(asset.contextCountries ?? []).map(renderContextCountry).join('')}
            </g>
          ` : ''}
          <g class="map-active-countries">
            ${asset.countries.map((geometry) => {
              const state = session.targets[geometry.countryId];
              const currentCorrect = interactive
                && showFeedback
                && geometry.countryId === currentTargetId
                && state?.resolved
                && state.resolution === 'first-try';
              const recorded = geometry.countryId === recordedCountryId;
              const classes = `map-country${resolutionClass(state, showFeedback)}${currentCorrect ? ' map-country--current-correct' : ''}${recorded ? ' map-country--recorded' : ''}${wrongId === geometry.countryId ? ' map-country--wrong-pulse' : ''}`;
              const selectable = interactive && !state?.resolved;
              const action = selectable ? ` data-action="map-answer" data-id="${geometry.countryId}" tabindex="0" role="button" aria-label="Selectable country area"` : '';
              return `
                <g class="${classes}"${action}>
                  ${geometry.path ? `<path class="map-country__shape" d="${geometry.path}" />` : ''}
                  ${geometry.locator ? `
                    <circle class="map-country__locator" cx="${geometry.locator.cx}" cy="${geometry.locator.cy}" r="${geometry.locator.r}" />
                    ${selectable ? `<circle class="map-country__locator-hit" cx="${geometry.locator.cx}" cy="${geometry.locator.cy}" r="${Math.max(geometry.locator.r, 22)}" data-map-hit data-map-hit-min="${geometry.locator.r}" />` : ''}
                  ` : ''}
                  ${geometry.callout ? `
                    <line class="map-country__callout-line" x1="${geometry.callout.anchor.cx}" y1="${geometry.callout.anchor.cy}" x2="${geometry.callout.target.cx}" y2="${geometry.callout.target.cy}" />
                    <circle class="map-country__callout-target" cx="${geometry.callout.target.cx}" cy="${geometry.callout.target.cy}" r="${geometry.callout.target.r}" />
                    ${selectable ? `<circle class="map-country__callout-hit" cx="${geometry.callout.target.cx}" cy="${geometry.callout.target.cy}" r="${Math.max(geometry.callout.target.r, 22)}" data-map-hit data-map-hit-min="${geometry.callout.target.r}" />` : ''}
                  ` : ''}
                </g>
              `;
            }).join('')}
          </g>
          ${renderInlandWater(asset)}
          ${renderBoundaries(asset)}
          ${assistedHitTarget(asset, session, interactive)}
        </svg>
      </div>
      ${interactive ? renderViewportControls(asset) : ''}
    </div>
  `;
}
