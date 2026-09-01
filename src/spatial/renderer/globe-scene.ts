/**
 * Issue #119 — persistent globe scene (F2 implementation).
 *
 * ARCHITECTURE DECISION: plain Three.js behind a narrow imperative handle,
 * hosted by one React component. See docs/closed/issue-119-renderer-decision.md
 * for the evidence. In short: this scene is built once from generated data and
 * has no per-frame React state, so a reconciler would add delivered bytes and a
 * StrictMode failure mode for a tree that never reconciles. The handle below is
 * the entire surface the application sees, which is also what keeps the decision
 * reversible.
 *
 * Performance posture, per the issue's PWA constraints:
 *   - the scene is created once and never rebuilt on navigation;
 *   - rendering is on demand — no rAF loop spins while the globe is idle;
 *   - device pixel ratio is capped and degrades on sustained slow frames;
 *   - materials are shared instances, swapped by reference per country;
 *   - continent detail is mounted and disposed as the learner moves;
 *   - WebGL context loss is handled rather than left to blank the canvas.
 *
 * No textures, no terrain, no photographic Earth, no starfield. DESIGN.md
 * excludes that aesthetic and the issue restates it.
 */

import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Raycaster,
  CanvasTexture,
  Scene,
  SphereGeometry,
  Vector2,
  WebGLRenderer,
} from 'three';
import { Earcut } from 'three/src/extras/Earcut.js';
import { fromSphere, subdivide, toSphere, type Triangle } from '../geo.js';
import type { GlobeAsset, GlobeCountry } from '../globe-asset.js';
import type { CountryState } from '../spatial-state.js';

const OCEAN_RADIUS = 1;
const LAND_RADIUS = 1.0015;
/**
 * Detail geometry sits fractionally above the world LOD it replaces. Two
 * simplified coastlines of the same island are not identical — the world LOD's
 * Indonesia and Papua New Guinea genuinely overlap across New Guinea — so
 * coplanar land would z-fight and the framed continent would flicker under its
 * neighbour. The offset is far below one pixel of parallax at any reachable
 * camera distance.
 */
const DETAIL_LAND_RADIUS = 1.0022;
const BORDER_RADIUS = 1.003;
const DETAIL_BORDER_RADIUS = 1.0034;
const LOCATOR_RADIUS = 1.006;
const MARKER_RADIUS = 1.008;

/** Longest triangle edge, in degrees, before a face is split onto the sphere. */
const MAX_EDGE_DEG = 6;

export const GLOBE_FOV = 38;

/**
 * Production cartography tokens, not invented ones. These are the values
 * `atlas-theme.css` gives the 2D maps, so the globe reads as the same product.
 *
 * `space` is the page canvas rather than the ocean colour, so the planet has a
 * silhouette and reads as an object. It is not a decorative starfield.
 */
const PALETTE: Record<'space' | 'ocean' | 'border' | 'marker', number> & Record<CountryState, number> = {
  space: 0xf6f8fb,          // --canvas
  ocean: 0xdceaf5,          // --map-ocean
  border: 0x7b899b,         // --map-context-border
  /* Scope emphasis is the one place Atlas Blue touches the geography, and only
     for countries too small to read at the current frame. */
  marker: 0x2563eb,         // --action
  ordinary: 0xdfe6ef,
  active: 0xf8fafc,         // --map-active-land
  dimmed: 0xd2dae5,         // --map-context-land
  /* Unsupported geography is legible for orientation but visibly not a
     surface you can play. It is never accompanied by a progress figure. */
  unavailable: 0xe4e8ee,
  mastered: 0xe6dcf8,       // --mastery-soft, deepened
  complete: 0xf7ecc9,       // --prestige-soft, deepened
};

export type CountryPresentation = ReadonlyMap<string, CountryState>;

export interface GlobePick {
  /** ISO3 under the point, or null over water. */
  countryId: string | null;
  lon: number;
  lat: number;
}

export interface GlobeHandle {
  readonly canvas: HTMLCanvasElement;
  readonly aspect: number;
  /** Places the camera. Longitude/latitude in degrees, distance in sphere radii. */
  setCamera(lon: number, lat: number, distance: number): void;
  setCountryStates(states: CountryPresentation): void;
  /** Mounts a higher-detail asset over the base meshes for its countries. */
  setDetail(asset: GlobeAsset | null): void;
  /**
   * Marks in-scope countries too small to read at the current frame. This is the
   * globe's equivalent of the 2D maps' locator dot: without it, choosing
   * Polynesia frames three specks in an empty ocean.
   */
  setScopeMarkers(points: ReadonlyArray<readonly [number, number]>): void;
  /** Geographic position under a client-space point. */
  pickAt(clientX: number, clientY: number): GlobePick | null;
  resize(): void;
  requestRender(): void;
  /** Stops all rendering and frees the frame budget while the stage is yielded. */
  setActive(active: boolean): void;
  dispose(): void;
}

