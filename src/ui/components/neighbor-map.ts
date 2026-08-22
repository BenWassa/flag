import type { MapRegionAsset } from '../../domain/map-models.js';
import type { NeighborMapCountry, NeighborMapModel } from '../../domain/neighbor-map.js';
import { escapeHtml } from '../format.js';

function renderContext(asset: MapRegionAsset, model: NeighborMapModel): string {
  return `
    <g class="neighbor-map-context" aria-hidden="true">
      ${(asset.contextPaths ?? []).map((path) => `<path class="neighbor-map-context-country" d="${escapeHtml(path)}" />`).join('')}
      ${model.contextCountries.map((item) => `<path class="neighbor-map-context-country" d="${escapeHtml(item.path)}" />`).join('')}
    </g>
  `;
}

function renderWater(asset: MapRegionAsset): string {
  return `
    <g class="map-water map-water--lakes" aria-hidden="true">
      ${(asset.water?.lakes ?? []).map((item) => `<path data-water-name="${escapeHtml(item.name)}" d="${escapeHtml(item.path)}" />`).join('')}
    </g>
  `;
}

function renderBoundaries(asset: MapRegionAsset): string {
  return `
    <g class="map-boundaries" aria-hidden="true">
      ${(asset.coastlinePaths ?? []).map((path) => `<path class="map-coastline" d="${escapeHtml(path)}" />`).join('')}
      ${(asset.sharedBoundaryPaths ?? []).map((path) => `<path class="map-shared-boundary" d="${escapeHtml(path)}" />`).join('')}
    </g>
  `;
}

function ariaLabel(country: NeighborMapCountry): string {
  if (country.state === 'unresolved') return 'Unresolved neighbouring country';
  if (country.state === 'target') return `${country.name ?? 'Target'}, target country`;
  if (country.state === 'revealed') return `${country.name ?? 'Country'}, missed neighbour revealed`;
  return `${country.name ?? 'Country'}, neighbour found`;
}

function renderCountry(country: NeighborMapCountry): string {
  return `
    <g class="neighbor-map-country neighbor-map-country--${country.state}" role="img" aria-label="${escapeHtml(ariaLabel(country))}">
      <path class="neighbor-map-country__shape" d="${escapeHtml(country.path)}" />
    </g>
  `;
}

export function renderNeighborPuzzleLayer(model: NeighborMapModel): string {
  return model.puzzleCountries.map(renderCountry).join('');
}

function renderLabel(country: NeighborMapCountry): string {
  const label = country.label;
  const leader = label.placement === 'callout' && label.anchorX !== undefined && label.anchorY !== undefined
    ? `<line class="neighbor-map-label__leader neighbor-map-label__leader--${country.state}" x1="${label.anchorX}" y1="${label.anchorY}" x2="${label.x}" y2="${label.y}" aria-hidden="true" />`
    : '';
  return `
    <g class="neighbor-map-label neighbor-map-label--${country.state}" aria-hidden="true">
      ${leader}
      <text x="${label.x}" y="${label.y}" font-size="${label.fontSize}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(label.text)}</text>
    </g>
  `;
}

export function renderNeighborLabelLayer(model: NeighborMapModel): string {
  return model.puzzleCountries.map(renderLabel).join('');
}

export function neighborMapSummary(model: NeighborMapModel): string {
  const parts = [
    `Target: ${model.targetName}.`,
    `${model.foundNames.length} neighbours found.`,
    `${model.unresolvedCount} unresolved neighbouring ${model.unresolvedCount === 1 ? 'country' : 'countries'}.`,
  ];
  if (model.foundNames.length) parts.push(`Found: ${model.foundNames.join(', ')}.`);
  if (model.revealedNames.length) parts.push(`Missed and revealed: ${model.revealedNames.join(', ')}.`);
  return parts.join(' ');
}

export function renderNeighborMap(
  asset: MapRegionAsset,
  model: NeighborMapModel,
  mapKey: string,
  stateFingerprint: string,
): string {
  const focus = model.focus;
  const focusData = `${focus.x},${focus.y},${focus.width},${focus.height}`;
  const safeKey = mapKey.replace(/[^a-z0-9_-]/gi, '-');
  const titleId = `neighbor-map-title-${safeKey}`;
  const summaryId = `neighbor-map-summary-${safeKey}`;

  return `
    <div class="neighbor-map-shell" data-neighbor-map-key="${escapeHtml(mapKey)}" data-neighbor-map-state="${escapeHtml(stateFingerprint)}">
      <p id="${summaryId}" class="visually-hidden" data-neighbor-map-summary>${escapeHtml(neighborMapSummary(model))}</p>
      <div class="map-stage neighbor-map-stage" aria-describedby="${summaryId}">
        <div class="map-stage__frame">
          <div
            class="map-stage__scroll"
            data-map-viewport
            data-map-session="${escapeHtml(mapKey)}"
            data-map-viewbox="${escapeHtml(asset.viewBox)}"
            data-map-focus="${focusData}"
            data-map-max-zoom="5.5"
          >
            <svg class="map-svg neighbor-map-svg" viewBox="${escapeHtml(asset.viewBox)}" role="img" aria-labelledby="${titleId}" aria-describedby="${summaryId}" preserveAspectRatio="xMidYMid meet">
              <title id="${titleId}">Map around ${escapeHtml(model.targetName)}</title>
              <rect class="map-ocean" x="0" y="0" width="100%" height="100%" aria-hidden="true" />
              ${renderContext(asset, model)}
              <g class="neighbor-map-puzzle-layer">
                ${renderNeighborPuzzleLayer(model)}
              </g>
              ${renderWater(asset)}
              ${renderBoundaries(asset)}
              <g class="neighbor-map-label-layer">
                ${renderNeighborLabelLayer(model)}
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function patchNeighborMapShell(
  shell: HTMLElement,
  model: NeighborMapModel,
  stateFingerprint: string,
): void {
  if (shell.dataset.neighborMapState === stateFingerprint) return;
  const puzzle = shell.querySelector<SVGGElement>('.neighbor-map-puzzle-layer');
  const labels = shell.querySelector<SVGGElement>('.neighbor-map-label-layer');
  const summary = shell.querySelector<HTMLElement>('[data-neighbor-map-summary]');
  if (!puzzle || !labels || !summary) throw new Error('Neighbor map shell is missing a patchable layer.');
  puzzle.innerHTML = renderNeighborPuzzleLayer(model);
  labels.innerHTML = renderNeighborLabelLayer(model);
  summary.textContent = neighborMapSummary(model);
  shell.dataset.neighborMapState = stateFingerprint;
}
