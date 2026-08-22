import { COUNTRIES, COUNTRY_BY_ID } from './data/countries.js';
import { getMapContinentConfigForScope } from './data/map-scopes.js';
import { loadMapAsset } from './data/maps/index.js';
import { NEIGHBOR_GUESS_COUNTRY_IDS } from './data/neighbors/index.js';
import { domainDisplayName } from './domain/display.js';
import type { LearningDomain, StudyScope } from './domain/models.js';
import type { ProgressLedgers } from './domain/progress-summary.js';
import type { MapRegionAsset } from './domain/map-models.js';
import { resolveCountryGuess } from './domain/neighbor-game.js';
import { flushMapAttempts, resetMapProgressStorage } from './infrastructure/map-storage.js';
import { flushNeighborAttempts, resetNeighborProgressStorage } from './infrastructure/neighbor-storage.js';
import { flushOutlineAttempts, resetOutlineProgressStorage } from './infrastructure/outline-storage.js';
import { flushAttempts, resetAllProgress } from './infrastructure/storage.js';
import { dismissInstallPrompt, isInstallPromptDismissed } from './infrastructure/install-prompt-storage.js';
import { createHashRouter } from './routing/router.js';
import {
  isLearningDomain,
  normalizeAvailableRoute,
  parentRoute,
  routeForScope,
  routeForScopeId,
  routeTitle,
  routesEqual,
  scopeForQuickPlay,
  serializeRoutePath,
  stableRoute,
  type AppRoute,
  type LearningRoute,
} from './routing/routes.js';
import { getActiveRoundRoute, setActiveRoundRoute } from './state/active-round.js';
import { createFlagsRound } from './state/flags-round.js';
import { createLocationsRound } from './state/locations-round.js';
import { createNeighborsRound } from './state/neighbors-round.js';
import { createOutlinesRound } from './state/outlines-round.js';
import { invalidatePendingRoundLaunch } from './state/round-launch-guard.js';
import type { RoundContext } from './state/round-context.js';
import { AppStore } from './state/store.js';
import { installNavigationGestures } from './navigation-gestures.js';
import { markFailedFlags } from './ui/components/flag.js';
import { icon } from './ui/components/icons.js';
import { escapeHtml } from './ui/format.js';
import { renderLauncherMap } from './ui/components/launcher-map.js';
import { renderFocusIntent } from './ui/focus.js';
import { renderDomainIndex } from './ui/views/domain.js';
import { renderFlagsStudy } from './ui/views/flags-study.js';
import { renderHome } from './ui/views/home.js';
import { renderMapHome } from './ui/views/map-home.js';
import { renderMapQuiz } from './ui/views/map-quiz.js';
import { renderMapResults } from './ui/views/map-results.js';
import { renderNeighborHome } from './ui/views/neighbor-home.js';
import { renderNeighborQuiz, renderNeighborSuggestions } from './ui/views/neighbor-quiz.js';
import { renderNeighborResults } from './ui/views/neighbor-results.js';
import { renderOutlineHome } from './ui/views/outline-home.js';
import { renderOutlineQuiz } from './ui/views/outline-quiz.js';
import { renderOutlineResults } from './ui/views/outline-results.js';
import { renderProgress } from './ui/views/progress.js';
import { renderQuiz } from './ui/views/quiz.js';
import { renderResults } from './ui/views/results.js';
import { renderScope } from './ui/views/scope.js';

const appRoot = document.querySelector('#app');
if (!(appRoot instanceof HTMLDivElement)) throw new Error('App root not found.');
const root: HTMLDivElement = appRoot;
const liveStatus = document.querySelector<HTMLElement>('#live-status');

const appNotice = document.querySelector<HTMLElement>('#app-notice');

const store = new AppStore();
const router = createHashRouter(window);
const allowedNeighborCountryIds = new Set(NEIGHBOR_GUESS_COUNTRY_IDS);
let currentRoute: AppRoute = { name: 'home' };
let resetArmed = false;
let lastRenderedRouteKey: string | null = null;
let launcherMapAsset: MapRegionAsset | null = null;
let launcherMapScopeId: string | null = null;
let launcherMapRequest = 0;
let preserveScrollOnNextRoute = false;
// Flags Learn reveal state is study, not evidence, so it stays ephemeral and
// resets whenever the learner leaves the study surface.
const revealedFlagIds = new Set<string>();
let revealAllFlagNames = false;

let pendingAnnouncement: number | null = null;

