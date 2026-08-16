import { CONTINENTS, REGIONS } from './data/continents.js';
import { COUNTRY_BY_ID } from './data/countries.js';
import type { LearningStatus, StudyMode, StudyScope } from './domain/models.js';
import { masteryGoal } from './domain/progress.js';
import { resetAllProgress } from './infrastructure/storage.js';
import { AppStore, type ViewState } from './state/store.js';
import { markFailedFlags } from './ui/components/flag.js';
import { renderHome } from './ui/views/home.js';
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

/** Pending auto-advance for Test mode. Must be cancelled whenever the round is left. */
let pendingAdvance: number | null = null;

function cancelPendingAdvance(): void {
  if (pendingAdvance === null) return;
  window.clearTimeout(pendingAdvance);
  pendingAdvance = null;
}

// --- Announcements -------------------------------------------------------
// A single persistent region carries what a sighted user reads from the
// re-rendered screen. Queued as a microtask so the text change is observed.

function announce(message: string): void {
  if (!liveStatus || !message) return;
  liveStatus.textContent = '';
  window.setTimeout(() => {
    liveStatus.textContent = message;
  }, 60);
}

// --- History -------------------------------------------------------------
// The atlas is a single document, so Back would otherwise leave the app
// entirely. Each view change records an entry; quiz entries are transient and
// get replaced on exit so Back never lands inside a finished round.

const viewStack: ViewState[] = [store.view];
let historyIndex = 0;

function syncHistory(): void {
  if (store.view === viewStack[historyIndex]) return;

  const leavingQuiz = viewStack[historyIndex]?.name === 'quiz';
  if (leavingQuiz) {
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

  cancelPendingAdvance();
  resetArmed = false;
  historyIndex = index;
  // A quiz entry only stays valid while its session is alive.
  store.view = restored.name === 'quiz' && !store.session ? { name: 'home' } : restored;
  render();
});

// --- Rendering -----------------------------------------------------------

const TITLES: Record<ViewState['name'], string> = {
  home: 'Flag Atlas',
  scope: 'Flag Atlas',
  progress: 'Progress · Flag Atlas',
  quiz: 'Flag Atlas',
  results: 'Round complete · Flag Atlas',
};

function documentTitle(): string {
  const view = store.view;
  if (view.name === 'scope') return `${view.scope.label} · Flag Atlas`;
  if (view.name === 'quiz' && store.session) return `${store.session.scope.label} · Flag Atlas`;
  return TITLES[view.name];
}

/**
 * Replacing #app drops focus to <body>, which restarts the tab order and loses
 * the screen-reader position. Prefer the control the user just used if it still
 * exists, otherwise the view's designated landing element.
 */
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
  switch (store.view.name) {
    case 'home':
      root.innerHTML = renderHome(store.progress);
      break;
    case 'scope':
      root.innerHTML = renderScope(store.progress, store.view.scope);
      break;
    case 'progress':
      root.innerHTML = renderProgress(store.progress, progressFilter, resetArmed);
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
  }

  markFailedFlags(root);
  document.title = documentTitle();
  window.scrollTo({ top: 0, behavior: 'instant' });
  restoreFocus(previousSelector);
}

/**
 * Start a round and orient assistive technology, which otherwise gets only the
 * first answer button and no sense of scope, mode, or length.
 */
function beginSession(scope: StudyScope, mode: StudyMode, size?: number, reviewIds?: string[]): void {
  cancelPendingAdvance();
  store.startSession(scope, mode, size, reviewIds);
  const count = store.session?.questions.length ?? 0;
  announce(`${scope.label}. ${mode === 'learn' ? 'Learn' : 'Test'} round of ${count} flags. Question 1.`);
}

function exitQuiz(): void {
  cancelPendingAdvance();
  if (!store.session || store.session.scope.kind === 'world') {
    store.navigate({ name: 'home' });
    return;
  }
  store.navigate({ name: 'scope', scope: store.session.scope });
}

function answerAnnouncement(countryId: string): string {
  if (!store.session) return '';
  const question = store.session.questions[store.session.currentIndex];
  const target = question ? COUNTRY_BY_ID.get(question.countryId) : undefined;
  if (!target) return '';
  if (store.session.mode === 'test') return 'Answer recorded.';

  const record = store.progress.records[target.id];
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
      // The round may have been left while this was queued.
      if (store.view.name !== 'quiz') return;
      store.advance();
      announceResult();
      finishInteraction(null);
    }, 180);
  }
}

/** Common tail for every interaction: record history, repaint, restore focus. */
function finishInteraction(previousSelector: string | null): void {
  syncHistory();
  render(previousSelector);
}

root.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  const id = target.dataset.id;
  const selector = id
    ? `[data-action="${action}"][data-id="${id}"]`
    : `[data-action="${action}"]`;

  if (action !== 'reset-request' && action !== 'reset-confirm') resetArmed = false;

  switch (action) {
    case 'home':
      store.navigate({ name: 'home' });
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
      store.resetProgress();
      resetArmed = false;
      progressFilter = 'all';
      announce('All progress erased. Every flag is unseen again.');
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
  const mastery = newlyMastered.length
    ? ` ${newlyMastered.length} newly mastered.`
    : '';
  announce(`Round complete. ${correct} of ${total} correct.${mastery}`);
}

window.addEventListener('keydown', (event) => {
  if (store.view.name !== 'quiz' || !store.session) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;

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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}

history.replaceState({ i: 0 }, '');
render();
