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

import { PerspectiveCamera, Vector3 } from 'three';

import { CONTINENTS } from '../data/continents.js';
import { loadGlobeAsset } from '../data/globe/index.js';
import type { ContinentId, StudyScope } from '../domain/models.js';
import { createCameraDirector, type CameraDirector } from './camera-director.js';
import { scopeAnchor } from './disclosure.js';
import { DEG, framingFor, GeographyIndex, mergeForPicking, toSphere, type TouchScale } from './geo.js';
import type { GlobeAsset } from './globe-asset.js';
import { installGestures } from './gestures.js';
import {
  continentForCountry,
  framingBoxes,
  countryIdsForScope,
  maximumDistanceForFramedScope,
  poseForFraming,
  poseForSelectedFraming,
  poseForWholeGlobe,
  WORLD_FRAMING,
  type Pose,
} from './scope-geography.js';
import { createScopeLabelLayer, type ScopeLabelLayer, type ScopeLabelTarget } from './scope-labels.js';
import { SCOPE_MARKER_RADIUS, scopeMarkersFor, type ScopeMarker } from './scope-markers.js';
import { regionScopeByCountry, type SpatialLabel, type SpatialState } from './spatial-state.js';
import {
  createGlobeScene,
  GLOBE_FOV,
  WebGLUnavailableError,
  type BoundaryPlan,
  type GlobeHandle,
} from './renderer/globe-scene.js';

export { WebGLUnavailableError };

/** Distance limits: closer than this clips the surface, further reads as a marble. */
const MIN_DISTANCE = 1.06;
const MAX_DISTANCE = 4.2;

export interface StageControllerOptions {
  onSelectCountry(countryId: string): void;
  /** A name written on the geography was chosen. Same action as a tap (#197). */
  onSelectScope(scopeId: string): void;
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
   *
   * Home is the one #187 composition exception: there the globe silhouette
   * itself must fit the viewport, so it uses the unit-sphere fit rather than the
   * ordinary world geographic span. No route/application state is mutated.
   */
  function poseFor(next: SpatialState): Pose {
    if (next.navigation === 'domains') return poseForWholeGlobe(GLOBE_FOV, scene.aspect);
    const boxes = next.framedScope ? framingBoxes(world, countryIdsForScope(next.framedScope)) : [];
    const framing = framingFor(boxes) ?? WORLD_FRAMING;
    return next.framedScope
      ? poseForSelectedFraming(framing, GLOBE_FOV, scene.aspect)
      : poseForFraming(framing, GLOBE_FOV, scene.aspect);
  }

  /**
   * Zoom-out is a property of the current framing, never of a named continent.
   * A selected scope may retreat only 25% farther from the sphere than its
   * initial pose; world-level navigation keeps the accepted global ceiling and
   * Home can always recover its complete-sphere fit on narrow portrait.
   */
  function maximumDistanceFor(next: SpatialState): number {
    const initialDistance = poseFor(next).distance;
    if (next.navigation === 'domains') return Math.max(MAX_DISTANCE, initialDistance);
    if (!next.framedScope) return MAX_DISTANCE;
    return Math.min(MAX_DISTANCE, maximumDistanceForFramedScope(initialDistance));
  }

  const worldById = new Map(world.countries.map((country) => [country.id, country]));
  const touchCamera = new PerspectiveCamera(GLOBE_FOV, 1, 0.01, 20);
  const projectedMarker = new Vector3();