function announce(message: string): void {
  if (!liveStatus || !message) return;
  if (pendingAnnouncement !== null) window.clearTimeout(pendingAnnouncement);
  liveStatus.textContent = '';
  pendingAnnouncement = window.setTimeout(() => {
    pendingAnnouncement = null;
    liveStatus.textContent = message;
  }, 60);
}

const NOTICE_DURATION_MS = 7000;
let noticeTimer: number | null = null;

function dismissNotice(): void {
  if (!appNotice) return;
  if (noticeTimer !== null) window.clearTimeout(noticeTimer);
  noticeTimer = null;
  appNotice.textContent = '';
  appNotice.hidden = true;
}

/**
 * A message the learner has to actually see. `announce` writes into a
 * visually-hidden live region, which is right for routine progress talk but
 * wrong for "that action did not happen": before this existed, a round whose
 * geometry failed to load, or an unrecognised country name in the Neighbours
 * field, produced a completely silent dead tap for anyone not using a screen
 * reader. #app-notice is itself a live region, so this is seen and announced
 * once rather than duplicated through `announce`.
 */
function notify(message: string): void {
  if (!appNotice || !message) return;
  if (noticeTimer !== null) window.clearTimeout(noticeTimer);
  appNotice.hidden = false;
  appNotice.innerHTML = `
    <span class="app-notice__body">
      <span class="app-notice__icon" aria-hidden="true">${icon('warning')}</span>
      <span class="app-notice__message">${escapeHtml(message)}</span>
    </span>
    <button class="app-notice__dismiss" type="button" data-notice-dismiss aria-label="Dismiss message">${icon('close')}</button>
  `;
  noticeTimer = window.setTimeout(dismissNotice, NOTICE_DURATION_MS);
}

appNotice?.addEventListener('click', (event) => {
  if (event.target instanceof Element && event.target.closest('[data-notice-dismiss]')) dismissNotice();
});

/**
 * Chrome/Edge/Samsung Internet fire `beforeinstallprompt`; iOS Safari never
 * does and has no programmatic install path at all, so it gets a static
 * instruction instead of an action button. `#install-banner` lives outside
 * `#app` (see index.html) specifically so it survives every route's full
 * innerHTML replacement in render().
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const installBanner = document.querySelector<HTMLElement>('#install-banner');
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

function isStandaloneDisplay(): boolean {
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone === true;
}

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

function hideInstallBanner(): void {
  if (!installBanner) return;
  installBanner.hidden = true;
  installBanner.innerHTML = '';
}

function showInstallBanner(mode: 'install' | 'ios-instructions'): void {
  if (!installBanner) return;
  const message = mode === 'install'
    ? 'Install Atlas for quick, full-screen access.'
    : 'Add Atlas to your Home Screen: tap Share, then "Add to Home Screen".';
  const action = mode === 'install'
    ? '<button class="install-banner__action" type="button" data-install-action>Install</button>'
    : '';
  installBanner.innerHTML = `
    <span class="install-banner__message">${escapeHtml(message)}</span>
    ${action}
    <button class="install-banner__dismiss" type="button" data-install-dismiss aria-label="Dismiss">${icon('close')}</button>
  `;
  installBanner.hidden = false;
}

installBanner?.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  if (event.target.closest('[data-install-dismiss]')) {
    dismissInstallPrompt();
    hideInstallBanner();
    return;
  }
  if (event.target.closest('[data-install-action]') && deferredInstallPrompt) {
    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    void promptEvent.prompt();
    void promptEvent.userChoice.then(() => {
      dismissInstallPrompt();
      hideInstallBanner();
    });
  }
});

if (!isStandaloneDisplay() && !isInstallPromptDismissed()) {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    showInstallBanner('install');
  });
  if (isIosSafari()) showInstallBanner('ios-instructions');
}

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  dismissInstallPrompt();
  hideInstallBanner();
});

/**
 * Locations, Outlines and Neighbours all start a round behind a dynamic
 * import of generated geometry. On a cold cache that is a real wait, and the
 * pressed control used to give no sign it had registered the tap at all.
 * The control is marked busy for the duration, and released again if the
 * launch fails — a successful launch replaces the DOM anyway.
 */
async function withLaunchFeedback(
  element: HTMLElement | null,
  launch: () => Promise<void>,
): Promise<void> {
  if (!element) {
    await launch();
    return;
  }
  element.setAttribute('aria-busy', 'true');
  element.classList.add('is-launching');
  try {
    await launch();
  } finally {
    if (element.isConnected) {
      element.removeAttribute('aria-busy');
      element.classList.remove('is-launching');
    }
  }
}

