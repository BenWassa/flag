import { describe, expect, it } from 'vitest';
import { DEG, distanceForSpan, framingFor } from './geo.js';
import {
  maximumDistanceForFramedScope,
  poseForFraming,
  poseForWholeGlobe,
  WORLD_FRAMING,
} from './scope-geography.js';

const FOV = 38;

function projectedViewportFill(distance: number, aspect: number): number {
  const verticalHalfFov = (FOV * DEG) / 2;
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * aspect);
  const limitingHalfFov = Math.min(verticalHalfFov, horizontalHalfFov);
  const globeHalfAngle = Math.asin(1 / distance);
  return Math.tan(globeHalfAngle) / Math.tan(limitingHalfFov);
}

describe('Spatial selected-scope framing', () => {
  it('uses the exact geographic union rather than inflating it with camera padding', () => {
    const framing = framingFor([
      [0, 0, 10, 10],
      [20, -5, 30, 15],
    ]);
    expect(framing).not.toBeNull();
    expect(framing?.spanLon).toBeCloseTo(30, 10);
    expect(framing?.spanLat).toBeCloseTo(20, 10);
  });

  it('keeps tiny scopes orientable and broad scopes inside the useful front-facing arc', () => {
    const tiny = distanceForSpan(8, 8, FOV, 1);
    const orientingFloor = distanceForSpan(18, 18, FOV, 1);
    expect(tiny).toBeCloseTo(orientingFloor, 10);

    const broad = distanceForSpan(120, 120, FOV, 1);
    const nearHemisphere = distanceForSpan(170, 170, FOV, 1);
    expect(nearHemisphere).toBeCloseTo(broad, 10);
  });

  it('allows only a modest scope-relative retreat above the unit sphere', () => {
    const initial = poseForFraming(
      { lon: 0, lat: 0, spanLon: 40, spanLat: 30 },
      FOV,
      390 / 844,
    ).distance;
    const maximum = maximumDistanceForFramedScope(initial);
    expect(maximum).toBeGreaterThan(initial);
    expect((maximum - 1) / (initial - 1)).toBeCloseTo(1.25, 10);
    expect((initial - 1) / (maximum - 1)).toBeCloseTo(0.8, 10);
  });
});

describe('Spatial Home whole-globe framing', () => {
  it('fits the complete sphere with consistent breathing room in portrait and short landscape', () => {
    for (const aspect of [320 / 568, 390 / 844, 844 / 390, 1440 / 900]) {
      const pose = poseForWholeGlobe(FOV, aspect);
      expect(projectedViewportFill(pose.distance, aspect)).toBeCloseTo(0.94, 10);
      expect(pose.lon).toBe(WORLD_FRAMING.lon);
      expect(pose.lat).toBe(WORLD_FRAMING.lat);
    }
  });

  it('stands farther back on narrow portrait without changing world orientation', () => {
    const portrait = poseForWholeGlobe(FOV, 320 / 568);
    const landscape = poseForWholeGlobe(FOV, 844 / 390);
    expect(portrait.distance).toBeGreaterThan(landscape.distance);
    expect(portrait.lon).toBe(landscape.lon);
    expect(portrait.lat).toBe(landscape.lat);
  });
});
