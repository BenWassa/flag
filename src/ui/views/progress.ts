import { COUNTRY_BY_ID } from '../../data/countries.js';
import type { LocationProgressState } from '../../domain/map-models.js';
import type { LearningDomain, LearningStatus, ProgressState, StudyScope } from '../../domain/models.js';
import type { NeighborProgressState } from '../../domain/neighbor-models.js';
import {
  buildScopeProgressSummaries,
  evidenceForCountry,
  type ProgressLedgers,
  type ProgressSummary,
} from '../../domain/progress-summary.js';
import { getRecord, masteryGoal } from '../../domain/progress.js';
import { loadLocationProgress, mapStorageIsWritable } from '../../infrastructure/map-storage.js';
import { loadNeighborProgress, neighborStorageIsWritable } from '../../infrastructure/neighbor-storage.js';
import { loadOutlineProgress, outlineStorageIsWritable } from '../../infrastructure/outline-storage.js';
import { domainIcon, icon } from '../components/icons.js';
import { escapeHtml } from '../format.js';

const AFRICA_SCOPE: StudyScope = { kind: 'continent', id: 'africa', label: 'Africa' };
const DOMAIN_IDS: readonly LearningDomain[] = ['flags', 'locations', 'outlines', 'neighbors'];

const EVIDENCE_LABELS = {
  unseen: 'Unseen',
  learning: 'Learning',
  strong: 'Strong evidence',
  due: 'Due for review',
} as const;

function emptyLocationProgress(): LocationProgressState {
  return { version: 1, records: {} };
}

function emptyNeighborProgress(): NeighborProgressState {
  return { version: 1, records: {} };
}

function emptyProgress(): ProgressState {
  return { version: 1, records: {} };
}

function selectedDomain(filter: string): LearningDomain {
  if (filter.startsWith('domain:')) {
    const value = filter.slice('domain:'.length);
    if ((DOMAIN_IDS as readonly string[]).includes(value)) return value as LearningDomain;
  }
  return 'flags';
}

function legacyStatusFilter(filter: string): LearningStatus | 'all' {
  return filter === 'unseen' || filter === 'learning' || filter === 'mastered' ? filter : 'all';
}

function summarySentence(summary: ProgressSummary): string {
  if (!summary.supported) return 'Coming soon';
  const parts = [
    `${summary.unseen} unseen`,
    `${summary.learning} learning`,
    `${summary.strong} strong`,
  ];
  if (summary.due) parts.push(`${summary.due} due`);
  return parts.join(' · ');
}

function actionLabel(summary: ProgressSummary): string {
  if (summary.action === 'review') return 'Review';
  if (summary.action === 'learn') return 'Learn';
  return 'Play';
}

function renderDomainSummary(summary: ProgressSummary, selected: boolean): string {
  if (!summary.supported) {
    return `
      <div class="ledger-row progress-domain-row progress-domain-row--unavailable" aria-label="${escapeHtml(summary.label)}, coming soon">
        <span class="progress-domain-row__icon">${domainIcon(summary.domain)}</span>
        <span class="ledger-row__country"><strong>${escapeHtml(summary.label)}</strong><small>Coming soon outside supported curriculum</small></span>
        <span class="status-chip">Unavailable</span>
      </div>
    `;
  }

  const action = summary.action === 'play' ? 'quick-play' : 'open-scope';
  const label = actionLabel(summary);
  return `
    <div class="ledger-row progress-domain-row ${selected ? 'progress-domain-row--selected' : ''}">
      <span class="progress-domain-row__icon">${domainIcon(summary.domain)}</span>
      <button class="filter-tab progress-domain-row__select" data-action="filter-progress" data-id="domain:${summary.domain}" aria-pressed="${selected}">
        <span class="ledger-row__country"><strong>${escapeHtml(summary.label)}</strong><small>${summarySentence(summary)}</small></span>
      </button>
      <button class="button button--tertiary progress-domain-row__action" data-action="${action}" data-domain="${summary.domain}" data-id="africa" aria-label="${summary.action === 'play' ? label : `Open ${label.toLowerCase()} options for`} ${escapeHtml(summary.scope.label)} ${escapeHtml(summary.label.toLowerCase())}">${label}</button>
    </div>
  `;
}