function finishInteraction(previousSelector: string | null): void {
  render(previousSelector);
}

/**
 * Cancels every domain's pending auto-advance timer, not just one. Every
 * round's `begin()` calls this defensively before starting, and route
 * changes call it too. Declared before the round controllers exist (a
 * hoisted function is safe to reference in their shared context, since its
 * body only runs once they are constructed) rather than after, so the
 * construction block below reads top-to-bottom as one unit.
 */
function cancelAllPending(): void {
  flagsRound.cancelPending();
  locationsRound.cancelPending();
  outlinesRound.cancelPending();
}

const roundContext: RoundContext = {
  store,
  router,
  announce,
  notify,
  finishInteraction,
  getCurrentRoute: () => currentRoute,
  cancelAllPending,
};

const flagsRound = createFlagsRound(roundContext);
const locationsRound = createLocationsRound(roundContext);
const outlinesRound = createOutlinesRound(roundContext);
const neighborsRound = createNeighborsRound(roundContext);

function routeHasActiveRound(route: LearningRoute): boolean {
  const active = getActiveRoundRoute();
  if (!active || !routesEqual(route, active)) return false;
  if (route.domain === 'flags') return store.session !== null;
  if (route.domain === 'locations') return store.mapSession !== null && store.mapAsset !== null;
  if (route.domain === 'outlines') return store.outlineSession !== null && store.outlineAsset !== null;
  if (route.domain === 'neighbors') return store.neighborSession !== null;
  return false;
}

function isFlagsStudyRoute(route: AppRoute): boolean {
  return route.name === 'learning' && route.domain === 'flags' && route.activity === 'learn';
}

/**
 * Reveals or hides one card in place. The country name is written into the DOM
 * only while revealed — keeping it out of the markup beforehand is what stops
 * the answer leaking to assistive technology through hidden text.
 */
function toggleFlagReveal(button: HTMLElement, countryId: string): void {
  const nameEl = button.querySelector<HTMLElement>('[data-flag-name]');
  const image = button.querySelector<HTMLImageElement>('img.flag-image');
  const country = COUNTRY_BY_ID.get(countryId);
  if (!nameEl || !country) return;

  const revealed = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(revealed));
  button.classList.toggle('flag-card--revealed', revealed);
  nameEl.textContent = revealed ? country.name : '';
  if (image) image.alt = revealed ? `${country.name} flag` : 'Flag to identify';

  if (revealed) {
    revealedFlagIds.add(countryId);
    button.removeAttribute('aria-label');
  } else {
    revealedFlagIds.delete(countryId);
    button.setAttribute('aria-label', button.dataset.hiddenLabel ?? 'Reveal the country.');
  }
}

function normalizeRoute(route: AppRoute): AppRoute {
  if (route.name !== 'learning') return route;

  // Flags Learn is a browsable study surface rather than a round, so it stays
  // directly addressable without an active session.
  if (isFlagsStudyRoute(route)) return route;

  if (route.activity !== undefined && !routeHasActiveRound(route)) {
    return stableRoute(route);
  }

  return normalizeAvailableRoute(route);
}

function routeUsesLauncherMap(route: AppRoute): route is LearningRoute & { scope: StudyScope } {
  return route.name === 'learning'
    && route.activity === undefined
    && route.domain !== 'flags'
    && route.scope !== undefined;
}

async function hydrateLauncherMap(route: AppRoute): Promise<void> {
  const request = ++launcherMapRequest;
  if (!routeUsesLauncherMap(route)) return;

  const continent = route.scope.id ? getMapContinentConfigForScope(route.scope.id) : undefined;
  const continentScopeId = continent?.scope.id;
  const host = root.querySelector<HTMLElement>('[data-launcher-map-slot]');
  if (!host || !continentScopeId) return;
  if (launcherMapAsset && launcherMapScopeId === continentScopeId) return;

  try {
    const asset = await loadMapAsset(continentScopeId);
    if (!asset) throw new Error(`${route.scope.label} geometry unavailable.`);
    launcherMapAsset = asset;
    launcherMapScopeId = continentScopeId;

    if (request !== launcherMapRequest || !host.isConnected || !routesEqual(currentRoute, route)) return;
    const selectedRegionId = route.scope.kind === 'region' ? route.scope.id : undefined;
    host.innerHTML = renderLauncherMap(asset, route.domain, selectedRegionId);
  } catch {
    if (request !== launcherMapRequest || !host.isConnected || !routesEqual(currentRoute, route)) return;
    host.innerHTML = '<p class="launcher-map-error">Map unavailable. Choose a region from the list.</p>';
  }
}

