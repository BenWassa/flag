import { describe, expect, it } from 'vitest';

import {
  ASSIST_RADIUS_PX,
  GeographyIndex,
  touchGeometryForCountry,
  type TouchScale,
} from './geo.js';
import type { GlobeBounds, GlobeCountry } from './globe-asset.js';

function squareCountry(id: string, lon: number, lat: number, size: number): GlobeCountry {
  const half = size / 2;
  const bounds: GlobeBounds = [lon - half, lat - half, lon + half, lat + half];
  const ring = [
    [bounds[0], bounds[1]],
    [bounds[2], bounds[1]],
    [bounds[2], bounds[3]],
    [bounds[0], bounds[3]],
    [bounds[0], bounds[1]],
  ];
  return { id, polygons: [[ring]], bounds, mainland: bounds, framing: bounds };
}

function locatorCountry(id: string, lon: number, lat: number): GlobeCountry {
  const bounds: GlobeBounds = [lon, lat, lon, lat];
  return { id, polygons: [], locator: [lon, lat], bounds, mainland: bounds, framing: bounds };
}

const phoneScale: TouchScale = { degreesPerPixel: 0.1 };

describe('Spatial marker / practical-touch parity (#200)', () => {
  it('exposes exactly the source-derived anchor used by assisted resolution', () => {
    const country = squareCountry('TNY', 10, 4, 0.2);
    const index = new GeographyIndex([country]);
    const geometry = touchGeometryForCountry(country);
    const anchor = index.assistanceAnchor('TNY', phoneScale);

    expect(anchor).toEqual(geometry.anchor);
    expect(anchor).not.toBeNull();
    expect(index.resolve(anchor![0], anchor![1], phoneScale)).toBe('TNY');

    const nearEdgeLon = anchor![0] + (ASSIST_RADIUS_PX - 1) * phoneScale.degreesPerPixel;
    expect(index.resolve(nearEdgeLon, anchor![1], phoneScale)).toBe('TNY');
  });

  it('uses exact rendered screen distance when the unit-sphere ray is geographically displaced', () => {
    const country = locatorCountry('TNY', 10, 4);
    const index = new GeographyIndex([country]);

    const onMarker: TouchScale = {
      degreesPerPixel: 0.1,
      screenDistanceToAnchorPx: () => 0,
    };
    expect(index.resolve(20, 4, onMarker)).toBe('TNY');

    const outsideMarker: TouchScale = {
      degreesPerPixel: 0.1,
      screenDistanceToAnchorPx: () => ASSIST_RADIUS_PX + 1,
    };
    expect(index.resolve(10, 4, outsideMarker)).toBeNull();
  });

  it('keeps screen-space overlap resolution deterministic when practical targets overlap', () => {
    const countries = [locatorCountry('BBB', 1, 0), locatorCountry('AAA', -1, 0)];
    const screenTie: TouchScale = {
      degreesPerPixel: 0.1,
      screenDistanceToAnchorPx: () => 12,
    };

    const forward = new GeographyIndex(countries);
    const reversed = new GeographyIndex([...countries].reverse());

    expect(forward.resolve(0, 0, screenTie)).toBe('AAA');
    expect(reversed.resolve(0, 0, screenTie)).toBe('AAA');
  });

  it('never lets exact screen assistance relax the existing real-land intrusion bound', () => {
    const host = squareCountry('BIG', 0, 0, 4);
    const tiny = locatorCountry('TNY', 0, 0);
    const index = new GeographyIndex([host, tiny]);
    const screenAligned: TouchScale = {
      degreesPerPixel: 0.1,
      screenDistanceToAnchorPx: (anchor) => anchor[0] === 0 && anchor[1] === 0 ? 0 : null,
    };

    expect(index.resolve(1.5, 0, screenAligned)).toBe('BIG');
  });

  it('uses the current LOD anchor rather than assuming the world locator survives detail', () => {
    const world = locatorCountry('TNY', 10, 4);
    const detail = squareCountry('TNY', 10.35, 4.1, 0.2);

    const worldIndex = new GeographyIndex([world]);
    const detailIndex = new GeographyIndex([detail]);
    const worldAnchor = worldIndex.assistanceAnchor('TNY', phoneScale);
    const detailAnchor = detailIndex.assistanceAnchor('TNY', phoneScale);

    expect(worldAnchor).toEqual([10, 4]);
    expect(detailAnchor).toEqual(touchGeometryForCountry(detail).anchor);
    expect(detailAnchor).not.toEqual(worldAnchor);
    expect(detailIndex.resolve(detailAnchor![0], detailAnchor![1], phoneScale)).toBe('TNY');
  });

  it('retires marker eligibility at the exact screen-scale threshold used by assistance', () => {
    const country = squareCountry('TNY', 0, 0, 0.2);
    const index = new GeographyIndex([country]);

    expect(index.assistanceAnchor('TNY', phoneScale)).not.toBeNull();

    const zoomedIn: TouchScale = { degreesPerPixel: 0.001 };
    expect(index.assistanceAnchor('TNY', zoomedIn)).toBeNull();

    const geometry = touchGeometryForCountry(country);
    const formerNearMiss = geometry.anchor[0] + country.mainland[2] - country.mainland[0];
    expect(index.resolve(formerNearMiss, geometry.anchor[1], zoomedIn)).not.toBe('TNY');
  });

  it('keeps locator-only generated geography on one identity/anchor contract', () => {
    const country = locatorCountry('ISL', 179.8, -8.5);
    const index = new GeographyIndex([country]);
    const anchor = index.assistanceAnchor('ISL', phoneScale);

    expect(anchor).toEqual([179.8, -8.5]);
    expect(index.resolve(anchor![0], anchor![1], phoneScale)).toBe('ISL');
    expect(index.resolve(-180.2, -8.5, phoneScale)).toBe('ISL');
  });
});