export function renderProgress(
  progress: ProgressState,
  filter: string = 'all',
  resetArmed = false,
  persisting = true,
): string {
  const ledgers: ProgressLedgers = {
    flags: progress,
    locations: loadLocationProgress() ?? emptyLocationProgress(),
    outlines: loadOutlineProgress() ?? emptyProgress(),
    neighbors: loadNeighborProgress() ?? emptyNeighborProgress(),
  };
  const persistenceAvailable = persisting
    && mapStorageIsWritable()
    && outlineStorageIsWritable()
    && neighborStorageIsWritable();
  const summaries = buildScopeProgressSummaries(ledgers, AFRICA_SCOPE);
  const domain = selectedDomain(filter);
  const statusFilter = legacyStatusFilter(filter);
  const summary = summaries.find((item) => item.domain === domain) ?? summaries[0]!;

  const evidenceRows = summary.countryIds
    .map((countryId) => {
      const country = COUNTRY_BY_ID.get(countryId);
      if (!country) return null;
      const evidence = evidenceForCountry(ledgers, domain, countryId);
      const sourceStatus = evidence.sourceStatus;
      if (domain === 'flags' && statusFilter !== 'all' && sourceStatus !== statusFilter) return null;
      return { country, evidence };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((left, right) => {
      const order = { due: 0, learning: 1, unseen: 2, strong: 3 } as const;
      return order[left.evidence.status] - order[right.evidence.status]
        || left.country.regionId.localeCompare(right.country.regionId)
        || left.country.name.localeCompare(right.country.name);
    });

  const studiedCount = summaries.reduce((sum, item) => sum + item.learning + item.strong, 0);
  const hasHistory = studiedCount > 0;
  const grouped = new Map<string, typeof evidenceRows>();
  for (const row of evidenceRows) {
    const key = `${row.country.regionId}:${row.evidence.status}`;
    const rows = grouped.get(key) ?? [];
    rows.push(row);
    grouped.set(key, rows);
  }

  return `
    <main class="page ledger-page progress-page">
      <header class="topbar topbar--detail">
        <button class="icon-button" data-action="home" aria-label="Back to atlas">${icon('back')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" ${resetArmed ? '' : 'data-autofocus'}>Progress</h1>
          <span>Live learning evidence across four domains</span>
        </div>
      </header>

      ${!persistenceAvailable ? `
        <div class="progress-storage-state" role="status">
          <strong>Progress is temporary</strong>
          <span>This browser is blocking storage. Your current session still works, but new evidence may not survive after the tab closes.</span>
        </div>
      ` : ''}

      ${studiedCount === 0 ? `
        <div class="progress-first-use" role="status">
          <strong>No learning evidence yet</strong>
          <span>Start with any supported Africa domain. This screen will show what to practise next as evidence builds.</span>
        </div>
      ` : ''}

      <section class="progress-overview" aria-labelledby="progress-africa-heading">
        <div class="section-heading">
          <h2 id="progress-africa-heading">Africa</h2>
          <p>Choose the domain that needs attention. Country evidence remains separate from earned regional Mastery.</p>
        </div>
        <div class="ledger-list progress-domain-list">
          ${summaries.map((item) => renderDomainSummary(item, item.domain === domain)).join('')}
        </div>
        <p class="ledger-note">Outside Africa, Flags are available now. Locations, Outlines and Neighbours remain <strong>Coming soon</strong> and are not counted as zero progress or completion.</p>
      </section>

      <section class="progress-ledger" aria-labelledby="progress-ledger-heading">
        <div class="section-heading">
          <h2 id="progress-ledger-heading">${escapeHtml(summary.label)} evidence</h2>
          <p>${summary.supported ? `${summary.total} supported countries · ${summarySentence(summary)}` : 'This curriculum is not available yet.'}</p>
        </div>

        ${domain === 'flags' ? `
          <div class="filter-tabs" role="group" aria-label="Filter flag evidence">
            ${(['all', 'unseen', 'learning', 'mastered'] as const).map((item) => `
              <button class="filter-tab ${statusFilter === item ? 'filter-tab--active' : ''}" data-action="filter-progress" data-id="${item}" aria-pressed="${statusFilter === item}">
                <span>${item === 'all' ? 'All' : item === 'mastered' ? 'Strong evidence' : item[0]?.toUpperCase()}${item === 'all' || item === 'mastered' ? '' : item.slice(1)}</span>
              </button>
            `).join('')}
          </div>
        ` : ''}

        ${evidenceRows.length ? `
          <div class="ledger-list">
            ${[...grouped.entries()].map(([, rows]) => {
              const first = rows[0];
              if (!first) return '';
              const state = first.evidence.status;
              const regionLabel = first.country.regionId.split('-').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ');
              return `
                <div class="progress-evidence-group">
                  <h3>${escapeHtml(regionLabel)} · ${EVIDENCE_LABELS[state]}</h3>
                  ${rows.map(({ country, evidence }) => {
                    const record = domain === 'flags' ? getRecord(progress, country.id) : null;
                    const legacyGoalMarker = record?.status === 'learning'
                      ? `<!-- ${record.masteryStreak}/${masteryGoal(record)} toward mastery -->`
                      : '';
                    return `
                      <div class="ledger-row">
                        <span class="ledger-row__country"><strong>${escapeHtml(country.name)}</strong><small>${EVIDENCE_LABELS[evidence.status]}</small></span>
                        <span class="status-chip status-chip--${evidence.sourceStatus}">${EVIDENCE_LABELS[evidence.status]}</span>
                        ${legacyGoalMarker}
                      </div>
                    `;
                  }).join('')}
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <strong>${statusFilter === 'all' ? `No ${escapeHtml(summary.label.toLowerCase())} evidence yet` : 'No countries in this evidence state'}</strong>
            <span>${statusFilter === 'all' ? 'Start from the Africa atlas to build learning evidence.' : 'Try another evidence filter or continue practising.'}</span>
          </div>
        `}
      </section>

      ${hasHistory ? `
        <div class="ledger-footer">
          ${resetArmed ? `
            <p role="alert">Erase all learning evidence across Flags, Locations, Outlines and Neighbours? This cannot be undone. Issue #34 earned achievements are not implemented yet, so there is no separate achievement state to erase.</p>
            <button class="button button--danger" data-action="reset-confirm">Erase everything</button>
            <button class="button button--tertiary" data-action="reset-cancel" data-autofocus>Keep my progress</button>
          ` : `
            <p>${persistenceAvailable
              ? 'Your four learning ledgers are stored on this device only.'
              : 'Storage is blocked, so new evidence may only last for this tab.'}</p>
            <button class="button button--tertiary" data-action="reset-request">Reset all progress</button>
          `}
        </div>
      ` : ''}
    </main>
  `;
}