function applyRoute(requestedRoute: AppRoute): void {
  const route = normalizeRoute(requestedRoute);
  if (!routesEqual(route, requestedRoute)) {
    // Mirrors normalizeRoute's own guard: an activity URL with no matching
    // live session (a mid-round refresh discarded it, or the link was opened
    // cold) gets silently redirected to its launcher. router.navigate below
    // re-enters this function synchronously and calls dismissNotice() first,
    // so the notice has to be raised after it returns, not before.
    const droppedRound = requestedRoute.name === 'learning'
      && !isFlagsStudyRoute(requestedRoute)
      && requestedRoute.activity !== undefined
      && !routeHasActiveRound(requestedRoute);
    router.navigate(route, { replace: true });
    if (droppedRound) notify("That round isn't active anymore. Choose Play to start a new one.");
    return;
  }

  currentRoute = route;
  if (routeUsesLauncherMap(route)) {
    const parentScopeId = route.scope.id
      ? getMapContinentConfigForScope(route.scope.id)?.scope.id ?? null
      : null;
    if (parentScopeId !== launcherMapScopeId) launcherMapAsset = null;
  }
  switch (route.name) {
    case 'home':
      store.navigate({ name: 'home' });
      break;
    case 'progress':
      store.navigate({ name: 'progress' });
      break;
    case 'learning':
      if (isFlagsStudyRoute(route)) {
        store.navigate({ name: 'flags-study', scope: route.scope ?? { kind: 'world', label: 'World' } });
      } else if (route.activity !== undefined) {
        if (route.domain === 'flags' && store.session) {
          store.navigate(store.sessionResult
            ? { name: 'results', result: store.sessionResult }
            : { name: 'quiz' });
        } else if (route.domain === 'locations' && store.mapSession && store.mapAsset) {
          store.navigate(store.mapSessionResult
            ? { name: 'map-results', result: store.mapSessionResult }
            : { name: 'map-quiz' });
        } else if (route.domain === 'outlines' && store.outlineSession && store.outlineAsset) {
          store.navigate(store.outlineSessionResult
            ? { name: 'outline-results', result: store.outlineSessionResult }
            : { name: 'outline-quiz' });
        } else if (route.domain === 'neighbors' && store.neighborSession) {
          store.navigate(store.neighborSessionResult
            ? { name: 'neighbor-results', result: store.neighborSessionResult }
            : { name: 'neighbor-quiz' });
        }
      } else if (!route.scope) {
        store.navigate({ name: 'domain', domain: route.domain });
      } else if (route.domain === 'flags') {
        store.navigate({ name: 'scope', scope: route.scope });
      } else if (route.domain === 'locations') {
        store.navigate({ name: 'map-home', scope: route.scope });
      } else if (route.domain === 'outlines') {
        store.navigate({ name: 'outline-home', scope: route.scope });
      } else if (route.domain === 'neighbors') {
        store.navigate({ name: 'neighbor-home', scope: route.scope });
      }
      break;
  }
  render();
  void hydrateLauncherMap(route);
}

router.subscribe((route) => {
  // Any intervening route change invalidates a lazy round start that is still
  // waiting for geometry. The winning start increments this token itself.
  invalidatePendingRoundLaunch();
  cancelAllPending();
  dismissNotice();
  resetArmed = false;
  if (!route || !isFlagsStudyRoute(route)) {
    revealedFlagIds.clear();
    revealAllFlagNames = false;
  }
  // An unparseable hash — a typo, or a link to the retired scope-first
  // /atlas/* surface — renders Home *and* corrects the URL, so the address bar
  // never keeps claiming a screen that no longer exists.
  if (!route) {
    router.navigate({ name: 'home' }, { replace: true });
    return;
  }
  applyRoute(route);
});

function discardActiveRound(): void {
  const active = getActiveRoundRoute();
  if (!active) return;
  if (active.domain === 'flags') store.abandonSession();
  if (active.domain === 'locations') store.abandonMapSession();
  if (active.domain === 'outlines') store.abandonOutlineSession();
  if (active.domain === 'neighbors') store.abandonNeighborSession();
  setActiveRoundRoute(null);
  neighborsRound.resetQuery();
}

function navigateStable(route: AppRoute): void {
  const active = getActiveRoundRoute();
  if (active && !routesEqual(route, stableRoute(active))) discardActiveRound();
  router.navigate(route);
}

