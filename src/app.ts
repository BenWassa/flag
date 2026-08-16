import { CONTINENTS, REGIONS } from './data/continents.js';
import type { LearningStatus, StudyMode, StudyScope } from './domain/models.js';
import { AppStore } from './state/store.js';
import { renderHome } from './ui/views/home.js';
import { renderProgress } from './ui/views/progress.js';
import { renderQuiz } from './ui/views/quiz.js';
import { renderResults } from './ui/views/results.js';
import { renderScope } from './ui/views/scope.js';

const appRoot = document.querySelector('#app');
if (!(appRoot instanceof HTMLDivElement)) throw new Error('App root not found.');
const root: HTMLDivElement = appRoot;

const store = new AppStore();
let progressFilter: LearningStatus | 'all' = 'all';
let lastResultScope: StudyScope | null = null;
let lastResultMode: StudyMode = 'learn';
let lastMissedIds: string[] = [];

function render(): void {
  switch (store.view.name) {
    case 'home':
      root.innerHTML = renderHome(store.progress);
      break;
    case 'scope':
      root.innerHTML = renderScope(store.progress, store.view.scope);
      break;
    case 'progress':
      root.innerHTML = renderProgress(store.progress, progressFilter);
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
  window.scrollTo({ top: 0, behavior: 'instant' });
}

root.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  const id = target.dataset.id;

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
      store.startSession({ kind: 'world', label: 'World' }, 'learn');
      break;
    case 'start-world-test':
      store.startSession({ kind: 'world', label: 'World' }, 'test');
      break;
    case 'start-learn':
      if (store.view.name === 'scope') store.startSession(store.view.scope, 'learn');
      break;
    case 'start-test':
      if (store.view.name === 'scope') store.startSession(store.view.scope, 'test');
      break;
    case 'answer':
      if (id && store.answeredCountryId === null) {
        store.answer(id);
        if (store.session?.mode === 'test') {
          window.setTimeout(() => {
            store.advance();
            render();
          }, 180);
        }
      }
      break;
    case 'next-question':
      store.advance();
      break;
    case 'exit-quiz':
      if (store.session) store.navigate({ name: 'scope', scope: store.session.scope });
      else store.navigate({ name: 'home' });
      break;
    case 'review-mistakes':
      if (lastResultScope && lastMissedIds.length) {
        store.startSession(lastResultScope, 'learn', Math.max(4, Math.min(10, lastMissedIds.length)), lastMissedIds);
      }
      break;
    case 'repeat-scope':
      if (lastResultScope) store.startSession(lastResultScope, lastResultMode);
      break;
  }

  render();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}

render();
