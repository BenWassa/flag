import { COUNTRIES } from '../../data/countries.js';
import type { LearningStatus, ProgressState } from '../../domain/models.js';
import { masteryGoal } from '../../domain/progress.js';
import { flagImage } from '../components/flag.js';
import { icon } from '../components/icons.js';
import { MASTERY_RULE, titleCase } from '../format.js';

const EMPTY_STATES: Record<LearningStatus | 'all', { title: string; body: string }> = {
  all: { title: 'No flags loaded', body: 'The curriculum could not be read. Reload the page to try again.' },
  unseen: {
    title: 'Every flag has been seen',
    body: 'Nothing is left untouched. Use Learning to see what still needs work.',
  },
  learning: {
    title: 'Nothing in progress',
    body: 'Flags land here the first time you answer one. Start a round from the atlas to begin.',
  },
  mastered: {
    title: 'No flags mastered yet',
    body: 'Answer a flag correctly in three separate rounds and it moves here.',
  },
};

export function renderProgress(
  progress: ProgressState,
  filter: LearningStatus | 'all' = 'all',
  resetArmed = false,
): string {
  const counts = COUNTRIES.reduce(
    (acc, country) => {
      acc[progress.records[country.id].status] += 1;
      return acc;
    },
    { unseen: 0, learning: 0, mastered: 0 },
  );

  const rows = COUNTRIES
    .filter((country) => filter === 'all' || progress.records[country.id].status === filter)
    .sort((a, b) => {
      const statusOrder = { learning: 0, unseen: 1, mastered: 2 } as const;
      const aRecord = progress.records[a.id];
      const bRecord = progress.records[b.id];
      return statusOrder[aRecord.status] - statusOrder[bRecord.status] || a.name.localeCompare(b.name);
    });

  const filterCount = (item: LearningStatus | 'all'): number => item === 'all' ? COUNTRIES.length : counts[item];
  const hasHistory = counts.learning + counts.mastered > 0;

  return `
    <main class="page ledger-page">
      <header class="topbar topbar--detail">
        <button class="icon-button" data-action="home" aria-label="Back to atlas">${icon('back')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" ${resetArmed ? '' : 'data-autofocus'}>Progress</h1>
          <span>${counts.mastered} mastered · ${counts.learning} learning · ${counts.unseen} unseen</span>
        </div>
      </header>

      <p class="ledger-note">${MASTERY_RULE}</p>

      <div class="filter-tabs" role="group" aria-label="Filter flags by learning status">
        ${(['all', 'unseen', 'learning', 'mastered'] as const).map((item) => `
          <button class="filter-tab ${filter === item ? 'filter-tab--active' : ''}" data-action="filter-progress" data-id="${item}" aria-pressed="${filter === item}">
            <span>${item === 'all' ? 'All' : titleCase(item)}</span><small>${filterCount(item)}</small>
          </button>
        `).join('')}
      </div>

      ${rows.length ? `
        <div class="ledger-list">
          ${rows.map((country) => {
            const record = progress.records[country.id];
            const detail = record.status === 'learning'
              ? `${record.masteryStreak}/${masteryGoal(record)} toward mastery · ${record.lifetimeIncorrect} missed`
              : record.status === 'mastered'
                ? `${record.lifetimeCorrect} correct · ${record.lapseCount} ${record.lapseCount === 1 ? 'lapse' : 'lapses'}`
                : 'Never tested';
            return `
              <div class="ledger-row">
                ${flagImage(country, true, 'flag-frame--ledger')}
                <span class="ledger-row__country"><strong>${country.name}</strong><small>${detail}</small></span>
                <span class="status-chip status-chip--${record.status}">${titleCase(record.status)}</span>
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
            <p>Your ledger is stored on this device only.</p>
            <button class="button button--tertiary" data-action="reset-request">Reset all progress</button>
          `}
        </div>
      ` : ''}
    </main>
  `;
}
