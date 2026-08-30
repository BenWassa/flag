/**
 * Issue #119 — Stage 1 cheap 2D continuity probe.
 *
 * DISPOSABLE. This is not production navigation and must never become it. It
 * exists to test exactly one hypothesis (H1): does a continuous, camera-like
 * traversal of the existing scope hierarchy feel materially better on a phone
 * than the current one-tap screen replacement?
 *
 * It deliberately uses only what production already ships:
 *
 *   - the real typed router and browser history (`createHashRouter`);
 *   - the real generated Africa `MapRegionAsset` geography;
 *   - the real scope configuration for region membership;
 *   - existing design tokens from the production stylesheets.
 *
 * It deliberately does NOT use Three.js, React Three Fiber, MapLibre, spherical
 * geometry, a second navigation state machine, or any learning/progress state.
 * The camera is a plain interpolated SVG viewBox.
 *
 * Known honest limitation: Atlas has no 2D world geography asset, so the
 * "world / domain" level is represented by the full Africa canvas at its widest
 * extent rather than a real globe. The probe therefore tests continuity between
 * *scope levels*, which is the load-bearing half of H1. It does not test whether
 * a sphere adds orientation value — that is H2, and is deliberately out of scope.
 */

import { getMapContinentConfig } from '../../../src/data/map-scopes.js';
import { loadMapAsset } from '../../../src/data/maps/index.js';
import type { MapRegionAsset, MapViewportFocus } from '../../../src/domain/map-models.js';
import { createHashRouter } from '../../../src/routing/router.js';
import { parentRoute, serializeRoutePath, type AppRoute } from '../../../src/routing/routes.js';

const CONTINENT_ID = 'africa';
const DOMAIN = 'flags';

/** Camera travel time. Long enough to read as movement, short enough to not become a cutscene. */
const TRAVEL_MS = 620;

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Box { x: number; y: number; width: number; height: number }

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
/** Decelerating curve. Movement should respond immediately and settle, not ease in. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function parseViewBox(value: string): Box {
  const [x, y, width, height] = value.trim().split(/\s+/).map(Number);
  return { x, y, width, height };
}

function padded(box: Box, factor: number): Box {
  const dx = box.width * factor;
  const dy = box.height * factor;
  return { x: box.x - dx, y: box.y - dy, width: box.width + dx * 2, height: box.height + dy * 2 };
}

/**
 * Match the camera's aspect ratio to the viewport so a region frame does not
 * distort on a tall phone. Expands the short axis; never crops geography.
 */
function fitToViewport(box: Box, aspect: number): Box {
  const boxAspect = box.width / box.height;
  if (boxAspect > aspect) {
    const height = box.width / aspect;
    return { ...box, y: box.y - (height - box.height) / 2, height };
  }
  const width = box.height * aspect;
  return { ...box, x: box.x - (width - box.width) / 2, width };
}

