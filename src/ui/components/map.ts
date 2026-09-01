import type {
  MapCountryGeometry,
  MapInset,
  MapRegionAsset,
  MapSession,
  MapTargetState,
} from '../../domain/map-models.js';
import { escapeHtml } from '../format.js';

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
  // The question-specific disc paints beneath every scoring country, so real
  // polygons own their land by normal SVG hit-testing (#117). Only non-scoring
  // context needs an exclusion clip here; copying every scoring polygon into a
  // compound even-odd clip both bloated the markup and let overlapping
  // exclusions cancel parity, which allowed Vanuatu's disc to re-open over the
  // Solomon Islands. Scoring precedence is now structural and independent of
  // country array order.
  const contextExclusions = [
    ...(asset.contextPaths ?? []),
    ...(asset.contextCountries ?? []).flatMap(geometryExclusionParts),
  ].filter(Boolean).join(' ');
  const clipPath = `${circlePath(assist.cx, assist.cy, usableRadius)} ${contextExclusions}`;

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

/**
 * The magnified window, outlined in place on the map.
 *
 * Without it a panel would be an unexplained box: this is what keeps the pattern
 * honest, because the learner can see the cluster is still exactly where it
 * always was, and the panel is only a closer look at it.
 */
function renderInsetSource(inset: MapInset): string {
  return `
    <rect
      class="map-inset-source"
      x="${inset.source.x}" y="${inset.source.y}"
      width="${inset.source.width}" height="${inset.source.height}"
      aria-hidden="true"
    />
  `;
}

/**
 * The panel itself. Fixed CSS pixel size, so its scale never moves with the
 * map's zoom — that is what lets every member reach a full 44 px touch surface.
 */
