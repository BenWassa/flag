/**
 * Issue #119 spatial prototype — persistent globe scene.
 *
 * Plain Three.js, deliberately. React Three Fiber is the issue's *preferred*
 * stack, but F2 (renderer architecture) is a decision reserved for a principal
 * session and the renderer comparison is still PARKED/AMBER. Building the spike
 * on R3F would read as having taken that decision. Plain Three also sidesteps
 * the open R3F StrictMode context-loss report (#3863) and keeps the render loop
 * fully under our control, which is what makes render-on-demand provable.
 *
 * Performance posture, per the issue's PWA constraints:
 *   - the scene is created once and never rebuilt on navigation;
 *   - rendering is on demand — no rAF loop spins while the globe is idle;
 *   - device pixel ratio is capped;
 *   - materials are shared instances, swapped by reference per country;
 *   - WebGL context loss is handled rather than left to blank the canvas.
 *
 * No textures, no terrain, no photographic Earth, no starfield. DESIGN.md
 * excludes that aesthetic and the issue restates it.
 */

import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  DoubleSide,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  WebGLRenderer,
} from 'three';
import { Earcut } from 'three/src/extras/Earcut.js';
import { subdivide, toSphere, type GlobeAsset, type GlobeCountry } from './geo.js';

const OCEAN_RADIUS = 1;
const LAND_RADIUS = 1.0015;
const BORDER_RADIUS = 1.003;
const LOCATOR_RADIUS = 1.006;

/** Longest triangle edge, in degrees, before a face is split onto the sphere. */
const MAX_EDGE_DEG = 6;

export type CountryState = 'ordinary' | 'active' | 'dimmed';

/**
 * Production cartography tokens, not invented ones. These are the same values
 * `atlas-theme.css` gives the 2D maps, so the globe reads as the same product:
 * --map-ocean, --map-context-land, --map-active-land, --map-context-border.
 *
 * `space` is the page canvas rather than the ocean colour, so the planet has a
 * silhouette and reads as an object. It is not a decorative starfield.
 */
const PALETTE = {
  space: 0xf6f8fb,
  ocean: 0xdceaf5,
  /** Neutral land, before any scope is chosen. */
  land: 0xdfe6ef,
  /** In-scope land — production's --map-active-land. */
  landActive: 0xf8fafc,
  /** Out-of-scope context — production's --map-context-land. */
  landDimmed: 0xd2dae5,
  border: 0x7b899b,
  /* A locator says "a country exists here". It is the least important thing on
     screen and must not out-shout the geography, so it takes the border tone
     rather than Atlas Blue — which is reserved for action and selection. */
  locator: 0x7b899b,
};

export interface GlobeHandle {
  readonly canvas: HTMLCanvasElement;
  /** Places the camera. Longitude/latitude in degrees, distance in sphere radii. */
  setCamera(lon: number, lat: number, distance: number): void;
  setCountryStates(states: Map<string, CountryState>): void;
  /** ISO3 under a client-space point, or null. */
  pick(clientX: number, clientY: number): string | null;
  resize(): void;
  requestRender(): void;
  dispose(): void;
  readonly aspect: number;
  readonly countryIds: readonly string[];
}

export class WebGLUnavailableError extends Error {}

