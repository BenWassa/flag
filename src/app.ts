import { COUNTRIES, COUNTRY_BY_ID } from './data/countries.js';
import { AFRICA_MAP_SCOPE } from './data/map-scopes.js';
import { loadMapAsset } from './data/maps/index.js';
import { AFRICA_LAND_ADJACENCY } from './data/neighbors/index.js';
import { loadOutlineAsset } from './data/outlines.js';
import { domainDisplayName } from './domain/display.js';
import type {
  LearningActivity,
  LearningStatus,
  StudyMode,
  StudyScope,
} from './domain/models.js';
import type { MapMode, MapRegionAsset } from './domain/map-models.js';
import { resolveCountryGuess } from './domain/neighbor-game.js';
import { getRecord, masteryGoal } from './domain/progress.js';
import { flushMapAttempts, resetMapProgressStorage } from './infrastructure/map-storage.js';
import { flushNeighborAttempts, resetNeighborProgressStorage } from './infrastructure/neighbor-storage.js';
import { flushOutlineAttempts, resetOutlineProgressStorage } from './infrastructure/outline-storage.js';
import { flushAttempts, resetAllProgress } from './infrastructure/storage.js';
import { createHashRouter } from './routing/router.js';
import {
  atlasRouteForScope,
  isLearningDomain,
  normalizeAvailableRoute,
  parentRoute,
  routeForScope,
  routeForScopeId,
  routeTitle,
  routesEqual,
  scopeForId,
  scopeForQuickPlay,
  serializeRoutePath,
  stableRoute,
  type AppRoute,
  type LearningRoute,
} from './routing/routes.js';
import { AppStore } from './state/store.js';
import { markFailedFlags } from './ui/components/flag.js';
import { renderLauncherMap } from './ui/components/launcher-map.js';
import { renderFocusIntent } from './ui/focus.js';
import { renderDomainHome } from './ui/views/domain.js';
import { renderContinent } from './ui/views/atlas.js';
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

const store = new AppStore();
const router = createHashRouter(window);
const allowedNeighborCountryIds = new Set(Object.keys(AFRICA_LAND_ADJACENCY));
let currentRoute: AppRoute = { name: 'home' };
let activeRoundRoute: LearningRoute | null = null;
let progressFilter: LearningStatus | 'all' = 'all';
let resetArmed = false;
let lastResultScope: StudyScope | null = null;
let lastResultMode: StudyMode = 'learn';
let lastMissedIds: string[] = [];
let lastOutlineResultScope: StudyScope | null = null;
let lastOutlineResultMode: StudyMode = 'learn';
let lastOutlineMissedIds: string[] = [];
let neighborQuery = '';
let pendingAdvance: number | null = null;
let pendingMapAdvance: number | null = null;
let pendingOutlineAdvance: number | null = null;
let lastRenderedRouteKey: string | null = null;
let launcherMapAsset: MapRegionAsset | null = null;
let launcherMapRequest = 0;
let roundLaunchRequest = 0;
let preserveScrollOnNextRoute = false;

function cancelPendingAdvance(): void {
  if (pendingAdvance === null) return;
  window.clearTimeout(pendingAdvance);
  pendingAdvance = null;
}

function cancelPendingMapAdvance(): void {
  if (pendingMapAdvance === null) return;
  window.clearTimeout(pendingMapAdvance);
  pendingMapAdvance = null;
}

function cancelPendingOutlineAdvance(): void {
  if (pendingOutlineAdvance === null) return;
  window.clearTimeout(pendingOutlineAdvance);
  pendingOutlineAdvance = null;
}

function cancelAllPending(): void {
  cancelPendingAdvance();
  cancelPendingMapAdvance();
  cancelPendingOutlineAdvance();
}

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

function routeHasActiveRound(route: LearningRoute): boolean {
  if (!activeRoundRoute || !routesEqual(route, activeRoundRoute)) return false;
  if (route.domain === 'flags') return store.session !== null;
  if (route.domain === 'locations') return store.mapSession !== null && store.mapAsset !== null;
  if (route.domain === 'outlines') return store.outlineSession !== null && store.outlineAsset !== null;
  if (route.domain === 'neighbors') return store.neighborSession !== null;
  return false;
}

