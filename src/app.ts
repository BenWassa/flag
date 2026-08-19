import { CONTINENTS, REGIONS } from './data/continents.js';
import { COUNTRY_BY_ID } from './data/countries.js';
import { AFRICA_MAP_SCOPE, getAfricaMapScopeConfig } from './data/map-scopes.js';
import { loadMapAsset } from './data/maps/index.js';
import type { LearningStatus, StudyMode, StudyScope } from './domain/models.js';
import type { MapMode } from './domain/map-models.js';
import { getRecord, masteryGoal } from './domain/progress.js';
import { flushMapAttempts, resetMapProgressStorage } from './infrastructure/map-storage.js';
import { flushAttempts, resetAllProgress } from './infrastructure/storage.js';
import { AppStore, type ViewState } from './state/store.js';
import { markFailedFlags } from './ui/components/flag.js';
import { renderHome } from './ui/views/home.js';
import { renderMapHome } from './ui/views/map-home.js';
import { renderMapQuiz } from './ui/views/map-quiz.js';
import { renderMapResults } from './ui/views/map-results.js';
import { renderProgress } from './ui/views/progress.js';
import { renderQuiz } from './ui/views/quiz.js';
import { renderResults } from './ui/views/results.js';
import { renderScope } from './ui/views/scope.js';

const appRoot = document.querySelector('#app');
if (!(appRoot instanceof HTMLDivElement)) throw new Error('App root not found.');
const root: HTMLDivElement = appRoot;
const liveStatus = document.querySelector<HTMLElement>('#live-status');

const store = new AppStore();
let progressFilter: LearningStatus | 'all' = 'all';
let resetArmed = false;
let lastResultScope: StudyScope | null = null;
let lastResultMode: StudyMode = 'learn';
let lastMissedIds: string[] = [];
let pendingAdvance: number | null = null;
let pendingMapAdvance: number | null = null;
let lastRenderedRouteKey: string | null = null;

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