export class WebGLUnavailableError extends Error {}

function buildCountryGeometry(country: GlobeCountry, radius: number): BufferGeometry | null {
  const positions: number[] = [];
  for (const polygon of country.polygons) {
    const outer = polygon[0];
    if (!outer || outer.length < 3) continue;

    // Earcut wants a flat vertex list plus hole start indices.
    const flat: number[] = [];
    const holeIndices: number[] = [];
    for (const [lon, lat] of outer) flat.push(lon, lat);
    for (let h = 1; h < polygon.length; h += 1) {
      const hole = polygon[h];
      if (!hole || hole.length < 3) continue;
      holeIndices.push(flat.length / 2);
      for (const [lon, lat] of hole) flat.push(lon, lat);
    }

    const indices = Earcut.triangulate(flat, holeIndices, 2);
    const triangles: Triangle[] = [];
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i] * 2;
      const b = indices[i + 1] * 2;
      const c = indices[i + 2] * 2;
      triangles.push([
        [flat[a], flat[a + 1]],
        [flat[b], flat[b + 1]],
        [flat[c], flat[c + 1]],
      ]);
    }

    for (const [a, b, c] of subdivide(triangles, MAX_EDGE_DEG)) {
      // Winding is not normalised here. Earcut's output orientation follows the
      // source ring order, which Natural Earth does not guarantee to be
      // consistent across features, so land materials are DoubleSide rather than
      // relying on every ring being wound the same way. Back-face culling would
      // otherwise silently delete whichever countries came out reversed.
      for (const [lon, lat] of [a, b, c]) positions.push(...toSphere(lon, lat, radius));
    }
  }
  if (!positions.length) return null;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function buildBorderGeometry(
  countries: readonly GlobeCountry[],
  radius: number,
  exclude?: ReadonlySet<string>,
): BufferGeometry {
  const positions: number[] = [];
  for (const country of countries) {
    if (exclude?.has(country.id)) continue;
    for (const polygon of country.polygons) {
      for (const ring of polygon) {
        for (let i = 0; i < ring.length; i += 1) {
          const from = ring[i];
          const to = ring[(i + 1) % ring.length];
          positions.push(...toSphere(from[0], from[1], radius));
          positions.push(...toSphere(to[0], to[1], radius));
        }
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  return geometry;
}

function buildLocatorGeometry(
  countries: readonly GlobeCountry[],
  exclude?: ReadonlySet<string>,
): { geometry: BufferGeometry; ids: string[] } | null {
  const positions: number[] = [];
  const ids: string[] = [];
  for (const country of countries) {
    if (!country.locator || exclude?.has(country.id)) continue;
    positions.push(...toSphere(country.locator[0], country.locator[1], LOCATOR_RADIUS));
    ids.push(country.id);
  }
  if (!positions.length) return null;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  return { geometry, ids };
}

/**
 * A round point sprite, drawn once at startup. `PointsMaterial` renders square
 * quads by default, which reads as a programming artefact rather than as
 * cartography. Procedural, tiny and cached — not an asset download.
 */
function createDiscTexture(): CanvasTexture | null {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.beginPath();
  context.arc(16, 16, 14, 0, Math.PI * 2);
  context.fillStyle = '#ffffff';
  context.fill();
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

interface Layer {
  group: Group;
  meshes: Map<string, Mesh>;
  borders: LineSegments;
  locators: Points | null;
}

export function createGlobeScene(container: HTMLElement, base: GlobeAsset): GlobeHandle {
  const canvas = document.createElement('canvas');
  canvas.className = 'spatial-stage__canvas';
  // The canvas is a pointer and visual surface only. Every action it offers has
  // a real DOM control beside it, so exposing an unlabelled canvas to assistive
  // technology would add noise, not access.
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
  } catch (cause) {
    canvas.remove();
    throw new WebGLUnavailableError(String(cause));
  }
  if (!renderer.getContext()) {
    canvas.remove();
    throw new WebGLUnavailableError('No WebGL context.');
  }

  /**
   * Adaptive DPR. A 3x phone panel triples fragment cost for no legibility gain
   * on flat-shaded vector geography, so the ceiling starts at 2 and drops if
   * frames stay slow — sustained cost is reduced rather than merely capped.
   */
  let dprCeiling = 2;
  let slowFrames = 0;
  const dpr = () => Math.min(window.devicePixelRatio || 1, dprCeiling);
  renderer.setPixelRatio(dpr());
  renderer.setClearColor(new Color(PALETTE.space), 1);

  const scene = new Scene();
  const camera = new PerspectiveCamera(GLOBE_FOV, 1, 0.01, 100);

  const oceanGeometry = new SphereGeometry(OCEAN_RADIUS, 96, 64);
  const oceanMaterial = new MeshBasicMaterial({ color: PALETTE.ocean });
  const ocean = new Mesh(oceanGeometry, oceanMaterial);
  scene.add(ocean);

  // One shared material per state for every country on the planet. A state
  // change swaps a reference; it never allocates.
  const materials = {
    ordinary: new MeshBasicMaterial({ color: PALETTE.ordinary, side: DoubleSide }),
    active: new MeshBasicMaterial({ color: PALETTE.active, side: DoubleSide }),
    dimmed: new MeshBasicMaterial({ color: PALETTE.dimmed, side: DoubleSide }),
    unavailable: new MeshBasicMaterial({ color: PALETTE.unavailable, side: DoubleSide }),
    mastered: new MeshBasicMaterial({ color: PALETTE.mastered, side: DoubleSide }),
    complete: new MeshBasicMaterial({ color: PALETTE.complete, side: DoubleSide }),
  } satisfies Record<CountryState, MeshBasicMaterial>;

  const borderMaterial = new LineBasicMaterial({ color: PALETTE.border, transparent: true, opacity: 0.85 });
  // A locator says "a country exists here". It is the least important thing on
  // screen and must not out-shout the geography, so it takes the border tone
  // rather than Atlas Blue, which is reserved for action and selection.
  const disc = createDiscTexture();
  const locatorMaterial = new PointsMaterial({
    color: PALETTE.border,
    size: 4,
    sizeAttenuation: false,
    map: disc,
    transparent: true,
    alphaTest: 0.5,
  });

  function buildLayer(asset: GlobeAsset, detail: boolean, exclude?: ReadonlySet<string>): Layer {
    const landRadius = detail ? DETAIL_LAND_RADIUS : LAND_RADIUS;
    const group = new Group();
    const meshes = new Map<string, Mesh>();
    for (const country of asset.countries) {
      const geometry = buildCountryGeometry(country, landRadius);
      if (!geometry) continue;
      const mesh = new Mesh(geometry, materials.ordinary);
      mesh.userData.countryId = country.id;
      meshes.set(country.id, mesh);
      group.add(mesh);
    }
    const borders = new LineSegments(
      buildBorderGeometry(asset.countries, detail ? DETAIL_BORDER_RADIUS : BORDER_RADIUS, exclude),
      borderMaterial,
    );
    group.add(borders);
    const locatorData = buildLocatorGeometry(asset.countries, exclude);
    const locators = locatorData ? new Points(locatorData.geometry, locatorMaterial) : null;
    if (locators) group.add(locators);
    scene.add(group);
    return { group, meshes, borders, locators };
  }

  function disposeLayer(layer: Layer) {
    for (const mesh of layer.meshes.values()) mesh.geometry.dispose();
    layer.borders.geometry.dispose();
    layer.locators?.geometry.dispose();
    scene.remove(layer.group);
    layer.group.clear();
  }

  const baseLayer = buildLayer(base, false);
  let detailLayer: Layer | null = null;
  let detailLod: string | null = null;
  let states: CountryPresentation = new Map();

  /**
   * Borders and locators are merged buffers, so a covered country cannot simply
   * be hidden the way its mesh can. Rebuilding the base layer's lines without
   * the detail layer's countries is what stops a coarse world outline showing
   * through beside the finer one it was replaced by — a visible double stroke,
   * and a stray world locator dot sitting on top of real detail geometry.
   *
   * It runs once per continent entry over a buffer of a few tens of thousands of
   * vertices, not per frame.
   */
  function rebuildBaseLines(exclude?: ReadonlySet<string>) {
    baseLayer.borders.geometry.dispose();
    baseLayer.borders.geometry = buildBorderGeometry(base.countries, BORDER_RADIUS, exclude);
    if (baseLayer.locators) {
      baseLayer.group.remove(baseLayer.locators);
      baseLayer.locators.geometry.dispose();
      baseLayer.locators = null;
    }
    const locatorData = buildLocatorGeometry(base.countries, exclude);
    if (locatorData) {
      baseLayer.locators = new Points(locatorData.geometry, locatorMaterial);
      baseLayer.group.add(baseLayer.locators);
    }
  }

  /**
   * Applies presentation to whichever layer currently owns each country. Detail
   * meshes hide their base counterparts rather than replacing them, so a
   * detail asset can be disposed without rebuilding anything.
   */
  function applyStates() {
    for (const [id, mesh] of baseLayer.meshes) {
      const owned = detailLayer?.meshes.has(id) ?? false;
      mesh.visible = !owned;
      mesh.material = materials[states.get(id) ?? 'ordinary'];
    }
    if (detailLayer) {
      for (const [id, mesh] of detailLayer.meshes) mesh.material = materials[states.get(id) ?? 'ordinary'];
    }
  }

  const markerMaterial = new PointsMaterial({
    color: PALETTE.marker,
    size: 7,
    sizeAttenuation: false,
    map: disc,
    transparent: true,
    alphaTest: 0.5,
  });
  let markers: Points | null = null;
  let markerKey = '';

  const raycaster = new Raycaster();
  const pointer = new Vector2();
  let renderPending = false;
  let disposed = false;
  let active = true;
  let contextLost = false;

  function render() {
    renderPending = false;
    if (disposed || !active || contextLost) return;
    const started = performance.now();
    renderer.render(scene, camera);
    // A frame that takes longer than roughly two 60 Hz budgets, repeatedly, is
    // a device telling us the resolution is too high for it.
    if (performance.now() - started > 32) slowFrames += 1;
    else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames >= 8 && dprCeiling > 1) {
      dprCeiling = 1;
      slowFrames = 0;
      renderer.setPixelRatio(dpr());
      resize();
    }
  }

  /** Render on demand. Nothing spins while the globe is idle. */
  function requestRender() {
    if (renderPending || disposed || !active) return;
    renderPending = true;
    requestAnimationFrame(render);
  }

  function resize() {
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setPixelRatio(dpr());
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestRender();
  }

  // A lost context must recover, not leave a dead canvas on screen.
  const onContextLost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    container.dataset.contextLost = 'true';
  };
  const onContextRestored = () => {
    contextLost = false;
    delete container.dataset.contextLost;
    resize();
    requestRender();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  resize();

  return {
    canvas,
    get aspect() { return camera.aspect; },

    setCamera(lon, lat, distance) {
      const [x, y, z] = toSphere(lon, lat, distance);
      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      requestRender();
    },

    setCountryStates(next) {
      states = next;
      applyStates();
      requestRender();
    },

    setDetail(asset) {
      if ((asset?.lod ?? null) === detailLod) return;
      if (detailLayer) { disposeLayer(detailLayer); detailLayer = null; }
      detailLod = asset?.lod ?? null;
      if (asset) {
        const covered = new Set(asset.countries.map((country) => country.id));
        detailLayer = buildLayer(asset, true);
        rebuildBaseLines(covered);
      } else {
        rebuildBaseLines();
      }
      applyStates();
      requestRender();
    },

    /**
     * Picking runs against the OCEAN SPHERE, not against country meshes: one
     * ray/sphere test yields a geographic position, and identity is then
     * resolved from source rings by `GeographyIndex`. That keeps identity
     * independent of tessellation, makes locator-only countries selectable, and
     * keeps the expensive part testable in plain Node.
     */
    pickAt(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(ocean, false)[0];
      if (!hit) return null;
      const [lon, lat] = fromSphere(hit.point.x, hit.point.y, hit.point.z);
      return { countryId: null, lon, lat };
    },

    setScopeMarkers(points) {
      const key = points.map(([lon, lat]) => `${lon},${lat}`).join(';');
      if (key === markerKey) return;
      markerKey = key;
      if (markers) {
        scene.remove(markers);
        markers.geometry.dispose();
        markers = null;
      }
      if (points.length) {
        const positions: number[] = [];
        for (const [lon, lat] of points) positions.push(...toSphere(lon, lat, MARKER_RADIUS));
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
        markers = new Points(geometry, markerMaterial);
        scene.add(markers);
      }
      requestRender();
    },

    resize,
    requestRender,

    setActive(next) {
      if (active === next) return;
      active = next;
      if (active) { resize(); requestRender(); }
    },

    dispose() {
      disposed = true;
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      if (detailLayer) disposeLayer(detailLayer);
      disposeLayer(baseLayer);
      markers?.geometry.dispose();
      markerMaterial.dispose();
      disc?.dispose();
      for (const material of Object.values(materials)) material.dispose();
      borderMaterial.dispose();
      locatorMaterial.dispose();
      oceanGeometry.dispose();
      oceanMaterial.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
