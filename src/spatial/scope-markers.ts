import { type GeographyIndex, type TouchScale } from './geo.js';
import type { GlobeCountry } from './globe-asset.js';

/**
 * Scope markers sit just above the unit globe so their halo does not z-fight
 * with land. Picking still raycasts the unit sphere, so #200 uses this exact
 * rendered radius when measuring a tap against the visible marker in screen
 * space. Keep it aligned with `globe-scene.ts`'s marker point radius.
 */
export const SCOPE_MARKER_RADIUS = 1.008;

/**
 * A country narrower than this fraction of the framed span is unreadable at that
 * frame and may receive a scope marker. Roughly six pixels on a 400 px stage.
 *
 * This remains a presentation threshold, separate from #166's 16 px practical
 * touch threshold. #200 requires a visible marker to satisfy BOTH policies: it
 * is visually unreadable, and the current picking index is actively supplying
 * the matching practical touch envelope.
 */
export const MARKER_SIZE_FRACTION = 0.015;

export interface ScopeMarker {
  id: string;
  anchor: readonly [number, number];
}

/**
 * Pure marker inventory for the current scope/camera/picking surface.
 *
 * World geometry owns framing/readability so loading a detail chunk never makes
 * the camera or marker policy jump. The current `GeographyIndex` owns the final
 * identity/anchor because it is also what resolves the tap. This is the seam
 * that prevents world-LOD marker anchors from drifting away from detail-LOD
 * practical touch geometry.
 */
export function scopeMarkersFor(
  countryIds: readonly string[],
  worldById: ReadonlyMap<string, GlobeCountry>,
  framedSpanDeg: number,
  pickingIndex: GeographyIndex,
  touch: TouchScale,
): ScopeMarker[] {
  const visualThreshold = framedSpanDeg * MARKER_SIZE_FRACTION;
  const markers: ScopeMarker[] = [];

  for (const id of countryIds) {
    const worldCountry = worldById.get(id);
    if (!worldCountry) continue;
    const [west, south, east, north] = worldCountry.mainland;
    if (Math.max(east - west, north - south) > visualThreshold) continue;

    const anchor = pickingIndex.assistanceAnchor(id, touch);
    if (!anchor) continue;
    markers.push({ id, anchor });
  }

  return markers;
}