  /**
   * How many degrees of arc one CSS pixel covers at the current camera, plus an
   * optional exact screen-space metric for a real tap.
   *
   * The angular scale still decides WHEN a country is too small to aim at and
   * still bounds how far assistance may intrude onto real land. But a visible
   * marker is rendered at radius 1.008 while `scene.pickAt` raycasts the unit
   * globe. Those two points are not screen-coincident under perspective,
   * especially near the limb. #200 therefore measures the final practical
   * 24 px radius against the marker's actual projected pixel position.
   */
  function touchScale(clientX?: number, clientY?: number): TouchScale {
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;
    const visibleSpanDeg = (2 * Math.atan(Math.tan((GLOBE_FOV / 2) * DEG) * Math.max(0.01, director.pose.distance - 1))) / DEG;
    const degreesPerPixel = visibleSpanDeg / height;
    if (clientX === undefined || clientY === undefined) return { degreesPerPixel };

    const rect = container.getBoundingClientRect();
    const [cameraX, cameraY, cameraZ] = toSphere(director.pose.lon, director.pose.lat, director.pose.distance);
    touchCamera.aspect = width / height;
    touchCamera.position.set(cameraX, cameraY, cameraZ);
    touchCamera.lookAt(0, 0, 0);
    touchCamera.updateProjectionMatrix();
    touchCamera.updateMatrixWorld(true);

    return {
      degreesPerPixel,
      screenDistanceToAnchorPx(anchor) {
        const [markerX, markerY, markerZ] = toSphere(anchor[0], anchor[1], SCOPE_MARKER_RADIUS);

        // Match the renderer's depth behaviour: a marker hidden by the unit
        // globe is not a selectable visible affordance. Test the camera→marker
        // segment against the unit sphere and reject if it enters the sphere
        // before reaching the elevated marker point.
        const dx = markerX - cameraX;
        const dy = markerY - cameraY;
        const dz = markerZ - cameraZ;
        const length = Math.hypot(dx, dy, dz);
        if (length <= 0) return null;
        const ux = dx / length;
        const uy = dy / length;
        const uz = dz / length;
        const b = cameraX * ux + cameraY * uy + cameraZ * uz;
        const c = cameraX * cameraX + cameraY * cameraY + cameraZ * cameraZ - 1;
        const discriminant = b * b - c;
        if (discriminant >= 0) {
          const intersection = -b - Math.sqrt(discriminant);
          if (intersection > 0 && intersection < length - 1e-5) return null;
        }

        projectedMarker.set(markerX, markerY, markerZ).project(touchCamera);
        if (projectedMarker.z < -1 || projectedMarker.z > 1) return null;
        const markerClientX = rect.left + ((projectedMarker.x + 1) / 2) * width;
        const markerClientY = rect.top + ((1 - projectedMarker.y) / 2) * height;
        return Math.hypot(clientX - markerClientX, clientY - markerClientY);
      },
    };
  }

  /**
   * Scope markers, not labels. Choosing Polynesia frames three islands that are
   * each a couple of pixels across; without a mark the learner is looking at an
   * empty ocean and cannot tell the scope loaded.
   *
   * #200 makes the shared pure inventory in `scope-markers.ts` authoritative:
   * a marker is drawn only while the SAME current-LOD `GeographyIndex` grants
   * that country practical touch assistance, and it uses that index's exact
   * source-derived anchor. The visible mark cannot outlive its 48 px interaction
   * envelope after zoom or point at a world anchor while detail picking resolves
   * around a different one.
   */
  function markersFor(next: SpatialState): ScopeMarker[] {
    if (next.mode !== 'focus' || !next.framedScope) return [];
    const ids = countryIdsForScope(next.framedScope);
    const framing = framingFor(framingBoxes(world, ids));
    if (!framing) return [];
    return scopeMarkersFor(
      ids,
      worldById,
      Math.max(framing.spanLon, framing.spanLat),
      pickingIndex,
      touchScale(),
    );
  }

  function syncMarkers() {
    if (!state) return;
    const markers = markersFor(state);
    scene.setScopeMarkers(markers.map((marker) => marker.anchor));
    if (markers.length) container.dataset.scopeMarkerIds = markers.map((marker) => marker.id).join(' ');
    else delete container.dataset.scopeMarkerIds;
  }

