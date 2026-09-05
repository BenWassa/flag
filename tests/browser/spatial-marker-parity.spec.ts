import { expect, test, type Page } from '@playwright/test';
import { PerspectiveCamera, Vector3 } from 'three';

import { ASIA_GLOBE_ASSET } from '../../src/data/globe/asia.js';
import { NORTH_AMERICA_GLOBE_ASSET } from '../../src/data/globe/north-america.js';
import { OCEANIA_GLOBE_ASSET } from '../../src/data/globe/oceania.js';
import { WORLD_GLOBE_ASSET } from '../../src/data/globe/world.js';
import { getMapContinentConfig } from '../../src/data/map-scopes.js';
import type { ContinentId } from '../../src/domain/models.js';
import { DEG, GeographyIndex, framingFor, mergeForPicking, toSphere } from '../../src/spatial/geo.js';
import { decodeGlobeAsset, type GlobeAsset } from '../../src/spatial/globe-asset.js';
import {
  countryIdsForScope,
  framingBoxes,
  poseForFraming,
  type Pose,
} from '../../src/spatial/scope-geography.js';

/** Exact constants owned by the production renderer/stage. */
const GLOBE_FOV = 38;
const MARKER_RADIUS = 1.008;
const STAGE = '.spatial-stage[data-ready="true"] canvas';
const SURFACE = '.spatial-stage__surface';

test.setTimeout(120_000);

const world = decodeGlobeAsset(WORLD_GLOBE_ASSET);
const details: Partial<Record<ContinentId, GlobeAsset>> = {
  asia: decodeGlobeAsset(ASIA_GLOBE_ASSET),
  'north-america': decodeGlobeAsset(NORTH_AMERICA_GLOBE_ASSET),
  oceania: decodeGlobeAsset(OCEANIA_GLOBE_ASSET),
};

interface MarkerCase {
  continent: 'asia' | 'north-america' | 'oceania';
  id: string;
  region: string;
}

const CENTER_CASES: readonly MarkerCase[] = [
  { continent: 'asia', id: 'SGP', region: 'southeast-asia' },
  { continent: 'asia', id: 'MDV', region: 'south-asia' },
  { continent: 'asia', id: 'BHR', region: 'middle-east' },
  { continent: 'asia', id: 'BRN', region: 'southeast-asia' },
  { continent: 'north-america', id: 'ATG', region: 'caribbean' },
  { continent: 'oceania', id: 'FSM', region: 'micronesia' },
  { continent: 'oceania', id: 'TUV', region: 'polynesia' },
];

function initialPose(continent: MarkerCase['continent'], aspect: number): Pose {
  const config = getMapContinentConfig(continent)!;
  const framing = framingFor(framingBoxes(world, countryIdsForScope(config.scope)))!;
  return poseForFraming(framing, GLOBE_FOV, aspect);
}

function touchScale(pose: Pose, height: number) {
  const visibleSpanDeg = (
    2 * Math.atan(Math.tan((GLOBE_FOV / 2) * DEG) * Math.max(0.01, pose.distance - 1))
  ) / DEG;
  return { degreesPerPixel: visibleSpanDeg / height };
}

function markerAnchor(markerCase: MarkerCase, pose: Pose, height: number): readonly [number, number] {
  const detail = details[markerCase.continent]!;
  const index = new GeographyIndex(mergeForPicking(detail.countries, world.countries));
  const anchor = index.assistanceAnchor(markerCase.id, touchScale(pose, height));
  expect(anchor, `${markerCase.id} should be touch-assisted at this frame`).not.toBeNull();
  return anchor!;
}

function project(anchor: readonly [number, number], pose: Pose, box: { x: number; y: number; width: number; height: number }) {
  const camera = new PerspectiveCamera(GLOBE_FOV, box.width / box.height, 0.01, 20);
  const [cameraX, cameraY, cameraZ] = toSphere(pose.lon, pose.lat, pose.distance);
  camera.position.set(cameraX, cameraY, cameraZ);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);

  const [x, y, z] = toSphere(anchor[0], anchor[1], MARKER_RADIUS);
  const point = new Vector3(x, y, z).project(camera);
  return {
    x: box.x + ((point.x + 1) / 2) * box.width,
    y: box.y + ((1 - point.y) / 2) * box.height,
  };
}

async function openCase(page: Page, markerCase: MarkerCase) {
  await page.goto(`/#/flags/${markerCase.continent}`);
  await page.waitForSelector(STAGE, { timeout: 30_000 });
  // Detail LOD is a dynamic import fired after the shell commits. Network-idle
  // makes the test exercise the same merged picking surface production uses,
  // not the transient world-locator fallback.
  await page.waitForLoadState('networkidle');
  await expect(page.locator(SURFACE)).toHaveAttribute(
    'data-scope-marker-ids',
    new RegExp(`(?:^|\\s)${markerCase.id}(?:\\s|$)`),
    { timeout: 30_000 },
  );

  const box = await page.locator(SURFACE).boundingBox();
  expect(box).not.toBeNull();
  const pose = initialPose(markerCase.continent, box!.width / box!.height);
  const anchor = markerAnchor(markerCase, pose, box!.height);
  return { box: box!, pose, anchor, point: project(anchor, pose, box!) };
}

async function tap(page: Page, x: number, y: number) {
  if (test.info().project.name === 'mobile-chromium') {
    await page.touchscreen.tap(x, y);
  } else {
    await page.mouse.click(x, y);
  }
}

