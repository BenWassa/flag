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

import { CONTINENTS } from '../data/continents.js';
import { loadGlobeAsset } from '../data/globe/index.js';
import type { ContinentId, StudyScope } from '../domain/models.js';
import { createCameraDirector, type CameraDirector } from './camera-director.js';
import { scopeAnchor } from './disclosure.js';
import { DEG, framingFor, GeographyIndex, mergeForPicking, type TouchScale } from './geo.js';
import type { GlobeAsset, GlobeBounds } from './globe-asset.js';
import { installGestures } from './gestures.js';
import {
  continentForCountry,
  framingBoxes,
  countryIdsForScope,
  poseForFraming,
  poseForWholeGlobe,
  WORLD_FRAMING,
  type Pose,
} from './scope-geography.js';
import { createScopeLabelLayer, type ScopeLabelLayer, type ScopeLabelTarget } from './scope-labels.js';
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
/**
 * A country narrower than this fraction of the framed span is unreadable at that
 * frame and gets a scope marker instead. Roughly six pixels on a 400 px stage.
 */
const MARKER_SIZE_FRACTION = 0.015;

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
      // A learner-facing area may legitimately reach across a continent boundary
      // — Middle East holds Egypt — but a tap there still selects Africa, so the
      // shell must not claim geography its own level cannot select either.
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

  /**
   * Where each name is written. Cached: an anchor depends only on canonical
   * geometry and the scope's own declared framing, never on the camera, so it
   * cannot drift as the learner rotates or zooms.
   */
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

  /**
   * Earned state reaches the projected control in words, exactly as it reaches
   * the command surface's chip. The mark beside the name is decoration over
   * something already said.
   */
  function accessibleName(label: SpatialLabel): string {
    const notes = [
      label.available ? null : 'coming soon',
      label.status === 'complete' ? 'complete' : label.status === 'mastered' ? 'Mastered' : null,
    ].filter((note): note is string => note !== null);
    return [label.label, ...notes].join(', ');
  }

  /**
   * What this set of names is, for assistive technology.
   *
   * It says "on the globe" because the command surface offers the same scopes as
   * its own group: two identically named lists would be indistinguishable to a
   * screen reader, and the difference between them — one is written on the
   * geography, one carries each scope's progress — is worth a word.
   */
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
        // Names ride the camera. Reprojecting here rather than on a frame loop
        // keeps the layer exactly as idle as the renderer already is.
        labels?.reposition();
      },
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

  /**
   * A press that began on a projected name belongs to that control. Without
   * this the same gesture would both activate the button and pick whatever
   * geography happens to lie under the word.
   */
  let pressedOnLabel = false;
  const onPointerDownCapture = (event: PointerEvent) => {
    const target = event.target;
    pressedOnLabel = target instanceof Element && target.closest('.spatial-scopes') !== null;
  };
  container.addEventListener('pointerdown', onPointerDownCapture, true);

  const labels: ScopeLabelLayer = createScopeLabelLayer(container, {
    onSelect: (scopeId) => options.onSelectScope(scopeId),
    // Reaching a name on the far side by keyboard turns the planet to it. This
    // is a camera nudge like a drag, never a route change.
    onReveal: (lon, lat) => director.travelTo({ lon, lat, distance: director.pose.distance }),
    project: (lon, lat) => scene.project(lon, lat),
  });

  const removeGestures = installGestures(container, {
    onTap: (x, y) => {
      if (!state || state.picking === 'none' || pressedOnLabel) return;
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
      // Ordinary spatial navigation retains the accepted 4.2 maximum. Home may
      // start farther back solely so the whole sphere fits a narrow portrait
      // viewport; letting the learner zoom back out to that fit avoids a sudden
      // jump inward after the first pinch without creating a new global limit.
      const maximumDistance = state?.navigation === 'domains'
        ? Math.max(MAX_DISTANCE, poseFor(state).distance)
        : MAX_DISTANCE;
      director.nudge({ lon, lat, distance: Math.max(MIN_DISTANCE, Math.min(maximumDistance, distance * factor)) });
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
      scene.setBoundaries(boundaryPlanFor(next));
      scene.setCountryStates(next.countryStates);
      scene.setScopeMarkers(markersFor(next));
      labels.set(labelGroupNameFor(next), labelTargetsFor(next));
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
      container.removeEventListener('pointerdown', onPointerDownCapture, true);
      labels.destroy();
      scene.dispose();
    },
  };
}
