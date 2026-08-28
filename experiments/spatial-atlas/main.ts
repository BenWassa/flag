/**
 * Issue #119 spatial prototype — Africa vertical slice.
 *
 *   Mode → World → Africa → West Africa → Play-ready → Back → Back
 *
 * The typed production router remains the single source of navigation truth.
 * The camera is a *pure function of the route*: it interprets route ancestry as
 * a place to stand, and never decides where the application is. If motion is
 * interrupted the route still wins, because the route was never waiting on it.
 *
 * There is no second navigation state machine here, and no learning, scoring,
 * evidence, Mastery or storage state of any kind.
 */

import { CONTINENTS, REGIONS } from '../../src/data/continents.js';
import { COUNTRIES } from '../../src/data/countries.js';
import { createHashRouter } from '../../src/routing/router.js';
import { serializeRoutePath, type AppRoute } from '../../src/routing/routes.js';
import {
  boundsCentre,
  boundsSpan,
  distanceForSpan,
  unionBounds,
  type GlobeAsset,
  type GlobeCountry,
} from './geo.js';
import { createGlobe, WebGLUnavailableError, type CountryState, type GlobeHandle } from './globe.js';

const CONTINENT_ID = 'africa';
const DOMAIN = 'flags';
const TRAVEL_MS = 900;
const FOV = 38;

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Interpolate longitude the short way round, so travel never crosses the globe. */
const lerpLon = (a: number, b: number, t: number) => {
  let delta = ((b - a + 540) % 360) - 180;
  return a + delta * t;
};

interface Pose { lon: number; lat: number; distance: number }

const africaRegions = REGIONS.filter((region) => region.continentId === CONTINENT_ID);
const countryRegion = new Map(COUNTRIES.map((country) => [country.id, country.regionId]));

async function loadAsset(name: string): Promise<GlobeAsset> {
  const response = await fetch(new URL(`./generated/globe-${name}.json`, import.meta.url));
  if (!response.ok) throw new Error(`Could not load globe-${name}.json (${response.status}).`);
  return response.json() as Promise<GlobeAsset>;
}

