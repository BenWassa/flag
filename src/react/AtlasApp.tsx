import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { COUNTRIES } from '../data/countries.js';
import { getMapContinentConfigForScope } from '../data/map-scopes.js';
import { loadMapAsset } from '../data/maps/index.js';
import { NEIGHBOR_GUESS_COUNTRY_IDS } from '../data/neighbors/index.js';
import { domainDisplayName } from '../domain/display.js';
import { resolveCountryGuess } from '../domain/neighbor-game.js';
import type { LearningDomain, StudyScope } from '../domain/models.js';
import type { ProgressLedgers } from '../domain/progress-summary.js';
import { flushMapAttempts } from '../infrastructure/map-storage.js';
import { flushNeighborAttempts } from '../infrastructure/neighbor-storage.js';
import { flushOutlineAttempts } from '../infrastructure/outline-storage.js';
import { flushAttempts } from '../infrastructure/storage.js';
import { dismissInstallPrompt, isInstallPromptDismissed } from '../infrastructure/install-prompt-storage.js';
import { installNavigationGestures } from '../navigation-gestures.js';
import { createHashRouter } from '../routing/router.js';
import { isLearningDomain, normalizeAvailableRoute, parentRoute, routeForScope, routeForScopeId, routeTitle, routesEqual, serializeRoutePath, stableRoute, type AppRoute, type LearningRoute } from '../routing/routes.js';
import { getActiveRoundRoute, setActiveRoundRoute } from '../state/active-round.js';
import { createFlagsRound } from '../state/flags-round.js';
import { createLocationsRound } from '../state/locations-round.js';
import { createNeighborsRound } from '../state/neighbors-round.js';
import { createOutlinesRound } from '../state/outlines-round.js';
import { invalidatePendingRoundLaunch } from '../state/round-launch-guard.js';
import type { RoundContext } from '../state/round-context.js';
import { AppStore } from '../state/store.js';
import { SpatialShell } from '../spatial/SpatialShell.js';
import { deriveSpatialState, resolveTapTarget, type SpatialState } from '../spatial/spatial-state.js';
import { AtlasActionsContext, type AtlasActions } from './actions.js';
import { Icon } from './components/Icon.js';
import { DomainScreen, FlagsStudyScreen, HomeScreen, ProfileScreen } from './screens/PassiveScreens.js';
import { LauncherScreen } from './screens/LauncherScreens.js';
import { FlagsQuizScreen, OutlineQuizScreen, RecognitionResultsScreen } from './screens/RecognitionScreens.js';
import { LocationQuizScreen, LocationResultsScreen } from './screens/LocationScreens.js';
import { NeighborQuizScreen, NeighborResultsScreen } from './screens/NeighborScreens.js';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function standalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function iosSafari(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

export function AtlasApp() {
  const store = useMemo(() => new AppStore(), []);
  const router = useMemo(() => createHashRouter(window), []);
  const [, revise] = useReducer((value: number) => value + 1, 0);
  const currentRoute = useRef<AppRoute>({ name: 'home' });
  const controllers = useRef<ReturnType<typeof createControllers> | null>(null);
  const focusSelector = useRef<string | null>(null);
  const lastRouteKey = useRef<string | null>(null);
  const preserveScroll = useRef(false);
  const announcementTimer = useRef<number | null>(null);
  const noticeTimer = useRef<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [notice, setNotice] = useState('');
  const [revealedFlags, setRevealedFlags] = useState<ReadonlySet<string>>(new Set());
  const [revealAll, setRevealAll] = useState(false);
  const [spatialAvailable, setSpatialAvailable] = useState(true);

  const announce = useCallback((message: string) => {
    if (!message) return;
    if (announcementTimer.current !== null) window.clearTimeout(announcementTimer.current);
    setAnnouncement('');
    announcementTimer.current = window.setTimeout(() => { announcementTimer.current = null; setAnnouncement(message); }, 60);
  }, []);

  const dismissNotice = useCallback(() => {
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = null;
    setNotice('');
  }, []);

  const notify = useCallback((message: string) => {
    if (!message) return;
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = window.setTimeout(() => { noticeTimer.current = null; setNotice(''); }, 7000);
  }, []);

  const finishInteraction = useCallback((selector: string | null) => {
    focusSelector.current = selector;
    revise();
  }, []);

  if (!controllers.current) {
    const context: RoundContext = {
      store,
      router,
      announce,
      notify,
      finishInteraction,
      getCurrentRoute: () => currentRoute.current,
      cancelAllPending: () => controllers.current?.cancelAllPending(),
    };
    controllers.current = createControllers(context);
  }

  const rounds = controllers.current;

  const routeHasActiveRound = useCallback((route: LearningRoute) => {
    const active = getActiveRoundRoute();
    if (!active || !routesEqual(route, active)) return false;
    if (route.domain === 'flags') return store.session !== null;
    if (route.domain === 'locations') return store.mapSession !== null && store.mapAsset !== null;
    if (route.domain === 'outlines') return store.outlineSession !== null && store.outlineAsset !== null;
    return store.neighborSession !== null;
  }, [store]);

  const flagsStudy = (route: AppRoute) => route.name === 'learning' && route.domain === 'flags' && route.activity === 'learn';

  const normalise = useCallback((route: AppRoute): AppRoute => {
    if (route.name !== 'learning' || flagsStudy(route)) return route;
    if (route.activity !== undefined && !routeHasActiveRound(route)) return stableRoute(route);
    return normalizeAvailableRoute(route);
  }, [routeHasActiveRound]);

  const applyRoute = useCallback((requested: AppRoute) => {
    const route = normalise(requested);
    if (!routesEqual(route, requested)) {
      const dropped = requested.name === 'learning' && !flagsStudy(requested) && requested.activity !== undefined && !routeHasActiveRound(requested);
      router.navigate(route, { replace: true });
      if (dropped) notify("That round isn't active anymore. Choose Play to start a new one.");
      return;
    }
    currentRoute.current = route;
    if (route.name === 'home') store.navigate({ name: 'home' });
    if (route.name === 'profile') store.navigate({ name: 'profile' });
    if (route.name === 'learning') {
      if (flagsStudy(route)) store.navigate({ name: 'flags-study', scope: route.scope ?? { kind: 'world', label: 'World' } });
      else if (route.activity !== undefined) {
        if (route.domain === 'flags' && store.session) store.navigate(store.sessionResult ? { name: 'results', result: store.sessionResult } : { name: 'quiz' });
        if (route.domain === 'locations' && store.mapSession && store.mapAsset) store.navigate(store.mapSessionResult ? { name: 'map-results', result: store.mapSessionResult } : { name: 'map-quiz' });
        if (route.domain === 'outlines' && store.outlineSession && store.outlineAsset) store.navigate(store.outlineSessionResult ? { name: 'outline-results', result: store.outlineSessionResult } : { name: 'outline-quiz' });
        if (route.domain === 'neighbors' && store.neighborSession) store.navigate(store.neighborSessionResult ? { name: 'neighbor-results', result: store.neighborSessionResult } : { name: 'neighbor-quiz' });
      } else if (!route.scope) store.navigate({ name: 'domain', domain: route.domain });
      else if (route.domain === 'flags') store.navigate({ name: 'scope', scope: route.scope });
      else if (route.domain === 'locations') store.navigate({ name: 'map-home', scope: route.scope });
      else if (route.domain === 'outlines') store.navigate({ name: 'outline-home', scope: route.scope });
      else store.navigate({ name: 'neighbor-home', scope: route.scope });
    }
    revise();
  }, [normalise, notify, routeHasActiveRound, router, store]);

  useEffect(() => router.subscribe((route) => {
    invalidatePendingRoundLaunch();
    rounds.cancelAllPending();
    dismissNotice();
    if (!route || !flagsStudy(route)) { setRevealedFlags(new Set()); setRevealAll(false); }
    if (!route) router.navigate({ name: 'home' }, { replace: true });
    else applyRoute(route);
  }), [applyRoute, dismissNotice, rounds, router]);

  useEffect(() => {
    const initial = router.current() ?? { name: 'home' as const };
    router.navigate(initial, { replace: true });
  }, [router]);

  // Warm the continent's cartography while the learner is still choosing, so the
  // first Play does not pay the whole map download.
  useEffect(() => {
    const route = currentRoute.current;
    if (route.name !== 'learning' || route.activity !== undefined || route.domain === 'flags' || !route.scope?.id) return;
    const continentId = getMapContinentConfigForScope(route.scope.id)?.scope.id;
    if (continentId) void loadMapAsset(continentId).catch(() => undefined);
  }, [store.view]);

  const discardRound = useCallback(() => {
    const active = getActiveRoundRoute();
    if (!active) return;
    if (active.domain === 'flags') store.abandonSession();
    if (active.domain === 'locations') store.abandonMapSession();
    if (active.domain === 'outlines') store.abandonOutlineSession();
    if (active.domain === 'neighbors') store.abandonNeighborSession();
    setActiveRoundRoute(null);
    rounds.neighbors.resetQuery();
  }, [rounds, store]);

  const navigateStable = useCallback((route: AppRoute) => {
    const active = getActiveRoundRoute();
    if (active && !routesEqual(route, stableRoute(active))) discardRound();
    router.navigate(route);
  }, [discardRound, router]);

  const launchFeedback = useCallback(async (element: HTMLElement | null | undefined, launch: () => Promise<void>) => {
    element?.setAttribute('aria-busy', 'true');
    element?.classList.add('is-launching');
    try { await launch(); } finally { if (element?.isConnected) { element.removeAttribute('aria-busy'); element.classList.remove('is-launching'); } }
  }, []);

  const actions = useMemo<AtlasActions>(() => ({
    goHome: () => navigateStable({ name: 'home' }),
    goBack: () => { const parent = parentRoute(currentRoute.current); if (parent) navigateStable(parent); },
    openProfile: () => navigateStable({ name: 'profile' }),
    openDomain: (domain) => navigateStable({ name: 'learning', domain }),
    openScope: (domain, id) => { const route = routeForScopeId(domain, id); if (route) navigateStable(route); },
    playScope: (domain, id, element) => {
      const scope = routeForScopeId(domain, id)?.scope;
      if (!scope) return;
      if (domain === 'flags') rounds.flags.begin(scope, 'test');
      else if (domain === 'locations') void launchFeedback(element, () => rounds.locations.begin('test', undefined, scope));
      else if (domain === 'outlines') void launchFeedback(element, () => rounds.outlines.begin('test', undefined, scope));
      else rounds.neighbors.begin('test', undefined, scope);
    },
    learnScope: (domain, id, element) => {
      const scope = routeForScopeId(domain, id)?.scope;
      if (!scope) return;
      if (domain === 'flags') navigateStable(routeForScope('flags', scope, 'learn'));
      else if (domain === 'locations') void launchFeedback(element, () => rounds.locations.begin('learn', undefined, scope));
      else if (domain === 'outlines') void launchFeedback(element, () => rounds.outlines.begin('learn', undefined, scope));
      else rounds.neighbors.begin('learn', undefined, scope);
    },
    startFlags: (mode) => mode === 'learn' ? router.navigate(routeForScope('flags', rounds.flags.currentScope(), 'learn')) : rounds.flags.begin(rounds.flags.currentScope(), 'test'),
    revealFlag: (id) => setRevealedFlags((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; }),
    toggleAllFlagNames: () => { setRevealAll((value) => { announce(!value ? 'All country names revealed.' : 'Country names hidden.'); return !value; }); setRevealedFlags(new Set()); },
    answerFlag: (id) => rounds.flags.submitAnswer(id),
    answerLocation: (id) => rounds.locations.submitAnswer(id, `[data-id="${CSS.escape(id)}"]`),
    answerOutline: (id) => { rounds.outlines.submitAnswer(id); finishInteraction(null); },
    setNeighborQuery: (value) => { rounds.neighbors.setQuery(value); revise(); },
    submitNeighbor: (id) => rounds.neighbors.submitGuess(id),
    submitNeighborQuery: () => { const country = resolveCountryGuess(COUNTRIES, new Set(NEIGHBOR_GUESS_COUNTRY_IDS), rounds.neighbors.getQuery()); country ? rounds.neighbors.submitGuess(country.id) : notify('Choose a country from the suggestions, or type a complete supported country name.'); },
    advance: (domain) => { if (domain === 'flags') { store.advance(); rounds.flags.announceResult(); finishInteraction(null); } else if (domain === 'outlines') { if (!rounds.outlines.advanceNow()) { store.advanceOutline(); rounds.outlines.announceResult(); finishInteraction(null); } } else if (domain === 'neighbors') rounds.neighbors.advance(); },
    exitRound: () => { if (!getActiveRoundRoute()) return; rounds.cancelAllPending(); discardRound(); router.back(); },
    review: (domain) => { if (domain === 'flags') rounds.flags.reviewMistakes(); if (domain === 'locations') rounds.locations.reviewMistakes(); if (domain === 'outlines') rounds.outlines.reviewMistakes(); if (domain === 'neighbors') rounds.neighbors.reviewMistakes(); },
    repeat: (domain) => { if (domain === 'flags') rounds.flags.repeat(); if (domain === 'locations') rounds.locations.repeat(); if (domain === 'outlines') rounds.outlines.repeat(); if (domain === 'neighbors') rounds.neighbors.repeat(); },
  }), [announce, discardRound, finishInteraction, launchFeedback, navigateStable, notify, rounds, router, store]);

  const ledgers: ProgressLedgers = { flags: store.progress, locations: store.locationProgress, outlines: store.outlineProgress, neighbors: store.neighborProgress };
  const persisting = store.persisting && store.mapPersisting && store.outlinePersisting && store.neighborPersisting;
  const routeKey = currentRouteKey(currentRoute.current, store);
  const stableKey = serializeRoutePath(currentRoute.current);

  /**
   * Issue #119 — the spatial presentation is derived from authoritative state,
   * never from the stage's own history. Memoised on the durable screen identity
   * so an answered question does not re-aim the camera.
   */
  const spatialState = useMemo<SpatialState>(() => deriveSpatialState({
    route: currentRoute.current,
    view: store.view.name,
    resultScope: 'result' in store.view ? store.view.result.session.scope : undefined,
    achievements: store.achievements,
  }), [stableKey, store.view.name, store.achievements, store]);

  const selectCountry = useCallback((countryId: string) => {
    const target = resolveTapTarget(spatialState, countryId);
    if (!target || !spatialState.domain) return;
    const route = routeForScopeId(spatialState.domain, target);
    // Geography resolves through exactly the action a DOM control would call,
    // so a tap and its equivalent button can never diverge.
    if (route) navigateStable(route);
  }, [navigateStable, spatialState]);

  const rendererUnavailable = useCallback(() => setSpatialAvailable(false), []);

  useEffect(() => {
    document.title = documentTitle(currentRoute.current, store);
    const changed = routeKey !== lastRouteKey.current;
    if (changed && !preserveScroll.current) window.scrollTo({ top: 0, behavior: 'instant' });
    preserveScroll.current = false;
    lastRouteKey.current = routeKey;
    if (changed) window.requestAnimationFrame(() => {
      const previous = focusSelector.current ? document.querySelector<HTMLElement>(focusSelector.current) : null;
      if (previous && !(previous instanceof HTMLButtonElement && previous.disabled)) previous.focus();
      else document.querySelector<HTMLElement>('[data-autofocus]')?.focus();
      focusSelector.current = null;
    });
  }, [routeKey, store]);

  useEffect(() => {
    if (store.view.name === 'results') rounds.flags.recordResult(store.view.result);
  }, [routeKey, rounds, store]);

  useGlobalLifecycle(currentRoute, actions, store);

  const content = screen(store, ledgers, persisting, revealedFlags, revealAll, rounds.neighbors.getQuery());

  return <AtlasActionsContext.Provider value={actions}>
    {spatialAvailable
      ? <SpatialShell
          state={spatialState}
          contentKey={routeKey}
          ledgers={ledgers}
          achievements={store.achievements}
          persisting={spatialState.domain ? domainPersisting(store, spatialState.domain) : persisting}
          onSelectCountry={selectCountry}
          onRendererUnavailable={rendererUnavailable}
        >{content}</SpatialShell>
      : content}
    <p className="visually-hidden" role="status" aria-live="polite">{announcement}</p>
    {notice ? <div className="app-notice" role="status" aria-live="polite"><span className="app-notice__body"><span className="app-notice__icon" aria-hidden="true"><Icon name="warning" /></span><span className="app-notice__message">{notice}</span></span><button className="app-notice__dismiss" type="button" onClick={dismissNotice} aria-label="Dismiss message"><Icon name="close" /></button></div> : null}
    <InstallBanner />
  </AtlasActionsContext.Provider>;
}

function createControllers(context: RoundContext) {
  const flags = createFlagsRound(context);
  const locations = createLocationsRound(context);
  const outlines = createOutlinesRound(context);
  const neighbors = createNeighborsRound(context);
  return { flags, locations, outlines, neighbors, cancelAllPending: () => { flags.cancelPending(); locations.cancelPending(); outlines.cancelPending(); } };
}

function screen(store: AppStore, ledgers: ProgressLedgers, allPersisting: boolean, revealed: ReadonlySet<string>, revealAll: boolean, neighborQuery: string) {
  switch (store.view.name) {
    case 'home': return <HomeScreen ledgers={ledgers} achievements={store.achievements} persisting={allPersisting} />;
    case 'profile': return <ProfileScreen />;
    case 'domain': return <DomainScreen domain={store.view.domain} ledgers={ledgers} achievements={store.achievements} persisting={domainPersisting(store, store.view.domain)} />;
    case 'scope': return <LauncherScreen domain="flags" scope={store.view.scope} ledgers={ledgers} achievements={store.achievements} persisting={store.persisting} />;
    case 'flags-study': return <FlagsStudyScreen scope={store.view.scope} revealedIds={revealed} revealAll={revealAll} />;
    case 'quiz': return store.session ? <FlagsQuizScreen session={store.session} progress={store.progress} answeredCountryId={store.answeredCountryId} /> : null;
    case 'results': return <RecognitionResultsScreen result={store.view.result} domain="flags" />;
    case 'map-home': return <LauncherScreen domain="locations" scope={store.view.scope} ledgers={ledgers} achievements={store.achievements} persisting={store.mapPersisting} />;
    case 'map-quiz': return store.mapSession && store.mapAsset ? <LocationQuizScreen asset={store.mapAsset} session={store.mapSession} lastWrongCountryId={store.mapLastWrongCountryId} /> : null;
    case 'map-results': return store.mapAsset ? <LocationResultsScreen asset={store.mapAsset} result={store.view.result} /> : null;
    case 'outline-home': return <LauncherScreen domain="outlines" scope={store.view.scope} ledgers={ledgers} achievements={store.achievements} persisting={store.outlinePersisting} />;
    case 'outline-quiz': return store.outlineSession && store.outlineAsset ? <OutlineQuizScreen asset={store.outlineAsset} session={store.outlineSession} progress={store.outlineProgress} answeredCountryId={store.outlineAnsweredCountryId} /> : null;
    case 'outline-results': return <RecognitionResultsScreen result={store.view.result} domain="outlines" />;
    case 'neighbor-home': return <LauncherScreen domain="neighbors" scope={store.view.scope} ledgers={ledgers} achievements={store.achievements} persisting={store.neighborPersisting} />;
    case 'neighbor-quiz': return store.neighborSession ? <NeighborQuizScreen session={store.neighborSession} lastOutcome={store.neighborLastOutcome} query={neighborQuery} /> : null;
    case 'neighbor-results': return <NeighborResultsScreen result={store.view.result} />;
  }
}

function domainPersisting(store: AppStore, domain: LearningDomain) {
  return domain === 'locations' ? store.mapPersisting : domain === 'outlines' ? store.outlinePersisting : domain === 'neighbors' ? store.neighborPersisting : store.persisting;
}

function currentRouteKey(route: AppRoute, store: AppStore) {
  const path = serializeRoutePath(route);
  const view = store.view;
  if (view.name === 'quiz') return `${path}:${store.session?.id}:${store.session?.currentIndex}`;
  if (view.name === 'map-quiz') return `${path}:${store.mapSession?.id}:${store.mapSession?.currentIndex}`;
  if (view.name === 'outline-quiz') return `${path}:${store.outlineSession?.id}:${store.outlineSession?.currentIndex}`;
  // Include every submitted attempt, not only unique guesses. Duplicate
  // Neighbours submissions intentionally leave guessedIds unchanged, but they
  // still produce feedback and must retrigger the focus-intent effect so the
  // entry field remains the keyboard stop after the response.
  if (view.name === 'neighbor-quiz') return `${path}:${store.neighborSession?.id}:${store.neighborSession?.currentIndex}:${store.neighborSession?.attempts.length}`;
  if ('result' in view) return `${path}:results:${view.result.session.id}`;
  return path;
}

function documentTitle(route: AppRoute, store: AppStore) {
  if (store.view.name === 'results') return `Round complete · ${store.view.result.session.scope.label} flags · Atlas`;
  if (store.view.name === 'map-results') return `Round complete · ${store.view.result.session.scope.label} locations · Atlas`;
  if (store.view.name === 'outline-results') return `Round complete · ${store.view.result.session.scope.label} outlines · Atlas`;
  if (store.view.name === 'neighbor-results') return `Round complete · ${store.view.result.session.scope.label} ${domainDisplayName('neighbors').toLowerCase()} · Atlas`;
  return routeTitle(route);
}

function useGlobalLifecycle(currentRoute: React.MutableRefObject<AppRoute>, actions: AtlasActions, store: AppStore) {
  useEffect(() => {
    const flush = () => { flushAttempts(); flushMapAttempts(); flushOutlineAttempts(); flushNeighborAttempts(); };
    const visibility = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', visibility);
    const removeGestures = installNavigationGestures({ getParentRoute: () => parentRoute(currentRoute.current), onBack: actions.goBack });
    const keyboard = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'Escape' && ['quiz', 'map-quiz', 'outline-quiz', 'neighbor-quiz'].includes(store.view.name)) { event.preventDefault(); actions.exitRound(); return; }
      if ((store.view.name === 'quiz' || store.view.name === 'outline-quiz') && /^[1-4]$/.test(event.key)) {
        const session = store.view.name === 'quiz' ? store.session : store.outlineSession;
        const answered = store.view.name === 'quiz' ? store.answeredCountryId : store.outlineAnsweredCountryId;
        const id = session?.questions[session.currentIndex]?.optionCountryIds[Number(event.key) - 1];
        if (answered === null && id) { event.preventDefault(); store.view.name === 'quiz' ? actions.answerFlag(id) : actions.answerOutline(id); }
      }
      if (event.key === 'Enter' && store.view.name === 'quiz' && store.answeredCountryId !== null && store.session?.mode === 'learn') actions.advance('flags');
      if (event.key === 'Enter' && store.view.name === 'outline-quiz' && store.outlineAnsweredCountryId !== null && store.outlineSession?.mode === 'learn') actions.advance('outlines');
      if (event.key === 'Enter' && store.view.name === 'outline-quiz' && store.outlineAnsweredCountryId !== null && store.outlineSession?.mode === 'test') { event.preventDefault(); actions.advance('outlines'); }
    };
    window.addEventListener('keydown', keyboard);
    const register = () => { if ('serviceWorker' in navigator) void navigator.serviceWorker.register('./sw.js').catch(() => undefined); };
    window.addEventListener('load', register);
    if (document.readyState === 'complete') register();
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('keydown', keyboard); window.removeEventListener('load', register); removeGestures(); };
  }, [actions, currentRoute, store]);
}

