import { COUNTRY_BY_ID } from '../../data/countries.js';
import { CONTINENTS, REGIONS } from '../../data/continents.js';
import {
  getContinentAchievementReadModel,
  getRegionAchievementReadModel,
  getWorldAchievementReadModel,
  type EarnedAchievementState,
} from '../../domain/achievements.js';
import type { LearningDomain, StudyScope } from '../../domain/models.js';
import {
  buildScopeProgressSummaries,
  evidenceForCountry,
  type ProgressLedgers,
  type ProgressSummary,
} from '../../domain/progress-summary.js';
import { countryIdsForSupportedScope } from '../../domain/scope-support.js';
import { continentAchievementMark, worldCrownIcon } from '../components/achievement-art.js';
import { domainIcon, icon } from '../components/icons.js';
import { escapeHtml } from '../format.js';

const AFRICA_SCOPE: StudyScope = { kind: 'continent', id: 'africa', label: 'Africa' };
const DOMAIN_IDS: readonly LearningDomain[] = ['flags', 'locations', 'outlines', 'neighbors'];
const DOMAIN_LABELS: Record<LearningDomain, string> = {
  flags: 'Flags',
  locations: 'Locations',
  outlines: 'Outlines',
  neighbors: 'Neighbours',
};

type EvidenceFilter = 'all' | 'due' | 'learning' | 'unseen' | 'strong';

const EVIDENCE_LABELS = {
  unseen: 'Unseen',
  learning: 'Learning',
  strong: 'Strong evidence',
  due: 'Due for review',
} as const;

const FILTER_LABELS: Record<EvidenceFilter, string> = {
  all: 'All',
  due: 'Due',
  learning: 'Learning',
  unseen: 'Unseen',
  strong: 'Strong',
};

function selectedDomain(filter: string): LearningDomain {
  if (filter.startsWith('domain:')) {
    const [value] = filter.slice('domain:'.length).split('|');
    if (value && (DOMAIN_IDS as readonly string[]).includes(value)) return value as LearningDomain;
  }
  return 'flags';
}

function selectedEvidenceFilter(filter: string): EvidenceFilter {
  const candidate = filter.includes('|') ? filter.split('|')[1] : filter;
  if (candidate === 'mastered' || candidate === 'strong') return 'strong';
  if (candidate === 'due' || candidate === 'learning' || candidate === 'unseen') return candidate;
  return 'all';
}

function evidenceFilterId(domain: LearningDomain, filter: EvidenceFilter): string {
  return filter === 'all' ? `domain:${domain}` : `domain:${domain}|${filter}`;
}

function summarySentence(summary: ProgressSummary): string {
  if (!summary.supported) return 'Coming soon';
  const parts: string[] = [];
  if (summary.due) parts.push(`${summary.due} due`);
  if (summary.learning) parts.push(`${summary.learning} learning`);
  if (summary.unseen) parts.push(`${summary.unseen} unseen`);
  if (summary.strong) parts.push(`${summary.strong} strong`);
  return parts.length ? parts.join(' · ') : 'Ready to practise';
}

function actionLabel(summary: ProgressSummary): string {
  if (summary.action === 'review') return 'Review';
  if (summary.action === 'learn') return 'Learn';
  return 'Play';
}

function renderPracticeRow(summary: ProgressSummary, selected: boolean): string {
  if (!summary.supported) {
    return `
      <div class="progress-practice-row progress-practice-row--unavailable" aria-label="${escapeHtml(summary.label)}, coming soon">
        <span class="progress-practice-row__icon">${domainIcon(summary.domain)}</span>
        <span class="progress-practice-row__select">
          <strong>${escapeHtml(summary.label)}</strong>
          <small>Coming soon</small>
        </span>
      </div>
    `;
  }

  const action = summary.action === 'play' ? 'quick-play' : 'open-scope';
  const label = actionLabel(summary);
  return `
    <div class="progress-practice-row ${selected ? 'progress-practice-row--selected' : ''}">
      <span class="progress-practice-row__icon">${domainIcon(summary.domain)}</span>
      <button class="progress-practice-row__select" data-action="filter-progress" data-id="domain:${summary.domain}" aria-pressed="${selected}">
        <strong>${escapeHtml(summary.label)}</strong>
        <small>${summarySentence(summary)}</small>
      </button>
      <button class="button button--tertiary progress-practice-row__action" data-action="${action}" data-domain="${summary.domain}" data-id="africa" aria-label="${summary.action === 'play' ? label : `Open ${label.toLowerCase()} options for`} ${escapeHtml(summary.scope.label)} ${escapeHtml(summary.label.toLowerCase())}">${label}</button>
    </div>
  `;
}

function regionCountryCount(regionId: string, regionName: string): number {
  const scope: StudyScope = { kind: 'region', id: regionId, label: regionName };
  return countryIdsForSupportedScope(scope, 'flags').length;
}