function renderInsetPanel(
  asset: MapRegionAsset,
  inset: MapInset,
  countryMarkup: (geometry: MapCountryGeometry, focusable: boolean) => string,
  isSelectable: (countryId: string) => boolean,
): string {
  const members = asset.countries.filter((item) => inset.countryIds.includes(item.countryId));
  const memberIds = new Set(inset.countryIds);
  const context = [
    ...asset.countries.filter((item) => !memberIds.has(item.countryId)),
    ...(asset.contextCountries ?? []),
  ];
  const viewBox = `${inset.source.x} ${inset.source.y} ${inset.source.width} ${inset.source.height}`;

  return `
    <div
      class="map-inset map-inset--${inset.anchor}"
      style="--map-inset-width: ${inset.size.width}px; --map-inset-height: ${inset.size.height}px"
      data-map-inset="${escapeHtml(inset.id)}"
    >
      <svg class="map-inset__svg" viewBox="${viewBox}" role="group" aria-label="${escapeHtml(inset.label)}, closer view">
        <rect class="map-inset__ground" x="${inset.source.x}" y="${inset.source.y}" width="${inset.source.width}" height="${inset.source.height}" />
        <g class="map-inset__context" aria-hidden="true">
          ${(asset.contextPaths ?? []).map((path) => `<path class="map-context-country" d="${path}" />`).join('')}
          ${context.map((item) => (item.path ? `<path class="map-context-country" d="${item.path}" />` : '')).join('')}
        </g>
        <g class="map-inset__boundaries" aria-hidden="true">
          ${(asset.coastlinePaths ?? []).map((path) => `<path class="map-coastline" d="${path}" />`).join('')}
          ${(asset.sharedBoundaryPaths ?? []).map((path) => `<path class="map-shared-boundary" d="${path}" />`).join('')}
        </g>
        <g class="map-inset__countries">${members.map((item) => countryMarkup(item, false)).join('')}</g>
        ${inset.marks.map((mark, index) => (isSelectable(mark.countryId) ? `
          <circle
            class="map-inset__hit"
            cx="${mark.cx}" cy="${mark.cy}" r="${inset.hitRadius}"
            data-action="map-answer" data-id="${mark.countryId}"
            tabindex="0" role="button" aria-label="Selectable inset area ${index + 1} of ${inset.marks.length} in ${escapeHtml(inset.label)} closer view"
          />
        ` : '')).join('')}
      </svg>
      <p class="map-inset__label" aria-hidden="true">${escapeHtml(inset.label)}</p>
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
  const currentPlayAttempt = interactive
    && session.mode === 'test'
    && currentTargetResolved
    && lastAttempt?.targetCountryId === currentTargetId
      ? lastAttempt
      : null;
  const focus = asset.initialFocus;
  const focusData = focus ? `${focus.x},${focus.y},${focus.width},${focus.height}` : '';
  const canvasWidth = Number(asset.viewBox.trim().split(/\s+/)[2]) || 760;
  const hasContext = (asset.contextPaths?.length ?? 0) > 0 || (asset.contextCountries?.length ?? 0) > 0;
  // A panel is the current question's answer surface, not standing chrome, so it
  // appears only while the target is one of its members.
  const activeInset = interactive && currentTargetId
    ? (asset.insets ?? []).find((inset) => inset.countryIds.includes(currentTargetId)) ?? null
    : null;
  const isSelectable = (_countryId: string): boolean =>
    interactive && !currentTargetResolved;

  // While a panel is open it owns the keyboard stop for its members, so a
  // learner tabs each country once. The true location stays tappable.
  const countryMarkup = (geometry: MapCountryGeometry, focusable: boolean, withAssistHits = true): string => {
    const state = session.targets[geometry.countryId];
    const learnCurrentCorrect = interactive
      && showFeedback
      && geometry.countryId === currentTargetId
      && state?.resolved
      && state.resolution === 'first-try';
    const playCorrectTarget = Boolean(currentPlayAttempt) && geometry.countryId === currentTargetId;
    const playWrongSelection = Boolean(currentPlayAttempt)
      && !currentPlayAttempt?.correct
      && geometry.countryId === currentPlayAttempt?.selectedCountryId;
    const strongCorrect = learnCurrentCorrect || playCorrectTarget;
    const learnWrong = wrongId === geometry.countryId;
    const playWrongClasses = playWrongSelection ? ' map-country--current-wrong map-country--wrong-pulse' : '';
    const classes = `map-country${resolutionClass(state, showFeedback)}${strongCorrect ? ' map-country--current-correct' : ''}${playWrongClasses}${learnWrong ? ' map-country--wrong-pulse' : ''}`;
    const selectable = interactive && !currentTargetResolved;
    const keyboard = focusable ? ' tabindex="0" role="button" aria-label="Selectable country area"' : '';
    const action = selectable ? ` data-action="map-answer" data-id="${geometry.countryId}"${keyboard}` : '';
    return `
      <g class="${classes}"${action}>
        ${geometry.path ? `<path class="map-country__shape" d="${geometry.path}" />` : ''}
        ${geometry.marker ? `<circle class="map-country__marker" cx="${geometry.marker.cx}" cy="${geometry.marker.cy}" r="${geometry.marker.r}" aria-hidden="true" />` : ''}
        ${geometry.locator ? `
          <circle class="map-country__locator" cx="${geometry.locator.cx}" cy="${geometry.locator.cy}" r="${geometry.locator.r}" />
          ${selectable && withAssistHits ? `<circle class="map-country__locator-hit" cx="${geometry.locator.cx}" cy="${geometry.locator.cy}" r="${Math.max(geometry.locator.r, 22)}" data-map-hit data-map-hit-min="${geometry.locator.r}" />` : ''}
        ` : ''}
        ${geometry.callout ? `
          <line class="map-country__callout-line" x1="${geometry.callout.anchor.cx}" y1="${geometry.callout.anchor.cy}" x2="${geometry.callout.target.cx}" y2="${geometry.callout.target.cy}" />
          <circle class="map-country__callout-target" cx="${geometry.callout.target.cx}" cy="${geometry.callout.target.cy}" r="${geometry.callout.target.r}" />
          ${selectable && withAssistHits ? `<circle class="map-country__callout-hit" cx="${geometry.callout.target.cx}" cy="${geometry.callout.target.cy}" r="${Math.max(geometry.callout.target.r, 22)}" data-map-hit data-map-hit-min="${geometry.callout.target.r}" />` : ''}
        ` : ''}
      </g>
    `;
  };

  // Issue #117. A 44 CSS px assist disc is far larger than the mark it serves,
  // so in Europe and Asia almost every one of them overlaps a co-active
  // neighbour — only the Maldives locator has clean clearance. While the discs
  // sat inside their country's own group, SVG hit-testing awarded the tap to
  // whichever painted last, which made the winner an artefact of array order in
  // src/data/map-scopes.ts: a tap on eastern Germany within 22px of
  // Liechtenstein's callout answered Liechtenstein.
  //
  // The discs now paint beneath every country shape, so a real polygon always
  // wins its own territory and a disc can only claim open water or non-scoring
  // context. This costs no extra geometry — the alternative, an even-odd
  // exclusion clip per mark, would add a full copy of the scope's paths for
  // every assisted country.
  //
  // Where two discs still overlap over water, the smaller mark paints last and
  // wins. That is an explicit precedence — the country that is harder to hit
  // takes the contested point — rather than whatever order the scope lists.
  const assistHitLayer = (): string => {
    const discs = asset.countries.flatMap((geometry) => {
      // Inset members keep a main-map disc as well as their panel one: the panel
      // is a closer view, not a relocation, so the true location stays tappable.
      if (!isSelectable(geometry.countryId)) return [];
      const marks: { r: number; markup: string }[] = [];
      if (geometry.hitAssist) {
        marks.push({
          r: geometry.hitAssist.r,
          markup: `<circle class="map-country__assisted-hit" cx="${geometry.hitAssist.cx}" cy="${geometry.hitAssist.cy}" r="${Math.max(geometry.hitAssist.r, 22)}" data-map-hit data-map-hit-min="${geometry.hitAssist.r}" />`,
        });
      }
      if (geometry.locator) {
        marks.push({
          r: geometry.locator.r,
          markup: `<circle class="map-country__locator-hit" cx="${geometry.locator.cx}" cy="${geometry.locator.cy}" r="${Math.max(geometry.locator.r, 22)}" data-map-hit data-map-hit-min="${geometry.locator.r}" />`,
        });
      }
      if (geometry.callout) {
        marks.push({
          r: geometry.callout.target.r,
          markup: `<circle class="map-country__callout-hit" cx="${geometry.callout.target.cx}" cy="${geometry.callout.target.cy}" r="${Math.max(geometry.callout.target.r, 22)}" data-map-hit data-map-hit-min="${geometry.callout.target.r}" />`,
        });
      }
      return marks.map((mark) => ({ ...mark, countryId: geometry.countryId }));
    });
    if (!discs.length) return '';
    discs.sort((a, b) => (b.r - a.r) || a.countryId.localeCompare(b.countryId));
    return `
      <g class="map-assist-hits">
        ${discs.map((disc) => `<g data-action="map-answer" data-id="${disc.countryId}">${disc.markup}</g>`).join('')}
      </g>
    `;
  };

  return `
    <div class="map-stage__frame">
      <div
        class="map-stage__scroll"
        data-map-viewport
        data-map-session="${session.id}"
        data-map-viewbox="${asset.viewBox}"
        data-map-max-zoom="${asset.maxZoom ?? 5.5}"
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
          ${assistHitLayer()}
          ${assistedHitTarget(asset, session, interactive)}
          <g class="map-active-countries">
            ${asset.countries.map((geometry) => countryMarkup(geometry, !activeInset?.countryIds.includes(geometry.countryId), false)).join('')}
          </g>
          ${renderInlandWater(asset)}
          ${renderBoundaries(asset)}
          ${activeInset ? renderInsetSource(activeInset) : ''}
        </svg>
      </div>
      ${activeInset ? renderInsetPanel(asset, activeInset, countryMarkup, isSelectable) : ''}
    </div>
  `;
}