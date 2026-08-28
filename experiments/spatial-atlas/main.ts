/**
 * Issue #119 spatial prototype.
 *
 *   Mode → World → Continent → Region → Play → Results → back out
 *
 * The typed production router remains the single source of navigation truth.
 * The camera is a *pure function of the route*: it interprets route ancestry as
 * a place to stand, and never decides where the application is. If motion is
 * interrupted the route still wins, because the route was never waiting on it.
 *
 * The globe is a persistent substrate. It is created once and stays mounted
 * behind every screen including the quiz, which is the whole point of the
 * exploration — the learning UI is an overlay on a place, not a replacement for
 * one. There is no second navigation state machine, and no production learning,
 * scoring, evidence, Mastery or storage state is touched (see round.ts).
 */

import { CONTINENTS, REGIONS } from '../../src/data/continents.js';
import { COUNTRIES } from '../../src/data/countries.js';
import { domainDisplayName } from '../../src/domain/display.js';
import type { LearningDomain, StudyScope } from '../../src/domain/models.js';
import { LEARNING_DOMAIN_IDS } from '../../src/domain/models.js';
import { scopeSupportsDomain } from '../../src/domain/scope-support.js';
import { createHashRouter } from '../../src/routing/router.js';
import { serializeRoutePath, type AppRoute } from '../../src/routing/routes.js';
import { distanceForSpan, framingFor, type Bounds, type GlobeAsset, type GlobeCountry } from './geo.js';
import { createGlobe, type CountryState, type GlobeHandle } from './globe.js';
import {
  advanceRound,
  answerRound,
  countryFlagUrl,
  countryName,
  currentQuestion,
  startRound,
  type PrototypeRound,
  type RoundResult,
} from './round.js';

const TRAVEL_MS = 900;
const FOV = 38;

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Interpolate longitude the short way round, so travel never crosses the globe. */
const lerpLon = (a: number, b: number, t: number) => a + (((b - a + 540) % 360) - 180) * t;

interface Pose { lon: number; lat: number; distance: number }

const countryRegion = new Map(COUNTRIES.map((c) => [c.id, c.regionId]));
const regionContinent = new Map(REGIONS.map((r) => [r.id, r.continentId]));
const idsInRegion = (regionId: string) => COUNTRIES.filter((c) => c.regionId === regionId).map((c) => c.id);
const idsInContinent = (continentId: string) =>
  COUNTRIES.filter((c) => regionContinent.get(c.regionId) === continentId).map((c) => c.id);

async function loadAsset(name: string): Promise<GlobeAsset> {
  const response = await fetch(new URL(`./generated/globe-${name}.json`, import.meta.url));
  if (!response.ok) throw new Error(`Could not load globe-${name}.json (${response.status}).`);
  return response.json() as Promise<GlobeAsset>;
}