function renderMasteryBadge(
  domain: LearningDomain,
  supported: boolean,
  earned: boolean,
): string {
  const label = DOMAIN_LABELS[domain];
  const state = !supported ? 'Coming soon' : earned ? 'Mastery earned' : 'Available, not yet earned';
  const stateClass = !supported ? 'unavailable' : earned ? 'earned' : 'unearned';
  return `
    <span class="progress-mastery-badge progress-mastery-badge--${stateClass}" role="img" aria-label="${escapeHtml(label)}: ${state}" title="${escapeHtml(label)} — ${state}">
      ${domainIcon(domain)}
      ${earned ? `<span class="progress-mastery-badge__check">${icon('check')}</span>` : ''}
    </span>
  `;
}

function renderRegionMastery(achievements: EarnedAchievementState, regionId: string): string {
  const region = REGIONS.find((item) => item.id === regionId);
  const model = getRegionAchievementReadModel(achievements, regionId);
  if (!region || !model) return '';

  const countryCount = regionCountryCount(region.id, region.name);
  const supportedCount = model.supportedDomains.length;
  const detail = model.complete
    ? `${countryCount} countries · Complete region`
    : model.completeCurriculum
      ? `${countryCount} countries`
      : `${countryCount} countries · ${supportedCount === 1 ? 'Flags available' : `${supportedCount} domains available`}`;

  return `
    <div class="progress-region-mastery ${model.complete ? 'progress-region-mastery--complete' : ''}" aria-label="${escapeHtml(region.name)}${model.complete ? ', complete region' : ''}">
      <span class="progress-region-mastery__identity">
        <strong>${escapeHtml(region.name)}</strong>
        <small>${escapeHtml(detail)}</small>
      </span>
      <span class="progress-region-mastery__domains" aria-label="${escapeHtml(region.name)} domain mastery">
        ${DOMAIN_IDS.map((domain) => renderMasteryBadge(
          domain,
          model.supportedDomains.includes(domain),
          model.domainMastery[domain],
        )).join('')}
      </span>
    </div>
  `;
}

function renderContinentMastery(achievements: EarnedAchievementState, continentId: (typeof CONTINENTS)[number]['id']): string {
  const continent = CONTINENTS.find((item) => item.id === continentId);
  const model = getContinentAchievementReadModel(achievements, continentId);
  if (!continent || !model) return '';

  const regions = REGIONS.filter((region) => region.continentId === continentId);
  const status = model.crestEarned
    ? 'Continent complete · Crest earned'
    : model.completeCurriculum
      ? 'All four domains available'
      : 'Flags available · more domains coming';

  return `
    <details class="progress-continent ${model.crestEarned ? 'progress-continent--complete' : ''}" ${continentId === 'africa' ? 'open' : ''}>
      <summary class="progress-continent__summary">
        ${continentAchievementMark(continentId, model.crestEarned)}
        <span class="progress-continent__identity">
          <strong>${escapeHtml(continent.name)}</strong>
          <small>${escapeHtml(status)}</small>
        </span>
        <span class="progress-continent__chevron">${icon('chevron')}</span>
      </summary>
      <div class="progress-continent__regions">
        ${regions.map((region) => renderRegionMastery(achievements, region.id)).join('')}
      </div>
    </details>
  `;
}

function renderMastery(achievements: EarnedAchievementState): string {
  const world = getWorldAchievementReadModel(achievements);
  return `
    <section class="progress-mastery" aria-labelledby="progress-mastery-heading">
      <div class="progress-section-heading">
        <h2 id="progress-mastery-heading">Mastery</h2>
        <p>Earned region by region across the four Atlas domains.</p>
      </div>
      <div class="progress-continent-list">
        ${CONTINENTS.map((continent) => renderContinentMastery(achievements, continent.id)).join('')}
      </div>
      <div class="progress-world-status ${world.crownEarned ? 'progress-world-status--earned' : ''}" aria-label="World ${world.crownEarned ? 'complete, Crown earned' : 'curriculum still expanding'}">
        <span class="progress-world-status__identity">
          <strong>World</strong>
          <small>${world.crownEarned ? 'World complete' : 'Global curriculum expanding'}</small>
        </span>
        ${world.crownEarned ? worldCrownIcon() : ''}
      </div>
    </section>
  `;
}

