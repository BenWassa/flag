/**
 * Issue #119 — imperative owner of the persistent spatial stage.
 *
 * Deliberately not a React component. The scene is built once from generated
 * data and has no per-frame React state, so this layer is a plain object with a
 * narrow surface: push a `SpatialState`, it interprets it. That keeps the
 * renderer decision reversible, keeps the whole thing testable without a DOM
 * reconciler, and means React StrictMode's double effect invocation costs one
 * create/dispose pair rather than risking a half-torn-down GL context.
 */

import { loadGlobeAsset } from '../data/globe/index.js';
import type { ContinentId } from '../domain/models.js';
import { createCameraDirector, type CameraDirector } from './camera-director.js';
import { DEG, framingFor, GeographyIndex, mergeForPicking, type TouchScale } from './geo.js';
import type { GlobeAsset, GlobeBounds } from './globe-asset.js';
import { installGestures } from './gestures.js';
import {
  framingBoxes,
  countryIdsForScope,
  poseForFraming,
  WORLD_FRAMING,
  type Pose,
} from './scope-geography.js';
import type { SpatialState } from './spatial-state.js';
import {
  createGlobeScene,
  GLOBE_FOV,
  WebGLUnavailableError,
  type GlobeHandle,
} from './renderer/globe-scene.js';

export { WebGLUnavailableError };

/** Distance limits: closer than this clips the surface, further reads as a marble. */
const MIN_DISTANCE = 1.06;
const MAX_DISTANCE = 4.2;
/**
 * A country narrower than this fraction of the framed span is unreadable at that
 * frame and gets a scope marker instead. Roughly six pixels on a 400 px stage.
 */
const MARKER_SIZE_FRACTION = 0.015;

export interface StageControllerOptions {
  onSelectCountry(countryId: string): void;
  prefersReducedMotion(): boolean;
}

export interface StageController {
  apply(state: SpatialState): void;
  destroy(): void;
}