function cancelAllPending(): void {
  cancelPendingAdvance();
  cancelPendingMapAdvance();
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

const viewStack: ViewState[] = [store.view];
let historyIndex = 0;

function syncHistory(): void {
  if (store.view === viewStack[historyIndex]) return;

  const leavingTransientRound = viewStack[historyIndex]?.name === 'quiz' || viewStack[historyIndex]?.name === 'map-quiz';
  if (leavingTransientRound) {
    viewStack[historyIndex] = store.view;
    history.replaceState({ i: historyIndex }, '');
    return;
  }

  historyIndex += 1;
  viewStack.length = historyIndex;
  viewStack[historyIndex] = store.view;
  history.pushState({ i: historyIndex }, '');
}

window.addEventListener('popstate', (event) => {
  const state = event.state as { i?: unknown } | null;
  const index = typeof state?.i === 'number' ? state.i : 0;
  const restored = viewStack[index];
  if (!restored) return;

  cancelAllPending();
  resetArmed = false;
  historyIndex = index;
  if (restored.name === 'quiz' && !store.session) store.view = { name: 'home' };
  else if (restored.name === 'map-quiz' && !store.mapSession) store.view = { name: 'map-home', scope: AFRICA_MAP_SCOPE };
  else store.view = restored;
  render();
});

const TITLES: Record<ViewState['name'], string> = {
  home: 'Flag Atlas',
  scope: 'Flag Atlas',
  progress: 'Progress · Flag Atlas',
  quiz: 'Flag Atlas',
  results: 'Round complete · Flag Atlas',
  'map-home': 'Country locations · Flag Atlas',
  'map-quiz': 'Map round · Flag Atlas',
  'map-results': 'Map round complete · Flag Atlas',
};

function documentTitle(): string {
  const view = store.view;
  if (view.name === 'scope') return `${view.scope.label} · Flag Atlas`;
  if (view.name === 'quiz' && store.session) return `${store.session.scope.label} · Flag Atlas`;
  if (view.name === 'map-home') return `${view.scope.label} locations · Flag Atlas`;
  if (view.name === 'map-quiz' && store.mapSession) return `${store.mapSession.scope.label} map · Flag Atlas`;
  return TITLES[view.name];
}

function currentRouteKey(): string {
  const view = store.view;
  if (view.name === 'scope') return `scope:${view.scope.kind}:${view.scope.id ?? 'world'}`;
  if (view.name === 'quiz') return `quiz:${store.session?.id ?? 'none'}:${store.session?.currentIndex ?? 0}`;
  if (view.name === 'results') return `results:${view.result.session.id}`;
  if (view.name === 'map-home') return `map-home:${view.scope.id ?? 'africa'}`;
  if (view.name === 'map-quiz') return `map-quiz:${store.mapSession?.id ?? 'none'}:${store.mapSession?.currentIndex ?? 0}`;
  if (view.name === 'map-results') return `map-results:${view.result.session.id}`;
  return view.name;
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

  switch (store.view.name) {
    case 'home':
      root.innerHTML = renderHome(store.progress, store.persisting);
      break;
    case 'scope':
      root.innerHTML = renderScope(store.progress, store.view.scope);
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
      root.innerHTML = renderMapHome(store.locationProgress, store.view.scope, store.mapPersisting);
      break;
    case 'map-quiz':
      if (!store.mapSession || !store.mapAsset) return;
      root.innerHTML = renderMapQuiz(store.mapAsset, store.mapSession, store.mapLastWrongCountryId);
      break;
    case 'map-results':
      if (!store.mapAsset) return;
      root.innerHTML = renderMapResults(store.mapAsset, store.view.result);
      break;
  }

  markFailedFlags(root);
  document.title = documentTitle();
  if (routeChanged) window.scrollTo({ top: 0, behavior: 'instant' });
  lastRenderedRouteKey = routeKey;
  restoreFocus(previousSelector);
}

function beginSession(scope: StudyScope, mode: StudyMode, size?: number, reviewIds?: string[]): void {
  cancelAllPending();
  if (!store.startSession(scope, mode, size, reviewIds)) {
    announce(`${scope.label} has no flags to practise right now.`);
    return;
  }

  const count = store.session?.questions.length ?? 0;
  announce(`${scope.label}. ${mode === 'learn' ? 'Learn' : 'Test'} round of ${count} flags. Question 1.`);
}

function currentMapScope(): StudyScope {
  if (store.view.name === 'map-home') return store.view.scope;
  if (store.view.name === 'map-results') return store.view.result.session.scope;
  return store.mapSession?.scope ?? AFRICA_MAP_SCOPE;
}

async function beginMapSession(
  mode: MapMode,
  targetCountryIds?: readonly string[],
  scope: StudyScope = currentMapScope(),
): Promise<void> {
  cancelAllPending();
  const scopeId = scope.id ?? 'africa';
  const asset = await loadMapAsset(scopeId);
  if (!asset) {
    announce(`${scope.label} map could not be loaded.`);
    return;
  }
  if (!store.startMapSession(asset, mode, targetCountryIds)) {
    announce('No map locations are available for this round.');
    return;
  }
  announce(`${asset.scope.label} map. ${mode === 'learn' ? 'Learn' : 'Test'} round of ${store.mapSession?.countryIds.length ?? 0} countries.`);
  finishInteraction(null);
}

function exitQuiz(): void {
  cancelAllPending();
  if (!store.session || store.session.scope.kind === 'world') {
    store.navigate({ name: 'home' });
    return;
  }
  store.navigate({ name: 'scope', scope: store.session.scope });
}

function exitMapQuiz(): void {
  cancelAllPending();
  store.navigate({ name: 'map-home', scope: store.mapSession?.scope ?? AFRICA_MAP_SCOPE });
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

function finishInteraction(previousSelector: string | null): void {
  syncHistory();
  render(previousSelector);
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
  if (action === 'open-map-scope' && id) {
    const config = getAfricaMapScopeConfig(id);
    if (config) {
      cancelAllPending();
      store.navigate({ name: 'map-home', scope: config.scope });
      finishInteraction(null);
    }
    return;
  }
  if (action === 'start-map-learn' || action === 'start-map-test') {
    void beginMapSession(action === 'start-map-learn' ? 'learn' : 'test');
    return;
  }
  if (action === 'review-map-mistakes' && store.view.name === 'map-results') {
    void beginMapSession('learn', store.view.result.missedCountryIds, store.view.result.session.scope);
    return;
  }
  if (action === 'repeat-map' && store.view.name === 'map-results') {
    void beginMapSession(store.view.result.session.mode, undefined, store.view.result.session.scope);
    return;
  }

  if (action !== 'reset-request' && action !== 'reset-confirm') resetArmed = false;

  switch (action) {
    case 'home':
      cancelAllPending();
      store.navigate({ name: 'home' });
      break;
    case 'open-map-pilot':
      cancelAllPending();
      store.navigate({ name: 'map-home', scope: AFRICA_MAP_SCOPE });
      break;
    case 'open-progress':
      store.navigate({ name: 'progress' });
      break;
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
      store.resetProgress();
      store.resetMapProgress();
      resetArmed = false;
      progressFilter = 'all';
      announce('All flag and map progress erased.');
      break;
    case 'open-continent': {
      const continent = CONTINENTS.find((item) => item.id === id);
      if (continent) {
        store.navigate({ name: 'scope', scope: { kind: 'continent', id: continent.id, label: continent.name } });
      }
      break;
    }
    case 'open-region': {
      const region = REGIONS.find((item) => item.id === id);
      if (region) store.navigate({ name: 'scope', scope: { kind: 'region', id: region.id, label: region.name } });
      break;
    }
    case 'start-world-learn':
      beginSession({ kind: 'world', label: 'World' }, 'learn');
      break;
    case 'start-world-test':
      beginSession({ kind: 'world', label: 'World' }, 'test');
      break;
    case 'start-learn':
      if (store.view.name === 'scope') beginSession(store.view.scope, 'learn');
      break;
    case 'start-test':
      if (store.view.name === 'scope') beginSession(store.view.scope, 'test');
      break;
    case 'answer':
      if (id) submitAnswer(id);
      break;
    case 'next-question':
      store.advance();
      break;
    case 'exit-quiz':
      exitQuiz();
      break;
    case 'exit-map':
      exitMapQuiz();
      break;
    case 'review-mistakes':
      if (lastResultScope && lastMissedIds.length) {
        beginSession(lastResultScope, 'learn', Math.max(4, Math.min(10, lastMissedIds.length)), lastMissedIds);
      }
      break;
    case 'repeat-scope':
      if (lastResultScope) beginSession(lastResultScope, lastResultMode);
      break;
  }

  announceResult();
  finishInteraction(selector);
});

function announceResult(): void {
  if (store.view.name !== 'results') return;
  const { correct, total, newlyMastered } = store.view.result;
  const mastery = newlyMastered.length ? ` ${newlyMastered.length} newly mastered.` : '';
  announce(`Round complete. ${correct} of ${total} correct.${mastery}`);
}

function announceMapResult(): void {
  if (store.view.name !== 'map-results') return;
  const { firstTryCorrect, total, missedCountryIds } = store.view.result;
  announce(`Map round complete. ${firstTryCorrect} of ${total} first try. ${missedCountryIds.length} to review.`);
}

window.addEventListener('keydown', (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  if (store.view.name === 'map-quiz' && store.mapSession) {
    if (event.key === 'Escape') {
      event.preventDefault();
      exitMapQuiz();
      finishInteraction(null);
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

  if (store.view.name !== 'quiz' || !store.session) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    exitQuiz();
    finishInteraction(null);
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
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    flushAttempts();
    flushMapAttempts();
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}

history.replaceState({ i: 0 }, '');
render();