export function renderProgress(
  ledgers: ProgressLedgers,
  achievements: EarnedAchievementState,
  filter: string = 'all',
  resetArmed = false,
  persisting = true,
): string {
  const persistenceAvailable = persisting;
  const summaries = buildScopeProgressSummaries(ledgers, AFRICA_SCOPE);
  const domain = selectedDomain(filter);
  const evidenceFilter = selectedEvidenceFilter(filter);
  const summary = summaries.find((item) => item.domain === domain) ?? summaries[0]!;
  const evidenceOpen = filter !== 'all';

  const evidenceRows = summary.countryIds
    .map((countryId) => {
      const country = COUNTRY_BY_ID.get(countryId);
      if (!country) return null;
      const evidence = evidenceForCountry(ledgers, domain, countryId);
      if (evidenceFilter !== 'all' && evidence.status !== evidenceFilter) return null;
      return { country, evidence };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((left, right) => {
      const order = { due: 0, learning: 1, unseen: 2, strong: 3 } as const;
      return order[left.evidence.status] - order[right.evidence.status]
        || left.country.regionId.localeCompare(right.country.regionId)
        || left.country.name.localeCompare(right.country.name);
    });

  const studiedCount = summaries.reduce((sum, item) => sum + item.learning + item.strong + item.due, 0);
  const hasAchievements = achievements.regionDomainMasteries.length > 0
    || achievements.completeRegions.length > 0
    || achievements.completeContinents.length > 0
    || achievements.worldCrown;
  const hasHistory = studiedCount > 0 || hasAchievements;
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
          <span>Build mastery region by region.</span>
        </div>
      </header>

      ${!persistenceAvailable ? `
        <div class="progress-storage-state" role="status">
          <strong>Progress is temporary</strong>
          <span>This browser is not allowing storage, so progress is temporary.</span>
        </div>
      ` : ''}

      ${studiedCount === 0 && !hasAchievements ? `
        <div class="progress-first-use" role="status">
          <strong>Your Atlas starts here</strong>
          <span>Not practised yet. Practise any Africa domain to begin building regional mastery.</span>
        </div>
      ` : ''}

      ${renderMastery(achievements)}

      <section class="progress-practice" aria-labelledby="progress-practice-heading">
        <div class="progress-section-heading">
          <h2 id="progress-practice-heading">Practise next</h2>
          <p>Live learning evidence points to the next useful session in Africa.</p>
        </div>
        <div class="progress-practice-list">
          ${summaries.map((item) => renderPracticeRow(item, item.domain === domain)).join('')}
        </div>
      </section>

      <details class="progress-evidence-disclosure" ${evidenceOpen ? 'open' : ''}>
        <summary>
          <span class="progress-evidence-disclosure__identity">
            <strong>Learning evidence</strong>
            <small>${escapeHtml(summary.label)} · ${summary.total} supported countries</small>
          </span>
          <span class="progress-evidence-disclosure__chevron">${icon('chevron')}</span>
        </summary>
        <div class="progress-evidence-disclosure__body">
          <p class="ledger-note">${summarySentence(summary)}</p>
          <div class="progress-evidence-toolbar" role="group" aria-label="Filter ${escapeHtml(summary.label.toLowerCase())} evidence">
            ${(Object.keys(FILTER_LABELS) as EvidenceFilter[]).map((item) => `
              <button class="filter-tab ${evidenceFilter === item ? 'filter-tab--active' : ''}" data-action="filter-progress" data-id="${evidenceFilterId(domain, item)}" aria-pressed="${evidenceFilter === item}">
                ${FILTER_LABELS[item]}
              </button>
            `).join('')}
          </div>

          ${evidenceRows.length ? `
            <div class="ledger-list">
              ${[...grouped.entries()].map(([, rows]) => {
                const first = rows[0];
                if (!first) return '';
                const state = first.evidence.status;
                const region = REGIONS.find((item) => item.id === first.country.regionId);
                const regionLabel = region?.name ?? first.country.regionId;
                return `
                  <div class="progress-evidence-group">
                    <h3>${escapeHtml(regionLabel)} · ${EVIDENCE_LABELS[state]}</h3>
                    ${rows.map(({ country, evidence }) => `
                      <div class="ledger-row">
                        <span class="ledger-row__country"><strong>${escapeHtml(country.name)}</strong><small>${EVIDENCE_LABELS[evidence.status]}</small></span>
                        <span class="status-chip status-chip--${evidence.status}">${EVIDENCE_LABELS[evidence.status]}</span>
                      </div>
                    `).join('')}
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <strong>${evidenceFilter === 'all' ? `No ${escapeHtml(summary.label.toLowerCase())} evidence yet` : 'No countries in this evidence state'}</strong>
              <span>${evidenceFilter === 'all' ? 'Start a supported Africa session to build learning evidence.' : 'Try another evidence filter or continue practising.'}</span>
            </div>
          `}
        </div>
      </details>

      ${hasHistory ? `
        <div class="ledger-footer">
          ${resetArmed ? `
            <p role="alert">Erase all learning evidence and earned achievements across Flags, Locations, Outlines and Neighbours? This cannot be undone.</p>
            <button class="button button--danger" data-action="reset-confirm">Erase everything</button>
            <button class="button button--tertiary" data-action="reset-cancel" data-autofocus>Keep my progress</button>
          ` : `
            <p>${persistenceAvailable
              ? 'Your learning evidence and earned achievements are stored on this device.'
              : 'New evidence may only last until you close the tab.'}</p>
            <button class="button button--tertiary" data-action="reset-request">Reset all progress</button>
          `}
        </div>
      ` : ''}
    </main>
  `;
}