  /**
   * Issue #197 — which political boundaries the geography draws, derived from
   * the same curriculum tables the launcher and the router read.
   *
   * The scene is handed a grouping, never a taxonomy. World level groups every
   * country by its continent, so the Earth reads as continents rather than as a
   * country tessellation; a framed continent regroups its OWN countries by the
   * areas that domain offers, so areas divide and countries do not. Country
   * detail is a grouping of one country each, which is what the results frame —
   * the round is over and it was about those countries — asks for.
   */
  const CONTINENT_GROUPS: ReadonlyMap<string, string> = new Map(
    world.countries
      .map((country) => [country.id, continentForCountry(country.id)] as const)
      .filter((pair): pair is readonly [string, ContinentId] => pair[1] !== null),
  );
  const NO_GROUPS: ReadonlyMap<string, string> = new Map();
  const NO_EMPHASIS: ReadonlySet<string> = new Set();

  function boundaryPlanFor(next: SpatialState): BoundaryPlan {
    if (next.boundaries === 'country') {
      return { key: 'country', groupOf: NO_GROUPS, emphasis: NO_EMPHASIS, locators: true };
    }
    if (next.boundaries === 'continent' || !next.detail || !next.domain) {
      return { key: 'continent', groupOf: CONTINENT_GROUPS, emphasis: NO_EMPHASIS, locators: false };
    }
    const groupOf = new Map(CONTINENT_GROUPS);
    for (const [countryId, regionId] of regionScopeByCountry(next.detail, next.domain)) {
      if (continentForCountry(countryId) === next.detail) groupOf.set(countryId, regionId);
    }
    const emphasis = new Set<string>();
    const framed = next.framedScope;
    if (next.mode === 'focus' && framed?.kind === 'region' && framed.id) emphasis.add(framed.id);
    return {
      key: `region:${next.detail}:${next.domain}:${[...emphasis].join(',')}`,
      groupOf,
      emphasis,
      locators: false,
    };
  }

  const anchors = new Map<string, readonly [number, number]>();

  function anchorFor(label: SpatialLabel, level: 'continent' | 'region'): readonly [number, number] {
    const cached = anchors.get(label.scopeId);
    if (cached) return cached;
    const scope: StudyScope = { kind: level, id: label.scopeId, label: label.label };
    const ids = countryIdsForScope(scope);
    const framing = framingFor(framingBoxes(world, ids)) ?? WORLD_FRAMING;
    const polygons: number[][][][] = [];
    for (const id of ids) {
      const country = worldById.get(id);
      if (country?.polygons.length) polygons.push(...country.polygons);
    }
    const anchor = scopeAnchor(polygons, framing);
    anchors.set(label.scopeId, anchor);
    return anchor;
  }

  function accessibleName(label: SpatialLabel): string {
    const notes = [
      label.available ? null : 'coming soon',
      label.status === 'complete' ? 'complete' : label.status === 'mastered' ? 'Mastered' : null,
    ].filter((note): note is string => note !== null);
    return [label.label, ...notes].join(', ');
  }

  function labelGroupNameFor(next: SpatialState): string | null {
    if (next.labelLevel === 'continent') return 'Continents on the globe';
    if (next.labelLevel !== 'region') return null;
    const continent = CONTINENTS.find((item) => item.id === next.detail);
    return continent ? `Areas of ${continent.name} on the globe` : 'Areas on the globe';
  }

  function labelTargetsFor(next: SpatialState): ScopeLabelTarget[] {
    const level = next.labelLevel;
    if (!level) return [];
    return next.labels.map((label) => ({
      scopeId: label.scopeId,
      label: label.label,
      name: accessibleName(label),
      status: label.status,
      current: label.current,
      available: label.available,
      anchor: anchorFor(label, level),
    }));
  }