function InstallBanner() {
  const [mode, setMode] = useState<'install' | 'ios' | null>(() => !standalone() && !isInstallPromptDismissed() && iosSafari() ? 'ios' : null);
  const prompt = useRef<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    if (standalone() || isInstallPromptDismissed()) return;
    const before = (event: Event) => { event.preventDefault(); prompt.current = event as BeforeInstallPromptEvent; setMode('install'); };
    const installed = () => { prompt.current = null; dismissInstallPrompt(); setMode(null); };
    window.addEventListener('beforeinstallprompt', before);
    window.addEventListener('appinstalled', installed);
    return () => { window.removeEventListener('beforeinstallprompt', before); window.removeEventListener('appinstalled', installed); };
  }, []);
  if (!mode) return null;
  const dismiss = () => { dismissInstallPrompt(); setMode(null); };
  const install = () => { const event = prompt.current; if (!event) return; prompt.current = null; void event.prompt(); void event.userChoice.then(dismiss); };
  return <div className="install-banner"><span className="install-banner__message">{mode === 'install' ? 'Install Atlas for quick, full-screen access.' : 'Add Atlas to your Home Screen: tap Share, then "Add to Home Screen".'}</span>{mode === 'install' ? <button className="install-banner__action" type="button" onClick={install}>Install</button> : null}<button className="install-banner__dismiss" type="button" onClick={dismiss} aria-label="Dismiss"><Icon name="close" /></button></div>;
}