function normalizeRoute(route: AppRoute): AppRoute {
  if (route.name !== 'learning') return route;

  if (route.activity !== undefined && !routeHasActiveRound(route)) {
    return stableRoute(route);
  }

  return normalizeAvailableRoute(route);
}

function routeUsesLauncherMap(route: AppRoute): route is LearningRoute {
  return route.name === 'learning'
    && route.activity === undefined
    && route.domain !== 'flags'
    && route.scope !== undefined;
}

async function hydrateLauncherMap(route: AppRoute): Promise<void> {
  const request = ++launcherMapRequest;
  if (!routeUsesLauncherMap(route)) return;

  const host = root.querySelector<HTMLElement>('[data-launcher-map-slot]');
  if (!host || launcherMapAsset) return;

  try {
    const asset = await loadMapAsset('africa');
    if (!asset) throw new Error('Africa geometry unavailable.');
    launcherMapAsset = asset;

    if (
      request !== launcherMapRequest
      || !host.isConnected
      || !routesEqual(currentRoute, route)
    ) return;

    const selectedRegionId = route.scope?.kind === 'region' ? route.scope.id : undefined;
    host.innerHTML = renderLauncherMap(asset, route.domain, selectedRegionId);
  } catch {
    if (
      request !== launcherMapRequest
      || !host.isConnected
      || !routesEqual(currentRoute, route)
    ) return;
    host.innerHTML = '<p class="launcher-map-error">Map unavailable. Choose a region from the list.</p>';
  }
}

