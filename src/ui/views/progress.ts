import { COUNTRIES } from '../../data/countries.js';
import type { LearningStatus, ProgressState } from '../../domain/models.js';
import { getRecord, isDue } from '../../domain/progress.js';
import { flagImage } from '../components/flag.js';
import { icon } from '../components/icons.js';
import { EVIDENCE_RULE, escapeHtml, statusLabel } from '../format.js';

const EMPTY_STATES: Record<LearningStatus | 'all', { title: string; body: string }> = {
  all: { title: 'No flags loaded', body: 'The curriculum could not be read. Reload the page to try again.' },
  unseen: {
    title: 'Every flag has scored evidence',
    body: 'Nothing is left untouched. Use Learning to see what still needs work.',
  },
  learning: {
    title: 'Nothing in progress',
    body: 'Flags land here when retrieval evidence still needs strengthening.',
  },
  mastered: {
    title: 'No strong evidence yet',
    body: 'Clean retrieval builds strong evidence; Play can calibrate already-known flags faster.',
  },
};

const FILTER_LABELS: Record<LearningStatus | 'all', string> = {
  all: 'All',
  unseen: 'Unseen',
  learning: 'Learning',
  mastered: 'Strong',
};

export function renderProgress(
  progress: ProgressState,
  filter: LearningStatus | 'all' = 'all',
  resetArmed = false,
  persisting = true,
): string {
  const counts = COUNTRIES.reduce(
    (acc, country) => {
      acc[getRecord(progress, country.id).status] += 1;
      return acc;
    },
    { unseen: 0, learning: 0, mastered: 0 },
  );

  const rows = COUNTRIES
    .filter((country) => filter === 'all' || getRecord(progress, country.id).status === filter)
    .sort((a, b) => {
      const statusOrder = { learning: 0, unseen: 1, mastered: 2 } as const;
      const aStatus = getRecord(progress, a.id).status;
      const bStatus = getRecord(progress, b.id).status;
      return statusOrder[aStatus] - statusOrder[bStatus] || a.name.localeCompare(b.name);
    });

  const filterCount = (item: LearningStatus | 'all'): number => item === 'all' ? COUNTRIES.length : counts[item];
  const hasHistory = counts.learning + counts.mastered > 0;

  return `
    <main class="page ledger-page">
      <header class="topbar topbar--detail">
        <button class="icon-button" data-action="home" aria-label="Back to atlas">${icon('back')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" ${resetArmed ? '' : 'data-autofocus'}>Progress</h1>
          <span>${counts.mastered} strong · ${counts.learning} learning · ${counts.unseen} unseen</span>
        </div>
      </header>

      <p class="ledger-note">${EVIDENCE_RULE}</p>

      <div class="filter-tabs" role="group" aria-label="Filter flags by learning evidence">
        ${(['all', 'unseen', 'learning', 'mastered'] as const).map((item) => `
          <button class="filter-tab ${filter === item ? 'filter-tab--active' : ''}" data-action="filter-progress" data-id="${item}" aria-pressed="${filter === item}">
            <span>${FILTER_LABELS[item]}</span><small>${filterCount(item)}</small>
          </button>
        `).join('')}
      </div>

      ${rows.length ? `
        <div class="ledger-list">
          ${rows.map((country) => {
            const record = getRecord(progress, country.id);
            const detail = record.status === 'learning'
              ? `${record.lifetimeCorrect} correct · ${record.lifetimeIncorrect} missed`
              : record.status === 'mastered'
                ? `${record.lifetimeCorrect} correct · ${record.lapseCount} ${record.lapseCount === 1 ? 'lapse' : 'lapses'}`
                : record.evidence.passiveExposures > 0
                  ? 'Seen in Learn · no scored retrieval yet'
                  : 'Not practised yet';
            return `
              <div class="ledger-row">
                ${flagImage(country, true, 'flag-frame--ledger')}
                <span class="ledger-row__country"><strong>${escapeHtml(country.name)}</strong><small>${detail}</small></span>
                <span class="status-chip status-chip--${record.status}">${statusLabel(record, isDue(record))}</span>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <strong>${EMPTY_STATES[filter].title}</strong>
          <span>${EMPTY_STATES[filter].body}</span>
        </div>
      `}

      ${hasHistory ? `
        <div class="ledger-footer">
          ${resetArmed ? `
            <p role="alert">Erase all ${counts.mastered + counts.learning} learning records? This cannot be undone.</p>
            <button class="button button--danger" data-action="reset-confirm">Erase everything</button>
            <button class="button button--tertiary" data-action="reset-cancel" data-autofocus>Keep my progress</button>
          ` : `
            <p>${persisting
              ? 'Your ledger is stored on this device only.'
              : 'This browser is not allowing storage, so this ledger lasts until you close the tab.'}</p>
            <button class="button button--tertiary" data-action="reset-request">Reset all progress</button>
          `}
        </div>
      ` : ''}
    </main>
  `;
}