function unionBoxes(boxes: Box[]): Box | null {
  if (!boxes.length) return null;
  const minX = Math.min(...boxes.map((b) => b.x));
  const minY = Math.min(...boxes.map((b) => b.y));
  const maxX = Math.max(...boxes.map((b) => b.x + b.width));
  const maxY = Math.max(...boxes.map((b) => b.y + b.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

interface RegionModel { id: string; label: string; countryIds: readonly string[]; box: Box }

async function main() {
  const host = document.querySelector<HTMLElement>('#probe')!;
  const asset = await loadMapAsset(CONTINENT_ID);
  const continent = getMapContinentConfig(CONTINENT_ID);
  if (!asset || !continent) {
    host.textContent = 'Could not load Africa geography.';
    return;
  }

  const canvas = parseViewBox(asset.viewBox);
  const mapAsset = asset;
  host.innerHTML = shell(mapAsset);

  const svg = host.querySelector<SVGSVGElement>('#probe-map')!;
  const stage = host.querySelector<HTMLElement>('.probe-stage')!;
  const scopeBar = host.querySelector<HTMLElement>('.probe-scopes')!;
  const crumb = host.querySelector<HTMLElement>('.probe-crumb')!;
  const activity = host.querySelector<HTMLElement>('.probe-activity')!;
  const status = host.querySelector<HTMLElement>('.probe-status')!;

  // Region frames come from the real rendered geometry, not a hand-authored table.
  const regions: RegionModel[] = continent.regions.flatMap((region) => {
    const id = region.scope.id;
    if (!id) return [];
    const boxes = region.countryIds.flatMap((countryId) => {
      const node = svg.querySelector<SVGGraphicsElement>(`[data-country="${CSS.escape(countryId)}"]`);
      if (!node) return [];
      const bbox = node.getBBox();
      return bbox.width && bbox.height ? [{ x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height }] : [];
    });
    const box = unionBoxes(boxes);
    return box ? [{ id, label: region.scope.label, countryIds: region.countryIds, box }] : [];
  });

  const router = createHashRouter(window);

  const aspect = () => {
    const rect = stage.getBoundingClientRect();
    return rect.width && rect.height ? rect.width / rect.height : 1;
  };

  /** The camera is a pure function of the route. The route is always authoritative. */
  function targetFor(route: AppRoute | null): Box {
    const wide = fitToViewport(padded(canvas, 0.04), aspect());
    if (!route || route.name !== 'learning') return wide;
    if (!route.scope) return wide;
    if (route.scope.kind === 'continent') {
      const focus: MapViewportFocus | undefined = mapAsset.initialFocus;
      const base = focus ? { x: focus.x, y: focus.y, width: focus.width, height: focus.height } : canvas;
      return fitToViewport(padded(base, 0.03), aspect());
    }
    const region = regions.find((item) => item.id === route.scope?.id);
    return fitToViewport(padded(region ? region.box : canvas, 0.18), aspect());
  }

  let current: Box = targetFor(router.current());
  let target: Box = current;
  let from: Box = current;
  let startedAt = 0;
  let frame: number | null = null;

  const applyCamera = (box: Box) => {
    svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);
  };

  /**
   * Retargetable travel. A route change mid-flight moves the destination and the
   * camera continues from wherever it currently is, so motion is interruptible
   * and never has to finish before the next input is honoured.
   */
  function travelTo(next: Box, immediate: boolean) {
    target = next;
    if (immediate || reduceMotion()) {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      current = next;
      applyCamera(current);
      return;
    }
    from = current;
    startedAt = performance.now();
    if (frame !== null) return;
    const step = () => {
      const t = Math.min(1, (performance.now() - startedAt) / TRAVEL_MS);
      const eased = easeOut(t);
      current = {
        x: lerp(from.x, target.x, eased),
        y: lerp(from.y, target.y, eased),
        width: lerp(from.width, target.width, eased),
        height: lerp(from.height, target.height, eased),
      };
      applyCamera(current);
      if (t < 1) { frame = requestAnimationFrame(step); return; }
      frame = null;
    };
    frame = requestAnimationFrame(step);
  }

  let firstPaint = true;

  function render(route: AppRoute | null) {
    // Cold load and deep links initialise AT the destination. No cinematic replay
    // of the ancestor chain — that is an explicit Stage 1 requirement.
    travelTo(targetFor(route), firstPaint);
    firstPaint = false;

    const scopeId = route?.name === 'learning' ? route.scope?.id : undefined;
    const activityOpen = route?.name === 'learning' && route.activity !== undefined;

    for (const button of scopeBar.querySelectorAll<HTMLButtonElement>('[data-scope]')) {
      const active = button.dataset.scope === (scopeId ?? '');
      button.setAttribute('aria-current', active ? 'true' : 'false');
    }
    for (const node of svg.querySelectorAll<SVGGElement>('[data-region]')) {
      node.classList.toggle('is-active', node.dataset.region === scopeId);
      node.classList.toggle('is-dimmed', Boolean(scopeId) && node.dataset.region !== scopeId && scopeId !== CONTINENT_ID);
    }

    crumb.textContent = route ? serializeRoutePath(route) : '/';
    activity.hidden = !activityOpen;
    status.textContent = activityOpen
      ? 'Play-ready. This probe does not run a real round.'
      : scopeId && scopeId !== CONTINENT_ID
        ? `${regions.find((r) => r.id === scopeId)?.label ?? scopeId} framed. Choose Play, or go back.`
        : scopeId
          ? 'Africa framed. Choose a region.'
          : 'Choose Africa to begin.';
  }

  // Geography selection and the real DOM control dispatch the SAME action.
  const go = (route: AppRoute) => router.navigate(route);
  const regionRoute = (id: string): AppRoute => ({
    name: 'learning', domain: DOMAIN,
    scope: id === CONTINENT_ID
      ? { kind: 'continent', id: CONTINENT_ID, label: continent.scope.label }
      : { kind: 'region', id, label: regions.find((r) => r.id === id)?.label ?? id },
  });

  svg.addEventListener('click', (event) => {
    const node = event.target instanceof Element ? event.target.closest<SVGGElement>('[data-region]') : null;
    if (node?.dataset.region) go(regionRoute(node.dataset.region));
  });
  scopeBar.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-scope]') : null;
    if (button?.dataset.scope) go(regionRoute(button.dataset.scope));
  });
  host.querySelector('[data-action="play"]')!.addEventListener('click', () => {
    const route = router.current();
    if (route?.name === 'learning' && route.scope) go({ ...route, activity: 'test' });
  });
  host.querySelector('[data-action="back"]')!.addEventListener('click', () => window.history.back());

  // A viewport or layout change must never read as camera travel. If the stage
  // resizes mid-flight the in-flight animation simply retargets; if it resizes
  // at rest the camera snaps. This also absorbs the first-paint layout settle,
  // so a cold deep link lands on its final frame rather than drifting into it.
  // Hold the first paint until the stage has a settled size. Otherwise a cold
  // deep link lands correctly framed and then visibly adjusts its letterboxing,
  // which on a phone reads as a jump the probe is not trying to test.
  let laidOut = false;
  const observer = new ResizeObserver(() => {
    const next = targetFor(router.current());
    if (frame === null) travelTo(next, true);
    else target = next;
    if (!laidOut) { laidOut = true; stage.classList.add('is-ready'); }
  });
  observer.observe(stage);
  window.addEventListener('resize', () => travelTo(targetFor(router.current()), true));

  // Populate the scope bar BEFORE the first render. Appending it afterwards
  // grows the nav, shrinks the stage, and makes the opening frame move.
  scopeBar.insertAdjacentHTML('beforeend', regions.map((region) =>
    `<button type="button" data-scope="${region.id}">${region.label}</button>`).join(''));

  router.subscribe(render);
  render(router.current());
}