  const director: CameraDirector = createCameraDirector(
    poseForFraming(WORLD_FRAMING, GLOBE_FOV, scene.aspect),
    {
      apply: (pose) => {
        scene.setCamera(pose.lon, pose.lat, pose.distance);
        // Read-only production evidence for camera-contract browser tests. It is
        // not application state and cannot influence routing, picking or labels.
        container.dataset.cameraDistance = pose.distance.toFixed(6);
        syncMarkers();
        // Names ride the camera. Reprojecting here rather than on a frame loop
        // keeps the layer exactly as idle as the renderer already is.
        labels?.reposition();
      },
      prefersReducedMotion: options.prefersReducedMotion,
    },
  );

  function resolveCountry(clientX: number, clientY: number): string | null {
    const hit = scene.pickAt(clientX, clientY);
    if (!hit) return null;
    return pickingIndex.resolve(hit.lon, hit.lat, touchScale(clientX, clientY));
  }

  let pressedOnLabel = false;
  const onPointerDownCapture = (event: PointerEvent) => {
    const target = event.target;
    pressedOnLabel = target instanceof Element && target.closest('.spatial-scopes') !== null;
  };
  container.addEventListener('pointerdown', onPointerDownCapture, true);

  const labels: ScopeLabelLayer = createScopeLabelLayer(container, {
    onSelect: (scopeId) => options.onSelectScope(scopeId),
    onReveal: (lon, lat) => director.travelTo({ lon, lat, distance: director.pose.distance }),
    project: (lon, lat) => scene.project(lon, lat),
  });

  const removeGestures = installGestures(container, {
    onTap: (x, y) => {
      if (!state || state.picking === 'none' || pressedOnLabel) return;
      const countryId = resolveCountry(x, y);
      if (countryId) options.onSelectCountry(countryId);
    },
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
      const maximumDistance = state ? maximumDistanceFor(state) : MAX_DISTANCE;
      director.nudge({ lon, lat, distance: Math.max(MIN_DISTANCE, Math.min(maximumDistance, distance * factor)) });
    },
  });

  const observer = new ResizeObserver(() => {
    const visible = container.clientWidth > 0 && container.clientHeight > 0;
    scene.setActive(visible && state?.mode !== 'yielded');
    if (!visible) return;
    scene.resize();
    if (state) director.retarget(poseFor(state));
    syncMarkers();
    labels.reposition();
  });
  observer.observe(container);

  async function mountDetail(continentId: ContinentId | null) {
    if (continentId === detailId) return;
    detailId = continentId;
    const token = ++detailToken;
    if (!continentId) {
      pickingIndex = new GeographyIndex(world.countries);
      scene.setDetail(null);
      syncMarkers();
      return;
    }
    try {
      const asset: GlobeAsset = await loadGlobeAsset(continentId);
      if (destroyed || token !== detailToken) return;
      pickingIndex = new GeographyIndex(mergeForPicking(asset.countries, world.countries));
      scene.setDetail(asset);
      if (state) scene.setCountryStates(state.countryStates);
      syncMarkers();
    } catch {
      if (token === detailToken) {
        pickingIndex = new GeographyIndex(world.countries);
        detailId = null;
        syncMarkers();
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
      if (yielded) {
        // The projected names are real DOM inside the stage, so a yielded stage
        // has to retire them rather than merely stop drawing: `display: none`
        // takes them off the screen and out of the accessibility tree, but they
        // would still be controls for a scope the learner is not currently
        // choosing. Every yielding state publishes no labels, so this is the
        // authoritative state applied, not a special case (#207).
        labels.set(labelGroupNameFor(next), labelTargetsFor(next));
        syncMarkers();
        return;
      }

      void mountDetail(next.detail);
      scene.setBoundaries(boundaryPlanFor(next));
      scene.setCountryStates(next.countryStates);
      labels.set(labelGroupNameFor(next), labelTargetsFor(next));
      director.travelTo(poseFor(next), firstPaint);
      syncMarkers();
      firstPaint = false;
    },

    destroy() {
      destroyed = true;
      director.stop();
      observer.disconnect();
      removeGestures();
      container.removeEventListener('pointerdown', onPointerDownCapture, true);
      labels.destroy();
      scene.dispose();
    },
  };
}