function currentDocumentTitle(): string {
  if (store.view.name === 'results') {
    return `Round complete · ${store.view.result.session.scope.label} flags · Atlas`;
  }
  if (store.view.name === 'map-results') {
    return `Round complete · ${store.view.result.session.scope.label} locations · Atlas`;
  }
  if (store.view.name === 'outline-results') {
    return `Round complete · ${store.view.result.session.scope.label} outlines · Atlas`;
  }
  if (store.view.name === 'neighbor-results') {
    return `Round complete · ${store.view.result.session.scope.label} ${domainDisplayName('neighbors').toLowerCase()} · Atlas`;
  }
  return routeTitle(currentRoute);
}

function currentRouteKey(): string {
  const route = serializeRoutePath(currentRoute);
  const view = store.view;
  if (view.name === 'quiz') return `${route}:${store.session?.id ?? 'none'}:${store.session?.currentIndex ?? 0}`;
  if (view.name === 'results') return `${route}:results:${view.result.session.id}`;
  if (view.name === 'map-quiz') return `${route}:${store.mapSession?.id ?? 'none'}:${store.mapSession?.currentIndex ?? 0}`;
  if (view.name === 'map-results') return `${route}:results:${view.result.session.id}`;
  if (view.name === 'outline-quiz') return `${route}:${store.outlineSession?.id ?? 'none'}:${store.outlineSession?.currentIndex ?? 0}`;
  if (view.name === 'outline-results') return `${route}:results:${view.result.session.id}`;
  if (view.name === 'neighbor-quiz') return `${route}:${store.neighborSession?.id ?? 'none'}:${store.neighborSession?.currentIndex ?? 0}`;
  if (view.name === 'neighbor-results') return `${route}:results:${view.result.session.id}`;
  return route;
}

function currentLedgers(): ProgressLedgers {
  return {
    flags: store.progress,
    locations: store.locationProgress,
    outlines: store.outlineProgress,
    neighbors: store.neighborProgress,
  };
}

function allLedgersPersisting(): boolean {
  return store.persisting && store.mapPersisting && store.outlinePersisting && store.neighborPersisting;
}

function domainPersisting(domain: LearningDomain): boolean {
  if (domain === 'locations') return store.mapPersisting;
  if (domain === 'outlines') return store.outlinePersisting;
  if (domain === 'neighbors') return store.neighborPersisting;
  return store.persisting;
}

function restoreFocus(previousSelector: string | null): void {
  if (previousSelector) {
    const previous = root.querySelector<HTMLElement>(previousSelector);
    if (previous && !(previous instanceof HTMLButtonElement && previous.disabled)) {
      previous.focus();
      return;
    }
  }
  root.querySelector<HTMLElement>('[data-autofocus]')?.focus();
}

