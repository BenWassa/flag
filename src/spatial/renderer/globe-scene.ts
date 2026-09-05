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
 * No textures, no terrain, no photographic Earth, no starfield. The one lit
 * element is a procedural atmosphere rim: a single back-face sphere whose
 * fragment cost is confined to the annulus outside the planet's silhouette,
 * because every fragment inside it fails the depth test against the opaque
 * globe. It is what makes flat-shaded vector geography read as a planet rather
 * than as a sticker, and it ships no bytes.
 */

import {
  AdditiveBlending,
  BackSide,
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
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { Earcut } from 'three/src/extras/Earcut.js';
import { boundarySegments, buildBoundaryTopology, type BoundaryTopology } from '../disclosure.js';
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
/** The emphasised outline sits just above the boundary it is one of. */
const EMPHASIS_LIFT = 0.0004;
const LOCATOR_RADIUS = 1.006;
/** Where a projected DOM label is anchored: just clear of the highest mark. */
const LABEL_RADIUS = 1.01;
const MARKER_RADIUS = 1.008;
/**
 * The atmosphere shell. Everything of it that falls inside the planet's own
 * silhouette is discarded by the depth test against the opaque globe, so the
 * visible result is the thin lit annulus at the limb and nothing else.
 */
const ATMOSPHERE_RADIUS = 1.075;

/** Longest triangle edge, in degrees, before a face is split onto the sphere. */
const MAX_EDGE_DEG = 6;

export const GLOBE_FOV = 38;

/**
 * Production cartography, not invented colour. Land is green and water is blue,
 * exactly as `atlas-theme.css` paints the 2D maps, so the globe reads as the
 * same product. The globe's greens run one step more saturated than the 2D
 * tokens because they sit on a deep ocean against night rather than on a light
 * page, and the same step keeps the two surfaces looking identically lit.
 *
 * `space` is night rather than the page canvas: a planet needs a ground darker
 * than its own oceans to have a silhouette at all. It is still not a starfield.
 */
const PALETTE: Record<
  'space' | 'ocean' | 'border' | 'emphasis' | 'marker' | 'markerHalo' | 'locator' | 'atmosphere',
  number
> & Record<CountryState, number> = {
  space: 0x0a1725,          // --map-space
  ocean: 0x164964,          // --map-ocean-deep
  atmosphere: 0x4fa3d1,     // --map-atmosphere
  /* Coastlines and boundaries are one merged buffer, so this single dark green
     draws both. It has to separate land from land and land from ocean. Which
     boundaries exist at all is the progressive-disclosure question (#197); this
     is only what one of them looks like. */
  border: 0x3f5b45,
  /* The one selected area, drawn a step deeper than the areas beside it. It is
     never the only signal: the land inside it is already the in-scope tone and
     the DOM names it in words. */
  emphasis: 0x1e3326,
  /* Scope emphasis is still Atlas Blue, and still only for countries too small
     to read at the current frame. The halo beneath it is what lets one dot stay
     legible over deep ocean and over pale in-scope land alike. */
  marker: 0x7ab4ff,
  markerHalo: 0xf2f7ea,
  /* The quiet "a country exists here" dot of the world view. */
  locator: 0xdbe7d2,
  ordinary: 0x7fb574,
  active: 0xc7e5a8,
  dimmed: 0x557a56,
  /* Unsupported geography is legible for orientation but visibly not a
     surface you can play: it is the one land that is grey rather than green,
     and it is never accompanied by a progress figure. */
  unavailable: 0x6f7e77,
  mastered: 0xa98ce0,       // --map-mastery
  complete: 0xd8a73c,       // --map-prestige
};

export type CountryPresentation = ReadonlyMap<string, CountryState>;

export interface GlobePick {
  /** ISO3 under the point, or null over water. */
  countryId: string | null;
  lon: number;
  lat: number;
}

/**
 * Issue #197 — how much political boundary the Earth is currently drawing.
 *
 * The scene owns no taxonomy: it is told which countries belong together and
 * draws the edges of those groups. A grouping with every country on its own is
 * ordinary country borders, so the levels are one mechanism rather than three
 * code paths.
 */
export interface BoundaryPlan {
  /** Stable identity for this plan. Equal keys reuse the built buffers. */
  key: string;
  /** Group id per country. A country with no entry stands as its own group. */
  groupOf: ReadonlyMap<string, string>;
  /** Groups whose own outline is drawn a step stronger than the rest. */
  emphasis: ReadonlySet<string>;
  /** Whether country locator dots belong to this level of detail. */
  locators: boolean;
}

/** A geographic anchor placed in the stage's own CSS pixel space. */
export interface ProjectedPoint {
  x: number;
  y: number;
  /** False when the anchor is round the back of the planet. */
  facing: boolean;
}

export interface GlobeHandle {
  readonly canvas: HTMLCanvasElement;
  readonly aspect: number;
  /** Places the camera. Longitude/latitude in degrees, distance in sphere radii. */
  setCamera(lon: number, lat: number, distance: number): void;
  setCountryStates(states: CountryPresentation): void;
  /** Mounts a higher-detail asset over the base meshes for its countries. */
  setDetail(asset: GlobeAsset | null): void;
  /** Sets which political boundaries the geography draws. */
  setBoundaries(plan: BoundaryPlan): void;
  /** Places a geographic anchor in stage pixels, for a real DOM control over it. */
  project(lon: number, lat: number): ProjectedPoint;
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

/**
 * Line geometry for the boundaries of one grouping.
 *
 * `boundarySegments` decides WHICH edges survive — an edge two countries of the
 * same group share is interior and is dropped — and this only lifts the result
 * onto the sphere. `emphasised` picks one half of that same derivation, so the
 * two strengths are one grouping rather than two passes that could disagree.
 */
function buildBoundaryGeometry(
  topology: BoundaryTopology,
  radius: number,
  plan: BoundaryPlan,
  emphasised: boolean,
  exclude?: ReadonlySet<string>,
): BufferGeometry {
  const segments = emphasised && plan.emphasis.size === 0 ? [] : boundarySegments(topology, {
    groupOf: (id) => plan.groupOf.get(id) ?? id,
    emphasis: plan.emphasis,
    emphasised,
    exclude,
  });
  const positions: number[] = [];
  for (let i = 0; i + 3 < segments.length; i += 4) {
    positions.push(...toSphere(segments[i], segments[i + 1], radius));
    positions.push(...toSphere(segments[i + 2], segments[i + 3], radius));
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
 *
 * The darker rim is not decoration. A point material multiplies this texture by
 * its own colour, so a mid-grey ring resolves to a darkened edge of whichever
 * colour the dot carries, and one dot stays separable over pale in-scope land
 * and over deep ocean without needing a second colour per ground.
 */
function createDiscTexture(): CanvasTexture | null {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.beginPath();
  context.arc(16, 16, 13, 0, Math.PI * 2);
  context.fillStyle = '#ffffff';
  context.fill();
  context.lineWidth = 3.5;
  context.strokeStyle = '#585858';
  context.stroke();
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Fresnel atmosphere. Rendered on the back faces of a slightly larger sphere,
 * so the term is strongest exactly at the limb and the depth test throws away
 * everything the planet already covers.
 */
const ATMOSPHERE_VERTEX_SHADER = `
varying vec3 vNormalW;
varying vec3 vViewDir;
void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vViewDir = normalize(cameraPosition - worldPosition.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const ATMOSPHERE_FRAGMENT_SHADER = `
uniform vec3 uColor;
uniform float uStrength;
varying vec3 vNormalW;
varying vec3 vViewDir;
void main() {
  float rim = 1.0 - abs(dot(normalize(vNormalW), normalize(vViewDir)));
  float intensity = pow(clamp(rim, 0.0, 1.0), 3.0) * uStrength;
  gl_FragColor = vec4(uColor * intensity, intensity);
}
`;

interface Layer {
  group: Group;
  meshes: Map<string, Mesh>;
  /** Boundaries of the current grouping, and the emphasised one among them. */
  borders: LineSegments;
  emphasis: LineSegments;
  locators: Points | null;
  /** Which segments this asset's countries share. Derived once per asset. */
  topology: BoundaryTopology;
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

  // Additive and depth-write-free, so it lights the night around the limb
  // without ever occluding geography or joining the picking surface.
  const atmosphereGeometry = new SphereGeometry(ATMOSPHERE_RADIUS, 48, 32);
  const atmosphereMaterial = new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(PALETTE.atmosphere) },
      uStrength: { value: 0.9 },
    },
    vertexShader: ATMOSPHERE_VERTEX_SHADER,
    fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
    side: BackSide,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const atmosphere = new Mesh(atmosphereGeometry, atmosphereMaterial);
  scene.add(atmosphere);

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
  // One step stronger, for the single area the learner has selected. WebGL line
  // width is not portable, so weight comes from tone rather than thickness.
  const emphasisMaterial = new LineBasicMaterial({ color: PALETTE.emphasis });
  // A locator says "a country exists here". It is the least important thing on
  // screen and must not out-shout the geography, so it takes a pale cartographic
  // tone rather than Atlas Blue, which is reserved for action and selection.
  const disc = createDiscTexture();
  const locatorMaterial = new PointsMaterial({
    color: PALETTE.locator,
    size: 4,
    sizeAttenuation: false,
    map: disc,
    transparent: true,
    alphaTest: 0.5,
  });

  function buildLayer(asset: GlobeAsset, detail: boolean): Layer {
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
    const borders = new LineSegments(new BufferGeometry(), borderMaterial);
    const emphasis = new LineSegments(new BufferGeometry(), emphasisMaterial);
    emphasis.renderOrder = 1;
    group.add(borders, emphasis);
    scene.add(group);
    return { group, meshes, borders, emphasis, locators: null, topology: buildBoundaryTopology(asset.countries) };
  }

  function disposeLayer(layer: Layer) {
    for (const mesh of layer.meshes.values()) mesh.geometry.dispose();
    layer.borders.geometry.dispose();
    layer.emphasis.geometry.dispose();
    layer.locators?.geometry.dispose();
    scene.remove(layer.group);
    layer.group.clear();
  }

  const baseLayer = buildLayer(base, false);
  let detailLayer: Layer | null = null;
  let detailAsset: GlobeAsset | null = null;
  let detailLod: string | null = null;
  let states: CountryPresentation = new Map();
  /**
   * Country borders everywhere is the geometry the scene starts with, so a first
   * frame drawn before the application has said anything is still truthful
   * cartography. The first `setBoundaries` replaces it.
   */
  let plan: BoundaryPlan = { key: 'country', groupOf: new Map(), emphasis: new Set(), locators: true };
  let linesKey = '';

  /**
   * Rebuilds every boundary buffer for the current plan and LOD.
   *
   * Boundaries and locators are merged buffers, so a covered country cannot
   * simply be hidden the way its mesh can. Excluding the detail layer's
   * countries from the base layer is what stops a coarse world outline showing
   * through beside the finer one it replaced — a visible double stroke, and a
   * stray world locator dot sitting on top of real detail geometry.
   *
   * Guarded by the plan's key, so it runs once per navigation over a buffer of a
   * few tens of thousands of vertices, never per frame.
   */
  function rebuildLines() {
    const key = `${plan.key}|${detailLod ?? ''}`;
    if (key === linesKey) return;
    linesKey = key;
    const covered = detailAsset ? new Set(detailAsset.countries.map((country) => country.id)) : undefined;

    baseLayer.borders.geometry.dispose();
    baseLayer.borders.geometry = buildBoundaryGeometry(baseLayer.topology, BORDER_RADIUS, plan, false, covered);
    baseLayer.emphasis.geometry.dispose();
    baseLayer.emphasis.geometry = buildBoundaryGeometry(baseLayer.topology, BORDER_RADIUS + EMPHASIS_LIFT, plan, true, covered);

    if (detailLayer) {
      detailLayer.borders.geometry.dispose();
      detailLayer.borders.geometry = buildBoundaryGeometry(detailLayer.topology, DETAIL_BORDER_RADIUS, plan, false);
      detailLayer.emphasis.geometry.dispose();
      detailLayer.emphasis.geometry = buildBoundaryGeometry(detailLayer.topology, DETAIL_BORDER_RADIUS + EMPHASIS_LIFT, plan, true);
    }

    if (baseLayer.locators) {
      baseLayer.group.remove(baseLayer.locators);
      baseLayer.locators.geometry.dispose();
      baseLayer.locators = null;
    }
    // A locator says "a country exists here", which is country detail: it belongs
    // to the levels that draw countries, not to continent or area navigation.
    const locatorData = plan.locators ? buildLocatorGeometry(base.countries, covered) : null;
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

  /*
   * A scope marker is two coincident dots: a pale halo and the Atlas Blue core
   * over it. One dot cannot stay legible over both deep ocean and pale in-scope
   * land, and giving the marker a second colour per ground would make the same
   * mark mean two things. The halo skips the depth write so the core, drawn at
   * exactly the same depth, is not rejected by it.
   */
  const markerHaloMaterial = new PointsMaterial({
    color: PALETTE.markerHalo,
    size: 12,
    sizeAttenuation: false,
    map: disc,
    transparent: true,
    alphaTest: 0.5,
    depthWrite: false,
  });
  const markerMaterial = new PointsMaterial({
    color: PALETTE.marker,
    size: 6.5,
    sizeAttenuation: false,
    map: disc,
    transparent: true,
    alphaTest: 0.5,
  });
  let markers: Group | null = null;
  let markerGeometry: BufferGeometry | null = null;
  let markerKey = '';

  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const projected = new Vector3();
  const viewport = { width: 1, height: 1 };
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
    // Kept so projecting an anchor never reads layout: a name is re-projected
    // on every frame of camera travel, and a forced reflow per name per frame
    // is exactly the cost the render-on-demand design exists to avoid.
    viewport.width = width;
    viewport.height = height;
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
      detailAsset = asset;
      if (asset) detailLayer = buildLayer(asset, true);
      linesKey = '';
      rebuildLines();
      applyStates();
      requestRender();
    },

    setBoundaries(next) {
      plan = next;
      rebuildLines();
      requestRender();
    },

    /**
     * Where a geographic anchor lands on screen, and whether the planet is in
     * the way. The label itself is real DOM positioned from this; nothing here
     * draws text, and the scene never learns what a scope is called.
     */
    project(lon, lat) {
      const [x, y, z] = toSphere(lon, lat, LABEL_RADIUS);
      projected.set(x, y, z);
      const distance = camera.position.length() || 1;
      // An anchor is visible while it is nearer the camera than the horizon
      // circle, with a small margin so a name never smears along the limb.
      const cosine = projected.dot(camera.position) / (LABEL_RADIUS * distance);
      const facing = cosine > 1 / distance + 0.06;
      projected.project(camera);
      return {
        x: (projected.x * 0.5 + 0.5) * viewport.width,
        y: (-projected.y * 0.5 + 0.5) * viewport.height,
        facing,
      };
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
        markers.clear();
        markerGeometry?.dispose();
        markerGeometry = null;
        markers = null;
      }
      if (points.length) {
        const positions: number[] = [];
        for (const [lon, lat] of points) positions.push(...toSphere(lon, lat, MARKER_RADIUS));
        markerGeometry = new BufferGeometry();
        markerGeometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
        const halo = new Points(markerGeometry, markerHaloMaterial);
        halo.renderOrder = 1;
        const core = new Points(markerGeometry, markerMaterial);
        core.renderOrder = 2;
        markers = new Group();
        markers.add(halo, core);
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
      markerGeometry?.dispose();
      markerHaloMaterial.dispose();
      markerMaterial.dispose();
      disc?.dispose();
      for (const material of Object.values(materials)) material.dispose();
      borderMaterial.dispose();
      emphasisMaterial.dispose();
      locatorMaterial.dispose();
      oceanGeometry.dispose();
      oceanMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