test.describe('tiny-country Spatial marker parity (#200)', () => {
  test('marker centres resolve the intended canonical country globally', async ({ page }) => {
    for (const markerCase of CENTER_CASES) {
      const { point } = await openCase(page, markerCase);
      await tap(page, point.x, point.y);
      await expect(page).toHaveURL(new RegExp(`#\\/flags\\/${markerCase.continent}\\/${markerCase.region}$`));
    }
  });

  test('an uncontested near-edge tap remains reliable', async ({ page }) => {
    const markerCase = CENTER_CASES.find((item) => item.id === 'TUV')!;
    const { point } = await openCase(page, markerCase);

    // 20 CSS px is close to the 24 px practical radius while remaining clear of
    // other Polynesian land. The dot stays small; only the invisible target is
    // accessibility-sized.
    await tap(page, point.x + 20, point.y);
    await expect(page).toHaveURL(/#\/flags\/oceania\/polynesia$/);
  });

  test('marker and assistance stay coherent after manual rotation and zoom', async ({ page }) => {
    const markerCase = CENTER_CASES.find((item) => item.id === 'TUV')!;
    const { box, pose } = await openCase(page, markerCase);
    const surface = page.locator(SURFACE);
    const centreX = box.x + box.width / 2;
    const centreY = box.y + box.height / 2;

    // Cross the 8 px drag threshold, then rotate by one deterministic 12 px
    // movement. The threshold-crossing movement itself is deliberately consumed.
    await surface.dispatchEvent('pointerdown', {
      pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1,
      clientX: centreX, clientY: centreY, isPrimary: true,
    });
    await surface.dispatchEvent('pointermove', {
      pointerId: 1, pointerType: 'mouse', buttons: 1,
      clientX: centreX + 9, clientY: centreY, isPrimary: true,
    });
    await surface.dispatchEvent('pointermove', {
      pointerId: 1, pointerType: 'mouse', buttons: 1,
      clientX: centreX + 21, clientY: centreY, isPrimary: true,
    });
    await surface.dispatchEvent('pointerup', {
      pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0,
      clientX: centreX + 21, clientY: centreY, isPrimary: true,
    });

    const rotated: Pose = {
      ...pose,
      lon: pose.lon - (12 * 180) / box.width,
    };

    // One wheel-in step uses the production 1 / 1.08 dolly factor.
    await surface.dispatchEvent('wheel', { deltaY: -100, clientX: centreX, clientY: centreY });
    const zoomed: Pose = { ...rotated, distance: rotated.distance / 1.08 };
    await expect(surface).toHaveAttribute('data-scope-marker-ids', /(?:^|\s)TUV(?:\s|$)/);

    const anchor = markerAnchor(markerCase, zoomed, box.height);
    const point = project(anchor, zoomed, box);
    await tap(page, point.x, point.y);
    await expect(page).toHaveURL(/#\/flags\/oceania\/polynesia$/);
  });

  test('zoom retires the visible marker with the practical envelope', async ({ page }) => {
    const markerCase = CENTER_CASES.find((item) => item.id === 'SGP')!;
    const { box } = await openCase(page, markerCase);
    const surface = page.locator(SURFACE);
    const centreX = box.x + box.width / 2;
    const centreY = box.y + box.height / 2;

    for (let step = 0; step < 24; step += 1) {
      if (!((await surface.getAttribute('data-scope-marker-ids')) ?? '').split(/\s+/).includes('SGP')) break;
      await surface.dispatchEvent('wheel', { deltaY: -100, clientX: centreX, clientY: centreY });
    }

    await expect(surface).not.toHaveAttribute('data-scope-marker-ids', /(?:^|\s)SGP(?:\s|$)/);
    await expect(page).toHaveURL(/#\/flags\/asia$/);
  });

  test('drag and pinch ownership cannot resolve a marker as a tap', async ({ page }) => {
    const markerCase = CENTER_CASES.find((item) => item.id === 'TUV')!;
    const { point } = await openCase(page, markerCase);
    const surface = page.locator(SURFACE);

    await surface.dispatchEvent('pointerdown', {
      pointerId: 11, pointerType: 'touch', button: 0, buttons: 1,
      clientX: point.x - 10, clientY: point.y, isPrimary: true,
    });
    await surface.dispatchEvent('pointerdown', {
      pointerId: 12, pointerType: 'touch', button: 0, buttons: 1,
      clientX: point.x + 10, clientY: point.y, isPrimary: false,
    });
    await surface.dispatchEvent('pointermove', {
      pointerId: 11, pointerType: 'touch', buttons: 1,
      clientX: point.x - 30, clientY: point.y, isPrimary: true,
    });
    await surface.dispatchEvent('pointermove', {
      pointerId: 12, pointerType: 'touch', buttons: 1,
      clientX: point.x + 30, clientY: point.y, isPrimary: false,
    });
    await surface.dispatchEvent('pointerup', {
      pointerId: 11, pointerType: 'touch', button: 0, buttons: 0,
      clientX: point.x - 30, clientY: point.y, isPrimary: true,
    });
    await surface.dispatchEvent('pointerup', {
      pointerId: 12, pointerType: 'touch', button: 0, buttons: 0,
      clientX: point.x + 30, clientY: point.y, isPrimary: false,
    });

    await expect(page).toHaveURL(/#\/flags\/oceania$/);
  });
});