function render(previousSelector: string | null = null): void {
  const routeKey = currentRouteKey();
  const routeChanged = routeKey !== lastRenderedRouteKey;
  const focusIntent = renderFocusIntent(lastRenderedRouteKey !== null);

  switch (store.view.name) {
    case 'home':
      // Home summarises every domain at once, so its storage notice has to
      // reflect all four ledgers rather than Flags' alone.
      root.innerHTML = renderHome(currentLedgers(), allLedgersPersisting());
      break;
    case 'domain':
      root.innerHTML = renderDomainIndex(
        store.view.domain,
        currentLedgers(),
        domainPersisting(store.view.domain),
      );
      break;
    case 'scope':
      root.innerHTML = renderScope(store.progress, store.view.scope, store.persisting);
      break;
    case 'flags-study':
      root.innerHTML = renderFlagsStudy(store.view.scope, revealedFlagIds, revealAllFlagNames);
      break;
    case 'progress':
      root.innerHTML = renderProgress(
        currentLedgers(),
        store.achievements,
        resetArmed,
        store.persisting,
      );
      break;
    case 'quiz':
      if (!store.session) return;
      root.innerHTML = renderQuiz(store.session, store.progress, store.answeredCountryId);
      break;
    case 'results':
      root.innerHTML = renderResults(store.view.result);
      flagsRound.recordResult(store.view.result);
      break;
    case 'map-home':
      root.innerHTML = renderMapHome(
        store.locationProgress,
        store.view.scope,
        store.mapPersisting,
        launcherMapAsset,
      );
      break;
    case 'map-quiz':
      if (!store.mapSession || !store.mapAsset) return;
      root.innerHTML = renderMapQuiz(store.mapAsset, store.mapSession, store.mapLastWrongCountryId);
      break;
    case 'map-results':
      if (!store.mapAsset) return;
      root.innerHTML = renderMapResults(store.mapAsset, store.view.result);
      break;
    case 'outline-home':
      root.innerHTML = renderOutlineHome(
        store.outlineProgress,
        store.view.scope,
        store.outlinePersisting,
        launcherMapAsset,
      );
      break;
    case 'outline-quiz':
      if (!store.outlineSession || !store.outlineAsset) return;
      root.innerHTML = renderOutlineQuiz(store.outlineAsset, store.outlineSession, store.outlineProgress, store.outlineAnsweredCountryId);
      break;
    case 'outline-results':
      root.innerHTML = renderOutlineResults(store.view.result);
      break;
    case 'neighbor-home':
      root.innerHTML = renderNeighborHome(
        store.neighborProgress,
        store.view.scope,
        store.neighborPersisting,
        launcherMapAsset,
      );
      break;
    case 'neighbor-quiz':
      if (!store.neighborSession) return;
      root.innerHTML = renderNeighborQuiz(store.neighborSession, store.neighborLastOutcome, neighborsRound.getQuery());
      break;
    case 'neighbor-results':
      root.innerHTML = renderNeighborResults(store.view.result);
      break;
  }

  markFailedFlags(root);
  document.title = currentDocumentTitle();
  if (routeChanged && !preserveScrollOnNextRoute) {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  preserveScrollOnNextRoute = false;
  lastRenderedRouteKey = routeKey;
  if (focusIntent === 'restore-or-autofocus') restoreFocus(previousSelector);
}

function exitActiveRound(): void {
  if (!getActiveRoundRoute()) return;
  cancelAllPending();
  discardActiveRound();
  router.back();
}

function openDomain(id: string | undefined): void {
  if (!isLearningDomain(id)) return;
  navigateStable({ name: 'learning', domain: id });
}

function openScope(domainValue: string | undefined, id: string | undefined): void {
  if (!isLearningDomain(domainValue) || !id) return;
  const route = routeForScopeId(domainValue, id);
  if (route) navigateStable(route);
}

function quickPlay(
  domainValue: string | undefined,
  id: string | undefined,
  element: HTMLElement | null = null,
): void {
  if (!isLearningDomain(domainValue)) return;
  const scope = scopeForQuickPlay(domainValue, id);
  if (!scope) return;

  if (domainValue === 'flags') {
    flagsRound.begin(scope, 'test');
  } else if (domainValue === 'locations') {
    void withLaunchFeedback(element, () => locationsRound.begin('test', undefined, scope));
  } else if (domainValue === 'outlines') {
    void withLaunchFeedback(element, () => outlinesRound.begin('test', undefined, scope));
  } else {
    neighborsRound.begin('test', undefined, scope);
  }
}

function replaceLauncherScope(
  domainValue: string | undefined,
  id: string | undefined,
  expectedKind: 'continent' | 'region',
  focusSurface: 'list' | 'map' = 'list',
): void {
  if (!isLearningDomain(domainValue) || !id) return;
  const route = routeForScopeId(domainValue, id);
  if (!route?.scope || route.scope.kind !== expectedKind) return;
  const active = getActiveRoundRoute();
  if (active && !routesEqual(route, stableRoute(active))) discardActiveRound();

  preserveScrollOnNextRoute = true;
  router.navigate(route, { replace: true });
  if (expectedKind === 'region') {
    const selector = focusSurface === 'map'
      ? `.launcher-map-region[data-action="select-region"][data-id="${id}"]`
      : `.region-row__open[data-action="select-region"][data-id="${id}"]`;
    root.querySelector<HTMLElement | SVGElement>(selector)?.focus({ preventScroll: true });
    announce(`${route.scope.label} selected.`);
  } else {
    root.querySelector<HTMLElement>('.launcher__play')?.focus({ preventScroll: true });
    announce(`All ${route.scope.label} selected.`);
  }
}

root.addEventListener('click', (event) => {
  const element = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-action]') : null;
  if (!element) return;
  const action = element.dataset.action;
  const id = element.dataset.id;
  const selector = id
    ? `[data-action="${action}"][data-id="${id}"]`
    : `[data-action="${action}"]`;

  if (action === 'map-answer' && id) {
    locationsRound.submitAnswer(id, selector);
    return;
  }
  if (action === 'neighbor-guess' && id) {
    neighborsRound.submitGuess(id);
    return;
  }
  // Revealing a name is a local toggle, deliberately outside the render cycle:
  // a World-scope gallery is 195 cards and must not rebuild on every tap.
  if (action === 'reveal-flag' && id) {
    toggleFlagReveal(element, id);
    return;
  }
  if (action === 'toggle-all-names') {
    revealAllFlagNames = !revealAllFlagNames;
    revealedFlagIds.clear();
    announce(revealAllFlagNames ? 'All country names revealed.' : 'Country names hidden.');
    finishInteraction(selector);
    return;
  }
  if (action === 'quick-play') {
    quickPlay(element.dataset.domain, id, element);
    return;
  }
  if (action === 'open-domain') {
    openDomain(id);
    return;
  }
  if (action === 'open-scope') {
    openScope(element.dataset.domain, id);
    return;
  }
  if (action === 'select-region') {
    replaceLauncherScope(
      element.dataset.domain,
      id,
      'region',
      element.classList.contains('launcher-map-region') ? 'map' : 'list',
    );
    return;
  }
  if (action === 'select-continent') {
    replaceLauncherScope(element.dataset.domain, id, 'continent');
    return;
  }
  if (action === 'launcher-parent') {
    const parent = parentRoute(currentRoute);
    if (parent) navigateStable(parent);
    return;
  }
  if (action === 'route-parent') {
    const parent = parentRoute(currentRoute);
    if (parent) navigateStable(parent);
    return;
  }
  if (action === 'start-map-learn' || action === 'start-map-test') {
    void withLaunchFeedback(element, () => locationsRound.begin(action === 'start-map-learn' ? 'learn' : 'test'));
    return;
  }
  if (action === 'start-outline-learn' || action === 'start-outline-test') {
    void withLaunchFeedback(element, () => outlinesRound.begin(action === 'start-outline-learn' ? 'learn' : 'test'));
    return;
  }
  if (action === 'start-neighbor-learn' || action === 'start-neighbor-test') {
    neighborsRound.begin(action === 'start-neighbor-learn' ? 'learn' : 'test');
    return;
  }
  if (action === 'next-neighbor') {
    neighborsRound.advance();
    return;
  }
  if (action === 'review-neighbors' && store.view.name === 'neighbor-results') {
    neighborsRound.reviewMistakes();
    return;
  }
  if (action === 'repeat-neighbors' && store.view.name === 'neighbor-results') {
    neighborsRound.repeat();
    return;
  }
  if (action === 'review-map-mistakes' && store.view.name === 'map-results') {
    locationsRound.reviewMistakes();
    return;
  }
  if (action === 'repeat-map' && store.view.name === 'map-results') {
    locationsRound.repeat();
    return;
  }
  if (action === 'review-outline-mistakes' && store.view.name === 'outline-results') {
    outlinesRound.reviewMistakes();
    return;
  }
  if (action === 'repeat-outline' && store.view.name === 'outline-results') {
    outlinesRound.repeat();
    return;
  }
  if (action === 'exit-round' || action === 'exit-quiz' || action === 'exit-map' || action === 'exit-outline') {
    exitActiveRound();
    return;
  }

  if (action !== 'reset-request' && action !== 'reset-confirm') resetArmed = false;

  switch (action) {
    case 'home':
      navigateStable({ name: 'home' });
      return;
    case 'open-progress':
      navigateStable({ name: 'progress' });
      return;
    case 'reset-request':
      resetArmed = true;
      break;
    case 'reset-cancel':
      resetArmed = false;
      break;
    case 'reset-confirm':
      resetAllProgress();
      resetMapProgressStorage();
      resetOutlineProgressStorage();
      resetNeighborProgressStorage();
      store.resetProgress();
      store.resetMapProgress();
      store.resetOutlineProgress();
      store.resetNeighborProgress();
      setActiveRoundRoute(null);
      neighborsRound.resetQuery();
      resetArmed = false;
      announce('All flag, location, outline, and neighbour progress erased.');
      break;
    case 'start-learn':
      if (currentRoute.name === 'learning' && currentRoute.domain === 'flags') {
        router.navigate(routeForScope('flags', flagsRound.currentScope(), 'learn'));
        return;
      }
      break;
    case 'start-test':
      if (currentRoute.name === 'learning' && currentRoute.domain === 'flags') {
        flagsRound.begin(flagsRound.currentScope(), 'test');
        return;
      }
      break;
    case 'answer':
      if (id) flagsRound.submitAnswer(id);
      break;
    case 'outline-answer':
      if (id) outlinesRound.submitAnswer(id);
      break;
    case 'next-question':
      store.advance();
      break;
    case 'next-outline-question':
      store.advanceOutline();
      break;
    case 'review-mistakes':
      if (flagsRound.reviewMistakes()) return;
      break;
    case 'repeat-scope':
      if (flagsRound.repeat()) return;
      break;
  }

  flagsRound.announceResult();
  outlinesRound.announceResult();
  finishInteraction(selector);
});