function boot() {
  const host = document.querySelector<HTMLElement>('#spatial-atlas')!;
  host.innerHTML = shell();
  const stage = host.querySelector<HTMLElement>('.globe-stage')!;
  const scopeBar = host.querySelector<HTMLElement>('.globe-scopes')!;
  const crumb = host.querySelector<HTMLElement>('.globe-crumb')!;
  const status = host.querySelector<HTMLElement>('.globe-status')!;
  const activity = host.querySelector<HTMLElement>('.globe-activity')!;

  const router = createHashRouter(window);

  void (async () => {
    let asset: GlobeAsset;
    let globe: GlobeHandle;
    try {
      // World LOD first so the opening frame is the whole Earth, then the finer
      // Africa LOD replaces it once the learner has committed to the continent.
      asset = await loadAsset('world');
      globe = createGlobe(stage, asset);
    } catch (cause) {
      fallback(host, cause);
      return;
    }

    const byId = new Map<string, GlobeCountry>(asset.countries.map((c) => [c.id, c]));
    const africaIds = COUNTRIES.filter((c) => africaRegions.some((r) => r.id === c.regionId)).map((c) => c.id);

    function boundsForScope(scopeId: string | undefined): GlobeCountry['bounds'] | null {
      if (!scopeId) return null;
      const ids = scopeId === CONTINENT_ID
        ? africaIds
        : COUNTRIES.filter((c) => c.regionId === scopeId).map((c) => c.id);
      const list = ids.map((id) => byId.get(id)?.bounds).filter((b): b is GlobeCountry['bounds'] => Boolean(b));
      return list.length ? unionBounds(list) : null;
    }

    /** The camera pose is derived from the route. Nothing else sets it. */
    function poseFor(route: AppRoute | null): Pose {
      const scopeId = route?.name === 'learning' ? route.scope?.id : undefined;
      const bounds = boundsForScope(scopeId);
      if (!bounds) {
        // World / domain level: the whole Earth, tilted to put Africa in view so
        // the opening frame is honest about where this slice can go.
        return { lon: 18, lat: 6, distance: distanceForSpan(150, 150, FOV, globe.aspect) };
      }
      const [lon, lat] = boundsCentre(bounds);
      const span = boundsSpan(bounds);
      return { lon, lat, distance: distanceForSpan(span.lat, span.lon, FOV, globe.aspect) };
    }

    let current = poseFor(router.current());
    let target = current;
    let from = current;
    let startedAt = 0;
    let travelling = false;
    let firstPaint = true;

    const apply = (pose: Pose) => globe.setCamera(pose.lon, pose.lat, pose.distance);

    /**
     * Retargetable travel. A route change mid-flight moves the destination and
     * the camera continues from where it is — it never has to finish before the
     * next input is honoured, and it never fights the route.
     */
    function travelTo(next: Pose, immediate: boolean) {
      target = next;
      if (immediate || reduceMotion()) {
        travelling = false;
        current = next;
        apply(current);
        return;
      }
      from = current;
      startedAt = performance.now();
      if (travelling) return;
      travelling = true;
      const step = () => {
        if (!travelling) return;
        const t = Math.min(1, (performance.now() - startedAt) / TRAVEL_MS);
        const e = easeOut(t);
        current = {
          lon: lerpLon(from.lon, target.lon, e),
          lat: lerp(from.lat, target.lat, e),
          distance: lerp(from.distance, target.distance, e),
        };
        apply(current);
        if (t < 1) { requestAnimationFrame(step); return; }
        travelling = false;
      };
      requestAnimationFrame(step);
    }

    function render(route: AppRoute | null) {
      // Cold load and deep links initialise AT the destination rather than
      // replaying the ancestor chain as a cutscene.
      travelTo(poseFor(route), firstPaint);
      firstPaint = false;

      const scopeId = route?.name === 'learning' ? route.scope?.id : undefined;
      const activityOpen = route?.name === 'learning' && route.activity !== undefined;

      const states = new Map<string, CountryState>();
      if (scopeId && scopeId !== CONTINENT_ID) {
        for (const country of COUNTRIES) {
          states.set(country.id, country.regionId === scopeId ? 'active' : 'dimmed');
        }
      } else if (scopeId === CONTINENT_ID) {
        for (const country of COUNTRIES) {
          states.set(country.id, africaIds.includes(country.id) ? 'active' : 'dimmed');
        }
      }
      globe.setCountryStates(states);

      for (const button of scopeBar.querySelectorAll<HTMLButtonElement>('[data-scope]')) {
        button.setAttribute('aria-current', button.dataset.scope === (scopeId ?? '') ? 'true' : 'false');
      }
      crumb.textContent = route ? serializeRoutePath(route) : '/';
      activity.hidden = !activityOpen;
      const label = scopeId === CONTINENT_ID
        ? 'Africa'
        : africaRegions.find((r) => r.id === scopeId)?.name;
      status.textContent = activityOpen
        ? 'Play-ready. This prototype does not run a round.'
        : label
          ? `${label} framed. Choose Play, or go back.`
          : 'Drag to rotate. Choose Africa, or tap it.';
    }

    const routeForScope = (id: string): AppRoute => ({
      name: 'learning',
      domain: DOMAIN,
      scope: id === CONTINENT_ID
        ? { kind: 'continent', id: CONTINENT_ID, label: 'Africa' }
        : { kind: 'region', id, label: africaRegions.find((r) => r.id === id)?.name ?? id },
    });

    installGestures(stage, globe, {
      onTap: (x, y) => {
        const countryId = globe.pick(x, y);
        if (!countryId) return;
        const regionId = countryRegion.get(countryId);
        // Tapping geography resolves to the same action as the DOM control for
        // the scope that geography belongs to.
        if (regionId && africaRegions.some((r) => r.id === regionId)) {
          const route = router.current();
          const atContinent = route?.name === 'learning' && route.scope?.id === CONTINENT_ID;
          router.navigate(routeForScope(atContinent ? regionId : CONTINENT_ID));
        }
      },
      onRotate: (dLon, dLat) => {
        // Manual rotation is a camera nudge, never a route change. It cancels
        // in-flight travel so the learner's hand always wins over choreography.
        travelling = false;
        current = {
          lon: current.lon - dLon,
          lat: Math.max(-85, Math.min(85, current.lat + dLat)),
          distance: current.distance,
        };
        target = current;
        apply(current);
      },
      onDolly: (factor) => {
        travelling = false;
        current = { ...current, distance: Math.max(1.06, Math.min(4.2, current.distance * factor)) };
        target = current;
        apply(current);
      },
    });

    scopeBar.insertAdjacentHTML('beforeend', africaRegions.map((region) =>
      `<button type="button" data-scope="${region.id}">${region.name}</button>`).join(''));
    scopeBar.addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-scope]') : null;
      if (button?.dataset.scope) router.navigate(routeForScope(button.dataset.scope));
    });
    host.querySelector('[data-action="play"]')!.addEventListener('click', () => {
      const route = router.current();
      if (route?.name === 'learning' && route.scope) router.navigate({ ...route, activity: 'test' });
    });
    host.querySelector('[data-action="back"]')!.addEventListener('click', () => window.history.back());

    const observer = new ResizeObserver(() => {
      globe.resize();
      const next = poseFor(router.current());
      if (!travelling) travelTo(next, true); else target = next;
      stage.classList.add('is-ready');
    });
    observer.observe(stage);

    router.subscribe(render);
    render(router.current());
  })();
}