export async function createStageController(
  container: HTMLElement,
  options: StageControllerOptions,
): Promise<StageController> {
  const world = await loadGlobeAsset('world');
  const scene: GlobeHandle = createGlobeScene(container, world);

  /**
   * One picking surface, rebuilt when a continent's detail LOD mounts. Detail
   * geometry wins for the countries it carries and the world asset supplies the
   * rest, so a tap outside the framed continent still resolves and assistance
   * never disappears just because higher-detail geometry arrived (#166).
   */
  let pickingIndex = new GeographyIndex(world.countries);
  let detailId: ContinentId | null = null;
  /** Guards a detail load that was superseded before it resolved. */
  let detailToken = 0;

  let state: SpatialState | null = null;
  let firstPaint = true;
  let destroyed = false;

  /**
   * Framing always reads the WORLD asset, never the detail asset. Otherwise the
   * camera would visibly re-aim the moment a continent's higher-detail geometry
   * arrived, which reads as a bug rather than as detail.
   */
  function poseFor(next: SpatialState): Pose {
    const boxes = next.framedScope ? framingBoxes(world, countryIdsForScope(next.framedScope)) : [];
    const framing = framingFor(boxes) ?? WORLD_FRAMING;
    return poseForFraming(framing, GLOBE_FOV, scene.aspect);
  }

  const worldById = new Map(world.countries.map((country) => [country.id, country]));

  /**
   * Scope markers, not labels. Choosing Polynesia frames three islands that are
   * each a couple of pixels across; without a mark the learner is looking at an
   * empty ocean and cannot tell the scope loaded. Only countries small enough to
   * be unreadable at the current frame get one, so a continent of ordinary-sized
   * countries stays unmarked.
   */
  function markersFor(next: SpatialState): Array<readonly [number, number]> {
    if (next.mode !== 'focus' || !next.framedScope) return [];
    const framing = framingFor(framingBoxes(world, countryIdsForScope(next.framedScope)));
    if (!framing) return [];
    const threshold = Math.max(framing.spanLon, framing.spanLat) * MARKER_SIZE_FRACTION;
    const points: Array<readonly [number, number]> = [];
    for (const id of countryIdsForScope(next.framedScope)) {
      const country = worldById.get(id);
      if (!country) continue;
      const box: GlobeBounds = country.mainland;
      if (Math.max(box[2] - box[0], box[3] - box[1]) > threshold) continue;
      points.push(country.locator ?? [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2]);
    }
    return points;
  }

  const director: CameraDirector = createCameraDirector(
    poseForFraming(WORLD_FRAMING, GLOBE_FOV, scene.aspect),
    {
      apply: (pose) => scene.setCamera(pose.lon, pose.lat, pose.distance),
      prefersReducedMotion: options.prefersReducedMotion,
    },
  );

  /**
   * How many degrees of arc one CSS pixel covers at the current camera.
   *
   * Interaction envelopes are sized in pixels and converted through this, so a
   * microstate keeps a constant practical touch radius on screen instead of a
   * constant angular one — which would be unusable at world zoom and would
   * swallow half a continent close in. It follows manual pinch and wheel zoom
   * too, so assistance retires itself as the learner zooms in.
   */
  function touchScale(): TouchScale {
    const height = container.clientHeight || 1;
    const visibleSpanDeg = (2 * Math.atan(Math.tan((GLOBE_FOV / 2) * DEG) * Math.max(0.01, director.pose.distance - 1))) / DEG;
    return { degreesPerPixel: visibleSpanDeg / height };
  }

  function resolveCountry(clientX: number, clientY: number): string | null {
    const hit = scene.pickAt(clientX, clientY);
    if (!hit) return null;
    return pickingIndex.resolve(hit.lon, hit.lat, touchScale());
  }

  const removeGestures = installGestures(container, {
    onTap: (x, y) => {
      if (!state || state.picking === 'none') return;
      const countryId = resolveCountry(x, y);
      if (countryId) options.onSelectCountry(countryId);
    },
    // Manual rotation is a camera nudge, never a route change. It cancels
    // in-flight travel so the learner's hand always wins over choreography.
    onRotate: (deltaLon, deltaLat) => {
      const { lon, lat, distance } = director.pose;
      director.nudge({
        lon: lon - deltaLon,
        lat: Math.max(-85, Math.min(85, lat + deltaLat)),
        distance,
      });
    },
    onDolly: (factor) => {
      const { lon, lat, distance } = director.pose;
      director.nudge({ lon, lat, distance: Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, distance * factor)) });
    },
  });

  const observer = new ResizeObserver(() => {
    // A stage the layout has collapsed — short landscape during a Flags
    // question, or a yielded activity — must stop rendering rather than keep
    // painting a one-pixel canvas.
    const visible = container.clientWidth > 0 && container.clientHeight > 0;
    scene.setActive(visible && state?.mode !== 'yielded');
    if (!visible) return;
    scene.resize();
    if (state) director.retarget(poseFor(state));
  });
  observer.observe(container);

  async function mountDetail(continentId: ContinentId | null) {
    if (continentId === detailId) return;
    detailId = continentId;
    const token = ++detailToken;
    if (!continentId) {
      pickingIndex = new GeographyIndex(world.countries);
      scene.setDetail(null);
      return;
    }
    try {
      const asset: GlobeAsset = await loadGlobeAsset(continentId);
      if (destroyed || token !== detailToken) return;
      pickingIndex = new GeographyIndex(mergeForPicking(asset.countries, world.countries));
      scene.setDetail(asset);
      if (state) scene.setCountryStates(state.countryStates);
    } catch {
      // Detail is an enhancement. The world LOD stays mounted and every scope
      // remains navigable and selectable without it.
      if (token === detailToken) {
        pickingIndex = new GeographyIndex(world.countries);
        detailId = null;
      }
    }
  }

  return {
    apply(next) {
      if (destroyed) return;
      state = next;
      const yielded = next.mode === 'yielded';
      const visible = container.clientWidth > 0 && container.clientHeight > 0;
      scene.setActive(!yielded && visible);
      container.dataset.mode = next.mode;
      container.dataset.picking = next.picking;
      if (yielded) return;

      void mountDetail(next.detail);
      scene.setCountryStates(next.countryStates);
      scene.setScopeMarkers(markersFor(next));
      // Cold loads and deep links initialise AT the destination rather than
      // replaying the ancestor chain as a cutscene.
      director.travelTo(poseFor(next), firstPaint);
      firstPaint = false;
    },

    destroy() {
      destroyed = true;
      director.stop();
      observer.disconnect();
      removeGestures();
      scene.dispose();
    },
  };
}