root.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const region = event.target instanceof Element
    ? event.target.closest<SVGElement>('.launcher-map-region[data-action="select-region"]')
    : null;
  if (!region) return;
  event.preventDefault();
  replaceLauncherScope(region.dataset.domain, region.dataset.id, 'region', 'map');
});

root.addEventListener('input', (event) => {
  const input = event.target instanceof HTMLInputElement && event.target.matches('[data-neighbor-input]')
    ? event.target
    : null;
  if (!input || store.view.name !== 'neighbor-quiz' || !store.neighborSession) return;
  neighborsRound.setQuery(input.value);
  const suggestions = root.querySelector<HTMLElement>('#neighbor-suggestions');
  if (suggestions) suggestions.innerHTML = renderNeighborSuggestions(store.neighborSession, neighborsRound.getQuery());
});

root.addEventListener('submit', (event) => {
  const form = event.target instanceof HTMLFormElement && event.target.matches('[data-neighbor-form]')
    ? event.target
    : null;
  if (!form || store.view.name !== 'neighbor-quiz') return;
  event.preventDefault();
  const country = resolveCountryGuess(COUNTRIES, allowedNeighborCountryIds, neighborsRound.getQuery());
  if (!country) {
    notify('Choose a country from the suggestions, or type a complete supported country name.');
    return;
  }
  neighborsRound.submitGuess(country.id);
});