function boot() {
  const host = document.querySelector<HTMLElement>('#spatial-atlas')!;
  host.innerHTML = shell();
  const stage = host.querySelector<HTMLElement>('.globe-stage')!;
  const panel = host.querySelector<HTMLElement>('.globe-panel')!;
  const crumb = host.querySelector<HTMLElement>('.globe-crumb')!;
  const backButton = host.querySelector<HTMLButtonElement>('[data-action="back"]')!;

  const router = createHashRouter(window);

  void (async () => {
    let asset: GlobeAsset;
    let globe: GlobeHandle;
    try {
      asset = await loadAsset('world');
      globe = createGlobe(stage, asset);
    } catch (cause) {
      fallback(host, cause);
      return;
    }

    const byId = new Map<string, GlobeCountry>(asset.countries.map((c) => [c.id, c]));

    /** Round state is ephemeral, exactly as production keeps it. */
    let round: PrototypeRound | null = null;
    let result: RoundResult | null = null;

    // Mainland bounds, not full extent: framing "Western Europe" must not be
    // dragged into the Atlantic by French Guiana.
    function boundsForIds(ids: string[]): Bounds[] {
      return ids.map((id) => byId.get(id)?.mainland).filter((b): b is Bounds => Boolean(b));
    }

    function scopeIds(scopeId: string | undefined): string[] {
      if (!scopeId) return [];
      if (CONTINENTS.some((c) => c.id === scopeId)) return idsInContinent(scopeId);
      return idsInRegion(scopeId);
    }

    /** The camera pose is derived from the route. Nothing else sets it. */
    function poseFor(route: AppRoute | null): Pose {
      const scopeId = route?.name === 'learning' ? route.scope?.id : undefined;
      const framing = scopeId ? framingFor(boundsForIds(scopeIds(scopeId))) : null;
      if (!framing) {
        // Mode choice and world level share the whole-Earth frame, so choosing a
        // domain does not move the camera — only what the geography means.
        return { lon: 12, lat: 12, distance: distanceForSpan(150, 150, FOV, globe.aspect) };
      }
      return {
        lon: framing.lon,
        lat: framing.lat,
        distance: distanceForSpan(framing.spanLat, framing.spanLon, FOV, globe.aspect),
      };
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

    // ---- routes -----------------------------------------------------------

    const domainRoute = (domain: LearningDomain): AppRoute => ({ name: 'learning', domain });
    const scopeRoute = (domain: LearningDomain, id: string): AppRoute => {
      const continent = CONTINENTS.find((c) => c.id === id);
      const region = REGIONS.find((r) => r.id === id);
      const scope: StudyScope = continent
        ? { kind: 'continent', id: continent.id, label: continent.name }
        : { kind: 'region', id, label: region?.name ?? id };
      return { name: 'learning', domain, scope };
    };

    const go = (route: AppRoute) => router.navigate(route);

    // ---- rendering --------------------------------------------------------

    function render(route: AppRoute | null) {
      // Cold load and deep links initialise AT the destination rather than
      // replaying the ancestor chain as a cutscene.
      travelTo(poseFor(route), firstPaint);
      firstPaint = false;

      const learning = route?.name === 'learning' ? route : null;
      const domain = learning?.domain ?? null;
      const scopeId = learning?.scope?.id;
      const inActivity = Boolean(learning?.activity);

      // Leaving the activity route discards the round, exactly as production
      // treats active round state as ephemeral.
      if (!inActivity && (round || result)) { round = null; result = null; }

      globe.setCountryStates(statesFor(scopeId));
      // During an activity the globe stays MOUNTED but yields the screen: the
      // task has to be reachable without scrolling on a phone. Continuity means
      // the place persists, not that it keeps the same share of the viewport.
      host.classList.toggle('is-activity', inActivity);
      crumb.textContent = route ? serializeRoutePath(route) : '/';
      backButton.hidden = !route || route.name !== 'learning';

      if (inActivity && domain) { panel.innerHTML = result ? resultsPanel(result) : quizPanel(); return; }
      if (!domain) { panel.innerHTML = modePanel(); return; }
      if (!scopeId) { panel.innerHTML = continentPanel(domain); return; }
      if (CONTINENTS.some((c) => c.id === scopeId)) { panel.innerHTML = regionPanel(domain, scopeId); return; }
      panel.innerHTML = scopePanel(domain, scopeId);
    }

    function statesFor(scopeId: string | undefined): Map<string, CountryState> {
      const states = new Map<string, CountryState>();
      if (!scopeId) return states;
      const inScope = new Set(scopeIds(scopeId));
      for (const country of COUNTRIES) {
        states.set(country.id, inScope.has(country.id) ? 'active' : 'dimmed');
      }
      return states;
    }

    // ---- panels -----------------------------------------------------------

    function modePanel(): string {
      return `
        <p class="globe-status" role="status">Drag to rotate the Earth. Choose what to learn.</p>
        <nav class="globe-scopes" aria-label="Learning mode">
          ${LEARNING_DOMAIN_IDS.map((d) =>
            `<button type="button" data-domain="${d}">${domainDisplayName(d)}</button>`).join('')}
        </nav>`;
    }

    function continentPanel(domain: LearningDomain): string {
      const rows = CONTINENTS.map((continent) => {
        const supported = scopeSupportsDomain({ kind: 'continent', id: continent.id, label: continent.name }, domain);
        // Unsupported scope stays visible and honest rather than Play-ready.
        return supported
          ? `<button type="button" data-scope="${continent.id}">${continent.name}</button>`
          : `<button type="button" disabled aria-disabled="true">${continent.name} <small>Coming soon</small></button>`;
      }).join('');
      return `
        <p class="globe-status" role="status">${domainDisplayName(domain)}. Tap a continent on the Earth, or choose one.</p>
        <nav class="globe-scopes" aria-label="Continent">${rows}</nav>`;
    }

    function regionPanel(domain: LearningDomain, continentId: string): string {
      const continent = CONTINENTS.find((c) => c.id === continentId)!;
      const regions = REGIONS.filter((r) => r.continentId === continentId);
      return `
        <p class="globe-status" role="status">${continent.name} framed. Play the whole continent, or choose a region.</p>
        <nav class="globe-scopes" aria-label="Region">
          <button type="button" data-scope="${continentId}" aria-current="true">All ${continent.name}</button>
          ${regions.map((r) => `<button type="button" data-scope="${r.id}">${r.name}</button>`).join('')}
        </nav>
        <button class="button button--primary globe-play" type="button" data-action="play">Play ${continent.name}</button>`;
    }

    function scopePanel(domain: LearningDomain, regionId: string): string {
      const region = REGIONS.find((r) => r.id === regionId);
      const continentId = regionContinent.get(regionId);
      const siblings = REGIONS.filter((r) => r.continentId === continentId);
      const label = region?.name ?? regionId;
      return `
        <p class="globe-status" role="status">${label} framed. ${idsInRegion(regionId).length} countries.</p>
        <nav class="globe-scopes" aria-label="Region">
          <button type="button" data-scope="${continentId}">All ${CONTINENTS.find((c) => c.id === continentId)?.name}</button>
          ${siblings.map((r) =>
            `<button type="button" data-scope="${r.id}"${r.id === regionId ? ' aria-current="true"' : ''}>${r.name}</button>`).join('')}
        </nav>
        <button class="button button--primary globe-play" type="button" data-action="play">Play ${label}</button>`;
    }

    function quizPanel(): string {
      if (!round) return '<p class="globe-status" role="status">Starting…</p>';
      const question = currentQuestion(round);
      if (!question) return '<p class="globe-status" role="status">No questions.</p>';
      const answered = round.answered;
      const correctId = question.countryId;
      const score = round.attempts.filter((a) => a.correct).length;
      const options = question.optionCountryIds.map((id, i) => {
        const state = answered === null ? '' : id === correctId ? ' is-correct' : id === answered ? ' is-wrong' : '';
        return `<button class="globe-answer${state}" type="button" data-answer="${id}"${answered !== null ? ' disabled' : ''}>
          <span class="globe-answer__key" aria-hidden="true">${i + 1}</span><strong>${countryName(id)}</strong></button>`;
      }).join('');
      const feedback = answered === null ? '' : answered === correctId
        ? '<p class="globe-feedback globe-feedback--correct" role="status">Correct</p>'
        : `<p class="globe-feedback globe-feedback--wrong" role="status">Not quite. Answer: ${countryName(correctId)}</p>`;
      return `
        <div class="globe-quiz">
          <div class="globe-quiz__meta">
            <span>Play · ${round.scope.label}</span>
            <span>${round.index + 1}/${round.questions.length} · ${score} correct</span>
          </div>
          <div class="globe-flag"><img src="${countryFlagUrl(correctId)}" alt="Flag to identify" /></div>
          <div class="globe-answers">${options}</div>
          ${feedback}
          ${answered !== null ? '<button class="button button--primary globe-play" type="button" data-action="next">Next</button>' : ''}
        </div>`;
    }

    function resultsPanel(r: RoundResult): string {
      return `
        <div class="globe-results">
          <strong class="globe-results__score">${r.correct}<span>/${r.total}</span></strong>
          <p>${r.perfect ? 'Perfect round.' : `${r.missed.length} to review.`}</p>
          ${r.missed.length ? `<p class="globe-results__missed">${r.missed.map((m) => countryName(m.countryId)).join(', ')}</p>` : ''}
          <div class="globe-results__actions">
            <button class="button button--primary" type="button" data-action="again">Play again</button>
            <button class="button button--secondary" type="button" data-action="back">Back to the map</button>
          </div>
        </div>`;
    }

    // ---- interaction ------------------------------------------------------

    function beginRound() {
      const route = router.current();
      if (route?.name !== 'learning' || !route.scope) return;
      round = startRound(route.scope);
      result = null;
      if (!round) return;
      go({ ...route, activity: 'test' });
    }

    panel.addEventListener('click', (event) => {
      const el = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-domain],[data-scope],[data-action],[data-answer]') : null;
      if (!el || (el as HTMLButtonElement).disabled) return;
      const route = router.current();
      const domain = route?.name === 'learning' ? route.domain : 'flags';

      if (el.dataset.domain) { go(domainRoute(el.dataset.domain as LearningDomain)); return; }
      if (el.dataset.scope) { go(scopeRoute(domain, el.dataset.scope)); return; }
      if (el.dataset.answer && round) { answerRound(round, el.dataset.answer); render(router.current()); return; }

      switch (el.dataset.action) {
        case 'play': beginRound(); break;
        case 'next': {
          if (!round) break;
          const finished = advanceRound(round);
          if (finished) result = finished;
          render(router.current());
          break;
        }
        case 'again': beginRound(); break;
        case 'back': window.history.back(); break;
      }
    });

    backButton.addEventListener('click', () => window.history.back());

    installGestures(stage, globe, {
      onTap: (x, y) => {
        const countryId = globe.pick(x, y);
        if (!countryId) return;
        const route = router.current();
        if (route?.name === 'learning' && route.activity) return;   // never navigate mid-round
        const domain = route?.name === 'learning' ? route.domain : null;
        if (!domain) return;                                        // choose a mode first
        const regionId = countryRegion.get(countryId);
        const continentId = regionId ? regionContinent.get(regionId) : undefined;
        if (!continentId) return;
        // Tapping geography resolves to the same action as the DOM control:
        // from the continent list it selects that continent, and once inside a
        // continent it selects the region the tapped country belongs to.
        const atContinent = route?.name === 'learning' && route.scope?.id
          && CONTINENTS.some((c) => c.id === route.scope?.id);
        go(scopeRoute(domain, atContinent && regionId ? regionId : continentId));
      },
      onRotate: (dLon, dLat) => {
        // Manual rotation is a camera nudge, never a route change. It cancels
        // in-flight travel so the learner's hand always wins over choreography.
        travelling = false;
        current = { lon: current.lon - dLon, lat: Math.max(-85, Math.min(85, current.lat + dLat)), distance: current.distance };
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
 * A drag starting within the edge gutter is left to the browser.
 */
function installGestures(stage: HTMLElement, globe: GlobeHandle, handlers: GestureHandlers) {
  const EDGE_GUTTER = 28;
  const TAP_SLOP = 10;
  const points = new Map<number, { x: number; y: number }>();
  let moved = 0;
  let pinchStart = 0;
  let ignore = false;

  const spread = () => {
    const [a, b] = [...points.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  stage.addEventListener('pointerdown', (event) => {
    if (points.size === 0) {
      const rect = stage.getBoundingClientRect();
      ignore = event.clientX - rect.left < EDGE_GUTTER || rect.right - event.clientX < EDGE_GUTTER;
      moved = 0;
    }
    if (ignore) return;
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (points.size === 2) pinchStart = spread();
    stage.setPointerCapture(event.pointerId);
  });

  stage.addEventListener('pointermove', (event) => {
    if (ignore) return;
    const previous = points.get(event.pointerId);
    if (!previous) return;
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (points.size === 2 && pinchStart > 0) {
      const next = spread();
      if (next > 0) { handlers.onDolly(pinchStart / next); pinchStart = next; }
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

  stage.addEventListener('pointerup', (event) => {
    if (ignore) { if (points.size <= 1) ignore = false; return; }
    const had = points.size;
    points.delete(event.pointerId);
    if (points.size < 2) pinchStart = 0;
    if (had === 1 && moved < TAP_SLOP) handlers.onTap(event.clientX, event.clientY);
  });
  stage.addEventListener('pointercancel', (event) => { points.delete(event.pointerId); pinchStart = 0; });

  stage.addEventListener('wheel', (event) => {
    event.preventDefault();
    handlers.onDolly(event.deltaY > 0 ? 1.08 : 1 / 1.08);
  }, { passive: false });

  window.addEventListener('resize', () => globe.resize());
}

/**
 * Graceful renderer failure. A device without WebGL gets the conventional 2D
 * path rather than a dead canvas — the issue requires a fallback, and the
 * Stage 1 continuity probe already is one.
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
  return `
    <main class="globe">
      <header class="globe-bar">
        <button class="globe-back" type="button" data-action="back" aria-label="Back" hidden>←</button>
        <code class="globe-crumb"></code>
      </header>
      <div class="globe-stage" role="application" aria-label="Interactive globe. Equivalent controls are listed below."></div>
      <div class="globe-panel"></div>
    </main>`;
}

boot();