function shell(asset: MapRegionAsset): string {
  const countries = asset.countries.filter((country) => country.path);
  const context = (asset.contextPaths ?? []).map((path) => `<path class="probe-context" d="${path}" />`).join('');
  const continentConfig = getMapContinentConfig(CONTINENT_ID)!;
  const regionOf = new Map<string, string>();
  for (const region of continentConfig.regions) {
    for (const id of region.countryIds) if (region.scope.id) regionOf.set(id, region.scope.id);
  }
  const groups = new Map<string, string[]>();
  for (const country of countries) {
    const regionId = regionOf.get(country.countryId) ?? 'other';
    const paths = groups.get(regionId) ?? [];
    paths.push(`<path class="probe-country" data-country="${country.countryId}" d="${country.path}" />`);
    groups.set(regionId, paths);
  }
  const rendered = [...groups].map(([regionId, paths]) =>
    `<g data-region="${regionId}" class="probe-region">${paths.join('')}</g>`).join('');

  return `
    <main class="probe">
      <header class="probe-bar">
        <button class="probe-back" type="button" data-action="back" aria-label="Back">←</button>
        <code class="probe-crumb"></code>
      </header>
      <div class="probe-stage">
        <svg id="probe-map" viewBox="${asset.viewBox}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Africa">
          <g class="probe-context-layer">${context}</g>
          ${rendered}
        </svg>
      </div>
      <p class="probe-status" role="status" aria-live="polite"></p>
      <nav class="probe-scopes" aria-label="Scope">
        <button type="button" data-scope="${CONTINENT_ID}">All Africa</button>
      </nav>
      <div class="probe-activity" hidden>
        <strong>Play — Flags</strong>
        <span>Probe stub. The point of this screen is how you arrived at it.</span>
      </div>
      <button class="button button--primary probe-play" type="button" data-action="play">Play this scope</button>
    </main>
  `;
}

void main();