interface GestureHandlers {
  onTap(clientX: number, clientY: number): void;
  onRotate(deltaLonDeg: number, deltaLatDeg: number): void;
  onDolly(factor: number): void;
}

/**
 * Gesture ownership, stated explicitly per the issue:
 *   one-finger drag → rotate; two-finger pinch → dolly; tap → select.
 *
 * `touch-action: none` is scoped to the globe stage only, never the document,
 * so the OS edge-back gesture and page scrolling outside the stage keep working.
 * A drag that starts within the left/right edge gutter is left to the browser.
 */
function installGestures(stage: HTMLElement, globe: GlobeHandle, handlers: GestureHandlers) {
  const EDGE_GUTTER = 28;
  const TAP_SLOP = 10;
  const points = new Map<number, { x: number; y: number }>();
  let moved = 0;
  let pinchStart = 0;
  let ignore = false;

  const distance = () => {
    const [a, b] = [...points.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  stage.addEventListener('pointerdown', (event) => {
    if (points.size === 0) {
      const rect = stage.getBoundingClientRect();
      // Leave the OS back gesture alone.
      ignore = event.clientX - rect.left < EDGE_GUTTER || rect.right - event.clientX < EDGE_GUTTER;
      moved = 0;
    }
    if (ignore) return;
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (points.size === 2) pinchStart = distance();
    stage.setPointerCapture(event.pointerId);
  });

  stage.addEventListener('pointermove', (event) => {
    if (ignore) return;
    const previous = points.get(event.pointerId);
    if (!previous) return;
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (points.size === 2 && pinchStart > 0) {
      const next = distance();
      if (next > 0) {
        handlers.onDolly(pinchStart / next);
        pinchStart = next;
      }
      return;
    }
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    moved += Math.hypot(dx, dy);
    // Degrees per pixel scales with the stage so the globe tracks the thumb at
    // any size rather than feeling geared.
    const perPixel = 180 / Math.max(stage.clientWidth, 1);
    handlers.onRotate(dx * perPixel, dy * perPixel);
  });

  const end = (event: PointerEvent) => {
    if (ignore) { ignore = points.size <= 1 ? false : ignore; return; }
    const had = points.size;
    points.delete(event.pointerId);
    if (points.size < 2) pinchStart = 0;
    if (had === 1 && moved < TAP_SLOP) handlers.onTap(event.clientX, event.clientY);
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', (event) => { points.delete(event.pointerId); pinchStart = 0; });

  stage.addEventListener('wheel', (event) => {
    event.preventDefault();
    handlers.onDolly(event.deltaY > 0 ? 1.08 : 1 / 1.08);
  }, { passive: false });

  window.addEventListener('resize', () => globe.resize());
}

/**
 * Graceful renderer failure. A device without WebGL gets the conventional 2D
 * launcher path rather than a dead canvas — the issue requires a fallback, and
 * the Stage 1 continuity probe already is one.
 */
function fallback(host: HTMLElement, cause: unknown) {
  console.warn('Spatial Atlas could not start a WebGL renderer.', cause);
  host.innerHTML = `
    <main class="globe-fallback">
      <h1>3D is unavailable on this device</h1>
      <p>Atlas could not start a WebGL renderer, so the spatial prototype cannot run here.
         The conventional Atlas navigation still works.</p>
      <p class="globe-fallback__actions">
        <a class="button button--primary" href="../spatial-continuity/probe/index.html#/">Open the 2D continuity probe</a>
        <a class="button button--secondary" href="../../index.html#/">Open Atlas</a>
      </p>
    </main>`;
  host.dataset.fallback = 'webgl-unavailable';
}

function shell(): string {
  const continent = CONTINENTS.find((c) => c.id === CONTINENT_ID);
  return `
    <main class="globe">
      <header class="globe-bar">
        <button class="globe-back" type="button" data-action="back" aria-label="Back">←</button>
        <code class="globe-crumb"></code>
      </header>
      <div class="globe-stage" role="application" aria-label="Interactive globe. Equivalent controls are listed below."></div>
      <p class="globe-status" role="status" aria-live="polite"></p>
      <nav class="globe-scopes" aria-label="Scope">
        <button type="button" data-scope="${CONTINENT_ID}">All ${continent?.name ?? 'Africa'}</button>
      </nav>
      <div class="globe-activity" hidden>
        <strong>Play — Flags</strong>
        <span>Prototype stub. The point of this screen is how you arrived at it.</span>
      </div>
      <button class="button button--primary globe-play" type="button" data-action="play">Play this scope</button>
    </main>`;
}

boot();
