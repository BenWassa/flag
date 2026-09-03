import { describe, expect, it } from 'vitest';
import { DEG } from './geo.js';
import { poseForWholeGlobe, WORLD_FRAMING } from './scope-geography.js';

const FOV = 38;

function projectedViewportFill(distance: number, aspect: number): number {
  const verticalHalfFov = (FOV * DEG) / 2;
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * aspect);
  const limitingHalfFov = Math.min(verticalHalfFov, horizontalHalfFov);
  const globeHalfAngle = Math.asin(1 / distance);
  return Math.tan(globeHalfAngle) / Math.tan(limitingHalfFov);
}

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