function buildCountryGeometry(country: GlobeCountry): BufferGeometry | null {
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
    const triangles: Array<[[number, number], [number, number], [number, number]]> = [];
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
      // Winding is not normalised here. Earcut's output orientation depends on
      // the source ring order, which Natural Earth does not guarantee to be
      // consistent across features, so the land materials are DoubleSide rather
      // than relying on every ring being wound the same way. Back-face culling
      // would otherwise silently delete whichever countries came out reversed.
      for (const [lon, lat] of [a, b, c]) positions.push(...toSphere(lon, lat, LAND_RADIUS));
    }
  }
  if (!positions.length) return null;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function buildBorderGeometry(countries: GlobeCountry[]): BufferGeometry {
  const positions: number[] = [];
  for (const country of countries) {
    for (const polygon of country.polygons) {
      for (const ring of polygon) {
        for (let i = 0; i < ring.length; i += 1) {
          const from = ring[i];
          const to = ring[(i + 1) % ring.length];
          positions.push(...toSphere(from[0], from[1], BORDER_RADIUS));
          positions.push(...toSphere(to[0], to[1], BORDER_RADIUS));
        }
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  return geometry;
}

export function createGlobe(container: HTMLElement, asset: GlobeAsset): GlobeHandle {
  const canvas = document.createElement('canvas');
  canvas.className = 'globe-canvas';
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

  // Capped DPR: a 3x phone panel triples fragment cost for no legibility gain
  // on flat-shaded vector geography.
  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr());
  renderer.setClearColor(new Color(PALETTE.space), 1);

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.01, 100);

  const ocean = new Mesh(
    new SphereGeometry(OCEAN_RADIUS, 96, 64),
    new MeshBasicMaterial({ color: PALETTE.ocean }),
  );
  scene.add(ocean);

  // Three shared materials for every country. State changes swap a reference,
  // they do not allocate.
  const materials: Record<CountryState, MeshBasicMaterial> = {
    ordinary: new MeshBasicMaterial({ color: PALETTE.land, side: DoubleSide }),
    active: new MeshBasicMaterial({ color: PALETTE.landActive, side: DoubleSide }),
    dimmed: new MeshBasicMaterial({ color: PALETTE.landDimmed, side: DoubleSide }),
  };

  const land = new Group();
  const meshes = new Map<string, Mesh>();
  const locatorPoints: number[] = [];
  const locatorIds: string[] = [];
  for (const country of asset.countries) {
    if (country.locator) {
      locatorPoints.push(...toSphere(country.locator[0], country.locator[1], LOCATOR_RADIUS));
      locatorIds.push(country.id);
      continue;
    }
    const geometry = buildCountryGeometry(country);
    if (!geometry) continue;
    const mesh = new Mesh(geometry, materials.ordinary);
    mesh.userData.countryId = country.id;
    meshes.set(country.id, mesh);
    land.add(mesh);
  }
  scene.add(land);

  const borders = new LineSegments(
    buildBorderGeometry(asset.countries),
    new LineBasicMaterial({ color: PALETTE.border, transparent: true, opacity: 0.85 }),
  );
  scene.add(borders);

  // Locator marks keep microstates present and selectable rather than letting
  // simplification quietly delete part of the curriculum.
  let locators: Points | null = null;
  if (locatorPoints.length) {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(locatorPoints), 3));
    // Small: a locator marks that a country exists here, it must not outweigh
    // the geography around it.
    locators = new Points(geometry, new PointsMaterial({ color: PALETTE.locator, size: 3, sizeAttenuation: false }));
    scene.add(locators);
  }

  const raycaster = new Raycaster();
  const pointer = new Vector2();
  let renderPending = false;
  let disposed = false;

  function render() {
    renderPending = false;
    if (disposed) return;
    renderer.render(scene, camera);
  }

  /** Render on demand. Nothing spins while the globe is idle. */
  function requestRender() {
    if (renderPending || disposed) return;
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
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    container.dataset.contextLost = 'true';
  });
  canvas.addEventListener('webglcontextrestored', () => {
    delete container.dataset.contextLost;
    resize();
    requestRender();
  });

  resize();

  return {
    canvas,
    get aspect() { return camera.aspect; },
    get countryIds() { return [...meshes.keys(), ...locatorIds]; },
    setCamera(lon, lat, distance) {
      const [x, y, z] = toSphere(lon, lat, distance);
      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      requestRender();
    },
    setCountryStates(states) {
      let changed = false;
      for (const [id, mesh] of meshes) {
        const next = materials[states.get(id) ?? 'ordinary'];
        if (mesh.material !== next) { mesh.material = next; changed = true; }
      }
      if (changed) requestRender();
    },
    pick(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(land.children, false);
      return hits.length ? (hits[0].object.userData.countryId as string) ?? null : null;
    },
    resize,
    requestRender,
    dispose() {
      disposed = true;
      for (const mesh of meshes.values()) mesh.geometry.dispose();
      for (const material of Object.values(materials)) material.dispose();
      borders.geometry.dispose();
      (borders.material as LineBasicMaterial).dispose();
      locators?.geometry.dispose();
      ocean.geometry.dispose();
      (ocean.material as MeshBasicMaterial).dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