function applyRoute(requestedRoute: AppRoute): void {
  const route = normalizeRoute(requestedRoute);
  if (!routesEqual(route, requestedRoute)) {
    router.navigate(route, { replace: true });
    return;
  }

  currentRoute = route;
  switch (route.name) {
    case 'home':
      store.navigate({ name: 'home' });
      break;
    case 'progress':
      store.navigate({ name: 'progress' });
      break;
    case 'atlas':
      store.navigate({ name: 'atlas-continent', scope: route.scope });
      break;
    case 'learning':
      if (route.activity !== undefined) {
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
  roundLaunchRequest += 1;
  cancelAllPending();
  resetArmed = false;
  applyRoute(route ?? { name: 'home' });
});

function discardActiveRound(): void {
  if (!activeRoundRoute) return;
  if (activeRoundRoute.domain === 'flags') store.abandonSession();
  if (activeRoundRoute.domain === 'locations') store.abandonMapSession();
  if (activeRoundRoute.domain === 'outlines') store.abandonOutlineSession();
  if (activeRoundRoute.domain === 'neighbors') store.abandonNeighborSession();
  activeRoundRoute = null;
  neighborQuery = '';
}

function navigateStable(route: AppRoute): void {
  if (activeRoundRoute && !routesEqual(route, stableRoute(activeRoundRoute))) discardActiveRound();
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
      root.innerHTML = renderHome(
        store.progress,
        store.persisting && store.mapPersisting && store.outlinePersisting && store.neighborPersisting,
      );
      break;
    case 'atlas-continent':
      root.innerHTML = renderContinent(store.progress, store.view.scope, store.persisting);
      break;
    case 'domain':
      root.innerHTML = renderDomainHome(
        store.view.domain,
        store.progress,
        store.persisting,
      );
      break;
    case 'scope':
      root.innerHTML = renderScope(store.progress, store.view.scope, store.persisting);
      break;
    case 'progress':
      root.innerHTML = renderProgress(store.progress, progressFilter, resetArmed, store.persisting);
      break;
    case 'quiz':
      if (!store.session) return;
      root.innerHTML = renderQuiz(store.session, store.progress, store.answeredCountryId);
      break;
    case 'results':
      root.innerHTML = renderResults(store.view.result);
      lastResultScope = store.view.result.session.scope;
      lastResultMode = store.view.result.session.mode;
      lastMissedIds = [...new Set(store.view.result.missed.map((attempt) => attempt.countryId))];
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
      lastOutlineResultScope = store.view.result.session.scope;
      lastOutlineResultMode = store.view.result.session.mode;
      lastOutlineMissedIds = [...new Set(store.view.result.missed.map((attempt) => attempt.countryId))];
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
      root.innerHTML = renderNeighborQuiz(store.neighborSession, store.neighborLastOutcome, neighborQuery);
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

function currentFlagScope(): StudyScope {
  if (currentRoute.name === 'learning' && currentRoute.domain === 'flags' && currentRoute.scope) {
    return currentRoute.scope;
  }
  return { kind: 'world', label: 'World' };
}

function beginSession(
  scope: StudyScope,
  mode: StudyMode,
  size?: number,
  reviewIds?: string[],
  activity: LearningActivity = mode,
  replaceRoute = false,
): void {
  cancelAllPending();
  if (!store.startSession(scope, mode, size, reviewIds)) {
    announce(`${scope.label} has no flags to practise right now.`);
    return;
  }

  activeRoundRoute = routeForScope('flags', scope, activity);
  router.navigate(activeRoundRoute, { replace: replaceRoute });
  const count = store.session?.questions.length ?? 0;
  announce(`${scope.label}. ${activity === 'review' ? 'Review' : mode === 'learn' ? 'Learn' : 'Play'} round of ${count} flags. Question 1.`);
}

function currentMapScope(): StudyScope {
  if (currentRoute.name === 'learning' && currentRoute.domain === 'locations' && currentRoute.scope) {
    return currentRoute.scope;
  }
  if (store.view.name === 'map-results') return store.view.result.session.scope;
  return store.mapSession?.scope ?? AFRICA_MAP_SCOPE;
}

async function beginMapSession(
  mode: MapMode,
  targetCountryIds?: readonly string[],
  scope: StudyScope = currentMapScope(),
  activity: LearningActivity = mode,
  replaceRoute = false,
): Promise<void> {
  cancelAllPending();
  const request = ++roundLaunchRequest;
  const scopeId = scope.id ?? 'africa';
  let asset: MapRegionAsset | null;
  try {
    asset = await loadMapAsset(scopeId);
  } catch {
    if (request === roundLaunchRequest) announce(`${scope.label} map could not be loaded.`);
    return;
  }
  if (request !== roundLaunchRequest) return;
  if (!asset) {
    announce(`${scope.label} map could not be loaded.`);
    return;
  }
  if (!store.startMapSession(asset, mode, targetCountryIds)) {
    announce('No map locations are available for this round.');
    return;
  }

  activeRoundRoute = routeForScope('locations', scope, activity);
  router.navigate(activeRoundRoute, { replace: replaceRoute });
  announce(`${asset.scope.label} locations. ${activity === 'review' ? 'Review' : mode === 'learn' ? 'Learn' : 'Play'} round of ${store.mapSession?.countryIds.length ?? 0} countries.`);
}

function currentOutlineScope(): StudyScope {
  if (currentRoute.name === 'learning' && currentRoute.domain === 'outlines' && currentRoute.scope) {
    return currentRoute.scope;
  }
  if (store.view.name === 'outline-results') return store.view.result.session.scope;
  return store.outlineSession?.scope ?? AFRICA_MAP_SCOPE;
}

async function beginOutlineSession(
  mode: StudyMode,
  targetCountryIds?: readonly string[],
  scope: StudyScope = currentOutlineScope(),
  activity: LearningActivity = mode,
  replaceRoute = false,
): Promise<void> {
  cancelAllPending();
  const request = ++roundLaunchRequest;
  let asset: Awaited<ReturnType<typeof loadOutlineAsset>>;
  try {
    asset = await loadOutlineAsset(scope.id ?? 'africa');
  } catch {
    if (request === roundLaunchRequest) announce(`${scope.label} silhouettes could not be loaded.`);
    return;
  }
  if (request !== roundLaunchRequest) return;
  if (!asset) {
    announce(`${scope.label} silhouettes could not be loaded.`);
    return;
  }
  const size = targetCountryIds ? Math.max(1, Math.min(10, targetCountryIds.length)) : 10;
  if (!store.startOutlineSession(asset, mode, size, targetCountryIds)) {
    announce('No country outlines are available for this round.');
    return;
  }

  activeRoundRoute = routeForScope('outlines', scope, activity);
  router.navigate(activeRoundRoute, { replace: replaceRoute });
  announce(`${asset.scope.label} outlines. ${activity === 'review' ? 'Review' : mode === 'learn' ? 'Learn' : 'Play'} round of ${store.outlineSession?.questions.length ?? 0} countries. Question 1.`);
}

function currentNeighborScope(): StudyScope {
  if (currentRoute.name === 'learning' && currentRoute.domain === 'neighbors' && currentRoute.scope) return currentRoute.scope;
  if (store.view.name === 'neighbor-results') return store.view.result.session.scope;
  return store.neighborSession?.scope ?? AFRICA_MAP_SCOPE;
}

function beginNeighborSession(
  mode: StudyMode,
  targetCountryIds?: readonly string[],
  scope: StudyScope = currentNeighborScope(),
  activity: LearningActivity = mode,
  replaceRoute = false,
): void {
  cancelAllPending();
  const size = targetCountryIds?.length ?? 10;
  if (!store.startNeighborSession(scope, mode, size, targetCountryIds)) {
    announce(`${scope.label} has no land-neighbour targets to practise right now.`);
    return;
  }
  neighborQuery = '';
  activeRoundRoute = routeForScope('neighbors', scope, activity);
  router.navigate(activeRoundRoute, { replace: replaceRoute });
  const targetId = store.neighborSession?.countryIds[0];
  const target = targetId ? COUNTRY_BY_ID.get(targetId) : undefined;
  announce(`${scope.label} neighbours. ${activity === 'review' ? 'Review' : mode === 'learn' ? 'Learn' : 'Play'} round. ${target ? `Name every land neighbour of ${target.name}.` : ''}`);
}

function exitActiveRound(): void {
  if (!activeRoundRoute) return;
  cancelAllPending();
  discardActiveRound();
  router.back();
}

function answerAnnouncement(countryId: string): string {
  if (!store.session) return '';
  const question = store.session.questions[store.session.currentIndex];
  const target = question ? COUNTRY_BY_ID.get(question.countryId) : undefined;
  if (!target) return '';
  if (store.session.mode === 'test') return 'Answer recorded.';

  const record = getRecord(store.progress, target.id);
  const state = record.status === 'mastered'
    ? 'Now mastered.'
    : `Learning, ${record.masteryStreak} of ${masteryGoal(record)} rounds.`;
  return countryId === target.id
    ? `Correct. ${target.name}. ${state}`
    : `Incorrect. The answer is ${target.name}. ${state}`;
}

function submitAnswer(countryId: string): void {
  if (!store.session || store.answeredCountryId !== null) return;
  store.answer(countryId);
  announce(answerAnnouncement(countryId));

  if (store.session.mode === 'test') {
    cancelPendingAdvance();
    pendingAdvance = window.setTimeout(() => {
      pendingAdvance = null;
      if (store.view.name !== 'quiz') return;
      store.advance();
      announceResult();
      finishInteraction(null);
    }, 180);
  }
}

function outlineAnswerAnnouncement(countryId: string): string {
  if (!store.outlineSession) return '';
  const question = store.outlineSession.questions[store.outlineSession.currentIndex];
  const target = question ? COUNTRY_BY_ID.get(question.countryId) : undefined;
  if (!target) return '';
  if (store.outlineSession.mode === 'test') return 'Answer recorded.';

  const record = getRecord(store.outlineProgress, target.id);
  const state = record.status === 'mastered'
    ? 'Now mastered.'
    : `Learning, ${record.masteryStreak} of ${masteryGoal(record)} rounds.`;
  return countryId === target.id
    ? `Correct. ${target.name}. ${state}`
    : `Incorrect. The answer is ${target.name}. ${state}`;
}

function submitOutlineAnswer(countryId: string): void {
  if (!store.outlineSession || store.outlineAnsweredCountryId !== null) return;
  store.answerOutline(countryId);
  announce(outlineAnswerAnnouncement(countryId));

  if (store.outlineSession.mode === 'test') {
    cancelPendingOutlineAdvance();
    pendingOutlineAdvance = window.setTimeout(() => {
      pendingOutlineAdvance = null;
      if (store.view.name !== 'outline-quiz') return;
      store.advanceOutline();
      announceOutlineResult();
      finishInteraction(null);
    }, 180);
  }
}

function mapAnswerAnnouncement(): string {
  const outcome = store.mapLastOutcome;
  const session = store.mapSession;
  if (!outcome || !session) return '';
  if (session.mode === 'test') return 'Location recorded.';
  if (outcome.correct) {
    if (outcome.misses === 0) return 'Correct on the first try.';
    return `Correct after ${outcome.misses} ${outcome.misses === 1 ? 'miss' : 'misses'}.`;
  }
  if (outcome.revealed) {
    const target = COUNTRY_BY_ID.get(outcome.targetCountryId);
    return `Three misses. ${target?.name ?? 'The country'} is revealed in red.`;
  }
  const left = 3 - outcome.misses;
  return `Incorrect. ${left} ${left === 1 ? 'try' : 'tries'} left.`;
}

function submitMapAnswer(countryId: string, selector: string): void {
  if (store.view.name !== 'map-quiz' || !store.mapSession) return;
  const currentId = store.mapSession.countryIds[store.mapSession.currentIndex];
  if (!currentId || store.mapSession.targets[currentId]?.resolved) return;

  const outcome = store.answerMap(countryId);
  const advanceDelay = store.mapSession.mode === 'test'
    ? 180
    : outcome.revealed
      ? 1400
      : outcome.misses >= 2
        ? 850
        : outcome.misses === 1
          ? 700
          : 520;
  announce(mapAnswerAnnouncement());
  finishInteraction(selector);

  if (!outcome.resolved) return;
  cancelPendingMapAdvance();
  pendingMapAdvance = window.setTimeout(() => {
    pendingMapAdvance = null;
    if (store.view.name !== 'map-quiz') return;
    const result = store.advanceMap();
    if (result) announceMapResult();
    else if (store.mapSession) {
      const nextId = store.mapSession.countryIds[store.mapSession.currentIndex];
      const next = nextId ? COUNTRY_BY_ID.get(nextId) : undefined;
      if (next) announce(`Next country. Find ${next.name}.`);
    }
    finishInteraction(null);
  }, advanceDelay);
}

function neighborAnswerAnnouncement(): string {
  const outcome = store.neighborLastOutcome;
  if (!outcome) return '';
  if (outcome.kind === 'duplicate') return 'Already guessed. No attempt used.';
  const selected = COUNTRY_BY_ID.get(outcome.selectedCountryId)?.name ?? outcome.selectedCountryId;
  if (outcome.resolved && outcome.resolution === 'exhausted') {
    const remaining = outcome.revealedIds.map((id) => COUNTRY_BY_ID.get(id)?.name ?? id).join(', ');
    return `Attempts exhausted. Remaining neighbours: ${remaining}.`;
  }
  if (outcome.resolved) return `Complete. ${outcome.foundCount} of ${outcome.totalNeighbors} neighbours found.`;
  return outcome.kind === 'correct'
    ? `Correct. ${selected}. ${outcome.foundCount} of ${outcome.totalNeighbors} found. ${outcome.remainingAttempts} attempts left.`
    : `Incorrect. ${selected} is not in this neighbour set. ${outcome.remainingAttempts} attempts left.`;
}

function submitNeighborGuess(countryId: string): void {
  if (store.view.name !== 'neighbor-quiz' || !store.neighborSession) return;
  const targetId = store.neighborSession.countryIds[store.neighborSession.currentIndex];
  if (!targetId || store.neighborSession.targets[targetId]?.resolved) return;
  const outcome = store.answerNeighbor(countryId);
  neighborQuery = '';
  announce(neighborAnswerAnnouncement());
  finishInteraction(outcome.resolved ? null : '[data-neighbor-input]');
}

function finishInteraction(previousSelector: string | null): void {
  render(previousSelector);
}

function openDomain(id: string | undefined): void {
  if (!isLearningDomain(id)) return;
  navigateStable({ name: 'learning', domain: id });
}

function openAtlas(id: string | undefined): void {
  if (!id) return;
  const scope = scopeForId(id);
  if (!scope) return;
  const route = atlasRouteForScope(scope);
  if (route) navigateStable(route);
}

function openScope(domainValue: string | undefined, id: string | undefined): void {
  if (!isLearningDomain(domainValue) || !id) return;
  const route = routeForScopeId(domainValue, id);
  if (route) navigateStable(route);
}

function quickPlay(domainValue: string | undefined, id: string | undefined): void {
  if (!isLearningDomain(domainValue)) return;
  const scope = scopeForQuickPlay(domainValue, id);
  if (!scope) return;

  if (domainValue === 'flags') {
    beginSession(scope, 'test');
  } else if (domainValue === 'locations') {
    void beginMapSession('test', undefined, scope);
  } else if (domainValue === 'outlines') {
    void beginOutlineSession('test', undefined, scope);
  } else {
    beginNeighborSession('test', undefined, scope);
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
  if (activeRoundRoute && !routesEqual(route, stableRoute(activeRoundRoute))) discardActiveRound();

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
    submitMapAnswer(id, selector);
    return;
  }
  if (action === 'neighbor-guess' && id) {
    submitNeighborGuess(id);
    return;
  }
  if (action === 'quick-play') {
    quickPlay(element.dataset.domain, id);
    return;
  }
  if (action === 'open-atlas') {
    openAtlas(id);
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
    void beginMapSession(action === 'start-map-learn' ? 'learn' : 'test');
    return;
  }
  if (action === 'start-outline-learn' || action === 'start-outline-test') {
    void beginOutlineSession(action === 'start-outline-learn' ? 'learn' : 'test');
    return;
  }
  if (action === 'start-neighbor-learn' || action === 'start-neighbor-test') {
    beginNeighborSession(action === 'start-neighbor-learn' ? 'learn' : 'test');
    return;
  }
  if (action === 'next-neighbor') {
    const result = store.advanceNeighbor();
    neighborQuery = '';
    if (result) announceNeighborResult();
    else if (store.neighborSession) {
      const nextId = store.neighborSession.countryIds[store.neighborSession.currentIndex];
      const next = nextId ? COUNTRY_BY_ID.get(nextId) : undefined;
      if (next) announce(`Next country. Name every land neighbour of ${next.name}.`);
    }
    finishInteraction(result ? null : '[data-neighbor-input]');
    return;
  }
  if (action === 'review-neighbors' && store.view.name === 'neighbor-results') {
    beginNeighborSession('learn', store.view.result.missedCountryIds, store.view.result.session.scope, 'review', true);
    return;
  }
  if (action === 'repeat-neighbors' && store.view.name === 'neighbor-results') {
    beginNeighborSession(store.view.result.session.mode, undefined, store.view.result.session.scope, store.view.result.session.mode, true);
    return;
  }
  if (action === 'review-map-mistakes' && store.view.name === 'map-results') {
    void beginMapSession(
      'learn',
      store.view.result.missedCountryIds,
      store.view.result.session.scope,
      'review',
      true,
    );
    return;
  }
  if (action === 'repeat-map' && store.view.name === 'map-results') {
    void beginMapSession(
      store.view.result.session.mode,
      undefined,
      store.view.result.session.scope,
      store.view.result.session.mode,
      true,
    );
    return;
  }
  if (action === 'review-outline-mistakes' && store.view.name === 'outline-results') {
    void beginOutlineSession('learn', lastOutlineMissedIds, store.view.result.session.scope, 'review', true);
    return;
  }
  if (action === 'repeat-outline' && store.view.name === 'outline-results') {
    void beginOutlineSession(store.view.result.session.mode, undefined, store.view.result.session.scope, store.view.result.session.mode, true);
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
    case 'filter-progress':
      progressFilter = (id as LearningStatus | 'all') ?? 'all';
      break;
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
      activeRoundRoute = null;
      neighborQuery = '';
      resetArmed = false;
      progressFilter = 'all';
      announce('All flag, location, outline, and neighbour progress erased.');
      break;
    case 'start-learn':
      if (currentRoute.name === 'learning' && currentRoute.domain === 'flags') {
        beginSession(currentFlagScope(), 'learn');
        return;
      }
      break;
    case 'start-test':
      if (currentRoute.name === 'learning' && currentRoute.domain === 'flags') {
        beginSession(currentFlagScope(), 'test');
        return;
      }
      break;
    case 'answer':
      if (id) submitAnswer(id);
      break;
    case 'outline-answer':
      if (id) submitOutlineAnswer(id);
      break;
    case 'next-question':
      store.advance();
      break;
    case 'next-outline-question':
      store.advanceOutline();
      break;
    case 'review-mistakes':
      if (lastResultScope && lastMissedIds.length) {
        beginSession(
          lastResultScope,
          'learn',
          Math.max(4, Math.min(10, lastMissedIds.length)),
          lastMissedIds,
          'review',
          true,
        );
        return;
      }
      break;
    case 'repeat-scope':
      if (lastResultScope) {
        beginSession(lastResultScope, lastResultMode, undefined, undefined, lastResultMode, true);
        return;
      }
      break;
  }

  announceResult();
  announceOutlineResult();
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
  neighborQuery = input.value;
  const suggestions = root.querySelector<HTMLElement>('#neighbor-suggestions');
  if (suggestions) suggestions.innerHTML = renderNeighborSuggestions(store.neighborSession, neighborQuery);
});

root.addEventListener('submit', (event) => {
  const form = event.target instanceof HTMLFormElement && event.target.matches('[data-neighbor-form]')
    ? event.target
    : null;
  if (!form || store.view.name !== 'neighbor-quiz') return;
  event.preventDefault();
  const country = resolveCountryGuess(COUNTRIES, allowedNeighborCountryIds, neighborQuery);
  if (!country) {
    announce('Choose a country from the suggestions or enter a complete supported country name.');
    return;
  }
  submitNeighborGuess(country.id);
});

function announceResult(): void {
  if (store.view.name !== 'results') return;
  const { correct, total, newlyMastered } = store.view.result;
  const mastery = newlyMastered.length ? ` ${newlyMastered.length} newly mastered.` : '';
  announce(`Round complete. ${correct} of ${total} correct.${mastery}`);
}

function announceOutlineResult(): void {
  if (store.view.name !== 'outline-results') return;
  const { correct, total, newlyMastered } = store.view.result;
  const mastery = newlyMastered.length ? ` ${newlyMastered.length} newly mastered.` : '';
  announce(`Outline round complete. ${correct} of ${total} correct.${mastery}`);
}

function announceMapResult(): void {
  if (store.view.name !== 'map-results') return;
  const { firstTryCorrect, total, missedCountryIds } = store.view.result;
  announce(`Map round complete. ${firstTryCorrect} of ${total} first try. ${missedCountryIds.length} to review.`);
}

function announceNeighborResult(): void {
  if (store.view.name !== 'neighbor-results') return;
  const { cleanCompletions, total, missedCountryIds } = store.view.result;
  announce(`Neighbour round complete. ${cleanCompletions} of ${total} clean completions. ${missedCountryIds.length} to review.`);
}

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
        submitMapAnswer(id, `[data-action="map-answer"][data-id="${id}"]`);
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
        submitOutlineAnswer(countryId);
        finishInteraction(null);
      }
      return;
    }

    if (store.outlineAnsweredCountryId !== null && store.outlineSession.mode === 'learn' && event.key === 'Enter') {
      event.preventDefault();
      store.advanceOutline();
      announceOutlineResult();
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
      submitAnswer(countryId);
      finishInteraction(null);
    }
    return;
  }

  if (store.answeredCountryId !== null && store.session.mode === 'learn' && event.key === 'Enter') {
    event.preventDefault();
    store.advance();
    announceResult();
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}

const initialRoute = router.current() ?? { name: 'home' as const };
router.navigate(initialRoute, { replace: true });