window.addEventListener('keydown', (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  if (store.view.name === 'neighbor-quiz' && store.neighborSession) {
    if (event.key === 'Escape') {
      event.preventDefault();
      exitActiveRound();
    }
    return;
  }

  if (store.view.name === 'map-quiz' && store.mapSession) {
    if (event.key === 'Escape') {
      event.preventDefault();
      exitActiveRound();
      return;
    }

    const focused = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-action="map-answer"]') : null;
    if (focused && (event.key === 'Enter' || event.key === ' ')) {
      const id = focused.dataset.id;
      if (id) {
        event.preventDefault();
        locationsRound.submitAnswer(id, `[data-action="map-answer"][data-id="${id}"]`);
      }
    }
    return;
  }

  if (store.view.name === 'outline-quiz' && store.outlineSession) {
    if (event.key === 'Escape') {
      event.preventDefault();
      exitActiveRound();
      return;
    }

    if (store.outlineAnsweredCountryId === null && /^[1-4]$/.test(event.key)) {
      const question = store.outlineSession.questions[store.outlineSession.currentIndex];
      const countryId = question?.optionCountryIds[Number(event.key) - 1];
      if (countryId) {
        event.preventDefault();
        outlinesRound.submitAnswer(countryId);
        finishInteraction(null);
      }
      return;
    }

    if (store.outlineAnsweredCountryId !== null && store.outlineSession.mode === 'learn' && event.key === 'Enter') {
      event.preventDefault();
      store.advanceOutline();
      outlinesRound.announceResult();
      finishInteraction(null);
    }
    return;
  }

  if (store.view.name !== 'quiz' || !store.session) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    exitActiveRound();
    return;
  }

  if (store.answeredCountryId === null && /^[1-4]$/.test(event.key)) {
    const question = store.session.questions[store.session.currentIndex];
    const countryId = question?.optionCountryIds[Number(event.key) - 1];
    if (countryId) {
      event.preventDefault();
      flagsRound.submitAnswer(countryId);
      finishInteraction(null);
    }
    return;
  }

  if (store.answeredCountryId !== null && event.key === 'Enter') {
    event.preventDefault();
    if (store.session.mode === 'test') {
      flagsRound.advanceNow();
      return;
    }
    store.advance();
    flagsRound.announceResult();
    finishInteraction(null);
  }
});

window.addEventListener('pagehide', () => {
  flushAttempts();
  flushMapAttempts();
  flushOutlineAttempts();
  flushNeighborAttempts();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    flushAttempts();
    flushMapAttempts();
    flushOutlineAttempts();
    flushNeighborAttempts();
  }
});

installNavigationGestures({
  getParentRoute: () => parentRoute(currentRoute),
  onBack: () => {
    const parent = parentRoute(currentRoute);
    if (parent) navigateStable(parent);
  },
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}

const initialRoute = router.current() ?? { name: 'home' as const };
router.navigate(initialRoute, { replace: true });
